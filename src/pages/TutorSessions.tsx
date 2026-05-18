import { useState, useEffect } from "react";
import { Calendar, Video, FileText, Star, Clock, Edit3, X } from "lucide-react";
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';
import { getAvatarColor } from '../data';

export function TutorSessions() {
  const [type, setType] = useState<"upcoming" | "past">("upcoming");
  const [reportModal, setReportModal] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile } = useAppContext();

  useEffect(() => {
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
       } catch (e) {
         console.error(e);
       } finally {
         setIsLoading(false);
       }
    };
    fetchSessions();
  }, [userProfile]);

  const now = new Date();
  
  const upcoming = sessions.filter(s => new Date(`${s.session_date}T${s.end_time}`) >= now);
  const past = sessions.filter(s => new Date(`${s.session_date}T${s.end_time}`) < now);

  const currentList = type === "upcoming" ? upcoming : past;

  return (
    <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-text-main">
          Manajemen Sesi
        </h1>
        <p className="text-sm text-text-sub">
          Kelola kelas aktif, akses link meeting, dan isi laporan progres.
        </p>
      </div>

      <div className="flex bg-bg-2 border-[1.5px] border-border rounded-lg p-1 mb-6">
        <button
          onClick={() => setType("upcoming")}
          className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${type === "upcoming" ? "bg-lime-mid text-lime" : "text-text-sub hover:text-text-main"}`}
        >
          Sesi Mendatang
        </button>
        <button
          onClick={() => setType("past")}
          className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${type === "past" ? "bg-lime-mid text-lime" : "text-text-sub hover:text-text-main"}`}
        >
          Riwayat & Laporan
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="text-center py-8">Memuat sesi...</div>
        ) : currentList.map((session: any) => (
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
                {type === "past" && session.rating && (
                  <div className="flex items-center gap-1 text-xs font-bold text-warning font-mono">
                    <Star size={12} fill="currentColor" /> {session.rating}.0
                  </div>
                )}
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

            {type === "upcoming" && (
              <div className="flex gap-2">
                <button className="flex-1 bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-dim transition-colors flex items-center justify-center gap-2">
                  <Video size={16} /> Buka Google Meet
                </button>
              </div>
            )}

            {type === "past" && (
              <div className="flex gap-2">
                {!session.hasReport ? (
                  <button
                    onClick={() => setReportModal(session)}
                    className="flex-1 border-[1.5px] border-warning text-warning bg-warning/10 font-bold py-2 rounded-lg text-xs hover:bg-warning/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit3 size={16} /> Wajib Isi Laporan Sesi
                  </button>
                ) : (
                  <button className="flex-1 border-[1.5px] border-border text-text-main bg-bg-2 font-bold py-2 rounded-lg text-xs hover:bg-bg-3 transition-colors flex items-center justify-center gap-2">
                    <FileText size={16} /> Lihat Laporan Anda
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {currentList.length === 0 && (
          <div className="text-center py-10 text-text-sub">
            Tidak ada data sesi.
          </div>
        )}
      </div>

      {reportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden">
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
                  {reportModal.student}
                </div>
                <div className="text-sm text-lime font-mono">
                  {reportModal.subject} · {reportModal.date}
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
                        className="w-10 h-10 rounded border border-border bg-bg-2 hover:bg-bg-3 font-bold flex items-center justify-center"
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
                    className="w-full bg-bg-2 border border-border rounded-lg p-3 text-sm focus:border-lime focus:outline-none"
                    placeholder="Tugas yang diberikan..."
                  />
                </div>
              </div>

              <button
                className="w-full py-3 text-sm font-bold rounded-lg bg-lime text-black flex items-center justify-center gap-2 hover:bg-lime-dim"
                onClick={() => setReportModal(null)}
              >
                Kirim Laporan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
