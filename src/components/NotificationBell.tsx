import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../AppContext';

interface NotificationBellProps {
  id?: string;
}

export function NotificationBell({ id = 'default' }: NotificationBellProps) {
  const { userProfile, userRole } = useAppContext();
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
