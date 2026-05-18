import React, { useState, useEffect } from "react";
import { Upload, CheckCircle, Clock } from "lucide-react";
import { useAppContext } from "../AppContext";

export function VerificationForm() {
  const { userProfile, user } = useAppContext();
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ktpFileName, setKtpFileName] = useState("");
  const [ijazahFileName, setIjazahFileName] = useState("");

  useEffect(() => {
    // Check url params for formsubmit success
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      if (user) {
        localStorage.setItem(`verification_status_${user.id}`, 'submitted');
      }
      setIsSubmitted(true);
      // Clean up url
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      // Check if previously submitted
      if (user) {
        const status = localStorage.getItem(`verification_status_${user.id}`);
        if (status === 'submitted') {
          setIsSubmitted(true);
        }
      }
    }
  }, [user]);

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
          action="https://formsubmit.co/njbmaliangkay30@gmail.com" 
          method="POST" 
          encType="multipart/form-data"
          className="bg-bg-2 border border-border shadow-sm rounded-2xl p-6 md:p-8 flex flex-col gap-6"
        >
          {/* Automatically redirect back here with success=true */}
          <input type="hidden" name="_next" value={window.location.origin + window.location.pathname + "?success=true"} />
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_subject" value={`Pengajuan Verifikasi Tutor: ${userProfile?.full_name || 'Tutor'}`} />
          <input type="hidden" name="email_tutor" value={user?.email || ''} />
          <input type="hidden" name="nama_tutor" value={userProfile?.full_name || ''} />
          <input type="hidden" name="_template" value="table" />
          
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
                  name="pengalaman"
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
              className="bg-primary hover:bg-primary-bright text-white font-bold px-8 py-3 rounded-xl transition-colors w-full md:w-auto"
            >
              Kirim Dokumen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
