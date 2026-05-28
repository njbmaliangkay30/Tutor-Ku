import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";

export function SessionBookingCard({ sessionId, messageContent, isMe, userRole }: { sessionId: string, messageContent: string, isMe: boolean, userRole: string | undefined }) {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select("id, status, session_date, start_time, end_time")
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

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden border ${isMe ? 'border-black/10' : 'border-border'} w-full max-w-[280px] md:max-w-[320px]`}>
      <div className={`p-4 ${isMe ? 'bg-black/5' : 'bg-bg-1'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={14} className={isMe ? 'text-black/60' : 'text-lime'} />
          <div className="text-[11px] font-bold font-mono tracking-wider uppercase opacity-70">Pengajuan Jadwal</div>
        </div>
        <div className={`text-[13px] leading-relaxed whitespace-pre-wrap ${isMe ? 'text-black/80' : 'text-text-main/90'}`}>
          {messageContent}
        </div>
      </div>
      
      <div className={`p-3 border-t flex flex-col gap-2 ${isMe ? 'bg-black/10 border-black/5' : 'bg-bg-2 border-border/50'}`}>
        {isPending ? (
          <>
            {userRole === 'tutor' && !isMe ? (
              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => handleAction('confirmed')}
                  className="flex-1 bg-lime text-black py-2 rounded-lg text-xs font-bold hover:bg-[rgb(var(--color-lime-dim))] transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> Terima
                </button>
                <button 
                  onClick={() => handleAction('cancelled')}
                  className="flex-1 border-[1.5px] border-red-500/30 text-red-500 hover:bg-red-500/10 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} /> Tolak
                </button>
              </div>
            ) : (
              <div className={`flex items-center gap-1.5 text-xs font-bold ${isMe ? 'text-black/60' : 'text-warning'}`}>
                <Clock size={14} /> Menunggu Persetujuan
              </div>
            )}
          </>
        ) : isConfirmed ? (
          <div className={`flex items-center gap-1.5 text-xs font-bold ${isMe ? 'text-black/80' : 'text-lime'}`}>
             <CheckCircle2 size={14} /> Jadwal Disetujui
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 text-xs font-bold text-red-500`}>
             <XCircle size={14} /> Pengajuan Ditolak
          </div>
        )}
      </div>
    </div>
  );
}
