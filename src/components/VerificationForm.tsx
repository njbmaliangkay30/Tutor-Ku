import React, { useState, useEffect } from "react";
import { Upload, CheckCircle, Clock } from "lucide-react";
import { useAppContext } from "../AppContext";
import { supabase } from "../lib/supabase";

export function VerificationForm() {
  const { userProfile, user } = useAppContext();
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ktpFileName, setKtpFileName] = useState("");
  const [ijazahFileName, setIjazahFileName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if previously submitted
    if (user) {
      const status = localStorage.getItem(`verification_status_${user.id}`);
      if (status === 'submitted') {
        setIsSubmitted(true);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const ktpInput = form.elements.namedItem('attachment_ktp') as HTMLInputElement;
    const ijazahInput = form.elements.namedItem('attachment_ijazah') as HTMLInputElement;
    const pengalamanInput = form.elements.namedItem('pengalaman_mengajar') as HTMLTextAreaElement;

    const ktpFile = ktpInput?.files?.[0];
    const ijazahFile = ijazahInput?.files?.[0];
    const pengalaman = pengalamanInput?.value || "";

    if (!ktpFile || !ijazahFile || !user) {
        alert("Mohon lengkapi dokumen yang diwajibkan.");
        setIsSubmitting(false);
        return;
    }

    try {
      const ktpPath = `ktp_${user.id}_${Date.now()}_${ktpFile.name}`;
      const { error: ktpError } = await supabase.storage
        .from('Data Verifikasi Tutor')
        .upload(ktpPath, ktpFile);

      if (ktpError) throw new Error("Gagal mengunggah KTP: " + ktpError.message);

      const ijazahPath = `ijazah_${user.id}_${Date.now()}_${ijazahFile.name}`;
      const { error: ijazahError } = await supabase.storage
        .from('Data Verifikasi Tutor')
        .upload(ijazahPath, ijazahFile);

      if (ijazahError) throw new Error("Gagal mengunggah Ijazah: " + ijazahError.message);

      const ktpUrlRes = supabase.storage.from('Data Verifikasi Tutor').getPublicUrl(ktpPath);
      const ijazahUrlRes = supabase.storage.from('Data Verifikasi Tutor').getPublicUrl(ijazahPath);

      // Pastikan tutor profile exist 
      await supabase.from('profiles').upsert({ id: user.id, full_name: userProfile?.full_name || 'Tutor', role: 'tutor' }, { onConflict: 'id' }).select();
      await supabase.from('tutor_profiles').upsert({ id: user.id }, { onConflict: 'id' }).select();

      const { error: dbError } = await supabase
        .from('tutor_verifications')
        .insert({
          tutor_id: user.id,
          ktp_url: ktpUrlRes.data.publicUrl,
          ijazah_url: ijazahUrlRes.data.publicUrl,
          pengalaman_mengajar: pengalaman,
          status: 'pending'
        });

      if (dbError) throw new Error("Gagal menyimpan data verifikasi: " + dbError.message);

      localStorage.setItem(`verification_status_${user.id}`, 'submitted');
      setIsSubmitted(true);
      
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Gagal mengirim dokumen. Periksa koneksi internet Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full relative h-[70vh] flex flex-col items-center justify-center p-4 animate-pgIn">
        <div className="bg-bg-2 border border-border shadow-sh1 rounded-2xl p-8 max-w-lg w-full text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-lime/10 rounded-full flex items-center justify-center mb-6">
            <Clock size={40} className="text-lime" />
          </div>
          
          <h2 className="font-display font-black text-2xl mb-3 text-text-main">
            Menunggu Persetujuan
          </h2>
          
          <p className="text-text-sub text-[14px] leading-relaxed mb-6">
            Terima kasih telah mengajukan verifikasi profil Tutor. Tim kami saat ini sedang mereview dokumen yang Anda unggah. Proses ini akan memakan waktu 1-2 hari kerja.
          </p>

          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-xl p-4 flex gap-3 text-left w-full">
            <CheckCircle size={20} className="shrink-0 mt-0.5 text-blue-500" />
            <div className="text-[13px] text-blue-600">
              <strong className="font-bold block mb-1">Pengajuan Berhasil</strong>
              Kami akan menghubungi Anda jika ada informasi tambahan yang diperlukan melalui Email.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative min-h-[70vh] flex flex-col items-center py-10 px-4 animate-pgIn">
      <div className="max-w-[700px] w-full mt-4">
        <h2 className="font-display font-black text-3xl mb-2 text-text-main">
          Verifikasi Profil Tutor
        </h2>
        <p className="text-text-sub text-[15px] mb-8">
          Untuk mulai mengajar dan dilihat oleh siswa di TutorKu, kami perlu memverifikasi identitas dan kualifikasi Anda.
        </p>

        <form 
          onSubmit={handleSubmit}
          className="bg-bg-2 border border-border shadow-sm rounded-2xl p-6 md:p-8 flex flex-col gap-6"
        >
          <div>
            <h3 className="font-bold text-lg mb-4 text-text-main">1. Dokumen Identitas</h3>
            <div className="flex flex-col gap-2 relative">
              <label className="text-[13px] font-bold text-text-sub" htmlFor="ktp-upload">Kartu Tanda Penduduk (KTP/KTM) *</label>
              
              <input 
                type="file" 
                name="attachment_ktp" 
                id="ktp-upload" 
                className="hidden" 
                accept="image/png, image/jpeg, application/pdf"
                required
                onChange={(e) => setKtpFileName(e.target.files?.[0]?.name || "")}
              />
              <label 
                htmlFor="ktp-upload" 
                className="border border-dashed border-border-2 rounded-xl p-6 text-center hover:bg-bg-3 transition-colors cursor-pointer group flex flex-col items-center"
              >
                {ktpFileName ? (
                  <>
                    <CheckCircle size={24} className="mx-auto mb-2 text-lime transition-colors" />
                    <p className="text-[13px] text-text-main font-bold">{ktpFileName}</p>
                    <p className="text-[11px] text-text-sub mt-1">Klik untuk mengubah file</p>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="mx-auto mb-2 text-text-disabled group-hover:text-lime transition-colors" />
                    <p className="text-[13px] text-text-sub">Klik untuk memilih file KTP/KTM</p>
                    <p className="text-[11px] text-text-disabled mt-1">PNG, JPG, PDF (Max. 5MB)</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <hr className="border-border border-b-0 my-2" />

          <div>
            <h3 className="font-bold text-lg mb-4 text-text-main">2. Kualifikasi Pendidikan</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-text-sub" htmlFor="ijazah-upload">Ijazah / Transkrip Nilai Terakhir *</label>
                <input 
                  type="file" 
                  name="attachment_ijazah" 
                  id="ijazah-upload" 
                  className="hidden" 
                  accept="image/png, image/jpeg, application/pdf"
                  required
                  onChange={(e) => setIjazahFileName(e.target.files?.[0]?.name || "")}
                />
                <label 
                  htmlFor="ijazah-upload"
                  className="border border-dashed border-border-2 rounded-xl p-6 text-center hover:bg-bg-3 transition-colors cursor-pointer group flex flex-col items-center"
                >
                  {ijazahFileName ? (
                    <>
                      <CheckCircle size={24} className="mx-auto mb-2 text-lime transition-colors" />
                      <p className="text-[13px] text-text-main font-bold">{ijazahFileName}</p>
                      <p className="text-[11px] text-text-sub mt-1">Klik untuk mengubah file</p>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="mx-auto mb-2 text-text-disabled group-hover:text-lime transition-colors" />
                      <p className="text-[13px] text-text-sub">Klik untuk memilih file Transkrip/Ijazah</p>
                      <p className="text-[11px] text-text-disabled mt-1">PDF, PNG, JPG (Max. 5MB)</p>
                    </>
                  )}
                </label>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="text-[13px] font-bold text-text-sub" htmlFor="pengalaman">Ceritakan Pengalaman Mengajar Anda (Opsional)</label>
                <textarea 
                  id="pengalaman"
                  name="pengalaman_mengajar"
                  rows={4}
                  className="w-full bg-bg-base border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime"
                  placeholder="Ceritakan pengalaman mengajar, pencapaian, dsb..."
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col md:flex-row justify-end gap-3 items-center">
            <span className="text-[12px] text-text-sub text-center md:text-left">File akan dikirimkan dengan aman ke tim verifikasi.</span>
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`font-bold px-8 py-3 rounded-xl transition-colors w-full md:w-auto ${
                isSubmitting ? "bg-bg-3 cursor-not-allowed text-text-sub" : "bg-primary hover:bg-primary-bright text-white"
              }`}
            >
              {isSubmitting ? "Mengirim..." : "Kirim Dokumen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
