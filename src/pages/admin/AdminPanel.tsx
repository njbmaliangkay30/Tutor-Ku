import React, { useState, useEffect } from "react";
import { Users, BookOpen } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function AdminPanel() {
  const [activeSubTab, setActiveSubTab] = useState<"tutors" | "students">("tutors");
  const [tutors, setTutors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [activeSubTab]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      if (activeSubTab === "tutors") {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "tutor");
        if (!error && data) setTutors(data);
      } else {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "student");
        if (!error && data) setStudents(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-pgIn max-w-5xl mx-auto w-full">
      <div className="mb-6 pb-4 border-b border-border/60">
        <h1 className="text-2xl font-display font-bold text-text-main">
          Admin Panel
        </h1>
        <p className="text-text-sub text-sm">
          Kelola tutor dan siswa (student)
        </p>
      </div>

      <div className="flex bg-bg-2 rounded-xl p-1 shrink-0 mb-6 border border-border">
        <button
          onClick={() => setActiveSubTab("tutors")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-lg transition-all ${activeSubTab === "tutors" ? "bg-bg-0 text-text-main shadow-sm" : "text-text-sub hover:text-text-main"}`}
        >
          <BookOpen size={16} /> Tutor Management
        </button>
        <button
          onClick={() => setActiveSubTab("students")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-lg transition-all ${activeSubTab === "students" ? "bg-bg-0 text-text-main shadow-sm" : "text-text-sub hover:text-text-main"}`}
        >
          <Users size={16} /> Student Management
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-lime/30 border-t-lime animate-spin"></div>
        </div>
      ) : activeSubTab === "tutors" ? (
        <div className="space-y-3">
          {tutors.map((tutor) => (
            <div key={tutor.id} className="bg-bg-0 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-3">
                 {tutor.avatar_url ? (
                   <img src={tutor.avatar_url} alt={tutor.full_name} className="w-10 h-10 rounded-full object-cover border border-border" />
                 ) : (
                   <div className="w-10 h-10 rounded-full bg-bg-2 border border-border flex items-center justify-center text-text-sub font-bold text-sm">
                     {(tutor.full_name || "U").substring(0, 2).toUpperCase()}
                   </div>
                 )}
                 <div>
                  <h3 className="font-semibold text-text-main flex items-center gap-2">
                    {tutor.full_name}
                    {tutor.is_verified && <span className="inline-block w-2 h-2 rounded-full bg-success" title="Verified Tutor"></span>}
                  </h3>
                  <p className="text-xs text-text-sub">{tutor.email}</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <span className="px-2 py-1 bg-lime-mid text-lime text-[10px] font-bold rounded flex items-center">
                    TUTOR
                 </span>
              </div>
            </div>
          ))}
          {tutors.length === 0 && <p className="text-sm text-text-sub text-center py-10">Belum ada tutor terdaftar.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <div key={student.id} className="bg-bg-0 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-3">
                 {student.avatar_url ? (
                   <img src={student.avatar_url} alt={student.full_name} className="w-10 h-10 rounded-full object-cover border border-border" />
                 ) : (
                   <div className="w-10 h-10 rounded-full bg-bg-2 border border-border flex items-center justify-center text-text-sub font-bold text-sm">
                     {(student.full_name || "U").substring(0, 2).toUpperCase()}
                   </div>
                 )}
                 <div>
                  <h3 className="font-semibold text-text-main">{student.full_name}</h3>
                  <p className="text-xs text-text-sub">{student.email}</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <span className="px-2 py-1 bg-border text-text-sub text-[10px] font-bold rounded flex items-center">
                    STUDENT
                 </span>
              </div>
            </div>
          ))}
          {students.length === 0 && <p className="text-sm text-text-sub text-center py-10">Belum ada student terdaftar.</p>}
        </div>
      )}
    </div>
  );
}
