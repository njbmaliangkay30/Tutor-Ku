import { FileText, Clock, AlertCircle } from 'lucide-react';

export function Classes() {
  return (
    <div className="pb-20 md:pb-0 h-full">
      <h1 className="text-2xl font-bold text-text-main dark:text-white mb-6">Kelas Saya</h1>
      
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-6">
        <button className="pb-3 border-b-2 border-primary text-primary font-medium px-2">Akan Datang</button>
        <button className="pb-3 text-text-secondary dark:text-slate-400 hover:text-text-main dark:hover:text-slate-200 font-medium px-2">Selesai</button>
        <button className="pb-3 text-text-secondary dark:text-slate-400 hover:text-text-main dark:hover:text-slate-200 font-medium px-2">Dibatalkan</button>
      </div>

      <div className="space-y-4">
        {[1, 2].map((item) => (
          <div key={item} className="bg-surface dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <span className="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary text-xs font-bold rounded-full">Terjadwal</span>
              <span className="flex items-center gap-1 text-sm text-text-secondary dark:text-slate-400"><Clock size={14} /> Besok, 10:00 WIB</span>
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-background dark:bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
                <img src={`https://i.pravatar.cc/150?img=${item + 30}`} alt="Tutor" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-text-main dark:text-white">Pemrograman Web (React)</h3>
                <p className="text-sm text-text-secondary dark:text-slate-400 flex items-center gap-1">dengan Ahmad Fauzi</p>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button className="flex-1 bg-primary hover:opacity-90 text-surface py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <FileText size={16} /> Materi
              </button>
              <button className="flex-1 bg-background hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-text-main dark:text-slate-200 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                Reschedule
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
