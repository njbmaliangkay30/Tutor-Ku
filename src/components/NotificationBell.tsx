import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';
import { useTranslation } from '../hooks/useTranslation';

function translateSubject(subj: string): string {
  const subjectTranslations: Record<string, string> = {
    'Matematika': 'Mathematics',
    'Fisika': 'Physics',
    'Kimia': 'Chemistry',
    'Biologi': 'Biology',
    'Bahasa Inggris': 'English',
    'Bahasa Indonesia': 'Indonesian',
    'Pemrograman': 'Programming',
    'Sejarah': 'History',
    'Geografi': 'Geography',
    'Ekonomi': 'Economics',
    'Sosiologi': 'Sociology',
    'Akuntansi': 'Accounting',
    'Informatika': 'Informatics',
    'IPA': 'Science',
    'IPS': 'Social Studies'
  };
  return subjectTranslations[subj] || subj;
}

function translateNotification(title: string, message: string, language: string): { title: string, message: string } {
  if (language !== 'en') return { title, message };

  let enTitle = title;
  let enMessage = message;

  // 1. Bukti Transfer Masuk
  if (title === 'Bukti Transfer Masuk') {
    enTitle = 'New Bank Transfer Proof Uploaded';
    const match = message.match(/Siswa (.*?) telah mengunggah bukti transfer baru\. Mohon diperiksa di Panel Admin\./);
    if (match) {
      enMessage = `Student ${match[1]} has uploaded a new transfer proof. Please review it in the Admin Panel.`;
    } else {
      enMessage = 'A student has uploaded a new transfer proof. Please review it in the Admin Panel.';
    }
  }
  // 2. Sesi Paket Baru!
  else if (title === 'Sesi Paket Baru!') {
    enTitle = 'New Package Session Booked!';
    const match = message.match(/(.*?) memesan 1 sesi baru menggunakan kuota paket langganan mereka untuk subjek (.*?)\./);
    if (match) {
      enMessage = `${match[1]} booked 1 new session using their subscription package quota for subject ${translateSubject(match[2])}.`;
    }
  }
  // 3. Sesi Berhasil Diajukan!
  else if (title === 'Sesi Berhasil Diajukan!') {
    enTitle = 'Session Successfully Requested!';
    const match = message.match(/Jadwal sesi tambahan menggunakan paket langganan telah berhasil diajukan untuk subjek (.*?)\. Menunggu konfirmasi dari tutor\./);
    if (match) {
      enMessage = `Additional session schedule using your subscription package has been successfully requested for subject ${translateSubject(match[1])}. Waiting for tutor's confirmation.`;
    }
  }
  // 4. Sesi Baru Dipesan (Menunggu Pembayaran)!
  else if (title === 'Sesi Baru Dipesan (Menunggu Pembayaran)!') {
    enTitle = 'New Session Booked (Pending Payment)!';
    const match = message.match(/(.*?) memesan 1 sesi pelajaran subjek (.*?)\. Sesi akan aktif setelah pembayaran dikonfirmasi\./);
    if (match) {
      enMessage = `${match[1]} booked 1 lesson session for subject ${translateSubject(match[2])}. The session will be active once payment is confirmed.`;
    }
  }
  // 5. Pesanan Sesi Berhasil!
  else if (title === 'Pesanan Sesi Berhasil!') {
    enTitle = 'Session Order Successful!';
    const match = message.match(/Kamu telah berhasil memesan 1 sesi untuk subjek (.*?)\. Silakan segera melakukan pembayaran di halaman tagihan agar jadwal dapat dikonfirmasi tutor\./);
    if (match) {
      enMessage = `You have successfully ordered 1 session for subject ${translateSubject(match[1])}. Please make the payment soon on the billing page so the tutor can confirm the schedule.`;
    }
  }
  // 6. Paket Belajar Baru Dipesan (Menunggu Pembayaran)!
  else if (title === 'Paket Belajar Baru Dipesan (Menunggu Pembayaran)!') {
    enTitle = 'New Learning Package Ordered (Pending Payment)!';
    const match = message.match(/(.*?) memesan (.*?) \((\d+) sesi\) untuk subjek (.*?)\. Sesi akan berjalan jika pembayaran dikonfirmasi\./);
    if (match) {
      enMessage = `${match[1]} ordered ${match[2]} (${match[3]} sessions) for subject ${translateSubject(match[4])}. The session will proceed once payment is confirmed.`;
    }
  }
  // 7. Pesanan Paket Berhasil!
  else if (title === 'Pesanan Paket Berhasil!') {
    enTitle = 'Package Order Successful!';
    const match = message.match(/Kamu telah memesan (.*?) untuk subjek (.*?)\. Silakan segera melakukan pembayaran di halaman tagihan agar jadwal dapat dikonfirmasi tutor\./);
    if (match) {
      enMessage = `You have ordered ${match[1]} for subject ${translateSubject(match[2])}. Please make the payment soon on the billing page so the schedule can be confirmed by the tutor.`;
    }
  }
  // 8. Sesi Disetujui Tutor!
  else if (title === 'Sesi Disetujui Tutor!') {
    enTitle = 'Session Approved by Tutor!';
    enMessage = 'The tutor has approved your session schedule. Please complete the payment under the Invoices tab to access the class link!';
  }
  // 9. Sesi Ditolak
  else if (title === 'Sesi Ditolak') {
    enTitle = 'Session Rejected';
    enMessage = 'Sorry, the tutor is unable to accommodate your session request at that time.';
  }
  // 10. Link Kelas Sudah Siap!
  else if (title === 'Link Kelas Sudah Siap!') {
    enTitle = 'Class Link is Ready!';
    const match = message.match(/Tutor (.*?) telah menyertakan link meeting untuk kelas (.*?) pada (.*?)\./);
    if (match) {
      enMessage = `Tutor ${match[1]} has included a meeting link for ${translateSubject(match[2])} class on ${match[3]}.`;
    }
  }
  // 11. Pembayaran Diverifikasi & Disetujui!
  else if (title === 'Pembayaran Diverifikasi & Disetujui!') {
    enTitle = 'Payment Verified & Approved!';
    const match = message.match(/Pembayaran Anda untuk (.*?) sebesar Rp (.*?) telah diverifikasi & disetujui\./);
    if (match) {
      const type = match[1] === 'Paket Belajar' ? 'Learning Package' : 'Session Booking';
      enMessage = `Your payment of Rp ${match[2]} for ${type} has been verified & approved.`;
    }
  }
  // 12. Pembayaran Pembelian Ditolak
  else if (title === 'Pembayaran Pembelian Ditolak') {
    enTitle = 'Purchase Payment Rejected';
    const match = message.match(/Pembayaran Anda untuk (.*?) ditolak oleh admin dengan alasan: "(.*?)"\. Silakan berikan bukti transfer yang valid\./);
    if (match) {
      const type = match[1] === 'Paket Belajar' ? 'Learning Package' : 'Session Booking';
      enMessage = `Your payment for ${type} was rejected by the admin for the following reason: "${match[2]}". Please provide valid proof of transfer.`;
    }
  }
  // 13. Akun Terverifikasi!
  else if (title === 'Akun Terverifikasi!') {
    enTitle = 'Account Verified!';
    enMessage = 'Congratulations! Your tutor account has been verified by the admin. You can now receive bookings from students.';
  }
  // 14. Status Verifikasi Dicabut
  else if (title === 'Status Verifikasi Dicabut') {
    enTitle = 'Verification Status Revoked';
    enMessage = 'Your tutor account\'s verification status has been revoked by the admin. Please contact support for more details.';
  }

  return { title: enTitle, message: enMessage };
}

interface NotificationBellProps {
  id?: string;
}


export function NotificationBell({ id = 'default' }: NotificationBellProps) {
  const { userProfile, userRole, setActiveTab, setTargetSessionId } = useAppContext();
  const { t, language } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popupPos, setPopupPos] = useState<any>({ top: 0, right: 0 });

  useEffect(() => {
    if (!userProfile?.id) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userProfile.id)
          .or('type.neq.chat,type.is.null')
          .order('created_at', { ascending: false })
          .limit(15);
          
        if (error) throw error;
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.is_read).length || 0);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channelId = Math.random().toString(36).substring(7);
    const channelName = `notifications_${userProfile.id}_${channelId}`;
    console.log(`Subscribing to realtime channel: ${channelName}`);
    
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userProfile.id}`
      }, (payload) => {
        if (payload.new.type === 'chat' || payload.new.link?.startsWith('chat:')) return;
        console.log('Realtime notification received:', payload);
        setNotifications(prev => [payload.new, ...prev].slice(0, 15));
        setUnreadCount(prev => prev + 1);
      })
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}: ${status}`);
      });

    return () => {
      console.log(`Unsubscribing from channel: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch(e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      if(!userProfile) return;
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userProfile.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch(e) { console.error(e); }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.is_read) {
      await markAsRead(n.id);
    }
    if (n.link) {
      if (n.link.includes(':')) {
        const parts = n.link.split(':');
        const tab = parts[0];
        const targetSid = parts[1];
        setTargetSessionId(targetSid);
        setActiveTab(tab);
      } else {
        setActiveTab(n.link);
      }
    }
    setIsOpen(false);
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      const newPos: any = {};
      
      // Vertical placement
      if (rect.top > viewportHeight / 2) {
        // Bottom half -> pop UP
        newPos.bottom = viewportHeight - rect.top + 10;
        newPos.top = 'auto';
      } else {
        // Top half -> pop DOWN
        newPos.top = rect.top + 48;
        newPos.bottom = 'auto';
      }
      
      // Horizontal placement
      if (rect.left < viewportWidth / 2) {
        // Left half (like Sidebar)
        newPos.left = Math.max(10, rect.left);
        newPos.right = 'auto';
      } else {
        // Right half (like Mobile Header)
        newPos.right = Math.max(10, viewportWidth - rect.right);
        newPos.left = 'auto';
      }
      
      setPopupPos(newPos);
    }
    setIsOpen(!isOpen);
  };

  if (userRole === 'guest') return null;

  return (
    <div className="relative">
      <button 
        ref={buttonRef}
        onClick={toggleOpen}
        className="w-10 h-10 rounded-full bg-bg-2 border border-border flex items-center justify-center hover:bg-bg-3 transition-all text-text-sub relative active:scale-95"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-bg-1" />
        )}
      </button>

      {isOpen && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed z-[9999] w-80 max-h-[400px] bg-card border-[2px] border-border rounded-2xl shadow-sh3 overflow-hidden flex flex-col animate-pgIn"
            style={{
              top: popupPos.top,
              bottom: popupPos.bottom,
              left: popupPos.left,
              right: popupPos.right
            }}
          >
            <div className="flex flex-col border-b border-border bg-bg-2">
              <div className="flex justify-between items-center p-4 pb-2">
                <h3 className="font-bold font-display text-sm">{t('notifications.title')}</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[10px] text-lime hover:underline font-mono uppercase font-bold">
                    {t('notifications.mark_all_read')}
                  </button>
                )}
              </div>
              <div className="flex gap-2 px-4 pb-3">
                <button 
                  onClick={async () => {
                    await Notification.requestPermission();
                    alert(t('notifications.alert_permission_requested'));
                  }}
                  className="text-[9px] bg-bg-3 hover:bg-border px-2 py-1 rounded-md text-text-main font-mono transition-colors"
                >
                  {t('notifications.allow_browser')}
                </button>
                <button 
                  onClick={async () => {
                     await fetch('/api/push/test', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ user_id: userProfile?.id })
                     });
                     alert(t('notifications.alert_test_sent'));
                  }}
                  className="text-[9px] bg-lime hover:opacity-80 px-2 py-1 rounded-md text-black font-mono font-bold transition-opacity"
                >
                  {t('notifications.test_push')}
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                   <Bell size={32} className="text-text-muted mb-2 opacity-20" />
                   <p className="text-xs text-text-sub">{t('notifications.no_notifications')}</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const { title: translatedTitle, message: translatedMessage } = translateNotification(n.title || '', n.message || '', language);
                  return (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-bg-2 transition-colors rounded-xl mb-1 ${n.is_read ? 'opacity-70' : 'bg-lime/5 border-l-2 border-l-lime'}`}
                    >
                      <div className="flex gap-2">
                        <div>
                          <h4 className="text-[13px] font-bold text-text-main leading-tight">{translatedTitle}</h4>
                          <p className="text-[11px] text-text-sub mt-1 leading-snug">{translatedMessage}</p>
                          <span className="text-[9px] text-text-muted mt-2 block font-mono">
                             {new Date(n.created_at).toLocaleString(language === 'en' ? 'en-US' : 'id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
