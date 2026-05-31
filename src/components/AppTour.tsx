import { useEffect, useState } from 'react';
import { Joyride, CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride';
import { useAppContext } from '../AppContext';
import { X } from 'lucide-react';

export function AppTour() {
  const { userRole, activeTab, setActiveTab, selectedTutorId } = useAppContext();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (userRole !== 'siswa') return;
    
    const hasSkippedAll = localStorage.getItem('tutorku_tour_skipped');
    if (hasSkippedAll) return;

    const hasSeenMain = localStorage.getItem('tutorku_tour_main');
    const hasSeenDetail = localStorage.getItem('tutorku_tour_detail');

    let currentSteps: Step[] = [];

    if (!hasSeenMain && !selectedTutorId) {
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
          spotlightPadding: 6,
        },
        {
          target: '.tour-filter-gender',
          title: 'Filter Gender',
          content: 'Kamu bisa memfilter tutor berdasarkan gender jika kamu merasa lebih nyaman belajar dengan gender tertentu.',
          placement: 'bottom',
          disableBeacon: true,
          spotlightPadding: 6,
        },
        {
          target: '.tour-filter-subject',
          title: 'Pilih Mata Pelajaran',
          content: 'Pilih mata pelajaran yang ingin kamu pelajari agar pencarian tutor lebih spesifik dan tepat sasaran.',
          placement: 'bottom',
          disableBeacon: true,
          spotlightPadding: 6,
        },
        {
          target: '.tour-tutor-card',
          title: 'Pilih Tutor',
          content: 'Klik kartu tutor yang kamu sukai untuk melihat profil detail dan mengatur jadwal bareng mereka.',
          placement: 'top-start',
          disableBeacon: true,
          spotlightPadding: 8,
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
          spotlightPadding: 6,
        },
        {
          target: '.tour-mapel',
          title: 'Tentukan Materi',
          content: 'Pilih mata pelajaran spesifik yang ingin kamu bahas pada sesi ini.',
          placement: 'top',
          disableBeacon: true,
          spotlightPadding: 6,
        },
        {
          target: '.tour-method',
          title: 'Metode Pertemuan',
          content: 'Pilih apakah kamu ingin belajar secara Online atau Offline (Tatap Muka).',
          placement: 'top',
          disableBeacon: true,
          spotlightPadding: 6,
        },
        {
          target: '.tour-book-now',
          title: 'Sewa & Atur Jadwal',
          content: 'Sama seperti ini! Tinggal klik Booking Sekarang, dan jadwal belajarmu akan otomatis tercatat.',
          placement: 'top',
          disableBeacon: true,
          spotlightPadding: 8,
        }
      ];
    }

    if (currentSteps.length > 0) {
      setSteps(currentSteps);
      setTimeout(() => setRun(true), 1200);
    } else {
      setRun(false);
    }

  }, [userRole, selectedTutorId]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;
    const isMainTour = steps.length > 4;

    if (type === 'step:after') {
      if (action === 'next') {
        const targetElement = document.querySelector(step.target as string) as HTMLElement;
        if (targetElement) {
          targetElement.click();
        }
      } else if (action === 'prev') {
        if (isMainTour && index === 2) {
          // If going back from feature tour to explore button, explicitly go back to home tab for context
          setActiveTab('home');
        }
      }
    }

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Check if the user finished or skipped the tour
    if (finishedStatuses.includes(status) || action === 'close') {
      setRun(false);
      
      if (action === 'close' || status === STATUS.SKIPPED) {
        localStorage.setItem('tutorku_tour_skipped', 'true');
        if (isMainTour) setActiveTab('home');
      } else {
        if (isMainTour) {
          localStorage.setItem('tutorku_tour_main', 'true');
          setActiveTab('home');
        } else if (selectedTutorId) {
          localStorage.setItem('tutorku_tour_detail', 'true');
        }
      }
    }
  };

  const CustomTooltip = ({
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    tooltipProps,
    isLastStep,
  }: TooltipRenderProps) => {
    return (
      <div {...tooltipProps} className="bg-bg-2 border-[1.5px] border-border rounded-[14px] p-4 w-[280px] sm:w-[320px] shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        <div className="mb-1">
          {step.title && (
            <div className="font-display font-bold text-[15px] text-text-main mb-1.5 flex items-center justify-between gap-4">
               <div className="flex items-center gap-2">
                 <span>{step.title}</span>
                 {primaryProps.title !== 'Mengerti!' && (
                   <span className="bg-lime/20 text-lime px-2 py-[2px] rounded-full text-[9px] font-mono whitespace-nowrap">
                     {index + 1} / {steps.length}
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
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      showProgress={false}
      showSkipButton
      spotlightClicks={true}
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
