import { ChevronLeft, Medal, Star } from "lucide-react";
import { createPortal } from "react-dom";
import { useAppContext } from "../AppContext";
import {
  DAYS,
  getTagStyle,
  getAvatarColor,
  formatRupiah,
} from "../data";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import MapPicker from "../components/MapPicker";

export function TutorDetail() {
  const { selectedTutorId, setSelectedTutorId, setActiveTab, userRole, tutors, user, userProfile } =
    useAppContext();
  const [dbPackages, setDbPackages] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string>("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [activePackage, setActivePackage] = useState<any | null>(null);
  const [usePackageSession, setUsePackageSession] = useState(false);

  useEffect(() => {
    async function fetchDbPackages() {
      try {
        const { data, error } = await supabase
          .from("packages")
          .select("*")
          .order("session_count", { ascending: true });

        if (!error && data && data.length > 0) {
          setDbPackages(data);
          setSelectedPkg(data[0].id);
        } else {
          // Fallback array if table is empty or blocked by Supabase RLS
          const fallback = [
            { id: 'pkg-single', name: 'Sesi Satuan', session_count: 1, price: 65000, description: 'Booking satu sesi dulu, cocok untuk percobaan.' },
            { id: 'pkg-4', name: 'Paket 4 Pertemuan', session_count: 4, price: 247000, description: '4 sesi, cocok untuk persiapan ulangan.' },
            { id: 'pkg-8', name: 'Paket 8 Pertemuan', session_count: 8, price: 468000, description: 'Paket terlaris — belajar rutin, hasil lebih optimal.' },
            { id: 'pkg-12', name: 'Paket 12 Pertemuan', session_count: 12, price: 686400, description: 'Untuk persiapan UTBK atau kursus intensif.' }
          ];
          setDbPackages(fallback);
          setSelectedPkg(fallback[0].id);
        }
      } catch (err) {
        console.error("Error fetching packages catalog:", err);
        const fallback = [
          { id: 'pkg-single', name: 'Sesi Satuan', session_count: 1, price: 65000, description: 'Booking satu sesi dulu, cocok untuk percobaan.' },
          { id: 'pkg-4', name: 'Paket 4 Pertemuan', session_count: 4, price: 247000, description: '4 sesi, cocok untuk persiapan ulangan.' },
          { id: 'pkg-8', name: 'Paket 8 Pertemuan', session_count: 8, price: 468000, description: 'Paket terlaris — belajar rutin, hasil lebih optimal.' },
          { id: 'pkg-12', name: 'Paket 12 Pertemuan', session_count: 12, price: 686400, description: 'Untuk persiapan UTBK atau kursus intensif.' }
        ];
        setDbPackages(fallback);
        setSelectedPkg(fallback[0].id);
      }
    }
    fetchDbPackages();
  }, []);

  // Scheduling states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [meetingType, setMeetingType] = useState<'online' | 'offline'>('online');
  const [location, setLocation] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleFetchGps = () => {
    if (!navigator.geolocation) {
      setGpsError("Browser tidak mendukung GPS Geolocation.");
      return;
    }
    setIsFetchingGps(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setLocation((prev) => {
          const base = prev.trim() ? prev + "\n" : "";
          return `${base}Titik GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${mapsLink})`;
        });
        setIsFetchingGps(false);
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsError("Gagal mendeteksi lokasi. Mohon izinkan akses GPS / lokasi.");
        setIsFetchingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const tutor = tutors.find((t:any) => t.id === selectedTutorId);

  useEffect(() => {
    async function fetchActivePackage() {
      if (!userProfile || !selectedTutorId) {
        setActivePackage(null);
        setUsePackageSession(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("student_packages")
          .select("*, packages(*)")
          .eq("student_id", userProfile.id)
          .eq("tutor_id", selectedTutorId)
          .eq("status", "active")
          .gt("remaining_sessions", 0)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setActivePackage(data);
          setUsePackageSession(true);
        } else {
          setActivePackage(null);
          setUsePackageSession(false);
        }
      } catch (err) {
        console.error("Error loading active package:", err);
      }
    }
    fetchActivePackage();
  }, [selectedTutorId, userProfile]);

  useEffect(() => {
    async function fetchTutorReviews() {
      if (!selectedTutorId) return;
      setIsLoadingReviews(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select(`
            id,
            rating,
            review_text,
            created_at,
            show_on_profile,
            student:student_profiles(
              profiles(full_name)
            )
          `)
          .eq("tutor_id", selectedTutorId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (err) {
        console.error("Error loading reviews:", err);
      } finally {
        setIsLoadingReviews(false);
      }
    }
    fetchTutorReviews();
  }, [selectedTutorId]);

  if (!tutor) return null;

  const availableDates = useMemo(() => {
    if (!tutor.activeDays || tutor.activeDays.length === 0) return [];
    const dates = [];
    let d = new Date();
    d.setHours(0, 0, 0, 0); // Normalize time
    d.setDate(d.getDate() + 1); // Start from tomorrow
    while (dates.length < 14) {
      if (tutor.activeDays.includes(d.getDay())) {
        dates.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }, [tutor.activeDays]);

  const availableHours = (selectedDate && tutor.schedule) ? (tutor.schedule[selectedDate.getDay()] || []) : [];

  const handleBook = async () => {
    if (userRole === "guest" || !userProfile) {
      setSelectedTutorId(null);
      setActiveTab("login");
      return;
    } 

    if (!selectedDate || !selectedTime) {
      alert("Silakan pilih tanggal dan jam sesi pertama terlebih dahulu.");
      return;
    }

    if (!selectedSubject) {
      alert("Silakan pilih mata pelajaran terlebih dahulu untuk menghindari kesalahan memilih mapel.");
      return;
    }

    if (meetingType === 'offline') {
      if (!location.trim()) {
        alert("Alamat detail pertemuan wajib diisi jika Anda memilih pertemuan Tatap Muka (Offline).");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const [h, m] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(h, m, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(h + 1, m + 30, 0, 0);

      const subjectName = selectedSubject;
      let generatedSessionId: string | null = null;

      if (usePackageSession && activePackage) {
        // BOOK USING PREPAID BUNDLE SESSION
        if (activePackage.remaining_sessions <= 0) {
          throw new Error("Sisa kuota sesi paket Anda sudah habis.");
        }

        // 1. Insert session
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .insert({
            student_id: userProfile.id,
            tutor_id: tutor.id,
            subject: subjectName,
            session_date: selectedDate.toISOString().split('T')[0],
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            material_notes: `[META:prepaid] || ${notes.trim()}`,
            status: 'pending',
            payment_status: 'paid', // Prepaid
            meeting_type: meetingType,
            location: meetingType === 'offline' ? location : null
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        // 2. Decrement remaining sessions
        const newCount = activePackage.remaining_sessions - 1;
        const { error: pkgUpdateError } = await supabase
          .from("student_packages")
          .update({
            remaining_sessions: newCount,
            status: newCount === 0 ? "empty" : "active"
          })
          .eq("id", activePackage.id);

        if (pkgUpdateError) throw pkgUpdateError;

        // 3. Insert free transaction
        await supabase.from("transactions").insert({
          user_id: user.id,
          amount: 0,
          transaction_type: "session_booking",
          status: "success",
          reference_id: `PKG-SPEND-${Date.now()}`,
          session_id: sessionData?.id,
          student_package_id: activePackage.id
        });

        // 4. Notify tutor and student
        generatedSessionId = sessionData?.id;
        await supabase.from("notifications").insert([
          {
            user_id: tutor.id,
            title: "Sesi Paket Baru!",
            message: `${userProfile.full_name} memesan 1 sesi baru menggunakan kuota paket langganan mereka untuk subjek ${subjectName}.`,
            link: generatedSessionId ? `sessions:${generatedSessionId}` : "sessions"
          },
          {
            user_id: user.id,
            title: "Sesi Berhasil Diajukan!",
            message: `Jadwal sesi tambahan menggunakan paket langganan telah berhasil diajukan untuk subjek ${subjectName}. Menunggu konfirmasi dari tutor.`,
            link: "student_sessions"
          }
        ]);

      } else {
        // BOOK SINGLE SESSION OR PURCHASE A NEW PACKAGE
        const pkgInfo = dbPackages.find(p => p.id === selectedPkg);
        if (!pkgInfo) {
          throw new Error("Gagal memperoleh detail paket langganan.");
        }
        const sessionsCount = pkgInfo.session_count;
        const isAdaptive = pkgInfo.price <= 100;
        const total = isAdaptive
          ? sessionsCount * tutor.rate * (1 - pkgInfo.price / 100)
          : pkgInfo.price;

        if (sessionsCount === 1) {
          // Single Session Purchase
          const { data: sessionData, error: sessionError } = await supabase
            .from("sessions")
            .insert({
              student_id: userProfile.id,
              tutor_id: tutor.id,
              subject: subjectName,
              session_date: selectedDate.toISOString().split('T')[0],
              start_time: startDateTime.toISOString(),
              end_time: endDateTime.toISOString(),
              material_notes: `[META:single] || ${notes.trim()}`,
              status: 'pending',
              payment_status: 'unpaid', // Typically paid later or paid on check-out
              meeting_type: meetingType,
              location: meetingType === 'offline' ? location : null
            })
            .select()
            .single();

          if (sessionError) throw sessionError;

          // Transaction
          await supabase.from("transactions").insert({
            user_id: user.id,
            amount: Math.round(total),
            transaction_type: "session_booking",
            status: "pending",
            reference_id: `SINGLE-${Date.now()}`,
            session_id: sessionData?.id
          });

          // Notify tutor and student
          generatedSessionId = sessionData?.id;
          await supabase.from("notifications").insert([
            {
              user_id: tutor.id,
              title: "Sesi Baru Dipesan (Menunggu Pembayaran)!",
              message: `${userProfile.full_name} memesan 1 sesi pelajaran subjek ${subjectName}. Sesi akan aktif setelah pembayaran dikonfirmasi.`,
              link: generatedSessionId ? `sessions:${generatedSessionId}` : "sessions"
            },
            {
              user_id: user.id,
              title: "Pesanan Sesi Berhasil!",
              message: `Kamu telah berhasil memesan 1 sesi untuk subjek ${subjectName}. Silakan segera melakukan pembayaran di halaman tagihan agar jadwal dapat dikonfirmasi tutor.`,
              link: "student_transactions"
            }
          ]);

        } else {
          // Multi-session Package Purchase
          if (!pkgInfo) {
            throw new Error("Gagal memperoleh ID paket langganan.");
          }
          
          let packageId: string | null = pkgInfo.id;
          
          // Safety Check: If packageId is a mock short string like 'pkg-4', try to map to actual DB UUID or use null
          if (!packageId || packageId.startsWith("pkg-")) {
            try {
              const { data: matchedPkgs, error: matchError } = await supabase
                .from("packages")
                .select("id")
                .eq("session_count", sessionsCount)
                .limit(1);
              
              if (!matchError && matchedPkgs && matchedPkgs.length > 0) {
                packageId = matchedPkgs[0].id;
              } else {
                console.warn("Could not find database equivalent for package session count: " + sessionsCount + ". Nullifying to bypass active foreign key constraints during local debug.");
                packageId = null; // Columns are nullable, so we gracefully set null to prevent foreign key errors. 
              }
            } catch (fkErr) {
              console.error("FK resolution failed, setting packageId to null", fkErr);
              packageId = null;
            }
          }

          // 1. Create the student_packages entry (1 session used now, count - 1 remaining)
          const { data: spInsertData, error: spError } = await supabase
            .from("student_packages")
            .insert({
              student_id: userProfile.id,
              package_id: packageId,
              tutor_id: tutor.id,
              remaining_sessions: sessionsCount - 1,
              valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: "pending_payment"
            })
            .select()
            .single();

          if (spError) throw spError;

          // 2. Book the first session right now
          const { data: sessionData, error: sessionError } = await supabase
            .from("sessions")
            .insert({
              student_id: userProfile.id,
              tutor_id: tutor.id,
              subject: subjectName,
              session_date: selectedDate.toISOString().split('T')[0],
              start_time: startDateTime.toISOString(),
              end_time: endDateTime.toISOString(),
              material_notes: `[META:bundle_init:${pkgInfo.name}] || ${notes.trim()}`,
              status: 'pending',
              payment_status: 'unpaid', // Bundles are pre-paid but unpaid until client pays
              meeting_type: meetingType,
              location: meetingType === 'offline' ? location : null
            })
            .select()
            .single();

          if (sessionError) throw sessionError;

          // 3. Insert transaction
          await supabase.from("transactions").insert({
            user_id: user.id,
            amount: Math.round(total),
            transaction_type: "bundle_purchase",
            status: "pending",
            reference_id: `BUNDLE-${Date.now()}`,
            session_id: sessionData?.id,
            student_package_id: spInsertData?.id
          });

          // 4. Notify tutor and student
          generatedSessionId = sessionData?.id;
          await supabase.from("notifications").insert([
            {
              user_id: tutor.id,
              title: "Paket Belajar Baru Dipesan (Menunggu Pembayaran)!",
              message: `${userProfile.full_name} memesan ${pkgInfo.name} (${sessionsCount} sesi) untuk subjek ${subjectName}. Sesi akan berjalan jika pembayaran dikonfirmasi.`,
              link: generatedSessionId ? `sessions:${generatedSessionId}` : "sessions"
            },
            {
              user_id: user.id,
              title: "Pesanan Paket Berhasil!",
              message: `Kamu telah memesan ${pkgInfo.name} untuk subjek ${subjectName}. Silakan segera melakukan pembayaran di halaman tagihan agar jadwal dapat dikonfirmasi tutor.`,
              link: "student_transactions"
            }
          ]);
        }
      }

      // Kirim pesan otomatis dari siswa ke tutor terkait booking ini
      try {
         const sysMsg = `Halo kak, saya baru saja mengajukan jadwal untuk tanggal ${selectedDate.toLocaleDateString("id-ID")} jam ${selectedTime}. ${notes ? `Materi/Catatan: "${notes}"` : 'Mohon dikonfirmasi.'}[SESSION_ID:${generatedSessionId}]`;
         await supabase.from("messages").insert({
           sender_id: userProfile.id,
           receiver_id: tutor.id,
           content: sysMsg,
           is_read: false
         });
      } catch (err) {
         console.error("Gagal mengirim pesan booking perdana", err);
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedTutorId(null);
        setActiveTab("student_sessions");
      }, 2000);
    } catch(err: any) {
      console.error("Booking error", err);
      alert(err.message || "Gagal melakukan booking. Pastikan profil Anda sudah diatur.");
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

      <div className="p-[18px_14px_32px] max-w-2xl mx-auto w-full tour-book-review">
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

          <div className="flex justify-center flex-wrap gap-1 mt-2.5">
            {tutor.learningStyles?.includes('Bisa Bahasa Inggris') && (
              <span className="border border-border/60 bg-bg-2 px-2 py-[2px] rounded-sm text-[9px] font-mono text-violet-300 font-medium tracking-wider w-fit whitespace-nowrap">BILINGUAL</span>
            )}
             {(tutor.learningStyles || []).filter((s: string) => s.startsWith('Jenjang')).sort((a: string, b: string) => {
                 const order: any = { 'Jenjang: SD': 1, 'Jenjang: SMP': 2, 'Jenjang: SMA': 3, 'Jenjang: Mahasiswa/Umum': 4 };
                 return (order[a] || 99) - (order[b] || 99);
             }).map((s: string) => {
                 const level = s.replace('Jenjang: ', '');
         let dotColor = "bg-text-sub";
         if (level === 'SD') dotColor = "bg-rose-400";
         else if (level === 'SMP') dotColor = "bg-sky-400";
         else if (level === 'SMA') dotColor = "bg-slate-400";
         return (
           <span key={s} className="border border-border/60 bg-bg-2 px-1.5 py-[2px] rounded-sm text-[9px] font-mono text-text-main font-medium tracking-wider flex items-center gap-1.5 whitespace-nowrap w-fit">
             <span className={`w-1 h-1 rounded-full shrink-0 ${dotColor}`}></span> {level}
           </span>
         );
       })}
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
            {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
              const d = DAYS[dayIndex];
              const isActive = (tutor.activeDays || []).includes(dayIndex);
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

        {/* Tutor Selected Featured Reviews */}
        <div className="bg-card rounded-xl p-4 border-[1.5px] border-border mb-2.5 transition-colors hover:border-border-2">
          <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-2.5 font-mono">
            ULASAN SISWA ({reviews.filter(r => r.show_on_profile !== false).length})
          </div>
          {isLoadingReviews ? (
            <div className="text-xs text-text-sub font-mono py-2">Memuat ulasan...</div>
          ) : reviews.filter(r => r.show_on_profile !== false).length === 0 ? (
            <p className="text-xs text-text-sub italic py-2">Belum ada ulasan yang ditampilkan oleh tutor.</p>
          ) : (
            <div className="space-y-3 pt-1">
              {reviews.filter(r => r.show_on_profile !== false).map((r) => (
                <div key={r.id} className="bg-bg-2/30 border border-border/60 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-text-main">
                      {r.student?.profiles?.full_name || "Siswa"}
                    </span>
                    <div className="flex items-center gap-0.5 text-warning font-mono font-bold">
                       ⭐ {r.rating} / 5
                    </div>
                  </div>
                  <p className="text-[10px] text-text-sub font-mono -mt-1">
                    {new Date(r.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  {r.review_text ? (
                    <p className="text-xs italic text-text-main bg-bg-base/70 py-2 px-2.5 border-l border-lime rounded-r">
                      "{r.review_text}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-text-sub/70 italic">Siswa memberikan rating bintang tanpa ulasan tertulis.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {activePackage && (
          <div className="bg-lime/10 border-[1.5px] border-lime/30 rounded-xl p-4 mb-3.5 flex flex-col gap-2.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-lime text-black font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Paket Aktif Anda
                </span>
                <h4 className="font-bold text-sm text-text-main mt-1.5">
                  Anda memiliki paket aktif dengan {tutor.name}
                </h4>
                <p className="text-xs text-text-sub mt-1 font-mono">
                  Sisa kuota: <span className="text-lime font-bold">{activePackage.remaining_sessions} sesi</span> lagi
                </p>
              </div>
            </div>

            <div className="flex gap-2 items-center mt-1 bg-black/20 p-2.5 rounded-lg border border-border/30">
              <input
                type="checkbox"
                id="use-package"
                checked={usePackageSession}
                onChange={(e) => setUsePackageSession(e.target.checked)}
                className="w-4 h-4 accent-lime rounded cursor-pointer"
              />
              <label htmlFor="use-package" className="text-xs text-text-main font-semibold cursor-pointer select-none">
                Gunakan kuota paket (Biaya Sesi Rp 0)
              </label>
            </div>
          </div>
        )}

        {!usePackageSession ? (
          <div className="mb-3.5">
            <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-2.5 font-mono">
              PILIH PAKET
            </div>
            <div className="flex flex-col gap-2">
              {dbPackages.map((pkg) => {
                const isAdaptive = pkg.price <= 100;
                const discount = isAdaptive ? pkg.price : 0;
                const total = isAdaptive
                  ? pkg.session_count * tutor.rate * (1 - discount / 100)
                  : pkg.price;
                const perSesi = total / pkg.session_count;
                const badge = isAdaptive && discount > 0 
                  ? `Hemat ${discount}%` 
                  : (!isAdaptive ? "PROMO" : null);
                const isSelected = selectedPkg === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg.id)}
                    className={`bg-card-2 rounded-xl p-3.5 border-[1.5px] cursor-pointer transition-all relative overflow-hidden group ${isSelected ? "border-lime bg-lime-dim shadow-lime" : "border-border hover:border-text-sub"}`}
                  >
                    {badge && (
                      <div className="absolute top-0 right-0 bg-lime text-black text-[9px] font-extrabold px-2.5 py-[3px] rounded-bl-lg font-mono tracking-[0.05em]">
                        {badge}
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-display text-[14px] font-bold text-text-main pr-[60px]">
                          {pkg.name}
                        </div>
                        <div className="text-[11px] text-text-sub mt-0.5">
                          {pkg.description || "Daftar Paket Belajar Privat Tutor"}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <div className="font-mono text-[17px] font-bold text-lime">
                          {formatRupiah(total)}
                        </div>
                        {pkg.session_count > 1 ? (
                          <div className="text-[10px] text-text-sub font-mono">
                            {formatRupiah(perSesi)}/sesi{" "}
                            {discount > 0 && (
                              <span className="text-online font-bold">
                                hemat {discount}%
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
                        {pkg.session_count} sesi
                      </div>
                    </div>
                  </div>
                );
              })}
              {dbPackages.length === 0 && (
                <p className="text-xs text-text-sub text-center py-4 italic border border-dashed border-border rounded-xl">
                  Memuat penawaran paket...
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-lime-dim/10 border-[1.5px] border-lime/20 rounded-xl p-4 mb-3.5 text-xs text-text-sub font-mono">
            Sesi ini akan dijadwalkan secara individu menggunakan kuota paket Anda.
          </div>
        )}

        <div className="mb-3.5 tour-schedule">
          <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-2.5 font-mono">
            JADWAL SESI PERTAMA
          </div>
          
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar mb-2">
            {availableDates.length > 0 ? availableDates.map(d => {
              const isSelected = selectedDate?.getTime() === d.getTime();
              return (
                <div 
                  key={d.toISOString()} 
                  onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-xl border-[1.5px] cursor-pointer transition-all ${isSelected ? "border-lime bg-lime-dim shadow-lime" : "border-border bg-card-2 hover:border-lime/50"}`}
                >
                  <span className={`text-[10px] font-bold font-mono ${isSelected ? 'text-lime' : 'text-text-sub'}`}>{DAYS[d.getDay()]}</span>
                  <span className={`text-[16px] font-display font-bold ${isSelected ? 'text-white' : 'text-text-main'}`}>{d.getDate()}</span>
                </div>
              );
            }) : (
              <div className="text-[12px] text-text-sub">Tutor ini belum mengatur jadwal aktif.</div>
            )}
          </div>

          {selectedDate && (
            <div className="grid grid-cols-4 gap-2 animate-pgIn">
              {availableHours.length > 0 ? availableHours.map((h: string) => {
                const isHSelected = selectedTime === h;
                return (
                  <div
                    key={h}
                    onClick={() => setSelectedTime(h)}
                    className={`flex items-center justify-center py-2 rounded-lg border-[1.5px] text-[12px] font-bold font-mono cursor-pointer transition-all ${isHSelected ? "border-lime bg-lime text-black" : "border-border bg-card-2 text-text-main hover:border-lime"}`}
                  >
                    {h}
                  </div>
                );
              }) : (
                <div className="col-span-4 text-[12px] text-text-sub">Tidak ada jam tersedia di hari ini.</div>
              )}
            </div>
          )}
        </div>

        <div className="tour-mapel-method">
        <div className="flex flex-col gap-[5px] mb-4">
          <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">
            Mata Pelajaran <span className="text-red-500 font-bold">*</span>
          </label>
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-bg-1 border-[1.5px] border-border rounded-xl p-3 text-[13px] font-bold text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime/50 transition-colors"
          >
            <option value="">-- Pilih Mata Pelajaran (Wajib) --</option>
            {tutor.tags && tutor.tags.length > 0 ? (
               tutor.tags.map((tag: string, idx: number) => (
                 <option key={idx} value={tag}>{tag}</option>
               ))
            ) : (
               <option value={tutor.major}>{tutor.major}</option>
            )}
          </select>
        </div>

        <div className="flex flex-col gap-[5px] mb-4">
          <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">
            Metode Pertemuan
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setMeetingType('online')}
              className={`flex-1 py-2.5 rounded-lg border-[1.5px] font-bold text-sm transition-colors ${meetingType === 'online' ? 'border-lime bg-lime-dim text-lime' : 'border-border bg-bg-2 text-text-sub hover:border-lime/50'}`}
            >
              Online (Video Call)
            </button>
            <button
              onClick={() => setMeetingType('offline')}
              className={`flex-1 py-2.5 rounded-lg border-[1.5px] font-bold text-sm transition-colors ${meetingType === 'offline' ? 'border-lime bg-lime-dim text-lime' : 'border-border bg-bg-2 text-text-sub hover:border-lime/50'}`}
            >
              Offline (Tatap Muka)
            </button>
          </div>
        </div>
        </div>

        {meetingType === 'offline' && (
          <div className="mb-4 animate-pgIn">
            <MapPicker value={location} onChange={setLocation} />
          </div>
        )}

        <div className="flex flex-col gap-[5px] mb-3 tour-notes">
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

        <div className="flex flex-col gap-2">
          <button
            onClick={handleBook}
            disabled={bookingSuccess || isSubmitting}
            className="w-full bg-lime text-black border-[2px] border-lime rounded-lg py-[11px] px-[18px] font-display font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-sh1 transition-all hover:shadow-sh2 hover:-translate-x-px hover:-translate-y-px active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none tour-book-now"
          >
            {bookingSuccess
              ? "Booking Berhasil! Mengalihkan..."
              : isSubmitting ? "Memproses..." : userRole === "guest"
                ? "Login untuk Booking"
                : "Booking Sekarang"}
          </button>
        </div>
      </div>

      {/* Success ModalOverlay */}
      {bookingSuccess && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-pgIn" style={{overscrollBehavior: 'none'}}>
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
        </div>, document.body
      )}
    </div>
  );
}
