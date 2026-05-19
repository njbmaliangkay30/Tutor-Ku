import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, Video, FileText, Star, Clock, Edit3, X, Loader2 } from "lucide-react";
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';
import { getAvatarColor } from '../data';

export function TutorSessions() {
  const [type, setType] = useState<"upcoming" | "past">("upcoming");
  const [reportModal, setReportModal] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionReports, setSessionReports] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile, user } = useAppContext();

  // Report Form State
  const [reportText, setReportText] = useState("");
  const [understandingLevel, setUnderstandingLevel] = useState(4);
  const [homework, setHomework] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const fetchSessions = async () => {
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
     } catch (e) {
       console.error(e);
     } finally {
       setIsLoading(false);
     }
  };

  useEffect(() => {
    fetchSessions();
  }, [userProfile]);

  const submitReport = async () => {
    if (!reportModal || !reportText.trim() || !user) return;
    setIsSubmittingReport(true);
    
    try {
      const { error } = await supabase.from('session_reports').insert({
        session_id: reportModal.id,
        tutor_id: user.id,
        summary: reportText,
        homework: homework || null,
        student_understanding_level: understandingLevel
      });
      
      if (error) throw error;
      
      await supabase.from('sessions').update({status: 'completed'}).eq('id', reportModal.id);
      
      setReportModal(null);
      setReportText("");
      setHomework("");
      setUnderstandingLevel(4);
      
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim laporan');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const now = new Date();
  
  const upcoming = sessions.filter(s => new Date(`${s.session_date}T${s.end_time}`) >= now);
  const pendingReviews = sessions.filter(s => new Date(`${s.session_date}T${s.end_time}`) < now && !sessionReports.has(s.id));

  return (
    <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-text-main">
          Manajemen Sesi
        </h1>
        <p className="text-sm text-text-sub">
          Kelola kelas aktif, akses link meeting, dan isi laporan progres untuk pertemuan yang sudah selesai.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="text-center py-8">Memuat sesi...</div>
        ) : (
          <>
            {pendingReviews.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-warning uppercase font-mono tracking-wider mb-3">Butuh Review ({pendingReviews.length})</h2>
                <div className="flex flex-col gap-4">
                  {pendingReviews.map((session: any) => (
                    <div
                      key={session.id}
                      className="bg-warning/5 border-[1.5px] border-warning/30 rounded-xl p-4 transition-all hover:border-warning/50"
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
                          </div>
                        </div>
                        <div className="bg-warning/20 text-warning text-[10px] font-bold px-2 py-1 rounded font-mono uppercase tracking-wider">
                          Butuh Review
                        </div>
                      </div>

                      <div className="bg-bg-2 rounded-lg p-3 mb-4 space-y-2 border border-border/50">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2 text-sm text-text-main font-bold">
                            <Calendar size={16} className="text-text-sub" />
                            <span>{new Date(session.session_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-main">
                          <Clock size={16} className="text-text-sub" />
                          <span>{session.start_time.substring(0,5)} - {session.end_time.substring(0,5)} WIB</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setReportModal(session)}
                          className="flex-1 bg-warning text-black font-bold py-2.5 rounded-lg text-sm hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit3 size={16} /> Isi Laporan Sesi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-bold text-text-light uppercase font-mono tracking-wider mb-3">Sesi Mendatang</h2>
              {upcoming.length === 0 ? (
                <div className="text-center py-8 text-text-sub bg-card border border-border rounded-xl">Belum ada sesi mendatang</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {upcoming.map((session: any) => (
                    <div
                      key={session.id}
                      className="bg-card border-[1.5px] border-border rounded-xl p-4 transition-all hover:border-border-2"
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
                          </div>
                        </div>
                        <div className="bg-lime-mid text-lime text-[10px] font-bold px-2 py-1 rounded font-mono uppercase tracking-wider">
                          {session.status}
                        </div>
                      </div>

                      <div className="bg-bg-2 rounded-lg p-3 mb-4 space-y-2 border border-border/50">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2 text-sm text-text-main font-bold">
                            <Calendar size={16} className="text-text-sub" />
                            <span>{new Date(session.session_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-main">
                          <Clock size={16} className="text-text-sub" />
                          <span>{session.start_time.substring(0,5)} - {session.end_time.substring(0,5)} WIB</span>
                        </div>
                        {session.material_notes && (
                          <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/50">
                            <span className="text-xs text-text-sub font-medium font-mono uppercase tracking-wider">
                              Catatan:
                            </span>
                            <p className="text-sm">{session.material_notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {session.meeting_type === 'offline' ? (
                          <div className="flex-1 bg-bg-2 border border-border text-center text-text-main font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
                            <span>📍 Lokasi: {session.location || 'Menunggu Info'}</span>
                          </div>
                        ) : (
                          session.meeting_link ? (
                            <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="flex-1 bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-dim transition-colors flex items-center justify-center gap-2">
                              <Video size={16} /> Buka Link Meeting
                            </a>
                          ) : (
                            <button onClick={() => {
                              const link = prompt('Masukkan Link Meeting (Zoom/GMeet):');
                              if (link) {
                                supabase.from('sessions').update({ meeting_link: link }).eq('id', session.id).then(() => fetchSessions());
                              }
                            }} className="flex-1 bg-bg-2 border border-lime text-lime font-bold py-2.5 rounded-lg text-sm hover:bg-lime/10 transition-colors flex items-center justify-center gap-2">
                              <Video size={16} /> Tambah Link Meeting
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {reportModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-pgIn" style={{overscrollBehavior: 'none'}}>
          <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b-[1.5px] border-border bg-bg-2">
              <div className="font-display font-bold text-[16px]">
                Laporan Sesi
              </div>
              <button
                onClick={() => setReportModal(null)}
                className="text-text-sub hover:text-text-main"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <div className="text-xs text-text-sub font-mono uppercase tracking-wider mb-1">
                  Siswa
                </div>
                <div className="font-bold font-display text-lg">
                  {reportModal.student_profiles?.profiles?.full_name || 'Siswa'}
                </div>
                <div className="text-sm text-lime font-mono">
                  {reportModal.subject} · {new Date(reportModal.session_date).toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold font-mono text-text-sub uppercase mb-1.5">
                    Materi yang Dibahas
                  </label>
                  <textarea
                    className="w-full bg-bg-2 border border-border rounded-lg p-3 text-sm min-h-[80px] focus:border-lime focus:outline-none resize-none"
                    placeholder="Deskripsikan secara singkat..."
                    value={reportText}
                    onChange={e => setReportText(e.target.value)}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold font-mono text-text-sub uppercase mb-1.5">
                    Tingkat Pemahaman (1-5)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => setUnderstandingLevel(v)}
                        className={`w-10 h-10 rounded border font-bold flex items-center justify-center transition-colors ${understandingLevel === v ? 'border-lime bg-lime text-black' : 'border-border bg-bg-2 hover:bg-bg-3'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold font-mono text-text-sub uppercase mb-1.5">
                    PR / Tugas (Opsional)
                  </label>
                  <input
                    type="text"
                    value={homework}
                    onChange={e => setHomework(e.target.value)}
                    className="w-full bg-bg-2 border border-border rounded-lg p-3 text-sm focus:border-lime focus:outline-none"
                    placeholder="Tugas yang diberikan..."
                  />
                </div>
              </div>

              <button
                className="w-full py-3 text-sm font-bold rounded-lg bg-lime text-black flex items-center justify-center gap-2 hover:bg-lime-dim disabled:opacity-50"
                onClick={submitReport}
                disabled={isSubmittingReport || !reportText.trim()}
              >
                {isSubmittingReport ? <Loader2 size={16} className="animate-spin" /> : null}
                {isSubmittingReport ? "Mengirim..." : "Kirim Laporan"}
              </button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
