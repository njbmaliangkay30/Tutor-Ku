import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, Clock, Check, X, MapPin, Video, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAppContext } from "../AppContext";
import { getAvatarColor, DAYS } from "../data";
import { parseSessionNotes, parseLocationField } from './TutorSessions';

export function TutorSchedule() {
  const { userProfile, userRole, setActiveTab } = useAppContext();
  
  const getLocalTodayDateStr = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [activeDateStr, setActiveDateStr] = useState<string>(getLocalTodayDateStr());
  const [bookingModal, setBookingModal] = useState<any>(null);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      if (userRole !== "tutor" || !userProfile) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select(
            `
            *,
            student_profiles(id, profiles(full_name))
          `
          )
          .eq("tutor_id", userProfile.id)
          .in("status", ["pending", "confirmed", "completed"])
          .order("start_time", { ascending: true });

        if (error) throw error;
        setAllSessions(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    if (userProfile && userRole === "tutor") {
      fetchSessions();
    }
  }, [userProfile, userRole]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString(['id-ID', 'en-US'], { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    return timeStr.substring(0, 5);
  };

  const handleAction = async (
    sessionId: string,
    action: "confirmed" | "cancelled",
  ) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ status: action })
        .eq("id", sessionId);

      if (error) throw error;

      setAllSessions((prev) => 
        prev.map(s => s.id === sessionId ? { ...s, status: action } : s)
      );
      setBookingModal(null);
    } catch (e) {
      console.error(e);
      alert("Gagal memperbarui status");
    }
  };

  if (userRole !== "tutor" || !userProfile) {
    return (
      <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full text-center mt-10">
        <h1 className="text-2xl font-bold font-display text-text-main mb-4">
          Jadwal & Agenda
        </h1>
        <p className="text-sm text-text-sub mb-6">
          Halaman ini hanya untuk tutor. Silakan login sebagai tutor.
        </p>
        <button
          onClick={() => setActiveTab("login")}
          className="bg-lime text-black font-bold py-3 px-8 rounded-lg hover:bg-lime-dim transition-colors"
        >
          Login Sekarang
        </button>
      </div>
    );
  }

  const today = new Date();
  const dates = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      
      const daySessions = allSessions.filter(s => s.session_date === dateStr);
      const hasPending = daySessions.some(s => s.status === 'pending');
      const hasConfirmed = daySessions.some(s => s.status === 'confirmed');

      return {
        dayStr: DAYS[d.getDay()],
        dateNum: d.getDate(),
        fullDate: d,
        dateStr,
        hasPending,
        hasConfirmed
      };
    });
  }, [allSessions]);

  const activeDateDetails = dates.find(d => d.dateStr === activeDateStr);
  const activeDateSessions = allSessions.filter(s => s.session_date === activeDateStr && s.status !== 'cancelled');

  return (
    <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full flex flex-col h-full min-h-screen pb-24">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold font-display text-text-main">
          Agenda Kelas
        </h1>
        <p className="text-sm text-text-sub">
          Atur ketersediaan waktu, lihat jadwal mengajar, dan kelola request masuk.
        </p>
      </div>

      <div className="bg-card border-[1.5px] border-border rounded-xl p-5 mb-6 shrink-0 shadow-sh1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold font-mono tracking-widest uppercase">
            Pilih Tanggal
          </h2>
          <span className="text-[10px] text-text-sub font-mono">
            {activeDateDetails?.fullDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </span>
        </div>
        <div className="flex gap-2 min-w-0 overflow-x-auto pb-3 -mx-2 px-2 custom-scrollbar snap-x">
          {dates.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDateStr(d.dateStr)}
              className={`snap-start flex-shrink-0 w-[56px] h-[76px] rounded-xl border-[1.5px] flex flex-col items-center justify-center gap-1 transition-all relative ${
                activeDateStr === d.dateStr
                  ? "border-lime bg-lime-mid text-lime shadow-sh1 -translate-y-0.5"
                  : "border-border bg-bg-2 hover:bg-bg-3"
              }`}
            >
              <div className={`text-[10px] font-bold ${activeDateStr === d.dateStr ? 'text-lime' : 'text-text-sub'}`}>{d.dayStr}</div>
              <div className="text-xl font-display font-extrabold">
                {d.dateNum}
              </div>
              <div className="flex gap-1 mt-0.5 h-1.5">
                {d.hasConfirmed && (
                  <div className={`w-1.5 h-1.5 rounded-full ${activeDateStr === d.dateStr ? "bg-lime" : "bg-text-sub"}`} title="Ada kelas terjadwal" />
                )}
                {d.hasPending && (
                  <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" title="Ada request baru" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[13px] font-bold font-mono tracking-widest uppercase">
            Jadwal: {activeDateDetails?.fullDate.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
        </div>

        <div className="flex flex-col gap-3 relative">
          {isLoading ? (
            <div className="text-center py-8 text-text-sub text-sm">Memuat jadwal...</div>
          ) : activeDateSessions.length === 0 ? (
            <div className="text-center py-12 px-6 border-[2px] border-dashed border-border rounded-xl bg-bg-2/50">
              <div className="mx-auto w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center mb-3 text-text-sub">
                <CalendarIcon size={24} />
              </div>
              <h3 className="font-bold font-display text-lg mb-1">Kosong</h3>
              <p className="text-sm text-text-sub">Tidak ada jadwal atau request masuk pada tanggal ini.</p>
            </div>
          ) : (
            <div className="ml-4 border-l-2 border-border/60 pl-6 space-y-6 relative">
              {activeDateSessions.map((req) => {
                const isPending = req.status === 'pending';
                const isConfirmed = req.status === 'confirmed';
                const isCompleted = req.status === 'completed';
                
                return (
                  <div key={req.id} className="relative group animate-pgIn">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[31px] w-[14px] h-[14px] rounded-full border-4 border-bg-base z-10 
                      ${isPending ? 'bg-warning ring-2 ring-warning/30' 
                        : isCompleted ? 'bg-text-muted ring-1 ring-border' 
                        : 'bg-lime ring-2 ring-lime/30'}`} 
                    />
                    
                    {/* Time Header */}
                    <div className="text-xs font-mono font-bold tracking-wide mb-2 flex items-center gap-2">
                       <span className={isPending ? 'text-warning' : isCompleted ? 'text-text-muted' : 'text-lime'}>
                         {formatTime(req.start_time)} - {formatTime(req.end_time)}
                       </span>
                       {isPending && <span className="bg-warning/20 text-warning px-1.5 py-0.5 rounded-[4px] text-[9px] uppercase tracking-wider">Menunggu</span>}
                       {isConfirmed && <span className="bg-lime/20 text-lime px-1.5 py-0.5 rounded-[4px] text-[9px] uppercase tracking-wider">Terkonfirmasi</span>}
                    </div>

                    {/* Card container */}
                    <div className={`rounded-xl border-[1.5px] p-4 transition-all duration-300
                      ${isPending ? 'border-warning/40 bg-warning/5 hover:border-warning/60 shadow-sm' 
                        : isCompleted ? 'border-border/50 bg-bg-2/50 opacity-70' 
                        : 'border-border bg-card shadow-sh1 hover:shadow-sh2 hover:border-lime/40'}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-3 items-start">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-display text-white border border-border"
                            style={{ background: getAvatarColor(req.student_profiles?.profiles?.full_name || "Siswa") }}
                          >
                            {(req.student_profiles?.profiles?.full_name || "S").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className={`font-bold font-display ${isCompleted ? 'text-text-sub' : 'text-text-main'}`}>
                              {req.student_profiles?.profiles?.full_name || "Siswa"}
                            </div>
                            <div className="text-xs text-text-sub font-mono mb-1">
                              {req.subject}
                            </div>
                            {req.meeting_type && (
                              <div className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border inline-flex mt-1
                                ${req.meeting_type === 'online' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}
                              >
                                {req.meeting_type === 'online' ? <Video size={12}/> : <MapPin size={12}/>}
                                {req.meeting_type === 'online' ? 'Online' : `Offline: ${parseLocationField(req.location).text || '-'}`}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 self-end md:self-auto w-full md:w-auto mt-2 md:mt-0">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleAction(req.id, "cancelled")}
                                className="w-10 h-10 border border-red-500/30 text-red-500 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 transition-colors"
                              >
                                <X size={18} />
                              </button>
                              <button
                                onClick={() => handleAction(req.id, "confirmed")}
                                className="w-10 h-10 border border-lime text-black rounded-lg flex items-center justify-center bg-lime hover:bg-lime-dim transition-colors"
                              >
                                <Check size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setBookingModal(req)}
                            className="flex-1 md:flex-none border border-border bg-bg-2 px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono hover:bg-bg-3 transition-colors h-10"
                          >
                            Detail Sesi
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {bookingModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-pgIn" style={{overscrollBehavior: 'none'}}>
          <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b-[1.5px] border-border bg-bg-2">
              <div className="font-display font-bold text-[16px]">
                Detail Sesi
              </div>
              <button onClick={() => setBookingModal(null)} className="text-text-sub hover:text-text-main hover:bg-bg-3 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar">
              <div className="flex gap-3 items-center mb-5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold font-display text-white text-lg border border-border"
                  style={{ background: getAvatarColor(bookingModal.student_profiles?.profiles?.full_name || "Siswa") }}
                >
                  {(bookingModal.student_profiles?.profiles?.full_name || "S").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold font-display text-lg">
                    {bookingModal.student_profiles?.profiles?.full_name || "Siswa"}
                  </div>
                  <div className="text-sm text-text-sub">
                    {bookingModal.subject} 
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded tracking-wide uppercase font-mono border
                      ${bookingModal.status === 'pending' ? 'bg-warning/10 text-warning border-warning/30' 
                      : 'bg-lime-mid text-lime border-lime/30'}`}
                    >
                      {bookingModal.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-bg-2 rounded-xl p-4 mb-4 space-y-3 border border-border">
                <div className="text-[10px] text-text-sub font-bold font-mono tracking-wider uppercase">
                  Waktu & Tempat
                </div>
                <div className="flex items-center gap-2.5 text-sm font-bold text-text-main">
                  <div className="w-7 h-7 rounded-full bg-lime/10 text-lime flex items-center justify-center"><CalendarIcon size={14} /></div>
                  <div className="flex flex-col">
                     <span>{new Date(bookingModal.session_date).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</span>
                     <span className="text-xs text-text-sub font-mono">{formatTime(bookingModal.start_time)} - {formatTime(bookingModal.end_time)}</span>
                  </div>
                </div>
                
                {bookingModal.meeting_type && (
                   <div className="flex items-center gap-2.5 text-sm font-bold text-text-main pt-1 border-t border-border/50">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${bookingModal.meeting_type === 'online' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        {bookingModal.meeting_type === 'online' ? <Video size={14} /> : <MapPin size={14} />}
                      </div>
                      <div className="flex flex-col">
                        <span>{bookingModal.meeting_type === 'online' ? 'Online (Video Call)' : 'Offline / Tatap Muka'}</span>
                        {bookingModal.meeting_type === 'offline' && <span className="text-xs text-text-sub font-mono">{parseLocationField(bookingModal.location).text || 'Lokasi belum disepakati'}</span>}
                      </div>
                   </div>
                )}
              </div>

              {(() => {
                const parsed = parseSessionNotes(bookingModal.material_notes);
                return (
                  <>
                    {parsed.meta && (
                      <div className="mb-4 bg-bg-2/50 p-3 rounded-lg border border-border/50">
                        <span className="text-[10px] font-mono text-text-sub uppercase mb-1 block tracking-wider">Tipe Pembayaran</span>
                        <div className="text-[12px] font-bold text-lime flex items-center gap-1.5">
                          <CheckCircle2 size={14} />
                          {parsed.meta === "prepaid" ? "Sudah Dibayar (Paket)" : 
                           parsed.meta === "single" ? "Pembayaran Satuan" : 
                           `Paket Tertaut (${parsed.meta.replace("bundle_init:", "")})`}
                        </div>
                      </div>
                    )}
                    <div className="mb-2">
                       <span className="text-[10px] font-mono text-text-sub uppercase mb-1 block tracking-wider">Pesan Pembuka (Materi)</span>
                       {parsed.notes ? (
                         <div className="bg-bg-2 p-3 text-sm rounded-lg border border-border leading-relaxed text-text-main">
                           {parsed.notes}
                         </div>
                       ) : (
                         <div className="text-sm text-text-sub italic">Peserta tidak meninggalkan pesan awal.</div>
                       )}
                    </div>
                  </>
                );
              })()}
            </div>
            
            {bookingModal.status === 'pending' && (
              <div className="p-4 border-t border-border bg-bg-base flex gap-3">
                <button
                  className="flex-1 py-3 text-sm font-bold rounded-lg border-[1.5px] border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors"
                  onClick={() => handleAction(bookingModal.id, "cancelled")}
                >
                  Tolak Request
                </button>
                <button
                  className="flex-1 py-3 text-sm font-bold rounded-lg border-[1.5px] border-lime text-black bg-lime hover:bg-lime-dim transition-colors"
                  onClick={() => handleAction(bookingModal.id, "confirmed")}
                >
                  Terima Jadwal
                </button>
              </div>
            )}
          </div>
        </div>, document.body
      )}
    </div>
  );
}

