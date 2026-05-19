import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Users, BookOpen, Search, ShieldCheck, Eye, ShieldAlert, X, AlertOctagon, CreditCard, Calendar } from "lucide-react";
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
      } else if (activeSubTab === "sessions") {
        const { data, error } = await supabase
          .from("sessions")
          .select(`
            *,
            student:student_profiles(profiles(full_name)),
            tutor:tutor_profiles(profiles(full_name))
          `)
          .order("created_at", { ascending: false });
        if (!error && data) setSessions(data);
      } else if (activeSubTab === "packages") {
        const { data, error } = await supabase
          .from("packages")
          .select("*")
          .order("price", { ascending: true });
        if (!error && data) setPackages(data);
      } else if (activeSubTab === "reviews") {
        const { data, error } = await supabase
          .from("reviews")
          .select(`
            *,
            student:student_profiles(profiles(full_name)),
            tutor:tutor_profiles(profiles(full_name))
          `)
          .order("created_at", { ascending: false });
        if (!error && data) setReviews(data);
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
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold text-[32px] tracking-tight">{getRoleTitle()}</h1>
        <p className="text-text-sub font-mono text-sm">Kelola data platform TutorKu.</p>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-lime/30 border-t-lime animate-spin"></div>
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
                  <p className="text-xs text-text-sub">{tutor.email}</p>
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
                  <p className="text-xs text-text-sub">{student.email}</p>
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
            <div key={session.id} className="bg-card p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                 <p className="text-xs text-text-sub mb-1">{new Date(session.session_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })} &bull; {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}</p>
                 <h3 className="font-semibold text-text-main">
                    {session.subject}
                 </h3>
                 <div className="text-sm text-text-sub mt-1 flex flex-col sm:flex-row gap-1 sm:gap-4">
                    <span><strong className="text-text-main font-semibold">Tutor:</strong> {session.tutor?.profiles?.full_name || "-"}</span>
                    <span><strong className="text-text-main font-semibold">Student:</strong> {session.student?.profiles?.full_name || "-"}</span>
                 </div>
              </div>
              <div className="flex gap-2 flex-col items-end">
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
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                       {r.tutor?.profiles?.full_name} <span className="text-text-sub font-normal text-xs">dinilai oleh</span> {r.student?.profiles?.full_name}
                    </h3>
                    <p className="text-xs text-text-sub mt-0.5">{new Date(r.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                 </div>
                 <div className="flex items-center gap-1 bg-warning/10 text-warning px-2 py-1 rounded">
                    <span className="text-sm font-bold font-mono">{r.rating}</span>
                    <span className="text-xs">/ 5</span>
                 </div>
              </div>
              {r.review_text && (
                 <p className="text-sm text-text-sub bg-bg-2 p-3 rounded-lg flex-1">
                    "{r.review_text}"
                 </p>
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
                          {selectedUser.tutor_details.gender || "-"} • {selectedUser.tutor_details.learning_styles?.join(", ") || "All"}
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
    </>
  );
}
