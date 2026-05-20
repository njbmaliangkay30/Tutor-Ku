import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Users, BookOpen, Search, ShieldCheck, Eye, ShieldAlert, X, AlertOctagon, CreditCard, Calendar, Star, LayoutGrid, List } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function AdminPanel({ activeSubTab }: { activeSubTab: "tutors" | "students" | "transactions" | "sessions" | "packages" | "reviews" }) {
  const [tutors, setTutors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "gallery">("gallery");
  const [selectedGalleryTutor, setSelectedGalleryTutor] = useState<any | null>(null);
  const [modalSubTab, setModalSubTab] = useState<"sessions" | "reviews">("sessions");

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeSubTab === "tutors") {
        const { data, error } = await supabase
          .from("tutor_profiles")
          .select(`
            *,
            profiles(*)
          `);
        
        if (!error && data) {
          const formattedTutors = data.filter((t: any) => t.profiles?.role === 'tutor' || t.profiles).map((t: any) => ({
            ...t.profiles,
            tutor_profile_id: t.id,
            is_verified: t.is_verified || false,
            tutor_details: t
          }));
          setTutors(formattedTutors);
        }
      } else if (activeSubTab === "students") {
        const { data, error } = await supabase
          .from("student_profiles")
          .select(`
            *,
            profiles(*)
          `);
        
        if (!error && data) {
          const formatedStudents = data.filter((s: any) => s.profiles?.role === 'student' || s.profiles).map((s: any) => ({
            ...s.profiles,
            student_profile_id: s.id,
            student_details: s
          }));
          setStudents(formatedStudents);
        }
      } else if (activeSubTab === "transactions") {
        const { data, error } = await supabase
          .from("transactions")
          .select(`
            *,
            profiles(full_name, email)
          `)
          .order("created_at", { ascending: false });
        if (!error && data) setTransactions(data);
      } else if (activeSubTab === "sessions" || activeSubTab === "reviews") {
        const [sessionsRes, reviewsRes, tutorsRes] = await Promise.all([
          supabase
            .from("sessions")
            .select(`
              *,
              student:student_profiles(profiles(full_name)),
              tutor:tutor_profiles(profiles(full_name))
            `)
            .order("created_at", { ascending: false }),
          supabase
            .from("reviews")
            .select(`
              *,
              student:student_profiles(profiles(full_name)),
              tutor:tutor_profiles(profiles(full_name))
            `)
            .order("created_at", { ascending: false }),
          supabase
            .from("tutor_profiles")
            .select(`
              *,
              profiles(*)
            `)
        ]);

        if (sessionsRes.data) setSessions(sessionsRes.data);
        if (reviewsRes.data) setReviews(reviewsRes.data);
        if (tutorsRes.data) {
          const formattedTutors = tutorsRes.data.filter((t: any) => t.profiles?.role === 'tutor' || t.profiles).map((t: any) => ({
            ...t.profiles,
            tutor_profile_id: t.id,
            is_verified: t.is_verified || false,
            tutor_details: t
          }));
          setTutors(formattedTutors);
        }
      } else if (activeSubTab === "packages") {
        const { data, error } = await supabase
          .from("packages")
          .select("*")
          .order("price", { ascending: true });
        if (!error && data) setPackages(data);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVerification = async (tutorId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from("tutor_profiles")
        .update({ is_verified: !currentStatus })
        .eq("id", tutorId);
      
      if (!error) {
        // Send notification
        await supabase.from("notifications").insert({
          user_id: tutorId,
          title: !currentStatus ? "Akun Terverifikasi!" : "Status Verifikasi Dicabut",
          message: !currentStatus 
            ? "Selamat! Akun tutor kamu telah terverifikasi oleh admin. Kamu sekarang bisa menerima booking dari siswa."
            : "Status verifikasi akun tutor kamu telah dicabut oleh admin. Silakan hubungi admin untuk informasi lebih lanjut.",
          link: "home"
        });

        setTutors(tutors.map(t => t.id === tutorId ? { ...t, is_verified: !currentStatus } : t));
        if (selectedUser && selectedUser.id === tutorId) {
          setSelectedUser({ ...selectedUser, is_verified: !currentStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleTitle = () => {
    switch (activeSubTab) {
      case "tutors": return "Data Tutor";
      case "students": return "Data Student";
      case "transactions": return "Transaksi";
      case "sessions": return "Sesi Belajar";
      case "packages": return "Package Management";
      case "reviews": return "Review Tutor";
      default: return "Admin Panel";
    }
  };

  return (
    <>
      <div className="p-4 md:p-8 animate-pgIn max-w-5xl mx-auto w-full relative space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display font-bold text-[32px] tracking-tight">{getRoleTitle()}</h1>
          <p className="text-text-sub font-mono text-sm">Kelola data platform TutorKu.</p>
        </div>
        
        {(activeSubTab === "sessions" || activeSubTab === "reviews") && (
          <div className="flex bg-bg-2 border border-border p-1 rounded-xl w-fit shrink-0">
            <button 
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === "list" ? "bg-lime text-black shadow-sm" : "text-text-sub hover:text-text-main"}`}
            >
              <List size={14} /> List View
            </button>
            <button 
              onClick={() => setViewMode("gallery")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === "gallery" ? "bg-lime text-black shadow-sm" : "text-text-sub hover:text-text-main"}`}
            >
              <LayoutGrid size={14} /> Gallery View
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-lime/30 border-t-lime animate-spin"></div>
        </div>
      ) : (activeSubTab === "sessions" || activeSubTab === "reviews") && viewMode === "gallery" ? (
        <div className="space-y-6">
          {/* Brief instruction info box */}
          <div className="bg-lime-dim/20 border border-lime/20 rounded-xl p-4 flex gap-3 items-start text-xs text-text-main animate-pgIn">
            <LayoutGrid size={18} className="text-lime shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-lime mb-0.5">Gallery Monitoring {activeSubTab === "sessions" ? "Sesi Belajar" : "Review Tutor"}</p>
              <p className="text-text-sub leading-relaxed">
                {activeSubTab === "sessions" 
                  ? "Setiap kartu mewakili profil Tutor. Klik kartu tutor untuk memonitoring rincian seluruh sesi belajar (baik aktif, selesai, maupun dibatalkan) serta terhubung langsung ke ulasan mereka."
                  : "Setiap kartu mewakili profil Tutor. Klik kartu tutor untuk memonitoring rincian ulasan ulasan siswa, rating akumulatif, serta terhubung langsung ke sesi mengajar mereka."
                }
              </p>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pgIn">
            {tutors.map((tutor) => {
              const tutorSessions = sessions.filter(s => s.tutor_id === tutor.tutor_profile_id);
              const tutorReviews = reviews.filter(r => r.tutor_id === tutor.tutor_profile_id);
              const avgRating = tutorReviews.length > 0 
                ? (tutorReviews.reduce((sum, r) => sum + r.rating, 0) / tutorReviews.length).toFixed(1)
                : "N/A";
                
              return (
                <div 
                  key={tutor.id}
                  onClick={() => {
                    setSelectedGalleryTutor(tutor);
                    setModalSubTab(activeSubTab === "reviews" ? "reviews" : "sessions");
                  }}
                  className="group bg-card border border-border rounded-xl overflow-hidden hover:border-lime/50 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col relative"
                >
                  {/* Header cover */}
                  <div className="h-24 bg-gradient-to-tr from-lime/10 to-bg-3 relative overflow-hidden border-b border-border/40">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C8FF00_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="absolute top-2.5 right-2.5 flex gap-1.5 items-center">
                      {tutor.is_verified && (
                        <span className="bg-success/20 text-success border border-success/30 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase tracking-wider">
                          Verified
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${tutor.gender === 'P' || tutor.gender === 'F' ? "bg-[rgba(255,80,160,0.15)] text-[#FF50A0] border-[rgba(255,80,160,0.25)]" : "bg-[rgba(80,160,255,0.15)] text-[#50A0FF] border-[rgba(80,160,255,0.25)]"}`}>
                        {tutor.gender === 'P' || tutor.gender === 'F' ? "♀ P" : "♂ L"}
                      </span>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-4 pt-0 flex-1 flex flex-col relative justify-between">
                    <div>
                      <div className="relative -mt-8 mb-2 flex">
                        {tutor.avatar_url ? (
                          <img 
                            src={tutor.avatar_url} 
                            alt={tutor.full_name} 
                            className="w-14 h-14 rounded-full object-cover border-2 border-card shadow-md bg-card" 
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-bg-2 border-2 border-card flex items-center justify-center text-text-main font-bold text-base shadow-md">
                            {(tutor.full_name || "U").substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <h3 className="font-bold text-text-main group-hover:text-lime transition-colors text-sm line-clamp-1 leading-snug">
                        {tutor.full_name}
                      </h3>
                      <p className="text-[10px] text-text-sub font-mono -mt-0.5 truncate">{tutor.email}</p>

                      {/* Subject / Major row */}
                      <p className="text-[10px] text-lime mt-1.5 font-mono uppercase tracking-wider font-semibold line-clamp-1">
                        {tutor.tutor_details?.target_subjects?.slice(0, 2).join(", ") || "General"}
                      </p>
                    </div>

                    {/* Statistics Table split based on active sub tab */}
                    {activeSubTab === "sessions" ? (
                      <div className="mt-4 pt-3 border-t border-border/40 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-sub text-[9px] uppercase font-mono tracking-wider">📅 Total Sesi</span>
                          <span className="font-extrabold text-lime font-mono">
                            {tutorSessions.length} Sesi
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-1 bg-bg-2 p-1.5 rounded-lg border border-border/40 text-center text-[9px]">
                          <div>
                            <p className="text-text-sub text-[8px] uppercase tracking-wider">Selesai</p>
                            <p className="font-mono font-bold text-success">
                              {tutorSessions.filter(s => s.status === "completed").length}
                            </p>
                          </div>
                          <div className="border-l border-border/60">
                            <p className="text-text-sub text-[8px] uppercase tracking-wider">Aktif</p>
                            <p className="font-mono font-bold text-warning font-mono">
                              {tutorSessions.filter(s => s.status === "pending" || s.status === "accepted").length}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 pt-3 border-t border-border/40 space-y-2.5 text-xs">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-sub text-[9px] uppercase font-mono tracking-wider">⭐ Rating Rata-rata</span>
                          <span className="font-bold text-warning font-mono">
                            {avgRating === "N/A" ? "Belum ada" : `${avgRating} ★`}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-sub text-[9px] uppercase font-mono tracking-wider">💬 Jumlah Review</span>
                          <span className="font-bold text-text-main font-mono">
                            {tutorReviews.length} Ulasan
                          </span>
                        </div>

                        {tutorReviews.length > 0 ? (
                          <div className="bg-bg-2 p-1.5 rounded-lg border border-border/40 text-[10px] text-text-sub italic line-clamp-2 leading-relaxed">
                            "{tutorReviews[0].review_text || "Tanpa rincian pesan"}"
                          </div>
                        ) : (
                          <div className="bg-bg-2/30 p-1.5 rounded-lg border border-dashed border-border text-[10px] text-text-sub/70 italic text-center">
                            Belum ada ulasan siswa
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
          {tutors.length === 0 && <p className="text-sm text-text-sub text-center py-10 animate-pgIn">Belum ada tutor terdaftar.</p>}
        </div>
      ) : activeSubTab === "tutors" ? (
        <div className="space-y-3">
          {tutors.map((tutor) => (
            <div 
              key={tutor.id} 
              onClick={() => setSelectedUser(tutor)}
              className="bg-card p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between cursor-pointer hover:border-lime/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                 {tutor.avatar_url ? (
                   <img src={tutor.avatar_url} alt={tutor.full_name} className="w-10 h-10 rounded-full object-cover border border-border" />
                 ) : (
                   <div className="w-10 h-10 rounded-full bg-bg-2 border border-border flex items-center justify-center text-text-sub font-bold text-sm">
                     {(tutor.full_name || "U").substring(0, 2).toUpperCase()}
                   </div>
                 )}
                 <div>
                  <h3 className="font-semibold text-text-main flex items-center gap-2">
                    {tutor.full_name}
                    {tutor.is_verified && <span className="inline-block w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(0,230,118,0.6)]" title="Verified Tutor"></span>}
                  </h3>
                  <p className="text-xs text-text-sub mb-1">{tutor.email}</p>
                  <div>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${tutor.gender === 'P' || tutor.gender === 'F' ? "bg-[rgba(255,80,160,0.1)] text-[#FF50A0] border-[rgba(255,80,160,0.25)]" : tutor.gender === 'L' || tutor.gender === 'M' ? "bg-[rgba(80,160,255,0.1)] text-[#50A0FF] border-[rgba(80,160,255,0.25)]" : "bg-bg-3 text-text-sub border-border"}`}>
                      {tutor.gender === 'P' || tutor.gender === 'F' ? '♀ Perempuan' : tutor.gender === 'L' || tutor.gender === 'M' ? '♂ Laki-laki' : 'Gender: -'}
                    </span>
                  </div>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button
                    disabled={isProcessing}
                    onClick={(e) => toggleVerification(tutor.id, tutor.is_verified, e)}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-colors border ${tutor.is_verified ? "bg-success/10 text-success border-success/20 hover:bg-danger/10 hover:text-danger hover:border-danger/20" : "bg-warning/10 text-warning border-warning/20 hover:bg-success/10 hover:text-success hover:border-success/20"}`}
                 >
                    {tutor.is_verified ? (
                      <><ShieldAlert size={14} /> Cabut Verifikasi</>
                    ) : (
                      <><ShieldCheck size={14} /> Verifikasi Tutor</>
                    )}
                 </button>
                 <button className="px-3 py-1.5 text-[11px] text-text-main font-bold rounded-lg flex items-center gap-1.5 bg-bg-2 border border-border hover:bg-bg-3">
                    <Eye size={14} /> Detail
                 </button>
              </div>
            </div>
          ))}
          {tutors.length === 0 && <p className="text-sm text-text-sub text-center py-10">Belum ada tutor terdaftar.</p>}
        </div>
      ) : activeSubTab === "students" ? (
        <div className="space-y-3">
          {students.map((student) => (
            <div 
              key={student.id} 
              onClick={() => setSelectedUser(student)}
              className="bg-card p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between cursor-pointer hover:border-lime/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                 {student.avatar_url ? (
                   <img src={student.avatar_url} alt={student.full_name} className="w-10 h-10 rounded-full object-cover border border-border" />
                 ) : (
                   <div className="w-10 h-10 rounded-full bg-bg-2 border border-border flex items-center justify-center text-text-sub font-bold text-sm">
                     {(student.full_name || "U").substring(0, 2).toUpperCase()}
                   </div>
                 )}
                 <div>
                  <h3 className="font-semibold text-text-main">{student.full_name}</h3>
                  <p className="text-xs text-text-sub mb-1">{student.email}</p>
                  <div>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${student.gender === 'P' || student.gender === 'F' ? "bg-[rgba(255,80,160,0.1)] text-[#FF50A0] border-[rgba(255,80,160,0.25)]" : student.gender === 'L' || student.gender === 'M' ? "bg-[rgba(80,160,255,0.1)] text-[#50A0FF] border-[rgba(80,160,255,0.25)]" : "bg-bg-3 text-text-sub border-border"}`}>
                      {student.gender === 'P' || student.gender === 'F' ? '♀ Perempuan' : student.gender === 'L' || student.gender === 'M' ? '♂ Laki-laki' : 'Gender: -'}
                    </span>
                  </div>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button className="px-3 py-1.5 text-[11px] text-text-main font-bold rounded-lg flex items-center gap-1.5 bg-bg-2 border border-border hover:bg-bg-3">
                    <Eye size={14} /> Detail
                 </button>
              </div>
            </div>
          ))}
          {students.length === 0 && <p className="text-sm text-text-sub text-center py-10">Belum ada student terdaftar.</p>}
        </div>
      ) : activeSubTab === "transactions" ? (
        <div className="space-y-3">
          {transactions.map((trx) => (
            <div key={trx.id} className="bg-card p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                 <p className="text-xs text-text-sub mb-1">{new Date(trx.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                 <h3 className="font-semibold text-text-main">
                    Rp {trx.amount?.toLocaleString()}
                 </h3>
                 <p className="text-sm text-text-main capitalize mt-1">
                   {trx.transaction_type && trx.transaction_type.replace(/_/g, " ")} &bull; {trx.profiles?.full_name || "Unknown User"}
                 </p>
              </div>
              <div className="flex gap-2">
                 <span className={`px-2 py-1 text-[10px] font-bold rounded flex items-center uppercase ${trx.status === 'success' ? 'bg-success/10 text-success' : trx.status === 'failed' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                    {trx.status}
                 </span>
              </div>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-sm text-text-sub text-center py-10">Belum ada transaksi.</p>}
        </div>
      ) : activeSubTab === "sessions" ? (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="bg-card p-4 rounded-xl border border-border flex justify-between items-start md:items-center gap-4">
              <div className="min-w-0 flex-1">
                 <p className="text-xs text-text-sub mb-1">{new Date(session.session_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })} &bull; {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}</p>
                 <h3 className="font-semibold text-text-main truncate">
                    {session.subject}
                 </h3>
                 <div className="text-sm text-text-sub mt-1 flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                    <span><strong className="text-text-[#eaeaea] font-semibold dark:text-text-main">Tutor:</strong> {session.tutor?.profiles?.full_name || "-"}</span>
                    <span><strong className="text-text-[#eaeaea] font-semibold dark:text-text-main">Student:</strong> {session.student?.profiles?.full_name || "-"}</span>
                 </div>
              </div>
              <div className="flex gap-2 flex-col items-end shrink-0">
                 <span className={`px-2 py-1 text-[10px] font-bold rounded flex items-center uppercase ${session.status === 'completed' ? 'bg-success/10 text-success' : session.status === 'cancelled' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                    {session.status}
                 </span>
                 <span className="text-xs font-mono text-lime font-bold">
                    {session.payment_status?.toUpperCase()}
                 </span>
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-sm text-text-sub text-center py-10">Belum ada sesi belajar.</p>}
        </div>
      ) : activeSubTab === "packages" ? (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-card p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                 <h3 className="font-semibold text-text-main text-lg uppercase tracking-wider">
                    {pkg.name}
                 </h3>
                 <p className="text-sm text-text-sub mt-1">
                   {pkg.description || "Paket langganan"}
                 </p>
              </div>
              <div className="flex gap-2 flex-col items-end">
                 <span className="text-lg font-bold text-lime">
                    Rp {pkg.price?.toLocaleString()}
                 </span>
                 <span className="px-2 py-1 bg-lime-dim text-lime text-[10px] font-bold rounded uppercase">
                    {pkg.session_count} Sesi
                 </span>
              </div>
            </div>
          ))}
          {packages.length === 0 && <p className="text-sm text-text-sub text-center py-10">Belum ada package tersedia.</p>}
        </div>
      ) : activeSubTab === "reviews" ? (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-card p-4 rounded-xl border border-border flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-sub">
                    <span className="font-semibold text-text-main">From:</span>
                    <strong className="text-text-main font-bold">{r.student?.profiles?.full_name || "Siswa"}</strong>
                    <span className="opacity-40">&bull;</span>
                    <span className="font-semibold text-text-sub">To Tutor:</span>
                    <strong className="text-text-main font-bold">{r.tutor?.profiles?.full_name || "Tutor"}</strong>
                  </div>
                  <p className="text-[10px] text-text-sub font-mono">{new Date(r.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-1 bg-warning/10 text-warning px-2 py-1 rounded w-fit self-start sm:self-auto">
                  <Star size={13} className="fill-warning text-warning" />
                  <span className="text-xs font-bold font-mono">{r.rating}</span>
                  <span className="text-[10px] opacity-75">/ 5</span>
                </div>
              </div>
              {r.review_text && (
                <div className="relative pl-3 border-l-2 border-lime/40 py-0.5">
                  <p className="text-sm italic text-text-main leading-relaxed">
                    "{r.review_text}"
                  </p>
                </div>
              )}
            </div>
          ))}
          {reviews.length === 0 && <p className="text-sm text-text-sub text-center py-10">Belum ada review.</p>}
        </div>
      ) : null}
      </div>

      {/* User Details Modal */}
      {selectedUser && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-pgIn" style={{overscrollBehavior: 'none'}}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl relative animate-slideUp flex flex-col max-h-[90vh]">
            <button
               onClick={() => setSelectedUser(null)}
               className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-bg-2 text-text-sub hover:text-text-main transition-colors z-10"
            >
              <X size={18} />
            </button>
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-4 pr-6">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt={selectedUser.full_name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-border shrink-0" />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-bg-2 border border-border flex items-center justify-center text-text-main font-bold text-lg shrink-0">
                    {(selectedUser.full_name || "U").substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-text-main flex flex-wrap items-center gap-2 leading-tight">
                    {selectedUser.full_name}
                    {activeSubTab === "tutors" && (
                       <span className={`px-2 py-[2px] rounded text-[9px] font-bold font-mono tracking-wider items-center ${selectedUser.is_verified ? "bg-success/10 text-success border border-success/20" : "bg-warning/10 text-warning border border-warning/20"}`}>
                          {selectedUser.is_verified ? "TERVERIFIKASI" : "BELUM TERVERIFIKASI"}
                       </span>
                    )}
                  </h2>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-text-sub">
                    <p>{selectedUser.email}</p>
                    <p>{selectedUser.phone || "-"}</p>
                  </div>
                  <p className="text-[9px] font-mono text-lime bg-lime-dim inline-block px-1.5 py-0.5 rounded mt-1.5 uppercase">
                    ID: {selectedUser.id.substring(0, 8)}...
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {activeSubTab === "tutors" && selectedUser.tutor_details && (
                  <div className="bg-bg-2 rounded-xl p-3 border border-border">
                    <h4 className="text-[10px] font-bold text-text-sub mb-2.5 uppercase tracking-wider">Tutor Info</h4>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                      <div>
                        <p className="text-text-sub text-[9px] mb-0.5">Tarif / Jam</p>
                        <p className="text-xs font-bold text-text-main">
                          Rp {selectedUser.tutor_details.hourly_rate?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-sub text-[9px] mb-0.5">Gender / Tipe</p>
                        <p className="text-xs font-bold text-text-main capitalize">
                          {(selectedUser.gender === "P" || selectedUser.gender === "F" ? "Perempuan" : selectedUser.gender === "L" || selectedUser.gender === "M" ? "Laki-laki" : null) || selectedUser.tutor_details.gender || "-"} • {selectedUser.tutor_details.learning_styles?.join(", ") || "All"}
                        </p>
                      </div>
                      <div className="col-span-2">
                         <p className="text-text-sub text-[9px] mb-0.5">Mapel yang Dikuasai</p>
                         <p className="text-[11px] font-bold text-text-main leading-snug">{selectedUser.tutor_details.target_subjects?.join(", ") || "-"}</p>
                      </div>
                      <div>
                         <p className="text-text-sub text-[9px] mb-0.5">Hari & Jam Tersedia</p>
                         <p className="text-[10px] text-text-main leading-snug">
                           Hari: {selectedUser.tutor_details.available_days?.map((d: number) => ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][d]).join(", ") || "-"}
                           <br/>
                           Jam: {selectedUser.tutor_details.available_hours?.join(", ") || "-"}
                         </p>
                      </div>
                      <div>
                         <p className="text-text-sub text-[9px] mb-0.5">Alamat/Lokasi</p>
                         <p className="text-[10px] font-bold text-text-main leading-snug">{selectedUser.tutor_details.address || "-"}</p>
                      </div>
                    </div>
                    {selectedUser.tutor_details.bio && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-text-sub text-[9px] mb-1">Bio</p>
                        <p className="text-[11px] text-text-main leading-relaxed">{selectedUser.tutor_details.bio}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === "students" && selectedUser.student_details && (
                  <div className="bg-bg-2 rounded-xl p-4 border border-border">
                    <h4 className="text-xs font-bold text-text-sub mb-3 uppercase tracking-wider">Student Info</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-text-sub text-[10px] mb-1">Sekolah/Univ</p>
                        <p className="text-xs font-bold text-text-main">
                          {selectedUser.student_details.school_name || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-sub text-[10px] mb-1">Tingkat Pendidikan</p>
                        <p className="text-xs font-bold text-text-main capitalize">
                          {selectedUser.student_details.education_level || "-"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-text-sub text-[10px] mb-1">Jenis Kelamin</p>
                        <p className="text-xs font-bold text-text-main">
                          {selectedUser.gender === "P" || selectedUser.gender === "F" ? "Perempuan" : selectedUser.gender === "L" || selectedUser.gender === "M" ? "Laki-laki" : "-"}
                        </p>
                      </div>
                      <div className="col-span-2">
                         <p className="text-text-sub text-[10px] mb-1">Alamat/Lokasi</p>
                         <p className="text-xs font-bold text-text-main">{selectedUser.student_details.address || "-"}</p>
                      </div>
                    </div>
                    {selectedUser.student_details.bio && (
                      <div className="mt-4">
                        <p className="text-text-sub text-[10px] mb-1">Bio</p>
                        <p className="text-sm text-text-main">{selectedUser.student_details.bio}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-4 flex gap-3">
                  {activeSubTab === "tutors" && (
                    <button
                      disabled={isProcessing}
                      onClick={(e) => toggleVerification(selectedUser.id, selectedUser.is_verified, e)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border ${selectedUser.is_verified ? "bg-danger/10 text-danger border-danger/20 hover:bg-danger/20" : "bg-success/10 text-success border-success/20 hover:bg-success/20"}`}
                    >
                      {selectedUser.is_verified ? (
                        <><ShieldAlert size={16} /> Cabut Verifikasi</>
                      ) : (
                        <><ShieldCheck size={16} /> Verifikasi Tutor</>
                      )}
                    </button>
                  )}
                  <button className="flex-1 py-2 text-xs font-bold rounded-lg border border-warning/50 text-warning hover:bg-warning/10 flex items-center justify-center gap-2 transition-colors">
                    <AlertOctagon size={16} /> Suspend Akun
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Gallery Tutor Detail portal */}
      {selectedGalleryTutor && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-pgIn" style={{overscrollBehavior: 'none'}}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl shadow-2xl relative animate-slideUp flex flex-col max-h-[90vh]">
            <button
               onClick={() => setSelectedGalleryTutor(null)}
               className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-bg-2 text-text-sub hover:text-text-main border border-border hover:border-lime/40 transition-colors z-10"
            >
              <X size={18} />
            </button>
            <div className="p-6 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              {/* Header profile design */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60 mb-6 mt-2">
                <div className="flex items-center gap-4">
                  {selectedGalleryTutor.avatar_url ? (
                    <img 
                      src={selectedGalleryTutor.avatar_url} 
                      alt={selectedGalleryTutor.full_name} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-lime shadow-lg" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-bg-2 border-2 border-lime flex items-center justify-center text-text-main font-bold text-xl shadow-lg">
                      {(selectedGalleryTutor.full_name || "U").substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight flex items-center gap-2">
                      {selectedGalleryTutor.full_name}
                      {selectedGalleryTutor.is_verified && (
                        <span className="bg-success/15 text-success border border-success/35 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase">
                          Verified
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-text-sub font-mono">{selectedGalleryTutor.email} &bull; {selectedGalleryTutor.phone || "-"}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${selectedGalleryTutor.gender === 'P' || selectedGalleryTutor.gender === 'F' ? "bg-[rgba(255,80,160,0.1)] text-[#FF50A0] border-[rgba(255,80,160,0.25)]" : "bg-[rgba(80,160,255,0.1)] text-[#50A0FF] border-[rgba(80,160,255,0.25)]"}`}>
                        {selectedGalleryTutor.gender === 'P' || selectedGalleryTutor.gender === 'F' ? 'Perempuan (♀)' : 'Laki-laki (♂)'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono border border-border bg-bg-2 text-text-sub">
                        ID: {selectedGalleryTutor.tutor_profile_id.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 text-left md:text-right bg-bg-2 px-4 py-3 rounded-xl border border-border w-full md:w-auto shrink-0 animate-pgIn">
                  <span className="text-[10px] font-bold font-mono tracking-wider text-text-sub uppercase">Tarif Mengajar</span>
                  <span className="text-lg font-bold text-lime">Rp {selectedGalleryTutor.tutor_details?.hourly_rate?.toLocaleString()}/jam</span>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex border-b border-border/60 mb-6">
                <button
                  onClick={() => setModalSubTab("sessions")}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${modalSubTab === "sessions" ? "border-lime text-lime" : "border-transparent text-text-sub hover:text-text-main"}`}
                >
                  <Calendar size={15} /> Sesi Belajar ({sessions.filter(s => s.tutor_id === selectedGalleryTutor.tutor_profile_id).length})
                </button>
                <button
                  onClick={() => setModalSubTab("reviews")}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${modalSubTab === "reviews" ? "border-lime text-lime" : "border-transparent text-text-sub hover:text-text-main"}`}
                >
                  <Star size={15} /> Ulasan & Review ({reviews.filter(r => r.tutor_id === selectedGalleryTutor.tutor_profile_id).length})
                </button>
              </div>

              {/* Single Column Details focused on selected tab */}
              <div className="animate-pgIn">
                {modalSubTab === "sessions" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-sub flex items-center gap-2">
                        <Calendar size={14} className="text-lime" />
                        Daftar Lengkap Sesi Belajar
                      </h3>
                      <span className="text-xs text-text-sub font-mono">
                        Total {sessions.filter(s => s.tutor_id === selectedGalleryTutor.tutor_profile_id).length} Sesi
                      </span>
                    </div>
                    
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                      {(() => {
                        const tutorSessions = sessions.filter(s => s.tutor_id === selectedGalleryTutor.tutor_profile_id);
                        if (tutorSessions.length === 0) {
                          return (
                            <div className="text-center py-10 bg-bg-2 rounded-xl border border-dashed border-border/60">
                              <p className="text-xs text-text-sub italic">Belum ada sesi diatur untuk tutor ini.</p>
                            </div>
                          );
                        }
                        return tutorSessions.map(session => {
                          const sessionReview = reviews.find(r => r.session_id === session.id);
                          return (
                            <div key={session.id} className="bg-bg-2 border border-border p-4 rounded-xl hover:border-border-2 transition-colors text-xs space-y-3 relative">
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-semibold text-text-main text-sm">{session.subject}</span>
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${session.status === 'completed' ? 'bg-success/10 text-success' : session.status === 'cancelled' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                                  {session.status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-y-2 text-text-sub text-[11px] font-mono border-t border-border/40 pt-2.5">
                                <div>Tanggal:</div>
                                <div className="text-text-main text-right font-medium">{new Date(session.session_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                <div>Waktu Pelaksanaan:</div>
                                <div className="text-text-main text-right font-medium">{session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)} WIB</div>
                                <div>Siswa:</div>
                                <div className="text-text-main text-right font-bold">{session.student?.profiles?.full_name || "-"}</div>
                                <div>Status Pembayaran:</div>
                                <div className="text-right text-lime font-bold uppercase">{session.payment_status || "UNPAID"}</div>
                              </div>

                              {/* Associated Review Shortcut */}
                              {sessionReview ? (
                                <div className="mt-3 bg-[rgba(255,193,7,0.05)] border border-[rgba(255,193,7,0.15)] p-3 rounded-lg text-xs space-y-1.5 animate-pgIn">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-warning font-extrabold flex items-center gap-1 font-mono">
                                      ⭐ Rating Siswa: {sessionReview.rating} / 5
                                    </span>
                                    <button 
                                      onClick={() => setModalSubTab("reviews")}
                                      className="text-lime hover:underline font-mono font-bold text-[9px] uppercase tracking-wider"
                                    >
                                      Buka review &rsaquo;
                                    </button>
                                  </div>
                                  {sessionReview.review_text ? (
                                    <p className="text-text-main italic text-[11px] leading-relaxed bg-card/60 py-1.5 px-2.5 border-l-2 border-warning/80 rounded-r">
                                      "{sessionReview.review_text}"
                                    </p>
                                  ) : (
                                    <p className="text-text-sub italic text-[10px] leading-relaxed">
                                      Tanpa rincian komentar tertulis.
                                    </p>
                                  )}
                                </div>
                              ) : (
                                session.status === 'completed' && (
                                  <div className="text-right pt-1 text-[10px] text-text-sub italic">
                                    Belum diulas siswa
                                  </div>
                                )
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-sub flex items-center gap-2">
                        <Star size={14} className="text-warning fill-warning" />
                        Ulasan & Review dari Siswa
                      </h3>
                      {(() => {
                        const tutorReviews = reviews.filter(r => r.tutor_id === selectedGalleryTutor.tutor_profile_id);
                        if (tutorReviews.length === 0) return null;
                        const avg = (tutorReviews.reduce((sum, r) => sum + r.rating, 0) / tutorReviews.length).toFixed(1);
                        return <span className="text-xs font-bold text-warning flex items-center gap-1 font-mono">⭐ {avg} / 5</span>;
                      })()}
                    </div>

                    <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                      {(() => {
                        const tutorReviews = reviews.filter(r => r.tutor_id === selectedGalleryTutor.tutor_profile_id);
                        if (tutorReviews.length === 0) {
                          return (
                            <div className="text-center py-10 bg-bg-2 rounded-xl border border-dashed border-border/60">
                              <p className="text-xs text-text-sub italic">Belum ada review siswa untuk tutor ini.</p>
                            </div>
                          );
                        }
                        return tutorReviews.map(r => {
                          const reviewSession = sessions.find(s => s.id === r.session_id);
                          return (
                            <div key={r.id} className="bg-bg-2 border border-border p-4 rounded-xl hover:border-border-2 transition-colors text-xs space-y-3">
                              <div className="flex items-center justify-between gap-2 border-b border-border/35 pb-2 font-sans">
                                <span className="font-semibold text-text-main">dari {r.student?.profiles?.full_name || "Siswa"}</span>
                                <div className="flex items-center gap-0.5 bg-warning/10 text-warning px-2 py-0.5 rounded font-bold font-mono text-[11px]">
                                  ⭐ {r.rating}
                                </div>
                              </div>
                              
                              <p className="text-[11px] text-text-sub font-mono -mt-1">{new Date(r.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              
                              {/* Display rating comment (pesan ulasan) clearly */}
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono text-text-sub uppercase tracking-wider block">Komentar Siswa:</span>
                                {r.review_text ? (
                                  <blockquote className="text-xs italic text-text-main bg-card py-2.5 px-3 border-l-2 border-lime rounded-r-lg max-h-24 overflow-y-auto leading-relaxed font-sans">
                                    "{r.review_text}"
                                  </blockquote>
                                ) : (
                                  <p className="text-xs italic text-text-sub/70 bg-card/40 py-2 px-3 border-l-2 border-border border-dashed rounded-r-lg">
                                    Siswa memberikan rating bintang tanpa menyertakan ulasan tertulis.
                                  </p>
                                )}
                              </div>

                              {/* Bi-directional Shortcut to associated Session */}
                              {reviewSession && (
                                <div className="bg-bg-3/80 border border-border/40 p-2.5 rounded-lg space-y-1.5 text-[11px] animate-pgIn">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-text-sub font-mono uppercase tracking-wider text-[9px]">Terkait Sesi Pertemuan:</span>
                                    <button 
                                      onClick={() => setModalSubTab("sessions")}
                                      className="text-lime hover:underline font-mono font-bold text-[9px] uppercase tracking-wider"
                                    >
                                      Buka Sesi &rsaquo;
                                    </button>
                                  </div>
                                  <div className="flex justify-between items-center text-text-main font-semibold">
                                    <span>{reviewSession.subject}</span>
                                    <span className="text-text-sub font-mono font-normal text-[10px]">
                                      {new Date(reviewSession.session_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })} &bull; {reviewSession.start_time.substring(0, 5)} WIB
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>, document.body
      )}
    </>
  );
}
