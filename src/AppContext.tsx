import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { supabase } from "./lib/supabase";
import { User } from "@supabase/supabase-js";

type UserRoleType = "guest" | "siswa" | "tutor" | "admin";

type AppContextType = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  subjectFilter: string;
  setSubjectFilter: (s: string) => void;
  genderFilter: string;
  setGenderFilter: (g: string) => void;
  selectedTutorId: string | null;
  setSelectedTutorId: (id: string | null) => void;
  theme: string;
  toggleTheme: () => void;
  userRole: UserRoleType;
  setUserRole: (role: UserRoleType) => void;
  user: User | null;
  userProfile: any | null;
  tutorProfileData: any | null;
  tutors: any[];
  isLoadingTutors: boolean;
  isLoadingProfile: boolean;
  targetSessionId: string | null;
  setTargetSessionId: (id: string | null) => void;
  unreadChatCount: number;
  fetchTutors: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const updateFavicon = (theme: string) => {
  const favicon = document.getElementById("app-favicon") as HTMLLinkElement;
  if (!favicon) return;
  const bgColor = theme === "dark" ? "%230D0D0D" : "%23F2F7F4";
  const shadowColor = theme === "dark" ? "%233f3f46" : "%239ca3af";
  const textColor = theme === "dark" ? "%23C8FF00" : "%2316a34a"; // green-600 vs lime
  
  favicon.href = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='${bgColor}'/%3E%3Ctext x='47' y='72' font-family='sans-serif' font-weight='900' font-size='65' fill='${shadowColor}' text-anchor='middle' letter-spacing='-5'%3Etk%3C/text%3E%3Ctext x='43' y='68' font-family='sans-serif' font-weight='900' font-size='65' fill='${textColor}' text-anchor='middle' letter-spacing='-5'%3Etk%3C/text%3E%3C/svg%3E`;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabInternal] = useState(() => {
    const path = window.location.pathname;
    const tabFromUrl = path.split('/').filter(Boolean)[0];
    return tabFromUrl || "home";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("Semua");
  const [genderFilter, setGenderFilter] = useState("all");
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRoleType>("guest");
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [tutorProfileData, setTutorProfileData] = useState<any | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [tutors, setTutors] = useState<any[]>([]);
  const [isLoadingTutors, setIsLoadingTutors] = useState(true);

  const [theme, setTheme] = useState("light");
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const setActiveTab = (tab: string) => {
    setActiveTabInternal(tab);
    window.history.pushState(null, '', '/' + tab);
  };

  useEffect(() => {
    // Sound playback function
    const playNotificationSound = () => {
      // WA-like notification sound (short soft ping). Using an oscillator for simplicity so we don't need external assets
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // High pitch
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch (e) {
        console.error("Audio playback error", e);
      }
    };

    if (user) {
      const registerPushNotification = async (userId: string) => {
        if (typeof window === "undefined" || !('serviceWorker' in navigator) || !('PushManager' in window)) {
          return;
        }

        try {
          // Register the Service Worker
          const registration = await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;

          // Ask for browser push notifications permission
          if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;
          }

          if (Notification.permission === "granted") {
            // Retrieve server VAPID public key
            const resKey = await fetch('/api/push/key');
            if (!resKey.ok) throw new Error("Gagal mengambil kunci VAPID");
            const { publicKey } = await resKey.json();
            if (!publicKey) return;

            // Convert base64 VAPID key to Uint8Array
            const urlBase64ToUint8Array = (base64String: string) => {
              const padding = '='.repeat((4 - base64String.length % 4) % 4);
              const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
              const rawData = window.atob(base64);
              const outputArray = new Uint8Array(rawData.length);
              for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
              }
              return outputArray;
            };

            const convertedKey = urlBase64ToUint8Array(publicKey);

            // Subscribe via the device's PushManager
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedKey
            });

            // Store subscription in our Express server database
            await fetch('/api/push/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                subscription: subscription
              })
            });
          }
        } catch (err) {
          console.warn("PWA Push Setup Warning:", err);
        }
      };

      registerPushNotification(user.id);

      const showBrowserNotification = (content: string) => {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          let text = content || 'Pesan baru masuk';
          if (text.includes('[SESSION_ID:')) {
            text = "Ada pengajuan/perubahan event jadwal baru.";
          }
          new Notification('TutorKu', {
            body: text
          });
        }
      };

      // Fetch initial unread count
      supabase.from("messages").select("id", { count: "exact" }).eq("receiver_id", user.id).eq("is_read", false)
        .then(({ count }) => {
          if (count !== null) setUnreadChatCount(count);
        });

      // Subscribe to unread messages globally
      const msgSub = supabase
        .channel('global-messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
          (payload: any) => {
             // Avoid playing sound / incrementing if the user is already on the chat tab for this contact
             // But globally, it's safer to just increment and let the Chat component handle marking it as read
             setUnreadChatCount((prev) => prev + 1);
             // Play sound unless activeTab is chat maybe? Play sound generally.
             playNotificationSound();
             showBrowserNotification(payload.new.content);
          }
        )
        // Also listen for UPDATE so count decreases when read
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
          (payload: any) => {
             if (payload.new.is_read && !payload.old.is_read) {
               setUnreadChatCount((prev) => Math.max(0, prev - 1));
             }
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(msgSub);
      };
    } else {
      setUnreadChatCount(0);
    }
  }, [user]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const tabFromUrl = path.split('/').filter(Boolean)[0];
      setActiveTabInternal(tabFromUrl || "home");
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchTutors = async () => {
    try {
      setIsLoadingTutors(true);
      const { data, error } = await supabase.from("tutor_profiles").select(`
          *,
          profiles(full_name, avatar_url, gender),
          tutor_subjects(subject_name)
        `);

      if (error) throw error;

      const mapped = (data || []).map((t: any) => {
        const tags = t.target_subjects || (t.tutor_subjects ? t.tutor_subjects.map((s: any) => s.subject_name) : []);
        const resolvedGender = t.profiles?.gender || t.gender;
        return {
          id: t.id,
          name: t.profiles?.full_name || "Tutor",
          initials: (t.profiles?.full_name || "T")
            .substring(0, 2)
            .toUpperCase(),
          university: t.university || "-",
          major: tags[0] || "Umum",
          rating: Number(t.rating) || 0,
          sessions: t.total_reviews || 0,
          gender: resolvedGender === "P" || resolvedGender === "F" ? "Perempuan" : resolvedGender === "L" || resolvedGender === "M" ? "Laki-laki" : resolvedGender,
          genderCode: resolvedGender === "P" || resolvedGender === "F" ? "F" : "M",
          genderIcon: resolvedGender === "P" || resolvedGender === "F" ? "♀" : "♂",
          genderClass:
            resolvedGender === "P" || resolvedGender === "F"
              ? "bg-[rgba(255,80,160,0.1)] text-[#FF50A0] border-[rgba(255,80,160,0.25)]"
              : "bg-[rgba(80,160,255,0.1)] text-[#50A0FF] border-[rgba(80,160,255,0.25)]",
          online: true,
          rate: t.hourly_rate || 50000,
          price: "Rp " + (t.hourly_rate || 50000).toLocaleString("id-ID"),
          tier: t.is_verified ? "Gold" : "Silver",
          isVerified: t.is_verified,
          tags: tags,
          badges: [],
          bio: t.bio,
          schedule: t.schedule,
          activeDays: t.available_days || [],
        };
      });

      setTutors(mapped);

      // Self-heal database tutor_profiles with 0 or null hourly_rate to 50000
      const zeroRateTutors = (data || []).filter((t: any) => !t.hourly_rate || t.hourly_rate === 0);
      if (zeroRateTutors.length > 0) {
        Promise.all(
          zeroRateTutors.map((t: any) =>
            supabase
              .from("tutor_profiles")
              .update({ hourly_rate: 50000 })
              .eq("id", t.id)
          )
        ).catch((err) => console.error("Self-heal rates failed:", err));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingTutors(false);
    }
  };

  const fetchProfile = async (userId: string, authUser?: User) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const preferredRole = localStorage.getItem("preferredRole");

      if (profile) {
        if (authUser?.email === "njbmaliangkay30@gmail.com" && profile.role !== "admin") {
           profile.role = "admin";
           await supabase.from("profiles").update({ role: "admin" }).eq("id", userId);
        } else if (preferredRole && profile.role !== "admin") {
          const targetRole = preferredRole === "tutor" ? "tutor" : "student";
          if (profile.role !== targetRole) {
            const { error: updateErr } = await supabase
              .from("profiles")
              .update({ role: targetRole })
              .eq("id", userId);
            
            if (!updateErr) {
              profile.role = targetRole;
              if (targetRole === "tutor") {
                await supabase.from("tutor_profiles").upsert({ id: userId });
              } else {
                await supabase.from("student_profiles").upsert({ id: userId });
              }
            }
          }
        }
        localStorage.removeItem("preferredRole");

        setUserProfile(profile);
        if (profile.role === "admin") setUserRole("admin");
        else if (profile.role === "tutor") setUserRole("tutor");
        else setUserRole("siswa");
      } else if (error && error.code === "PGRST116" && authUser) {
        // Not found, auto-create a basic profile for OAuth users
        const authRoleRaw = authUser.user_metadata?.role;
        let authRole = "student";
        if (authUser.email === "njbmaliangkay30@gmail.com") authRole = "admin";
        else if (preferredRole === "tutor") authRole = "tutor";
        else if (preferredRole === "siswa") authRole = "student";
        else if (authRoleRaw === "tutor") authRole = "tutor";
        else if (authRoleRaw === "admin") authRole = "admin";
        
        localStorage.removeItem("preferredRole");

        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            full_name:
              authUser.user_metadata?.full_name ||
              authUser.email?.split("@")[0] ||
              "User",
            role: authRole,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Auto-create profile failed:", insertError);
        }

        if (newProfile) {
          // Also create sub-profile
          if (authRole === "tutor") {
            await supabase.from("tutor_profiles").insert({ id: userId });
          } else if (authRole === "student") {
            await supabase.from("student_profiles").insert({ id: userId });
          }

          setUserProfile(newProfile);
          if (authRole === "admin") setUserRole("admin");
          else if (authRole === "tutor") setUserRole("tutor");
          else setUserRole("siswa");
        }
      }
      
      let finalRole = profile?.role;
      if (error && error.code === "PGRST116" && authUser) {
        // Find what was assigned
        const authRoleRaw = authUser.user_metadata?.role;
        const preferredRole = localStorage.getItem("preferredRole"); // we already removed it, but let's just re-calculate or assume authRole from earlier scope
        
        // Let's just use a refetch to be safe since we just upserted it
        const { data: newFetch } = await supabase.from("profiles").select("role").eq("id", userId).single();
        if (newFetch) finalRole = newFetch.role;
      }
      
      if (finalRole === "tutor") {
        const { data: tutorProf } = await supabase
          .from("tutor_profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (tutorProf) {
          if (!tutorProf.hourly_rate || tutorProf.hourly_rate === 0) {
            // Self-heal logged-in tutor rate as well
            await supabase
              .from("tutor_profiles")
              .update({ hourly_rate: 50000 })
              .eq("id", userId);
            tutorProf.hourly_rate = 50000;
          }
          setTutorProfileData(tutorProf);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("tutorku_theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateFavicon(savedTheme);

    fetchTutors();

    const checkAndSeedPackages = async () => {
      try {
        const { data, error } = await supabase.from("packages").select("id").limit(1);
        if (!error && (!data || data.length === 0)) {
          const defaultPkgs = [
            { name: 'Sesi Satuan', session_count: 1, price: 65000, description: 'Booking satu sesi dulu, cocok untuk percobaan.' },
            { name: 'Paket 4 Pertemuan', session_count: 4, price: 247000, description: '4 sesi, cocok untuk persiapan ulangan.' },
            { name: 'Paket 8 Pertemuan', session_count: 8, price: 468000, description: 'Paket terlaris — belajar rutin, hasil lebih optimal.' },
            { name: 'Paket 12 Pertemuan', session_count: 12, price: 686400, description: 'Untuk persiapan UTBK atau kursus intensif.' }
          ];
          await supabase.from("packages").insert(defaultPkgs);
        }
      } catch (err) {
        console.error("Failed to seed default packages on load:", err);
      }
    };
    checkAndSeedPackages();

    // Initial auth check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      } else {
        setUserRole("guest");
        setUserProfile(null);
        setIsLoadingProfile(false);
      }
    });

    // Listen to changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Also handle cases where OAuth redirection returned an error in the URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const authError =
        hashParams.get("error_description") || hashParams.get("error");

      if (window.opener && authError) {
        window.close();
      } else if (authError && !window.opener) {
        // If we are in the main window and there's an error in the URL (e.g. redirected here)
        setTimeout(
          () => alert("Auth Error: " + decodeURIComponent(authError)),
          500,
        );
        // clean up the hash
        window.history.replaceState(null, "", window.location.pathname);
      }

      // If we are in a popup window (from OAuth) and authentication succeeds, close it
      if (session && window.opener) {
        window.close();
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        setIsLoadingProfile(true);
        fetchProfile(session.user.id, session.user);
      } else {
        setUserRole("guest");
        setUserProfile(null);
        setIsLoadingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("tutorku_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    updateFavicon(newTheme);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        subjectFilter,
        setSubjectFilter,
        genderFilter,
        setGenderFilter,
        selectedTutorId,
        setSelectedTutorId,
        theme,
        toggleTheme,
        userRole,
        setUserRole,
        user,
        userProfile,
        tutorProfileData,
        tutors,
        isLoadingTutors,
        isLoadingProfile,
        targetSessionId,
        setTargetSessionId,
        unreadChatCount,
        fetchTutors,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
