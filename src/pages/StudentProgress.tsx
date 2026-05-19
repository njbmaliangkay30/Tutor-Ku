import { TrendingUp, Award, Target, BookOpen } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function StudentProgress() {
  const { userRole, userProfile, setActiveTab, user } = useAppContext();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!userProfile) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('student_id', userProfile.id)
          .in('status', ['completed', 'accepted', 'pending']);
        
        if (!error && data) {
          setSessions(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
         setIsLoading(false);
      }
    };

    fetchProgress();
  }, [userProfile]);

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

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full text-center mt-10">
         <div className="w-8 h-8 rounded-full border-4 border-lime/30 border-t-lime animate-spin mx-auto"></div>
      </div>
    );
  }

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const subjectsMap: Record<string, number> = {};
  
  completedSessions.forEach(s => {
    if (!subjectsMap[s.subject]) subjectsMap[s.subject] = 0;
    subjectsMap[s.subject]++;
  });

  const uniqueSubjectsCount = Object.keys(subjectsMap).length;
  // Let's approximate mastery level and hours
  const totalHours = completedSessions.reduce((acc, obj) => {
    const start = new Date("1970-01-01T" + obj.start_time).getTime();
    const end = new Date("1970-01-01T" + obj.end_time).getTime();
    return acc + (end - start) / 3600000;
  }, 0);
  
  const totalMasteryLvl = Math.floor(Math.sqrt(totalHours * 2)) + 1;

  if (sessions.length === 0) {
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
           <div className="text-2xl font-bold font-display mb-1">{completedSessions.length}</div>
           <div className="text-[10px] text-text-sub font-mono uppercase tracking-wider">Sesi Selesai</div>
         </div>
         <div className="bg-bg-2 border-[1.5px] border-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
           <Target size={24} className="text-lime mb-2" />
           <div className="text-2xl font-bold font-display mb-1">{uniqueSubjectsCount}</div>
           <div className="text-[10px] text-text-sub font-mono uppercase tracking-wider">Subjek Aktif</div>
         </div>
         <div className="bg-bg-2 border-[1.5px] border-border rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-16 h-16 bg-[#00E5FF]/10 blur-xl rounded-full" />
           <Award size={24} className="text-[#00E5FF] mb-2" />
           <div className="text-2xl font-bold font-display mb-1">Lv. {totalMasteryLvl}</div>
           <div className="text-[10px] text-text-sub font-mono uppercase tracking-wider">Mastery</div>
         </div>
         <div className="bg-bg-2 border-[1.5px] border-border rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
           <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#FF3366]/10 blur-xl rounded-full" />
           <TrendingUp size={24} className="text-[#FF3366] mb-2" />
           <div className="text-2xl font-bold font-display mb-1">{totalHours.toFixed(1)}h</div>
           <div className="text-[10px] text-text-sub font-mono uppercase tracking-wider">Total Belajar</div>
         </div>
      </div>

      <h2 className="text-lg font-bold font-display text-text-main mb-4">Mastery per Mata Pelajaran</h2>
      
      <div className="flex flex-col gap-4">
         {Object.entries(subjectsMap).map(([subject, count], idx) => {
           const levels = ["Beginner", "Novice", "Intermediate", "Advanced", "Expert"];
           const lvlIdx = Math.min(Math.floor(count / 2), 4);
           const levelStr = levels[lvlIdx];
           const progressPct = Math.min((count % 2) * 50 + 50, 100); // just arbitrary representation

           return (
             <div key={subject} className="bg-card border-[1.5px] border-border rounded-xl p-5">
               <div className="flex justify-between items-end mb-3">
                  <div>
                     <h3 className="font-bold text-lg font-display">{subject}</h3>
                     <p className="text-xs text-text-sub">{count} Sesi Selesai</p>
                  </div>
                  <div className="text-lime font-bold text-lg font-display tracking-tight">{levelStr}</div>
               </div>
               
               <div className="h-2 w-full bg-bg-2 rounded-full mb-4 overflow-hidden relative border border-border/50">
                  <div className="h-full bg-lime rounded-full" style={{width: `${progressPct}%`}}></div>
                  <div className="absolute right-0 top-0 h-full w-[35%] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiMzMzMzMzMiLz48L3N2Zz4=')] opacity-20 hidden md:block"></div>
               </div>
             </div>
           );
         })}
         {Object.keys(subjectsMap).length === 0 && (
           <div className="text-center bg-bg-2 p-6 rounded-xl border border-border mt-4">
              <span className="text-text-sub text-sm">Selesaikan setidaknya 1 sesi untuk melihat progress per mapel.</span>
           </div>
         )}
      </div>
    </div>
  );
}
