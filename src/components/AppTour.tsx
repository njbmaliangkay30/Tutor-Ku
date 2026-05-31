import React, { useState, useEffect } from 'react';
import { Joyride, CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride';
import { useAppContext } from '../AppContext';
import { supabase } from '../lib/supabase';

export function AppTour() {
  const { userRole, activeTab, setActiveTab, selectedTutorId, user } = useAppContext();
  
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourType, setTourType] = useState<'main' | 'booking' | null>(null);

  // Use interval to check when to start tours
  useEffect(() => {
    if (userRole !== 'siswa' || !user || run) return;
    
    let isPolling = true;

    const checkAndStartTour = () => {
      if (!isPolling) return;
      
      const meta = user?.user_metadata || {};
      const hasCompletedMain = meta.tour_main_completed || meta.tour_skipped;
      const hasCompletedBooking = meta.tour_booking_completed || meta.tour_skipped;

      const isMobile = window.innerWidth < 768;
      const exploreTarget = isMobile ? '.tour-explore-mobile' : '.tour-explore-desktop';

      if (!hasCompletedMain && !selectedTutorId && activeTab === 'home') {
        if (document.querySelector(exploreTarget)) {
          setTourType('main');
          setSteps([
            {
              target: 'body',
              placement: 'center',
              content: 'Halo! Selamat datang di TutorKu. Yuk ikuti panduan singkat ini.',
              title: 'Selamat Datang!',
              disableBeacon: true
            },
            {
              target: exploreTarget,
              content: 'Di navigasi ini, kamu bisa mencari tutor yang cocok untukmu.',
              title: 'Eksplorasi',
              disableBeacon: true
            },
            {
              target: '.tour-filter-gender',
              content: 'Kamu bisa mengatur preferensi tutor berdasarkan jenis kelamin di sini.',
              title: 'Filter Gender',
              disableBeacon: true
            },
            {
              target: '.tour-filter-subject',
              content: 'Pilih mata pelajaran yang ingin dipelajari secara spesifik.',
              title: 'Filter Mata Pelajaran',
              disableBeacon: true
            },
            {
              target: '.tour-tutor-card-list',
              content: 'Ini adalah daftar tutor yang tersedia, pilih salah satu untuk melihat lebih lanjut!',
              title: 'Pilih Tutor',
              disableBeacon: true
            }
          ]);
          setStepIndex(0);
          setRun(true);
          isPolling = false;
        }
      } else if (!hasCompletedBooking && selectedTutorId) {
        if (document.querySelector('.tour-schedule') && document.querySelector('.tour-book-now')) {
          setTourType('booking');
          setSteps([
            {
              target: '.tour-schedule',
              content: 'Kamu bisa memilih slot jadwal tutor yang tersedia di sini.',
              title: 'Jadwal Mengajar',
              disableBeacon: true
            },
            {
              target: '.tour-book-now',
              content: 'Setelah semuanya dipastikan, tekan tombol ini untuk request kelas!',
              title: 'Ayo Mulai!',
              disableBeacon: true
            }
          ]);
          setStepIndex(0);
          setRun(true);
          isPolling = false;
        }
      }
    };

    const interval = setInterval(checkAndStartTour, 1000);

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [userRole, selectedTutorId, activeTab, user, run]);

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, action, index, type } = data;

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status) || action === 'close' || type === 'tour:end') {
      setRun(false);
      setStepIndex(0);
      
      const updateData: any = {};
      
      if (tourType === 'main') {
        updateData.tour_main_completed = true;
      } else if (tourType === 'booking') {
        updateData.tour_booking_completed = true;
      }
      
      if (status === STATUS.SKIPPED || action === 'close') {
         updateData.tour_skipped = true;
         updateData.tour_main_completed = true;
         updateData.tour_booking_completed = true;
      }

      if (user) {
         try {
           await supabase.auth.updateUser({ data: updateData });
           user.user_metadata = { ...user.user_metadata, ...updateData };
         } catch(e) {
           console.error("Failed to update tour status", e);
         }
      }
      
      setTourType(null);
      return;
    }

    if (type === 'error:target_not_found') {
      // Just close it on severe error so the screen doesn't freeze dark
      setRun(false); 
      setStepIndex(0);
      return;
    }

    if (type === 'step:after') {
      if (action === 'next') {
        if (tourType === 'main' && index === 1) {
          setActiveTab('search');
          // Wait until the search tab renders
          const checkDOM = setInterval(() => {
            if (document.querySelector('.tour-filter-gender')) {
              clearInterval(checkDOM);
              setStepIndex(index + 1);
            }
          }, 300);
          
          // Fallback cleanup if somehow it takes too long
          setTimeout(() => clearInterval(checkDOM), 5000);
          return;
        }
        
        if (index + 1 >= steps.length) {
            setRun(false);
            setStepIndex(0);
        } else {
            setStepIndex(index + 1);
        }
      } else if (action === 'prev') {
        if (tourType === 'main' && index === 2) {
          setActiveTab('home');
          const checkDOM = setInterval(() => {
             const isMobile = window.innerWidth < 768;
             const exploreTarget = isMobile ? '.tour-explore-mobile' : '.tour-explore-desktop';
             if (document.querySelector(exploreTarget)) {
               clearInterval(checkDOM);
               setStepIndex(index - 1);
             }
          }, 300);
          setTimeout(() => clearInterval(checkDOM), 5000);
          return;
        }
        setStepIndex(index - 1);
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
      <div {...tooltipProps} className="bg-bg-2 border-[1.5px] border-border rounded-[14px] p-4 w-[280px] sm:w-[320px] shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative z-[999999]">
        <div className="mb-1">
          {step.title && (
            <div className="font-display font-bold text-[15px] text-text-main mb-1.5 flex items-center justify-between gap-4">
               <div className="flex items-center gap-2">
                 <span>{step.title}</span>
               </div>
            </div>
          )}
          <div className="text-[13px] text-text-sub leading-snug">
            {step.content}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <button {...closeProps} className="text-text-sub hover:text-text-main text-[11px] font-bold px-2 py-1 transition-colors">
            Lewati
          </button>
          
          <div className="flex items-center gap-2">
             {index > 0 && (
               <button {...backProps} className="text-text-sub hover:text-text-main text-[12px] font-bold px-3 py-1.5 transition-colors">
                 Kembali
               </button>
             )}
             <button {...primaryProps} className="bg-lime text-black font-bold text-[12px] px-3.5 py-1.5 rounded-lg border-[1.5px] border-lime shadow-[0_0_12px_rgba(200,255,0,0.2)] hover:shadow-[0_0_15px_rgba(200,255,0,0.3)] transition-all">
                {isLastStep ? 'Selesai' : 'Lanjut'}
             </button>
          </div>
        </div>
      </div>
    );
  };

  if (!run || steps.length === 0) return null;

  return (
    <Joyride
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      showProgress={false}
      showSkipButton
      disableOverlayClose={true}
      steps={steps}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#c8ff00',
          textColor: '#f1f1f1',
          arrowColor: '#1a1a1a',
          backgroundColor: '#1a1a1a',
          overlayColor: 'rgba(0, 0, 0, 0.75)'
        } as any,
      }}
    />
  );
}
