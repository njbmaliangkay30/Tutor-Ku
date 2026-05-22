import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, Clock, Check, X, User } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAppContext } from "../AppContext";
import { getAvatarColor } from "../data";
import { parseSessionNotes } from './TutorSessions';

export function TutorSchedule() {
  const { userProfile, userRole, setActiveTab } = useAppContext();
  const [activeDate, setActiveDate] = useState<number>(new Date().getDate());
  const [bookingModal, setBookingModal] = useState<any>(null);

  const [pendingSessions, setPendingSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPendingSessions = async () => {
      if (userRole !== "tutor" || !userProfile) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select(
            `
            *,
            student_profiles(id, profiles(full_name))
          `,
          )
          .eq("tutor_id", userProfile.id)
          .eq("status", "pending");

        if (error) throw error;
        setPendingSessions(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    if (userProfile && userRole === "tutor") {
      fetchPendingSessions();
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

      setPendingSessions((prev) => prev.filter((s) => s.id !== sessionId));
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
          Jadwal & Slot
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
  const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + i,
    );
    return {
      dayStr: DAYS[d.getDay()],
      dateNum: d.getDate(),
      fullDate: d,
      hasSlot: true, // Placeholder
    };
  });

  return (
    <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-text-main">
          Jadwal & Slot
        </h1>
        <p className="text-sm text-text-sub">
          Atur ketersediaan waktu dan kelola request booking masuk.
        </p>
      </div>

      <div className="bg-card border-[1.5px] border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-bold font-mono tracking-widest uppercase mb-4">
          Pilih Tanggal
        </h2>
        <div className="flex gap-2 min-w-0 overflow-x-auto pb-2 custom-scrollbar">
          {dates.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDate(d.dateNum)}
              className={`flex-shrink-0 w-[52px] h-[70px] rounded-lg border-[1.5px] flex flex-col items-center justify-center gap-1 transition-all relative ${
                activeDate === d.dateNum
                  ? "border-lime bg-lime-mid text-lime"
                  : "border-border bg-bg-2 hover:bg-bg-3"
              }`}
            >
              <div className="text-[10px] font-bold">{d.dayStr}</div>
              <div className="text-lg font-display font-extrabold">
                {d.dateNum}
              </div>
              {d.hasSlot && (
                <div
                  className={`w-1.5 h-1.5 rounded-full absolute bottom-2 ${activeDate === d.dateNum ? "bg-lime" : "bg-text-sub"}`}
                />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 border-t border-border/50 pt-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold font-display text-lg">
              Slot Kosong: {activeDate} Mei 2026
            </h3>
            <button className="text-xs font-bold text-black bg-lime px-3 py-1.5 rounded-md hover:bg-lime-dim">
              + Tambah Slot
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-bg-2 border-[1.5px] border-border rounded-lg p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-text-sub" />
                <span className="font-mono text-sm font-bold">
                  10:00 - 11:30
                </span>
              </div>
              <div className="text-[10px] text-text-sub bg-bg-3 px-2 py-0.5 rounded">
                Tersedia
              </div>
            </div>
            <div className="bg-bg-2 border-[1.5px] border-border rounded-lg p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-text-sub" />
                <span className="font-mono text-sm font-bold">
                  13:00 - 14:30
                </span>
              </div>
              <div className="text-[10px] text-text-sub bg-bg-3 px-2 py-0.5 rounded">
                Tersedia
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-bold font-mono tracking-widest uppercase mb-4">
          Booking Requests Masuk
        </h2>
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="text-center py-8">Memuat request...</div>
          ) : pendingSessions.length === 0 ? (
            <div className="text-center py-8 text-text-sub">
              Tidak ada request booking baru.
            </div>
          ) : (
            pendingSessions.map((req) => (
              <div
                key={req.id}
                className="bg-card border-[1.5px] border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex gap-3 items-start">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-display text-white"
                    style={{
                      background: getAvatarColor(
                        req.student_profiles?.profiles?.full_name || "Siswa",
                      ),
                    }}
                  >
                    {(req.student_profiles?.profiles?.full_name || "S")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold font-display">
                      {req.student_profiles?.profiles?.full_name || "Siswa"}
                    </div>
                    <div className="text-xs text-text-sub font-mono mb-1">
                      {req.subject}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-lime bg-lime-mid px-2 py-0.5 rounded w-max mb-1.5">
                      <CalendarIcon size={12} />{" "}
                      {new Date(req.session_date).toLocaleDateString()} ·{" "}
                      {formatTime(req.start_time)} -{" "}
                      {formatTime(req.end_time)}
                    </div>
                    {req.meeting_type && (
                      <div className="text-[10px] bg-bg-2 border border-border px-2 py-0.5 rounded text-text-sub font-mono inline-block">
                        {req.meeting_type === 'online' ? '🌐 Online' : `📍 Offline: ${req.location || '-'}`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 self-end md:self-auto w-full md:w-auto">
                  <button
                    onClick={() => setBookingModal(req)}
                    className="flex-1 md:flex-none border border-border bg-bg-2 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-bg-3 transition-colors"
                  >
                    Lihat Detail
                  </button>
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {bookingModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-pgIn" style={{overscrollBehavior: 'none'}}>
          <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b-[1.5px] border-border bg-bg-2">
              <div className="font-display font-bold text-[16px]">
                Detail Request
              </div>
              <button
                onClick={() => setBookingModal(null)}
                className="text-text-sub hover:text-text-main"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="flex gap-3 items-center mb-5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold font-display text-white text-lg"
                  style={{
                    background: getAvatarColor(
                      bookingModal.student_profiles?.profiles?.full_name ||
                        "Siswa",
                    ),
                  }}
                >
                  {(bookingModal.student_profiles?.profiles?.full_name || "S")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="font-bold font-display text-lg">
                    {bookingModal.student_profiles?.profiles?.full_name ||
                      "Siswa"}
                  </div>
                  <div className="text-sm text-text-sub">
                    {bookingModal.subject}
                  </div>
                </div>
              </div>

              <div className="bg-bg-2 rounded-lg p-3 mb-4 space-y-2 border border-border/50">
                <div className="text-xs text-text-sub font-bold font-mono tracking-wider uppercase mb-1">
                  Jadwal Diminta
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-lime">
                  <CalendarIcon size={16} />{" "}
                  {new Date(bookingModal.session_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold mt-1">
                  <Clock size={16} className="text-text-sub" />{" "}
                  {formatTime(bookingModal.start_time)} -{" "}
                  {formatTime(bookingModal.end_time)}
                </div>
                {bookingModal.meeting_type && (
                   <div className="mt-3 bg-bg-2 p-2 rounded-lg border border-border">
                     <span className="text-[11px] font-mono text-text-sub uppercase mb-1 block">Metode Pertemuan</span>
                     <div className="text-[13px] font-bold text-text-main">
                        {bookingModal.meeting_type === 'online' ? '🌐 Online (Video Call)' : `📍 Offline (${bookingModal.location || 'Lokasi tidak disebutkan'})`}
                     </div>
                   </div>
                )}
              </div>

              {(() => {
                const parsed = parseSessionNotes(bookingModal.material_notes);
                return (
                  <>
                    {parsed.meta && (
                      <div className="mb-4 bg-lime/10 p-2.5 rounded-lg border border-lime/20">
                        <span className="text-[10px] font-mono text-lime uppercase mb-1 block">Tipe Pemesanan</span>
                        <div className="text-[12px] font-bold">
                          {parsed.meta === "prepaid" ? "⚡ Kuota Paket (Prepaid)" : 
                           parsed.meta === "single" ? "🎯 Sesi Satuan" : 
                           `📦 Sesi Paket (${parsed.meta.replace("bundle_init:", "")})`}
                        </div>
                      </div>
                    )}
                    {parsed.notes && (
                      <div className="mb-6">
                        <div className="text-xs text-text-sub font-bold font-mono tracking-wider uppercase mb-2">
                          Catatan Tambahan Siswa
                        </div>
                        <p className="bg-bg-2 p-3 text-sm rounded-lg border border-border leading-relaxed font-sans italic">
                          "{parsed.notes}"
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="flex gap-3">
                <button
                  className="flex-1 py-3 text-sm font-bold rounded-lg border border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20"
                  onClick={() => handleAction(bookingModal.id, "cancelled")}
                >
                  Tolak
                </button>
                <button
                  className="flex-1 py-3 text-sm font-bold rounded-lg border border-lime text-black bg-lime hover:bg-lime-dim"
                  onClick={() => handleAction(bookingModal.id, "confirmed")}
                >
                  Terima Booking
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
