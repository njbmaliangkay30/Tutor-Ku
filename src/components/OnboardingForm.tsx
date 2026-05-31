import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";
import { useAppContext } from "../AppContext";
import { Loader2, ArrowRight } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

export function OnboardingForm() {
  const { t } = useTranslation();
  const { user, userProfile, userRole } = useAppContext();
  
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [university, setUniversity] = useState("");
  const [targetSubjects, setTargetSubjects] = useState<string[]>([]);
  const [learningStyles, setLearningStyles] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<Record<number, string[]>>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const toggleTargetSubject = (subject: string) => {
    setTargetSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
  };

  const toggleLearningStyle = (style: string) => {
    setLearningStyles(prev => prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]);
  };

  const toggleScheduleHour = (day: number, hour: string) => {
    setSchedule(prev => {
      const currentHours = prev[day] || [];
      const newHours = currentHours.includes(hour)
        ? currentHours.filter(h => h !== hour)
        : [...currentHours, hour].sort();
      const newSchedule = { ...prev };
      if (newHours.length > 0) {
        newSchedule[day] = newHours;
      } else {
        delete newSchedule[day];
      }
      return newSchedule;
    });
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  useEffect(() => {
    if (userProfile) {
      if (userProfile.full_name) setFullName(userProfile.full_name);
      if (userProfile.phone) setPhoneNumber(userProfile.phone);
      if (userProfile.gender) setGender(userProfile.gender);
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Upsert profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        phone: phoneNumber,
        gender: gender || null,
      });

      if (profileError) throw profileError;

      // Upsert tutor profile if needed (bio)
      if (userRole === "tutor") {
        const availableDaysList = Object.keys(schedule).map(Number);
        const allHoursSet = new Set<string>();
        Object.values(schedule).forEach((hours: any) => {
          if (Array.isArray(hours)) {
            hours.forEach(h => allHoursSet.add(h));
          }
        });
        const availableHoursList = Array.from(allHoursSet).sort();

        const { error: tutorError } = await supabase.from("tutor_profiles").upsert({
          id: user.id,
          bio: bio,
          address: address,
          university: university,
          target_subjects: targetSubjects,
          learning_styles: learningStyles,
          available_days: availableDaysList,
          available_hours: availableHoursList,
          schedule: schedule
        });
        if (tutorError) throw tutorError;
      } else if ((userRole as string) === "student" || userRole === "siswa") {
        // Option to upsert student profile if needed
        const { error: studentError } = await supabase.from("student_profiles").upsert({
          id: user.id,
        });
        if (studentError) throw studentError;
      }
      
      // Force reload to get updated context without phone = null
      window.location.reload();
      
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{overscrollBehavior: 'none'}}>
      <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-[500px] flex flex-col max-h-[90vh] overflow-hidden animate-pgIn relative">
        <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <h2 className="font-display font-black text-2xl mb-2 text-text-main text-center">
            Lengkapi Profil Anda
          </h2>
          <p className="text-text-sub text-[13px] text-center mb-6">
            Satu langkah lagi sebelum Anda bisa menggunakan TutorKu.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-[13px] text-center">
                {errorMsg}
              </div>
            )}
            
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">
                  Nama Lengkap
                </label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-bg-3 border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">
                  Nomor HP / WhatsApp
                </label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full bg-bg-3 border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
                  placeholder="Contoh: 081234567890"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">
                  Jenis Kelamin
                </label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="w-full bg-bg-3 border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all appearance-none"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

            {userRole === "tutor" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">
                    Alamat Lengkap
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full bg-bg-base border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
                    placeholder="Masukkan domisili kota/alamat..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">
                    Mapel yang Dikuasai
                  </label>
                  <p className="text-[10px] text-text-sub ml-1 mb-1">Pilih mata pelajaran yang Anda kuasai (Pisahkan dengan koma jika manual, atau klik yang ada)</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {["Matematika", "Fisika", "Kimia", "Biologi", "Bahasa Inggris", "Bahasa Indonesia", "Sejarah"].map(sub => (
                      <span 
                        key={sub}
                        onClick={() => toggleTargetSubject(sub)}
                        className={`text-[12px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors border ${targetSubjects.includes(sub) ? "bg-lime-dim text-lime border-lime" : "bg-bg-3 text-text-sub border-border hover:border-lime/50"}`}
                      >
                         {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">
                    Tipe Mengajar
                  </label>
                  <div className="flex gap-4 mt-1">
                    {["Online", "Offline"].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={learningStyles.includes(type)}
                          onChange={() => toggleLearningStyle(type)}
                          className="w-4 h-4 accent-lime"
                        />
                        <span className="text-[13px]">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">
                    Asal Universitas <span className="text-warning">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full bg-bg-base border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
                    placeholder="Contoh: Universitas Indonesia"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">Hari & Jam Tersedia</label>
                  <div className="border border-border p-3 rounded-xl bg-bg-2">
                    <p className="text-[10px] text-text-sub mb-2">Pilih hari mengajar</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                       {[{id: 1, name: "Sen"}, {id: 2, name: "Sel"}, {id: 3, name: "Rab"}, {id: 4, name: "Kam"}, {id: 5, name: "Jum"}, {id: 6, name: "Sab"}, {id: 0, name: "Min"}].map(day => (
                         <span 
                           key={day.id}
                           onClick={() => setSelectedDay(selectedDay === day.id ? null : day.id)}
                           className={`text-[11px] px-2.5 py-1 rounded-md cursor-pointer transition-colors border ${selectedDay === day.id ? "bg-lime text-black font-bold" : (schedule[day.id]?.length > 0 ? "bg-lime-dim text-lime border-lime font-bold" : "bg-bg-1 text-text-sub border-border hover:border-lime/50")}`}
                         >
                            {t(`booking.day_${day.id}`)} {schedule[day.id]?.length > 0 && `(${schedule[day.id].length})`}
                         </span>
                       ))}
                    </div>
                    {selectedDay !== null && (
                      <div className="animate-pgIn">
                        <p className="text-[10px] text-text-sub mb-2">Pilih jam pada hari {t(`booking.day_${selectedDay}`)}</p>
                        <div className="flex flex-wrap gap-2">
                          {["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "18:00", "19:00", "20:00"].map(hour => (
                            <span 
                              key={hour}
                              onClick={() => toggleScheduleHour(selectedDay, hour)}
                              className={`text-[11px] px-2 py-1 rounded-md cursor-pointer transition-colors border font-mono ${schedule[selectedDay]?.includes(hour) ? "bg-lime-dim text-lime border-lime font-bold" : "bg-bg-1 text-text-sub border-border hover:border-lime/50"}`}
                            >
                                {hour}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-text-sub ml-1 uppercase font-mono tracking-wider">
                    Tentang Saya (Pengalaman & Keahlian)
                  </label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    required
                    className="w-full bg-bg-3 border border-border-2 rounded-xl px-4 py-3 text-[14px] text-text-main focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all resize-none"
                    placeholder="Ceritakan sedikit tentang pendidikan dan pengalaman mengajar Anda..."
                  />
                </div>
              </>
            )}

            <button 
              type="submit"
              disabled={isLoading || !fullName.trim() || !phoneNumber.trim() || !gender || (userRole === "tutor" && !bio.trim())}
              className="mt-4 px-6 py-3.5 rounded-xl bg-lime hover:bg-lime-hover text-black font-bold text-[14px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  Lanjutkan <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
