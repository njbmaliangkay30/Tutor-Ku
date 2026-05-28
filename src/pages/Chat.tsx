import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAppContext } from "../AppContext";
import { Send, ChevronLeft, Search } from "lucide-react";
import { getAvatarColor } from "../data";

export function Chat() {
  const { userProfile, user, userRole, setActiveTab, tutors } = useAppContext();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fallback to fetch profiles if needed
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (!user) return;
    
    // Fetch unique contacts
    async function fetchContacts() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("sender_id, receiver_id, content, created_at, is_read")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching messages info for contacts:", error);
          if (error.message.includes("does not exist") || error.code === '42P01') {
             // Messages table might not exist yet if user hasn't run sql schema
             setIsLoading(false);
             return;
          }
          throw error;
        }

        const contactIds = new Set<string>();
        const latestMsgs: Record<string, any> = {};

        data?.forEach((m: any) => {
          const contactId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
          if (!contactIds.has(contactId)) {
            contactIds.add(contactId);
            latestMsgs[contactId] = m;
          }
        });

        // Fetch profile info for these contacts
        if (contactIds.size > 0) {
          const { data: profiles, error: pError } = await supabase
            .from("profiles")
            .select("id, full_name, role, avatar_url")
            .in("id", Array.from(contactIds));
          
          if (!pError && profiles) {
            const pm: Record<string, any> = {};
            profiles.forEach((p: any) => pm[p.id] = p);
            setProfilesMap(pm);

            const convos = Array.from(contactIds).map((cid) => ({
              contactId: cid,
              profile: pm[cid],
              lastMessage: latestMsgs[cid]
            })).filter(c => c.profile); // ensure valid profiles

            setConversations(convos);
          }
        }
      } catch (err) {
        console.error("Error fetching contacts:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContacts();

    // Setup realtime listener for messages globally
    const msgSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
         const newMsg = payload.new;
         if (newMsg.sender_id === user.id || newMsg.receiver_id === user.id) {
           fetchContacts(); // Refetch to update sidebar
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgSubscription);
    };
  }, [user]);

  // Read messages when opening a contact
  useEffect(() => {
    if (!user || !activeContactId) return;

    async function fetchMessages() {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeContactId}),and(sender_id.eq.${activeContactId},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true });

        if (!error && data) {
           setMessages(data);
           // mark as read
           const unread = data.filter(m => m.receiver_id === user.id && !m.is_read);
           if (unread.length > 0) {
             await supabase.from("messages").update({ is_read: true }).in("id", unread.map(m => m.id));
           }
        }
      } catch (e) {
        console.error("error fetching chat messages:", e);
      }
    }
    fetchMessages();

    // Specific room subscription
    const roomSub = supabase
      .channel(`chat_${activeContactId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
         const newMsg = payload.new;
         if (
           (newMsg.sender_id === user.id && newMsg.receiver_id === activeContactId) ||
           (newMsg.sender_id === activeContactId && newMsg.receiver_id === user.id)
         ) {
           setMessages(prev => {
             if (prev.some(m => m.id === newMsg.id)) return prev;
             return [...prev, newMsg];
           });
           setTimeout(() => {
             messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
           }, 100);

           if (newMsg.receiver_id === user.id) {
             supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id).then();
           }
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomSub);
    };
  }, [user, activeContactId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeContactId) return;

    const sentContent = newMessage.trim();
    const tempId = "temp-" + Date.now();
    const tempMsg = {
      id: tempId,
      sender_id: user.id,
      receiver_id: activeContactId,
      content: sentContent,
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    // Tampilkan duluan di UI agar tidak terasa lag/ngebug
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage("");

    try {
      const { data, error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: activeContactId,
        content: sentContent,
        is_read: false
      }).select().single();
      
      if (error) {
        alert("Gagal mengirim pesan: " + error.message);
        // Hapus pesan temp jika gagal
        setMessages(prev => prev.filter(m => m.id !== tempId));
      } else if (data) {
        // Replace tempMsg dengan data asli dari database
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) {
            return prev.filter(m => m.id !== tempId);
          }
          return prev.map(m => m.id === tempId ? data : m);
        });
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const getProfileInitials = (name: string) => {
    return (name || "U").substring(0, 2).toUpperCase();
  };

  const activeProfile = activeContactId ? profilesMap[activeContactId] : null;

  return (
    <div className="flex h-full flex-col md:flex-row bg-bg-base overflow-hidden relative">
      {/* Sidebar for Conversations */}
      <div 
        className={`w-full md:w-[320px] lg:w-[350px] border-r-[1.5px] border-border/80 flex flex-col bg-bg-1 h-full shrink-0 ${activeContactId ? 'hidden md:flex' : 'flex'}`}
      >
        <div className="p-4 border-b border-border">
           <h2 className="font-display text-xl font-extrabold text-lime mb-3">Obrolan</h2>
           <div className="relative">
             <input type="text" placeholder="Cari obrolan..." className="w-full bg-bg-2 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-lime/50 transition-colors" />
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub" />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="text-center p-6 text-text-sub text-xs">Memuat obrolan...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-text-sub text-xs font-mono mb-2">Belum ada obrolan</p>
              <p className="text-[11px] text-text-muted">Booking tutor untuk memulai obrolan atau tunggu sampai ada pesan masuk.</p>
            </div>
          ) : (
            <div>
              {conversations.map(c => {
                 const isUnread = c.lastMessage?.receiver_id === user?.id && !c.lastMessage?.is_read;
                 return (
                   <button 
                     key={c.contactId}
                     onClick={() => setActiveContactId(c.contactId)}
                     className={`w-full flex items-start gap-3 p-4 border-b border-border/40 text-left transition-colors hover:bg-bg-2 cursor-pointer ${activeContactId === c.contactId ? 'bg-bg-2' : ''}`}
                   >
                     <div className="relative shrink-0">
                       {c.profile?.avatar_url ? (
                         <img src={c.profile.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover border border-border" />
                       ) : (
                         <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm font-display text-text-main" style={{backgroundColor: getAvatarColor(c.profile?.full_name || 'U')}}>
                           {getProfileInitials(c.profile?.full_name)}
                         </div>
                       )}
                       {isUnread && <div className="absolute top-0 right-0 w-3 h-3 bg-lime rounded-full border-2 border-bg-1" />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-baseline mb-1">
                         <span className="font-bold text-sm truncate text-text-main">{c.profile?.full_name}</span>
                         <span className="text-[10px] text-text-muted font-mono">{new Date(c.lastMessage?.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
                       <div className={`text-xs truncate ${isUnread ? 'text-text-main font-bold' : 'text-text-sub'}`}>
                         {c.lastMessage?.sender_id === user?.id && <span className="font-mono text-[10px] mr-1 opacity-70">Anda:</span>}
                         {c.lastMessage?.content}
                       </div>
                     </div>
                   </button>
                 );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col h-full bg-bg-base ${!activeContactId ? 'hidden md:flex' : 'flex'}`}>
        {!activeContactId ? (
          <div className="flex-1 flex items-center justify-center bg-bg-base p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-bg-2 border border-border flex items-center justify-center mx-auto mb-4 text-lime/50">
                 <Search size={28} />
              </div>
              <h3 className="font-display text-lg font-bold text-text-main mb-1">Pilih Obrolan</h3>
              <p className="text-sm text-text-sub">Silakan pilih kontak dari samping untuk mulai mengirim pesan.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-[60px] md:h-[72px] shrink-0 border-b border-border/80 bg-bg-1 px-4 flex items-center gap-3">
              <button 
                onClick={() => setActiveContactId(null)}
                className="md:hidden w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-sub"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="shrink-0">
                {activeProfile?.avatar_url ? (
                  <img src={activeProfile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs font-display text-text-main" style={{backgroundColor: getAvatarColor(activeProfile?.full_name || 'U')}}>
                    {getProfileInitials(activeProfile?.full_name)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-text-main">{activeProfile?.full_name}</div>
                <div className="text-[10px] text-lime font-mono capitalize">{activeProfile?.role || 'User'}</div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {messages.map((m, idx) => {
                const isMe = m.sender_id === user?.id;
                const showDate = false; // can add date dividers if needed
                
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-pgIn`}>
                    <div 
                      className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5 text-[13.5px] ${isMe ? 'bg-lime text-black rounded-tr-sm' : 'bg-bg-2 border border-border text-text-main rounded-tl-sm'}`}
                    >
                      {(() => {
                        const rawContent = m.content || '';
                        const match = rawContent.match(/\[SESSION_ID:([a-zA-Z0-9-]+)\]/);
                        const sessionId = match ? match[1] : null;
                        const cleanContent = rawContent.replace(/\[SESSION_ID:[a-zA-Z0-9-]+\]/, '');
                        
                        return (
                          <div className="flex flex-col">
                            <span className="whitespace-pre-wrap">{cleanContent}</span>
                            {sessionId && (
                              <div className={`mt-3 p-3 rounded-lg border ${isMe ? 'border-black/10 bg-black/5' : 'border-border bg-card'}`}>
                                <div className="text-[11px] font-bold font-mono tracking-wider uppercase mb-2 opacity-70">Pengajuan Jadwal</div>
                                {userRole === 'tutor' && !isMe ? (
                                  <div className="flex gap-2">
                                     <button 
                                       onClick={async () => {
                                         try {
                                           await supabase.from('sessions').update({ status: 'confirmed' }).eq('id', sessionId);
                                           alert('Jadwal diterima!');
                                         } catch(e) { alert('Gagal memproses'); }
                                       }} 
                                       className="flex-1 bg-lime-dim text-black py-1.5 rounded-md text-xs font-bold"
                                     >Terima</button>
                                     <button 
                                       onClick={async () => {
                                         try {
                                           await supabase.from('sessions').update({ status: 'cancelled' }).eq('id', sessionId);
                                           alert('Jadwal ditolak.');
                                         } catch(e) { alert('Gagal memproses'); }
                                       }} 
                                       className="flex-1 bg-red-500/10 text-red-500 py-1.5 rounded-md text-xs font-bold"
                                     >Tolak</button>
                                  </div>
                                ) : (
                                  <div className="text-[11px] italic opacity-80">Jadwal menunggu konfirmasi. {isMe ? 'Anda' : 'Siswa'} dapat memantau status di halaman Sesi.</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="text-[9px] text-text-muted mt-1 font-mono tracking-wide px-1">
                      {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-bg-1 border-t border-border shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 bg-bg-2 border border-border rounded-full px-4 py-3 text-[13.5px] outline-none focus:border-lime/50 transition-colors text-text-main placeholder:text-text-muted"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-11 h-11 shrink-0 rounded-full bg-lime text-black flex items-center justify-center disabled:opacity-50 transition-opacity"
                >
                  <Send size={18} className="ml-1 -mt-px" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
