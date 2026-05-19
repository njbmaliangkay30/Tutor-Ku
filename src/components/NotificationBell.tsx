import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';

export function NotificationBell() {
  const { userProfile, userRole } = useAppContext();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userProfile) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channelId = Math.random().toString(36).substring(7);
    const channelName = `notifications_${userProfile.id}_${channelId}`;
    const channel = supabase.channel(channelName);
    
    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userProfile.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 10));
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

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

  if (userRole === 'guest') return null;

  return (
    <div className="relative">
      <button 
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-bg-2 border border-border flex items-center justify-center hover:bg-bg-3 transition-colors text-text-sub relative"
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
              top: (() => {
                const btn = document.getElementById('notification-bell-btn');
                if (!btn) return '60px';
                const rect = btn.getBoundingClientRect();
                return rect.top + 45;
              })(),
              right: (() => {
                const btn = document.getElementById('notification-bell-btn');
                if (!btn) return '20px';
                const rect = btn.getBoundingClientRect();
                // Ensure it doesn't go off screen
                return Math.max(20, window.innerWidth - rect.right);
              })()
            }}
          >
            <div className="flex justify-between items-center p-4 border-b border-border bg-bg-2">
              <h3 className="font-bold font-display text-sm">Notifikasi</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[10px] text-lime hover:underline font-mono uppercase font-bold">
                  Tandai semua dibaca
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                   <Bell size={32} className="text-text-muted mb-2 opacity-20" />
                   <p className="text-xs text-text-sub">Belum ada notifikasi baru untukmu.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => { if(!n.is_read) markAsRead(n.id); }}
                    className={`p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-bg-2 transition-colors rounded-xl mb-1 ${n.is_read ? 'opacity-70' : 'bg-lime/5 border-l-2 border-l-lime'}`}
                  >
                    <div className="flex gap-2">
                      <div>
                        <h4 className="text-[13px] font-bold text-text-main leading-tight">{n.title}</h4>
                        <p className="text-[11px] text-text-sub mt-1 leading-snug">{n.message}</p>
                        <span className="text-[9px] text-text-muted mt-2 block font-mono">
                           {new Date(n.created_at).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
