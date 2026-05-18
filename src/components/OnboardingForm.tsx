import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAppContext } from "../AppContext";
import { Loader2, ArrowRight } from "lucide-react";

export function OnboardingForm() {
  const { user, userProfile, userRole } = useAppContext();
  
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  useEffect(() => {
    if (userProfile) {
      if (userProfile.full_name) setFullName(userProfile.full_name);
      if (userProfile.phone) setPhoneNumber(userProfile.phone);
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Upsert profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        phone: phoneNumber,
      });

      if (profileError) throw profileError;

      // Upsert tutor profile if needed (bio)
      if (userRole === "tutor") {
        const { error: tutorError } = await supabase.from("tutor_profiles").upsert({
          id: user.id,
          bio: bio,
        });
        if (tutorError) throw tutorError;
      } else if (userRole === "student" || userRole === "siswa") {
        // Option to upsert student profile if needed
        const { error: studentError } = await supabase.from("student_profiles").upsert({
          id: user.id,
        });
        if (studentError) throw studentError;
      }
      
      // Force reload to get updated context without phone = null
      window.location.reload();
      
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base">
      <div className="bg-bg-2 border border-border shadow-2xl rounded-2xl w-full max-w-[500px] flex flex-col overflow-hidden animate-pgIn">
        <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <h2 className="font-display font-black text-2xl mb-2 text-text-main text-center">
            Lengkapi Profil Anda
          </h2>
          <p className="text-text-sub text-[13px] text-center mb-6">
            Satu langkah lagi sebelum Anda bisa menggunakan TutorKu.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-[13px] text-center">
                {errorMsg}
              </div>
            )}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">
                Nama Lengkap
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-bg-base border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">
                Nomor HP / WhatsApp
              </label>
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full bg-bg-base border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
                placeholder="Contoh: 081234567890"
              />
            </div>

            {userRole === "tutor" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">
                  Tentang Saya (Pengalaman & Keahlian)
                </label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  required
                  className="w-full bg-bg-base border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all resize-none"
                  placeholder="Ceritakan sedikit tentang pendidikan dan pengalaman mengajar Anda..."
                />
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading || !fullName.trim() || !phoneNumber.trim() || (userRole === "tutor" && !bio.trim())}
              className="mt-4 px-6 py-3.5 rounded-xl bg-lime hover:bg-lime-hover text-black font-bold text-[14px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  Lanjutkan <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
