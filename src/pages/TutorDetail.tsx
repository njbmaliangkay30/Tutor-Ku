import { ChevronLeft, Medal, Star } from "lucide-react";
import { useAppContext } from "../AppContext";
import {
  PKG_SUBSCRIPTIONS,
  DAYS,
  getTagStyle,
  getAvatarColor,
  formatRupiah,
} from "../data";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export function TutorDetail() {
  const { selectedTutorId, setSelectedTutorId, setActiveTab, userRole, tutors, user, userProfile } =
    useAppContext();
  const [selectedPkg, setSelectedPkg] = useState("pkg-single");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tutor = tutors.find((t:any) => t.id === selectedTutorId);

  if (!tutor) return null;

  const handleBook = async () => {
    if (userRole === "guest" || !userProfile) {
      setSelectedTutorId(null);
      setActiveTab("login");
      return;
    } 

    setIsSubmitting(true);
    try {
       const today = new Date();
       const tomorrow = new Date(today);
       tomorrow.setDate(tomorrow.getDate() + 1);

       const { data, error } = await supabase.from('sessions').insert({
         student_id: userProfile.id,
         tutor_id: tutor.id,
         subject: tutor.major,
         session_date: tomorrow.toISOString().split('T')[0],
         start_time: '14:00',
         end_time: '15:30',
         material_notes: notes,
         status: 'pending'
       });

       if (error) throw error;

       setBookingSuccess(true);
       setTimeout(() => {
         setBookingSuccess(false);
         setSelectedTutorId(null);
         setActiveTab("student_sessions");
       }, 2000);
    } catch(err) {
       console.error("Booking error", err);
       alert("Gagal melakukan booking. Pastikan profil Anda sudah diatur.");
    } finally {
       setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 bg-bg-base/80 backdrop-blur-md z-[5] border-b-[1.5px] border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setSelectedTutorId(null)}
          className="w-[34px] h-[34px] rounded-lg bg-bg-2 border-[1.5px] border-border flex items-center justify-center text-text-sub flex-shrink-0 transition-colors hover:border-lime hover:text-lime"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="font-display text-[15px] font-bold text-text-main leading-tight">
            {tutor.name}
          </div>
          <div className="text-[11px] text-text-sub font-mono">
            Profil Tutor
          </div>
        </div>
        <div
          className="px-2 py-[2px] rounded border font-mono text-[10px] font-bold flex items-center"
          style={{
            backgroundColor:
              tutor.tier === "Gold"
                ? "var(--color-gold-bg)"
                : tutor.tier === "Silver"
                  ? "var(--color-silver-bg)"
                  : "var(--color-bronze-bg)",
            color:
              tutor.tier === "Gold"
                ? "var(--color-gold)"
                : tutor.tier === "Silver"
                  ? "var(--color-silver)"
                  : "var(--color-bronze)",
            borderColor:
              tutor.tier === "Gold"
                ? "rgba(255,215,0,0.3)"
                : tutor.tier === "Silver"
                  ? "rgba(176,176,176,0.3)"
                  : "rgba(205,127,50,0.3)",
          }}
        >
          <Medal size={10} className="inline mr-1 -mt-0.5" /> {tutor.tier}
        </div>
      </div>

      <div className="p-[18px_14px_32px] max-w-2xl mx-auto w-full">
        <div className="text-center mb-5">
          <div className="relative inline-block">
            <div
              className="rounded-xl flex items-center justify-center font-extrabold text-white/90 font-display"
              style={{
                width: 72,
                height: 72,
                fontSize: Math.round(72 * 0.36),
                background: getAvatarColor(tutor.name),
                border: "1.5px solid rgba(200,255,0,0.2)",
              }}
            >
              {tutor.initials}
            </div>
            <span
              className={`absolute bottom-[2px] right-[2px] w-3.5 h-3.5 rounded-full border-2 border-bg-base ${tutor.online ? "bg-online" : "bg-text-muted"}`}
            ></span>
          </div>
          <h2 className="font-display mt-2.5 mb-[3px] text-xl font-bold text-text-main">
            {tutor.name}
          </h2>
          <div className="text-xs text-text-sub mb-2 font-mono">
            {tutor.major} · {tutor.university}
          </div>

          <div className="flex gap-2 items-center justify-center flex-wrap mt-[5px]">
            <span
              className="px-2 py-[2px] rounded border font-mono text-[10px] font-bold whitespace-nowrap"
              style={{
                backgroundColor:
                  tutor.tier === "Gold"
                    ? "var(--color-gold-bg)"
                    : tutor.tier === "Silver"
                      ? "var(--color-silver-bg)"
                      : "var(--color-bronze-bg)",
                color:
                  tutor.tier === "Gold"
                    ? "var(--color-gold)"
                    : tutor.tier === "Silver"
                      ? "var(--color-silver)"
                      : "var(--color-bronze)",
                borderColor:
                  tutor.tier === "Gold"
                    ? "rgba(255,215,0,0.3)"
                    : tutor.tier === "Silver"
                      ? "rgba(176,176,176,0.3)"
                      : "rgba(205,127,50,0.3)",
              }}
            >
              {tutor.tier}
            </span>
            <span className="text-warning text-[12px] font-bold font-mono whitespace-nowrap">
              <Star size={12} className="inline fill-warning -mt-0.5" />{" "}
              {tutor.rating.toFixed(1)}
            </span>
            <span
              className={`inline-flex items-center gap-[3px] px-2 py-[2px] rounded-sm text-[10px] font-bold font-mono border whitespace-nowrap ${tutor.genderClass}`}
            >
              <span className="-mb-[1px]">{tutor.genderIcon}</span>{" "}
              {tutor.gender}
            </span>
            <span className="text-[11px] text-text-sub font-mono whitespace-nowrap">
              {tutor.sessions} sesi
            </span>
          </div>
          <div
            className={`mt-1.5 text-[11px] font-bold font-mono ${tutor.online ? "text-online" : "text-text-light"}`}
          >
            {tutor.online ? "● Online sekarang" : "○ Offline"}
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border-[1.5px] border-border mb-2.5 transition-colors hover:border-border-2">
          <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-2.5 font-mono">
            BIO
          </div>
          <p className="text-[13px] text-text-sub leading-[1.6]">{tutor.bio}</p>
        </div>

        <div className="bg-card rounded-xl p-4 border-[1.5px] border-border mb-2.5 transition-colors hover:border-border-2">
          <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-2.5 font-mono">
            HARI AKTIF MENGAJAR
          </div>
          <div className="grid grid-cols-7 gap-[5px] mb-1.5">
            {DAYS.map((d, i) => {
              const isActive = (tutor.activeDays || []).includes(i);
              return (
                <div
                  key={d}
                  className={`aspect-square rounded-sm border-[1.5px] flex items-center justify-center text-[10px] font-bold font-mono ${isActive ? "border-lime bg-lime-mid text-lime" : "border-border bg-bg-2 text-text-light"}`}
                >
                  {d}
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-text-sub font-mono">
            Aktif: {(tutor.activeDays || []).map((d: number) => DAYS[d]).join(", ")}
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border-[1.5px] border-border mb-2.5 transition-colors hover:border-border-2">
          <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-2.5 font-mono">
            MATA PELAJARAN
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(tutor.tags || []).map((tag: string) => {
              const st = getTagStyle(tag);
              return (
                <span
                  key={tag}
                  className="rounded px-[9px] py-[3px] text-[11px] font-semibold border border-border font-mono"
                  style={{
                    backgroundColor: st.bg,
                    color: st.c,
                    borderColor: st.c + "33",
                  }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>

        <div className="mb-3.5">
          <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-2.5 font-mono">
            PILIH PAKET
          </div>
          <div className="flex flex-col gap-2">
            {PKG_SUBSCRIPTIONS.map((pkg) => {
              const total =
                pkg.sessions *
                tutor.rate *
                (pkg.discount ? 1 - pkg.discount / 100 : 1);
              const perSesi = total / pkg.sessions;
              const isSelected = selectedPkg === pkg.id;

              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg.id)}
                  className={`bg-card-2 rounded-xl p-3.5 border-[1.5px] cursor-pointer transition-all relative overflow-hidden group ${isSelected ? "border-lime bg-lime-dim shadow-lime" : "border-border hover:border-text-sub"}`}
                >
                  {pkg.badge && (
                    <div className="absolute top-0 right-0 bg-lime text-black text-[9px] font-extrabold px-2.5 py-[3px] rounded-bl-lg font-mono tracking-[0.05em]">
                      {pkg.badge}
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-display text-[14px] font-bold text-text-main pr-[60px]">
                        {pkg.label}
                      </div>
                      <div className="text-[11px] text-text-sub mt-0.5">
                        {pkg.desc}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <div className="font-mono text-[17px] font-bold text-lime">
                        {formatRupiah(total)}
                      </div>
                      {pkg.sessions > 1 ? (
                        <div className="text-[10px] text-text-sub font-mono">
                          {formatRupiah(perSesi)}/sesi{" "}
                          {pkg.discount > 0 && (
                            <span className="text-online font-bold">
                              hemat {pkg.discount}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-text-sub font-mono">
                          per sesi
                        </div>
                      )}
                    </div>
                    <div className="text-[12px] text-text-sub font-mono">
                      {pkg.sessions} sesi
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-[5px] mb-3">
          <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">
            Catatan untuk Tutor (opsional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ceritakan kebutuhan belajarmu..."
            className="border-[1.5px] border-border rounded-lg px-[13px] py-2.5 text-[14px] bg-bg-2 text-text-main font-body focus:outline-none focus:border-lime focus:shadow-[0_0_0_2px_var(--color-lime-dim)] transition-all h-[70px] resize-none"
          ></textarea>
        </div>

        <button
          onClick={handleBook}
          disabled={bookingSuccess || isSubmitting}
          className="w-full bg-lime text-black border-[2px] border-lime rounded-lg py-[11px] px-[18px] font-display font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-sh1 transition-all hover:shadow-sh2 hover:-translate-x-px hover:-translate-y-px active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        >
          {bookingSuccess
            ? "Booking Berhasil! Mengalihkan..."
            : isSubmitting ? "Memproses..." : userRole === "guest"
              ? "Login untuk Booking"
              : "Booking Sekarang"}
        </button>
      </div>

      {/* Success ModalOverlay */}
      {bookingSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-lime-mid text-lime rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-lime">
              <Star size={32} />
            </div>
            <h2 className="font-display font-bold text-xl mb-2 text-text-main">
              Booking Berhasil!
            </h2>
            <p className="text-sm text-text-sub">
              Menunggu konfirmasi dari tutor...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
