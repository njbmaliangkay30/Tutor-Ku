import React, { useState, useEffect } from "react";
import {
  Home,
  Search,
  BookOpen,
  Settings,
  Moon,
  Sun,
  UserPlus,
  LogIn,
  Calendar,
  Activity,
  BarChart2,
  CheckSquare,
} from "lucide-react";
import { PageHome } from "./pages/Home";
import { Search as PageSearch } from "./pages/Search";
import { DaftarTutor as PageDaftarTutor } from "./pages/DaftarTutor";
import { Login as PageLogin } from "./pages/Login";
import { Profile as PageProfile } from "./pages/Profile";
import { TutorDetail } from "./pages/TutorDetail";
import { TutorDashboard } from "./pages/TutorDashboard";
import { TutorSchedule } from "./pages/TutorSchedule";
import { TutorSessions } from "./pages/TutorSessions";
import { StudentSessions } from "./pages/StudentSessions";
import { StudentProgress } from "./pages/StudentProgress";
import { useAppContext } from "./AppContext";

export default function App() {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    selectedTutorId,
    userRole,
    setUserRole,
  } = useAppContext();

  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768) {
      if (e.clientX < 40) {
        setShowDesktopSidebar(true);
      } else if (e.clientX > 280) {
        setShowDesktopSidebar(false);
      }
    }
  };

  useEffect(() => {
    let timeoutId: number;
    // Hide sidebar after a short delay if mouse isn't near the left edge, to ensure it doesn't stay open forever if they don't move the mouse.
    if (window.innerWidth >= 768 && showDesktopSidebar) {
      timeoutId = window.setTimeout(() => {
        // If mouse is outside, hide it. But we don't have global mouse pos here easily.
        // We rely on handleMouseMove instead.
      }, 2000);
    }
    return () => clearTimeout(timeoutId);
  }, [showDesktopSidebar]);

  return (
    <div
      className="flex h-screen overflow-hidden bg-bg-base text-text-main font-body flex-col md:flex-row"
      onMouseMove={handleMouseMove}
    >
      <div
        id="brand-blob-br"
        className="fixed pointer-events-none z-0 w-[500px] h-[500px] rounded-full -bottom-[100px] -right-[100px] blur-[80px]"
        style={{
          background:
            "radial-gradient(circle at center, var(--color-lime-mid) 0%, transparent 70%)",
        }}
      ></div>
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-primary-dim) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      ></div>
      <div
        className="fixed pointer-events-none z-0 w-[600px] h-[600px] rounded-full -top-[120px] -left-[80px] blur-[80px]"
        style={{
          background:
            "radial-gradient(circle at center, var(--color-primary-dim) 0%, transparent 70%)",
        }}
      ></div>

      <div className="flex h-screen w-full relative z-10 flex-col md:flex-row">
        {/* Sidebar (Desktop) */}
        <aside
          className={`hidden md:flex shrink-0 bg-bg-2/80 backdrop-blur-xl border-r-[2px] border-border/60 flex-col relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${showDesktopSidebar ? "w-[260px]" : "w-[80px]"}`}
        >
          {/* Brand */}
          <div className="h-[72px] px-5 border-b-[2px] border-border/60 shrink-0 flex items-center justify-between overflow-hidden relative">
            <div
              className="flex items-center w-full relative cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setActiveTab("home")}
              onDoubleClick={() => {
                setUserRole("admin");
                setActiveTab("admin");
              }}
            >
              <div
                className={`absolute left-0 font-display text-[26px] font-extrabold text-lime tracking-[-1px] leading-none transition-all duration-300 origin-left ${showDesktopSidebar ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
                style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
              >
                tk
              </div>
              <div
                className={`absolute left-0 font-display text-[26px] font-extrabold text-lime tracking-[-1px] leading-none transition-all duration-300 origin-left ${showDesktopSidebar ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
                style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
              >
                tutorku
              </div>
            </div>
            <div
              onClick={toggleTheme}
              className={`relative cursor-pointer w-[44px] h-[24px] rounded-[12px] bg-border-2 border-[1.5px] border-border transition-all duration-300 shrink-0 flex items-center p-[2px] ${showDesktopSidebar ? "opacity-100" : "opacity-0 translate-x-4 pointer-events-none"}`}
            >
              <div
                className={`w-[18px] h-[18px] rounded-full bg-lime transition-transform ${theme === "light" ? "translate-x-[20px]" : "translate-x-0"}`}
              />
              <span
                className={`absolute text-[11px] top-1/2 -translate-y-1/2 pointer-events-none text-black ${theme === "light" ? "left-[5px]" : "right-[5px]"}`}
              >
                {theme === "light" ? "☀️" : "🌙"}
              </span>
            </div>
          </div>

          <div
            className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar px-3 py-3 gap-1.5 overflow-x-hidden`}
          >
            <div
              className={`text-[9px] font-bold text-text-muted tracking-[0.12em] uppercase pt-1 pb-[3px] font-mono transition-all duration-300 ${showDesktopSidebar ? "opacity-100 px-2" : "opacity-0 h-0 p-0 text-center"}`}
            >
              {showDesktopSidebar ? "Menu Utama" : ""}
            </div>

            {userRole === "tutor" ? (
              <>
                <button
                  onClick={() => setActiveTab("home")}
                  title="Dashboard"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "home" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <Home size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Dashboard
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("schedule")}
                  title="Jadwal"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "schedule" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <Calendar size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Schedule
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("sessions")}
                  title="Sesi"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "sessions" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <BookOpen size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Sessions
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab("home")}
                  title="Explore"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "home" || activeTab === "search" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <Search size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Explore
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("student_sessions")}
                  title="Sesi Saya"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "student_sessions" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <Calendar size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Sessions
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("progress")}
                  title="Progress"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "progress" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <Activity size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Progress
                  </span>
                </button>
              </>
            )}
          </div>

          <div
            className={`px-3 py-3 border-t-[1.5px] border-border/60 transition-all duration-300 overflow-hidden shrink-0 ${showDesktopSidebar ? "opacity-100" : "opacity-100"}`}
          >
            <button
              onClick={() => setActiveTab("login")}
              title={userRole === "guest" ? "Masuk / Daftar" : "Profil"}
              className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "login" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
            >
              <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                {userRole === "guest" ? (
                  <LogIn size={22} />
                ) : (
                  <div className="w-[22px] h-[22px] rounded-full bg-[#1A3A28] border-2 border-lime/30 text-lime flex items-center justify-center text-[10px] font-bold font-display leading-none shadow-[0_0_8px_rgba(200,255,0,0.1)]">
                    AR
                  </div>
                )}
              </span>
              <span
                className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
              >
                {userRole === "guest" ? "Masuk / Daftar" : "Profil Saya"}
              </span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          {/* Topbar (Mobile Only) */}
          <div className="flex md:hidden h-[56px] py-1 bg-bg-2/80 backdrop-blur-xl items-center justify-between px-4 shrink-0 border-b border-border/60 relative z-50">
            <div
              className="font-display text-[22px] font-extrabold text-lime tracking-[-1px] select-none cursor-pointer"
              onClick={() => setActiveTab("home")}
              onDoubleClick={() => {
                setUserRole("admin");
                setActiveTab("admin");
              }}
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}
            >
              tutorku
            </div>
            <div className="flex gap-2 items-center">
              <button
                className="w-[34px] h-[34px] bg-bg-3/80 rounded-lg border-[1.5px] border-border/60 flex items-center justify-center text-[16px] text-text-sub transition-all hover:border-lime hover:text-lime"
                onClick={toggleTheme}
              >
                {theme === "light" ? "🌙" : "☀️"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative z-10 custom-scrollbar">
            {activeTab === "home" && userRole === "tutor" && <TutorDashboard />}
            {activeTab === "schedule" && userRole === "tutor" && (
              <TutorSchedule />
            )}
            {activeTab === "sessions" && userRole === "tutor" && (
              <TutorSessions />
            )}

            {activeTab === "home" && userRole !== "tutor" && <PageHome />}
            {activeTab === "search" && userRole !== "tutor" && <PageSearch />}
            {activeTab === "student_sessions" && userRole !== "tutor" && (
              <StudentSessions />
            )}
            {activeTab === "progress" && userRole !== "tutor" && (
              <StudentProgress />
            )}

            {activeTab === "daftar-tutor" && <PageDaftarTutor />}
            {activeTab === "login" && userRole === "guest" && <PageLogin />}
            {activeTab === "login" && userRole !== "guest" && <PageProfile />}

            {userRole === "admin" && activeTab === "admin" && (
              <div className="p-6 text-center text-text-sub mt-20 animate-pgIn font-mono">
                <h2 className="text-xl font-bold text-red-500 mb-2">
                  ADMIN PANEL
                </h2>
                <p>
                  User Management · Tutor Verification · Escrow & Payments ·
                  Session Reports · Analytics
                </p>
              </div>
            )}
          </div>

          {/* Bottom Nav (Mobile Only) */}
          <nav className="flex md:hidden h-[64px] bg-bg-2/80 backdrop-blur-xl border-t border-border/60 pt-1.5 shrink-0 relative z-50 justify-around pb-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
            {userRole === "tutor" ? (
              <>
                <button
                  onClick={() => setActiveTab("home")}
                  className={`flex flex-col items-center gap-[3px] bg-transparent border-none cursor-pointer pb-1 transition-all flex-1 ${activeTab === "home" ? "text-lime font-bold" : "text-text-sub font-medium hover:text-text-main"}`}
                >
                  <span
                    className={`w-10 h-7 flex items-center justify-center rounded-lg transition-all text-[20px] ${activeTab === "home" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Home size={18} />
                  </span>
                  <span className="text-[10px] font-mono">Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab("schedule")}
                  className={`flex flex-col items-center gap-[3px] bg-transparent border-none cursor-pointer pb-1 transition-all flex-1 ${activeTab === "schedule" ? "text-lime font-bold" : "text-text-sub font-medium hover:text-text-main"}`}
                >
                  <span
                    className={`w-10 h-7 flex items-center justify-center rounded-lg transition-all text-[20px] ${activeTab === "schedule" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Calendar size={18} />
                  </span>
                  <span className="text-[10px] font-mono">Schedule</span>
                </button>
                <button
                  onClick={() => setActiveTab("sessions")}
                  className={`flex flex-col items-center gap-[3px] bg-transparent border-none cursor-pointer pb-1 transition-all flex-1 ${activeTab === "sessions" ? "text-lime font-bold" : "text-text-sub font-medium hover:text-text-main"}`}
                >
                  <span
                    className={`w-10 h-7 flex items-center justify-center rounded-lg transition-all text-[20px] ${activeTab === "sessions" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <BookOpen size={18} />
                  </span>
                  <span className="text-[10px] font-mono">Sessions</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab("home")}
                  className={`flex flex-col items-center gap-[3px] bg-transparent border-none cursor-pointer pb-1 transition-all flex-1 ${activeTab === "home" || activeTab === "search" ? "text-lime font-bold" : "text-text-sub font-medium hover:text-text-main"}`}
                >
                  <span
                    className={`w-10 h-7 flex items-center justify-center rounded-lg transition-all text-[20px] ${activeTab === "home" || activeTab === "search" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Search size={18} />
                  </span>
                  <span className="text-[10px] font-mono">Explore</span>
                </button>
                <button
                  onClick={() => setActiveTab("student_sessions")}
                  className={`flex flex-col items-center gap-[3px] bg-transparent border-none cursor-pointer pb-1 transition-all flex-1 ${activeTab === "student_sessions" ? "text-lime font-bold" : "text-text-sub font-medium hover:text-text-main"}`}
                >
                  <span
                    className={`w-10 h-7 flex items-center justify-center rounded-lg transition-all text-[20px] ${activeTab === "student_sessions" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Calendar size={18} />
                  </span>
                  <span className="text-[10px] font-mono">Sessions</span>
                </button>
                <button
                  onClick={() => setActiveTab("progress")}
                  className={`flex flex-col items-center gap-[3px] bg-transparent border-none cursor-pointer pb-1 transition-all flex-1 ${activeTab === "progress" ? "text-lime font-bold" : "text-text-sub font-medium hover:text-text-main"}`}
                >
                  <span
                    className={`w-10 h-7 flex items-center justify-center rounded-lg transition-all text-[20px] ${activeTab === "progress" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Activity size={18} />
                  </span>
                  <span className="text-[10px] font-mono">Progress</span>
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab("login")}
              className={`flex flex-col items-center gap-[3px] bg-transparent border-none cursor-pointer pb-1 transition-all flex-1 ${activeTab === "login" ? "text-lime font-bold" : "text-text-sub font-medium hover:text-text-main"}`}
            >
              <span
                className={`w-10 h-7 flex items-center justify-center rounded-lg transition-all text-[20px] ${activeTab === "login" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
              >
                {userRole === "guest" ? (
                  <LogIn size={18} />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full bg-[#1A3A28] border border-border text-white flex items-center justify-center text-[9px] font-bold font-display leading-none">
                    AR
                  </div>
                )}
              </span>
              <span className="text-[10px] font-mono">
                {userRole === "guest" ? "Masuk" : "Profil"}
              </span>
            </button>
          </nav>

          {selectedTutorId && (
            <div className="absolute inset-0 z-50 bg-bg-base overflow-y-auto animate-pgIn custom-scrollbar">
              <TutorDetail />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
