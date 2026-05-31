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
  Users,
  ShieldCheck,
  CreditCard,
  Package,
  DollarSign,
  Clock,
  Star,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHome } from "./pages/Home";
import { Search as PageSearch } from "./pages/Search";
import { DaftarTutor as PageDaftarTutor } from "./pages/DaftarTutor";
import { Login as PageLogin } from "./pages/Login";
import { Profile as PageProfile } from "./pages/Profile";
import { TutorDetail } from "./pages/TutorDetail";
import { TutorDashboard } from "./pages/TutorDashboard";
import { TutorSchedule } from "./pages/TutorSchedule";
import { TutorSessions } from "./pages/TutorSessions";
import { TutorHistory } from "./pages/TutorHistory";
import { StudentSessions } from "./pages/StudentSessions";
import { StudentProgress } from "./pages/StudentProgress";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminPanel } from "./pages/admin/AdminPanel";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { AdminRateRequests } from "./pages/admin/AdminRateRequests";
import { Chat } from "./pages/Chat";
import { OnboardingForm } from "./components/OnboardingForm";
import { UnverifiedTutorView } from "./components/UnverifiedTutorView";
import { VerificationForm } from "./components/VerificationForm";
import { useAppContext } from "./AppContext";
import { NotificationBell } from "./components/NotificationBell";
import { StudentDashboard } from "./pages/StudentDashboard";
import { GuidedTour } from "./components/GuidedTour";

export default function App() {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    selectedTutorId,
    setSelectedTutorId,
    userRole,
    setUserRole,
    user,
    userProfile,
    tutorProfileData,
    isLoadingProfile,
    unreadChatCount,
  } = useAppContext();

  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true);

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    if (selectedTutorId) {
      setSelectedTutorId(null);
    }
  };

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
      <GuidedTour />
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
              className="flex items-center w-full relative cursor-pointer group hover:opacity-90 transition-opacity"
              onClick={() => handleNav("home")}
              title="Dashboard"
            >
              <div
                className={`absolute left-0 transition-transform duration-300 origin-left ${showDesktopSidebar ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
              >
                <div className="relative font-display font-extrabold text-[26px] tracking-[-1px] leading-none z-10 select-none text-lime" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
                  tk
                </div>
              </div>
              <div
                className={`absolute left-0 font-display text-[26px] font-extrabold text-lime tracking-[-1px] leading-none transition-all duration-300 origin-left ${showDesktopSidebar ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
                style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
              >
                tutorku
              </div>
            </div>
            <div className={`flex items-center gap-3 transition-opacity duration-300 ${showDesktopSidebar ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <div
                onClick={toggleTheme}
                className="relative cursor-pointer w-[44px] h-[24px] rounded-[12px] bg-border-2 border-[1.5px] border-border shrink-0 flex items-center p-[2px]"
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
                  onClick={() => handleNav("home")}
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
                  onClick={() => handleNav("schedule")}
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
                  onClick={() => handleNav("sessions")}
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
                <button
                  onClick={() => handleNav("chat")}
                  title="Pesan"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "chat" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all relative">
                    <MessageSquare size={22} />
                    {unreadChatCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-bg-1 flex items-center justify-center">{unreadChatCount}</span>
                    )}
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Pesan
                  </span>
                </button>
                <button
                  onClick={() => handleNav("history")}
                  title="History"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "history" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <Clock size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    History
                  </span>
                </button>
              </>
            ) : userRole === "admin" ? (
              <>
                <button
                  onClick={() => handleNav("home")}
                  title="Overview"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "home" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <Home size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Overview
                  </span>
                </button>
                
                <button
                  onClick={() => handleNav("admin-tutors")}
                  title="Data Tutor"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "admin-tutors" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <BookOpen size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Data Tutor
                  </span>
                </button>
                <button
                  onClick={() => handleNav("admin-verifications")}
                  title="Data Verifikasi"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "admin-verifications" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <ShieldCheck size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Data Verifikasi
                  </span>
                </button>
                <button
                  onClick={() => handleNav("admin-rate-requests")}
                  title="Pengajuan Harga"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "admin-rate-requests" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <DollarSign size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Pengajuan Harga
                  </span>
                </button>
                <button
                  onClick={() => handleNav("admin-students")}
                  title="Data Student"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "admin-students" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <Users size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Data Student
                  </span>
                </button>
                <button
                  onClick={() => handleNav("admin-transactions")}
                  title="Transaksi"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "admin-transactions" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <CreditCard size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Transaksi
                  </span>
                </button>
                <button
                  onClick={() => handleNav("admin-packages")}
                  title="Package"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "admin-packages" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <Package size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Package
                  </span>
                </button>
                <button
                  onClick={() => handleNav("admin-sessions")}
                  title="Sesi Belajar"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "admin-sessions" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <Calendar size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Sesi Belajar
                  </span>
                </button>
                <button
                  onClick={() => handleNav("admin-reviews")}
                  title="Review Tutor"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "admin-reviews" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                >
                  <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                    <Star size={22} />
                  </span>
                  <span
                    className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  >
                    Review Tutor
                  </span>
                </button>
              </>
            ) : (
              <>
                {userRole === "siswa" && (
                  <button
                    onClick={() => handleNav("home")}
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
                )}
                <button
                  onClick={() => handleNav("search")}
                  title="Explore"
                  className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden tour-explore-desktop ${(activeTab === "search" || (activeTab === "home" && userRole === "guest")) ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
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
                  onClick={() => handleNav("student_sessions")}
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
                {userRole !== "guest" && (
                  <button
                    onClick={() => handleNav("chat")}
                    title="Pesan"
                    className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] w-full text-left text-xs tracking-[0.01em] relative overflow-hidden ${activeTab === "chat" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
                  >
                    <span className="flex items-center justify-center shrink-0 w-[22px] transition-all relative">
                      <MessageSquare size={22} />
                      {unreadChatCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-bg-1 flex items-center justify-center">{unreadChatCount}</span>
                      )}
                    </span>
                    <span
                      className={`absolute left-[44px] whitespace-nowrap transition-all duration-300 ${showDesktopSidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                    >
                      Pesan
                    </span>
                  </button>
                )}
                <button
                  onClick={() => handleNav("progress")}
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
            className={`px-3 py-3 border-t-[1.5px] border-border/60 transition-all duration-300 shrink-0 flex ${showDesktopSidebar ? "flex-row items-center gap-2" : "flex-col items-center gap-3"}`}
          >
            <div className="shrink-0">
              <NotificationBell id="sidebar" />
            </div>
            <button
              onClick={() => handleNav(user ? "profile" : "login")}
              title={userRole === "guest" ? "Masuk / Daftar" : "Profil"}
              className={`flex items-center rounded-lg cursor-pointer transition-colors px-[11px] py-[11px] border-[1.5px] min-w-0 flex-1 text-left text-xs tracking-[0.01em] relative ${showDesktopSidebar ? "overflow-hidden" : "w-[44px]"} ${activeTab === "login" || activeTab === "profile" ? "bg-lime-mid text-lime font-bold border-lime" : "bg-transparent text-text-sub font-semibold border-transparent hover:text-text-main hover:bg-bg-3 hover:border-border"}`}
            >
              <span className="flex items-center justify-center shrink-0 w-[22px] transition-all">
                {userRole === "guest" ? (
                  <LogIn size={22} />
                ) : (
                  userProfile?.avatar_url || user?.user_metadata?.avatar_url ? (
                    <img 
                      src={userProfile?.avatar_url || user?.user_metadata?.avatar_url} 
                      alt="Avatar" 
                      className="w-[22px] h-[22px] rounded-full border border-lime/30 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-[22px] h-[22px] rounded-full bg-[#1A3A28] border-2 border-lime/30 text-lime flex items-center justify-center text-[10px] font-bold font-display leading-none shadow-[0_0_8px_rgba(200,255,0,0.1)]">
                      {(userProfile?.full_name || user?.user_metadata?.full_name || "U").substring(0, 2).toUpperCase()}
                    </div>
                  )
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
          {/* Temporary Dev/Preview Admin Toggle Removed */}
          {/* Topbar (Mobile Only) */}
          <div className="flex md:hidden h-[60px] py-2 bg-bg-2/80 backdrop-blur-xl items-center justify-between px-4 shrink-0 border-b border-border/60 relative z-50">
            <div
              className="font-display text-[22px] font-extrabold text-lime tracking-[-1px] select-none cursor-pointer"
              onClick={() => handleNav("home")}
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}
            >
              tutorku
            </div>
            <div className="flex gap-2.5 items-center">
              <button
                className="w-10 h-10 bg-bg-3/80 rounded-full border-[1.5px] border-border/60 flex items-center justify-center text-[18px] text-text-sub transition-all hover:border-lime hover:text-lime"
                onClick={toggleTheme}
              >
                {theme === "light" ? "🌙" : "☀️"}
              </button>
              <div className="w-px h-6 bg-border mx-0.5" />
              <NotificationBell id="mobile" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative custom-scrollbar">
            {isLoadingProfile ? (
              <div className="w-full h-full flex items-center justify-center">
                 <div className="w-8 h-8 rounded-full border-4 border-lime/30 border-t-lime animate-spin"></div>
              </div>
            ) : user && userProfile && !userProfile.phone && userRole !== "guest" ? (
              <div className="w-full h-full" />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  {userRole === "tutor" && tutorProfileData?.is_verified !== true ? (
                    <>
                      {activeTab === "home" && <VerificationForm />}
                      {["schedule", "sessions", "history"].includes(activeTab) && <UnverifiedTutorView />}
                    </>
                  ) : (
                    <>
                      {activeTab === "home" && userRole === "tutor" && <TutorDashboard />}
                      {activeTab === "schedule" && userRole === "tutor" && <TutorSchedule />}
                      {activeTab === "sessions" && userRole === "tutor" && <TutorSessions />}
                      {activeTab === "history" && userRole === "tutor" && <TutorHistory />}
                    </>
                  )}

                  {/* Other roles */}
                  {activeTab === "home" && userRole === "guest" && <PageHome />}
                  {activeTab === "home" && userRole === "siswa" && <StudentDashboard />}
                  
                  {(activeTab === "search" || activeTab === "explore") && userRole !== "tutor" && userRole !== "admin" && <PageSearch />}
                  {activeTab === "student_sessions" && userRole !== "tutor" && userRole !== "admin" && (
                    <StudentSessions />
                  )}
                  {activeTab === "progress" && userRole !== "tutor" && userRole !== "admin" && (
                    <StudentProgress />
                  )}
                  {activeTab === "chat" && (
                    <Chat />
                  )}

                  {activeTab === "daftar-tutor" && <PageDaftarTutor />}
                  {(activeTab === "login" || activeTab === "profile") && (
                    userRole === "guest" ? <PageLogin /> : <PageProfile />
                  )}

                  {activeTab === "home" && userRole === "admin" && (
                    <AdminOverview />
                  )}
                  {activeTab === "admin-tutors" && userRole === "admin" && (
                    <AdminPanel activeSubTab="tutors" />
                  )}
                  {activeTab === "admin-verifications" && userRole === "admin" && (
                    <AdminDashboard /> 
                  )}
                  {activeTab === "admin-rate-requests" && userRole === "admin" && (
                    <AdminRateRequests /> 
                  )}
                  {activeTab === "admin-students" && userRole === "admin" && (
                    <AdminPanel activeSubTab="students" />
                  )}
                  {activeTab === "admin-transactions" && userRole === "admin" && (
                    <AdminPanel activeSubTab="transactions" />
                  )}
                  {activeTab === "admin-sessions" && userRole === "admin" && (
                    <AdminPanel activeSubTab="sessions" />
                  )}
                  {activeTab === "admin-packages" && userRole === "admin" && (
                    <AdminPanel activeSubTab="packages" />
                  )}
                  {activeTab === "admin-reviews" && userRole === "admin" && (
                    <AdminPanel activeSubTab="reviews" />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

      {/* Bottom Nav (Mobile Only) */}
          <nav className="flex md:hidden h-[72px] bg-bg-2/95 backdrop-blur-2xl border-t border-border/60 pt-2 shrink-0 relative z-50 overflow-x-auto overflow-y-hidden no-scrollbar pb-[14px] shadow-[0_-10px_30px_rgba(0,0,0,0.08)] items-center gap-2 px-4 sticky bottom-0">
            {userRole === "tutor" ? (
              <>
                <button
                  onClick={() => handleNav("home")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all flex-1 min-w-[70px] ${activeTab === "home" ? "text-lime scale-105" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "home" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Home size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "home" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Dash</span>
                </button>
                <button
                  onClick={() => handleNav("schedule")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all flex-1 min-w-[70px] ${activeTab === "schedule" ? "text-lime scale-105" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "schedule" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Calendar size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "schedule" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Jadwal</span>
                </button>
                <button
                  onClick={() => handleNav("sessions")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all flex-1 min-w-[70px] ${activeTab === "sessions" ? "text-lime scale-105" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "sessions" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <BookOpen size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "sessions" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Sesi</span>
                </button>
                <button
                  onClick={() => handleNav("chat")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all flex-1 min-w-[70px] ${activeTab === "chat" ? "text-lime scale-105" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative ${activeTab === "chat" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <MessageSquare size={22} />
                    {unreadChatCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-[1.5px] border-bg-1 flex items-center justify-center">{unreadChatCount}</span>
                    )}
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "chat" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Pesan</span>
                </button>
                <button
                  onClick={() => handleNav("history")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all flex-1 min-w-[70px] ${activeTab === "history" ? "text-lime scale-105" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "history" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Clock size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "history" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>History</span>
                </button>
              </>
            ) : userRole === "admin" ? (
              <>
                <button
                  onClick={() => handleNav("home")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all shrink-0 min-w-[72px] ${activeTab === "home" ? "text-lime scale-105 font-bold" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "home" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Home size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "home" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Info</span>
                </button>
                <button
                  onClick={() => handleNav("admin-tutors")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all shrink-0 min-w-[72px] ${activeTab === "admin-tutors" ? "text-lime scale-105 font-bold" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "admin-tutors" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <BookOpen size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "admin-tutors" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Tutor</span>
                </button>
                <button
                  onClick={() => handleNav("admin-verifications")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all shrink-0 min-w-[72px] ${activeTab === "admin-verifications" ? "text-lime scale-105 font-bold" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "admin-verifications" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <ShieldCheck size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "admin-verifications" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Verif</span>
                </button>
                <button
                  onClick={() => handleNav("admin-rate-requests")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all shrink-0 min-w-[72px] ${activeTab === "admin-rate-requests" ? "text-lime scale-105 font-bold" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "admin-rate-requests" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <DollarSign size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "admin-rate-requests" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Harga</span>
                </button>
                <button
                  onClick={() => handleNav("admin-students")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all shrink-0 min-w-[72px] ${activeTab === "admin-students" ? "text-lime scale-105 font-bold" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "admin-students" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Users size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "admin-students" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Siswa</span>
                </button>
                <button
                  onClick={() => handleNav("admin-sessions")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all shrink-0 min-w-[72px] ${activeTab === "admin-sessions" ? "text-lime scale-105 font-bold" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "admin-sessions" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Calendar size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "admin-sessions" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Sesi</span>
                </button>
                <button
                  onClick={() => handleNav("admin-transactions")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all shrink-0 min-w-[72px] ${activeTab === "admin-transactions" ? "text-lime scale-105 font-bold" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "admin-transactions" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <CreditCard size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "admin-transactions" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Bayar</span>
                </button>
                <button
                  onClick={() => handleNav("admin-packages")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all shrink-0 min-w-[72px] ${activeTab === "admin-packages" ? "text-lime scale-105 font-bold" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "admin-packages" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Package size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "admin-packages" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Paket</span>
                </button>
                <button
                  onClick={() => handleNav("admin-reviews")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all shrink-0 min-w-[72px] ${activeTab === "admin-reviews" ? "text-lime scale-105 font-bold" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "admin-reviews" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Star size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "admin-reviews" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Ulasan</span>
                </button>
              </>
            ) : (
              <>
                {userRole === "siswa" && (
                  <button
                    onClick={() => handleNav("home")}
                    className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all flex-1 min-w-[70px] ${activeTab === "home" ? "text-lime scale-105" : "text-text-sub opacity-70"}`}
                  >
                    <span
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "home" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                    >
                      <Home size={22} />
                    </span>
                    <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "home" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Dash</span>
                  </button>
                )}
                <button
                  onClick={() => handleNav(userRole === "guest" ? "home" : "search")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all flex-1 min-w-[70px] tour-explore-mobile ${(activeTab === "search" || (activeTab === "home" && userRole === "guest")) ? "text-lime scale-105" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${(activeTab === "search" || (activeTab === "home" && userRole === "guest")) ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Search size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${(activeTab === "search" || (activeTab === "home" && userRole === "guest")) ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Explore</span>
                </button>
                <button
                  onClick={() => handleNav("student_sessions")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all flex-1 min-w-[70px] ${activeTab === "student_sessions" ? "text-lime scale-105" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "student_sessions" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Calendar size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "student_sessions" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Sesi</span>
                </button>
                {userRole !== "guest" && (
                  <button
                    onClick={() => handleNav("chat")}
                    className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all flex-1 min-w-[70px] ${activeTab === "chat" ? "text-lime scale-105" : "text-text-sub opacity-70"}`}
                  >
                    <span
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative ${activeTab === "chat" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                    >
                      <MessageSquare size={22} />
                      {unreadChatCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-[1.5px] border-bg-1 flex items-center justify-center">{unreadChatCount}</span>
                      )}
                    </span>
                    <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "chat" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Pesan</span>
                  </button>
                )}
                <button
                  onClick={() => handleNav("progress")}
                  className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all flex-1 min-w-[70px] ${activeTab === "progress" ? "text-lime scale-105" : "text-text-sub opacity-70"}`}
                >
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "progress" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
                  >
                    <Activity size={22} />
                  </span>
                  <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "progress" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Progres</span>
                </button>
              </>
            )}
            <button
              onClick={() => handleNav(user ? "profile" : "login")}
              className={`flex flex-col items-center gap-[4px] bg-transparent border-none cursor-pointer transition-all ${userRole === "admin" ? "shrink-0 min-w-[72px]" : "flex-1 min-w-[70px]"} ${activeTab === "login" || activeTab === "profile" ? "text-lime scale-105" : "text-text-sub opacity-70"}`}
            >
              <span
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "login" || activeTab === "profile" ? "bg-lime-mid text-lime" : "text-text-sub"}`}
              >
                {userRole === "guest" ? (
                  <LogIn size={22} />
                ) : (
                  userProfile?.avatar_url || user?.user_metadata?.avatar_url ? (
                    <img 
                      src={userProfile?.avatar_url || user?.user_metadata?.avatar_url} 
                      alt="Avatar" 
                      className="w-[22px] h-[22px] rounded-full border-2 border-lime/20 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-[22px] h-[22px] rounded-full bg-[#1A3A28] border-2 border-lime/20 text-lime flex items-center justify-center text-[10px] font-bold font-display leading-none">
                      {(userProfile?.full_name || user?.user_metadata?.full_name || "U").substring(0, 1).toUpperCase()}
                    </div>
                  )
                )}
              </span>
              <span className={`text-[10px] font-bold font-mono tracking-tight uppercase ${activeTab === "login" || activeTab === "profile" ? "opacity-100 font-bold text-lime" : "opacity-70"}`}>Profil</span>
            </button>
          </nav>

          {selectedTutorId && (
            <div className="fixed md:absolute inset-0 z-[100] md:z-50 bg-bg-base overflow-y-auto animate-pgIn custom-scrollbar">
              <TutorDetail />
            </div>
          )}

          {user && userProfile && !userProfile.phone && userRole !== "guest" && (
            <OnboardingForm />
          )}
        </main>
      </div>
    </div>
  );
}
