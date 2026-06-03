import { Calendar, Video, FileText, Star, Clock, AlertOctagon, Upload, Copy, Check, Info, CreditCard, X, ChevronRight, MapPin } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';
import { getAvatarColor } from '../data';
import { useTranslation } from '../hooks/useTranslation';

export const parseSessionNotes = (rawNotes: string | null | undefined) => {
  if (!rawNotes) return { meta: null, notes: "" };
  if (rawNotes.startsWith("[META:")) {
    const parts = rawNotes.split(" || ");
    const metaTag = parts[0].replace("[META:", "").replace("]", "");
    const notesContent = parts.slice(1).join(" || ").trim();
    return { meta: metaTag, notes: notesContent };
  }
  // Backwards compatibility
  if (rawNotes === "Sesi menggunakan kuota paket (Prepaid)") {
    return { meta: "prepaid", notes: "" };
  }
  if (rawNotes === "Sesi baru") {
    return { meta: "single", notes: "" };
  }
  if (rawNotes.startsWith("Sesi 1 dari Paket")) {
    const match = rawNotes.match(/Sesi 1 dari Paket \(([^)]+)\)/);
    const pkgName = match ? match[1] : "Paket";
    return { meta: `bundle_init:${pkgName}`, notes: "" };
  }
  return { meta: null, notes: rawNotes };
};

export const parseLocationField = (locationStr: string | null | undefined) => {
  if (!locationStr) return { text: "", url: "" };

  // Strip common legacy labels and headings
  let clean = locationStr
    .replace(/Lokasi & Detail Pertemuan:/gi, "")
    .replace(/Link Google Maps:/gi, "")
    .replace(/Nama Tempat \/ Cafe \/ Gedung:/gi, "")
    .replace(/Detail Alamat & Patokan:/gi, "")
    .replace(/Alamat \/ Detail Lokasi:/gi, "")
    .replace(/Alamat Lengkap:/gi, "")
    .replace(/Titik GPS:/gi, "")
    .trim();

  // Extract URL if present
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const match = clean.match(urlRegex);
  let url = "";
  if (match) {
    url = match[0];
    clean = clean.replace(urlRegex, "").replace(/\(\s*\)/g, "").trim();
  }

  return { text: clean, url };
};

export function StudentSessions() {
  const [type, setType] = useState<'upcoming' | 'past'>('upcoming');
  const [sessions, setSessions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTrxLoading, setIsTrxLoading] = useState(false);
  const { user, userProfile, tutors, userRole, setActiveTab, targetSessionId, setTargetSessionId } = useAppContext();
  const { t, language } = useTranslation();

  // Checkout / Payment / Session details modal
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'qris'>('bank_transfer');
  const [copiedText, setCopiedText] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    bank_name: "BANK BCA",
    account_number: "223-0182-991",
    account_name: "a/n RuangTutor Platform",
    qris_url: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://RuangTutorPlatformQRIS"
  });

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('*')
          .eq('key', 'payment_settings')
          .maybeSingle();
        if (!error && data && data.value) {
          setPaymentSettings(data.value);
          return;
        }
      } catch (e) {
        console.warn("DB settings table not found. Using local storage or default.", e);
      }

      const local = localStorage.getItem('rt_payment_settings');
      if (local) {
        try {
          setPaymentSettings(JSON.parse(local));
        } catch (e) {}
      }
    };

    fetchPaymentSettings();

    const handleUpdate = () => {
      fetchPaymentSettings();
    };
    window.addEventListener('rt_payment_settings_updated', handleUpdate);
    return () => {
      window.removeEventListener('rt_payment_settings_updated', handleUpdate);
    };
  }, []);

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
        .select(`
          *,
          sessions (id, status, session_date, start_time, subject, meeting_type),
          student_packages (id, status)
        `)
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

  useEffect(() => {
    if (targetSessionId && sessions.length > 0) {
      const found = sessions.find(s => s.id === targetSessionId);
      if (found) {
        setSelectedSession(found);
        if (found.status === 'completed' || found.status === 'rejected' || found.status === 'cancelled') {
          setType('past');
        } else {
          setType('upcoming');
        }
      }
      setTargetSessionId(null);
    }
  }, [targetSessionId, sessions, setTargetSessionId]);

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
    return s.status !== 'completed' && s.status !== 'rejected' && s.status !== 'cancelled';
  });
  const past = sessions.filter(s => {
    return s.status === 'completed' || s.status === 'rejected' || s.status === 'cancelled';
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
       const customerName = (userProfile?.full_name || 'Customer').toString().trim().replace(/[^a-zA-Z0-9]/g, '_');
       const now = new Date();
       const formatDigit = (num: number) => String(num).padStart(2, '0');
       const dateStr = `${now.getFullYear()}-${formatDigit(now.getMonth() + 1)}-${formatDigit(now.getDate())}_${formatDigit(now.getHours())}-${formatDigit(now.getMinutes())}-${formatDigit(now.getSeconds())}`;
       const fileExt = file.name.split('.').pop() || 'png';
       const cleanFileName = `bukti_${customerName}_${dateStr}_trx_${transactionId.substring(0, 8)}.${fileExt}`;
       
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

        alert(t('sessions.alert_proof_success'));
        fetchSessions();
        fetchTransactions();
        setSelectedSession(null);
        setSelectedTrx(null);
    } catch (err: any) {
       console.error(err);
       alert(t('sessions.alert_upload_error') + ': ' + err.message);
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
          .maybeSingle();

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
       alert(t('sessions.alert_review_error'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (userRole === 'guest' || !userProfile) {
    return (
      <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full text-center mt-10">
        <h1 className="text-2xl font-bold font-display text-text-main mb-4">{t('sessions.title')}</h1>
        <p className="text-sm text-text-sub mb-6">{t('sessions.login_prompt')}</p>
        <button 
          onClick={() => setActiveTab('login')} 
          className="bg-lime text-black font-bold py-3 px-8 rounded-lg hover:bg-lime-dim transition-colors"
        >
          {t('sessions.login_now')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-pgIn max-w-4xl mx-auto w-full pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-text-main">{t('sessions.title')}</h1>
        <p className="text-sm text-text-sub">{t('sessions.subtitle')}</p>
      </div>

      <div className="flex bg-bg-2 border-[1.5px] border-border rounded-lg p-1 mb-6 gap-1">
        <button
          onClick={() => setType('upcoming')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${type === 'upcoming' ? 'bg-lime-mid text-lime' : 'text-text-sub hover:text-text-main'}`}
        >
          {t('sessions.tab_upcoming')} ({upcoming.length})
        </button>
        <button
          onClick={() => setType('past')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${type === 'past' ? 'bg-lime-mid text-lime' : 'text-text-sub hover:text-text-main'}`}
        >
          {t('sessions.tab_history')} ({past.length})
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="text-center py-8">{t('sessions.loading_sessions')}</div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-8 text-text-sub border border-dashed border-border rounded-xl">
            {type === 'upcoming' ? t('sessions.no_sessions_upcoming') : t('sessions.no_sessions_past')}
          </div>
        ) : (
          displayList.map(session => {
            const trx = transactions.find(t => t.session_id === session.id || (t.student_package_id && session.material_notes?.includes(`bundle_init:`) && t.student_package_id === session.student_package_id));
            
            const isPaid = session.payment_status === 'paid' || trx?.status === 'success';
            const isPendingVerification = trx?.status === 'pending_verification';
            const isPaymentFailed = trx?.status === 'failed';
            const isAwaitingPayment = session.status === 'confirmed' && session.payment_status === 'unpaid' && (!trx || trx.status === 'pending' || trx.status === 'failed');

            let statusText = session.status;
            let statusColor = "bg-bg-3 text-text-sub";
            if (session.status === 'pending') {
              statusText = t('sessions.status_pending');
              statusColor = "bg-warning/20 text-warning";
            } else if (isAwaitingPayment) {
              statusText = "Menunggu Pembayaran";
              statusColor = "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30";
            } else if (isPendingVerification) {
              statusText = "Menunggu Verifikasi";
              statusColor = "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30";
            } else if (isPaymentFailed) {
              statusText = "Pembayaran Ditolak";
              statusColor = "bg-red-500/15 text-red-400 border border-red-500/20";
            } else if (session.status === 'confirmed') {
              statusText = t('sessions.status_confirmed');
              statusColor = "bg-lime-dim text-lime border border-lime/30";
            } else if (session.status === 'completed') {
              statusText = t('sessions.status_completed');
              statusColor = "bg-bg-2 border border-border text-text-sub";
            } else if (session.status === 'rejected') {
              statusText = t('sessions.status_rejected');
              statusColor = "bg-red-500/10 text-red-400 border border-red-500/20";
            } else if (session.status === 'waiting_for_student') {
              statusText = t('sessions.status_waiting');
              statusColor = "bg-warning/20 text-warning border border-warning/30";
            } else if (session.status === 'cancelled') {
              statusText = t('sessions.status_cancelled');
              statusColor = "bg-red-500/10 text-red-500 border border-red-500/30";
            }

            return (
              <div 
                key={session.id} 
                onClick={() => setSelectedSession(session)}
                className={`bg-card border-[1.5px] border-border rounded-xl p-4 cursor-pointer hover:border-lime/40 transition-all ${session.status === 'pending' ? 'border-warning/30' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold font-display" style={{backgroundColor: getAvatarColor(session.tutor_profiles?.profiles?.full_name || 'Tutor')}}>
                      {(session.tutor_profiles?.profiles?.full_name || 'T').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-text-main font-display">{session.tutor_profiles?.profiles?.full_name || 'Tutor'}</div>
                      <div className="text-xs text-text-sub font-mono">{t(`subjects.${session.subject}`)}</div>
                      {(() => {
                        const parsed = parseSessionNotes(session.material_notes);
                        if (!parsed.meta) return null;
                        if (parsed.meta === "prepaid") {
                          return (
                            <div className="mt-1">
                              <span className="text-[9px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider inline-block">
                                {t('sessions.badge_prepaid')}
                              </span>
                            </div>
                          );
                        }
                        if (parsed.meta === "single") {
                          return (
                            <div className="mt-1">
                              <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider inline-block">
                                {t('sessions.badge_single')}
                              </span>
                            </div>
                          );
                        }
                        if (parsed.meta.startsWith("bundle_init:")) {
                          const pkgName = parsed.meta.replace("bundle_init:", "");
                          return (
                            <div className="mt-1">
                              <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider inline-block">
                                {t('sessions.badge_bundle')} {pkgName}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className={`text-[10px] font-bold px-2.5 py-1.5 rounded font-mono uppercase tracking-wider flex-shrink-0 whitespace-nowrap ${statusColor}`}>
                    {statusText}
                  </div>
                </div>

                <div className="bg-bg-2 rounded-lg p-3 mb-4 space-y-2 border border-border/50">
                  <div className="flex items-center gap-2 text-sm text-text-main">
                    <Calendar size={16} className="text-text-sub" />
                    <span>{new Date(session.session_date).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-main">
                    <Clock size={16} className="text-text-sub" />
                    <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                  </div>
                  {(() => {
                    const parsed = parseSessionNotes(session.material_notes);
                    return (
                      <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/50">
                        <span className="text-xs text-text-sub font-medium font-mono uppercase tracking-wider">{t('sessions.extra_notes_label')}</span>
                         <p className="text-sm font-sans italic">
                           {parsed.notes ? `"${parsed.notes}"` : t('sessions.notes_default')}
                         </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Card CTA Actions */}
                <div className="flex gap-2 w-full">
                  {isAwaitingPayment ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                      }}
                      className="flex-1 bg-lime text-black font-bold text-xs py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <CreditCard size={14} /> Bayar Sekarang
                    </button>
                  ) : isPendingVerification ? (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                      }}
                      className="flex-1 text-center py-2 text-xs font-mono text-cyan-400 bg-cyan-500/5 border border-cyan-500/10 rounded-lg hover:bg-cyan-500/10 transition-colors"
                    >
                      Dalam Proses Verifikasi &bull; Detail
                    </div>
                  ) : isPaymentFailed ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                      }}
                      className="flex-1 bg-red-500 text-white font-bold text-xs py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <AlertOctagon size={14} /> Pembayaran Ditolak - Unggah Ulang
                    </button>
                  ) : session.status === 'confirmed' && isPaid ? (
                    session.meeting_type !== 'offline' ? (
                      session.meeting_link ? (
                        <a 
                          href={session.meeting_link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-lime text-black font-bold py-2 rounded-lg text-xs hover:bg-lime-dim transition-colors flex items-center justify-center gap-2"
                        >
                          <Video size={14} /> Buka Link Meeting
                        </a>
                      ) : (
                        <div className="flex-1 bg-bg-2 border border-dashed border-border text-center text-text-sub font-mono font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2">
                          Link meeting belum dimasukkan
                        </div>
                      )
                    ) : (
                      (() => {
                        const parsedLoc = parseLocationField(session.location);
                        return (
                          <div 
                            className="w-full bg-bg-2 border border-border p-2.5 rounded-lg text-xs leading-relaxed text-text-main"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-start gap-1 flex-1 min-w-[150px]">
                                <span className="font-bold text-text-sub font-mono uppercase text-[9px] mt-0.5">📍:</span>
                                <span className="text-text-main font-medium">{parsedLoc.text || t('sessions.no_location')}</span>
                              </div>
                              {parsedLoc.url && (
                                <a
                                  href={parsedLoc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-lime text-black font-extrabold px-2 py-0.5 rounded text-[10px] hover:bg-lime-dim transition-all whitespace-nowrap"
                                >
                                  Maps ↗
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    )
                  ) : session.status === 'waiting_for_student' ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewModal(session);
                      }}
                      className="flex-1 border-[1.5px] border-lime bg-lime text-black font-bold py-2 rounded-lg text-xs hover:bg-lime-dim transition-colors flex items-center justify-center gap-2"
                    >
                      <Star size={14} /> Tandai Selesai & Beri Ulasan
                    </button>
                  ) : session.status === 'completed' && !session.rating ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewModal(session);
                      }}
                      className="flex-1 border-[1.5px] border-lime/50 text-lime font-bold py-2 rounded-lg text-xs hover:bg-lime-mid transition-colors flex items-center justify-center gap-2"
                    >
                      <Star size={14} /> Beri Ulasan
                    </button>
                  ) : (
                    <div className="flex-1 text-center py-2 text-xs text-text-sub border border-dashed border-border rounded-lg">
                      Detail Sesi Belajar &rarr;
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Unified Session Details & Checkout Modal */}
      {selectedSession && (() => {
        const trx = transactions.find(t => t.session_id === selectedSession.id || (t.student_package_id && selectedSession.material_notes?.includes(`bundle_init:`) && t.student_package_id === selectedSession.student_package_id));
        
        const isPaid = selectedSession.payment_status === 'paid' || trx?.status === 'success';
        const isPendingVerification = trx?.status === 'pending_verification';
        const isPaymentFailed = trx?.status === 'failed';
        const isAwaitingPayment = selectedSession.status === 'confirmed' && selectedSession.payment_status === 'unpaid' && (!trx || trx.status === 'pending' || trx.status === 'failed');
        
        let statusTitle = "";
        let statusDesc = "";
        let statusBadgeColor = "";
        
        if (selectedSession.status === 'pending') {
          statusTitle = t('sessions.status_pending');
          statusDesc = language === 'en'
            ? "The tutor is currently reviewing your session schedule request. Payment will be enabled once the tutor approves."
            : "Tutor sedang meninjau permintaan jadwal sesi belajar Anda. Pembayaran akan dibuka setelah tutor menyetujui jadwal ini.";
          statusBadgeColor = "bg-warning/20 text-warning border border-warning/30";
        } else if (isAwaitingPayment) {
          statusTitle = language === 'en' ? "Awaiting Payment" : "Menunggu Pembayaran";
          statusDesc = language === 'en'
            ? "The session schedule has been approved by the tutor. Please complete the payment below to unlock the class link or location."
            : "Jadwal sesi telah disetujui oleh tutor. Silakan selesaikan pembayaran tagihan di bawah ini agar link kelas/lokasi dapat diakses.";
          statusBadgeColor = "bg-yellow-500/15 text-yellow-500 border border-yellow-500/30";
        } else if (isPendingVerification) {
          statusTitle = t('sessions.status_label_pending_verification');
          statusDesc = t('sessions.in_verification_desc');
          statusBadgeColor = "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30";
        } else if (isPaymentFailed) {
          statusTitle = language === 'en' ? "Payment Rejected" : "Pembayaran Ditolak";
          statusDesc = language === 'en'
            ? `Your payment was rejected by the admin for the following reason: "${trx?.rejection_reason || 'Invalid transfer proof'}". Please upload a valid transfer proof.`
            : `Pembayaran Anda ditolak oleh admin dengan alasan: "${trx?.rejection_reason || 'Bukti transfer tidak valid'}". Silakan unggah ulang bukti transfer yang valid.`;
          statusBadgeColor = "bg-red-500/15 text-red-400 border border-red-500/30";
        } else if (selectedSession.status === 'confirmed' && isPaid) {
          statusTitle = language === 'en' ? "Confirmed & Paid" : "Terkonfirmasi & Lunas";
          statusDesc = language === 'en'
            ? "Your session schedule has been confirmed and paid. Happy learning!"
            : "Jadwal sesi belajar Anda telah terkonfirmasi dan lunas. Selamat belajar!";
          statusBadgeColor = "bg-lime/20 text-lime border border-lime/30";
        } else if (selectedSession.status === 'waiting_for_student') {
          statusTitle = t('sessions.status_waiting');
          statusDesc = language === 'en'
            ? "The learning session is completed. Please mark it complete and write your review."
            : "Sesi belajar telah selesai dilaksanakan. Silakan tandai selesai dan berikan ulasan Anda.";
          statusBadgeColor = "bg-warning/20 text-warning border border-warning/30";
        } else if (selectedSession.status === 'completed') {
          statusTitle = t('sessions.status_completed');
          statusDesc = language === 'en'
            ? "This learning session has been completed. Thank you!"
            : "Sesi belajar ini telah selesai dilaksanakan. Terima kasih!";
          statusBadgeColor = "bg-bg-3 border border-border text-text-sub";
        } else if (selectedSession.status === 'rejected') {
          statusTitle = t('sessions.status_rejected');
          statusDesc = language === 'en'
            ? "Sorry, your session request has been rejected by the tutor."
            : "Maaf, permintaan sesi belajar Anda ditolak oleh tutor karena berhalangan.";
          statusBadgeColor = "bg-red-500/15 text-red-400 border border-red-500/30";
        } else if (selectedSession.status === 'cancelled') {
          statusTitle = t('sessions.status_cancelled');
          statusDesc = language === 'en'
            ? "This learning session has been cancelled."
            : "Sesi belajar ini telah dibatalkan.";
          statusBadgeColor = "bg-red-500/15 text-red-500 border border-red-500/30";
        }

        return createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-pgIn" style={{overscrollBehavior: 'none'}}>
            <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="flex justify-between items-center p-4 border-b-[1.5px] border-border bg-bg-2">
                <div className="font-display font-bold text-[16px]">
                  {language === 'en' ? 'Session Details' : 'Detail Sesi Belajar'}
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-text-sub hover:text-text-main"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
                
                <div className="flex items-center gap-3 bg-bg-2 p-3.5 rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold font-display" style={{backgroundColor: getAvatarColor(selectedSession.tutor_profiles?.profiles?.full_name || 'Tutor')}}>
                    {(selectedSession.tutor_profiles?.profiles?.full_name || 'T').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-text-main font-display">{selectedSession.tutor_profiles?.profiles?.full_name || 'Tutor'}</div>
                    <div className="text-xs text-text-sub font-mono">{t(`subjects.${selectedSession.subject}`)}</div>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded font-mono uppercase tracking-wider whitespace-nowrap ${statusBadgeColor}`}>
                      {statusTitle}
                    </span>
                  </div>
                </div>

                <div className="bg-bg-2 rounded-xl p-3.5 space-y-2 border border-border/50 text-sm">
                  <div className="flex items-center gap-2 text-text-main">
                    <Calendar size={16} className="text-text-sub" />
                    <span>{new Date(selectedSession.session_date).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-main">
                    <Clock size={16} className="text-text-sub" />
                    <span>{formatTime(selectedSession.start_time)} - {formatTime(selectedSession.end_time)}</span>
                  </div>
                  {(() => {
                    const parsed = parseSessionNotes(selectedSession.material_notes);
                    return (
                      <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/50">
                        <span className="text-[10px] text-text-sub font-bold font-mono uppercase tracking-wider">{t('sessions.extra_notes_label')}</span>
                        <p className="text-sm italic">
                          {parsed.notes ? `"${parsed.notes}"` : t('sessions.notes_default')}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-bg-3 p-3.5 rounded-xl border border-border/85 text-xs text-text-sub leading-relaxed">
                  {statusDesc}
                </div>

                {trx && (isAwaitingPayment || isPendingVerification || isPaymentFailed) && (
                  <div className="border-t border-border/60 pt-4 space-y-4">
                    <div className="bg-bg-2 p-4 rounded-xl border border-border">
                      <span className="text-[10px] text-text-sub font-mono uppercase">{t('sessions.total_payment')}</span>
                      <div className="text-xl font-bold text-lime font-display mt-0.5">Rp {trx.amount?.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}</div>
                      <div className="text-[10px] text-text-sub mt-1">Invoice ID: {trx.id.substring(0, 8).toUpperCase()}</div>
                    </div>

                    {isPendingVerification ? (
                      <div className="space-y-3 text-center py-2">
                        {trx.proof_url && (
                          <div>
                            <span className="block text-[10px] text-text-sub font-mono uppercase pb-1.5">{t('sessions.proof_uploaded')}</span>
                            <a href={trx.proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-bg-3 border border-border text-xs py-1.5 px-3 rounded-lg hover:bg-bg-2 text-lime font-medium">
                              {t('sessions.view_proof')}
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
                            {t('sessions.bank_transfer_tab')}
                          </button>
                          <button
                            onClick={() => setPaymentMethod('qris')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${paymentMethod === 'qris' ? 'bg-lime text-black' : 'text-text-sub'}`}
                          >
                            {t('sessions.qris_tab')}
                          </button>
                        </div>

                        {paymentMethod === 'bank_transfer' ? (
                          <div className="space-y-3 pt-1">
                            <div className="text-[11px] text-text-sub leading-relaxed">
                              {t('sessions.transfer_instruction')}
                            </div>
                            
                            <div className="bg-bg-2 border border-border p-3 rounded-lg flex justify-between items-center">
                              <div>
                                <span className="block text-[10px] text-text-sub font-semibold">{paymentSettings.bank_name}</span>
                                <span className="font-bold font-mono tracking-wide text-text-main">{paymentSettings.account_number}</span>
                                <span className="block text-[9px] text-text-sub leading-none mt-1">{paymentSettings.account_name}</span>
                              </div>
                              <button
                                onClick={() => handleCopyText(paymentSettings.account_number)}
                                className="text-lime hover:text-lime-dim p-1.5 flex items-center gap-1 cursor-pointer transition-all border border-border bg-bg-base/30 rounded-lg px-2 hover:bg-bg-3"
                              >
                                {copiedText ? (
                                  <>
                                    <span className="text-[9px] font-bold text-success">{t('sessions.copied_btn')}</span>
                                    <Check size={12} className="text-success" />
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[9px] text-text-sub font-semibold">{t('sessions.copy_btn')}</span>
                                    <Copy size={12} className="text-text-sub" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center pt-1 space-y-2">
                            <div className="text-[11px] text-text-sub">
                              {t('sessions.scan_qris_instruction')}
                            </div>
                            <div className="bg-white p-2 rounded-xl inline-block border border-border/40 shadow-sm max-w-[150px] w-full aspect-square">
                              <img 
                                src={paymentSettings.qris_url} 
                                alt="Platform QRIS" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t border-border/60">
                          <label className="block text-[10px] font-bold text-text-sub uppercase mb-2 font-mono tracking-wider">{t('sessions.upload_proof_label')}</label>
                          <div className="relative border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-lime/40 transition-colors bg-bg-2">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleUploadReceipt(trx.id, e)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={isUploading}
                            />
                            <div className="flex flex-col items-center gap-1 cursor-pointer">
                              <Upload size={20} className="text-text-sub" />
                              <span className="text-xs font-bold text-text-main">{t('sessions.choose_image')}</span>
                              <span className="text-[9px] text-text-sub">{t('sessions.max_size')}</span>
                            </div>
                          </div>
                          {isUploading && (
                            <div className="text-center text-xs text-lime font-medium mt-2">{t('sessions.uploading')}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {selectedSession.status === 'confirmed' && isPaid && (
                  <div className="border-t border-border/60 pt-4 space-y-3">
                    <span className="block text-[10px] text-text-sub font-bold font-mono uppercase tracking-wider">{language === 'en' ? 'Link / Location Details:' : 'Detail Link / Lokasi:'}</span>
                    {selectedSession.meeting_type !== 'offline' ? (
                      selectedSession.meeting_link ? (
                        <a href={selectedSession.meeting_link} target="_blank" rel="noopener noreferrer" className="w-full bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-dim transition-colors flex items-center justify-center gap-2">
                          <Video size={16} /> {t('sessions.open_meeting_link')}
                        </a>
                      ) : (
                        <div className="bg-bg-2 border border-dashed border-border text-center text-text-sub font-mono font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2">
                          {t('sessions.link_not_added')}
                        </div>
                      )
                    ) : (
                      (() => {
                        const parsedLoc = parseLocationField(selectedSession.location);
                        return (
                          <div className="bg-bg-2 border border-border p-3 rounded-lg text-xs leading-relaxed text-text-main">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-start gap-1 flex-1 min-w-[150px]">
                                <MapPin size={14} className="text-text-sub mt-0.5 flex-shrink-0" />
                                <span className="text-text-main font-medium">{parsedLoc.text || t('sessions.no_location')}</span>
                              </div>
                              {parsedLoc.url && (
                                <a
                                  href={parsedLoc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-lime text-black font-extrabold px-2 py-1 rounded-md text-[10px] hover:bg-lime-dim transition-all"
                                >
                                  {t('sessions.open_maps')}
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}

                {selectedSession.status === 'waiting_for_student' && (
                  <div className="border-t border-border/60 pt-4">
                    <button 
                      onClick={() => {
                        setReviewModal(selectedSession);
                        setSelectedSession(null);
                      }}
                      className="w-full border-[1.5px] border-lime bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-dim transition-colors flex items-center justify-center gap-2"
                    >
                      <Star size={16} /> {t('sessions.mark_complete')}
                    </button>
                  </div>
                )}

                {selectedSession.status === 'completed' && !selectedSession.rating && (
                  <div className="border-t border-border/60 pt-4">
                    <button 
                      onClick={() => {
                        setReviewModal(selectedSession);
                        setSelectedSession(null);
                      }}
                      className="w-full border-[1.5px] border-lime text-lime font-bold py-2.5 rounded-lg text-sm hover:bg-lime-mid transition-colors flex items-center justify-center gap-2 bg-transparent"
                    >
                      <Star size={16} /> {t('sessions.give_review')}
                    </button>
                  </div>
                )}
                
              </div>

              <div className="p-4 bg-bg-2 border-t-[1.5px] border-border flex justify-end">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="w-full bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:opacity-90 transition-colors"
                >
                  {t('common.close')}
                </button>
              </div>

            </div>
          </div>
        , document.body);
      })()}

      {reviewModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-pgIn" style={{overscrollBehavior: 'none'}}>
          <div className="bg-card w-full max-w-md rounded-2xl border-[2px] border-border shadow-sh1 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b-[1.5px] border-border bg-bg-2">
              <div className="font-display font-bold text-[16px]">
                {t('sessions.finish_review_title')}
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
                  {t('profile.tutor_label')}
                </div>
                <div className="font-bold font-display text-lg">
                  {reviewModal.tutor_profiles?.profiles?.full_name || 'Tutor'}
                </div>
                <div className="text-sm text-lime font-mono">
                  {t(`subjects.${reviewModal.subject}`)} · {new Date(reviewModal.session_date).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID')}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-text-sub uppercase font-mono tracking-wider mb-3 text-center">{t('sessions.give_rating')}</label>
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
                <label className="block text-xs font-bold text-text-sub uppercase font-mono tracking-wider mb-1.5">{t('sessions.review_optional')}</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={t('sessions.review_placeholder')}
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
                {t('sessions.cancel_btn')}
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-[2] bg-lime text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-dim transition-colors disabled:opacity-50"
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? t('sessions.saving') : (reviewModal.status === 'completed' ? t('sessions.submit_review') : t('sessions.submit_finish'))}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {copiedText && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] bg-lime text-black font-semibold font-mono text-xs py-2 px-4 rounded-full shadow-lg border border-lime/50 animate-bounce">
          {t('sessions.copied_toast')}
        </div>
      )}
    </div>
  );
}

