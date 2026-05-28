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

  const baseBubbleClass = `flex flex-col shadow-sh1 w-full max-w-[320px] md:max-w-[350px] ${
    isMe 
      ? 'bg-lime text-black border-[2px] border-lime/80 rounded-2xl rounded-tr-sm' 
      : 'bg-bg-2 border-[2px] border-border text-text-main rounded-2xl rounded-tl-sm'
  }`;

  if (loading) {
    return (
      <div className={`${baseBubbleClass} p-4 opacity-70`}>
        <span className="text-xs font-medium">Memuat informasi jadwal...</span>
      </div>
    );
  }

  if (!sessionInfo) {
    return (
      <div className={`${baseBubbleClass} p-4`}>
        <span className="whitespace-pre-wrap text-[13px]">{messageContent}</span>
      </div>
    );
  }

  const isPending = sessionInfo.status === 'pending';
  const isConfirmed = sessionInfo.status === 'confirmed';
  
  const parsedNotes = parseSessionNotes(sessionInfo.material_notes);
  const notesText = parsedNotes.notes ? `"${parsedNotes.notes}"` : "-";

  return (
    <div className={baseBubbleClass}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className={isMe ? 'text-black/60' : 'text-lime'} />
          <div className={`text-xs font-bold font-mono tracking-wider uppercase border-b pb-1 flex-1 ${isMe ? 'opacity-70 border-black/10' : 'opacity-70 border-border'}`}>
            Pengajuan Jadwal
          </div>
        </div>
        
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${
            isMe ? 'bg-black/10 border-black/5 text-black' : 'bg-lime/10 border-lime/20 text-lime'
          }`}>
             {sessionInfo.meeting_type === 'online' ? <Video size={20} /> : <MapPin size={20} />}
          </div>
          <div className="flex flex-col pt-0.5">
            <span className={`text-[14px] font-bold ${isMe ? 'text-black' : 'text-text-main'}`}>
              {new Date(sessionInfo.session_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className={`text-[13px] font-mono mt-1 font-medium ${isMe ? 'text-black/70' : 'text-text-sub'}`}>
              {formatTime(sessionInfo.start_time)} - {formatTime(sessionInfo.end_time)}
            </span>
          </div>
        </div>

        <div className={`space-y-2 p-3.5 rounded-xl border ${
          isMe ? 'bg-black/5 border-black/10 text-black' : 'bg-bg-1 border-border/50 text-text-main'
        }`}>
          <div className="flex justify-between items-start gap-2">
            <span className={`text-[10.5px] font-mono uppercase tracking-wider ${isMe ? 'text-black/50' : 'text-text-muted'}`}>Subjek</span>
            <span className="text-xs font-bold text-right">{sessionInfo.subject}</span>
          </div>
          <div className="flex justify-between items-start gap-2">
            <span className={`text-[10.5px] font-mono uppercase tracking-wider ${isMe ? 'text-black/50' : 'text-text-muted'}`}>Tipe</span>
            <span className="text-xs font-bold text-right">
              {sessionInfo.meeting_type === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex justify-between items-start gap-2">
            <span className={`text-[10.5px] font-mono uppercase tracking-wider pt-0.5 ${isMe ? 'text-black/50' : 'text-text-muted'}`}>Catatan</span>
            <span className={`text-xs italic text-right ${isMe ? 'text-black/70' : 'text-text-sub'}`}>{notesText}</span>
          </div>
        </div>
      </div>
      
      <div className={`p-4 border-t flex flex-col gap-2 ${
        isMe ? 'bg-black/5 border-black/10' : 'bg-bg-1 border-border/50'
      }`}>
        {isPending ? (
          <>
            {userRole === 'tutor' && !isMe ? (
              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => handleAction('confirmed')}
                  className="flex-1 bg-lime text-black py-2.5 rounded-lg text-[13px] font-bold hover:bg-[rgb(var(--color-lime-dim))] transition-colors flex items-center justify-center gap-1.5 shadow-sm border border-black/10"
                >
                  <CheckCircle2 size={16} /> Terima
                </button>
                <button 
                  onClick={() => handleAction('cancelled')}
                  className="flex-1 bg-red-500/10 border-[1.5px] border-red-500/30 text-red-500 hover:bg-red-500/20 py-2.5 rounded-lg text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5"
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
