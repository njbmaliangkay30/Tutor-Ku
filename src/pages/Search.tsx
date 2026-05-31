import { Search as SearchIcon, Medal, Star } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { SUBJECTS, getTagStyle, getAvatarColor } from '../data';
import { useEffect, useState } from 'react';
import { formatRupiah } from '../data';
import { useTranslation } from '../hooks/useTranslation';

export function Search() {
  const { t } = useTranslation();
  const { 
    searchQuery: search, 
    setSearchQuery: setSearch,
    genderFilter, 
    setGenderFilter,
    subjectFilter, 
    setSubjectFilter,
    setSelectedTutorId,
    tutors,
    isLoadingTutors,
    fetchTutors
  } = useAppContext();

  useEffect(() => {
    fetchTutors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const englishSubjects: Record<string, string> = {
    "Semua": "ALL",
    "Matematika": "MATHEMATICS",
    "Fisika": "PHYSICS",
    "Kimia": "CHEMISTRY",
    "Biologi": "BIOLOGY",
    "Bahasa Inggris": "ENGLISH",
    "Pemrograman": "PROGRAMMING",
    "Ekonomi": "ECONOMICS",
    "Akuntansi": "ACCOUNTING",
    "Statistika": "STATISTICS"
  };

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
    const isV = t.isVerified;
    return isV && mq && ms && mg;
  });

  return (
    <div className="animate-pgIn w-full max-w-5xl mx-auto">
      <div className="sticky top-0 bg-bg-base z-[5] border-b-[1.5px] border-border/60 pb-2 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        {/* Banner with Search Input */}
        <div className="m-3.5 rounded-2xl px-5 py-[26px] bg-primary border-[2px] border-primary-bright relative overflow-hidden shadow-green md:p-8 md:py-10">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0px, rgba(255,255,255,.025) 1px, transparent 1px, transparent 22px), repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0px, rgba(255,255,255,.025) 1px, transparent 1px, transparent 22px)'}}></div>
          <div className="absolute w-[200px] h-[200px] -top-[60px] -right-[40px] rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, var(--color-lime-mid) 0%, transparent 70%)'}}></div>
          
          <div className="absolute top-[14px] right-[14px] font-mono text-[9px] font-bold text-white/20 tracking-[0.12em] uppercase whitespace-pre pointer-events-none select-none text-right">
            TUTORKU{'\n'}V5.0
          </div>

          <div className="text-[9px] font-bold text-lime tracking-[0.15em] uppercase mb-2.5 flex items-center gap-2 relative z-10 font-mono">
            <span>◆</span> {t('explore.platform')}
          </div>
          
          <div className="font-display text-[24px] md:text-[28px] font-extrabold text-white leading-[1.1] mb-2.5 tracking-[-0.5px] relative z-10">
            {t('explore.learn_smarter').split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}<span className="text-lime">{t('explore.best_tutors')}</span>
          </div>
          
          <div className="text-[13px] text-white/65 leading-[1.6] mb-[18px] relative z-10 max-w-[400px]">
            {t('explore.description')}
          </div>
          
          <div className="relative z-10">
            <input 
              type="text"
              className="w-full border-[2px] border-lime/50 rounded-lg py-3.5 px-4 text-sm text-black bg-white focus:outline-none focus:border-lime focus:shadow-[0_0_0_4px_rgba(204,255,0,0.2)] transition-all font-bold placeholder:font-semibold placeholder:text-gray-500"
              placeholder={t('explore.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="px-3.5 space-y-3">
          <div className="flex gap-2 items-center tour-filter-gender">
             <div className="text-[10px] font-bold text-text-sub font-mono uppercase whitespace-nowrap opacity-60">{t('explore.gender')}</div>
             <div className="flex-1 flex gap-1.5">
               {['all', 'F', 'M'].map(st => {
                  const label = st === 'all' ? t('explore.all') : st === 'F' ? t('explore.female') : t('explore.male');
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
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] tour-filter-subject">
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
                   {englishSubjects[s] || s}
                 </button>
               )
             })}
          </div>
        </div>
      </div>

      <div className="p-3.5 flex flex-col gap-2 pb-20 tour-tutor-card-list">
        {filteredTutors.length === 0 ? (
          <div className="text-center py-10 px-5 text-text-light">
             <SearchIcon size={40} className="mx-auto mb-2 text-border" />
             <div className="font-mono text-[12px]">{t('explore.no_tutors')}</div>
          </div>
        ) : (
          filteredTutors.map((tutor: any, idx: number) => (
            <div 
               key={tutor.id} 
               onClick={() => setSelectedTutorId(tutor.id)}
               className={`bg-card/80 backdrop-blur-md rounded-xl p-3.5 border-[1.5px] border-border/60 cursor-pointer transition-all relative overflow-hidden hover:border-lime hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-lime group shadow-sm ${idx === 0 ? 'tour-tutor-card' : ''}`}
            >
               <div className="flex gap-[11px] items-start">
                 <div className="relative shrink-0">
                    <div className="rounded-lg flex items-center justify-center font-extrabold text-white/90 shrink-0 font-display" style={{width: 48, height: 48, fontSize: Math.round(48*0.36), background: getAvatarColor(tutor.name), border: '1.5px solid var(--color-lime-mid)'}}>
                      {tutor.initials}
                    </div>

                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-1.5 flex-wrap">
                     <div className="font-display text-[14px] font-bold">{tutor.name}</div>
                     <span className="px-2 py-[2px] rounded border font-mono text-[10px] font-bold whitespace-nowrap" style={{backgroundColor: tutor.tier === 'Gold' ? 'var(--color-gold-bg)' : tutor.tier === 'Silver' ? 'var(--color-silver-bg)' : 'var(--color-bronze-bg)', color: tutor.tier === 'Gold' ? 'var(--color-gold)' : tutor.tier === 'Silver' ? 'var(--color-silver)' : 'var(--color-bronze)', borderColor: tutor.tier === 'Gold' ? 'rgba(255,215,0,0.3)' : tutor.tier === 'Silver' ? 'rgba(176,176,176,0.3)' : 'rgba(205,127,50,0.3)'}}>
                       <Medal size={10} className="inline mr-1 -mt-0.5" /> {tutor.tier}
                     </span>
                   </div>
                   <div className="text-[11px] text-text-sub mt-px font-mono">{(t(`subjects.${tutor.major}`) !== `subjects.${tutor.major}`) ? t(`subjects.${tutor.major}`) : tutor.major} · {tutor.university}</div>
                   <div className="flex gap-1.5 items-center mt-[5px] flex-wrap">
                     <span className="text-warning text-[12px] font-bold font-mono whitespace-nowrap"><Star size={12} className="inline fill-warning -mt-0.5"/> {tutor.rating.toFixed(1)}</span>
                     <span className="text-[10px] text-text-sub font-mono whitespace-nowrap">{tutor.sessions} {t('explore.sessions')}</span>
                     <span className={`inline-flex items-center gap-[3px] px-2 py-[2px] rounded-sm text-[10px] font-bold font-mono border whitespace-nowrap ${tutor.genderClass}`}>
                       <span className="-mb-[1px]">{tutor.genderIcon}</span> {tutor.genderCode === 'F' ? t('explore.gender_female') : t('explore.gender_male')}
                     </span>
                     {tutor.learningStyles && Array.isArray(tutor.learningStyles) && tutor.learningStyles.includes('Bisa Bahasa Inggris') && (
                       <span className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-violet-300 font-medium tracking-wider w-fit whitespace-nowrap">{t('explore.bilingual')}</span>
                     )}
                   </div>
                 </div>
                 <div className="text-right shrink-0">
                   <div className="font-mono text-[15px] font-bold text-lime">{tutor.price}</div>
                   <div className="text-[10px] text-text-sub font-mono">{t('explore.per_session')}</div>
                 </div>
               </div>
               
               <div className="flex gap-[5px] flex-wrap mt-[10px]">
                 {(tutor.tags || []).filter(Boolean).map((tag: string) => {
                   const st = getTagStyle(tag);
                   return (
                     <span key={tag} className="rounded px-[9px] py-[3px] text-[11px] font-semibold border border-border font-mono" style={{backgroundColor: st.bg, color: st.c, borderColor: st.c + '33'}}>{(t(`subjects.${tag}`) !== `subjects.${tag}`) ? t(`subjects.${tag}`) : tag}</span>
                   )
                 })}
               </div>
                              {tutor.learningStyles && Array.isArray(tutor.learningStyles) && tutor.learningStyles.length > 0 && (
                  <div className="flex gap-[5px] flex-wrap mt-[7px]">
                    {(tutor.learningStyles).filter((s: any) => typeof s === 'string' && s.startsWith('Jenjang')).sort((a: string, b: string) => {
                       const order: any = { 'Jenjang: SD': 1, 'Jenjang: SMP': 2, 'Jenjang: SMA': 3, 'Jenjang: Mahasiswa/Umum': 4 };
                       return (order[a] || 99) - (order[b] || 99);
                    }).map((s: string) => {
                       const level = s.replace('Jenjang: ', '');
         let dotColor = "bg-text-sub";
         if (level === 'SD') dotColor = "bg-rose-400";
         else if (level === 'SMP') dotColor = "bg-sky-400";
         else if (level === 'SMA') dotColor = "bg-slate-400";
         let levelMap: Record<string, string> = {
            'SD': 'Elementary School (SD)',
            'SMP': 'Middle School (SMP)',
            'SMA': 'High School (SMA)',
            'Mahasiswa/Umum': 'College/General'
         };

         let trLevel = level;
         // It might be better to just extract it cleanly. If language is 'en', we translate it. We can add to `i18n.ts` but doing condition here is simpler for `app-level` state if we don't have access to current lang directly, but wait `t` does that if we add it to `explore` dict.
         trLevel = t(`explore.level_${level.replace('/', '_').toLowerCase()}`) !== `explore.level_${level.replace('/', '_').toLowerCase()}` ? t(`explore.level_${level.replace('/', '_').toLowerCase()}`) : level;

         return (
           <span key={s} className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-text-main font-medium tracking-wider flex items-center gap-1.5 whitespace-nowrap w-fit">
             <span className={`w-1 h-1 rounded-full shrink-0 ${dotColor}`}></span> {trLevel}
           </span>
         );
       })}
                  </div>
                )}
                
                {tutor.badges && Array.isArray(tutor.badges) && tutor.badges.length > 0 && (
                  <div className="flex gap-[5px] flex-wrap mt-[7px]">
                   {(tutor.badges || []).map((b: string) => (
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
