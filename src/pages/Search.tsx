import { Search as SearchIcon, Medal, Star } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { SUBJECTS, getTagStyle, getAvatarColor } from '../data';
import { useEffect, useState } from 'react';
import { formatRupiah } from '../data';

export function Search() {
  const { 
    searchQuery: search, 
    setSearchQuery: setSearch,
    genderFilter, 
    setGenderFilter,
    subjectFilter, 
    setSubjectFilter,
    setSelectedTutorId,
    tutors,
    isLoadingTutors
  } = useAppContext();

  const allSubjects = ["Semua", ...SUBJECTS];

  const filteredTutors = tutors.filter((t:any) => {
    const q = (search || "").toLowerCase();
    const tName = t.name || "";
    const tMajor = t.major || "";
    const mq = !q || 
               tName.toLowerCase().includes(q) || 
               (t.tags || []).some((s:any) => s && s.toLowerCase().includes(q)) || 
               tMajor.toLowerCase().includes(q);
    const ms = subjectFilter === "" || subjectFilter === "Semua" || (t.tags || []).includes(subjectFilter);
    const mg = genderFilter === 'all' || t.genderCode === genderFilter;
    return mq && ms && mg;
  });

  return (
    <div className="animate-pgIn w-full max-w-5xl mx-auto">
      <div className="sticky top-0 bg-bg-base/80 backdrop-blur-xl z-[5] border-b-[1.5px] border-border/60 pt-4 px-3.5 pb-2 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <input 
          type="text"
          className="w-full border-[1.5px] border-border/60 rounded-lg py-2.5 px-[13px] text-sm text-text-main bg-bg-2/70 focus:bg-bg-2 font-body transition-all focus:outline-none focus:border-lime focus:shadow-[0_0_0_2px_var(--color-lime-dim)] mb-2.5 backdrop-blur-sm"
          placeholder="Cari nama tutor atau mata pelajaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 items-center mb-3">
           <div className="text-[10px] font-bold text-text-sub font-mono uppercase whitespace-nowrap opacity-60">Gender:</div>
           <div className="flex-1 flex gap-1.5">
             {['all', 'F', 'M'].map(st => {
                const label = st === 'all' ? 'SEMUA' : st === 'F' ? 'WANITA' : 'PRIA';
                const active = genderFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => setGenderFilter(st)}
                    className={`flex-1 border-[1.5px] rounded-lg py-[7px] text-[10px] font-bold cursor-pointer font-mono whitespace-nowrap transition-all ${
                      active 
                        ? 'border-lime bg-lime-mid text-lime' 
                        : 'border-border bg-card text-text-sub hover:text-text-main'
                    }`}
                  >
                    {label}
                  </button>
                )
             })}
           </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
           {allSubjects.map(s => {
             const active = (s === 'Semua' && !subjectFilter) || subjectFilter === s;
             return (
               <button
                 key={s}
                 onClick={() => setSubjectFilter(s === 'Semua' ? '' : s)}
                 className={`border-[1.5px] rounded-lg px-[14px] py-[7px] text-[10px] cursor-pointer whitespace-nowrap font-mono transition-all font-bold tracking-tight uppercase ${
                   active ? 'border-lime bg-lime-mid text-lime' : 'border-border bg-card text-text-sub hover:text-text-main hover:bg-bg-3'
                 }`}
               >
                 {s}
               </button>
             )
           })}
        </div>
      </div>

      <div className="p-3.5 flex flex-col gap-2 pb-20">
        {filteredTutors.length === 0 ? (
          <div className="text-center py-10 px-5 text-text-light">
             <SearchIcon size={40} className="mx-auto mb-2 text-border" />
             <div className="font-mono text-[12px]">Tidak ada tutor yang cocok</div>
          </div>
        ) : (
          filteredTutors.map(t => (
            <div 
               key={t.id} 
               onClick={() => setSelectedTutorId(t.id)}
               className="bg-card/80 backdrop-blur-md rounded-xl p-3.5 border-[1.5px] border-border/60 cursor-pointer transition-all relative overflow-hidden hover:border-lime hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-lime group shadow-sm"
            >
               <div className="flex gap-[11px] items-start">
                 <div className="relative shrink-0">
                    <div className="rounded-lg flex items-center justify-center font-extrabold text-white/90 shrink-0 font-display" style={{width: 48, height: 48, fontSize: Math.round(48*0.36), background: getAvatarColor(t.name), border: '1.5px solid var(--color-lime-mid)'}}>
                      {t.initials}
                    </div>
                    <span className={`absolute -bottom-[1px] -right-[1px] w-3 h-3 rounded-full border-2 border-bg-base ${t.online ? 'bg-online' : 'bg-text-muted'}`}></span>
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-1.5 flex-wrap">
                     <div className="font-display text-[14px] font-bold">{t.name}</div>
                     <span className="px-2 py-[2px] rounded border font-mono text-[10px] font-bold whitespace-nowrap" style={{backgroundColor: t.tier === 'Gold' ? 'var(--color-gold-bg)' : t.tier === 'Silver' ? 'var(--color-silver-bg)' : 'var(--color-bronze-bg)', color: t.tier === 'Gold' ? 'var(--color-gold)' : t.tier === 'Silver' ? 'var(--color-silver)' : 'var(--color-bronze)', borderColor: t.tier === 'Gold' ? 'rgba(255,215,0,0.3)' : t.tier === 'Silver' ? 'rgba(176,176,176,0.3)' : 'rgba(205,127,50,0.3)'}}>
                       <Medal size={10} className="inline mr-1 -mt-0.5" /> {t.tier}
                     </span>
                   </div>
                   <div className="text-[11px] text-text-sub mt-px font-mono">{t.major} · {t.university}</div>
                   <div className="flex gap-1.5 items-center mt-[5px] flex-wrap">
                     <span className="text-warning text-[12px] font-bold font-mono whitespace-nowrap"><Star size={12} className="inline fill-warning -mt-0.5"/> {t.rating.toFixed(1)}</span>
                     <span className="text-[10px] text-text-sub font-mono whitespace-nowrap">{t.sessions} sesi</span>
                     <span className={`inline-flex items-center gap-[3px] px-2 py-[2px] rounded-sm text-[10px] font-bold font-mono border whitespace-nowrap ${t.genderClass}`}>
                       <span className="-mb-[1px]">{t.genderIcon}</span> {t.gender}
                     </span>
                   </div>
                 </div>
                 <div className="text-right shrink-0">
                   <div className="font-mono text-[15px] font-bold text-lime">{t.price}</div>
                   <div className="text-[10px] text-text-sub font-mono">/sesi</div>
                 </div>
               </div>
               
               <div className="flex gap-[5px] flex-wrap mt-[10px]">
                 {(t.tags || []).map((tag: string) => {
                   const st = getTagStyle(tag);
                   return (
                     <span key={tag} className="rounded px-[9px] py-[3px] text-[11px] font-semibold border border-border font-mono" style={{backgroundColor: st.bg, color: st.c, borderColor: st.c + '33'}}>{tag}</span>
                   )
                 })}
               </div>
               
               {t.badges && t.badges.length > 0 && (
                 <div className="flex gap-[5px] flex-wrap mt-[7px]">
                   {(t.badges || []).map((b: string) => (
                      <span key={b} className="bg-lime-dim text-lime border border-[color:var(--color-lime-mid)] rounded px-2 py-[2px] text-[10px] font-bold font-mono whitespace-nowrap">{b}</span>
                   ))}
                 </div>
               )}
            </div>
          ))
        )}
      </div>
      <div className="h-5"></div>
    </div>
  );
}
