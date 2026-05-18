import { TrendingUp, Award, Target, BookOpen } from 'lucide-react';
import { useAppContext } from '../AppContext';

export function StudentProgress() {
  const { userRole, userProfile, setActiveTab } = useAppContext();

  if (userRole === 'guest' || !userProfile) {
    return (
      <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full text-center mt-10">
        <h1 className="text-2xl font-bold font-display text-text-main mb-4">Progress Belajar</h1>
        <p className="text-sm text-text-sub mb-6">Silakan login untuk memantau perkembangan belajarmu.</p>
        <button 
          onClick={() => setActiveTab('login')} 
          className="bg-lime text-black font-bold py-3 px-8 rounded-lg hover:bg-lime-dim transition-colors"
        >
          Login Sekarang
        </button>
      </div>
    );
  }

  // TODO: Fetch real progress data from Supabase
  const isDataEmpty = true; // Temporary flag for empty state, can be replaced with real data check later

  if (isDataEmpty) {
     return (
      <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full text-center mt-10">
        <h1 className="text-2xl font-bold font-display text-text-main mb-4">Progress Belajar</h1>
        <p className="text-sm text-text-sub mb-6">Belum ada data progress. Mulai booking tutor dan selesaikan sesimu!</p>
        <button 
          onClick={() => setActiveTab('search')} 
          className="bg-lime text-black font-bold py-3 px-8 rounded-lg hover:bg-lime-dim transition-colors"
        >
          Cari Tutor
        </button>
      </div>
     );
  }

  return (
    <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-text-main">Progressku</h1>
        <p className="text-sm text-text-sub">Pantau perkembangan belajarmu dari waktu ke waktu.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
         <div className="bg-bg-2 border-[1.5px] border-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
           <BookOpen size={24} className="text-lime mb-2" />
           <div className="text-2xl font-bold font-display mb-1">12</div>
           <div className="text-[10px] text-text-sub font-mono uppercase tracking-wider">Total Sesi</div>
         </div>
         <div className="bg-bg-2 border-[1.5px] border-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
           <Target size={24} className="text-lime mb-2" />
           <div className="text-2xl font-bold font-display mb-1">3</div>
           <div className="text-[10px] text-text-sub font-mono uppercase tracking-wider">Subjek Aktif</div>
         </div>
         <div className="bg-bg-2 border-[1.5px] border-border rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-16 h-16 bg-[#00E5FF]/10 blur-xl rounded-full" />
           <Award size={24} className="text-[#00E5FF] mb-2" />
           <div className="text-2xl font-bold font-display mb-1">Lv. 4</div>
           <div className="text-[10px] text-text-sub font-mono uppercase tracking-wider">Mastery</div>
         </div>
         <div className="bg-bg-2 border-[1.5px] border-border rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
           <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#FF3366]/10 blur-xl rounded-full" />
           <TrendingUp size={24} className="text-[#FF3366] mb-2" />
           <div className="text-2xl font-bold font-display mb-1">15h</div>
           <div className="text-[10px] text-text-sub font-mono uppercase tracking-wider">Wrote Waktu Belajar</div>
         </div>
      </div>

      <h2 className="text-lg font-bold font-display text-text-main mb-4">Mastery per Mata Pelajaran</h2>
      
      <div className="flex flex-col gap-4">
         {/* Subject 1 */}
         <div className="bg-card border-[1.5px] border-border rounded-xl p-5">
            <div className="flex justify-between items-end mb-3">
               <div>
                  <h3 className="font-bold text-lg font-display">Matematika SMA</h3>
                  <p className="text-xs text-text-sub">8 Sesi Selesai</p>
               </div>
               <div className="text-lime font-bold text-lg font-display tracking-tight">Intermediate</div>
            </div>
            
            <div className="h-2 w-full bg-bg-2 rounded-full mb-4 overflow-hidden relative border border-border/50">
               <div className="h-full bg-lime rounded-full w-[65%]"></div>
               <div className="absolute right-0 top-0 h-full w-[35%] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiMzMzMzMzMiLz48L3N2Zz4=')] opacity-20 hidden md:block"></div>
            </div>
            
            <h4 className="font-bold mb-2 text-text-muted uppercase text-[10px] tracking-widest font-mono">Topik yang Dikuasai</h4>
            <div className="flex flex-wrap gap-2">
               <span className="bg-bg-3 text-text-sub text-[11px] px-2 py-1 rounded border border-border">Turunan</span>
               <span className="bg-bg-3 text-text-sub text-[11px] px-2 py-1 rounded border border-border">Integral Dasar</span>
               <span className="bg-lime-mid text-lime font-medium text-[11px] px-2 py-1 rounded border border-lime/30">Trigonometri (On Progress)</span>
            </div>
         </div>

         {/* Subject 2 */}
         <div className="bg-card border-[1.5px] border-border rounded-xl p-5">
            <div className="flex justify-between items-end mb-3">
               <div>
                  <h3 className="font-bold text-lg font-display">Fisika Dasar</h3>
                  <p className="text-xs text-text-sub">4 Sesi Selesai</p>
               </div>
               <div className="text-[#00E5FF] font-bold text-lg font-display tracking-tight">Beginner</div>
            </div>
            
            <div className="h-2 w-full bg-bg-2 rounded-full mb-4 overflow-hidden border border-border/50">
               <div className="h-full bg-[#00E5FF] rounded-full w-[30%]"></div>
            </div>
            
            <h4 className="font-bold mb-2 text-text-muted uppercase text-[10px] tracking-widest font-mono">Topik yang Dikuasai</h4>
            <div className="flex flex-wrap gap-2">
               <span className="bg-bg-3 text-text-sub text-[11px] px-2 py-1 rounded border border-border">Besaran & Satuan</span>
               <span className="bg-bg-3 text-text-sub text-[11px] px-2 py-1 rounded border border-border">Gerak Lurus</span>
               <span className="bg-[#00E5FF]/10 text-[#00E5FF] font-medium text-[11px] px-2 py-1 rounded border border-[#00E5FF]/30">Hukum Newton (On Progress)</span>
            </div>
         </div>
      </div>
    </div>
  );
}
