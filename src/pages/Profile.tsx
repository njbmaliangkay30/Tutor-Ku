import {
  LogOut,
  User as UserIcon,
  Mail,
  Settings,
  Shield,
  BookOpen,
  CreditCard,
  Package,
  X,
  Camera,
  Save,
  Loader2,
} from "lucide-react";
import { useAppContext } from "../AppContext";
import { supabase } from "../lib/supabase";
import { useState } from "react";

export function Profile() {
  const { userRole, setUserRole, setActiveTab, user, userProfile } =
    useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.full_name || user?.user_metadata?.full_name || "");
  const [bio, setBio] = useState(userProfile?.bio || "");
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole("guest");
    setActiveTab("home");
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setErrorMsg("");

    try {
      const updates = {
        id: user.id,
        full_name: fullName,
        phone: phoneNumber || null,
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      
      // Update bio if it's a tutor
      if (userRole === "tutor") {
        const { error: tutorError } = await supabase.from('tutor_profiles').upsert({
          id: user.id,
          bio: bio || null,
        });
        if (tutorError) throw tutorError;
      }
      
      window.location.reload();
      
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan profil");
      setIsSaving(false);
    }
  };

  if (userRole === "guest") return null;

  const isTutor = userRole === "tutor";
  
  const displayFullName = userProfile?.full_name || user?.user_metadata?.full_name || "User";
  const initials = displayFullName.substring(0, 2).toUpperCase();
  const email = user?.email || "email@example.com";
  const avatarUrl = userProfile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <div className="w-full relative h-full animate-pgIn flex flex-col items-center">
      <div className="w-full max-w-[600px] px-4 py-8 md:py-10 relative z-10 flex flex-col">
        {/* Header Profile */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="relative group">
            {avatarUrl ? (
              <img 
                 src={avatarUrl} 
                 alt={displayFullName}
                 className="w-[80px] h-[80px] rounded-full border-[3px] border-lime/30 shadow-[0_0_15px_rgba(200,255,0,0.15)] mb-4 object-cover"
                 referrerPolicy="no-referrer"
               />
            ) : (
              <div className="w-[80px] h-[80px] rounded-full bg-[#1A3A28] border-[3px] border-lime/30 text-lime flex items-center justify-center text-[32px] font-bold font-display leading-none shadow-[0_0_15px_rgba(200,255,0,0.15)] mb-4">
                {initials}
              </div>
            )}
             <button className="absolute bottom-4 right-0 w-8 h-8 bg-bg-2 border border-border rounded-full flex items-center justify-center text-text-main shadow-md hover:border-lime transition-all">
                <Camera size={14} />
             </button>
          </div>
          
          <div className="font-display text-[24px] font-extrabold text-text-main mb-1 text-center">
            {displayFullName}
          </div>
          <div className="text-[13px] text-text-sub font-mono mb-2">
            {email}
          </div>
          <div className="bg-lime-mid border border-lime-dim text-lime text-[10px] font-bold px-3 py-1 rounded-full font-mono uppercase tracking-wider mb-4">
            {isTutor ? "Tutor" : (userRole === "admin" ? "Admin" : "Siswa")}
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-1.5 rounded-lg border border-border-2 bg-bg-2 hover:border-lime text-[13px] font-bold transition-all text-text-main"
          >
            Edit Profil
          </button>
        </div>

        {/* Menu List */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="bg-card border-[1.5px] border-border/60 rounded-xl overflow-hidden shadow-sm">
            <div 
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors border-b border-border/60"
              onClick={() => setIsEditing(true)}
            >
              <UserIcon className="text-text-sub" size={20} />
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
                <UserIcon className="text-text-sub" size={20} />
                <div
                  className="flex-1 text-left"
                  onClick={() => setIsEditing(true)}
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

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pgIn">
           <div className="bg-bg-base border border-border shadow-2xl rounded-2xl w-full max-w-[500px] flex flex-col max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-display font-bold text-lg">Edit Profil</h3>
                <button onClick={() => setIsEditing(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-2 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5">
                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-[13px]">
                    {errorMsg}
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-bg-2 border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Nomor HP / WhatsApp</label>
                  <input 
                    type="text" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-bg-2 border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
                    placeholder="Contoh: 081234567890"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Tentang Saya {isTutor ? "(Pengalaman mengajar)" : ""}</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full bg-bg-2 border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all resize-none"
                    placeholder="Ceritakan sedikit tentang diri Anda..."
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-3 bg-bg-2/50">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-lg border border-border bg-bg-3 font-bold text-[13px] hover:bg-bg-2 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || !fullName.trim()}
                  className="px-6 py-2.5 rounded-lg bg-lime hover:bg-lime-hover text-black font-bold text-[13px] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
