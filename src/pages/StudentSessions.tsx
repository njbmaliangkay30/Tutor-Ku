import { Calendar, Video, FileText, Star, Clock, AlertOctagon, Upload, Copy, Check, Info, CreditCard, X, ChevronRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';
import { getAvatarColor } from '../data';

export function StudentSessions() {
  const [type, setType] = useState<'upcoming' | 'past' | 'invoices'>('upcoming');
  const [sessions, setSessions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTrxLoading, setIsTrxLoading] = useState(false);
  const { user, userProfile, tutors, userRole, setActiveTab } = useAppContext();

  // Checkout / Payment detail modal
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'qris'>('bank_transfer');
  const [copiedText, setCopiedText] = useState(false);

  // Review Modal State
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchSessions = async () => {
     if (!userProfile) return;
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from('sessions')
         .select(`
           *,
           tutor_profiles(id, profiles(full_name)),
           reviews (rating)
         `)
         .eq('student_id', userProfile.id)
         .order('session_date', { ascending: false });
         
       if (error) throw error;
       
       const formattedData = data?.map((session: any) => ({
         ...session,
         rating: session.reviews?.[0]?.rating || null
       })) || [];
       
       setSessions(formattedData);
     } catch (e) {
       console.error(e);
     } finally {
       setIsLoading(false);
     }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    setIsTrxLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .in('transaction_type', ['session_booking', 'bundle_purchase'])
        .order('created_at', { ascending: false });
      
      if (!error && data) {
         setTransactions(data);
      }
    } catch(err) {
       console.error(err);
    } finally {
       setIsTrxLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchSessions();
      fetchTransactions();
    }
  }, [userProfile, user]);

  const now = new Date();
  
  const getSessionEndDateTime = (s: any) => {
    if (s.end_time?.includes('T')) return new Date(s.end_time);
    return s.session_date && s.end_time ? new Date(`${s.session_date}T${s.end_time}`) : new Date(0);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString(['id-ID', 'en-US'], { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    return timeStr.substring(0, 5);
  };

  const upcoming = sessions.filter(s => {
    if (s.status === 'pending') return true;
    if (s.status === 'completed' || s.status === 'rejected') return false;
    return getSessionEndDateTime(s) >= now;
  });
  const past = sessions.filter(s => {
    if (s.status === 'completed' || s.status === 'rejected' || s.status === 'waiting_for_student') return true;
    if (s.status === 'pending') return false;
    return getSessionEndDateTime(s) < now;
  });

  const displayList = type === 'upcoming' ? upcoming : past;

  const handleCopyText = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleUploadReceipt = async (transactionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
       const cleanFileName = `receipt_${transactionId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
       
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

       const { error: dbError } = await supabase
         .from('transactions')
         .update({
            status: 'pending_verification',
            proof_url: publicUrl
         })
         .eq('id', transactionId);

       if (dbError) throw dbError;
       
       // Notify admins
       const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
       if (admins && admins.length > 0) {
          for (const admin of admins) {
             await supabase.from('notifications').insert({
                user_id: admin.id,
                title: "Bukti Transfer Masuk",
                message: `Siswa ${userProfile?.full_name || 'Siswa'} telah mengunggah bukti transfer baru. Mohon diperiksa di Panel Admin.`,
                link: "admin-transactions"
             });
          }
       }

       alert('Bukti transfer berhasil diunggah! Pembayaran Anda sekarang sedang dalam tahap verifikasi oleh admin.');
       fetchTransactions();
       setSelectedTrx(null);
    } catch (err: any) {
       console.error(err);
       alert('Kesalahan saat mengunggah: ' + err.message);
    } finally {
       setIsUploading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewModal || !userProfile) return;
    setIsSubmittingReview(true);
    try {
      if (reviewModal.status !== 'completed') {
        const { error: sessionError } = await supabase
          .from('sessions')
          .update({ status: 'completed' })
          .eq('id', reviewModal.id);
        if (sessionError) throw sessionError;
      }

      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          session_id: reviewModal.id,
          student_id: userProfile.id,
          tutor_id: reviewModal.tutor_id,
          rating: reviewRating,
          review_text: reviewText
        });
      if (reviewError) throw reviewError;

      // Update tutor stats incrementally
      try {
        const { data: tutorProfile } = await supabase
          .from('tutor_profiles')
          .select('rating, total_reviews')
          .eq('id', reviewModal.tutor_id)
          .single();

        if (tutorProfile) {
          const newTotal = (tutorProfile.total_reviews || 0) + 1;
          const newRating = (((tutorProfile.rating || 0) * (tutorProfile.total_reviews || 0)) + reviewRating) / newTotal;
          await supabase.from('tutor_profiles').update({
            rating: newRating,
            total_reviews: newTotal
          }).eq('id', reviewModal.tutor_id);
        }
      } catch (e) {
        console.warn("Could not update tutor average rating", e);
      }

      setReviewModal(null);
      setReviewText("");
      setReviewRating(5);
      
      fetchSessions();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Gagal mengirim ulasan.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (userRole === 'guest' || !userProfile) {
    return (
      <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full text-center mt-10">
        <h1 className="text-2xl font-bold font-display text-text-main mb-4">Sesi Belajar</h1>
        <p className="text-sm text-text-sub mb-6">Silakan login untuk melihat dan mengelola sesi belajarmu.</p>
        <button 
          onClick={() => setActiveTab('login')} 
          className="bg-lime text-black font-bold py-3 px-8 rounded-lg hover:bg-lime-dim transition-colors"
        >
          Login Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-text-main">Sesi Belajar</h1>
        <p className="text-sm text-text-sub">Kelola jadwal belajar kamu dengan tutor.</p>
      </div>

      <div className="flex bg-bg-2 border-[1.5px] border-border rounded-lg p-1 mb-6 gap-1">
        <button
          onClick={() => setType('upcoming')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${type === 'upcoming' ? 'bg-lime-mid text-lime' : 'text-text-sub hover:text-text-main'}`}
        >
          Akan Datang ({upcoming.length})
        </button>
        <button
          onClick={() => setType('past')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${type === 'past' ? 'bg-lime-mid text-lime' : 'text-text-sub hover:text-text-main'}`}
        >
          Riwayat ({past.length})
        </button>
        <button
          onClick={() => setType('invoices')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${type === 'invoices' ? 'bg-lime-mid text-lime' : 'text-text-sub hover:text-text-main'}`}
        >
          Tagihan ({transactions.filter(t => t.status === 'pending' || t.status === 'pending_verification').length})
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {type === 'invoices' ? (
          isTrxLoading ? (
            <div className="text-center py-8">Memuat tagihan...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-text-sub border border-dashed border-border rounded-xl">Belum ada tagihan belanja.</div>
          ) : (
            transactions.map((trx) => {
              const itemType = trx.transaction_type === 'bundle_purchase' ? 'Beli Paket Belajar' : 'Booking Sesi Satuan';
              return (
                <div key={trx.id} className="bg-card border-[1.5px] border-border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-lime/20 transition-colors">
                  <div className="space-y-1">
                    <div className="text-xs text-text-sub font-mono">{new Date(trx.created_at).toLocaleDateString()}</div>
                    <h3 className="font-bold text-text-main text-base">{itemType}</h3>
                    <div className="font-mono font-bold text-lime mt-1 text-base">Rp {trx.amount?.toLocaleString('id-ID')}</div>
                    {trx.rejection_reason && trx.status === 'failed' && (
                      <div className="text-xs text-red-400 bg-red-400/5 p-2 rounded border border-red-500/15 mt-2">
                        Alasan Tolak: "{trx.rejection_reason}"
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                    <span className={`px-2.5 py-1.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider text-center ${
                      trx.status === 'success' ? 'bg-success/10 text-success border border-success/30' :
                      trx.status === 'pending_verification' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                      trx.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                      'bg-warning/15 text-warning border border-warning/30'
                    }`}>
                      {trx.status === 'pending_verification' ? 'Menunggu Verifikasi' : trx.status === 'success' ? 'Lunas' : trx.status === 'failed' ? 'Ditolak' : 'Belum Bayar'}
                    </span>
                    {(trx.status === 'pending' || trx.status === 'failed') && (
                      <button
                        onClick={() => setSelectedTrx(trx)}
                        className="bg-lime text-black font-bold text-xs px-4 py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <CreditCard size={14} /> Bayar Sekarang
                      </button>
                    )}
                    {trx.status === 'pending_verification' && (
                      <button
                        onClick={() => setSelectedTrx(trx)}
                        className="bg-bg-2 border border-border text-xs px-4 py-2.5 rounded-lg text-text-main hover:bg-bg-3 transition-colors flex items-center justify-center gap-1"
                      >
                        Detail Invoice
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )
        ) : (
          isLoading ? (
            <div className="text-center py-8">Memuat sesi...</div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-8 text-text-sub border border-dashed border-border rounded-xl">Tidak ada sesi {type === 'upcoming' ? 'akan datang' : 'sebelumnya'}.</div>
          ) : (
            displayList.map(session => {
              let statusText = session.status;
              let statusColor = "bg-bg-3 text-text-sub";
              if (session.status === 'pending') {
                statusText = 'Menunggu Konfirmasi';
                statusColor = "bg-warning/20 text-warning";
              } else if (session.status === 'confirmed') {
                statusText = 'Terkonfirmasi';
                statusColor = "bg-lime-dim text-lime border border-lime/30";
              } else if (session.status === 'completed') {
                statusText = 'Selesai';
                statusColor = "bg-bg-2 border border-border text-text-sub";
              } else if (session.status === 'rejected') {
                statusText = 'Ditolak';
                statusColor = "bg-red-500/10 text-red-400 border border-red-500/20";
              } else if (session.status === 'waiting_for_student') {
                statusText = 'Tunggu Konfirmasi Selesai';
                statusColor = "bg-warning/20 text-warning border border-warning/30";
              } else if (session.status === 'cancelled') {
                statusText = 'Dibatalkan';
                statusColor = "bg-red-500/10 text-red-500 border border-red-500/30";
              }

              return (
                <div key={session.id} className={`bg-card border-[1.5px] border-border rounded-xl p-4 ${session.status === 'pending' ? 'border-warning/30' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold font-display" style={{backgroundColor: getAvatarColor(session.tutor_profiles?.profiles?.full_name || 'Tutor')}}>
                        {(session.tutor_profiles?.profiles?.full_name || 'T').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-text-main font-display">{session.tutor_profiles?.profiles?.full_name || 'Tutor'}</div>
                        <div className="text-xs text-text-sub font-mono">{session.subject}</div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold px-2.5 py-1.5 rounded font-mono uppercase tracking-wider ${statusColor}`}>
                      {statusText}
                    </div>
                  </div>

                  <div className="bg-bg-2 rounded-lg p-3 mb-4 space-y-2 border border-border/50">
                    <div className="flex items-center gap-2 text-sm text-text-main">
                      <Calendar size={16} className="text-text-sub" />
                      <span>{new Date(session.session_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-main">
                      <Clock size={16} className="text-text-sub" />
                      <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                    </div>
                    {session.material_notes && (
                      <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/50">
                        <span className="text-xs text-text-sub font-medium font-mono uppercase tracking-wider">Catatan Materi:</span>
                        <p className="text-sm">{session.material_notes}</p>
                      </div>
                    )}
                  </div>

                  {type === 'upcoming' ? (
                    <div className="flex gap-2 w-full">
                      {session.meeting_type === 'offline' ? (
                        <div className="flex-1 bg-bg-2 border border-border text-center text-text-main font-bold py-2.5 rounded-lg text-[13px] flex items-center justify-center gap-2 px-2">
                          <span className="truncate">📍 Lokasi: {session.location || 'Menunggu Info'}</span>
                        </div>
                      ) : (
                        session.meeting_link ? (
                          <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="flex-1 bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-dim transition-colors flex items-center justify-center gap-2">
                            <Video size={16} /> Buka Link Meeting
                          </a>
                        ) : (
                          <div className="flex-1 bg-bg-2 border border-dashed border-border text-center text-text-sub font-mono font-bold py-2.5 rounded-lg text-[12px] flex items-center justify-center gap-2">
                            Link belum tersedia
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {session.status === 'waiting_for_student' && (
                        <button 
                          onClick={() => setReviewModal(session)}
                          className="flex-1 border-[1.5px] border-lime bg-lime text-black font-bold py-2 rounded-lg text-sm hover:bg-lime-dim transition-colors flex items-center justify-center gap-2"
                        >
                          <Star size={16} /> Tandai Selesai & Beri Ulasan
                        </button>
                      )}
                      {session.status === 'completed' && !session.rating && (
                        <button 
                          onClick={() => setReviewModal(session)}
                          className="flex-1 border-[1.5px] border-lime/50 text-lime font-bold py-2 rounded-lg text-sm hover:bg-lime-mid transition-colors flex items-center justify-center gap-2"
                        >
                          <Star size={16} /> Beri Ulasan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>

      {/* Checkout / Payment Modal */}
      {selectedTrx && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-pgIn" style={{overscrollBehavior: 'none'}}>
          <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b-[1.5px] border-border bg-bg-2">
              <div className="font-display font-bold text-[16px]">
                {selectedTrx.status === 'pending_verification' ? 'Informasi Pembayaran' : 'Selesaikan Pembayaran'}
              </div>
              <button
                onClick={() => setSelectedTrx(null)}
                className="text-text-sub hover:text-text-main"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="bg-bg-2 p-4 rounded-xl border border-border/80">
                <span className="text-[10px] text-text-sub font-mono uppercase">Total Pembayaran</span>
                <div className="text-2xl font-bold text-lime font-display mt-0.5">Rp {selectedTrx.amount?.toLocaleString('id-ID')}</div>
                <div className="text-xs text-text-sub mt-1">Invoice ID: {selectedTrx.id.substring(0, 8).toUpperCase()}</div>
              </div>

              {selectedTrx.status === 'pending_verification' ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto border border-cyan-500/20">
                    <Clock size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-main text-base">Dalam Proses Verifikasi</h3>
                    <p className="text-sm text-text-sub mt-1">
                      Bukti pembayaran Anda sudah diterima oleh sistem. Mohon tunggu maksimal 1x24 jam untuk admin memvalidasi transfer Anda.
                    </p>
                  </div>
                  {selectedTrx.proof_url && (
                    <div className="pt-2">
                      <span className="block text-[10px] text-text-sub font-mono uppercase pb-1.5">Bukti Terunggah:</span>
                      <a href={selectedTrx.proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-bg-3 border border-border text-xs py-2 px-4 rounded-lg hover:bg-bg-2 text-lime font-medium">
                        Lihat Gambar Bukti ↗
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex bg-bg-3 p-1 rounded-lg border border-border gap-1">
                    <button
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${paymentMethod === 'bank_transfer' ? 'bg-lime text-black' : 'text-text-sub'}`}
                    >
                      Transfer Bank Manual
                    </button>
                    <button
                      onClick={() => setPaymentMethod('qris')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${paymentMethod === 'qris' ? 'bg-lime text-black' : 'text-text-sub'}`}
                    >
                      QRIS / E-Wallet
                    </button>
                  </div>

                  {paymentMethod === 'bank_transfer' ? (
                    <div className="space-y-3 pt-2">
                      <div className="text-xs text-text-sub leading-relaxed">
                        Silakan transfer nominal di atas secara tepat ke salah satu rekening resmi platform berikut:
                      </div>
                      
                      <div className="space-y-2">
                        <div className="bg-bg-2 border border-border p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="block text-[10px] text-text-sub font-semibold">BANK BCA</span>
                            <span className="font-bold font-mono tracking-wide text-text-main">123-456-7890</span>
                            <span className="block text-[9px] text-text-sub leading-none">a/n RuangTutor Platform</span>
                          </div>
                          <button
                            onClick={() => handleCopyText('1234567890')}
                            className="text-lime hover:text-lime-dim p-1.5"
                          >
                            <Copy size={16} />
                          </button>
                        </div>

                        <div className="bg-bg-2 border border-border p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="block text-[10px] text-text-sub font-semibold">BANK MANDIRI</span>
                            <span className="font-bold font-mono tracking-wide text-text-main">111-222-3334</span>
                            <span className="block text-[9px] text-text-sub leading-none">a/n RuangTutor Platform</span>
                          </div>
                          <button
                            onClick={() => handleCopyText('1112223334')}
                            className="text-lime hover:text-lime-dim p-1.5"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center pt-2 space-y-3">
                      <div className="text-xs text-text-sub">
                        Scan kode QRIS ini menggunakan GoPay, OVO, Dana, ShopeePay, atau m-Banking Anda:
                      </div>
                      <div className="bg-white p-3 rounded-xl inline-block border border-border/40 shadow-sm">
                        {/* Dynamic aesthetic QR mockup */}
                        <div className="w-40 h-40 bg-zinc-100 flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 rounded relative overflow-hidden">
                          <div className="absolute inset-4 border-2 border-black"></div>
                          <div className="w-12 h-12 bg-black flex items-center justify-center text-white text-xs font-bold font-display rounded-lg z-10">QRIS</div>
                          <div className="absolute inset-0 bg-[radial-gradient(#1c1c1c_20%,transparent_20%)] [background-size:8px_8px] opacity-40"></div>
                        </div>
                      </div>
                      <div className="text-[10px] text-orange-400 font-mono tracking-wider">MOCKUP QRIS &bull; SCAN AMAN</div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/60">
                    <label className="block text-xs font-bold text-text-sub uppercase mb-2 font-mono tracking-wider">Unggah Bukti Transfer</label>
                    <div className="relative border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-lime/40 transition-colors bg-bg-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleUploadReceipt(selectedTrx.id, e)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                      />
                      <div className="flex flex-col items-center gap-1.5 cursor-pointer">
                        <Upload size={24} className="text-text-sub" />
                        <span className="text-xs font-bold text-text-main">Pilih gambar atau Drag & Drop</span>
                        <span className="text-[10px] text-text-sub">Maksimal 5MB (PNG, JPG, JPEG)</span>
                      </div>
                    </div>
                    {isUploading && (
                      <div className="text-center text-xs text-lime font-medium mt-2">Mengunggah bukti transfer...</div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-bg-2 border-t-[1.5px] border-border flex justify-end">
              <button
                onClick={() => setSelectedTrx(null)}
                className="w-full bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:opacity-90 transition-colors"
                disabled={isUploading}
              >
                Tutup Selesai
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {reviewModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-pgIn" style={{overscrollBehavior: 'none'}}>
          <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b-[1.5px] border-border bg-bg-2">
              <div className="font-display font-bold text-[16px]">
                Selesaikan Sesi & Beri Ulasan
              </div>
              <button
                onClick={() => setReviewModal(null)}
                className="text-text-sub hover:text-text-main"
                disabled={isSubmittingReview}
              >
                <AlertOctagon size={20} className="hidden" />
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="mb-4">
                <div className="text-xs text-text-sub font-mono uppercase tracking-wider mb-1">
                  Tutor
                </div>
                <div className="font-bold font-display text-lg">
                  {reviewModal.tutor_profiles?.profiles?.full_name || 'Tutor'}
                </div>
                <div className="text-sm text-lime font-mono">
                  {reviewModal.subject || 'Mapel'} · {new Date(reviewModal.session_date).toLocaleDateString()}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-text-sub uppercase font-mono tracking-wider mb-3 text-center">Beri Rating</label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map(star => (
                     <button 
                       key={star} 
                       onClick={() => setReviewRating(star)}
                       className="transition-transform hover:scale-110 focus:outline-none"
                     >
                       <Star size={32} className={star <= reviewRating ? "fill-warning text-warning drop-shadow-sm" : "text-border"} />
                     </button>
                  ))}
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-bold text-text-sub uppercase font-mono tracking-wider mb-1.5">Ulasan (Opsional)</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Ceritakan pengalaman belajar kamu, metode mengajar tutor, dll..."
                  className="w-full bg-bg-2 border border-border rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-lime transition-colors h-24 resize-none"
                />
              </div>
            </div>
            
            <div className="bg-bg-2 p-4 flex gap-3 border-t-[1.5px] border-border">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 font-bold py-2.5 rounded-lg text-sm text-text-main hover:bg-bg-3 border border-transparent transition-colors"
                disabled={isSubmittingReview}
              >
                Batal
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-[2] bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-dim transition-colors disabled:opacity-50"
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? 'Menyimpan...' : (reviewModal.status === 'completed' ? 'Kirim Ulasan' : 'Selesai & Kirim Ulasan')}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {copiedText && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] bg-lime text-black font-semibold font-mono text-xs py-2 px-4 rounded-full shadow-lg border border-lime/50 animate-bounce">
          ✓ Rekening Berhasil Disalin!
        </div>
      )}
    </div>
  );
}
