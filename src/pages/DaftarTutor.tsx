import { useState } from 'react';
import { useAppContext } from '../AppContext';

export function DaftarTutor() {
  const { setActiveTab } = useAppContext();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  const toggleSubject = (s: string) => {
    setSelectedSubjects(prev => 
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleKirim = () => {
    setActiveTab('home');
  };

  const benefits = [
    { icon: '💰', title: 'Penghasilan tambahan', desc: 'Rp 45.000–85.000/sesi berdasarkan keahlian' },
    { icon: '⏰', title: 'Jadwal fleksibel', desc: 'Atur sendiri hari aktif mengajarmu' },
    { icon: '🏆', title: 'Sistem XP & Tier', desc: 'Berkembang dari Bronze → Silver → Gold' },
    { icon: '📱', title: 'Platform digital', desc: 'Semua dikelola lewat app — mudah & efisien' },
  ];

  const requirements = [
    'Mahasiswa aktif S1 minimal semester 3',
    'IPK minimal 3.00 (diverifikasi)',
    'Scan KTM dan transkrip nilai',
    'Interview online 15–30 menit'
  ];

  const subjects = ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Inggris', 'Pemrograman', 'Ekonomi', 'Akuntansi', 'Statistika'];

  return (
    <div className="p-4 md:p-6 lg:p-8 animate-pgIn max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <div className="text-[10px] font-bold text-lime tracking-[0.15em] uppercase mb-2.5 flex items-center gap-2 font-mono">
          <span>◆</span> BERGABUNG SEBAGAI TUTOR
        </div>
        <div className="font-display text-[26px] font-extrabold mb-1.5 leading-[1.1]">
          Jadilah tutor <span className="text-lime">terverifikasi</span>
        </div>
        <div className="text-[13px] text-text-sub leading-[1.6]">
          Bagikan ilmumu, bantu sesama, dan dapatkan penghasilan tambahan sebagai mahasiswa.
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-md rounded-xl p-4 border-[1.5px] border-border/60 border-l-[3px] border-l-lime mb-3.5 shadow-sm">
        <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-2.5 font-mono">
          KEUNTUNGAN MENJADI TUTOR
        </div>
        <div>
          {benefits.map((b, i) => (
            <div key={i} className={`flex gap-2.5 py-2 ${i !== benefits.length - 1 ? 'border-b border-border' : ''}`}>
              <span className="text-[20px]">{b.icon}</span>
              <div>
                <div className="font-display font-bold text-[13px]">{b.title}</div>
                <div className="text-[11px] text-text-sub">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-md rounded-xl p-4 border-[1.5px] border-border/60 mb-3.5 shadow-sm">
        <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-2.5 font-mono">
          SYARAT PENDAFTARAN
        </div>
        <div>
          {requirements.map((r, i) => (
            <div key={i} className={`flex gap-2.5 items-start py-[7px] ${i !== requirements.length - 1 ? 'border-b border-border' : ''}`}>
              <span className="font-mono text-[11px] text-lime font-bold shrink-0 bg-lime-dim border border-[rgba(200,255,0,0.2)] rounded w-6 h-6 flex items-center justify-center">
                {i + 1}
              </span>
              <div className="text-[13px] mt-0.5">{r}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-md rounded-xl p-4 border-[1.5px] border-border/60 mb-6 shadow-sm">
        <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-4 font-mono">
          FORMULIR PENDAFTARAN
        </div>

        <div className="flex flex-col gap-[5px] mb-2.5">
           <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">Universitas</label>
           <input type="text" placeholder="Universitas Indonesia" className="border-[1.5px] border-border rounded-lg px-[13px] py-2.5 text-[14px] bg-bg-2 text-text-main font-body focus:outline-none focus:border-lime focus:shadow-[0_0_0_2px_var(--color-lime-dim)] transition-all"/>
        </div>

        <div className="flex flex-col gap-[5px] mb-2.5">
           <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">Jurusan</label>
           <input type="text" placeholder="Teknik Informatika" className="border-[1.5px] border-border rounded-lg px-[13px] py-2.5 text-[14px] bg-bg-2 text-text-main font-body focus:outline-none focus:border-lime focus:shadow-[0_0_0_2px_var(--color-lime-dim)] transition-all"/>
        </div>

        <div className="flex flex-col gap-[5px] mb-2.5">
           <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">Semester</label>
           <select className="border-[1.5px] border-border rounded-lg px-[13px] py-2.5 text-[14px] bg-bg-2 text-text-main font-body focus:outline-none focus:border-lime focus:shadow-[0_0_0_2px_var(--color-lime-dim)] transition-all appearance-none outline-none" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\\\'http://www.w3.org/2000/svg\\\' fill=\\\'none\\\' viewBox=\\\'0 0 24 24\\\' stroke=\\\'%23555\\\'%3E%3Cpath stroke-linecap=\\\'round\\\' stroke-linejoin=\\\'round\\\' stroke-width=\\\'2\\\' d=\\\'M19 9l-7 7-7-7\\\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px'}}>
              {[3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
           </select>
        </div>

        <div className="flex flex-col gap-[5px] mb-2.5">
           <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">Mata Pelajaran (pilih yang dikuasai)</label>
           <div className="flex flex-wrap gap-1.5 mt-1">
             {subjects.map(s => {
               const isSelected = selectedSubjects.includes(s);
               return (
                 <div 
                   key={s} 
                   onClick={() => toggleSubject(s)}
                   className={`px-3 py-1.5 rounded-[4px] border-[1.5px] text-[11px] font-semibold cursor-pointer font-mono transition-all ${isSelected ? 'border-lime bg-lime-mid text-lime' : 'border-border bg-bg-2 text-text-sub hover:bg-bg-3'}`}
                 >
                   {s}
                 </div>
               )
             })}
           </div>
        </div>

        <div className="flex flex-col gap-[5px] mb-4">
           <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">Tarif per sesi (Rp)</label>
           <input type="number" placeholder="65000" className="border-[1.5px] border-border rounded-lg px-[13px] py-2.5 text-[14px] bg-bg-2 text-text-main font-body focus:outline-none focus:border-lime focus:shadow-[0_0_0_2px_var(--color-lime-dim)] transition-all"/>
        </div>

        <button 
          onClick={handleKirim}
          className="w-full bg-lime text-black border-[2px] border-lime rounded-lg py-[11px] px-[18px] font-display font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-sh1 transition-all hover:shadow-sh2 hover:-translate-x-px hover:-translate-y-px active:scale-[0.97]"
        >
          Kirim Pendaftaran
        </button>

      </div>
      
    </div>
  );
}
