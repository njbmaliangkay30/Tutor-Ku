import {
  LogOut,
  User,
  Mail,
  Settings,
  Shield,
  BookOpen,
  CreditCard,
  Package,
} from "lucide-react";
import { useAppContext } from "../AppContext";

export function Profile() {
  const { userRole, setUserRole, setActiveTab } = useAppContext();

  const handleLogout = () => {
    setUserRole("guest");
    setActiveTab("home");
  };

  if (userRole === "guest") return null;

  const isTutor = userRole === "tutor";

  return (
    <div className="w-full relative h-full animate-pgIn flex flex-col items-center">
      <div className="w-full max-w-[600px] px-4 py-8 md:py-10 relative z-10 flex flex-col">
        {/* Header Profile */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-[80px] h-[80px] rounded-full bg-[#1A3A28] border-[3px] border-lime/30 text-lime flex items-center justify-center text-[32px] font-bold font-display leading-none shadow-[0_0_15px_rgba(200,255,0,0.15)] mb-4">
            AR
          </div>
          <div className="font-display text-[24px] font-extrabold text-text-main mb-1">
            Ahmad Rizki
          </div>
          <div className="text-[13px] text-text-sub font-mono mb-2">
            ahmad.rizki@email.com
          </div>
          <div className="bg-lime-mid border border-lime-dim text-lime text-[10px] font-bold px-3 py-1 rounded-full font-mono uppercase tracking-wider">
            {isTutor ? "Tutor Mahasiswa" : "Siswa SMA"}
          </div>
        </div>

        {/* Menu List */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="bg-card border-[1.5px] border-border/60 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors border-b border-border/60">
              <User className="text-text-sub" size={20} />
              <div className="flex-1">
                <div className="text-[14px] font-bold font-display">
                  Data Diri
                </div>
                <div className="text-[11px] text-text-sub">
                  Ubah foto, nama, dan detail pribadi
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors border-b border-border/60">
              <Mail className="text-text-sub" size={20} />
              <div className="flex-1">
                <div className="text-[14px] font-bold font-display">
                  Email & Sandi
                </div>
                <div className="text-[11px] text-text-sub">
                  Kelola keamanan akun
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors">
              <Shield className="text-text-sub" size={20} />
              <div className="flex-1">
                <div className="text-[14px] font-bold font-display">
                  Privasi
                </div>
                <div className="text-[11px] text-text-sub">
                  Atur visibilitas dan data
                </div>
              </div>
            </div>
          </div>

          {isTutor && (
            <div className="bg-card border-[1.5px] border-border/60 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-bg-2 p-3 border-b border-border/60">
                <div className="text-[12px] font-bold font-mono tracking-widest uppercase text-text-sub">
                  Profil Publik (Tutor)
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors border-b border-border/60">
                <User className="text-text-sub" size={20} />
                <div
                  className="flex-1 text-left"
                  onClick={() => alert("Fitur edit biodata belum tersedia")}
                >
                  <div className="text-[14px] font-bold font-display">
                    Biodata & Pengalaman
                  </div>
                  <div className="text-[11px] text-text-sub">
                    Ceritakan tentang diri Anda untuk menarik siswa
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors border-b border-border/60">
                <BookOpen className="text-text-sub" size={20} />
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <div className="text-[14px] font-bold font-display">
                      Mata Pelajaran
                    </div>
                    <div className="text-[11px] text-text-sub">
                      Pilih mapel yang Anda kuasai
                    </div>
                  </div>
                  <span className="bg-lime-mid text-lime text-[10px] font-bold px-2 py-0.5 rounded font-mono border border-lime-dim">
                    2 Mapel
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors border-b border-border/60">
                <CreditCard className="text-text-sub" size={20} />
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <div className="text-[14px] font-bold font-display">
                      Tarif per Sesi
                    </div>
                    <div className="text-[11px] text-text-sub">
                      Atur harga per jam mengajar
                    </div>
                  </div>
                  <span className="text-[12px] font-bold font-mono text-lime">
                    Rp 50k / jam
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors">
                <Package className="text-text-sub" size={20} />
                <div className="flex-1">
                  <div className="text-[14px] font-bold font-display">
                    Riwayat Penarikan Saldo
                  </div>
                  <div className="text-[11px] text-text-sub">
                    Earnings history & withdrawal
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isTutor && (
            <div className="bg-card border-[1.5px] border-border/60 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors border-b border-border/60">
                <BookOpen className="text-text-sub" size={20} />
                <div className="flex-1">
                  <div className="text-[14px] font-bold font-display">
                    Preferensi Belajar
                  </div>
                  <div className="text-[11px] text-text-sub">
                    Mata pelajaran favorit, gaya belajar
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors border-b border-border/60">
                <Package className="text-text-sub" size={20} />
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <div className="text-[14px] font-bold font-display">
                      Paket Aktif
                    </div>
                    <div className="text-[11px] text-text-sub">
                      Sisa kuota sesi belajar
                    </div>
                  </div>
                  <span className="bg-lime-mid text-lime text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    4 Sesi
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors">
                <CreditCard className="text-text-sub" size={20} />
                <div className="flex-1">
                  <div className="text-[14px] font-bold font-display">
                    Riwayat Pembayaran
                  </div>
                  <div className="text-[11px] text-text-sub">
                    Invoice dan riwayat top-up/beli paket
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full max-w-[200px] mx-auto flex items-center justify-center gap-2 px-[18px] py-[12px] rounded-lg border-[2px] border-red-500/30 bg-red-500/10 text-red-500 text-[13px] font-bold cursor-pointer transition-all font-display hover:border-red-500/50 hover:bg-red-500/20"
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </div>
  );
}
