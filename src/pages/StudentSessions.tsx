import { Calendar, Video, FileText, Star, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';
import { getAvatarColor } from '../data';

export function StudentSessions() {
  const [type, setType] = useState<'upcoming' | 'past'>('upcoming');
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile, tutors, userRole, setActiveTab } = useAppContext();

  useEffect(() => {
    const fetchSessions = async () => {
       if (!userProfile) return;
       setIsLoading(true);
       try {
         const { data, error } = await supabase
           .from('sessions')
           .select(`
             *,
             tutor_profiles(id, profiles(full_name))
           `)
           .eq('student_id', userProfile.id)
           .order('session_date', { ascending: false });
           
         if (error) throw error;
         setSessions(data || []);
       } catch (e) {
         console.error(e);
       } finally {
         setIsLoading(false);
       }
    };
    if (userProfile) {
      fetchSessions();
    }
  }, [userProfile]);

  const now = new Date();
  
  const upcoming = sessions.filter(s => new Date(`${s.session_date}T${s.end_time}`) >= now);
  const past = sessions.filter(s => new Date(`${s.session_date}T${s.end_time}`) < now);

  const displayList = type === 'upcoming' ? upcoming : past;

  if (userRole === 'guest' || !userProfile) {
    return (
      <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full text-center mt-10">
        <h1 className="text-2xl font-bold font-display text-text-main mb-4">Sesi Belajar</h1>
        <p className="text-sm text-text-sub mb-6">Silakan login untuk melihat dan mengelola sesi belajarmu.</p>
        <button 
          onClick={() => setActiveTab('login')} 
          className="bg-lime text-black font-bold py-3 px-8 rounded-lg hover:bg-lime-dim transition-colors"
        >
          Login Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-text-main">Sesi Belajar</h1>
        <p className="text-sm text-text-sub">Kelola jadwal belajar kamu dengan tutor.</p>
      </div>

      <div className="flex bg-bg-2 border-[1.5px] border-border rounded-lg p-1 mb-6">
        <button
          onClick={() => setType('upcoming')}
          className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${type === 'upcoming' ? 'bg-lime-mid text-lime' : 'text-text-sub hover:text-text-main'}`}
        >
          Akan Datang ({upcoming.length})
        </button>
        <button
          onClick={() => setType('past')}
          className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${type === 'past' ? 'bg-lime-mid text-lime' : 'text-text-sub hover:text-text-main'}`}
        >
          Riwayat ({past.length})
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
           <div className="text-center py-8">Memuat sesi...</div>
        ) : displayList.length === 0 ? (
           <div className="text-center py-8 text-text-sub border border-dashed border-border rounded-xl">Tidak ada sesi {type === 'upcoming' ? 'akan datang' : 'sebelumnya'}.</div>
        ) : (
          displayList.map(session => (
            <div key={session.id} className="bg-card border-[1.5px] border-border rounded-xl p-4">
               <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold font-display" style={{backgroundColor: getAvatarColor(session.tutor_profiles?.profiles?.full_name || 'Tutor')}}>
                     {(session.tutor_profiles?.profiles?.full_name || 'T').substring(0, 2).toUpperCase()}
                   </div>
                   <div>
                     <div className="font-bold text-text-main font-display">{session.tutor_profiles?.profiles?.full_name || 'Tutor'}</div>
                     <div className="text-xs text-text-sub font-mono">{session.subject}</div>
                   </div>
                 </div>
                 <div className="bg-lime-mid text-lime text-[10px] font-bold px-2 py-1 rounded font-mono uppercase tracking-wider">
                   {session.status}
                 </div>
               </div>

               <div className="bg-bg-2 rounded-lg p-3 mb-4 space-y-2 border border-border/50">
                 <div className="flex items-center gap-2 text-sm text-text-main">
                   <Calendar size={16} className="text-text-sub" />
                   <span>{new Date(session.session_date).toLocaleDateString()}</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-text-main">
                   <Clock size={16} className="text-text-sub" />
                   <span>{session.start_time.substring(0,5)} - {session.end_time.substring(0,5)} WIB</span>
                 </div>
                 {session.material_notes && (
                   <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/50">
                     <span className="text-xs text-text-sub font-medium font-mono uppercase tracking-wider">Catatan Materi:</span>
                     <p className="text-sm">{session.material_notes}</p>
                   </div>
                 )}
               </div>

               {type === 'upcoming' ? (
                  <div className="flex gap-2">
                    <button className="flex-1 bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-dim transition-colors flex items-center justify-center gap-2">
                      <Video size={16} /> Masuk Google Meet
                    </button>
                    <button className="px-4 border-[1.5px] border-border text-text-sub font-bold rounded-lg text-sm hover:bg-bg-3 hover:text-text-main transition-colors">
                      Batalkan
                    </button>
                  </div>
               ) : (
                  <div className="flex gap-2">
                    <button className="flex-1 border-[1.5px] border-lime/50 text-lime font-bold py-2 rounded-lg text-sm hover:bg-lime-mid transition-colors flex items-center justify-center gap-2">
                      <Star size={16} /> Beri Ulasan
                    </button>
                  </div>
               )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
