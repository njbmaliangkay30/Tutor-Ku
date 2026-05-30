import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';
import { Calendar, Package, ArrowRight, BookOpen, Clock, Activity, Video } from 'lucide-react';

export function StudentDashboard() {
  const { userProfile, setActiveTab, setTargetSessionId } = useAppContext();
  const [upcomingSession, setUpcomingSession] = useState<any | null>(null);
  const [activePackages, setActivePackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    fetchDashboardData();
  }, [userProfile]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch next upcoming session
      const nowRaw = new Date();
      // Adjust timezone appropriately if needed, or simple ISO string:
      const dateString = nowRaw.toISOString().split('T')[0];
      
      const { data: sessionData } = await supabase
        .from('sessions')
        .select(`
          *,
          tutor_profiles(id, profiles(full_name, avatar_url))
        `)
        .eq('student_id', userProfile?.id)
        .eq('status', 'confirmed')
        .gte('session_date', dateString)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(1)
        .single();
        
      setUpcomingSession(sessionData || null);

      // 2. Fetch active packages
      const { data: pkgData } = await supabase
        .from('student_packages')
        .select(`
          *,
          packages(name),
          tutor_profiles(id, profiles(full_name))
        `)
        .eq('student_id', userProfile?.id)
        .gt('remaining_sessions', 0)
        .order('valid_until', { ascending: true });
        
      setActivePackages(pkgData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const goToSesi = (sessionId?: string) => {
    if (sessionId) setTargetSessionId(sessionId);
    setActiveTab('student_sessions');
  };

  return (
    <div className="p-6 md:p-10 animate-fade-in w-full max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-[32px] font-display font-bold text-text-main mb-2 tracking-tight">
        Selamat datang, {userProfile?.full_name?.split(' ')[0]} 👋
      </h1>
      <p className="text-text-sub font-medium mb-8">
        Siap untuk belajar hari ini?
      </p>

      {isLoading ? (
         <div className="flex items-center justify-center py-20">
             <div className="w-8 h-8 rounded-full border-4 border-lime/30 border-t-lime animate-spin"></div>
         </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Sesi Mendatang */}
            <div>
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
                   <Calendar size={20} className="text-blue-500" /> Sesi Terdekat
                 </h2>
                 <button onClick={() => goToSesi()} className="text-sm font-bold text-lime hover:opacity-80 transition-opacity">
                   Lihat Semua
                 </button>
              </div>

              {upcomingSession ? (
                <div 
                   className="bg-bg-2 border-[1.5px] border-border p-5 rounded-2xl cursor-pointer hover:border-lime transition-all"
                   onClick={() => goToSesi(upcomingSession.id)}
                >
                   <div className="flex items-start gap-4">
                     <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                       <Clock size={24} className="text-blue-500" />
                     </div>
                     <div className="flex-1">
                        <h3 className="font-bold text-text-main text-lg mb-1">{upcomingSession.subject}</h3>
                        <p className="text-sm text-text-sub flex items-center gap-2 font-medium">
                          Tutor: {upcomingSession.tutor_profiles?.profiles?.full_name || 'Tutor'}
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                           <span className="text-[13px] font-mono text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1 rounded-md">
                             {new Date(upcomingSession.session_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                           </span>
                           <span className="text-[13px] font-mono text-lime font-bold bg-lime/10 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                             {new Date(upcomingSession.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                     </div>
                   </div>
                   {upcomingSession.meeting_link && (
                     <div className="mt-4 pt-4 border-t border-border/60">
                        <a 
                          href={upcomingSession.meeting_link} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
                        >
                          <Video size={18} /> Masuk Kelas Online
                        </a>
                     </div>
                   )}
                </div>
              ) : (
                <div className="bg-bg-2/50 border-[1.5px] border-border border-dashed p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                   <div className="w-14 h-14 bg-bg-3 rounded-full flex items-center justify-center mb-4">
                     <Calendar size={28} className="text-text-sub opacity-50" />
                   </div>
                   <h3 className="font-bold text-text-main mb-2">Belum ada sesi di depan</h3>
                   <p className="text-sm text-text-sub mb-4">Kamu tidak memiliki jadwal kelas dalam waktu dekat.</p>
                   <button 
                     onClick={() => setActiveTab('explore')}
                     className="px-5 py-2.5 bg-lime text-black font-bold text-sm rounded-lg hover:opacity-90 flex items-center gap-2"
                   >
                     Cari Tutor <ArrowRight size={16} />
                   </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => setActiveTab('progress')}
                  className="bg-purple-500/10 border border-purple-500/20 p-4 justify-start rounded-2xl hover:bg-purple-500/20 transition-all flex items-center gap-4 text-left"
               >
                 <div className="w-10 h-10 bg-purple-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                   <Activity size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-text-main text-sm">Lihat Progress</h4>
                   <p className="text-[11px] text-text-sub font-medium">Pantau perkembanganmu</p>
                 </div>
               </button>

               <button 
                  onClick={() => setActiveTab('explore')}
                  className="bg-lime/10 border border-lime/20 p-4 justify-start rounded-2xl hover:bg-lime/20 transition-all flex items-center gap-4 text-left"
               >
                 <div className="w-10 h-10 bg-lime text-black rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-lime/20">
                   <BookOpen size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-text-main text-sm">Eksplor Tutor</h4>
                   <p className="text-[11px] text-text-sub font-medium">Cari pelajaran baru</p>
                 </div>
               </button>
            </div>

          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
               <Package size={20} className="text-orange-500" /> Paket Aktif
            </h2>
            
            <div className="space-y-4">
              {activePackages.length > 0 ? (
                activePackages.map(pkg => (
                  <div key={pkg.id} className="bg-bg-2 border hover:border-orange-500/50 transition-colors border-border p-4 rounded-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full pointer-events-none"></div>
                     <h3 className="font-bold text-text-main text-sm mb-1">{pkg.packages?.name || 'Paket'}</h3>
                     <p className="text-xs text-text-sub font-medium mb-3">Tutor: {pkg.tutor_profiles?.profiles?.full_name}</p>
                     
                     <div className="flex justify-between items-end">
                       <span className="text-[11px] bg-bg-3 font-mono px-2 py-1 rounded text-text-sub">
                         Sisa {pkg.remaining_sessions} sesi
                       </span>
                       <button
                         onClick={() => setActiveTab('explore')}
                         className="text-orange-500 font-bold text-xs flex items-center gap-1 hover:gap-2 transition-all"
                       >
                         Pakai Jadwal <ArrowRight size={14} />
                       </button>
                     </div>
                  </div>
                ))
              ) : (
                <div className="bg-bg-2 border border-border p-6 rounded-2xl text-center">
                   <p className="text-sm text-text-sub mb-3 font-medium">Kamu belum memiliki paket yang aktif saat ini.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
