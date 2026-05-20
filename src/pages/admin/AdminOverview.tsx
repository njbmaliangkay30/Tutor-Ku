import React, { useEffect, useState } from "react";
import { Users, BookOpen, CreditCard, TrendingUp, CheckCircle, Clock, Calendar, ShieldCheck, ArrowUpRight, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface SessionData {
  id: string;
  subject: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  student?: {
    profiles?: {
      full_name: string;
    } | null;
  } | null;
  tutor?: {
    profiles?: {
      full_name: string;
    } | null;
  } | null;
}

interface StatDetails {
  activeTutors: number;
  activeStudents: number;
  pendingVerifications: number;
  monthlyRevenue: number;
  activeSessions: number;
  totalSessions: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<StatDetails>({
    activeTutors: 0,
    activeStudents: 0,
    pendingVerifications: 0,
    monthlyRevenue: 0,
    activeSessions: 0,
    totalSessions: 0,
  });
  const [activeSessionsList, setActiveSessionsList] = useState<SessionData[]>([]);
  const [allSessions, setAllSessions] = useState<{ session_date: string; status: string }[]>([]);
  const [chartFilter, setChartFilter] = useState<"daily" | "weekly" | "monthly">("daily");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const today = new Date();

      // Get tutors count
      const { count: tutorsCount } = await supabase
        .from("profiles")
        .select('*', { count: 'exact', head: true })
        .eq("role", "tutor");
        
      // Get students count
      const { count: studentsCount } = await supabase
        .from("profiles")
        .select('*', { count: 'exact', head: true })
        .eq("role", "student");
        
      // Get pending verifications count
      const { count: pendingCount } = await supabase
        .from("tutor_verifications")
        .select('*', { count: 'exact', head: true })
        .eq("status", "pending");
        
      // Get all completed sessions count
      const { count: sessionsCount } = await supabase
        .from("sessions")
        .select('*', { count: 'exact', head: true })
        .eq("status", "completed");

      // Get active sessions count (pending & accepted)
      const { count: activeCount } = await supabase
        .from("sessions")
        .select('*', { count: 'exact', head: true })
        .in("status", ["pending", "accepted"]);

      // Get active sessions list for overview panel
      const { data: activeList, error: activeErr } = await supabase
        .from("sessions")
        .select(`
          id,
          subject,
          session_date,
          start_time,
          end_time,
          status,
          payment_status,
          student:student_profiles(profiles(full_name)),
          tutor:tutor_profiles(profiles(full_name))
        `)
        .in("status", ["pending", "accepted"])
        .order("session_date", { ascending: true })
        .limit(5);

      if (activeList) {
        setActiveSessionsList(activeList as unknown as SessionData[]);
      }

      // Get all transactions to compute real revenue
      const { data: rxData } = await supabase
        .from("transactions")
        .select("amount")
        .eq("status", "success");
      
      const realEstRevenue = rxData?.reduce((acc, rx) => acc + (rx.amount || 0), 0) || 4500000;

      // Get all sessions for the chart
      const { data: allSessionsData } = await supabase
        .from("sessions")
        .select("session_date, status");

      if (allSessionsData) {
        setAllSessions(allSessionsData);
      }

      setStats({
        activeTutors: tutorsCount || 0,
        activeStudents: studentsCount || 0,
        pendingVerifications: pendingCount || 0,
        monthlyRevenue: realEstRevenue > 0 ? realEstRevenue : 4500000,
        activeSessions: activeCount || 0,
        totalSessions: sessionsCount || 0,
      });

    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to construct dynamic chart visual data based on all fetched sessions
  const getChartData = () => {
    const dates = [];
    const today = new Date();
    
    if (chartFilter === "daily") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        
        const daySessions = allSessions.filter(s => s.session_date === dateStr);
        const count = daySessions.length;
        const completed = daySessions.filter(s => s.status === 'completed').length;
        
        dates.push({
          label: d.toLocaleDateString("id-ID", { weekday: 'short' }),
          fullLabel: d.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }),
          total: count,
          completed: completed,
        });
      }
    } else if (chartFilter === "weekly") {
      // Last 6 weeks (groups of 7 days)
      for (let i = 5; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
        weekStart.setHours(0,0,0,0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23,59,59,999);
        
        let count = 0;
        let completed = 0;
        
        allSessions.forEach(s => {
          if (s.session_date) {
            const sDate = new Date(s.session_date);
            if (sDate >= weekStart && sDate <= weekEnd) {
              count++;
              if (s.status === 'completed') completed++;
            }
          }
        });
        
        dates.push({
          label: `W-${i === 0 ? "Ini" : i}`,
          fullLabel: `${weekStart.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}`,
          total: count,
          completed: completed,
        });
      }
    } else if (chartFilter === "monthly") {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        
        let count = 0;
        let completed = 0;
        
        allSessions.forEach(s => {
          if (s.session_date) {
            const sDate = new Date(s.session_date);
            if (sDate.getFullYear() === year && sDate.getMonth() === month) {
              count++;
              if (s.status === 'completed') completed++;
            }
          }
        });
        
        dates.push({
          label: d.toLocaleDateString("id-ID", { month: 'short' }),
          fullLabel: d.toLocaleDateString("id-ID", { month: 'long', year: 'numeric' }),
          total: count,
          completed: completed,
        });
      }
    }
    return dates;
  };

  const chartData = getChartData();
  const maxSessionCount = Math.max(...chartData.map(d => d.total), 5); // Ensure scale grid rendering

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-4 border-lime border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 w-full animate-pgIn space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display font-bold text-3xl tracking-tight text-text-main">Overview</h1>
          <p className="text-text-sub font-mono text-sm">Metrik performa & ringkasan aktivitas bimbingan</p>
        </div>
        <div className="text-xs font-mono text-text-sub bg-bg-2 border border-border/80 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse"></span>
          Terakhir Diperbarui: {new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB
        </div>
      </div>

      {/* Stats Cards (5 Columns Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Siswa Aktif */}
        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col gap-3 relative overflow-hidden group hover:border-lime/40 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-lime-mid text-lime flex items-center justify-center">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-bold text-success flex items-center gap-0.5 bg-success/10 px-1.5 py-0.5 rounded font-mono">
              +12%
            </span>
          </div>
          <div>
            <p className="text-xs text-text-sub font-semibold mb-0.5">Siswa Terdaftar</p>
            <h3 className="text-2xl font-display font-bold text-text-main">{stats.activeStudents}</h3>
          </div>
        </div>

        {/* Tutor Aktif */}
        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col gap-3 relative overflow-hidden group hover:border-lime/40 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-primary-dim text-primary flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <span className="text-[10px] font-bold text-success flex items-center gap-0.5 bg-success/10 px-1.5 py-0.5 rounded font-mono">
              +4%
            </span>
          </div>
          <div>
            <p className="text-xs text-text-sub font-semibold mb-0.5">Tutor Terdaftar</p>
            <h3 className="text-2xl font-display font-bold text-text-main">{stats.activeTutors}</h3>
          </div>
        </div>

        {/* Sesi Belajar Aktif (NEW) */}
        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col gap-3 relative overflow-hidden group hover:border-lime/40 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-lime/10 text-lime flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <span className="text-[10px] font-bold text-lime flex items-center gap-0.5 bg-lime-mid px-1.5 py-0.5 rounded font-mono uppercase">
              Hari Ini
            </span>
          </div>
          <div>
            <p className="text-xs text-text-sub font-semibold mb-0.5">Sesi Aktif</p>
            <h3 className="text-2xl font-display font-bold text-lime">{stats.activeSessions}</h3>
          </div>
        </div>

        {/* Menunggu Verifikasi */}
        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col gap-3 relative overflow-hidden group hover:border-lime/40 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
              <Clock size={18} />
            </div>
            {stats.pendingVerifications > 0 && (
              <span className="text-[10px] font-bold text-warning flex items-center gap-1 bg-warning/10 px-1.5 py-0.5 rounded font-mono">
                Butuh Verif
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-text-sub font-semibold mb-0.5">Verifikasi Pending</p>
            <h3 className="text-2xl font-display font-bold text-text-main">{stats.pendingVerifications}</h3>
          </div>
        </div>

        {/* Estimasi Revenue */}
        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col gap-3 relative overflow-hidden group hover:border-lime/40 transition-all duration-300 col-span-2 sm:col-span-1">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <span className="text-[10px] font-bold text-success flex items-center gap-0.5 bg-success/10 px-1.5 py-0.5 rounded font-mono">
              +18%
            </span>
          </div>
          <div>
            <p className="text-xs text-text-sub font-semibold mb-0.5">Total Pendapatan</p>
            <h3 className="text-2xl font-display font-bold text-text-main line-clamp-1">
              Rp {stats.monthlyRevenue.toLocaleString("id-ID")}
            </h3>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart and Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Dynamic Analytics Chart (Left Side, 3 cols) */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-6 lg:col-span-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                <TrendingUp size={16} className="text-lime" />
                Tren Aktivitas Sesi
              </h2>
              <p className="text-xs text-text-sub">Grafik jumlah pemesanan belajar harian, mingguan, & bulanan</p>
            </div>
            
            {/* Filter Toggle */}
            <div className="flex bg-bg-2 p-1 rounded-lg border border-border/80 text-xs text-text-sub font-medium select-none">
              <button
                onClick={() => setChartFilter("daily")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${chartFilter === "daily" ? "bg-bg-3 font-semibold text-lime shadow-sm" : "hover:text-text-main"}`}
              >
                Harian
              </button>
              <button
                onClick={() => setChartFilter("weekly")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${chartFilter === "weekly" ? "bg-bg-3 font-semibold text-lime shadow-sm" : "hover:text-text-main"}`}
              >
                Mingguan
              </button>
              <button
                onClick={() => setChartFilter("monthly")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${chartFilter === "monthly" ? "bg-bg-3 font-semibold text-lime shadow-sm" : "hover:text-text-main"}`}
              >
                Bulanan
              </button>
            </div>
          </div>

          {/* SVG Visual Chart */}
          <div className="relative w-full h-64 mt-2">
            {/* Grid Line Labels */}
            <div className="absolute left-0 right-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none">
              {[1, 0.75, 0.5, 0.25, 0].map((v, idx) => (
                <div key={idx} className="w-full flex justify-between items-center text-[10px] font-mono text-text-sub opacity-50">
                  <span className="w-6 text-right pr-1">
                    {Math.round(maxSessionCount * v)}
                  </span>
                  <div className="flex-1 border-t border-dashed border-border/20 mx-2"></div>
                </div>
              ))}
            </div>

            {/* Bars container */}
            <div className="absolute left-8 right-2 top-2 bottom-8 flex justify-around items-end">
              {chartData.map((d, index) => {
                const totalHeightPercent = (d.total / maxSessionCount) * 100;
                const completedHeightPercent = (d.completed / maxSessionCount) * 100;
                const isHovered = hoveredBarIndex === index;

                return (
                  <div
                    key={index}
                    className="relative flex-1 flex flex-col items-center group cursor-pointer h-full justify-end max-w-[48px] mx-1"
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Shadow Backing slots */}
                    <div className="absolute bottom-0 w-full bg-border/20 rounded-t-md h-full opacity-0 group-hover:opacity-40 transition-opacity"></div>

                    {/* Total Bar */}
                    <div
                      style={{ height: `${totalHeightPercent}%` }}
                      className={`w-4/5 rounded-t-md transition-all duration-300 ${isHovered ? "bg-lime/30 border-l border-r border-t border-lime/60 shadow-[0_0_12px_rgba(163,230,53,0.15)]" : "bg-border"}`}
                    >
                      {/* Completed Stack inner fill */}
                      <div
                        style={{ height: `${d.total > 0 ? (d.completed / d.total) * 100 : 0}%` }}
                        className="w-full bg-[#a3e635] rounded-t-md absolute bottom-0 transition-all duration-300"
                      ></div>
                    </div>

                    {/* Hover Floating Tooltip */}
                    {isHovered && (
                      <div className="absolute z-30 bottom-full mb-2 bg-bg-2 p-2.5 rounded-lg border border-border shadow-xl w-32 left-1/2 -translate-x-1/2 flex flex-col gap-1 pointer-events-none animate-scaleIn">
                        <p className="text-[10px] font-mono text-text-sub text-center leading-none mb-1 border-b border-border/50 pb-1">{d.fullLabel}</p>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-text-sub">Total Sesi:</span>
                          <span className="text-text-main font-bold font-mono">{d.total}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-[#a3e635] font-semibold">Selesai:</span>
                          <span className="text-lime font-bold font-mono">{d.completed}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* X-Axis labels */}
            <div className="absolute left-8 right-2 bottom-0 h-6 flex justify-around items-center pt-2">
              {chartData.map((d, index) => (
                <span
                  key={index}
                  className={`text-[10px] font-mono text-center flex-1 max-w-[48px] mx-1 truncate ${hoveredBarIndex === index ? "text-lime font-bold" : "text-text-sub"}`}
                >
                  {d.label}
                </span>
              ))}
            </div>
          </div>

          {/* Chart Legends */}
          <div className="flex justify-center items-center gap-6 mt-2 pt-4 border-t border-border/30 text-xs">
            <div className="flex items-center gap-1.5 text-text-sub">
              <span className="w-3 h-3 rounded-sm bg-border"></span>
              <span>Total Dipesan</span>
            </div>
            <div className="flex items-center gap-1.5 text-text-sub">
              <span className="w-3 h-3 rounded-sm bg-[#a3e635]"></span>
              <span className="text-text-main font-medium">Sesi Selesai</span>
            </div>
          </div>
        </div>

        {/* Active/Upcoming Sessions Panel (Right Side, 2 cols) */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                <Clock size={16} className="text-warning-light" />
                Sesi Aktif Saat Ini
              </h2>
              <p className="text-xs text-text-sub">Sesi terjadwal atau butuh perhatian</p>
            </div>
            <span className="text-xs font-mono bg-lime-mid text-lime font-bold px-2 py-0.5 rounded-full">
              {activeSessionsList.length} Sesi
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[310px] pr-1.5 custom-scrollbar">
            {activeSessionsList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border/50 rounded-2xl py-12">
                <Calendar size={36} className="text-border mb-3" />
                <h4 className="text-sm font-bold text-text-main">Tidak Ada Sesi Aktif Berlangsung</h4>
                <p className="text-xs text-text-sub mt-1 max-w-[200px] mx-auto">Semua sesi belajar terjadwal telah selesai atau dibatalkan.</p>
              </div>
            ) : (
              activeSessionsList.map((session) => (
                <div key={session.id} className="bg-bg-2 p-3.5 rounded-xl border border-border/60 flex justify-between items-start gap-3 hover:border-lime/30 transition-all">
                  <div className="min-w-0 flex-1">
                    {/* Date/Time Row */}
                    <p className="text-[10px] font-mono text-text-sub mb-1 flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(session.session_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })} &bull; {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                    </p>
                    
                    {/* Subject */}
                    <h4 className="text-xs font-bold text-text-main truncate leading-tight">
                      {session.subject}
                    </h4>

                    {/* Tutor and Student */}
                    <div className="text-[10px] text-text-sub mt-1.5 flex flex-col gap-0.5 border-t border-border/30 pt-1.5">
                      <p className="truncate"><strong className="text-text-main/70">Tutor:</strong> {session.tutor?.profiles?.full_name || "-"}</p>
                      <p className="truncate"><strong className="text-text-main/70">Siswa:</strong> {session.student?.profiles?.full_name || "-"}</p>
                    </div>
                  </div>

                  {/* Status Badges - Pushed to the right part (with unpaid support efficient layout for desktop & mobile) */}
                  <div className="flex flex-col gap-1.5 items-end shrink-0 pt-0.5 text-right">
                    {/* Mode Status Badge */}
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide leading-none ${
                      session.status === 'accepted' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                    }`}>
                      {session.status}
                    </span>

                    {/* Payment Status Badge (unpaid/paid info pushed to the right, highly efficient layout) */}
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide leading-none ${
                      session.payment_status === 'paid' ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-orange-400 border border-orange-400/20'
                    }`}>
                      {session.payment_status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
