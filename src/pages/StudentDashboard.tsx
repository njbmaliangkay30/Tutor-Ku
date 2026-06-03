import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';
import { Calendar, Package, ArrowRight, BookOpen, Clock, Activity, Video, MessageSquare, Star, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';

const getExternalUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return 'https://' + trimmed;
};

export function StudentDashboard() {
  const { userProfile, setActiveTab, setTargetSessionId, setSelectedTutorId } = useAppContext();
  const { t, getLocalizedValue } = useTranslation();
  const [upcomingSession, setUpcomingSession] = useState<any | null>(null);
  const [activePackages, setActivePackages] = useState<any[]>([]);
  const [latestReport, setLatestReport] = useState<any | null>(null);
  const [popularTutors, setPopularTutors] = useState<any[]>([]);
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
        .maybeSingle();
        
      setUpcomingSession(sessionData || null);

      // 2. Fetch active packages and their transactions
      const [pkgRes, trxRes] = await Promise.all([
        supabase
          .from('student_packages')
          .select(`
            *,
            packages(name),
            tutor_profiles(id, profiles(full_name))
          `)
          .eq('student_id', userProfile?.id)
          .gt('remaining_sessions', 0)
          .order('valid_until', { ascending: true }),
        supabase
          .from('transactions')
          .select('student_package_id, status')
          .eq('user_id', userProfile?.id)
          .eq('transaction_type', 'bundle_purchase')
      ]);

      const paidPackageIds = new Set(
        (trxRes.data || [])
          .filter(t => t.status === 'success')
          .map(t => t.student_package_id)
      );

      const filteredPkgs = (pkgRes.data || []).filter(pkg => paidPackageIds.has(pkg.id));
      setActivePackages(filteredPkgs);

      // 3. Fetch latest session report
      const { data: reportData } = await supabase
        .from('session_reports')
        .select(`
          *,
          sessions!inner(subject, session_date, student_id),
          tutor_profiles(profiles(full_name))
        `)
        .eq('sessions.student_id', userProfile?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setLatestReport(reportData || null);

      // 4. Fetch popular tutors for recommendation
      const { data: tutorsRes } = await supabase
        .from('tutor_profiles')
        .select(`
          id,
          headline,
          hourly_rate,
          learning_styles,
          profiles(full_name, avatar_url),
          tutor_subjects(subject_name)
        `)
        .eq('is_verified', true)
        .limit(3);
        
      setPopularTutors(tutorsRes || []);
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

  const contentVariants: any = {
    hidden: { opacity: 0 },
    visible: {
       opacity: 1,
       transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto pb-24">
      {/* Decorative Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-8 rounded-3xl p-6 md:p-10 bg-primary border-[2px] border-primary-bright relative overflow-hidden shadow-green"
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0px, rgba(255,255,255,.025) 1px, transparent 1px, transparent 22px), repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0px, rgba(255,255,255,.025) 1px, transparent 1px, transparent 22px)'}}></div>
        <div className="absolute w-[300px] h-[300px] -top-[100px] -right-[50px] rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, var(--color-lime-mid) 0%, transparent 70%)'}}></div>
        
        <h1 className="text-2xl md:text-[36px] font-display font-extrabold text-white mb-2 tracking-tight relative z-10">
          {t('dashboard.welcome')} <span className="text-lime">{userProfile?.full_name?.split(' ')[0]}! 👋</span>
        </h1>
        <p className="text-white/80 font-medium text-[15px] relative z-10 max-w-md">
          {t('dashboard.ready')}
        </p>
      </motion.div>

      {isLoading ? (
         <div className="flex items-center justify-center py-20">
             <div className="w-8 h-8 rounded-full border-4 border-lime/30 border-t-lime animate-spin"></div>
         </div>
      ) : (
        <motion.div 
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 space-y-6">
            
            {/* Sesi Mendatang */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-4 px-2">
                 <h2 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
                   <Calendar size={20} className="text-blue-500" /> {t('dashboard.upcoming_session')}
                 </h2>
                 <button onClick={() => goToSesi()} className="text-[13px] font-bold text-lime hover:opacity-80 transition-opacity bg-lime/10 px-3 py-1.5 rounded-full uppercase tracking-wide">
                   {t('dashboard.see_all')}
                 </button>
              </div>

              {upcomingSession ? (
                <div 
                   className="bg-bg-2 border-[2px] border-border/60 p-6 md:p-8 rounded-[2rem] cursor-pointer hover:border-lime transition-all relative overflow-hidden group shadow-lg"
                >
                   <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
                   <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
                     <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-inner">
                       <Clock size={32} className="text-blue-500" strokeWidth={1.5} />
                     </div>
                     <div className="flex-1">
                        <h3 className="font-extrabold font-display text-text-main text-2xl mb-1.5 tracking-tight group-hover:text-lime transition-colors">{upcomingSession.subject}</h3>
                        <p className="text-[15px] text-text-sub flex items-center gap-2 font-medium">
                          {t('profile.tutor_label')}: <span className="text-text-main shrink-0">{upcomingSession.tutor_profiles?.profiles?.full_name || 'Tutor'}</span>
                        </p>
                     </div>
                     
                     <div className="flex sm:flex-col items-center sm:items-end gap-3 mt-4 sm:mt-0">
                        <div className="flex items-center gap-3">
                           <span className="text-[14px] font-mono text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                             {new Date(upcomingSession.session_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                           </span>
                           <span className="text-[14px] font-mono text-lime font-bold bg-lime/10 border border-lime/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                             {new Date(upcomingSession.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                     </div>
                   </div>
                   {upcomingSession.meeting_link && (
                     <div className="mt-6 pt-6 border-t border-border/40 relative z-10">
                        <a 
                          href={getExternalUrl(upcomingSession.meeting_link)} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)] text-white font-extrabold tracking-wide py-3.5 rounded-xl text-[15px] transition-all hover:-translate-y-0.5"
                        >
                          <Video size={20} strokeWidth={2.5} /> {t('dashboard.join_class')}
                        </a>
                     </div>
                   )}
                </div>
              ) : (
                <div className="bg-bg-2/50 border-[2px] border-border/50 border-dashed p-10 py-16 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:bg-bg-2/80 transition-colors">
                   <div className="w-20 h-20 bg-bg-3 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Calendar size={36} className="text-text-sub opacity-50" strokeWidth={1.5} />
                   </div>
                   <h3 className="text-xl font-bold font-display text-text-main mb-3">{t('dashboard.no_upcoming')}</h3>
                   <p className="text-[15px] text-text-sub mb-8 max-w-sm">{t('dashboard.no_upcoming_desc')}</p>
                   <button 
                     onClick={() => setActiveTab('explore')}
                     className="px-6 py-3.5 bg-lime text-black font-extrabold tracking-wide text-[15px] rounded-xl hover:opacity-90 flex items-center gap-2 shadow-[0_0_20px_var(--color-lime-dim)] hover:-translate-y-0.5 transition-all uppercase"
                   >
                     {t('dashboard.find_tutor_now')} <ArrowRight size={18} strokeWidth={2.5} />
                   </button>
                </div>
              )}
            </motion.div>

            {/* Latest Session Report */}
            {latestReport && (
              <motion.div variants={itemVariants} className="bg-bg-2 border-[1.5px] border-border/60 p-6 md:p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
                 <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-lime/5 rounded-full blur-2xl group-hover:bg-lime/10 transition-colors duration-700"></div>
                 <div className="flex items-center justify-between mb-4 relative z-10">
                   <h2 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
                     <MessageSquare size={20} className="text-lime" /> {t('dashboard.latest_note')}
                   </h2>
                   <div className="flex text-lime">
                     {[...Array(5)].map((_, i) => (
                       <Star key={i} size={16} fill={i < (latestReport.student_understanding_level || 5) ? 'currentColor' : 'none'} className={i < (latestReport.student_understanding_level || 5) ? 'text-lime' : 'text-border'} />
                     ))}
                   </div>
                 </div>
                 <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-3">
                     <span className="text-text-sub font-medium text-sm">{t('dashboard.review_from')}</span>
                     <span className="text-text-main font-bold text-sm bg-bg-3 px-2 py-1 rounded-md">
                       {latestReport.tutor_profiles?.profiles?.full_name || 'Tutor'}
                     </span>
                     <span className="text-text-sub text-xs ml-auto">
                       {new Date(latestReport.sessions?.session_date).toLocaleDateString(t('common.date_locale') || 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                     </span>
                   </div>
                   <p className="text-[15px] leading-relaxed text-text-main/90 italic border-l-4 border-lime/50 pl-4 py-1 mb-4">
                     "{latestReport.summary}"
                   </p>
                   {latestReport.homework && (
                     <div className="bg-lime/5 border border-lime/10 rounded-xl p-4">
                       <p className="text-[12px] font-mono text-lime uppercase font-bold mb-1 tracking-wider">{t('dashboard.extra_notes')}</p>
                       <p className="text-sm text-text-main">{latestReport.homework}</p>
                     </div>
                   )}
                 </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mt-6">
               <button 
                  onClick={() => setActiveTab('progress')}
                  className="bg-purple-500/10 border-[1.5px] border-purple-500/20 p-5 md:p-6 justify-start rounded-[2rem] hover:bg-purple-500/15 hover:border-purple-500/30 transition-all flex items-center gap-4 md:gap-5 text-left group shadow-sm"
               >
                 <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
                   <Activity size={24} strokeWidth={2} />
                 </div>
                 <div>
                   <h4 className="font-bold text-text-main text-[16px] md:text-lg mb-1 tracking-tight">{t('dashboard.see_progress')}</h4>
                   <p className="text-[12px] md:text-[13px] text-text-sub font-medium leading-tight">{t('dashboard.monitor_development')}</p>
                 </div>
               </button>

               <button 
                  onClick={() => setActiveTab('explore')}
                  className="bg-lime/10 border-[1.5px] border-lime/20 p-5 md:p-6 justify-start rounded-[2rem] hover:bg-lime/15 hover:border-lime/30 transition-all flex items-center gap-4 md:gap-5 text-left group shadow-sm"
               >
                 <div className="w-14 h-14 bg-gradient-to-br from-lime to-lime-mid text-black rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-lime/20 group-hover:scale-105 transition-transform">
                   <BookOpen size={24} strokeWidth={2} />
                 </div>
                 <div>
                   <h4 className="font-bold text-text-main text-[16px] md:text-lg mb-1 tracking-tight">{t('dashboard.explore_tutors')}</h4>
                   <p className="text-[12px] md:text-[13px] text-text-sub font-medium leading-tight">{t('dashboard.find_new_lessons')}</p>
                 </div>
               </button>
            </motion.div>

            {/* Rekomendasi Tutor */}
            <motion.div variants={itemVariants} className="mt-8">
               <div className="flex items-center justify-between mb-4 px-2">
                 <h2 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
                   <Star size={20} className="text-yellow-500" /> {t('dashboard.recommended_tutors')}
                 </h2>
                 <button onClick={() => setActiveTab('search')} className="text-[13px] font-bold text-lime hover:opacity-80 transition-opacity bg-lime/10 px-3 py-1.5 rounded-full uppercase tracking-wide">
                   {t('dashboard.see_all')}
                 </button>
               </div>
               <div className="space-y-4">
                 {popularTutors.map((tutor, idx) => (
                   <div 
                     key={tutor.id} 
                     onClick={() => setSelectedTutorId(tutor.id)}
                     className={`bg-bg-2 border-[1.5px] border-border/60 hover:border-lime transition-colors p-4 rounded-2xl flex items-center gap-4 cursor-pointer group shadow-sm ${idx === 0 ? 'tour-tutor-card' : ''}`}
                   >
                      <div className="w-14 h-14 rounded-full bg-border/50 overflow-hidden shrink-0 border-2 border-transparent group-hover:border-lime transition-all">
                        {tutor.profiles?.avatar_url ? (
                          <img src={tutor.profiles.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-bg-3 flex items-center justify-center text-text-sub font-bold text-xl">
                            {tutor.profiles?.full_name?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text-main truncate text-[15px] group-hover:text-lime transition-colors flex items-center gap-1.5">
                          {tutor.profiles?.full_name} <ShieldCheck size={14} className="text-blue-500" />
                        </h3>
                        <p className="text-[13px] text-text-sub truncate mb-1">{tutor.headline || 'Tutor Mahasiswa'}</p>
                        <div className="flex items-center flex-wrap gap-2 mt-1.5">
                           {tutor.tutor_subjects?.[0] && (
                             <span className="text-[10px] font-mono font-bold bg-bg-3 px-2 py-[2px] rounded-sm text-text-main border border-border/60">
                               {tutor.tutor_subjects[0].subject_name}
                             </span>
                           )}
                           {tutor.learning_styles?.includes('Bisa Bahasa Inggris') && (
                             <span className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-violet-300 font-medium tracking-wider w-fit whitespace-nowrap">BILINGUAL</span>
                           )}
                           {(tutor.learning_styles || [])
                             .filter((s: string) => s.startsWith('Jenjang'))
                             .sort((a: string, b: string) => {
                                const order: any = { 'Jenjang: SD': 1, 'Jenjang: SMP': 2, 'Jenjang: SMA': 3, 'Jenjang: Mahasiswa/Umum': 4 };
                                return (order[a] || 99) - (order[b] || 99);
                             })
                             .map((s: string) => {
                                const level = s.replace('Jenjang: ', '');
                                let dotColor = "bg-text-sub";
                                if (level === 'SD') dotColor = "bg-rose-400";
                                else if (level === 'SMP') dotColor = "bg-sky-400";
                                else if (level === 'SMA') dotColor = "bg-slate-300";
                                return (
                                  <span key={s} className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-text-main font-medium tracking-wider flex items-center gap-1 w-fit whitespace-nowrap">
                                    <span className={`w-1 h-1 rounded-full shrink-0 ${dotColor}`}></span> {level}
                                  </span>
                                );
                             })
                           }
                           <span className="text-[10px] font-bold text-lime bg-lime/10 px-2 py-[2px] rounded-sm border border-lime/20 whitespace-nowrap">
                             Rp{(tutor.hourly_rate || 0).toLocaleString('id-ID')}{t('dashboard.hourly')}
                           </span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-bg-base border border-border flex items-center justify-center group-hover:bg-lime group-hover:text-black group-hover:border-lime transition-all shrink-0">
                         <ArrowRight size={16} />
                      </div>
                   </div>
                 ))}
                 {popularTutors.length === 0 && (
                   <div className="text-center py-6 border-[1.5px] border-border/50 border-dashed rounded-2xl">
                     <Search size={24} className="text-text-sub mx-auto mb-2 opacity-50" />
                     <p className="text-sm text-text-sub">{t('dashboard.no_recommendations')}</p>
                   </div>
                 )}
               </div>
            </motion.div>

          </div>

          <motion.div variants={itemVariants} className="space-y-6">
            <h2 className="text-xl font-bold font-display text-text-main flex items-center gap-2 px-2">
               <Package size={20} className="text-orange-500" /> {t('profile.active_packages')}
            </h2>
            
            <div className="space-y-4">
              {activePackages.length > 0 ? (
                activePackages.map(pkg => (
                  <div key={pkg.id} className="bg-bg-2 border-[1.5px] hover:border-orange-500/50 transition-colors border-border p-5 rounded-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
                     <div className="relative z-10 flex flex-col h-full">
                       <h3 className="font-extrabold text-text-main text-lg mb-1">{getLocalizedValue(pkg.packages?.name) || t('profile.learning_package')}</h3>
                       <p className="text-[13px] text-text-sub font-medium mb-5 flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> {t('profile.tutor_label')}: {pkg.tutor_profiles?.profiles?.full_name}
                       </p>
                       
                       <div className="flex justify-between items-end mt-auto pt-4 border-t border-border/60">
                         <span className="text-[12px] bg-orange-500/10 border border-orange-500/20 text-orange-500 font-bold font-mono px-3 py-1.5 rounded-lg">
                           {t('dashboard.sessions_left').replace('{count}', String(pkg.remaining_sessions))}
                         </span>
                         <button
                           onClick={() => setActiveTab('explore')}
                           className="text-text-main hover:text-orange-500 font-bold text-xs flex items-center gap-1.5 hover:gap-2.5 transition-all uppercase tracking-wider"
                         >
                           {t('dashboard.use_package')} <ArrowRight size={14} strokeWidth={2.5} />
                         </button>
                       </div>
                     </div>
                  </div>
                ))
              ) : (
                <div className="bg-bg-2/50 border-[1.5px] border-border border-dashed p-8 rounded-2xl text-center">
                   <div className="w-12 h-12 bg-bg-3 rounded-full flex items-center justify-center mx-auto mb-3">
                     <Package size={20} className="text-text-sub opacity-50" />
                   </div>
                   <p className="text-sm text-text-sub mb-4 font-medium">{t('dashboard.no_active_packages')}</p>
                   <button 
                     onClick={() => setActiveTab('search')}
                     className="text-[13px] font-bold text-lime hover:underline underline-offset-4"
                   >
                     {t('dashboard.see_offers')}
                   </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

