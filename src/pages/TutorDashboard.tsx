import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, ArrowRight, Edit3 as PencilSimple, AlertCircle as WarningCircle, CheckCircle, Notebook, Bell, X as XIcon, Clock, Loader2 } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { supabase } from '../lib/supabase';

export function TutorDashboard() {
  const { setActiveTab, setUserRole, user, userProfile } = useAppContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionReports, setSessionReports] = useState<any[]>([]);
  const [tutorStats, setTutorStats] = useState({ rating: 0, total_reviews: 0 });  
  const [isEditingDays, setIsEditingDays] = useState(false);
  const [tutorSchedule, setTutorSchedule] = useState<{[key: number]: string[]}>({});
  const [selectedDayToEdit, setSelectedDayToEdit] = useState<number | null>(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [pendingRateRequest, setPendingRateRequest] = useState<number | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [requestedRate, setRequestedRate] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [isSubmittingRate, setIsSubmittingRate] = useState(false);

  const submitRateRequest = async () => {
    if (!user || !requestedRate) return;
    
    const rateNumber = parseInt(requestedRate.replace(/\D/g, ''));
    if (isNaN(rateNumber) || rateNumber <= 0) {
       alert("Masukkan nominal yang valid");
       return;
    }

    setIsSubmittingRate(true);
    try {
      const { error } = await supabase.from('rate_requests').insert({
        tutor_id: user.id,
        current_rate: hourlyRate,
        requested_rate: rateNumber,
        reason: requestReason,
        status: 'pending'
      });

      if (error) throw error;
      
      setPendingRateRequest(rateNumber);
      setIsRateModalOpen(false);
      setRequestedRate("");
      setRequestReason("");
    } catch (err) {
      console.error(err);
      alert("Gagal mengajukan perubahan harga");
    } finally {
      setIsSubmittingRate(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole('guest');
    setActiveTab('home');
  };

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoading(true);

      try {
        // Fetch tutor profile (rating)
        const { data: tutorProfile } = await supabase
          .from('tutor_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (tutorProfile) {
          setTutorStats({ rating: tutorProfile.rating || 0, total_reviews: tutorProfile.total_reviews || 0 });
          setHourlyRate(tutorProfile.hourly_rate || 0);
          if (tutorProfile.schedule) {
            setTutorSchedule(tutorProfile.schedule);
          }
        }

        // Fetch rate requests
        const { data: activeRateReqs } = await supabase
          .from('rate_requests')
          .select('requested_rate')
          .eq('tutor_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (activeRateReqs && activeRateReqs.length > 0) {
          setPendingRateRequest(activeRateReqs[0].requested_rate);
        }

        // Fetch all sessions for this tutor
        const { data: tutorSessions } = await supabase
          .from('sessions')
          .select(`
            *,
            student:student_profiles(
              id,
              profiles(full_name, avatar_url)
            )
          `)
          .eq('tutor_id', user.id)
          .order('session_date', { ascending: false });

        // Fetch session reports
        const { data: reports } = await supabase
          .from('session_reports')
          .select('*')
          .eq('tutor_id', user.id);

        if (tutorSessions) setSessions(tutorSessions);
        if (reports) setSessionReports(reports);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [user]);

  // Derived data

  const getSessionEndDateTime = (s: any) => {
    if (s.end_time?.includes('T')) return new Date(s.end_time);
    return s.session_date && s.end_time ? new Date(`${s.session_date}T${s.end_time}`) : new Date(0);
  };
  
  const getSessionStartDateTime = (s: any) => {
    if (s.start_time?.includes('T')) return new Date(s.start_time);
    return s.session_date && s.start_time ? new Date(`${s.session_date}T${s.start_time}`) : new Date(0);
  };

  const tutorName = userProfile?.full_name || "Tutor";
  const xp = sessions.filter(s => s.status === 'completed').length * 100;
  const xpThisMonth = sessions.filter(s => s.status === 'completed' && new Date(s.session_date).getMonth() === new Date().getMonth()).length * 100;
  const totalSessions = sessions.length;

  const xpTarget = xp >= 5000 ? 5000 : xp >= 1000 ? 5000 : 1000;
  const xpFloor = xp >= 5000 ? 5000 : xp >= 1000 ? 1000 : 0;
  const xpPct = xpTarget > xpFloor ? Math.min(100, Math.round(((xp - xpFloor) / (xpTarget - xpFloor)) * 100)) : 100;
  let tier = 'Bronze';
  if (xp >= 5000) tier = 'Gold';
  else if (xp >= 1000) tier = 'Silver';

  // Process pending reviews
  const reportSessionIds = new Set(sessionReports.map(r => r.session_id));
  const pastSessions = sessions.filter(s => getSessionEndDateTime(s) < new Date());
  
  const pendingReviews = pastSessions
    .filter(s => !reportSessionIds.has(s.id));

  // Active students
  const studentMap = new Map();
  sessions.forEach(s => {
    if (!studentMap.has(s.student_id) && s.student) {
      studentMap.set(s.student_id, {
        id: s.student_id,
        name: s.student.profiles?.full_name || 'Student',
        level: 'Siswa',
        subject: s.subject,
        sessions: sessions.filter(sess => sess.student_id === s.student_id).length,
        nextSession: sessions.find(sess => sess.student_id === s.student_id && getSessionStartDateTime(sess) > new Date())?.session_date || 'Belum ada',
        remaining: 0, // if we want to query packages
        avatarColor: '#1A3A28', // Placeholder color
      });
    }
  });
  const activeStudents = Array.from(studentMap.values());

  const tierBadge = (tier: string) => {
    let classes = "";
    if (tier === 'Gold') classes = "bg-gold-bg text-gold border-gold/30";
    if (tier === 'Silver') classes = "bg-silver-bg text-silver border-silver/30";
    if (tier === 'Bronze') classes = "bg-bronze-bg text-bronze border-bronze/30";
    return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[12px] font-extrabold font-mono border ${classes}`}>
      ★ {tier}
    </span>
  };

  const toggleEditDay = (dayId: number) => {
    setSelectedDayToEdit(selectedDayToEdit === dayId ? null : dayId);
  };

  const toggleScheduleHour = (dayId: number, hour: string) => {
    setTutorSchedule(prev => {
      const next = { ...prev };
      const hours = next[dayId] || [];
      if (hours.includes(hour)) {
        next[dayId] = hours.filter(h => h !== hour);
        // We do NOT delete next[dayId] here immediately if it's 0 length
        // to allow them to pick another time without losing selection.
      } else {
        next[dayId] = [...hours, hour].sort();
      }
      return next;
    });
  };

  const saveSchedule = async () => {
    if (!user) return;
    setIsSavingSchedule(true);
    try {
      // Clean up empty arrays before saving
      const cleanedSchedule: { [key: number]: string[] } = { ...tutorSchedule };
      for (const key of Object.keys(cleanedSchedule)) {
         const numericKey = Number(key);
         const val = cleanedSchedule[numericKey];
         if (!val || val.length === 0) {
            delete cleanedSchedule[numericKey];
         }
      }

      const availableDaysList = Object.keys(cleanedSchedule).map(Number);
      const allHoursSet = new Set<string>();
      Object.values(cleanedSchedule).forEach((hours: any) => {
        if (Array.isArray(hours)) hours.forEach(h => allHoursSet.add(h));
      });
      const availableHoursList = Array.from(allHoursSet).sort();

      const { error } = await supabase.from('tutor_profiles').update({
        schedule: cleanedSchedule,
        available_days: availableDaysList,
        available_hours: availableHoursList
      }).eq('id', user.id);

      if (error) throw error;
      setTutorSchedule(cleanedSchedule);
      setIsEditingDays(false);
      setSelectedDayToEdit(null);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan jadwal');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const DAYS_MAP = [
    {id: 1, name: 'Sen'}, {id: 2, name: 'Sel'}, {id: 3, name: 'Rab'}, 
    {id: 4, name: 'Kam'}, {id: 5, name: 'Jum'}, {id: 6, name: 'Sab'}, 
    {id: 0, name: 'Min'}
  ];
  const AVAILABLE_HOURS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "18:00", "19:00", "20:00"];


  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-lime" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full relative h-full animate-pgIn flex flex-col items-center">
      <div className="w-full max-w-[800px] px-4 py-4 md:py-6 relative z-10 flex flex-col pb-24">
        
        {/* Header */}
        <div className="sticky top-0 bg-bg-base/80 backdrop-blur-md z-10 border-b-[1.5px] border-border pb-3 mb-4 pt-4 md:pt-0 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="font-display text-[20px] font-extrabold mb-[1px]">Dasbor Tutor</div>
          <div className="text-[12px] text-text-sub">Halo, {tutorName}! 👋</div>
        </div>

        {/* XP Card */}
        <div className="bg-primary rounded-[20px] p-5 border-[2px] border-primary-bright relative overflow-hidden shadow-green mb-3.5">
           <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0px, rgba(255,255,255,.02) 1px, transparent 1px, transparent 18px)' }}></div>
           <div className="flex justify-between items-start relative z-10">
              <div>
                 <div className="text-[9px] text-white/45 font-bold uppercase tracking-[0.1em] mb-[3px] font-mono">TOTAL XP</div>
                 <div className="font-mono text-[44px] font-bold text-lime leading-none tracking-[-1px] animate-pgIn">{xp.toLocaleString('id-ID')}</div>
              </div>
              {tierBadge(tier)}
           </div>
           
           <div className="relative z-10 mt-2">
              <div className="h-[8px] bg-black/35 rounded-[4px] overflow-hidden my-2.5 border border-white/10">
                 <div className="h-full bg-lime rounded-[4px] transition-all duration-1000 ease-out" style={{ width: `${xpPct}%` }}></div>
              </div>
              <div className="flex justify-between">
                 <div className="text-[10px] text-white/45 font-mono">{xpPct}% menuju {xp >= 1000 ? 'Gold' : 'Silver'}</div>
                 <div className="text-[10px] text-white/45 font-mono">+{xpThisMonth} XP bulan ini</div>
              </div>
           </div>

           <div className="flex gap-3 mt-[13px] relative z-10 bg-black/25 rounded-lg py-2.5 px-3 items-center">
              <div className="text-center">
                <div className="font-mono text-[18px] text-lime leading-tight">0</div>
                <div className="text-[9px] text-white/40 font-semibold font-mono">🔥 STREAK</div>
              </div>
              <div className="w-[1px] bg-white/10 h-[28px] mx-1"></div>
              <div className="text-center">
                <div className="font-mono text-[18px] text-white leading-tight">{totalSessions}</div>
                <div className="text-[9px] text-white/40 font-semibold font-mono">TOTAL SESI</div>
              </div>
              <div className="w-[1px] bg-white/10 h-[28px] mx-1"></div>
              <div className="text-center">
                <div className="font-mono text-[18px] text-white leading-tight">{activeStudents.length}</div>
                <div className="text-[9px] text-white/40 font-semibold font-mono">SISWA AKTIF</div>
              </div>
              <button 
                onClick={() => alert("Halaman detail statistik belum tersedia.")}
                className="ml-auto bg-lime-mid border border-lime-dim text-lime text-[11px] font-bold px-3 py-1.5 rounded-[4px] cursor-pointer font-mono hover:bg-lime/20 transition-colors"
              >
                Detail →
              </button>
           </div>
        </div>

        {/* Warning Reviews */}
        {pendingReviews.length > 0 && (
          <div onClick={() => setActiveTab('sessions')} className="bg-warning/10 border-[1.5px] border-warning/35 rounded-xl p-3 mb-3.5 flex items-center gap-2.5 cursor-pointer hover:bg-warning/20 transition-colors">
             <WarningCircle className="text-[22px] text-warning shrink-0" fill="currentColor" stroke="none" />
             <div className="flex-1">
                <div className="text-[13px] font-bold text-warning font-display">{pendingReviews.length} Laporan Sesi Belum Diisi</div>
                <div className="text-[11px] text-text-sub font-mono">Klik di sini untuk diarahkan ke tab Sesi →</div>
             </div>
          </div>
        )}

        {/* Hari Aktifku */}
        <div className="bg-card rounded-xl p-4 border-[1.5px] border-border mb-3.5">
           <div className="flex justify-between items-center mb-3">
             <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] font-mono">JADWAL MENGAJAR & JAM AKTIF</div>
             {!isEditingDays ? (
               <button onClick={() => setIsEditingDays(true)} className="bg-transparent border-none text-[11px] font-bold text-lime font-mono cursor-pointer hover:text-lime-dim">Atur Jadwal →</button>
             ) : (
               <button 
                 onClick={saveSchedule} 
                 disabled={isSavingSchedule}
                 className="bg-lime text-black border-none text-[10px] font-bold py-1 px-3 rounded font-mono cursor-pointer hover:bg-lime-dim disabled:opacity-50"
               >
                 {isSavingSchedule ? "Menyimpan..." : "Simpan Jadwal"}
               </button>
             )}
           </div>
           
           <div className="flex flex-col gap-3">
              <div className="grid grid-cols-7 gap-1.5 min-w-0">
                {DAYS_MAP.map((day) => {
                  const isActive = tutorSchedule[day.id] && tutorSchedule[day.id].length > 0;
                  return (
                    <div 
                      key={day.id} 
                      onClick={() => {
                        if (!isEditingDays) return;
                        toggleEditDay(day.id);
                      }}
                      className={`relative aspect-square rounded-[4px] border-[1.5px] flex items-center justify-center text-[10px] font-bold font-mono transition-colors ${isActive ? 'border-lime bg-lime-mid text-lime' : 'border-border bg-bg-2 text-text-light'} ${isEditingDays || isActive ? 'cursor-pointer hover:border-lime/50' : ''} ${selectedDayToEdit === day.id ? 'ring-2 ring-lime/30' : ''}`}
                    >
                      {day.name} {isActive && <span className="absolute bottom-[4px] w-1.5 h-1.5 bg-lime rounded-full"></span>}
                    </div>
                  )
                })}
              </div>

              {/* Time Slots List */}
              {isEditingDays ? (
                <div className="mt-2">
                  {selectedDayToEdit !== null ? (
                    <div className="animate-pgIn border border-border p-3 rounded-lg bg-bg-2">
                      <p className="text-[11px] text-text-sub font-mono mb-2">Pilih jam pada hari <strong>{DAYS_MAP.find(d => d.id === selectedDayToEdit)?.name}</strong></p>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_HOURS.map(hour => (
                          <span 
                            key={hour}
                            onClick={() => toggleScheduleHour(selectedDayToEdit, hour)}
                            className={`text-[11px] px-2 py-1 rounded-[4px] cursor-pointer transition-colors border font-mono ${tutorSchedule[selectedDayToEdit]?.includes(hour) ? "bg-lime-dim text-lime border-lime font-bold" : "bg-bg-1 text-text-sub border-border hover:border-lime/50"}`}
                          >
                            {hour}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-center text-text-sub py-3 bg-bg-2/50 rounded-lg border border-border/40 font-mono">
                      Klik hari di atas untuk mengatur jam.
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                   {DAYS_MAP.map((day) => {
                      if (!tutorSchedule[day.id] || tutorSchedule[day.id].length === 0) return null;
                      
                      // Display array of hours compactly
                      const hours = tutorSchedule[day.id];
                      let displayHours = "";
                      if (hours.length > 3) {
                          displayHours = `${hours[0]}, ${hours[1]} ... +${hours.length - 2} jam`;
                      } else {
                          displayHours = hours.join(", ");
                      }

                      return (
                        <div key={`time-${day.id}`} className="flex items-center justify-between bg-bg-2/50 p-2.5 rounded-lg border border-border/40 animate-pgIn">
                           <div className="flex items-center gap-3">
                              <span className="w-8 font-mono text-[11px] font-bold text-lime">{day.name}</span>
                              <span className="text-[11px] text-text-sub font-mono tracking-wider">{displayHours}</span>
                           </div>
                           <Clock size={14} className="text-text-muted" />
                        </div>
                      )
                   })}
                </div>
              )}
           </div>
        </div>

        {/* Harga Layanan */}
        <div className="bg-card rounded-xl p-4 border-[1.5px] border-border mb-3.5 flex justify-between items-center">
           <div>
              <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] font-mono mb-[4px]">HARGA PER JAM</div>
              <div className="font-display font-black text-[18px] text-lime">Rp {hourlyRate.toLocaleString('id-ID')}</div>
              {pendingRateRequest !== null && (
                <div className="text-[10px] text-warning font-mono mt-1 flex items-center gap-1">
                  <Clock size={10} /> Menunggu acc admin: Rp {pendingRateRequest.toLocaleString('id-ID')}
                </div>
              )}
           </div>
           <button 
             onClick={() => setIsRateModalOpen(true)}
             disabled={pendingRateRequest !== null}
             className="bg-bg-2 border border-border text-[11px] font-bold px-3 py-2 rounded-[6px] transition-colors disabled:opacity-50 hover:bg-bg-3 font-mono text-text-main cursor-pointer"
           >
             Ajukan Ubah
           </button>
        </div>

        {/* Siswa Aktif */}
        <div className="bg-card rounded-xl p-4 border-[1.5px] border-border mb-3.5">
           <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] font-mono mb-[4px]">SISWA AKTIFKU ({activeStudents.length})</div>
           {activeStudents.map(s => (
             <div key={s.id} className="flex items-center gap-2.5 py-2.5 border-b-[1.5px] border-border last:border-b-0 cursor-pointer hover:bg-bg-3 rounded-lg px-1 transition-colors">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-extrabold text-white/90 text-[14px] shrink-0" style={{ background: s.avatarColor }}>
                  {s.name.split(' ').map(w=>w[0]).join('').substring(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="font-display text-[13px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">{s.name}</div>
                   <div className="text-[11px] text-text-sub font-mono mt-[2px]">{s.level} · {s.subject} · {s.sessions} sesi</div>
                   <div className="flex items-center gap-1.5 mt-1">
                      <div className="h-[3px] bg-bg-3 w-[70px] rounded-full overflow-hidden border border-border">
                         <div className="h-full bg-lime rounded-full" style={{ width: `${Math.round((s.remaining/8)*100)}%` }}></div>
                      </div>
                      <span className="text-[10px] text-text-sub font-mono">{s.remaining} tersisa</span>
                   </div>
                </div>
                <div className="text-right shrink-0">
                   <div className="text-[10px] text-text-sub font-mono">berikutnya</div>
                   <div className="text-[11px] font-bold text-lime font-mono">{s.nextSession.split('·')[0]}</div>
                </div>
             </div>
           ))}
        </div>

        <div className="h-8"></div>
        <button onClick={handleLogout} className="btn danger flex items-center justify-center gap-2 w-full max-w-[200px] mx-auto mt-4 py-3 bg-red-500/10 text-red-500 font-bold border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors">
          <LogOut size={18} /> Keluar
        </button>
        <div className="h-14"></div>
      </div>

      {/* Rate Request Modal */}
      {isRateModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-pgIn" style={{overscrollBehavior: 'none'}}>
          <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b-[1.5px] border-border bg-bg-2">
              <div className="font-display font-bold text-[16px]">Ajukan Ubah Harga</div>
              <button 
                onClick={() => setIsRateModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-3 text-text-sub transition-colors"
              >
                <XIcon size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="text-[13px] text-text-sub mb-4">
                 Harga Anda saat ini adalah <strong className="text-lime font-mono">Rp {hourlyRate.toLocaleString('id-ID')}</strong>. Masukkan nominal harga per jam baru yang ingin Anda ajukan.
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                 <label className="text-[11px] font-bold font-mono text-text-sub uppercase">Harga Baru (Rp)</label>
                 <input 
                   type="text"
                   className="w-full bg-bg-2 border-[1.5px] border-border rounded-lg p-3 text-[13px] font-mono focus:outline-none focus:border-lime"
                   placeholder="Contoh: 150000"
                   value={requestedRate}
                   onChange={(e) => {
                     const val = e.target.value.replace(/\D/g, '');
                     setRequestedRate(val ? parseInt(val).toLocaleString('id-ID') : '');
                   }}
                 />
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                 <label className="text-[11px] font-bold font-mono text-text-sub uppercase">Alasan (Opsional)</label>
                 <textarea 
                   className="w-full bg-bg-2 border-[1.5px] border-border rounded-lg p-3 text-[13px] focus:outline-none focus:border-lime min-h-[80px] resize-none"
                   placeholder="Berikan alasan mengapa Anda menaikkan harga..."
                   value={requestReason}
                   onChange={(e) => setRequestReason(e.target.value)}
                 ></textarea>
              </div>
              <div className="text-[11px] text-text-muted mt-2 mb-4">
                Pengubahan harga harus disetujui oleh tim administrasi untuk mencegah lonjakan harga sepihak yang dapat merugikan siswa.
              </div>
              <button 
                onClick={submitRateRequest}
                disabled={isSubmittingRate || !requestedRate.trim()}
                className="w-full flex items-center justify-center gap-2 bg-lime border-[2px] border-lime text-black font-bold font-display px-4 py-3 rounded-lg mt-2 cursor-pointer shadow-sh1 hover:shadow-sh2 hover:-translate-y-[1px] hover:-translate-x-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingRate ? <Loader2 size={16} className="animate-spin" /> : null}
                {isSubmittingRate ? 'Mengajukan...' : 'Ajukan Perubahan'}
              </button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}

