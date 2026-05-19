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
  
  const upcoming = sessions.filter(s => {
    if (s.status === 'pending') return true;
    if (s.status === 'completed' || s.status === 'rejected') return false;
    const sDate = s.session_date && s.end_time ? new Date(`${s.session_date}T${s.end_time}`) : new Date(0);
    return sDate >= now;
  });
  const past = sessions.filter(s => {
    if (s.status === 'completed' || s.status === 'rejected') return true;
    if (s.status === 'pending') return false;
    const sDate = s.session_date && s.end_time ? new Date(`${s.session_date}T${s.end_time}`) : new Date(0);
    return sDate < now;
  });

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
          displayList.map(session => {
            let statusText = session.status;
            let statusColor = "bg-bg-3 text-text-sub";
            if (session.status === 'pending') {
              statusText = 'Menunggu Konfirmasi';
              statusColor = "bg-warning/20 text-warning";
            } else if (session.status === 'confirmed') {
              statusText = 'Terkonfirmasi';
              statusColor = "bg-lime-dim text-lime border border-lime/30";
            } else if (session.status === 'completed') {
              statusText = 'Selesai';
              statusColor = "bg-bg-2 border border-border text-text-sub";
            } else if (session.status === 'cancelled' || session.status === 'rejected') {
              statusText = 'Dibatalkan';
              statusColor = "bg-red-500/10 text-red-500 border border-red-500/30";
            }

            return (
              <div key={session.id} className={`bg-card border-[1.5px] border-border rounded-xl p-4 ${session.status === 'pending' ? 'border-warning/30' : ''}`}>
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
                   <div className={`text-[10px] font-bold px-2.5 py-1.5 rounded font-mono uppercase tracking-wider ${statusColor}`}>
                     {statusText}
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
                  <div className="flex gap-2 w-full">
                    {session.meeting_type === 'offline' ? (
                       <div className="flex-1 bg-bg-2 border border-border text-center text-text-main font-bold py-2.5 rounded-lg text-[13px] flex items-center justify-center gap-2 px-2">
                         <span className="truncate">📍 Lokasi: {session.location || 'Menunggu Info'}</span>
                       </div>
                    ) : (
                       session.meeting_link ? (
                         <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="flex-1 bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-dim transition-colors flex items-center justify-center gap-2">
                           <Video size={16} /> Buka Link Meeting
                         </a>
                       ) : (
                         <div className="flex-1 bg-bg-2 border border-dashed border-border text-center text-text-sub font-mono font-bold py-2.5 rounded-lg text-[12px] flex items-center justify-center gap-2">
                           Link belum tersedia
                         </div>
                       )
                    )}
                  </div>
               ) : (
                  <div className="flex gap-2">
                    <button className="flex-1 border-[1.5px] border-lime/50 text-lime font-bold py-2 rounded-lg text-sm hover:bg-lime-mid transition-colors flex items-center justify-center gap-2">
                      <Star size={16} /> Beri Ulasan
                    </button>
                  </div>
               )}
            </div>
           );
          })
        )}
      </div>

    </div>
  );
}
