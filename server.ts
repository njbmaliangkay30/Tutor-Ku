import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { Resend } from "resend";
import dotenv from "dotenv";
import fs from "fs";
import webpush from "web-push";

import { createClient } from "@supabase/supabase-js";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || 're_123'); // Polyfill for safe initialization
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://xyz.supabase.co"; // dummy for safe init
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy_key";
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize VAPID Keys for Web Push
const VAPID_KEYS_FILE = path.join(process.cwd(), "vapid_keys.json");
let vapidPublicKey = "";
let vapidPrivateKey = "";

if (fs.existsSync(VAPID_KEYS_FILE)) {
  try {
    const keys = JSON.parse(fs.readFileSync(VAPID_KEYS_FILE, "utf-8"));
    vapidPublicKey = keys.publicKey;
    vapidPrivateKey = keys.privateKey;
  } catch (e) {
    console.error("Gagal membaca file vapid_keys.json", e);
  }
}

if (!vapidPublicKey || !vapidPrivateKey) {
  const keys = webpush.generateVAPIDKeys();
  vapidPublicKey = keys.publicKey;
  vapidPrivateKey = keys.privateKey;
  try {
    fs.writeFileSync(VAPID_KEYS_FILE, JSON.stringify(keys, null, 2), "utf-8");
  } catch (e) {
    console.error("Gagal menyimpan file vapid_keys.json", e);
  }
}

webpush.setVapidDetails(
  "mailto:njbmaliangkay30@gmail.com",
  vapidPublicKey,
  vapidPrivateKey
);

const SUBS_FILE = path.join(process.cwd(), "push_subscriptions.json");

function getSubscriptions(): Record<string, any[]> {
  if (!fs.existsSync(SUBS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SUBS_FILE, "utf-8"));
  } catch (e) {
    return {};
  }
}

function saveSubscriptions(subs: Record<string, any[]>) {
  try {
    const dir = path.dirname(SUBS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2), "utf-8");
  } catch (e) {
    console.error("Gagal menyimpan file push_subscriptions.json", e);
  }
}

function addSubscription(userId: string, subscription: any) {
  const subs = getSubscriptions();
  if (!subs[userId]) {
    subs[userId] = [];
  }
  const existingIndex = subs[userId].findIndex((s: any) => s.endpoint === subscription.endpoint);
  if (existingIndex !== -1) {
    subs[userId][existingIndex] = subscription;
  } else {
    subs[userId].push(subscription);
  }
  saveSubscriptions(subs);
}

async function sendPushNotification(userId: string, payload: { title: string; body: string; url: string }) {
  const subs = getSubscriptions();
  const userSubs = subs[userId];
  if (!userSubs || userSubs.length === 0) return;

  const payloadString = JSON.stringify(payload);
  const validSubs: any[] = [];

  for (const sub of userSubs) {
    try {
      await webpush.sendNotification(sub, payloadString);
      validSubs.push(sub);
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log(`Menghapus subscription kedaluwarsa untuk pengguna ${userId}`);
      } else {
        console.error("Gagal mengirimkan notifikasi push:", err);
        validSubs.push(sub);
      }
    }
  }

  if (validSubs.length !== userSubs.length) {
    subs[userId] = validSubs;
    saveSubscriptions(subs);
  }
}

// Setup Realtime Database Listener for Web Push Notifications on Server Side
function setupRealtimePushNotifications() {
  // 1. Listen for new messages
  supabase
    .channel("server-messages-push")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      async (payload: any) => {
        const newMsg = payload.new;
        if (!newMsg || !newMsg.receiver_id) return;

        const receiverId = newMsg.receiver_id;
        const senderId = newMsg.sender_id;

        // Fetch sender name
        let senderName = "Seseorang";
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", senderId)
            .single();
          if (profile?.full_name) {
            senderName = profile.full_name;
          }
        } catch (e) {
          console.error("Gagal mengambil info pengirim:", e);
        }

        let bodyText = newMsg.content || "";
        if (bodyText.includes("[SESSION_ID:")) {
          bodyText = "Mengirim pengajuan bimbingan belajar baru.";
        }

        sendPushNotification(receiverId, {
          title: `Pesan baru dari ${senderName}`,
          body: bodyText,
          url: "/chat"
        });
      }
    )
    .subscribe();

  // 2. Listen for session updates or inserts
  supabase
    .channel("server-sessions-push")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sessions" },
      async (payload: any) => {
        const oldSession = payload.old;
        const newSession = payload.new;
        if (!newSession) return;

        const event = payload.eventType;

        if (event === "INSERT") {
          const tutorId = newSession.tutor_id;
          const studentId = newSession.student_id;

          let studentName = "Siswa";
          try {
            const { data: p } = await supabase.from("profiles").select("full_name").eq("id", studentId).single();
            if (p?.full_name) studentName = p.full_name;
          } catch (e) {}

          sendPushNotification(tutorId, {
            title: "Pengajuan Jadwal Baru",
            body: `${studentName} mengajukan bimbingan baru untuk mata kuliah ${newSession.subject || ''}.`,
            url: "/sessions"
          });
        }

        if (event === "UPDATE" && oldSession && newSession.status !== oldSession.status) {
          const studentId = newSession.student_id;

          if (newSession.status === "confirmed") {
            sendPushNotification(studentId, {
              title: "Pertemuan Dijadwalkan! 🎉",
              body: `Tutor menyetujui jadwal bimbingan pelajaran ${newSession.subject || ''}.`,
              url: "/sessions"
            });
          } else if (newSession.status === "cancelled") {
            sendPushNotification(studentId, {
              title: "Pengajuan Ditangguhkan",
              body: `Tutor menolak/membatalkan sesi pelajaran ${newSession.subject || ''}.`,
              url: "/sessions"
            });
          }
        }
      }
    )
    .subscribe();
}

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests (if needed)
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // PWA Web Push Public VAPID Key Endpoint
  app.get("/api/push/key", (req, res) => {
    res.json({ publicKey: vapidPublicKey });
  });

  // PWA Web Push Registration Endpoint
  app.post("/api/push/register", (req, res) => {
    const { user_id, subscription } = req.body;
    if (!user_id || !subscription) {
      return res.status(400).json({ error: "Kolom nama/subscriptions kosong" });
    }
    addSubscription(user_id, subscription);
    res.json({ success: true });
  });

  // Initialize server database subscription for background notifications
  try {
    setupRealtimePushNotifications();
    console.log("Notifikasi Realtime PWA Web Push berhasil dijalankan!");
  } catch (err) {
    console.error("Gagal menjalankan listener realtime web push:", err);
  }

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

startServer().catch(console.error);
