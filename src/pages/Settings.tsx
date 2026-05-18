import { User, Bell, Shield, Wallet, LogOut, ChevronRight } from 'lucide-react';

export function Settings() {
  const settingsOptions = [
    { icon: User, label: 'Edit Profil', color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20' },
    { icon: Bell, label: 'Notifikasi', color: 'text-accent', bg: 'bg-accent/10 dark:bg-accent/20' },
    { icon: Wallet, label: 'Metode Pembayaran', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20' },
    { icon: Shield, label: 'Keamanan & Privasi', color: 'text-text-secondary', bg: 'bg-slate-100 dark:bg-slate-700' },
  ];

  return (
    <div className="pb-20 md:pb-0 h-full max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-main dark:text-white mb-6">Pengaturan</h1>
      
      <div className="bg-surface dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent text-surface flex items-center justify-center font-bold text-2xl shadow-sm cursor-pointer">
          A
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-main dark:text-white">Ali Mahasiswa</h2>
          <p className="text-text-secondary dark:text-slate-400 text-sm">ali.mahasiswa@example.com</p>
        </div>
      </div>

      <div className="bg-surface dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 mb-6">
        {settingsOptions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button key={idx} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0 rounded-none bg-transparent">
              <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                <Icon size={20} />
              </div>
              <span className="flex-1 text-left font-medium text-text-main dark:text-slate-200">{item.label}</span>
              <ChevronRight size={20} className="text-text-secondary" />
            </button>
          );
        })}
      </div>

      <button className="w-full flex items-center gap-4 p-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl transition-colors font-bold justify-center border border-red-100 dark:border-red-500/20">
        <LogOut size={20} className="stroke-[2.5]" /> Log Out
      </button>

      <div className="text-center mt-8 text-xs text-text-secondary dark:text-slate-500">
        <p>tutorku v1.0.0</p>
      </div>
    </div>
  );
}
