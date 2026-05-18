import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { Resend } from "resend";
import dotenv from "dotenv";

import { createClient } from "@supabase/supabase-js";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests (if needed)
  app.use(express.json());

  // API Route to handle verify
  app.post("/api/verify", upload.fields([
    { name: 'attachment_ktp', maxCount: 1 },
    { name: 'attachment_ijazah', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { email_tutor, nama_tutor, bidang_mengajar, pengalaman_mengajar, _subject } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const ktpFile = files['attachment_ktp']?.[0];
      const ijazahFile = files['attachment_ijazah']?.[0];

      if (!ktpFile || !ijazahFile) {
        return res.status(400).json({ error: "Missing attachments" });
      }

      const timestamp = Date.now();
      const sanitizedName = nama_tutor ? nama_tutor.replace(/\s+/g, "_").toLowerCase() : "tutor";
      
      const ktpPath = `verifications/${sanitizedName}_ktp_${timestamp}_${ktpFile.originalname}`;
      const ijazahPath = `verifications/${sanitizedName}_ijazah_${timestamp}_${ijazahFile.originalname}`;

      // Upload to Supabase bucket 'Data Verifikasi Tutor'
      const { error: uploadKtpError } = await supabase.storage
        .from('Data Verifikasi Tutor')
        .upload(ktpPath, ktpFile.buffer, {
          contentType: ktpFile.mimetype,
          upsert: true
        });

      if (uploadKtpError) {
        console.error("Supabase KTP Upload Error:", uploadKtpError);
        return res.status(500).json({ error: "Gagal mengunggah KTP ke Supabase" });
      }

      const { error: uploadIjazahError } = await supabase.storage
        .from('Data Verifikasi Tutor')
        .upload(ijazahPath, ijazahFile.buffer, {
          contentType: ijazahFile.mimetype,
          upsert: true
        });

      if (uploadIjazahError) {
        console.error("Supabase Ijazah Upload Error:", uploadIjazahError);
        return res.status(500).json({ error: "Gagal mengunggah Ijazah ke Supabase" });
      }

      // Insert into tutor_verifications table
      const { tutor_id } = req.body;
      
      const { data: ktpPublicUrlData } = supabase.storage.from('Data Verifikasi Tutor').getPublicUrl(ktpPath);
      const { data: ijazahPublicUrlData } = supabase.storage.from('Data Verifikasi Tutor').getPublicUrl(ijazahPath);

      if (tutor_id) {
        // Ensure profiles and tutor_profiles exist to satisfy foreign key constraints
        const { error: baseProfileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: tutor_id, 
            full_name: nama_tutor || 'Tutor',
            role: 'tutor'
          }, { onConflict: 'id' });

        if (baseProfileError) {
          console.error("Base profile upsert error:", JSON.stringify(baseProfileError, null, 2));
        }

        const { error: profileError } = await supabase
          .from('tutor_profiles')
          .upsert({ id: tutor_id }, { onConflict: 'id' });
          
        if (profileError) {
          console.error("Tutor profile upsert error:", JSON.stringify(profileError, null, 2));
          // Continue execution, might fail below if it really didn't insert
        }

        const { error: dbError } = await supabase
          .from('tutor_verifications')
          .insert({
            tutor_id: tutor_id,
            ktp_url: ktpPublicUrlData.publicUrl,
            ijazah_url: ijazahPublicUrlData.publicUrl,
            bidang_mengajar: bidang_mengajar || '',
            pengalaman_mengajar: pengalaman_mengajar || '',
            status: 'pending'
          });

        if (dbError) {
          console.error("Database insert error:", JSON.stringify(dbError, null, 2));
          return res.status(500).json({ error: `Database insert error: ${dbError.message || JSON.stringify(dbError)}` });
        }
      }

      // Build attachments array for resend
      const attachments = [
        {
          filename: ktpFile.originalname,
          content: ktpFile.buffer,
        },
        {
          filename: ijazahFile.originalname,
          content: ijazahFile.buffer,
        }
      ];

      // Send email using Resend
      const data = await resend.emails.send({
        from: 'TutorKu <onboarding@resend.dev>', // Update this when you have a custom domain
        to: ['njbmaliangkay30@gmail.com'], // The admin who receives the email
        subject: _subject || `Pengajuan Verifikasi Tutor: ${nama_tutor}`,
        html: `
          <h2>Pengajuan Verifikasi Tutor Baru</h2>
          <p><strong>Nama:</strong> ${nama_tutor}</p>
          <p><strong>Email:</strong> ${email_tutor}</p>
          <p><strong>Bidang yang ingin diajarkan:</strong> ${bidang_mengajar}</p>
          <p><strong>Ringkasan Pengalaman:</strong> ${pengalaman_mengajar}</p>
          <p>Silakan periksa dokumen lampiran yang dikirimkan oleh tutor.</p>
        `,
        attachments: attachments,
      });

      if (data.error) {
        console.error("Resend error:", data.error);
        return res.status(500).json({ error: "Failed to send email" });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
