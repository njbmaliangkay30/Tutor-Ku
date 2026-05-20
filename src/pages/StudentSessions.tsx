import { Calendar, Video, FileText, Star, Clock, AlertOctagon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';
import { getAvatarColor } from '../data';

export function StudentSessions() {
  const [type, setType] = useState<'upcoming' | 'past'>('upcoming');
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile, tutors, userRole, setActiveTab } = useAppContext();

  // Review Modal State
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
       if (!userProfile) return;
       setIsLoading(true);
       try {
         const { data, error } = await supabase
           .from('sessions')
           .select(`
             *,
             tutor_profiles(id, profiles(full_name)),
             reviews (rating)
           `)
           .eq('student_id', userProfile.id)
           .order('session_date', { ascending: false });
           
         if (error) throw error;
         
         const formattedData = data?.map((session: any) => ({
           ...session,
           rating: session.reviews?.[0]?.rating || null
         })) || [];
         
         setSessions(formattedData);
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
  
  const getSessionEndDateTime = (s: any) => {
    if (s.end_time?.includes('T')) return new Date(s.end_time);
    return s.session_date && s.end_time ? new Date(`${s.session_date}T${s.end_time}`) : new Date(0);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString(['id-ID', 'en-US'], { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    return timeStr.substring(0, 5);
  };

  const upcoming = sessions.filter(s => {
    if (s.status === 'pending') return true;
    if (s.status === 'completed' || s.status === 'rejected') return false;
    return getSessionEndDateTime(s) >= now;
  });
  const past = sessions.filter(s => {
    if (s.status === 'completed' || s.status === 'rejected' || s.status === 'waiting_for_student') return true;
    if (s.status === 'pending') return false;
    return getSessionEndDateTime(s) < now;
  });

  const displayList = type === 'upcoming' ? upcoming : past;

  const handleSubmitReview = async () => {
    if (!reviewModal || !userProfile) return;
    setIsSubmittingReview(true);
    try {
      if (reviewModal.status !== 'completed') {
        const { error: sessionError } = await supabase
          .from('sessions')
          .update({ status: 'completed' })
          .eq('id', reviewModal.id);
        if (sessionError) throw sessionError;
      }

      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          session_id: reviewModal.id,
          student_id: userProfile.id,
          tutor_id: reviewModal.tutor_id,
          rating: reviewRating,
          review_text: reviewText
        });
      if (reviewError) throw reviewError;

      // Update tutor stats incrementally
      try {
        const { data: tutorProfile } = await supabase
          .from('tutor_profiles')
          .select('rating, total_reviews')
          .eq('id', reviewModal.tutor_id)
          .single();

        if (tutorProfile) {
          const newTotal = (tutorProfile.total_reviews || 0) + 1;
          const newRating = (((tutorProfile.rating || 0) * (tutorProfile.total_reviews || 0)) + reviewRating) / newTotal;
          await supabase.from('tutor_profiles').update({
            rating: newRating,
            total_reviews: newTotal
          }).eq('id', reviewModal.tutor_id);
        }
      } catch (e) {
        console.warn("Could not update tutor average rating", e);
      }

      setReviewModal(null);
      setReviewText("");
      setReviewRating(5);
      
      // refresh Data 
      // We can just rely on fetchSessions
      // But we have to trigger useEffect manually? Or just call fetchSessions() but it's local to useEffect.
      // Easiest is to just reload window or update local state manually, but actually we can just find it in 'sessions' state.
      setSessions(prev => prev.map(s => {
        if (s.id === reviewModal.id) {
          return { ...s, status: 'completed', rating: reviewRating };
        }
        return s;
      }));
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Gagal mengirim ulasan.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
    <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full pb-24">
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
            } else if (session.status === 'rejected') {
              statusText = 'Ditolak';
              statusColor = "bg-red-500/10 text-red-400 border border-red-500/20";
            } else if (session.status === 'waiting_for_student') {
              statusText = 'Tunggu Konfirmasi Selesai';
              statusColor = "bg-warning/20 text-warning border border-warning/30";
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
                   <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
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
                    {session.status === 'waiting_for_student' && (
                      <button 
                        onClick={() => setReviewModal(session)}
                        className="flex-1 border-[1.5px] border-lime bg-lime text-black font-bold py-2 rounded-lg text-sm hover:bg-lime-dim transition-colors flex items-center justify-center gap-2"
                      >
                        <Star size={16} /> Tandai Selesai & Beri Ulasan
                      </button>
                    )}
                    {session.status === 'completed' && !session.rating && (
                      <button 
                        onClick={() => setReviewModal(session)}
                        className="flex-1 border-[1.5px] border-lime/50 text-lime font-bold py-2 rounded-lg text-sm hover:bg-lime-mid transition-colors flex items-center justify-center gap-2"
                      >
                        <Star size={16} /> Beri Ulasan
                      </button>
                    )}
                  </div>
               )}
            </div>
           );
          })
        )}
      </div>

      {reviewModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-pgIn" style={{overscrollBehavior: 'none'}}>
          <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b-[1.5px] border-border bg-bg-2">
              <div className="font-display font-bold text-[16px]">
                Selesaikan Sesi & Beri Ulasan
              </div>
              <button
                onClick={() => setReviewModal(null)}
                className="text-text-sub hover:text-text-main"
                disabled={isSubmittingReview}
              >
                <AlertOctagon size={20} className="hidden" />
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="mb-4">
                <div className="text-xs text-text-sub font-mono uppercase tracking-wider mb-1">
                  Tutor
                </div>
                <div className="font-bold font-display text-lg">
                  {reviewModal.tutor_profiles?.profiles?.full_name || 'Tutor'}
                </div>
                <div className="text-sm text-lime font-mono">
                  {reviewModal.subject || 'Mapel'} · {new Date(reviewModal.session_date).toLocaleDateString()}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-text-sub uppercase font-mono tracking-wider mb-3 text-center">Beri Rating</label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map(star => (
                     <button 
                       key={star} 
                       onClick={() => setReviewRating(star)}
                       className="transition-transform hover:scale-110 focus:outline-none"
                     >
                       <Star size={32} className={star <= reviewRating ? "fill-warning text-warning drop-shadow-sm" : "text-border"} />
                     </button>
                  ))}
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-bold text-text-sub uppercase font-mono tracking-wider mb-1.5">Ulasan (Opsional)</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Ceritakan pengalaman belajar kamu, metode mengajar tutor, dll..."
                  className="w-full bg-bg-2 border border-border rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-lime transition-colors h-24 resize-none"
                />
              </div>
            </div>
            
            <div className="bg-bg-2 p-4 flex gap-3 border-t-[1.5px] border-border">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 font-bold py-2.5 rounded-lg text-sm text-text-main hover:bg-bg-3 border border-transparent transition-colors"
                disabled={isSubmittingReview}
              >
                Batal
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-[2] bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-dim transition-colors disabled:opacity-50"
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? 'Menyimpan...' : (reviewModal.status === 'completed' ? 'Kirim Ulasan' : 'Selesai & Kirim Ulasan')}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

    </div>
  );
}
