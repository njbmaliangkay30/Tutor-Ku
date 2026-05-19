import { TrendingUp, Award, Target, BookOpen, MessageSquare, ClipboardList, Star } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';

export function StudentProgress() {
  const { userRole, userProfile, setActiveTab, user } = useAppContext();
  const [sessions, setSessions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!userProfile) return;
      setIsLoading(true);
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('student_id', userProfile.id)
          .in('status', ['completed', 'accepted', 'pending', 'waiting_for_student']);
        
        if (!sessionError && sessionData) {
          setSessions(sessionData);
        }

        const { data: reportData, error: reportError } = await supabase
          .from('session_reports')
          .select(`
            *,
            sessions (subject, session_date),
            tutor_profiles (profiles (full_name))
          `)
          .order('created_at', { ascending: false });
        
        if (!reportError && reportData) {
          setReports(reportData);
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

      <h2 className="text-lg font-bold font-display text-text-main mb-4 mt-8 flex items-center gap-2">
        <MessageSquare size={20} className="text-lime" />
        Feedback Tutor Terbaru
      </h2>

      <div className="flex flex-col gap-3 mb-8">
        {reports.length === 0 ? (
          <div className="text-center py-8 bg-bg-2 border border-border rounded-xl text-text-sub text-sm">
            Belum ada feedback dari tutor. Selesaikan satu sesi untuk melihat laporan.
          </div>
        ) : (
          reports.slice(0, 3).map((report) => (
            <div 
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="bg-card border-[1.5px] border-border rounded-xl p-4 cursor-pointer hover:border-lime/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                   <h3 className="font-bold text-sm text-text-main group-hover:text-lime transition-colors">{report.sessions?.subject}</h3>
                   <p className="text-[10px] text-text-sub font-mono uppercase tracking-wider">{new Date(report.sessions?.session_date).toLocaleDateString()}</p>
                </div>
                <div className="flex text-warning">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill={i < report.student_understanding_level ? "currentColor" : "none"} strokeOpacity={i < report.student_understanding_level ? 1 : 0.3} />
                  ))}
                </div>
              </div>
              <p className="text-[12px] text-text-sub line-clamp-2 italic mb-3">"{report.summary}"</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-lime font-display">Oleh {report.tutor_profiles?.profiles?.full_name}</span>
                <span className="text-[10px] font-mono text-text-sub bg-bg-3 px-2 py-0.5 rounded border border-border">Klik untuk Detail</span>
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="text-lg font-bold font-display text-text-main mb-4">Mastery per Mata Pelajaran</h2>

      <div className="flex flex-col gap-4 mb-10">
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
      </div>

      {selectedReport && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-pgIn">
           <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh2 animate-slideUp overflow-hidden">
              <div className="p-4 border-b border-border bg-bg-2 flex justify-between items-center">
                 <h3 className="font-bold font-display">Laporan Sesi</h3>
                 <button onClick={() => setSelectedReport(null)} className="text-text-sub hover:text-text-main">
                    <BookOpen size={20} />
                 </button>
              </div>
              <div className="p-6">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-lime/10 border border-lime/30 flex items-center justify-center text-lime">
                       <ClipboardList size={24} />
                    </div>
                    <div>
                       <div className="font-bold font-display text-lg">{selectedReport.sessions?.subject}</div>
                       <div className="text-xs text-text-sub font-mono uppercase">{new Date(selectedReport.sessions?.session_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div>
                       <div className="text-[10px] text-text-sub font-mono uppercase tracking-widest mb-2 font-bold">Ringkasan Materi</div>
                       <p className="text-sm text-text-main leading-relaxed bg-bg-2 p-4 rounded-xl border border-border/50">"{selectedReport.summary}"</p>
                    </div>
                    
                    {selectedReport.homework && (
                       <div>
                          <div className="text-[10px] text-text-sub font-mono uppercase tracking-widest mb-2 font-bold">Tugas Mandiri (PR)</div>
                          <p className="text-sm text-lime bg-lime/5 p-4 rounded-xl border border-lime/20 font-medium">📝 {selectedReport.homework}</p>
                       </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-border/50">
                       <div className="text-xs text-text-sub">Tingkat Pemahaman</div>
                       <div className="flex gap-1 text-warning">
                          {[...Array(5)].map((_, i) => (
                             <Star key={i} size={14} fill={i < selectedReport.student_understanding_level ? "currentColor" : "none"} strokeOpacity={i < selectedReport.student_understanding_level ? 1 : 0.4} />
                          ))}
                       </div>
                    </div>
                 </div>

                 <button 
                  onClick={() => setSelectedReport(null)}
                  className="w-full mt-8 bg-lime text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                 >
                    Mengerti
                 </button>
              </div>
           </div>
        </div>, document.body
      )}
    </div>
  );
}
