import React, { useState, useEffect } from 'react';
import { Joyride, CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride';
import { useAppContext } from '../AppContext';
import { supabase } from '../lib/supabase';

// Phase 1: Welcome & Sidebar explore button (on Home tab)
// Phase 2: Filters & Cards (on Search tab)
// Phase 3: Schedule & Booking (on TutorDetail overlay)

export function AppTour() {
  const { userRole, activeTab, selectedTutorId, user } = useAppContext();
  
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourPhase, setTourPhase] = useState<'home' | 'search' | 'booking' | null>(null);

  // Use interval to check when to start tours
  useEffect(() => {
    if (userRole !== 'siswa' || !user || run) return;
    
    let isPolling = true;

    const checkAndStartTour = () => {
      if (!isPolling) return;
      
      const meta = user?.user_metadata || {};
      const skipped = meta.tour_skipped;
      
      const doneHome = meta.tour_home_completed || skipped;
      const doneSearch = meta.tour_search_completed || skipped;
      const doneBooking = meta.tour_booking_completed || skipped;

      const isMobile = window.innerWidth < 768;
      const exploreTarget = isMobile ? '.tour-explore-mobile' : '.tour-explore-desktop';

      if (!doneHome && activeTab === 'home' && !selectedTutorId) {
        if (document.querySelector(exploreTarget)) {
          setTourPhase('home');
          setSteps([
            {
              target: 'body',
              placement: 'center',
              content: 'Halo! Selamat datang di TutorKu. Yuk ikuti panduan singkat ini.',
              title: 'Selamat Datang!',
            },
            {
              target: exploreTarget,
              content: 'Di navigasi ini, kamu bisa mencari tutor yang cocok untukmu. Silakan klik Explore untuk melanjutkan!',
              title: 'Eksplorasi',
            }
          ]);
          setStepIndex(0);
          setRun(true);
          isPolling = false;
        }
      } else if (doneHome && !doneSearch && activeTab === 'search' && !selectedTutorId) {
        if (document.querySelector('.tour-filter-gender') && document.querySelector('.tour-tutor-card-list')) {
          setTourPhase('search');
          setSteps([
            {
              target: '.tour-filter-gender',
              content: 'Kamu bisa mengatur preferensi tutor berdasarkan jenis kelamin di sini.',
              title: 'Filter Gender',
            },
            {
              target: '.tour-filter-subject',
              content: 'Pilih mata pelajaran yang ingin dipelajari secara spesifik.',
              title: 'Filter Mata Pelajaran',
            },
            {
              target: '.tour-tutor-card-list',
              content: 'Ini adalah daftar tutor yang tersedia, pilih salah satu untuk melihat detilnya!',
              title: 'Pilih Tutor',
            }
          ]);
          setStepIndex(0);
          setRun(true);
          isPolling = false;
        }
      } else if (doneHome && doneSearch && !doneBooking && selectedTutorId) {
        if (document.querySelector('.tour-schedule') && document.querySelector('.tour-book-now')) {
          setTourPhase('booking');
          setSteps([
            {
              target: '.tour-schedule',
              content: 'Kamu bisa memilih slot jadwal tutor yang tersedia di sini.',
              title: 'Jadwal Mengajar',
            },
            {
              target: '.tour-book-now',
              content: 'Setelah semuanya dipastikan, tekan tombol ini untuk request kelas!',
              title: 'Ayo Mulai!',
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

  const cleanupJoyride = () => {
    document.body.style.overflow = '';
    const overlay = document.querySelector('.react-joyride__overlay');
    if (overlay) overlay.remove();
    const spotlight = document.querySelector('.react-joyride__spotlight');
    if (spotlight) spotlight.remove();
  };

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, action, index, type } = data;

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status) || action === 'close' || type === 'tour:end') {
      setRun(false);
      setStepIndex(0);
      cleanupJoyride();
      
      const updateData: any = {};
      
      if (tourPhase === 'home') updateData.tour_home_completed = true;
      if (tourPhase === 'search') updateData.tour_search_completed = true;
      if (tourPhase === 'booking') updateData.tour_booking_completed = true;
      
      if (status === STATUS.SKIPPED || action === 'close') {
         updateData.tour_skipped = true;
      }

      if (user) {
         try {
           await supabase.auth.updateUser({ data: updateData });
           user.user_metadata = { ...user.user_metadata, ...updateData };
         } catch(e) {
           console.error("Failed to update tour status", e);
         }
      }
      
      setTourPhase(null);
      return;
    }

    if (type === 'step:after') {
      if (action === 'next') {
        if (index + 1 >= steps.length) {
            setRun(false);
            setStepIndex(0);
            cleanupJoyride();
            
            // Auto complete this phase
            const updateData: any = {};
            if (tourPhase === 'home') updateData.tour_home_completed = true;
            if (tourPhase === 'search') updateData.tour_search_completed = true;
            if (tourPhase === 'booking') updateData.tour_booking_completed = true;
            
            if (user) {
               supabase.auth.updateUser({ data: updateData }).then(() => {
                 user.user_metadata = { ...user.user_metadata, ...updateData };
               });
            }
            setTourPhase(null);
        } else {
            setStepIndex(index + 1);
        }
      } else if (action === 'prev') {
        setStepIndex(Math.max(0, index - 1));
      }
    }
    
    if (type === 'error:target_not_found') {
      setRun(false); 
      setStepIndex(0);
      cleanupJoyride();
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
            Lewati Tour
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

  if (steps.length === 0) return null;

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
