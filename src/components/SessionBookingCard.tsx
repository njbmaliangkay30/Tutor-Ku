import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Calendar, CheckCircle2, XCircle, Clock, MapPin, Video } from "lucide-react";
import { parseSessionNotes, parseLocationField } from "../pages/TutorSessions";

export function SessionBookingCard({ sessionId, messageContent, isMe, userRole }: { sessionId: string, messageContent: string, isMe: boolean, userRole: string | undefined }) {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select("id, status, session_date, start_time, end_time, subject, meeting_type, location, material_notes")
          .eq("id", sessionId)
          .single();
        if (data) {
          setSessionInfo(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();

    // Subscribe to session changes so it updates live
    const sub = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setSessionInfo((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [sessionId]);

  const handleAction = async (action: 'confirmed' | 'cancelled') => {
    try {
      await supabase.from("sessions").update({ status: action }).eq("id", sessionId);
    } catch (e) {
      alert("Gagal memproses");
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString(['id-ID', 'en-US'], { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    return timeStr.substring(0, 5);
  };

  if (loading) {
    return (
      <div className={`p-4 rounded-xl border opacity-70 ${isMe ? 'border-black/10 bg-black/5' : 'border-border bg-bg-2'}`}>
        <span className="text-xs">Memuat informasi jadwal...</span>
      </div>
    );
  }

  // If no session info is found (maybe deleted)
  if (!sessionInfo) {
    return (
      <div className={`flex flex-col p-4 rounded-xl border ${isMe ? 'border-black/10 bg-black/5 text-black' : 'border-border bg-bg-2 text-text-main'}`}>
        <span className="whitespace-pre-wrap">{messageContent}</span>
      </div>
    );
  }

  const isPending = sessionInfo.status === 'pending';
  const isConfirmed = sessionInfo.status === 'confirmed';
  const isCancelled = sessionInfo.status === 'cancelled';
  
  const parsedNotes = parseSessionNotes(sessionInfo.material_notes);
  const notesText = parsedNotes.notes ? `"${parsedNotes.notes}"` : "-";

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden border ${isMe ? 'border-black/10' : 'border-border'} w-full max-w-[320px] md:max-w-[350px]`}>
      <div className={`p-4 ${isMe ? 'bg-black/5' : 'bg-bg-1'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className={isMe ? 'text-black/60' : 'text-lime'} />
          <div className="text-xs font-bold font-mono tracking-wider uppercase opacity-70 border-b border-black/10 pb-1 flex-1">Pengajuan Jadwal</div>
        </div>
        
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-black/10' : 'bg-lime/20 text-lime'}`}>
             {sessionInfo.meeting_type === 'online' ? <Video size={18} /> : <MapPin size={18} />}
          </div>
          <div className="flex flex-col">
            <span className={`text-[13px] font-bold ${isMe ? 'text-black/80' : 'text-text-main'}`}>
              {new Date(sessionInfo.session_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className={`text-xs font-mono mt-0.5 ${isMe ? 'text-black/60' : 'text-text-sub'}`}>
              {formatTime(sessionInfo.start_time)} - {formatTime(sessionInfo.end_time)}
            </span>
          </div>
        </div>

        <div className={`space-y-1.5 p-3 rounded-lg border ${isMe ? 'bg-black/5 border-black/10' : 'bg-bg-2 border-border/50'}`}>
          <div className="flex justify-between items-start gap-2">
            <span className={`text-[10px] font-mono uppercase tracking-wider ${isMe ? 'text-black/50' : 'text-text-muted'}`}>Subjek</span>
            <span className={`text-xs font-bold text-right ${isMe ? 'text-black/80' : 'text-text-main'}`}>{sessionInfo.subject}</span>
          </div>
          <div className="flex justify-between items-start gap-2">
            <span className={`text-[10px] font-mono uppercase tracking-wider ${isMe ? 'text-black/50' : 'text-text-muted'}`}>Tipe</span>
            <span className={`text-xs font-bold text-right ${isMe ? 'text-black/80' : 'text-text-main'}`}>
              {sessionInfo.meeting_type === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex justify-between items-start gap-2">
            <span className={`text-[10px] font-mono uppercase tracking-wider pt-1 ${isMe ? 'text-black/50' : 'text-text-muted'}`}>Catatan</span>
            <span className={`text-xs italic text-right ${isMe ? 'text-black/70' : 'text-text-sub'}`}>{notesText}</span>
          </div>
        </div>
      </div>
      
      <div className={`p-4 border-t flex flex-col gap-2 ${isMe ? 'bg-black/10 border-black/5' : 'bg-bg-2 border-border/50'}`}>
        {isPending ? (
          <>
            {userRole === 'tutor' && !isMe ? (
              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => handleAction('confirmed')}
                  className="flex-1 bg-lime text-black py-2.5 rounded-lg text-[13px] font-bold hover:bg-[rgb(var(--color-lime-dim))] transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={16} /> Terima
                </button>
                <button 
                  onClick={() => handleAction('cancelled')}
                  className="flex-1 border-[1.5px] border-red-500/30 text-red-500 hover:bg-red-500/10 py-2.5 rounded-lg text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle size={16} /> Tolak
                </button>
              </div>
            ) : (
              <div className={`flex items-center gap-2 text-xs font-bold justify-center ${isMe ? 'text-black/60' : 'text-warning'}`}>
                <Clock size={16} /> Menunggu Persetujuan
              </div>
            )}
          </>
        ) : isConfirmed ? (
          <div className={`flex items-center gap-2 text-[13px] font-bold justify-center ${isMe ? 'text-black/80' : 'text-lime'}`}>
             <CheckCircle2 size={16} /> Pertemuan Dijadwalkan
          </div>
        ) : (
          <div className={`flex items-center gap-2 text-[13px] font-bold text-red-500 justify-center`}>
             <XCircle size={16} /> Pengajuan Ditolak
          </div>
        )}
      </div>
    </div>
  );
}
