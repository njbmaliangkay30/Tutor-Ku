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
  tutors: any[];
  isLoadingTutors: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("Semua");
  const [genderFilter, setGenderFilter] = useState("all");
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRoleType>("guest");
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  const [tutors, setTutors] = useState<any[]>([]);
  const [isLoadingTutors, setIsLoadingTutors] = useState(true);

  const [theme, setTheme] = useState("light");

  const fetchTutors = async () => {
    try {
      setIsLoadingTutors(true);
      const { data, error } = await supabase.from("tutor_profiles").select(`
          *,
          profiles(full_name, avatar_url),
          tutor_subjects(subject_name)
        `);

      if (error) throw error;

      const mapped = (data || []).map((t) => {
        const tags = t.tutor_subjects
          ? t.tutor_subjects.map((s: any) => s.subject_name)
          : [];
        return {
          id: t.id,
          name: t.profiles?.full_name || "Tutor",
          initials: (t.profiles?.full_name || "T")
            .substring(0, 2)
            .toUpperCase(),
          university: "Universtas Terbuka",
          major: tags[0] || "Umum",
          rating: Number(t.rating) || 0,
          sessions: t.total_reviews || 0,
          gender: t.gender,
          genderCode: t.gender,
          genderIcon: t.gender === "P" || t.gender === "F" ? "♀" : "♂",
          genderClass:
            t.gender === "P" || t.gender === "F"
              ? "bg-[rgba(255,80,160,0.1)] text-[#FF50A0] border-[rgba(255,80,160,0.25)]"
              : "bg-[rgba(80,160,255,0.1)] text-[#50A0FF] border-[rgba(80,160,255,0.25)]",
          online: true,
          rate: t.hourly_rate || 50000,
          price: "Rp " + (t.hourly_rate || 50000).toLocaleString("id-ID"),
          tier: t.is_verified ? "Gold" : "Silver",
          tags: tags,
          badges: [],
          bio: t.bio,
          activeDays: t.available_days || [],
        };
      });

      setTutors(mapped);
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
        if (preferredRole && profile.role !== "admin") {
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
        if (preferredRole === "tutor") authRole = "tutor";
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
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("tutorku_theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    fetchTutors();

    // Initial auth check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      } else {
        setUserRole("guest");
        setUserProfile(null);
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
        fetchProfile(session.user.id, session.user);
      } else {
        setUserRole("guest");
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("tutorku_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
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
        tutors,
        isLoadingTutors,
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
