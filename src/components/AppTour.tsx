import { useEffect, useState } from 'react';
import { Joyride, CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride';
import { useAppContext } from '../AppContext';
import { X } from 'lucide-react';

function CustomTooltip({
  index,
  step,
  size,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
}: TooltipRenderProps & { size?: number }) {
  return (
    <div {...tooltipProps} className="bg-bg-2 border-[1.5px] border-border rounded-[14px] p-4 w-[280px] sm:w-[320px] shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
      <div className="mb-1">
        {step.title && (
          <div className="font-display font-bold text-[15px] text-text-main mb-1.5 flex items-center justify-between gap-4">
             <div className="flex items-center gap-2">
               <span>{step.title}</span>
               {size && size > 1 && (
                 <span className="bg-lime/20 text-lime px-2 py-[2px] rounded-full text-[9px] font-mono whitespace-nowrap">
                   {index + 1} / {size}
                 </span>
               )}
             </div>
             <button {...closeProps} className="text-text-sub hover:text-text-main transition-colors shrink-0 p-1 bg-bg-3 rounded-md border border-transparent hover:border-border">
               <X size={14} />
             </button>
          </div>
        )}
        <div className="font-body text-[13px] text-text-sub leading-relaxed">{step.content}</div>
      </div>
      <div className="flex items-center justify-between mt-4 md:mt-5 border-t border-border/60 pt-3 md:pt-3.5">
        <button {...closeProps} className="text-[11px] font-bold text-text-sub hover:text-white uppercase tracking-wider font-mono px-2 py-1 -ml-2 rounded hover:bg-bg-3 transition-colors">
           Skip tour
        </button>
        <div className="flex gap-2">
           {index > 0 && (
             <button {...backProps} className="text-[11px] font-bold text-text-main px-3 py-1.5 rounded-lg hover:bg-bg-3 border border-transparent hover:border-border transition-colors">
               Kembali
             </button>
           )}
           <button {...primaryProps} className="bg-lime text-black font-bold text-[12px] px-3.5 py-1.5 rounded-lg border-[1.5px] border-lime shadow-[0_0_12px_rgba(200,255,0,0.2)] hover:shadow-[0_0_15px_rgba(200,255,0,0.3)] transition-all">
              {isLastStep ? 'Mengerti!' : 'Lanjut'}
           </button>
        </div>
      </div>
    </div>
  );
}

export function AppTour() {
  const { userRole, activeTab, selectedTutorId } = useAppContext();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (userRole !== 'siswa') return;
    
    // We store flags for each page's tour
    const hasSeenHome = localStorage.getItem('tutorku_tour_home');
    const hasSeenSearch = localStorage.getItem('tutorku_tour_search');
    const hasSeenDetail = localStorage.getItem('tutorku_tour_detail');

    let currentSteps: Step[] = [];

    if (!hasSeenHome && activeTab === 'home' && !selectedTutorId) {
      currentSteps = [
        {
          target: 'body',
          title: 'Selamat Datang! 👋',
          content: 'Mari kami pandu cara memesan tutor pertamamu di layanan Tutorku.',
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '.tour-explore',
          title: 'Cari Tutor',
          content: 'Buka menu pencarian ini untuk melihat daftar semua tutor terbaik yang tersedia.',
          placement: 'top',
          disableBeacon: true,
        },
      ];
    } else if (!hasSeenSearch && (activeTab === 'search' || activeTab === 'explore') && !selectedTutorId) {
      currentSteps = [
        {
          target: '.tour-filter-gender',
          title: 'Filter Gender',
          content: 'Kamu bisa memfilter tutor berdasarkan gender jika kamu merasa lebih nyaman belajar dengan gender tertentu.',
          placement: 'bottom',
          disableBeacon: true,
        },
        {
          target: '.tour-filter-subject',
          title: 'Pilih Mata Pelajaran',
          content: 'Pilih mata pelajaran yang ingin kamu pelajari agar pencarian tutor lebih spesifik dan tepat sasaran.',
          placement: 'bottom',
          disableBeacon: true,
        },
        {
          target: '.tour-tutor-card',
          title: 'Pilih Tutor',
          content: 'Klik kartu tutor yang kamu sukai untuk melihat profil detail dan mengatur jadwal bareng mereka.',
          placement: 'bottom',
          disableBeacon: true,
        }
      ];
    } else if (!hasSeenDetail && selectedTutorId) {
      currentSteps = [
        {
          target: '.tour-schedule',
          title: 'Pilih Jadwal',
          content: 'Silakan pilih tanggal dan jam luangmu untuk mengadakan pelajaran.',
          placement: 'top',
          disableBeacon: true,
        },
        {
          target: '.tour-mapel',
          title: 'Tentukan Materi',
          content: 'Pilih mata pelajaran spesifik yang ingin kamu bahas pada sesi ini.',
          placement: 'top',
          disableBeacon: true,
        },
        {
          target: '.tour-method',
          title: 'Metode Pertemuan',
          content: 'Pilih apakah kamu ingin belajar secara Online atau Offline (Tatap Muka).',
          placement: 'top',
          disableBeacon: true,
        },
        {
          target: '.tour-book-now',
          title: 'Sewa & Atur Jadwal',
          content: 'Sama seperti ini! Tinggal klik Booking Sekarang, dan jadwal belajarmu akan otomatis tercatat.',
          placement: 'top',
          disableBeacon: true,
        }
      ];
    }

    if (currentSteps.length > 0) {
      setSteps(currentSteps);
      // Wait for DOM to render
      setTimeout(() => setRun(true), 1200);
    } else {
      setRun(false);
    }

  }, [userRole, activeTab, selectedTutorId]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Check if the user finished or skipped the tour
    if (finishedStatuses.includes(status) || action === 'close') {
      setRun(false);
      
      // Mark current state as seen
      if (activeTab === 'home' && !selectedTutorId) {
        localStorage.setItem('tutorku_tour_home', 'true');
      } else if ((activeTab === 'search' || activeTab === 'explore') && !selectedTutorId) {
        localStorage.setItem('tutorku_tour_search', 'true');
      } else if (selectedTutorId) {
        localStorage.setItem('tutorku_tour_detail', 'true');
      }
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      showProgress={false}
      showSkipButton
      steps={steps}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          arrowColor: '#161616', // bg-3
          overlayColor: 'rgba(13, 13, 13, 0.85)', // bg-base with opacity
          zIndex: 10000,
        }
      }}
    />
  );
}
