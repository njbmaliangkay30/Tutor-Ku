import React, { useEffect, useState } from "react";
import { Users, BookOpen, CreditCard, Box, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function AdminOverview() {
  const [stats, setStats] = useState({
    activeTutors: 0,
    activeStudents: 0,
    pendingVerifications: 0,
    monthlyRevenue: 0,
    totalSessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Get tutors count
      const { count: tutorsCount, error: tutorsErr } = await supabase
        .from("profiles")
        .select('*', { count: 'exact', head: true })
        .eq("role", "tutor");
        
      // Get students count
      const { count: studentsCount, error: studentsErr } = await supabase
        .from("profiles")
        .select('*', { count: 'exact', head: true })
        .eq("role", "student");
        
      // Get pending verifications count
      const { count: pendingCount, error: pendingErr } = await supabase
        .from("tutor_verifications")
        .select('*', { count: 'exact', head: true })
        .eq("status", "pending");
        
      // Get completed sessions count
      const { count: sessionsCount, error: sessionsErr } = await supabase
        .from("sessions")
        .select('*', { count: 'exact', head: true })
        .eq("status", "completed");

      // Set mock revenue for now (could sum from transactions)
      const mockMonthlyRevenue = 4500000;

      setStats({
        activeTutors: tutorsCount || 0,
        activeStudents: studentsCount || 0,
        pendingVerifications: pendingCount || 0,
        monthlyRevenue: mockMonthlyRevenue,
        totalSessions: sessionsCount || 0,
      });

    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-4 border-lime border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 w-full animate-pgIn space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold text-[32px] tracking-tight">Overview</h1>
        <p className="text-text-sub font-mono text-sm">Platform metrics & summary</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-4 relative overflow-hidden group hover:border-lime/50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-lime-mid text-lime flex items-center justify-center">
              <Users size={20} />
            </div>
            <span className="text-xs font-bold text-success flex items-center gap-1 bg-success/10 px-2 py-1 rounded">
              <TrendingUp size={12} /> +12%
            </span>
          </div>
          <div>
            <p className="text-sm text-text-sub font-medium mb-1">Active Students</p>
            <h3 className="text-2xl font-display font-bold text-text-main">{stats.activeStudents}</h3>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-4 relative overflow-hidden group hover:border-lime/50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary-dim text-primary flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <span className="text-xs font-bold text-success flex items-center gap-1 bg-success/10 px-2 py-1 rounded">
              <TrendingUp size={12} /> +4%
            </span>
          </div>
          <div>
            <p className="text-sm text-text-sub font-medium mb-1">Active Tutors</p>
            <h3 className="text-2xl font-display font-bold text-text-main">{stats.activeTutors}</h3>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-4 relative overflow-hidden group hover:border-lime/50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
              <Clock size={20} />
            </div>
            {stats.pendingVerifications > 0 && (
              <span className="text-xs font-bold text-warning flex items-center gap-1 bg-warning/10 px-2 py-1 rounded">
                Action Req.
              </span>
            )}
          </div>
          <div>
            <p className="text-sm text-text-sub font-medium mb-1">Pending Verifications</p>
            <h3 className="text-2xl font-display font-bold text-text-main">{stats.pendingVerifications}</h3>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-4 relative overflow-hidden group hover:border-lime/50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <span className="text-xs font-bold text-success flex items-center gap-1 bg-success/10 px-2 py-1 rounded">
              <TrendingUp size={12} /> +18%
            </span>
          </div>
          <div>
            <p className="text-sm text-text-sub font-medium mb-1">Estimasi Revenue</p>
            <h3 className="text-2xl font-display font-bold text-text-main">
              Rp {(stats.monthlyRevenue / 1000000).toFixed(1)}M
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
