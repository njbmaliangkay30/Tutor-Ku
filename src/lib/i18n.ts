export type Language = 'id' | 'en';

export const translations = {
  id: {
    nav: {
      home: "Beranda",
      explore: "Eksplorasi",
      schedule: "Jadwal",
      sessions: "Sesi Saya",
      history: "Riwayat",
      chat: "Kotak Masuk",
      profile: "Profil",
      login: "Masuk",
      daftar_tutor: "Daftar Tutor",
      admin_overview: "Ikhtisar",
      admin_requests: "Persetujuan Tutor"
    },
    common: {
      loading: "Memuat...",
      save: "Simpan",
      cancel: "Batal",
      success: "Berhasil",
      error: "Terjadi kesalahan",
      logout: "Keluar",
      restart_tour: "Ulangi Tutorial"
    },
    profile: {
      settings: "Pengaturan & Akun",
      theme: "Ganti Tema Tampilan",
      language: "Bahasa",
      personal_data: "Data Diri & Biodata",
      payment: "Metode Pembayaran",
      help: "Pusat Bantuan",
      about: "Tentang TutorKu",
      history: "Riwayat Transaksi"
    }
  },
  en: {
    nav: {
      home: "Home",
      explore: "Explore",
      schedule: "Schedule",
      sessions: "My Sessions",
      history: "History",
      chat: "Inbox",
      profile: "Profile",
      login: "Login",
      daftar_tutor: "Become a Tutor",
      admin_overview: "Overview",
      admin_requests: "Tutor Approvals"
    },
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      success: "Success",
      error: "An error occurred",
      logout: "Logout",
      restart_tour: "Restart Tutorial"
    },
    profile: {
      settings: "Account & Settings",
      theme: "Change Display Theme",
      language: "Language",
      personal_data: "Personal Information",
      payment: "Payment Methods",
      help: "Help Center",
      about: "About TutorKu",
      history: "Transaction History"
    }
  }
};

export function t(key: string, lang: Language): string {
  const keys = key.split('.');
  let current: any = translations[lang] || translations['id'];
  for (const k of keys) {
    if (current && current[k] !== undefined) {
      current = current[k];
    } else {
      return key; // fallback
    }
  }
  return typeof current === 'string' ? current : key;
}
