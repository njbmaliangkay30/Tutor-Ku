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
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "../hooks/useTranslation";

export function Profile() {
  const { userRole, setUserRole, setActiveTab, user, userProfile, tutorProfileData, setSelectedTutorId } =
    useAppContext();
    
  const { t, language, setLanguage } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.full_name || user?.user_metadata?.full_name || "");
  const [bio, setBio] = useState(tutorProfileData?.bio || "");
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phone || "");
  const [address, setAddress] = useState(tutorProfileData?.address || "");
  const [university, setUniversity] = useState(tutorProfileData?.university || "");
  const [schoolLevel, setSchoolLevel] = useState(userProfile?.school_level || "");
  const [gender, setGender] = useState(userProfile?.gender || tutorProfileData?.gender || "");
  const [birthDate, setBirthDate] = useState(userProfile?.birth_date || "");
  const [avatarObjUrl, setAvatarObjUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Packages management states
  const [myPackages, setMyPackages] = useState<any[]>([]);
  const [isFetchingPkgs, setIsFetchingPkgs] = useState(false);
  const [showPkgsModal, setShowPkgsModal] = useState(false);

  useEffect(() => {
    async function fetchMyPackages() {
      if (!userProfile || userRole === "tutor") return;
      setIsFetchingPkgs(true);
      try {
        const { data, error } = await supabase
          .from("student_packages")
          .select(`
            id,
            remaining_sessions,
            valid_until,
            status,
            tutor:tutor_profiles(
              id,
              name,
              university,
              major
            ),
            packages(
              name,
              session_count,
              description
            )
          `)
          .eq("student_id", userProfile.id)
          .gt("remaining_sessions", 0)
          .eq("status", "active")
          .order("valid_until", { ascending: true });

        if (error) throw error;
        setMyPackages(data || []);
      } catch (err) {
        console.error("Error loading student packages:", err);
      } finally {
        setIsFetchingPkgs(false);
      }
    }
    fetchMyPackages();
  }, [userProfile, userRole]);

  const [targetSubjects, setTargetSubjects] = useState<string[]>(tutorProfileData?.target_subjects || []);
  const [learningStyles, setLearningStyles] = useState<string[]>(tutorProfileData?.learning_styles || []);
  const [schedule, setSchedule] = useState<Record<number, string[]>>(
    tutorProfileData?.schedule && typeof tutorProfileData.schedule === 'object' 
    ? tutorProfileData.schedule as Record<number, string[]>
    : {}
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const toggleTargetSubject = (subject: string) => {
    setTargetSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
  };

  const toggleLearningStyle = (style: string) => {
    setLearningStyles(prev => prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]);
  };

  const toggleScheduleHour = (day: number, hour: string) => {
    setSchedule(prev => {
      const currentHours = prev[day] || [];
      const newHours = currentHours.includes(hour)
        ? currentHours.filter(h => h !== hour)
        : [...currentHours, hour].sort();
      const newSchedule = { ...prev };
      if (newHours.length > 0) {
        newSchedule[day] = newHours;
      } else {
        delete newSchedule[day];
      }
      return newSchedule;
    });
  };

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isEditing) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isEditing]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole("guest");
    setActiveTab("home");
  };

  const handleRestartTour = async () => {
    if (!user) return;
    try {
        localStorage.removeItem('tour_main_done');
        localStorage.removeItem('tour_booking_done');
        await supabase.auth.updateUser({
            data: {
                tour_main_completed: false,
                tour_booking_completed: false,
                tour_skipped: false
            }
        });
        window.location.reload();
    } catch (err) {
        console.error("Failed to reset tutorial", err);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setErrorMsg("");

    try {
      let finalAvatarUrl = userProfile?.avatar_url || user?.user_metadata?.avatar_url;

      if (avatarFile) {
        setIsUploadingAvatar(true);
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        finalAvatarUrl = publicUrl;
        setIsUploadingAvatar(false);
      }

      const updates: any = {
        id: user.id,
        full_name: fullName,
        phone: phoneNumber || null,
        gender: gender || null,
        birth_date: birthDate || null,
      };

      if (finalAvatarUrl) {
        updates.avatar_url = finalAvatarUrl;
      }

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      
      // Update bio and extra info if it's a tutor
      if (userRole === "tutor") {
        const availableDaysList = Object.keys(schedule).map(Number);
        const allHoursSet = new Set<string>();
        Object.values(schedule).forEach((hours: any) => {
          if (Array.isArray(hours)) {
            hours.forEach((h: string) => allHoursSet.add(h));
          }
        });
        const availableHoursList = Array.from(allHoursSet).sort();
        
        const { error: tutorError } = await supabase.from('tutor_profiles').upsert({
          id: user.id,
          bio: bio || null,
          address: address || null,
          university: university || null,
          target_subjects: targetSubjects,
          learning_styles: learningStyles,
          available_days: availableDaysList,
          available_hours: availableHoursList,
          schedule: schedule
        });
        if (tutorError) throw tutorError;
      } else {
        const { error: studentError } = await supabase.from('student_profiles').upsert({
          id: user.id,
          school_level: schoolLevel || null
        });
        if (studentError) throw studentError;
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
             <button 
               onClick={() => setIsEditing(true)}
               className="absolute bottom-4 right-0 w-8 h-8 bg-bg-2 border border-border rounded-full flex items-center justify-center text-text-main shadow-md hover:border-lime transition-all"
             >
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
                  {t('profile.personal_data')}
                </div>
                <div className="text-[11px] text-text-sub line-clamp-1">
                  Ubah foto, nama, gender, dan biodata pribadi
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 border-b border-border/60 bg-bg-2/30">
               <div className="p-4 border-r border-border/60">
                  <div className="text-[10px] text-text-sub font-mono uppercase tracking-wider mb-1">Gender</div>
                  <div className="text-sm font-bold text-text-main">{userProfile?.gender === 'L' ? 'Laki-laki' : (userProfile?.gender === 'P' ? 'Perempuan' : '-')}</div>
               </div>
               <div className="p-4">
                  <div className="text-[10px] text-text-sub font-mono uppercase tracking-wider mb-1">Tgl Lahir</div>
                  <div className="text-sm font-bold text-text-main">{userProfile?.birth_date ? new Date(userProfile.birth_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}</div>
               </div>
            </div>

            {!isTutor && userProfile?.school_level && (
              <div className="p-4 border-b border-border/60 bg-bg-2/10">
                <div className="text-[10px] text-text-sub font-mono uppercase tracking-wider mb-1">Jenjang Tingkat Sekolah</div>
                {(() => {
                   const level = userProfile.school_level;
                   return (
                   <div className="border border-border/60 bg-bg-2 px-3 py-1.5 rounded-md text-[13px] font-mono text-text-main font-medium tracking-wider flex items-center gap-2 w-fit mt-2">
                     <span className={`w-2 h-2 rounded-full shrink-0 ${
                        level === 'SD' ? 'bg-rose-400' : 
                        level === 'SMP' ? 'bg-sky-400' : 
                        level === 'SMA/SMK' ? 'bg-slate-400' : 'bg-text-sub'
                     }`}></span> {level}
                   </div>
                 )
                })()}
              </div>
            )}

            <div className="p-4 border-b border-border/60">
              <div className="text-[10px] text-text-sub font-mono uppercase tracking-wider mb-2">Biodata</div>
              <p className="text-[12px] text-text-main leading-relaxed italic opacity-80">
                "{isTutor ? (tutorProfileData?.bio || "Belum ada biodata tutor.") : (userProfile?.bio || "Belum ada biodata.")}"
              </p>
            </div>
            
            <div className="p-4 border-b border-border/60 bg-bg-2/30 flex justify-between items-center">
              <div>
                 <div className="text-[12px] font-bold text-text-main flex items-center gap-2">
                    <Settings size={14} className="text-lime" /> {t('profile.language')}
                 </div>
                 <div className="text-[10px] text-text-sub mt-0.5">English / Bahasa Indonesia</div>
              </div>
              <div className="flex bg-bg-3 rounded-md border border-border p-0.5 relative">
                 <button 
                   onClick={() => setLanguage('id')}
                   className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all z-10 ${language === 'id' ? 'text-black' : 'text-text-sub'}`}
                 >ID</button>
                 <button 
                   onClick={() => setLanguage('en')}
                   className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all z-10 ${language === 'en' ? 'text-black' : 'text-text-sub'}`}
                 >EN</button>
                 <div className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded bg-lime transition-all duration-300 ease-spring ${language === 'en' ? 'translate-x-[calc(100%+0px)]' : 'translate-x-0'}`}></div>
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
                    <div className="text-[11px] text-text-sub mt-1 flex flex-wrap gap-1">
                      {tutorProfileData?.learning_styles?.includes('Bisa Bahasa Inggris') && (
                        <span className="border border-border/60 bg-bg-2 px-2 py-[2px] rounded-sm text-[9px] font-mono text-violet-300 font-medium tracking-wider w-fit whitespace-nowrap">BILINGUAL</span>
                      )}
                      {(tutorProfileData?.learning_styles || [])
                        .filter((s: string) => s.startsWith('Jenjang'))
                        .sort((a: string, b: string) => {
                           const order: any = { 'Jenjang: SD': 1, 'Jenjang: SMP': 2, 'Jenjang: SMA': 3, 'Jenjang: Mahasiswa/Umum': 4 };
                           return (order[a] || 99) - (order[b] || 99);
                        })
                        .map((s: string) => {
                           const level = s.replace('Jenjang: ', '');
         let dotColor = "bg-text-sub";
         if (level === 'SD') dotColor = "bg-rose-400";
         else if (level === 'SMP') dotColor = "bg-sky-400";
         else if (level === 'SMA') dotColor = "bg-slate-400";
         return (
           <span key={s} className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-text-main font-medium tracking-wider flex items-center gap-1.5 whitespace-nowrap w-fit">
             <span className={`w-1 h-1 rounded-full shrink-0 ${dotColor}`}></span> {level}
           </span>
         );
       })
                      }
                    </div>
                  </div>
                  <span className="bg-lime-mid text-lime text-[10px] font-bold px-2 py-0.5 rounded font-mono border border-lime-dim">
                    {tutorProfileData?.target_subjects?.length || 0} Mapel
                  </span>
                </div>
              </div>
              <div 
                onClick={() => setActiveTab('tutor_dashboard')}
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors border-b border-border/60"
              >
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
                    Rp {(tutorProfileData?.hourly_rate || 50000).toLocaleString('id-ID')} / jam
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
              <div 
                onClick={() => setShowPkgsModal(true)}
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-3/50 transition-colors border-b border-border/60"
              >
                <Package className="text-text-sub" size={20} />
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <div className="text-[14px] font-bold font-display">
                      Paket Aktif
                    </div>
                    <div className="text-[11px] text-text-sub">
                      Sisa kuota sesi belajar privat Anda
                    </div>
                  </div>
                  <span className="bg-lime-mid text-lime text-[10px] font-bold px-2 py-0.5 rounded font-mono border border-lime-dim">
                    {myPackages.reduce((sum, p) => sum + (p.remaining_sessions || 0), 0)} Sesi
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

        <div className="flex flex-col gap-3 w-full max-w-[200px] mx-auto">
          {userRole === "siswa" && (
            <button
              onClick={handleRestartTour}
              className="w-full flex items-center justify-center gap-2 px-[18px] py-[12px] rounded-lg border-[2px] border-lime/30 bg-lime/10 text-lime text-[13px] font-bold cursor-pointer transition-all font-display hover:border-lime/50 hover:bg-lime/20"
            >
              {t('common.restart_tour')}
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-[18px] py-[12px] rounded-lg border-[2px] border-red-500/30 bg-red-500/10 text-red-500 text-[13px] font-bold cursor-pointer transition-all font-display hover:border-red-500/50 hover:bg-red-500/20"
          >
            <LogOut size={16} /> {t('common.logout')}
          </button>
        </div>
      </div>

      {isEditing && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-pgIn" style={{overscrollBehavior: 'none'}}>
           <div className="bg-card border border-border sm:shadow-2xl sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-[500px] flex flex-col sm:max-h-[85vh] overflow-hidden relative">
              <div className="flex items-center justify-between p-4 border-b border-border bg-bg-2">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Settings size={20} className="text-lime" /> Edit Profil
                </h3>
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
                
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="relative">
                    <img 
                      src={avatarObjUrl || avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayFullName)} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-full object-cover border-[3px] border-lime/30"
                    />
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-lime text-black rounded-full p-1.5 cursor-pointer shadow-md hover:bg-lime-hover transition-colors">
                      <Camera size={14} />
                    </label>
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAvatarFile(file);
                          setAvatarObjUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                  <span className="text-xs text-text-sub">Ubah Foto Profil</span>
                </div>

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
                  <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-bg-2 border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Jenis Kelamin</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-bg-2 border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all appearance-none"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                {!isTutor && userRole !== 'admin' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Jenjang Pendidikan Saat Ini</label>
                    <select 
                      value={schoolLevel}
                      onChange={(e) => setSchoolLevel(e.target.value)}
                      className="w-full bg-bg-2 border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all appearance-none"
                    >
                      <option value="">Pilih Jenjang</option>
                      <option value="SD">SD (Sekolah Dasar)</option>
                      <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                      <option value="SMA/SMK">SMA/SMK</option>
                      <option value="Mahasiswa">Mahasiswa</option>
                      <option value="Umum">Umum / Pekerja</option>
                    </select>
                  </div>
                )}

                {isTutor && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Alamat Lengkap</label>
                      <input 
                        type="text" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-bg-2 border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
                        placeholder="Domisili kota/alamat..."
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Asal Universitas <span className="text-warning">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full bg-bg-2 border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
                        placeholder="Contoh: Universitas Indonesia"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Mapel yang Dikuasai</label>
                      <div className="flex flex-wrap gap-2">
                        {["Matematika", "Fisika", "Kimia", "Biologi", "Bahasa Inggris", "Bahasa Indonesia", "Sejarah"].map(sub => (
                          <span 
                            key={sub}
                            onClick={() => toggleTargetSubject(sub)}
                            className={`text-[11px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors border ${targetSubjects.includes(sub) ? "bg-lime-dim text-lime border-lime" : "bg-bg-3 text-text-sub border-border hover:border-lime/50"}`}
                          >
                             {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Tipe Mengajar</label>
                      <div className="flex gap-4">
                        {["Online", "Offline"].map(type => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={learningStyles.includes(type)}
                              onChange={() => toggleLearningStyle(type)}
                              className="w-4 h-4 accent-lime"
                            />
                            <span className="text-[13px]">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Bilingual (Bahasa Inggris)</label>
                      <label className="flex items-center gap-2 cursor-pointer border border-border p-3 rounded-xl bg-bg-2">
                        <input 
                          type="checkbox" 
                          checked={learningStyles.includes("Bisa Bahasa Inggris")}
                          onChange={() => toggleLearningStyle("Bisa Bahasa Inggris")}
                          className="w-4 h-4 accent-lime"
                        />
                        <span className="text-[13px] font-bold text-text-main">Sedia mengajar Full English / Bilingual</span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Jenjang Siswa yang Diutamakan</label>
                      <div className="flex flex-wrap gap-2">
                        {["Jenjang: SD", "Jenjang: SMP", "Jenjang: SMA", "Jenjang: Mahasiswa/Umum"].map(type => (
                          <span 
                            key={type}
                            onClick={() => toggleLearningStyle(type)}
                            className={`text-[11px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors border ${learningStyles.includes(type) ? "bg-lime-dim text-lime border-lime" : "bg-bg-3 text-text-sub border-border hover:border-lime/50"}`}
                          >
                             {type.replace("Jenjang: ", "")}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Hari & Jam Tersedia</label>
                      <div className="border border-border p-3 rounded-xl bg-bg-2">
                        <p className="text-[10px] text-text-sub mb-2">Pilih hari mengajar</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                           {[{id: 1, name: "Sen"}, {id: 2, name: "Sel"}, {id: 3, name: "Rab"}, {id: 4, name: "Kam"}, {id: 5, name: "Jum"}, {id: 6, name: "Sab"}, {id: 0, name: "Min"}].map(day => (
                             <span 
                               key={day.id}
                               onClick={() => setSelectedDay(selectedDay === day.id ? null : day.id)}
                               className={`text-[11px] px-2.5 py-1 rounded-md cursor-pointer transition-colors border ${selectedDay === day.id ? "bg-lime text-black font-bold" : (schedule[day.id]?.length > 0 ? "bg-lime-dim text-lime border-lime font-bold" : "bg-bg-1 text-text-sub border-border hover:border-lime/50")}`}
                             >
                                {day.name} {schedule[day.id]?.length > 0 && `(${schedule[day.id].length})`}
                             </span>
                           ))}
                        </div>
                        {selectedDay !== null && (
                          <div className="animate-pgIn">
                            <p className="text-[10px] text-text-sub mb-2">Pilih jam pada hari {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][selectedDay]}</p>
                            <div className="flex flex-wrap gap-2">
                               {["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "18:00", "19:00", "20:00"].map(hour => (
                                 <span 
                                   key={hour}
                                   onClick={() => toggleScheduleHour(selectedDay, hour)}
                                   className={`text-[11px] px-2 py-1 rounded-md cursor-pointer transition-colors border font-mono ${schedule[selectedDay]?.includes(hour) ? "bg-lime-dim text-lime border-lime font-bold" : "bg-bg-1 text-text-sub border-border hover:border-lime/50"}`}
                                 >
                                    {hour}
                                 </span>
                               ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

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

              <div className="p-4 border-t border-border flex justify-end gap-3 bg-bg-2/50 relative z-20">
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
        </div>,
        document.body
      )}

      {showPkgsModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-pgIn" style={{overscrollBehavior: 'none'}}>
          <div className="bg-card border border-border sm:shadow-2xl sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-[480px] flex flex-col sm:max-h-[85vh] overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-border bg-bg-2">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Package size={20} className="text-lime" /> Paket Belajar Aktif
              </h3>
              <button onClick={() => setShowPkgsModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-2 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              <p className="text-xs text-text-sub">
                Paket yang telah Anda beli terikat untuk masing-masing Tutor spesifik agar perhitungan potongan harga adil dan transparan.
              </p>

              {isFetchingPkgs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-lime" size={32} />
                </div>
              ) : myPackages.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl">
                  <Package className="mx-auto text-text-light/50 mb-3" size={36} />
                  <p className="text-sm font-bold text-text-main">Belum Ada Paket Aktif</p>
                  <p className="text-xs text-text-sub mt-1">
                    Silakan beli paket di profil Tutor pilihan Anda untuk menikmati potongan harga spesial.
                  </p>
                  <button
                    onClick={() => {
                      setShowPkgsModal(false);
                      setActiveTab("search");
                    }}
                    className="mt-4 px-4 py-2 text-xs font-bold bg-lime text-black rounded-lg hover:bg-lime-hover transition-colors"
                  >
                    Cari Tutor Terbaik
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {myPackages.map((pkg) => {
                    const expiryStr = pkg.valid_until 
                      ? new Date(pkg.valid_until).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
                      : "Selamanya";
                    const tutorName = pkg.tutor?.name || "Tutor Kita";

                    return (
                      <div key={pkg.id} className="bg-card-2 border-[1.5px] border-border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs text-text-sub font-mono font-semibold uppercase tracking-wider text-lime">
                              {pkg.packages?.name || "Paket Belajar"}
                            </div>
                            <div className="font-display text-[15px] font-bold text-text-main mt-0.5">
                              Tutor: {tutorName}
                            </div>
                            <div className="text-[11px] text-text-sub">
                              {pkg.tutor?.university} • {pkg.tutor?.major}
                            </div>
                          </div>
                          <span className="bg-lime text-black text-[12px] font-bold px-2.5 py-1 rounded-lg font-mono">
                            {pkg.remaining_sessions} Sesi Sisa
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-text-light font-mono pt-2 border-t border-border/65">
                          <span>Berlaku s/d: {expiryStr}</span>
                          <button
                            onClick={() => {
                              setSelectedTutorId(pkg.tutor?.id);
                              setShowPkgsModal(false);
                            }}
                            className="bg-lime/10 border border-lime/30 text-lime px-3 py-1.5 rounded-lg hover:bg-lime hover:text-black font-bold transition-all"
                          >
                            Pesan Sesi Baru
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex justify-end bg-bg-2/30">
              <button 
                onClick={() => setShowPkgsModal(false)}
                className="px-5 py-2.5 rounded-lg border border-border bg-bg-3 font-bold text-[13px] hover:bg-bg-2 transition-colors w-full"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
