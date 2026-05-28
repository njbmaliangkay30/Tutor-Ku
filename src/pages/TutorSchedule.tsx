import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, Clock, Check, X, MapPin, Video, CheckCircle2, ChevronLeft, ChevronRight, User } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAppContext } from "../AppContext";
import { getAvatarColor, DAYS } from "../data";
import { parseSessionNotes, parseLocationField } from './TutorSessions';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, isSameMonth, isSameDay, addWeeks, subWeeks, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function TutorSchedule() {
  const { userProfile, userRole, setActiveTab } = useAppContext();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  
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
          .select(`*, student_profiles(id, profiles(full_name))`)
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

  const handleAction = async (sessionId: string, action: "confirmed" | "cancelled") => {
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

  // Navigations
  const next = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };
  const prev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };
  const today = () => setCurrentDate(new Date());

  // Render events for a specific day cell
  const renderEvents = (date: Date) => {
    const dayStr = format(date, "yyyy-MM-dd");
    const daySessions = allSessions.filter(s => s.session_date === dayStr && s.status !== "cancelled");
    
    return daySessions.map((req, idx) => {
      const isPending = req.status === "pending";
      const isCompleted = req.status === "completed";
      
      let baseClass = "text-[10px] sm:text-[11px] truncate px-1.5 py-0.5 rounded-md mb-1 cursor-pointer font-bold border transition-colors ";
      if (isPending) baseClass += "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20";
      else if (isCompleted) baseClass += "bg-text-muted/10 text-text-muted border-border hover:bg-bg-3";
      else baseClass += "bg-lime-mid text-lime border-lime/30 hover:bg-lime/20";
      
      const sessionTitle = `${formatTime(req.start_time)} ${req.student_profiles?.profiles?.full_name?.split(' ')[0] || "Siswa"}`;
      
      return (
        <div key={req.id} onClick={(e) => { e.stopPropagation(); setBookingModal(req); }} className={baseClass} title={req.subject}>
          {sessionTitle}
        </div>
      );
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        days.push(
          <div
            key={day.toString()}
            className={`min-h-[100px] border-b border-r border-border p-1.5 transition-colors ${
              !isSameMonth(day, monthStart)
                ? "bg-bg-2/30 text-text-sub/50"
                : isSameDay(day, new Date())
                ? "bg-lime/5 text-lime font-bold"
                : "bg-card text-text-main"
            }`}
            onClick={() => {
              setCurrentDate(cloneDay);
              setViewMode("day");
            }}
          >
             <div className="flex justify-end">
               <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-lime text-black' : ''}`}>
                 {formattedDate}
               </span>
             </div>
             <div className="mt-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {renderEvents(cloneDay)}
             </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    
    return (
      <div className="flex flex-col bg-card rounded-xl border-[1.5px] border-border shadow-sh1 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-bg-2">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d, i) => (
            <div key={i} className="py-2 text-center text-xs font-mono font-bold text-text-sub uppercase border-r border-border last:border-0">
              {d}
            </div>
          ))}
        </div>
        <div>{rows}</div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    const dateFormat = "EEEE, d MMMM";
    
    const days = [];
    let day = startDate;
    while (day <= endDate) {
      const cloneDay = day;
      days.push(
        <div key={day.toString()} className="flex flex-col sm:flex-row border-b border-border last:border-0">
          <div className={`p-4 sm:w-48 flex-shrink-0 font-bold text-[13px] border-b sm:border-b-0 sm:border-r border-border sm:flex sm:items-center ${isSameDay(day, new Date()) ? 'bg-lime/10 text-lime border-l-4 border-l-lime' : 'bg-bg-2 text-text-main border-l-4 border-l-transparent'}`}>
            {format(day, dateFormat, { locale: id })}
          </div>
          <div className="flex-1 p-4 bg-card min-h-[80px]">
             {allSessions.filter(s => s.session_date === format(cloneDay, "yyyy-MM-dd") && s.status !== "cancelled").length === 0 ? (
               <div className="text-text-sub text-xs italic opacity-50 py-2">Tidak ada kelas terjadwal.</div>
             ) : (
               <div className="flex flex-wrap gap-3">
                  {renderEvents(cloneDay)}
               </div>
             )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    
    return (
       <div className="flex flex-col bg-card rounded-xl border-[1.5px] border-border shadow-sh1 overflow-hidden w-full">
          {days}
       </div>
    );
  };

  const renderDayView = () => {
    const dayStr = format(currentDate, "yyyy-MM-dd");
    const daySessions = allSessions.filter(s => s.session_date === dayStr && s.status !== "cancelled");
    
    return (
      <div className="bg-card rounded-xl border-[1.5px] border-border shadow-sh1 p-6 relative">
        <div className="text-xl font-display font-extrabold mb-6 border-b border-border pb-4 w-full">
           Jadwal Hari Ini: <span className={isSameDay(currentDate, new Date()) ? 'text-lime' : ''}>{format(currentDate, "EEEE, d MMMM yyyy", { locale: id })}</span>
        </div>
        
        {daySessions.length === 0 ? (
          <div className="text-center py-12 px-6 border-[2px] border-dashed border-border rounded-xl bg-bg-2/50">
            <div className="mx-auto w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center mb-3 text-text-sub">
              <CalendarIcon size={24} />
            </div>
            <h3 className="font-bold font-display text-lg mb-1">Kosong</h3>
            <p className="text-sm text-text-sub">Tidak ada jadwal atau request masuk pada tanggal ini.</p>
          </div>
        ) : (
          <div className="ml-4 border-l-2 border-border/60 pl-6 space-y-6 relative">
            {daySessions.map((req) => {
              const isPending = req.status === 'pending';
              const isConfirmed = req.status === 'confirmed';
              const isCompleted = req.status === 'completed';
              
              return (
                <div key={req.id} className="relative group animate-pgIn">
                  <div className={`absolute -left-[31px] w-[14px] h-[14px] rounded-full border-4 border-bg-base z-10 
                    ${isPending ? 'bg-warning ring-2 ring-warning/30' 
                      : isCompleted ? 'bg-text-muted ring-1 ring-border' 
                      : 'bg-lime ring-2 ring-lime/30'}`} 
                  />
                  
                  <div className="text-xs font-mono font-bold tracking-wide mb-2 flex items-center gap-2">
                     <span className={isPending ? 'text-warning' : isCompleted ? 'text-text-muted' : 'text-lime'}>
                       {formatTime(req.start_time)} - {formatTime(req.end_time)}
                     </span>
                     {isPending && <span className="bg-warning/20 text-warning px-1.5 py-0.5 rounded-[4px] text-[9px] uppercase tracking-wider">Menunggu</span>}
                     {isConfirmed && <span className="bg-lime/20 text-lime px-1.5 py-0.5 rounded-[4px] text-[9px] uppercase tracking-wider">Terkonfirmasi</span>}
                  </div>
  
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
    );
  };

  if (userRole !== "tutor" || !userProfile) {
    return (
      <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full text-center mt-10">
        <h1 className="text-2xl font-bold font-display text-text-main mb-4">Jadwal & Agenda</h1>
        <p className="text-sm text-text-sub mb-6">Halaman ini hanya untuk tutor. Silakan login sebagai tutor.</p>
        <button onClick={() => setActiveTab("login")} className="bg-lime text-black font-bold py-3 px-8 rounded-lg hover:bg-lime-dim transition-colors">
          Login Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-pgIn mx-auto w-full flex flex-col h-full min-h-screen pb-24 max-w-6xl">
       <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 shrink-0">
         <div>
           <h1 className="text-3xl font-bold font-display text-text-main mb-1">
             Agenda Kelas
           </h1>
           <p className="text-sm text-text-sub">
             Kelola jadwal mengajar, dan terima request dengan tampilan kalender.
           </p>
         </div>

         <div className="flex items-center gap-3">
           <div className="flex p-1 bg-bg-2 border border-border rounded-lg">
             {(["day", "week", "month"] as const).map(mode => (
               <button
                 key={mode}
                 onClick={() => setViewMode(mode)}
                 className={`px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider rounded-md transition-colors ${
                   viewMode === mode ? "bg-lime text-black shadow-sm" : "text-text-sub hover:text-text-main hover:bg-bg-3"
                 }`}
               >
                 {mode === "day" ? "Hari" : mode === "week" ? "Minggu" : "Bulan"}
               </button>
             ))}
           </div>
           
           <div className="flex items-center gap-1">
             <button onClick={prev} className="p-2 bg-bg-2 border border-border rounded-lg text-text-main hover:border-lime transition-colors">
               <ChevronLeft size={18} />
             </button>
             <button onClick={today} className="px-3 py-1.5 bg-bg-2 border border-border rounded-lg text-xs font-bold font-mono uppercase hover:border-lime transition-colors">
               Hari Ini
             </button>
             <button onClick={next} className="p-2 bg-bg-2 border border-border rounded-lg text-text-main hover:border-lime transition-colors">
               <ChevronRight size={18} />
             </button>
           </div>
         </div>
       </div>

       <div className="mb-4 text-xl font-display font-bold text-text-main px-1">
         {viewMode === "month" 
           ? format(currentDate, "MMMM yyyy", { locale: id })
           : viewMode === "week"
           ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d MMM")} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "d MMM yyyy", { locale: id })}`
           : format(currentDate, "EEEE, d MMMM yyyy", { locale: id })
         }
       </div>

       <div className="flex-1 overflow-x-auto min-h-0">
          {viewMode === "month" && renderMonthView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "day" && renderDayView()}
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
                          <div className="bg-bg-2 p-3 text-sm rounded-lg border border-border leading-relaxed text-text-main whitespace-pre-wrap">
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
               <div className="p-4 border-t border-border bg-bg-base flex gap-3 mt-auto">
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
