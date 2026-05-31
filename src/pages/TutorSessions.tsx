import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, Video, FileText, Star, Clock, Edit3, X, Loader2, MapPin } from "lucide-react";
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';
import { getAvatarColor } from '../data';

export const parseSessionNotes = (rawNotes: string | null | undefined) => {
  if (!rawNotes) return { meta: null, notes: "" };
  if (rawNotes.startsWith("[META:")) {
    const parts = rawNotes.split(" || ");
    const metaTag = parts[0].replace("[META:", "").replace("]", "");
    const notesContent = parts.slice(1).join(" || ").trim();
    return { meta: metaTag, notes: notesContent };
  }
  // Backwards compatibility
  if (rawNotes === "Sesi menggunakan kuota paket (Prepaid)") {
    return { meta: "prepaid", notes: "" };
  }
  if (rawNotes === "Sesi baru") {
    return { meta: "single", notes: "" };
  }
  if (rawNotes.startsWith("Sesi 1 dari Paket")) {
    const match = rawNotes.match(/Sesi 1 dari Paket \(([^)]+)\)/);
    const pkgName = match ? match[1] : "Paket";
    return { meta: `bundle_init:${pkgName}`, notes: "" };
  }
  return { meta: null, notes: rawNotes };
};

export const parseLocationField = (locationStr: string | null | undefined) => {
  if (!locationStr) return { text: "", url: "" };

  // Strip common legacy labels and headings
  let clean = locationStr
    .replace(/Lokasi & Detail Pertemuan:/gi, "")
    .replace(/Link Google Maps:/gi, "")
    .replace(/Nama Tempat \/ Cafe \/ Gedung:/gi, "")
    .replace(/Detail Alamat & Patokan:/gi, "")
    .replace(/Alamat \/ Detail Lokasi:/gi, "")
    .replace(/Alamat Lengkap:/gi, "")
    .replace(/Titik GPS:/gi, "")
    .trim();

  // Extract URL if present
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const match = clean.match(urlRegex);
  let url = "";
  if (match) {
    url = match[0];
    clean = clean.replace(urlRegex, "").replace(/\(\s*\)/g, "").trim();
  }

  return { text: clean, url };
};

export function TutorSessions() {
  const [type, setType] = useState<"upcoming" | "past">("upcoming");
  const [reportModal, setReportModal] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionReports, setSessionReports] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile, user, targetSessionId, setTargetSessionId } = useAppContext();

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
           student_profiles(id, school_level, profiles(full_name))
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
      
      await supabase.from('sessions').update({
        status: 'waiting_for_student',
        status_updated_at: new Date().toISOString()
      }).eq('id', reportModal.id);
      
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

  const getSessionEndDateTime = (s: any) => {
    if (s.end_time?.includes('T')) return new Date(s.end_time);
    return s.session_date && s.end_time ? new Date(`${s.session_date}T${s.end_time}`) : new Date(0);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString(['id-ID', 'en-US'], { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    return timeStr.substring(0, 5);
  };

  const now = new Date();
  
  const pendingRequests = sessions.filter(s => s.status === 'pending');
  const upcoming = sessions.filter(s => s.status === 'confirmed' && getSessionEndDateTime(s) >= now);
  const pendingReviews = sessions.filter(s => s.status === 'confirmed' && getSessionEndDateTime(s) < now && !sessionReports.has(s.id));
  const waitingForStudent = sessions.filter(s => s.status === 'waiting_for_student');
  const targetSession = targetSessionId ? sessions.find(s => s.id === targetSessionId) : null;

  const updateSessionStatus = async (sessionId: string, newStatus: string, studentId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: newStatus, status_updated_at: new Date().toISOString() })
        .eq('id', sessionId);
        
      if (error) throw error;
      
      // Notify Student
      await supabase.from('notifications').insert({
        user_id: studentId,
        title: newStatus === 'confirmed' ? "Sesi Disetujui Tutor!" : "Sesi Ditolak",
        message: newStatus === 'confirmed' 
          ? "Tutor telah menyetujui jadwal sesi kamu. Silakan selesaikan pembayaran di tab Tagihan agar link kelas dapat diakses!"
          : "Maaf, tutor tidak dapat memenuhi permintaan sesi kamu pada waktu tersebut.",
        link: "student_sessions"
      });
      
      fetchSessions();
    } catch (e) {
      console.error(e);
      alert('Gagal memperbarui status sesi');
    }
  };

  return (
    <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full pb-24">
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
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-lime uppercase font-mono tracking-wider mb-3">Permintaan Baru ({pendingRequests.length})</h2>
                <div className="flex flex-col gap-4">
                  {pendingRequests.map((session: any) => (
                    <div
                      key={session.id}
                      className="bg-lime/5 border-[1.5px] border-lime/30 rounded-xl p-4 transition-all hover:border-lime/50"
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
                            <div className="font-bold text-text-main font-display flex items-center gap-2">
                              {session.student_profiles?.profiles?.full_name || 'Siswa'}
                              {(() => {
                                 const level = session.student_profiles?.school_level;
                                 if (!level) return null;
                                 let dotColor = "bg-text-sub";
                                 if (level.includes('SD')) dotColor = "bg-rose-400";
                                 else if (level.includes('SMP')) dotColor = "bg-sky-400";
                                 else if (level.includes('SMA')) dotColor = "bg-slate-400";
                                 return <span className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-text-main font-medium tracking-wider flex items-center gap-1.5 w-fit whitespace-nowrap"><span className={`w-1 h-1 rounded-full shrink-0 ${dotColor}`}></span> {level}</span>
                               })()}
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
                        <div className="bg-lime text-black text-[10px] font-bold px-2 py-1 rounded font-mono uppercase tracking-wider">
                          Pending
                        </div>
                      </div>

                      <div className="bg-bg-2 rounded-lg p-3 mb-4 space-y-2 border border-border/50">
                        <div className="flex items-center gap-2 text-sm text-text-main font-bold">
                          <Calendar size={16} className="text-text-sub" />
                          <span>{new Date(session.session_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-main">
                          <Clock size={16} className="text-text-sub" />
                          <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                        </div>
                        {(() => {
                          const parsed = parseSessionNotes(session.material_notes);
                          return (
                            <p className="text-[11px] text-text-sub italic mt-2 border-t border-border/30 pt-2 line-clamp-2">
                              {parsed.notes ? `"${parsed.notes}"` : "Topik: Membahas materi umum"}
                            </p>
                          );
                        })()}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => updateSessionStatus(session.id, 'confirmed', session.student_id)}
                          className="flex-1 bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:opacity-90 transition-colors"
                        >
                          Terima Sesi
                        </button>
                        <button
                          onClick={() => updateSessionStatus(session.id, 'rejected', session.student_id)}
                          className="flex-1 bg-bg-3 border border-border text-text-main font-bold py-2.5 rounded-lg text-sm hover:bg-bg-2 transition-colors"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                            <div className="font-bold text-text-main font-display flex items-center gap-2">
                              {session.student_profiles?.profiles?.full_name || 'Siswa'}
                              {(() => {
                                 const level = session.student_profiles?.school_level;
                                 if (!level) return null;
                                 let dotColor = "bg-text-sub";
                                 if (level.includes('SD')) dotColor = "bg-rose-400";
                                 else if (level.includes('SMP')) dotColor = "bg-sky-400";
                                 else if (level.includes('SMA')) dotColor = "bg-slate-400";
                                 return <span className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-text-main font-medium tracking-wider flex items-center gap-1.5 w-fit whitespace-nowrap"><span className={`w-1 h-1 rounded-full shrink-0 ${dotColor}`}></span> {level}</span>
                               })()}
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
                          <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
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

            {waitingForStudent.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-lime uppercase font-mono tracking-wider mb-3">Menunggu Konfirmasi Siswa ({waitingForStudent.length})</h2>
                <div className="flex flex-col gap-4">
                  {waitingForStudent.map((session: any) => (
                    <div
                      key={session.id}
                      className="bg-card border-[1.5px] border-border rounded-xl p-4 transition-all opacity-80 cursor-not-allowed"
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
                            <div className="font-bold text-text-main font-display flex items-center gap-2">
                              {session.student_profiles?.profiles?.full_name || 'Siswa'}
                              {(() => {
                                 const level = session.student_profiles?.school_level;
                                 if (!level) return null;
                                 let dotColor = "bg-text-sub";
                                 if (level.includes('SD')) dotColor = "bg-rose-400";
                                 else if (level.includes('SMP')) dotColor = "bg-sky-400";
                                 else if (level.includes('SMA')) dotColor = "bg-slate-400";
                                 return <span className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-text-main font-medium tracking-wider flex items-center gap-1.5 w-fit whitespace-nowrap"><span className={`w-1 h-1 rounded-full shrink-0 ${dotColor}`}></span> {level}</span>
                               })()}
                            </div>
                            <div className="text-xs text-text-sub font-mono">
                              {session.subject}
                            </div>
                          </div>
                        </div>
                        <div className="bg-bg-3 border border-border text-text-sub text-[10px] font-bold px-2 py-1 rounded font-mono uppercase tracking-wider">
                          Menunggu Siswa
                        </div>
                      </div>

                      <div className="bg-bg-2 rounded-lg p-3 space-y-2 border border-border/50">
                        <div className="flex items-center gap-2 text-sm text-text-main font-bold">
                          <Calendar size={16} className="text-text-sub" />
                          <span>{new Date(session.session_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-main">
                          <Clock size={16} className="text-text-sub" />
                          <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                        </div>
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
                            <div className="font-bold text-text-main font-display flex items-center gap-2">
                              {session.student_profiles?.profiles?.full_name || 'Siswa'}
                              {(() => {
                                 const level = session.student_profiles?.school_level;
                                 if (!level) return null;
                                 let dotColor = "bg-text-sub";
                                 if (level.includes('SD')) dotColor = "bg-rose-400";
                                 else if (level.includes('SMP')) dotColor = "bg-sky-400";
                                 else if (level.includes('SMA')) dotColor = "bg-slate-400";
                                 return <span className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-text-main font-medium tracking-wider flex items-center gap-1.5 w-fit whitespace-nowrap"><span className={`w-1 h-1 rounded-full shrink-0 ${dotColor}`}></span> {level}</span>
                               })()}
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
                          <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                        </div>
                        {(() => {
                          const parsed = parseSessionNotes(session.material_notes);
                          return (
                            <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/50">
                              <span className="text-xs text-text-sub font-medium font-mono uppercase tracking-wider">
                                Catatan/Topik Bahasan:
                              </span>
                              <p className="text-sm font-sans italic text-text-main">
                                {parsed.notes ? `"${parsed.notes}"` : "Siswa tidak menuliskan topik spesifik (belajar materi umum sesuai mapel)."}
                              </p>
                            </div>
                          );
                        })()}
                        <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-border/40 text-xs text-text-main">
                          {session.meeting_type !== 'offline' && (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-[11px] text-text-sub uppercase font-mono tracking-wider">🖥️ Link Kelas Online:</span>
                              {session.meeting_link ? (
                                <div className="mt-0.5 font-sans">
                                  <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-lime font-bold hover:underline underline-offset-2 break-all bg-lime/15 px-2 py-0.5 rounded border border-lime/30 text-[11px]">
                                    🔗 {session.meeting_link} ↗
                                  </a>
                                </div>
                              ) : (
                                <p className="text-text-sub italic text-[11px]">Link meeting belum dimasukkan. Silakan ketuk tombol tambah di bawah.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {session.meeting_type === 'offline' ? (
                          (() => {
                            const parsedLoc = parseLocationField(session.location);
                            return (
                              <div className="w-full bg-bg-2 border border-border p-3 rounded-lg text-[12px] leading-relaxed text-text-main shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-start gap-1.5 flex-1 min-w-[200px]">
                                    <span className="font-bold text-text-sub font-mono uppercase text-[10px] mt-0.5">📍:</span>
                                    <span className="text-text-main font-medium">{parsedLoc.text || "Belum ada lokasi detail"}</span>
                                  </div>
                                  {parsedLoc.url && (
                                    <a
                                      href={parsedLoc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 bg-lime text-black font-extrabold px-2.5 py-1 rounded-md text-[11px] hover:bg-lime-dim transition-all whitespace-nowrap border border-black/10 shadow hover:scale-[1.01] active:scale-[0.99]"
                                    >
                                      Buka Google Maps ↗
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          session.meeting_link ? (
                            <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="flex-1 bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-dim transition-colors flex items-center justify-center gap-2">
                              <Video size={16} /> Buka Link Meeting
                            </a>
                          ) : (
                            <button onClick={async () => {
                              const link = prompt('Masukkan Link Meeting (Zoom/GMeet):');
                              if (link) {
                                try {
                                  await supabase.from('sessions').update({ meeting_link: link }).eq('id', session.id);
                                  // Notify Student
                                  await supabase.from('notifications').insert({
                                    user_id: session.student_id,
                                    title: "Link Kelas Sudah Siap!",
                                    message: `Tutor ${userProfile?.full_name || 'kamu'} telah menyertakan link meeting untuk kelas ${session.subject} pada ${new Date(session.session_date).toLocaleDateString('id-ID')}.`,
                                    link: "student_sessions"
                                  });
                                  fetchSessions();
                                } catch (err) {
                                  console.error('Error adding meeting link and notification:', err);
                                  fetchSessions();
                                }
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

      {targetSession && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-pgIn" style={{overscrollBehavior: 'none'}}>
          <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b-[1.5px] border-border bg-bg-2">
              <div className="font-display font-bold text-[16px]">
                Detail Permintaan Sesi
              </div>
              <button
                onClick={() => setTargetSessionId(null)}
                className="text-text-sub hover:text-text-main"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold font-display text-white opacity-80 text-lg"
                  style={{ background: getAvatarColor(targetSession.student_profiles?.profiles?.full_name || 'Siswa') }}
                >
                  {(targetSession.student_profiles?.profiles?.full_name || 'S').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-text-main font-display text-lg leading-snug">
                    {targetSession.student_profiles?.profiles?.full_name || 'Siswa'}
                  </div>
                  <div className="text-xs text-text-sub font-mono uppercase tracking-wider">
                    {targetSession.subject}
                  </div>
                </div>
              </div>

              <div className="bg-bg-2 rounded-xl p-4 space-y-3 border border-border/80 mb-6">
                <div className="flex items-center gap-2.5 text-sm text-text-main">
                  <Calendar size={18} className="text-lime" />
                  <div>
                    <span className="block text-[10px] text-text-sub font-mono uppercase">Tanggal</span>
                    <span className="font-bold">{new Date(targetSession.session_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-text-main border-t border-border/40 pt-2.5">
                  <Clock size={18} className="text-lime" />
                  <div>
                    <span className="block text-[10px] text-text-sub font-mono uppercase">Waktu</span>
                    <span className="font-bold">{formatTime(targetSession.start_time)} - {formatTime(targetSession.end_time)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-text-main border-t border-border/40 pt-2.5">
                  <span className="text-lg leading-none select-none">📍</span>
                  <div>
                    <span className="block text-[10px] text-text-sub font-mono uppercase">Jenis Pertemuan</span>
                    <span className="font-bold capitalize">{targetSession.meeting_type === 'offline' ? `Offline (${targetSession.location || 'Lokasi n/a'})` : 'Online'}</span>
                  </div>
                </div>
                {(() => {
                  const parsed = parseSessionNotes(targetSession.material_notes);
                  return (
                    <>
                      {parsed.meta && (
                        <div className="border-t border-border/40 pt-2.5">
                          <span className="block text-[10px] text-text-sub font-mono uppercase pb-1">Tipe Pemesanan</span>
                          <span className="text-xs text-lime font-mono font-bold uppercase tracking-wider bg-lime/10 px-2.5 py-1 rounded inline-block border border-lime/20">
                            {parsed.meta === "prepaid" ? "⚡ Kuota Paket" : 
                             parsed.meta === "single" ? "🎯 Sesi Satuan" : 
                             `📦 Sesi Paket (${parsed.meta.replace("bundle_init:", "")})`}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-border/40 pt-2.5">
                        <span className="block text-[10px] text-text-sub font-mono uppercase pb-1">Catatan Siswa (Topik Bahasan)</span>
                        <p className="text-xs text-text-sub italic bg-card/50 p-2.5 rounded-lg border border-border/30 font-sans">
                          {parsed.notes ? `"${parsed.notes}"` : "Siswa tidak menuliskan topik spesifik (belajar materi umum sesuai mapel)."}
                        </p>
                      </div>
                    </>
                  );
                })()}
                <div className="border-t border-border/40 pt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-text-sub font-mono uppercase">Status Saat Ini</span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded font-mono uppercase tracking-wider ${
                    targetSession.status === 'pending' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' :
                    targetSession.status === 'confirmed' ? 'bg-lime/10 text-lime border border-lime/30' :
                    'bg-zinc-500/15 text-text-sub border border-zinc-500/30'
                  }`}>
                    {targetSession.status}
                  </span>
                </div>
              </div>

              {targetSession.status === 'pending' ? (
                <div className="space-y-3">
                  <div className="text-center text-xs text-text-sub font-medium px-4 mb-2">
                    Apakah Anda ingin menyetujui jadwal sesi kelas ini?
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await updateSessionStatus(targetSession.id, 'confirmed', targetSession.student_id);
                        setTargetSessionId(null);
                      }}
                      className="flex-1 bg-lime text-black font-bold py-3 rounded-xl text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    >
                      ✓ Setuju Sesi
                    </button>
                    <button
                      onClick={async () => {
                        await updateSessionStatus(targetSession.id, 'rejected', targetSession.student_id);
                        setTargetSessionId(null);
                      }}
                      className="flex-1 bg-bg-3 border border-border text-red-500 font-bold py-3 rounded-xl text-sm hover:bg-bg-2 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    >
                      ✗ Tolak Sesi
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setTargetSessionId(null)}
                  className="w-full bg-lime text-black font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-all"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
