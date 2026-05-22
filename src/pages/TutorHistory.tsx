import { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';
import { Calendar, Clock, Star, MapPin, Eye, EyeOff } from "lucide-react";
import { getAvatarColor } from "../data";
import { parseSessionNotes } from './TutorSessions';

export function TutorHistory() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [sessionReports, setSessionReports] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [togglingReviewId, setTogglingReviewId] = useState<string | null>(null);
  const { userProfile } = useAppContext();

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString(['id-ID', 'en-US'], { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    return timeStr.substring(0, 5);
  };

  const fetchSessionsAndReviews = async () => {
     if (!userProfile) return;
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from('sessions')
         .select(`
           *,
           student_profiles(id, profiles(full_name))
         `)
         .eq('tutor_id', userProfile.id)
         .eq('status', 'completed')
         .order('session_date', { ascending: false });
         
       if (error) throw error;
       setSessions(data || []);

       const { data: reports } = await supabase
         .from('session_reports')
         .select('session_id')
         .eq('tutor_id', userProfile.id);
       
       if (reports) {
         setSessionReports(new Set(reports.map(r => r.session_id)));
       }

       // Fetch student reviews
       const { data: reviewsData } = await supabase
         .from('reviews')
         .select('*')
         .eq('tutor_id', userProfile.id);

       if (reviewsData) {
         setReviews(reviewsData);
       }
     } catch (e) {
       console.error(e);
     } finally {
       setIsLoading(false);
     }
  };

  useEffect(() => {
    fetchSessionsAndReviews();
  }, [userProfile]);

  const handleToggleShowOnProfile = async (reviewId: string, currentVal: boolean) => {
    setTogglingReviewId(reviewId);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ show_on_profile: !currentVal })
        .eq('id', reviewId);
        
      if (error) throw error;
      
      // Update locally
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, show_on_profile: !currentVal } : r));
    } catch (err) {
      console.error("Gagal mengubah tampilan ulasan:", err);
      alert("Gagal memperbarui ulasan. Silakan pastikan kolom 'show_on_profile' di tabel 'reviews' telah ditambahkan di database.");
    } finally {
      setTogglingReviewId(null);
    }
  };

  const history = sessions.filter(s => sessionReports.has(s.id));

  return (
    <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-text-main">
          Riwayat Mengajar
        </h1>
        <p className="text-sm text-text-sub">
          Daftar sesi yang sudah selesai dan dilaporkan.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="text-center py-8">Memuat riwayat...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-text-sub bg-card border border-border rounded-xl">
            Belum ada riwayat mengajar. Selesaikan laporan sesi untuk memunculkannya di sini.
          </div>
        ) : (
          history.map((session: any) => (
            <div
              key={session.id}
              className="bg-card border-[1.5px] border-border rounded-xl p-4 transition-all hover:border-lime/30"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-display text-white opacity-80"
                    style={{ background: getAvatarColor(session.student_profiles?.profiles?.full_name || 'Siswa') }}
                  >
                    {(session.student_profiles?.profiles?.full_name || 'S').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-text-main font-display">
                      {session.student_profiles?.profiles?.full_name || 'Siswa'}
                    </div>
                    <div className="text-xs text-text-sub font-mono">
                      {session.subject}
                    </div>
                    {(() => {
                      const parsed = parseSessionNotes(session.material_notes);
                      if (!parsed.meta) return null;
                      if (parsed.meta === "prepaid") {
                        return (
                          <div className="mt-1">
                            <span className="text-[9px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider inline-block">
                              ⚡ Kuota Paket
                            </span>
                          </div>
                        );
                      }
                      if (parsed.meta === "single") {
                        return (
                          <div className="mt-1">
                            <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider inline-block">
                              🎯 Sesi Satuan
                            </span>
                          </div>
                        );
                      }
                      if (parsed.meta.startsWith("bundle_init:")) {
                        const pkgName = parsed.meta.replace("bundle_init:", "");
                        return (
                          <div className="mt-1">
                            <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider inline-block">
                              📦 Sesi Paket: {pkgName}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <div className="bg-bg-2 text-text-sub border border-border text-[10px] font-bold px-2 py-1 rounded font-mono tracking-wider">
                  Selesai
                </div>
              </div>

              <div className="flex gap-4 items-center text-sm text-text-sub mb-3">
                <div className="flex items-center gap-1.5 font-mono">
                  <Calendar size={14} />
                  <span>{new Date(session.session_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <Clock size={14} />
                  <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                </div>
              </div>

              {(() => {
                const parsed = parseSessionNotes(session.material_notes);
                return (
                  <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/50">
                    <span className="text-[11px] font-bold text-text-sub uppercase tracking-wider font-mono">Topik Bahasan</span>
                    <p className="text-[13px] font-sans italic">
                      {parsed.notes ? `"${parsed.notes}"` : "- (Membahas materi umum sesuai pelajaran)"}
                    </p>
                  </div>
                );
              })()}

              {/* Review Section */}
              {(() => {
                const review = reviews.find(r => r.session_id === session.id);
                if (!review) return null;
                return (
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-text-sub uppercase tracking-wider font-mono">Ulasan Siswa</span>
                      <div className="flex items-center gap-0.5 text-warning font-mono text-xs font-bold bg-warning/10 px-2 py-0.5 rounded">
                        ⭐ {review.rating} / 5
                      </div>
                    </div>
                    {review.review_text ? (
                      <p className="text-xs text-text-main italic p-2.5 bg-bg-2 border-l-2 border-warning/60 rounded-r">
                        "{review.review_text}"
                      </p>
                    ) : (
                      <p className="text-xs text-text-sub italic">Siswa memberikan rating bintang tanpa ulasan tertulis.</p>
                    )}

                    <div className="flex justify-between items-center bg-bg-2 p-2.5 rounded-lg border border-border/40">
                      <div className="text-[11px] text-text-sub flex items-center gap-1.5 font-mono">
                        {review.show_on_profile !== false ? (
                          <>
                            <Eye size={14} className="text-lime" />
                            <span>Tampil di profil publik</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} className="text-text-muted" />
                            <span>Disembunyikan di profil</span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleShowOnProfile(review.id, review.show_on_profile !== false)}
                        disabled={togglingReviewId === review.id}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-md font-mono transition-colors border ${
                          review.show_on_profile !== false
                            ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                            : "bg-lime/10 hover:bg-lime/20 text-lime border-lime/30"
                        } flex items-center gap-1 cursor-pointer`}
                      >
                        {togglingReviewId === review.id ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin inline-block"></span>
                        ) : review.show_on_profile !== false ? (
                          "Sembunyikan"
                        ) : (
                          "Tampilkan"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
