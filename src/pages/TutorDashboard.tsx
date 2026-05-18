import { useState } from 'react';
import { LogOut, ArrowRight, Edit3 as PencilSimple, AlertCircle as WarningCircle, CheckCircle, Notebook, Bell, X as XIcon, Clock } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { TUTORS } from '../data'; // Use existing mock data where applicable

export function TutorDashboard() {
  const { setActiveTab, setUserRole } = useAppContext();
  
  const [isEditingDays, setIsEditingDays] = useState(false);
  const [editedDays, setEditedDays] = useState<{[key: number]: string}>({
    1: '08:00 - 12:00', 
    3: '13:00 - 17:00', 
    5: '08:00 - 15:00', 
    6: '10:00 - 14:00'
  });
  
  const [reviewModalTarget, setReviewModalTarget] = useState<string | null>(null);

  const handleLogout = () => {
    setUserRole('guest');
    setActiveTab('home');
  };

  const TUTOR_DATA = {
    name: 'Ahmad',
    xp: 4280,
    xpThisMonth: 420,
    streak: 12,
    tier: 'Gold',
    activeDays: Object.keys(editedDays).map(Number),
    activeStudents: [
      { id: 's1', name: 'Ahmad Rizki', gender: 'M', level: 'SMA', subject: 'Pemrograman', nextSession: 'Sab, 19 Apr · 14.00', sessions: 8, remaining: 4, avatarColor: '#1A3A28' },
      { id: 's2', name: 'Lina Wati', gender: 'F', level: 'SMA', subject: 'Matematika', nextSession: 'Ming, 20 Apr · 10.00', sessions: 3, remaining: 5, avatarColor: '#4A1A8B' },
    ],
    pendingReviews: [
      { id: 'r1', student: 'Ahmad Rizki', subject: 'Pemrograman', date: 'Rab, 16 Apr', topic: 'OOP & Class Inheritance', duration: 90, avatarColor: '#1A3A28' },
    ],
    teachingHistory: [
      { id: 'h1', student: 'Ahmad Rizki', subject: 'Pemrograman', date: 'Rab, 16 Apr', topic: 'OOP & Class Inheritance', dur: 90, xp: 150, rating: 5.0, reviewed: false },
      { id: 'h2', student: 'Budi Hartono', subject: 'Pemrograman', date: 'Sel, 15 Apr', topic: 'Algoritma Sorting', dur: 60, xp: 100, rating: 5.0, reviewed: false },
      { id: 'h3', student: 'Lina Wati', subject: 'Matematika', date: 'Sen, 14 Apr', topic: 'Integral Tentu', dur: 90, xp: 175, rating: 4.5, reviewed: true },
    ]
  };

  const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  
  const xpFloor = TUTOR_DATA.xp >= 5000 ? 5000 : TUTOR_DATA.xp >= 1000 ? 1000 : 0;
  const xpTarget = TUTOR_DATA.xp >= 5000 ? 5000 : TUTOR_DATA.xp >= 1000 ? 5000 : 1000;
  const xpPct = Math.min(100, Math.round(((TUTOR_DATA.xp - xpFloor) / (xpTarget - xpFloor)) * 100));

  const tierBadge = (tier: string) => {
    let classes = "";
    if (tier === 'Gold') classes = "bg-gold-bg text-gold border-gold/30";
    if (tier === 'Silver') classes = "bg-silver-bg text-silver border-silver/30";
    if (tier === 'Bronze') classes = "bg-bronze-bg text-bronze border-bronze/30";
    return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[12px] font-extrabold font-mono border ${classes}`}>
      ★ {tier}
    </span>
  };

  const activeDayNames = TUTOR_DATA.activeDays.map(d => DAYS[d]).join(', ');

  const toggleEditDay = (dayIndex: number) => {
    if (!isEditingDays) return;
    setEditedDays(prev => {
      const next = { ...prev };
      if (next[dayIndex]) {
        delete next[dayIndex];
      } else {
        next[dayIndex] = '08:00 - 17:00';
      }
      return next;
    });
  };

  const updateDayTime = (dayIndex: number, timeStr: string) => {
    setEditedDays(prev => ({
      ...prev,
      [dayIndex]: timeStr
    }));
  };

  return (
    <div className="w-full relative h-full animate-pgIn flex flex-col items-center">
      <div className="w-full max-w-[800px] px-4 py-4 md:py-6 relative z-10 flex flex-col pb-8">
        
        {/* Header */}
        <div className="sticky top-0 bg-bg-base/80 backdrop-blur-md z-10 border-b-[1.5px] border-border pb-3 mb-4 pt-4 md:pt-0 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="font-display text-[20px] font-extrabold mb-[1px]">Dasbor Tutor</div>
          <div className="text-[12px] text-text-sub">Halo, {TUTOR_DATA.name}! 👋</div>
        </div>

        {/* XP Card */}
        <div className="bg-primary rounded-[20px] p-5 border-[2px] border-primary-bright relative overflow-hidden shadow-green mb-3.5">
           <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0px, rgba(255,255,255,.02) 1px, transparent 1px, transparent 18px)' }}></div>
           <div className="flex justify-between items-start relative z-10">
              <div>
                 <div className="text-[9px] text-white/45 font-bold uppercase tracking-[0.1em] mb-[3px] font-mono">TOTAL XP</div>
                 <div className="font-mono text-[44px] font-bold text-lime leading-none tracking-[-1px] animate-pgIn">{TUTOR_DATA.xp.toLocaleString('id-ID')}</div>
              </div>
              {tierBadge(TUTOR_DATA.tier)}
           </div>
           
           <div className="relative z-10 mt-2">
              <div className="h-[8px] bg-black/35 rounded-[4px] overflow-hidden my-2.5 border border-white/10">
                 <div className="h-full bg-lime rounded-[4px] transition-all duration-1000 ease-out" style={{ width: `${xpPct}%` }}></div>
              </div>
              <div className="flex justify-between">
                 <div className="text-[10px] text-white/45 font-mono">{xpPct}% menuju {TUTOR_DATA.xp >= 1000 ? 'Gold' : 'Silver'}</div>
                 <div className="text-[10px] text-white/45 font-mono">+{TUTOR_DATA.xpThisMonth} XP bulan ini</div>
              </div>
           </div>

           <div className="flex gap-3 mt-[13px] relative z-10 bg-black/25 rounded-lg py-2.5 px-3 items-center">
              <div className="text-center">
                <div className="font-mono text-[18px] text-lime leading-tight">{TUTOR_DATA.streak}</div>
                <div className="text-[9px] text-white/40 font-semibold font-mono">🔥 STREAK</div>
              </div>
              <div className="w-[1px] bg-white/10 h-[28px] mx-1"></div>
              <div className="text-center">
                <div className="font-mono text-[18px] text-white leading-tight">87</div>
                <div className="text-[9px] text-white/40 font-semibold font-mono">TOTAL SESI</div>
              </div>
              <div className="w-[1px] bg-white/10 h-[28px] mx-1"></div>
              <div className="text-center">
                <div className="font-mono text-[18px] text-white leading-tight">{TUTOR_DATA.activeStudents.length}</div>
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
        {TUTOR_DATA.pendingReviews.length > 0 && (
          <div className="bg-warning/10 border-[1.5px] border-warning/35 rounded-xl p-3 mb-3.5 flex items-center gap-2.5 cursor-pointer hover:bg-warning/20 transition-colors">
             <WarningCircle className="text-[22px] text-warning shrink-0" fill="currentColor" stroke="none" />
             <div className="flex-1">
                <div className="text-[13px] font-bold text-warning font-display">{TUTOR_DATA.pendingReviews.length} Laporan Sesi Belum Diisi</div>
                <div className="text-[11px] text-text-sub font-mono">Scroll ke bawah untuk mengisi ↓</div>
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
               <button onClick={() => setIsEditingDays(false)} className="bg-lime text-black border-none text-[10px] font-bold py-1 px-3 rounded font-mono cursor-pointer hover:bg-lime-dim">Simpan Jadwal</button>
             )}
           </div>
           
           <div className="flex flex-col gap-3">
              <div className="grid grid-cols-7 gap-1.5 min-w-0">
                {DAYS.map((d, i) => {
                  const isActive = !!editedDays[i];
                  return (
                    <div 
                      key={d} 
                      onClick={() => toggleEditDay(i)}
                      className={`aspect-square rounded-[4px] border-[1.5px] flex items-center justify-center text-[10px] font-bold font-mono transition-colors ${isActive ? 'border-lime bg-lime-mid text-lime' : 'border-border bg-bg-2 text-text-light'} ${isEditingDays ? 'cursor-pointer hover:border-lime/50' : ''}`}
                    >
                      {d}
                    </div>
                  )
                })}
              </div>

              {/* Time Slots List */}
              <div className="mt-2 space-y-2">
                 {DAYS.map((d, i) => {
                    if (!editedDays[i]) return null;
                    return (
                      <div key={`time-${i}`} className="flex items-center justify-between bg-bg-2/50 p-2.5 rounded-lg border border-border/40 animate-pgIn">
                         <div className="flex items-center gap-2">
                            <span className="w-8 font-mono text-[11px] font-bold text-lime">{d}</span>
                            <span className="text-[11px] text-text-sub font-mono">{!isEditingDays ? editedDays[i] : ''}</span>
                         </div>
                         {isEditingDays && (
                           <input 
                             type="text" 
                             value={editedDays[i]} 
                             onChange={(e) => updateDayTime(i, e.target.value)}
                             className="bg-bg-3 border border-border rounded px-2 py-1 text-[11px] font-mono text-lime focus:outline-none focus:border-lime w-[120px] text-right"
                             placeholder="00:00 - 00:00"
                           />
                         )}
                         {!isEditingDays && (
                            <Clock size={14} className="text-text-muted" />
                         )}
                      </div>
                    )
                 })}
              </div>
           </div>
        </div>

        {/* Siswa Aktif */}
        <div className="bg-card rounded-xl p-4 border-[1.5px] border-border mb-3.5">
           <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] font-mono mb-[4px]">SISWA AKTIFKU ({TUTOR_DATA.activeStudents.length})</div>
           {TUTOR_DATA.activeStudents.map(s => (
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

        {/* Pending Reviews */}
        <div className="mb-3.5">
           <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] font-mono mb-2.5">REVIEW PERLU DILAKUKAN ({TUTOR_DATA.pendingReviews.length})</div>
           {TUTOR_DATA.pendingReviews.map(r => (
             <div key={r.id} onClick={() => setReviewModalTarget(r.student)} className="bg-card border-[1.5px] border-warning rounded-[12px] p-3 mb-2 cursor-pointer hover:shadow-[3px_3px_0_#F59E0B] hover:-translate-y-[1px] hover:-translate-x-[1px] transition-all">
                <div className="flex justify-between items-start">
                   <div className="flex gap-2.5 items-center">
                      <div className="w-[38px] h-[38px] rounded-lg flex items-center justify-center font-display font-extrabold text-white/90 text-[14px] shrink-0" style={{ background: r.avatarColor }}>
                        {r.student.split(' ').map(w=>w[0]).join('').substring(0,2)}
                      </div>
                      <div>
                         <div className="font-display text-[13px] font-bold">{r.student}</div>
                         <div className="text-[11px] text-text-sub font-mono">{r.subject} · {r.date}</div>
                         <div className="text-[11px] text-text-main mt-1">📖 {r.topic}</div>
                      </div>
                   </div>
                   <div className="text-right shrink-0 ml-2">
                       <div className="text-[10px] text-text-sub font-mono mb-1">{r.duration} mnt</div>
                       <div className="bg-warning/20 text-warning border border-warning/35 text-[10px] font-bold py-[3px] px-[9px] rounded-[4px] font-mono">Isi Review</div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* RIWAYAT MENGAJAR */}
        <div className="mb-2">
           <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] font-mono mb-2.5">RIWAYAT MENGAJAR</div>
           {TUTOR_DATA.teachingHistory.map(h => (
              <div key={h.id} className={`bg-card rounded-xl p-3 mb-2 border-[1.5px] border-border border-l-[3.5px] ${h.reviewed ? 'border-l-lime' : 'border-l-warning'}`}>
                 <div className="flex justify-between items-start">
                    <div>
                       <div className="font-display text-[13px] font-bold">
                         {h.student} <span className="text-text-sub font-normal text-[11px]">· {h.subject}</span>
                       </div>
                       <div className="text-[11px] text-text-sub font-mono mt-[2px]">{h.date} · {h.dur} mnt · {h.topic}</div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                       <div className="font-mono text-[12px] font-bold text-lime bg-lime-dim border border-lime/25 px-2 py-0.5 rounded-[4px] inline-block mb-0.5">+{h.xp} XP</div>
                       <div className="text-[10px] font-bold text-warning font-mono">★ {h.rating.toFixed(1)}</div>
                    </div>
                 </div>
                 {!h.reviewed ? (
                   <button onClick={() => setReviewModalTarget(h.student)} className="mt-2 bg-warning/10 text-warning border border-warning/30 rounded-[4px] px-3 py-[5px] text-[11px] font-bold font-mono cursor-pointer flex items-center gap-1 hover:bg-warning/20 transition-colors">
                     <PencilSimple strokeWidth={2.5} size={14} /> Isi Review Siswa
                   </button>
                 ) : (
                   <div className="mt-1.5 text-[10px] font-semibold text-lime font-mono">✓ Review terisi</div>
                 )}
              </div>
           ))}
        </div>

        <div className="h-8"></div>
        <button onClick={handleLogout} className="btn danger flex items-center justify-center gap-2 w-full max-w-[200px] mx-auto mt-4 py-3 bg-red-500/10 text-red-500 font-bold border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors">
          <LogOut size={18} /> Keluar
        </button>
        <div className="h-14"></div>
      </div>

      {/* Review Modal */}
      {reviewModalTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b-[1.5px] border-border bg-bg-2">
              <div className="font-display font-bold text-[16px]">Isi Laporan Sesi</div>
              <button 
                onClick={() => setReviewModalTarget(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-3 text-text-sub transition-colors"
              >
                <XIcon size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="text-[13px] text-text-sub mb-4">
                 Siswa: <strong className="text-text-main">{reviewModalTarget}</strong>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                 <label className="text-[11px] font-bold font-mono text-text-sub uppercase">Topik & Catatan Belajar</label>
                 <textarea 
                   className="w-full bg-bg-2 border-[1.5px] border-border rounded-lg p-3 text-[13px] focus:outline-none focus:border-lime min-h-[100px] resize-none"
                   placeholder="Materi yang dibahas dan progres siswa..."
                 ></textarea>
              </div>
              <button 
                onClick={() => setReviewModalTarget(null)}
                className="w-full bg-lime border-[2px] border-lime text-black font-bold font-display px-4 py-3 rounded-lg mt-2 cursor-pointer shadow-sh1 hover:shadow-sh2 hover:-translate-y-[1px] hover:-translate-x-[1px] transition-all"
              >
                Kirim Laporan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

