import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Users, BookOpen, Search, ShieldCheck, Eye, ShieldAlert, X, AlertOctagon, CreditCard, Calendar, Star, LayoutGrid, List, Plus, Edit3, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { PlatformPaymentSettings } from "../../components/PlatformPaymentSettings";

export function AdminPanel({ activeSubTab }: { activeSubTab: "tutors" | "students" | "transactions" | "sessions" | "packages" | "reviews" }) {
  const [tutors, setTutors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [studentPackages, setStudentPackages] = useState<any[]>([]);
  const [adminPackageTab, setAdminPackageTab] = useState<"catalog" | "active_purchases">("catalog");
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingTrxId, setUploadingTrxId] = useState<string | null>(null);

  const handleAdminUploadReceipt = async (trx: any, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingTrxId(trx.id);
    try {
      const studentName = (trx.profiles?.full_name || 'Student').toString().trim().replace(/[^a-zA-Z0-9]/g, '_');
      const now = new Date();
      const formatDigit = (num: number) => String(num).padStart(2, '0');
      const dateStr = `${now.getFullYear()}-${formatDigit(now.getMonth() + 1)}-${formatDigit(now.getDate())}_${formatDigit(now.getHours())}-${formatDigit(now.getMinutes())}-${formatDigit(now.getSeconds())}`;
      const fileExt = file.name.split('.').pop() || 'png';
      const cleanFileName = `bukti_admin_${studentName}_${dateStr}_trx_${trx.id.substring(0, 8)}.${fileExt}`;
      
      // Try upload to 'receipts'
      let { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(cleanFileName, file);

      let publicUrl = '';
      if (uploadError) {
         console.warn('Failed upload receipts bucket, trying avatars fallback:', uploadError);
         // Try avatars fallback
         const { error: fallbackError } = await supabase.storage
           .from('avatars')
           .upload(cleanFileName, file);
         
         if (fallbackError) throw new Error("Gagal mengunggah gambar bukti ke server: " + fallbackError.message);
         publicUrl = supabase.storage.from('avatars').getPublicUrl(cleanFileName).data.publicUrl;
      } else {
         publicUrl = supabase.storage.from('receipts').getPublicUrl(cleanFileName).data.publicUrl;
      }

      // Update the transaction table with proof_url and update status to 'pending_verification'
      const { error: dbError } = await supabase
        .from('transactions')
        .update({
           status: 'pending_verification',
           proof_url: publicUrl
        })
        .eq('id', trx.id);

      if (dbError) throw dbError;

      alert("Bukti pembayaran berhasil diunggah oleh Admin! Status transaksi menjadi 'Menunggu Verifikasi'.");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengunggah bukti: " + err.message);
    } finally {
      setUploadingTrxId(null);
    }
  };

  const handleApprovePayment = async (trx: any) => {
    if (!trx.proof_url) {
      alert("Tidak dapat menyetujui transaksi karena belum ada data bukti pembayaran! Silakan unggah bukti bayar terlebih dahulu.");
      return;
    }
    if (!window.confirm(`Setujui pembayaran dari ${trx.profiles?.full_name || 'Siswa'}?`)) return;
    try {
      // 1. Update transaction status
      const { error: trxError } = await supabase
        .from("transactions")
        .update({ status: "success" })
        .eq("id", trx.id);
      if (trxError) throw trxError;

      // 2. Locate associated session (if session_id exists) and set payment_status to 'paid'
      if (trx.session_id) {
         const { error: sessionError } = await supabase
           .from("sessions")
           .update({ payment_status: "paid" })
           .eq("id", trx.session_id);
         if (sessionError) throw sessionError;
      }

      // 3. Locate associated student_packages (if student_package_id exists) and set status to 'active'
      if (trx.student_package_id) {
         const { error: spError } = await supabase
           .from("student_packages")
           .update({ status: "active" })
           .eq("id", trx.student_package_id);
         if (spError) throw spError;
      }

      // 4. Send notification back to student
      await supabase.from("notifications").insert({
         user_id: trx.user_id,
         title: "Pembayaran Diverifikasi & Disetujui!",
         message: `Pembayaran Anda untuk ${trx.transaction_type === "bundle_purchase" ? "Paket Belajar" : "Booking Sesi"} sebesar Rp ${trx.amount?.toLocaleString('id-ID')} telah diverifikasi & disetujui.`,
         link: "sessions"
      });

      alert("Pembayaran berhasil disetujui!");
      fetchData();
    } catch (err: any) {
       console.error(err);
       alert("Error: " + err.message);
    }
  };

  const handleRejectPayment = async (trx: any) => {
    const reason = window.prompt("Alasan penolakan pembayaran:");
    if (reason === null) return;
    try {
      const { error: trxError } = await supabase
        .from("transactions")
        .update({ 
           status: "failed",
           rejection_reason: reason || "Bukti transfer tidak valid atau kurang tepat"
        })
        .eq("id", trx.id);
      if (trxError) throw trxError;

      // Notify student
      await supabase.from("notifications").insert({
         user_id: trx.user_id,
         title: "Pembayaran Pembelian Ditolak",
         message: `Pembayaran Anda untuk ${trx.transaction_type === "bundle_purchase" ? "Paket Belajar" : "Booking Sesi"} ditolak oleh admin dengan alasan: "${reason || 'Bukti transfer tidak valid'}". Silakan berikan bukti transfer yang valid.`,
         link: "sessions"
      });

      alert("Pembayaran ditolak!");
      fetchData();
    } catch (err: any) {
       console.error(err);
       alert("Error: " + err.message);
    }
  };
  const [viewMode, setViewMode] = useState<"list" | "gallery">("gallery");
  const [selectedGalleryTutor, setSelectedGalleryTutor] = useState<any | null>(null);
  const [modalSubTab, setModalSubTab] = useState<"sessions" | "reviews">("sessions");

  // Package Management states
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgSessionCount, setPkgSessionCount] = useState(4);
  const [pkgPricingType, setPkgPricingType] = useState<"percentage" | "fixed">("percentage");
  const [pkgPriceValue, setPkgPriceValue] = useState<number>(5);
  const [pkgDescription, setPkgDescription] = useState("");

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
        const { data: trxData, error: trxError } = await supabase
          .from("transactions")
          .select("*, sessions(id, status, subject, session_date)")
          .order("created_at", { ascending: false });
        
        if (trxError) throw trxError;
        
        if (trxData) {
          const { data: profilesData, error: profsError } = await supabase
            .from("profiles")
            .select("id, full_name, phone");
          
          let stitched = trxData;
          if (!profsError && profilesData) {
            stitched = trxData.map((trx: any) => {
              const matchedProfile = profilesData.find((p: any) => p.id === trx.user_id);
              return {
                ...trx,
                profiles: matchedProfile || null
              };
            });
          }

          // Dynamically link 0-rupiah transaction proofs to their parent bundle purchase
          stitched = stitched.map((trx: any) => {
            if (trx.amount === 0) {
              // Find matching parent transaction
              let parentTrx = null;
              if (trx.student_package_id) {
                parentTrx = stitched.find(t => t.student_package_id === trx.student_package_id && t.amount > 0 && t.proof_url);
              }
              if (!parentTrx) {
                parentTrx = stitched.find(t => t.user_id === trx.user_id && t.transaction_type === "bundle_purchase" && t.proof_url);
              }
              if (parentTrx) {
                return {
                  ...trx,
                  proof_url: parentTrx.proof_url
                };
              }
            }
            return trx;
          });

          // Filter out transactions where the associated session is 'pending'
          const visibleTrx = stitched.filter((trx: any) => {
            const assocSession = Array.isArray(trx.sessions) ? trx.sessions[0] : trx.sessions;
            if (assocSession && assocSession.status === 'pending') {
              return false;
            }
            return true;
          });

          setTransactions(visibleTrx);
        }
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
        const [packagesRes, studentPackagesRes, studentProfilesRes, tutorProfilesRes] = await Promise.all([
          supabase.from("packages").select("*").order("price", { ascending: true }),
          supabase.from("student_packages").select("*"),
          supabase.from("student_profiles").select("*, profiles(*)"),
          supabase.from("tutor_profiles").select("*, profiles(*)")
        ]);

        if (!packagesRes.error && packagesRes.data) {
          setPackages(packagesRes.data);
        }

        if (!studentPackagesRes.error && studentPackagesRes.data) {
          const stdPkgsRaw = studentPackagesRes.data;
          const stdProfs = studentProfilesRes.data || [];
          const tutProfs = tutorProfilesRes.data || [];
          const pkgsCatalog = packagesRes.data || [];

          // Stitch relational details manually on the client-side to be 100% immune to Supabase 400 JOIN limit errors
          const stitched = stdPkgsRaw.map((sp: any) => {
            const studentInfo = stdProfs.find((s: any) => s.id === sp.student_id);
            const tutorInfo = tutProfs.find((t: any) => t.id === sp.tutor_id);
            const packageInfo = pkgsCatalog.find((p: any) => p.id === sp.package_id);

            return {
              ...sp,
              student: studentInfo ? { profiles: studentInfo.profiles } : null,
              tutor: tutorInfo ? { profiles: tutorInfo.profiles } : null,
              packages: packageInfo || (sp.package_id ? { name: "Paket Belajar (ID: " + sp.package_id.substring(0,6) + ")" } : null)
            };
          });

          setStudentPackages(stitched);
        }
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

  const initializeDefaultPackages = async () => {
    setIsProcessing(true);
    try {
      const defaultPkgs = [
        { name: 'Sesi Satuan', session_count: 1, price: 0, description: 'Booking satu sesi dulu, cocok untuk percobaan. Harga adaptif menyesuaikan tarif tutor.' },
        { name: 'Paket 4 Pertemuan', session_count: 4, price: 5, description: '4 sesi, cocok untuk persiapan ulangan. Diskon 5% dari tarif normal tutor.' },
        { name: 'Paket 8 Pertemuan', session_count: 8, price: 10, description: 'Paket terlaris — belajar rutin, hasil lebih optimal. Diskon 10% dari tarif normal tutor.' },
        { name: 'Paket 12 Pertemuan', session_count: 12, price: 12, description: 'Untuk persiapan UTBK atau kursus intensif. Diskon 12% dari tarif normal tutor.' }
      ];
      const { error } = await supabase.from("packages").insert(defaultPkgs);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      console.error("Failed to initialize default packages:", err);
      
      // Detailed user guidance in case of Supabase 403 / RLS policy issues
      alert(
        "Gagal melakukan inisialisasi paket default!\n\n" +
        "Penyebab Umum: RLS (Row Level Security) aktif di Supabase tetapi policy INSERT belum diizinkan.\n\n" +
        "Langkah Mengatasinya dalam 30 detik:\n" +
        "1. Buka Supabase Dashboard proyek Anda.\n" +
        "2. Masuk ke menu 'Table Editor' -> pilih tabel 'packages'.\n" +
        "3. Klik tombol 'RLS' atau 'Add RLS Policy' di tabel packages.\n" +
        "4. Tambahkan Policy: Izinkan ALL atau INSERT / SELECT untuk pengguna terautentikasi (authenticated).\n" +
        "Atau beralih ke 'Database' -> 'Tables' -> nonaktifkan 'Row Level Security (RLS)' untuk tabel 'packages' sementara jika ingin praktis.\n\n" +
        "Pesan Error Teknis: " + (err.message || JSON.stringify(err))
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const openPackageModal = (pkg: any | null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPkgName(pkg.name);
      setPkgSessionCount(pkg.session_count);
      if (pkg.price <= 100) {
        setPkgPricingType("percentage");
        setPkgPriceValue(pkg.price);
      } else {
        setPkgPricingType("fixed");
        setPkgPriceValue(pkg.price);
      }
      setPkgDescription(pkg.description || "");
    } else {
      setEditingPackage(null);
      setPkgName("");
      setPkgSessionCount(4);
      setPkgPricingType("percentage");
      setPkgPriceValue(5);
      setPkgDescription("");
    }
    setIsPackageModalOpen(true);
  };

  const closePackageModal = () => {
    setIsPackageModalOpen(false);
    setEditingPackage(null);
  };

  const savePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) {
      alert("Nama paket wajib diisi!");
      return;
    }
    if (pkgSessionCount <= 0) {
      alert("Jumlah sesi harus lebih besar dari 0!");
      return;
    }
    if (pkgPriceValue < 0) {
      alert("Harga atau diskon tidak boleh negatif!");
      return;
    }
    if (pkgPricingType === "percentage" && pkgPriceValue > 100) {
      alert("Diskon persentase tidak boleh melebihi 100%!");
      return;
    }

    try {
      setIsProcessing(true);
      const pkgData = {
        name: pkgName,
        session_count: pkgSessionCount,
        price: pkgPriceValue,
        description: pkgDescription,
      };

      if (editingPackage) {
        // Update existing pack
        const { error } = await supabase
          .from("packages")
          .update(pkgData)
          .eq("id", editingPackage.id);
        
        if (error) throw error;
      } else {
        // Insert new pack
        const { error } = await supabase
          .from("packages")
          .insert([pkgData]);
          
        if (error) throw error;
      }

      // Close modal and refresh data
      closePackageModal();
      
      // Refresh package data
      const packagesFetched = await supabase.from("packages").select("*").order("price", { ascending: true });
      if (!packagesFetched.error && packagesFetched.data) {
        setPackages(packagesFetched.data);
      }
    } catch (err: any) {
      console.error("Failed to save package:", err);
      alert("Gagal menyimpan paket!\nPesan Error: " + (err.message || JSON.stringify(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const deletePackage = async (pkgId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus paket/skema diskon ini?")) {
      return;
    }

    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from("packages")
        .delete()
        .eq("id", pkgId);

      if (error) {
        throw error;
      }

      // Refresh list
      const packagesFetched = await supabase.from("packages").select("*").order("price", { ascending: true });
      if (!packagesFetched.error && packagesFetched.data) {
        setPackages(packagesFetched.data);
      }
    } catch (err: any) {
      console.error("Failed to delete package:", err);
      alert(
        "Gagal menghapus paket!\n" +
        "Penyebab Umum: Paket ini sedang digunakan oleh student pada pendaftaran aktif (ada relasi di tabel student_packages).\n\n" +
        "Pesan Error Teknis: " + (err.message || JSON.stringify(err))
      );
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
        <div className="space-y-6">
          <PlatformPaymentSettings />
          
          <div className="space-y-3">
            {transactions.map((trx) => (
              <div key={trx.id} className="bg-card p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                   <p className="text-xs text-text-sub mb-1">{new Date(trx.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                   <h3 className="font-semibold text-text-main text-base">
                      Rp {trx.amount?.toLocaleString('id-ID')}
                   </h3>
                   <p className="text-sm text-text-main capitalize mt-1 font-medium text-lime">
                     {trx.transaction_type && trx.transaction_type.replace(/_/g, " ")} &bull; <span className="text-text-main font-bold">{trx.profiles?.full_name || "Unknown User"}</span>
                   </p>
                   
                   {trx.amount === 0 ? (
                     <div className="mt-3 flex flex-col items-start gap-1.5 bg-cyan-500/5 p-2 rounded-lg border border-cyan-500/10 mb-2">
                       <span className="text-[10px] text-text-sub font-mono uppercase font-bold">Bukti Pembelian Paket (Hub):</span>
                       {trx.proof_url ? (
                         <div className="flex flex-wrap gap-2 items-center">
                           <a 
                             href={trx.proof_url} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="inline-flex items-center gap-1 text-xs text-lime bg-lime-dim/20 px-3 py-1.5 rounded-lg border border-lime/30 font-semibold hover:bg-lime-dim/30 transition-colors"
                           >
                             👁 Lihat Bukti Transfer Paket ↗
                           </a>
                           <span className="text-[9px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider inline-block font-sans">
                             🔗 Auto Terhubung
                           </span>
                         </div>
                       ) : (
                         <span className="text-[11px] text-text-light italic">
                           Otomatis terhubung dengan bukti bayar dari transaksi pembelian paket terkait.
                         </span>
                       )}
                     </div>
                   ) : !trx.proof_url ? (
                      <div className="mt-3 flex flex-col items-start gap-1.5">
                        <span className="text-[10px] text-text-sub font-mono uppercase font-bold">Unggah Bukti (CS / Admin):</span>
                        <div className="relative">
                          {uploadingTrxId === trx.id ? (
                            <span className="text-xs text-lime font-mono animate-pulse">Mengunggah file...</span>
                          ) : (
                            <label className="inline-flex items-center gap-1.5 text-xs text-lime bg-lime/10 border border-lime/30 px-3 py-1.5 rounded-lg hover:bg-lime/20 cursor-pointer transition-colors font-semibold">
                              <span>📂 Pilih Bukti Pembayaran</span>
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleAdminUploadReceipt(trx, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                   ) : (
                      <div className="mt-3 flex flex-col items-start gap-1.5">
                        <span className="text-[10px] text-text-sub font-mono uppercase font-bold">Bukti Pembayaran:</span>
                        <div className="flex flex-wrap gap-2 items-center">
                          <a 
                            href={trx.proof_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-xs text-lime bg-lime-dim/20 px-3 py-1.5 rounded-lg border border-lime/30 font-semibold hover:bg-lime-dim/30 transition-colors"
                          >
                            👁 Lihat Bukti Transfer ↗
                          </a>
                          
                          {uploadingTrxId === trx.id ? (
                            <span className="text-xs text-lime font-mono animate-pulse ml-2">Mengunggah file...</span>
                          ) : (
                            <label className="text-[10px] text-text-sub bg-bg-3 hover:text-text-main border border-border px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors font-mono">
                              Update Bukti
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleAdminUploadReceipt(trx, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                   )}
                   
                   {trx.rejection_reason && trx.status === 'failed' && (
                      <p className="text-xs text-red-400 bg-red-400/5 p-2 rounded border border-red-500/15 mt-2 font-mono">
                        Alasan Tolak: "{trx.rejection_reason}"
                      </p>
                   )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                   <span className={`px-2.5 py-1.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider text-center ${
                     trx.status === 'success' ? 'bg-success/10 text-success border border-success/30' :
                     trx.status === 'pending_verification' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                     trx.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 
                     'bg-warning/10 text-warning border border-warning/30'
                   }`}>
                      {trx.status === 'pending_verification' ? 'Menunggu Verifikasi' : trx.status === 'success' ? 'Lunas' : trx.status === 'failed' ? 'Ditolak' : 'Belum Bayar'}
                   </span>
                   
                   {(trx.status === 'pending' || trx.status === 'pending_verification' || trx.status === 'failed') && (
                     <div className="flex gap-1.5">
                       <button
                         onClick={() => {
                           if (!trx.proof_url) {
                             alert("Tombol setuju baru berfungsi setelah ada data bukti bayar! Silakan unggah bukti bayar terlebih dahulu.");
                             return;
                           }
                           handleApprovePayment(trx);
                         }}
                         disabled={!trx.proof_url}
                         title={!trx.proof_url ? "Harus ada bukti bayar untuk menyetujui" : "Setujui Pembayaran"}
                         className={`font-bold text-xs px-3 py-1.5 rounded-lg transition-all text-center flex-1 ${
                           trx.proof_url 
                             ? "bg-lime text-black hover:opacity-90 active:scale-95 cursor-pointer" 
                             : "bg-gray-600/35 text-gray-500 cursor-not-allowed opacity-55 border border-gray-600/20"
                         }`}
                       >
                         Setujui
                       </button>
                       <button
                         onClick={() => handleRejectPayment(trx)}
                         className="bg-red-500/20 text-red-400 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-500/30 active:scale-95 transition-all text-center border border-red-500/30 flex-1"
                       >
                         Tolak
                       </button>
                     </div>
                   )}
                </div>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-sm text-text-sub text-center py-10">Belum ada transaksi.</p>}
          </div>
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
                  <div className="mt-3.5 pt-3 border-t border-border/40 text-xs text-text-main w-full">
                     {session.meeting_type === "offline" ? (
                        <div className="bg-bg-2 p-2.5 rounded-lg border border-border/40">
                           <span className="font-bold text-[10px] text-text-sub uppercase font-mono tracking-wider block mb-1">📍 Alamat Pertemuan Offline (Tatap Muka):</span>
                           <div className="text-text-main font-sans break-words whitespace-pre-line text-xs font-semibold leading-relaxed">
                              {session.location ? (
                                 (() => {
                                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                                    const words = session.location.split(urlRegex);
                                    return words.map((word: string, i: number) => {
                                       if (word.match(urlRegex)) {
                                          return (
                                             <a key={i} href={word} target="_blank" rel="noopener noreferrer" className="text-lime font-bold hover:underline underline-offset-2 break-all bg-lime/15 px-1.5 py-0.5 rounded border border-lime/35 inline-flex items-center gap-0.5 ml-1 font-sans">
                                                Buka Google Maps ↗
                                             </a>
                                          );
                                       }
                                       return word;
                                    });
                                 })()
                              ) : (
                                 <span className="text-text-sub italic">Belum diisikan oleh siswa</span>
                              )}
                           </div>
                        </div>
                     ) : (
                        <div className="bg-bg-2 p-2.5 rounded-lg border border-border/40">
                           <span className="font-bold text-[10px] text-text-sub uppercase font-mono tracking-wider block mb-1">🖥️ Link Sesi Online (GMeet/Zoom):</span>
                           {session.meeting_link ? (
                              <div className="mt-1">
                                 <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-lime font-bold hover:underline underline-offset-2 break-all bg-lime/10 px-2.5 py-1 rounded border border-lime/25 font-sans text-xs">
                                    🔗 Buka Link Kelas ↗
                                 </a>
                                 <p className="text-[10px] text-text-sub mt-1 break-all font-mono select-all">{session.meeting_link}</p>
                              </div>
                           ) : (
                              <span className="text-text-sub italic text-[11px]">Link meeting belum dimasukkan oleh tutor</span>
                           )}
                        </div>
                     )}
                  </div>
                  <div className="hidden">
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
        <div className="space-y-6">
          <div className="flex border-b border-border bg-bg-2 p-1 rounded-xl w-fit">
            <button
              onClick={() => setAdminPackageTab("catalog")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${adminPackageTab === "catalog" ? "bg-lime text-black" : "text-text-sub hover:text-text-main"}`}
            >
              Katalog Model Paket
            </button>
            <button
              onClick={() => setAdminPackageTab("active_purchases")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${adminPackageTab === "active_purchases" ? "bg-lime text-black" : "text-text-sub hover:text-text-main"}`}
            >
              Paket Aktif Siswa ({studentPackages.length})
            </button>
          </div>

          {adminPackageTab === "catalog" ? (
            <div className="space-y-4 animate-pgIn font-sans">
              <div className="bg-lime-dim/20 border border-lime/20 rounded-xl p-4 text-xs text-text-sub flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-bold text-lime">Katalog & Skema Diskon Paket</p>
                  <p className="leading-relaxed">Katalog model paket yang digunakan siswa saat check out. Anda memiliki kontrol penuh untuk menambahkan paket baru atau mengubah skema persentase diskon.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {packages.length === 0 && (
                    <button
                      disabled={isProcessing}
                      onClick={initializeDefaultPackages}
                      className="px-3 py-1.5 bg-zinc-800 text-text-[11px] font-bold rounded-lg border border-border/65 hover:bg-zinc-750 transition-colors disabled:opacity-50"
                    >
                      Inisialisasi Default
                    </button>
                  )}
                  <button
                    onClick={() => openPackageModal(null)}
                    className="px-4 py-2 bg-lime hover:bg-lime-hover text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-lime/10"
                  >
                    <Plus size={14} /> Tambah Paket / Promo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {packages.map((pkg) => {
                  const isAdaptive = pkg.price <= 100;
                  const discountPercent = isAdaptive ? pkg.price : 0;
                  return (
                    <div key={pkg.id} className="bg-card p-4 rounded-xl border border-border flex flex-col justify-between hover:border-lime/30 transition-all relative group shadow-sm">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold text-text-main text-sm uppercase tracking-wider">
                            {pkg.name}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 bg-lime-dim text-lime text-[9px] font-bold rounded uppercase font-mono">
                              {pkg.session_count} Sesi
                            </span>
                            <button
                              onClick={() => openPackageModal(pkg)}
                              className="p-1 hover:text-lime text-text-sub transition-colors rounded hover:bg-zinc-800"
                              title="Edit Paket"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => deletePackage(pkg.id)}
                              className="p-1 hover:text-red-500 text-text-sub transition-colors rounded hover:bg-zinc-800"
                              title="Hapus Paket"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-text-sub mt-2 line-clamp-2">
                          {pkg.description || "Daftar Paket Belajar Privat TutorKu."}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/40 flex flex-col gap-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[11px] text-text-light font-mono">Skema Diskon:</span>
                          <span className="text-xs font-bold font-mono text-lime">
                            {isAdaptive 
                              ? (discountPercent === 0 ? "Normal (0% Off)" : `Hemat ${discountPercent}%`)
                              : `Promo Tetap (Rp ${pkg.price.toLocaleString()})`
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[11px] text-text-light font-mono">Formula Adaptif:</span>
                          <span className="text-xs font-bold font-mono text-text-main">
                            {isAdaptive 
                              ? (discountPercent === 0 ? "Normal / Rate Tutor × 1" : `Rate Tutor × ${pkg.session_count} × ${(1 - discountPercent / 100).toFixed(2)}`)
                              : "Harga Statik / Overruled"
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {packages.length === 0 && (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <p className="text-sm font-semibold text-text-main">Katalog Model Paket Masih Kosong</p>
                  <p className="text-xs text-text-sub mt-1 max-w-md mx-auto">
                    Anda bisa inisialisasi default atau klik tombol "+ Tambah Paket / Promo" di atas untuk menambahkan skema manual.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-pgIn">
              <div className="bg-lime-dim/20 border border-lime/20 rounded-xl p-4 text-xs text-text-sub">
                <p className="font-bold text-lime mb-0.5">Monitoring Pembelian Paket Siswa</p>
                <p className="leading-relaxed">Platform akan mencatat seluruh kuota paket siswa di sini. Kuota didecrement Rp 0 setiap kali siswa menjadwalkan pertemuan privat dengan tutor bersangkutan.</p>
              </div>

              <div className="space-y-3">
                {studentPackages.map((sPkg) => {
                  const studentName = sPkg.student?.profiles?.full_name || "Siswa";
                  const studentEmail = sPkg.student?.profiles?.email || "-";
                  const tutorName = sPkg.tutor?.profiles?.full_name || "Tutor";
                  const pkgName = sPkg.packages?.name || "Paket Belajar";
                  const expiryStr = sPkg.valid_until 
                    ? new Date(sPkg.valid_until).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
                    : "Selamanya";
                  const isExhausted = sPkg.remaining_sessions <= 0;

                  return (
                    <div key={sPkg.id} className="bg-card p-4 rounded-xl border border-border flex flex-col sm:flex-row gap-4 justify-between sm:items-center hover:border-lime/30 transition-all animate-pgIn">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold text-lime uppercase font-mono tracking-wider">{pkgName}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold rounded uppercase ${isExhausted ? "bg-red-500/10 text-red-500" : "bg-success/10 text-success"}`}>
                            {isExhausted ? "Habis" : sPkg.status?.toUpperCase() || "AKTIF"}
                          </span>
                        </div>
                        <h4 className="font-semibold text-text-main text-sm">
                          {studentName} &rarr; {tutorName}
                        </h4>
                        <p className="text-[11px] text-text-sub">
                          Siswa Email: {studentEmail} &bull; Berlaku s/d: {expiryStr}
                        </p>
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-1.5 self-start sm:self-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50 w-full sm:w-auto">
                        <span className="text-xs text-text-sub font-mono">Sisa Kuota:</span>
                        <span className={`text-base font-bold font-mono ${isExhausted ? 'text-text-light/50 line-through' : 'text-lime'}`}>
                          {sPkg.remaining_sessions} dari {sPkg.packages?.session_count || "/"} Sesi
                        </span>
                      </div>
                    </div>
                  );
                })}

                {studentPackages.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <p className="text-sm font-semibold text-text-main">Belum Ada Sesi Paket Aktif</p>
                    <p className="text-xs text-text-sub mt-1">
                      Platform belum merekam pembelian paket belajar aktif dari siswa ke tutor mana pun.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
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
                                <div>Tipe Sesi:</div>
                                <div className="text-text-main text-right font-bold capitalize">{session.meeting_type || "Online"}</div>
                                {session.meeting_type === 'offline' ? (
                                  <>
                                    <div className="col-span-2 font-semibold text-text-sub uppercase tracking-wider text-[10px] pt-1.5 border-t border-border/30 mt-1">📍 Alamat Pertemuan Offline:</div>
                                    <div className="col-span-2 text-text-main leading-relaxed font-sans mt-0.5 break-words normal-case font-medium">
                                      {session.location ? (
                                        (() => {
                                          const urlRegex = /(https?:\/\/[^\s]+)/g;
                                          const words = session.location.split(urlRegex);
                                          return words.map((word: string, i: number) => {
                                            if (word.match(urlRegex)) {
                                              return (
                                                <a key={i} href={word} target="_blank" rel="noopener noreferrer" className="text-lime font-bold hover:underline underline-offset-2 break-all bg-lime/10 px-1 py-0.5 rounded border border-lime/15 inline-flex items-center gap-0.5">
                                                  Buka Google Maps ↗
                                                </a>
                                              );
                                            }
                                            return word;
                                          });
                                        })()
                                      ) : (
                                        <span className="text-text-sub italic text-[11px]">Belum diisikan oleh siswa</span>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="col-span-2 font-semibold text-text-sub uppercase tracking-wider text-[10px] pt-1.5 border-t border-border/30 mt-1">🖥️ Link Sesi Online Class:</div>
                                    <div className="col-span-2 text-text-main leading-snug font-sans mt-0.5 break-all normal-case font-medium">
                                      {session.meeting_link ? (
                                        <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="text-lime font-bold hover:underline underline-offset-2 break-all inline-block bg-lime/10 px-2 py-0.5 rounded border border-lime/15 text-[11px]">
                                          {session.meeting_link} ↗
                                        </a>
                                      ) : (
                                        <span className="text-text-sub italic text-[11px]">Link meeting belum diunggah oleh tutor</span>
                                      )}
                                    </div>
                                  </>
                                )}
                                <div className="hidden">
                                  <div className="text-right text-lime font-bold uppercase">{session.payment_status || "UNPAID"}</div>
                                </div>
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

      {isPackageModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closePackageModal}
          />
          
          {/* Content container */}
          <div className="bg-card border border-border rounded-xl w-full max-w-sm overflow-hidden relative z-10 shadow-2xl animate-pgIn">
            <div className="flex justify-between items-center p-4 border-b border-border/60">
              <h2 className="font-display font-bold text-base text-text-main">
                {editingPackage ? "Edit Paket / Skema Diskon" : "Tambah Paket / Promo Baru"}
              </h2>
              <button 
                onClick={closePackageModal}
                className="p-1 rounded-lg hover:bg-bg-2 text-text-sub hover:text-text-main transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={savePackage} className="p-4 space-y-4 text-xs">
              {/* Nama Paket */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-text-sub uppercase tracking-wider block">
                  Nama Paket / Promo
                </label>
                <input
                  type="text"
                  required
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  placeholder="e.g., Paket Belajar Hemat 8 Sesi"
                  className="w-full bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-main placeholder:text-text-light/40 focus:outline-none focus:border-lime/50 transition-colors"
                />
              </div>

              {/* Jumlah Sesi */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-text-sub uppercase tracking-wider block">
                  Jumlah Sesi (Pertemuan)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={pkgSessionCount}
                  onChange={(e) => setPkgSessionCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-main font-mono focus:outline-none focus:border-lime/50 transition-colors"
                />
              </div>

              {/* Tipe Harga / Skema Diskon */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-text-sub uppercase tracking-wider block">
                  Tipe Penentuan Harga
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-bg-2 p-1 rounded-lg border border-border/60">
                  <button
                    type="button"
                    onClick={() => {
                      setPkgPricingType("percentage");
                      setPkgPriceValue(5); 
                    }}
                    className={`px-2.5 py-1.5 text-[10px] font-bold rounded transition-all ${pkgPricingType === "percentage" ? "bg-lime text-black" : "text-text-sub hover:text-text-main"}`}
                  >
                    Diskon Adaptif (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPkgPricingType("fixed");
                      setPkgPriceValue(200000); 
                    }}
                    className={`px-2.5 py-1.5 text-[10px] font-bold rounded transition-all ${pkgPricingType === "fixed" ? "bg-lime text-black" : "text-text-sub hover:text-text-main"}`}
                  >
                    Harga Tetap (Rp)
                  </button>
                </div>
              </div>

              {/* Nilai Harga / Diskon */}
              <div className="space-y-1 bg-bg-2/40 p-3 rounded-lg border border-border/40">
                {pkgPricingType === "percentage" ? (
                  <>
                    <label className="text-[10px] font-mono font-bold text-text-sub uppercase tracking-wider block">
                      Diskon Persentase (%)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        value={pkgPriceValue}
                        onChange={(e) => setPkgPriceValue(parseInt(e.target.value) || 0)}
                        className="w-full bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-main font-mono focus:outline-none focus:border-lime/50 transition-colors"
                      />
                      <span className="text-[11px] font-bold text-lime font-mono shrink-0">% OFF</span>
                    </div>
                    <p className="text-[10px] text-text-light font-sans mt-1 leading-relaxed">
                      Sifatnya <strong>Adaptif</strong> terhadap tarif dari tutor mana pun yang dipilih siswa. <br />
                      Membayar: <code>Sesi × Rate Tutor × {(1 - (pkgPriceValue || 0) / 100).toFixed(2)}</code>
                    </p>
                  </>
                ) : (
                  <>
                    <label className="text-[10px] font-mono font-bold text-text-sub uppercase tracking-wider block">
                      Harga Penjualan Total (Rp Rupiah)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-text-light font-mono shrink-0">Rp</span>
                      <input
                        type="number"
                        required
                        min="101"
                        value={pkgPriceValue}
                        onChange={(e) => setPkgPriceValue(parseInt(e.target.value) || 0)}
                        className="w-full bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-main font-mono focus:outline-none focus:border-lime/50 transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-text-light font-sans mt-1 leading-relaxed">
                      Sifatnya <strong>Statik / Tetap</strong>. Siswa membayar nominal pas ini, menimpa tarif per sesi tutor. <br />
                      Membayar: <code>Rp {(pkgPriceValue || 0).toLocaleString()}</code> (Nilai harus &gt; 100)
                    </p>
                  </>
                )}
              </div>

              {/* Deskripsi */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-text-sub uppercase tracking-wider block">
                  Keterangan Deskripsi
                </label>
                <textarea
                  value={pkgDescription}
                  onChange={(e) => setPkgDescription(e.target.value)}
                  placeholder="e.g., Paket ekonomis untuk persiapan UTBK"
                  rows={2}
                  className="w-full bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-main placeholder:text-text-light/40 focus:outline-none focus:border-lime/50 transition-colors resize-none"
                />
              </div>

              {/* Submit / actions */}
              <div className="flex justify-end gap-1.5 pt-1.5">
                <button
                  type="button"
                  onClick={closePackageModal}
                  disabled={isProcessing}
                  className="px-3.5 py-1.5 bg-zinc-800 text-text-sub border border-border/80 text-[10px] font-bold rounded-lg hover:text-text-main hover:bg-zinc-750 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-lime text-black text-[10px] font-bold rounded-lg hover:bg-lime-hover transition-colors"
                >
                  {isProcessing ? "Menyimpan..." : (editingPackage ? "Simpan Perubahan" : "Tambah Paket")}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}
    </>
  );
}
