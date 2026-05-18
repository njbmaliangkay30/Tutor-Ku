import { AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { supabase } from "../lib/supabase";

export function UnverifiedTutorView() {
  return (
    <div className="w-full relative h-full flex flex-col items-center justify-center p-4">
      <div className="bg-bg-2 border border-border shadow-sh1 rounded-2xl p-8 max-w-md w-full text-center flex flex-col items-center animate-slideUp">
        <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={32} className="text-warning" />
        </div>
        
        <h2 className="font-display font-black text-2xl mb-3 text-text-main">
          Akses Terkunci
        </h2>
        
        <p className="text-text-sub text-[14px] leading-relaxed mb-6">
          Halaman ini hanya dapat diakses oleh tutor yang telah lulus verifikasi.
        </p>

        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-xl p-4 flex gap-3 text-left mb-6 w-full">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-[13px]">
            <strong className="font-bold block mb-1">Verifikasi Diperlukan</strong>
            Silakan ajukan verifikasi terlebih dahulu atau periksa status verifikasi Anda melalui halaman <b>Dasbor</b>.
          </div>
        </div>

        <button 
          onClick={() => window.location.href = "mailto:support@tutorku.com"}
          className="bg-bg-base border border-border hover:bg-bg-3 font-bold px-6 py-3 rounded-xl transition-colors text-text-main text-[14px] w-full mb-3"
        >
          Hubungi Bantuan
        </button>

        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}
          className="text-text-sub hover:text-text-main text-[13px] font-bold underline underline-offset-4"
        >
          Keluar dari Akun
        </button>
      </div>
    </div>
  );
}
