import { useState } from "react";
import { useAppContext } from "../AppContext";
import { supabase } from "../lib/supabase";

export function Login() {
  const { setActiveTab, setUserRole } = useAppContext();
  const [roleStep, setRoleStep] = useState(true);
  const [authTab, setAuthTab] = useState("masuk");
  const [selectedRole, setSelectedRole] = useState<"siswa" | "tutor" | null>(
    null,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRoleSelect = (role: "siswa" | "tutor") => {
    setSelectedRole(role);
    setRoleStep(false);
  };

  const handleLogin = async () => {
    setErrorMsg("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // In a real app, you would fetch the role from the profiles table here
      // For now, we use the selected role from the UI or default
      if (selectedRole) {
        setUserRole(selectedRole);
      } else {
        // Just fail safe
        setUserRole("siswa");
      }

      setActiveTab("home");
    } catch (err: any) {
      setErrorMsg(
        err.message || "Gagal masuk. Periksa kembali email dan password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setErrorMsg("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole === "siswa" ? "siswa" : "tutor",
          },
        },
      });

      if (error) throw error;

      if (selectedRole) {
        setUserRole(selectedRole);
      }

      if (selectedRole === "tutor") {
        setActiveTab("daftar-tutor");
      } else {
        setActiveTab("home");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mendaftar. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      // After OAuth flow, it redirects back.
    } catch (err: any) {
      setErrorMsg(err.message || "Google Auth failed");
    }
  };

  return (
    <div className="p-4 md:p-6 md:pt-7 lg:px-8 animate-pgIn w-full max-w-sm mx-auto flex flex-col justify-center min-h-[calc(100vh-64px)] md:min-h-screen">
      <div className="font-display text-[28px] font-extrabold mb-1">
        Halo! 👋
      </div>
      <div className="text-[13px] text-text-sub mb-6">
        Masuk atau buat akun baru untuk melanjutkan.
      </div>

      {roleStep ? (
        <div>
          <div className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em] mb-2.5 font-mono">
            PILIH PERANMU
          </div>

          <div
            className="bg-bg-2/80 backdrop-blur-md border-[1.5px] border-border/60 rounded-xl p-3.5 cursor-pointer transition-all w-full text-left mb-2 flex items-center gap-2.5 hover:border-lime hover:bg-lime-dim shadow-sm"
            onClick={() => handleRoleSelect("siswa")}
          >
            <span className="text-[28px]">📚</span>
            <div>
              <div className="font-display text-[14px] font-bold mb-0.5">
                Siswa / Orang Tua
              </div>
              <div className="text-[11px] text-text-sub">
                Cari tutor, booking jadwal, pantau progres belajar
              </div>
            </div>
          </div>

          <div
            className="bg-bg-2/80 backdrop-blur-md border-[1.5px] border-border/60 rounded-xl p-3.5 cursor-pointer transition-all w-full text-left mb-2 flex items-center gap-2.5 hover:border-lime hover:bg-lime-dim shadow-sm"
            onClick={() => handleRoleSelect("tutor")}
          >
            <span className="text-[28px]">🎓</span>
            <div>
              <div className="font-display text-[14px] font-bold mb-0.5">
                Tutor Mahasiswa
              </div>
              <div className="text-[11px] text-text-sub">
                Kelola siswa aktif, jadwal mengajar, dan laporan sesi
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2.5 mb-3.5 text-text-light text-[11px] font-mono">
              <div className="flex-1 h-[1px] bg-border"></div>
              <span className="text-text-sub">atau masuk langsung</span>
              <div className="flex-1 h-[1px] bg-border"></div>
            </div>
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-2.5 px-[18px] py-[11px] rounded-lg border-[2px] border-border-2 bg-bg-2/80 backdrop-blur-md text-text-main text-[13px] font-bold cursor-pointer transition-all font-display hover:border-lime hover:shadow-sh1"
            >
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Lanjut dengan Google
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setRoleStep(true)}
            className="bg-transparent border-none cursor-pointer text-lime text-[12px] font-bold font-mono mb-4 flex items-center p-0"
          >
            ← Ubah peran
          </button>

          <button
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-2.5 px-[18px] py-[11px] rounded-lg border-[2px] border-border-2 bg-bg-2/80 backdrop-blur-md text-text-main text-[13px] font-bold cursor-pointer transition-all font-display hover:border-lime hover:shadow-sh1 mb-4"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Lanjut dengan Google
          </button>

          <div className="flex items-center gap-2.5 mb-4 text-text-light text-[11px] font-mono">
            <div className="flex-1 h-[1px] bg-border"></div>
            <span className="text-text-sub">atau email</span>
            <div className="flex-1 h-[1px] bg-border"></div>
          </div>

          <div className="flex border-b-[1.5px] border-border mb-5">
            <button
              onClick={() => setAuthTab("masuk")}
              className={`py-2.5 px-3.5 text-[12px] font-bold font-mono cursor-pointer border-none bg-transparent whitespace-nowrap transition-all tracking-[0.02em] border-b-[2px] -mb-[2px] ${authTab === "masuk" ? "text-lime border-lime" : "text-text-sub border-transparent hover:text-text-main"}`}
            >
              MASUK
            </button>
            <button
              onClick={() => setAuthTab("daftar")}
              className={`py-2.5 px-3.5 text-[12px] font-bold font-mono cursor-pointer border-none bg-transparent whitespace-nowrap transition-all tracking-[0.02em] border-b-[2px] -mb-[2px] ${authTab === "daftar" ? "text-lime border-lime" : "text-text-sub border-transparent hover:text-text-main"}`}
            >
              DAFTAR
            </button>
          </div>

          {authTab === "masuk" ? (
            <div>
              {errorMsg && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-xs mb-4 border border-red-500/20">
                  {errorMsg}
                </div>
              )}
              <div className="flex flex-col gap-[5px] mb-3">
                <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@email.com"
                  className="border-[1.5px] border-border/60 rounded-lg px-[13px] py-2.5 text-[14px] bg-bg-2/70 focus:bg-bg-2 text-text-main font-body focus:outline-none focus:border-lime focus:shadow-[0_0_0_2px_var(--color-lime-dim)] transition-all backdrop-blur-sm"
                />
              </div>
              <div className="flex flex-col gap-[5px] mb-5">
                <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-[1.5px] border-border/60 rounded-lg px-[13px] py-2.5 text-[14px] bg-bg-2/70 focus:bg-bg-2 text-text-main font-body focus:outline-none focus:border-lime focus:shadow-[0_0_0_2px_var(--color-lime-dim)] transition-all backdrop-blur-sm"
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-lime text-black border-[2px] border-lime rounded-lg py-[11px] px-[18px] font-display font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-sh1 transition-all hover:shadow-sh2 hover:-translate-x-px hover:-translate-y-px active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Memuat..." : "Masuk"}
              </button>
            </div>
          ) : (
            <div>
              {errorMsg && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-xs mb-4 border border-red-500/20">
                  {errorMsg}
                </div>
              )}
              <div className="flex flex-col gap-[5px] mb-3">
                <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmad Rizki"
                  className="border-[1.5px] border-border/60 rounded-lg px-[13px] py-2.5 text-[14px] bg-bg-2/70 focus:bg-bg-2 text-text-main font-body focus:outline-none focus:border-lime focus:shadow-[0_0_0_2px_var(--color-lime-dim)] transition-all backdrop-blur-sm"
                />
              </div>
              <div className="flex flex-col gap-[5px] mb-3">
                <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@email.com"
                  className="border-[1.5px] border-border/60 rounded-lg px-[13px] py-2.5 text-[14px] bg-bg-2/70 focus:bg-bg-2 text-text-main font-body focus:outline-none focus:border-lime focus:shadow-[0_0_0_2px_var(--color-lime-dim)] transition-all backdrop-blur-sm"
                />
              </div>
              <div className="flex flex-col gap-[5px] mb-5">
                <label className="text-[10px] font-bold text-text-sub uppercase tracking-[0.06em] font-mono">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="border-[1.5px] border-border/60 rounded-lg px-[13px] py-2.5 text-[14px] bg-bg-2/70 focus:bg-bg-2 text-text-main font-body focus:outline-none focus:border-lime focus:shadow-[0_0_0_2px_var(--color-lime-dim)] transition-all backdrop-blur-sm"
                />
              </div>
              <button
                onClick={handleSignUp}
                disabled={isLoading}
                className="w-full bg-lime text-black border-[2px] border-lime rounded-lg py-[11px] px-[18px] font-display font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-sh1 transition-all hover:shadow-sh2 hover:-translate-x-px hover:-translate-y-px active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Memuat..." : "Buat Akun"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
