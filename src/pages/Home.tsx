import { useEffect } from 'react';
import { Search, ChevronRight, Sigma, Atom, Languages, Code2, Medal, Flame, Star } from 'lucide-react';
import { getTagStyle, getAvatarColor } from '../data';
import { useAppContext } from '../AppContext';

export function PageHome() {
  const { setActiveTab, setSubjectFilter, setSelectedTutorId, tutors, fetchTutors } = useAppContext();

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  const categories = [
    { icon: Sigma, label: 'Hitung', keyword: 'Matematika' },
    { icon: Atom, label: 'Sains', keyword: 'Kimia' },
    { icon: Languages, label: 'Bahasa', keyword: 'Bahasa Inggris' },
    { icon: Code2, label: 'Coding', keyword: 'Pemrograman' },
  ];

  const handleCategoryClick = (keyword: string) => {
    setSubjectFilter(keyword);
    setActiveTab('search');
  };

  const handleSearchClick = () => {
    setActiveTab('search');
  };

  const visibleTutors = tutors.filter(t => t.isVerified).slice(0, 3);

  return (
    <div className="p-0 animate-pgIn pb-5 max-w-5xl mx-auto w-full">
      {/* Hero */}
      <div className="m-3.5 rounded-2xl px-5 py-[26px] bg-primary border-[2px] border-primary-bright relative overflow-hidden shadow-green md:p-10 md:py-12">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0px, rgba(255,255,255,.025) 1px, transparent 1px, transparent 22px), repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0px, rgba(255,255,255,.025) 1px, transparent 1px, transparent 22px)'}}></div>
        <div className="absolute w-[200px] h-[200px] -top-[60px] -right-[40px] rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, var(--color-lime-mid) 0%, transparent 70%)'}}></div>
        
        <div className="absolute top-[14px] right-[14px] font-mono text-[9px] font-bold text-white/20 tracking-[0.12em] uppercase whitespace-pre pointer-events-none select-none text-right">
          TUTORKU{'\n'}V5.0
        </div>

        <div className="text-[9px] font-bold text-lime tracking-[0.15em] uppercase mb-2.5 flex items-center gap-2 relative z-10 font-mono">
          <span>◆</span> PLATFORM TUTOR TERVERIFIKASI
        </div>
        
        <div className="font-display text-[28px] font-extrabold text-white leading-[1.1] mb-2.5 tracking-[-0.5px] relative z-10">
          Belajar lebih<br/>cerdas dengan <span className="text-lime">tutor terbaik</span>
        </div>
        
        <div className="text-[13px] text-white/65 leading-[1.6] mb-[18px] relative z-10 max-w-[400px]">
          Temukan tutor mahasiswa terverifikasi untuk pelajaran favoritmu. Fleksibel, terjangkau, efektif.
        </div>
        
        <button 
          onClick={handleSearchClick}
          className="inline-flex items-center gap-2 bg-lime text-black rounded-lg px-[18px] py-2.5 text-[13px] font-extrabold cursor-pointer font-display transition-all relative z-10 border-[2px] border-lime shadow-sh1 tracking-[0.01em] hover:shadow-[4px_4px_0_#000] hover:-translate-y-px hover:-translate-x-px uppercase"
        >
          <Search size={16} strokeWidth={3} /> Cari tutor sekarang
        </button>
      </div>

      {/* Quick Cats */}
      <div className="pt-6 px-3.5 pb-0">
        <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-2.5 font-mono">
          KATEGORI POPULER
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {categories.map((cat, idx) => (
            <div 
              key={idx} 
              onClick={() => handleCategoryClick(cat.keyword)}
              className="flex flex-col items-center gap-[5px] bg-card border-[1.5px] border-border py-[11px] px-1.5 rounded-lg cursor-pointer transition-all hover:border-lime hover:bg-lime-dim group"
            >
              <cat.icon size={20} className="text-lime" strokeWidth={2.5}/>
              <span className="text-[10px] font-semibold text-text-sub font-mono group-hover:text-lime group-hover:font-bold">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tutor Rekomendasi */}
      <div className="px-3.5 pt-0">
        <div className="flex justify-between items-center mb-2.5">
          <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-0 font-mono">
            TUTOR REKOMENDASI
          </div>
          <button onClick={handleSearchClick} className="bg-transparent border-none cursor-pointer text-[11px] font-bold text-lime font-mono">
            Lihat semua →
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {visibleTutors.map(t => (
             <div 
               key={t.id} 
               onClick={() => setSelectedTutorId(t.id)}
               className="bg-card rounded-xl p-3.5 border-[1.5px] border-border cursor-pointer transition-all relative overflow-hidden hover:border-lime hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-lime group shadow-sm"
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
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-3.5 py-4 pb-20">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl p-3 border-[1.5px] border-border text-center transition-colors hover:border-border-2 shadow-sm">
            <div className="font-mono text-[22px] font-bold text-lime leading-none">12</div>
            <div className="text-[9px] text-text-sub mt-2 font-mono uppercase font-semibold">TUTOR</div>
          </div>
          <div className="bg-card rounded-xl p-3 border-[1.5px] border-border text-center transition-colors hover:border-border-2 shadow-sm">
            <div className="font-mono text-[22px] font-bold text-lime leading-none">47</div>
            <div className="text-[9px] text-text-sub mt-2 font-mono uppercase font-semibold">SESI</div>
          </div>
          <div className="bg-card rounded-xl p-3 border-[1.5px] border-border text-center transition-colors hover:border-border-2 shadow-sm">
            <div className="font-mono text-[22px] font-bold text-lime leading-none">4.9</div>
            <div className="text-[9px] text-text-sub mt-2 font-mono uppercase font-semibold">RATING</div>
          </div>
        </div>
      </div>
      <div className="h-5"></div>
    </div>
  );
}
