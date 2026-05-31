import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../AppContext';
import { supabase } from '../lib/supabase';
import { Sparkles, Navigation } from 'lucide-react';

export function GuidedTour() {
  const { user, userRole, activeTab, selectedTutorId } = useAppContext();
  
  const [tourState, setTourState] = useState<{
      mainDone: boolean;
      bookingDone: boolean;
      ready: boolean;
  }>({ mainDone: true, bookingDone: true, ready: false });

  const [subStep, setSubStep] = useState<string | null>(null);

  useEffect(() => {
     if (userRole !== 'siswa' || !user) {
         setTourState(prev => ({...prev, ready: true}));
         return;
     }

     const meta = user.user_metadata || {};
     // LocalStorage overrides for fast loading
     const lsMain = localStorage.getItem('tour_main_done');
     const lsBooking = localStorage.getItem('tour_booking_done');
     
     const mainDone = meta.tour_main_completed || meta.tour_skipped || lsMain === 'true';
     const bookingDone = meta.tour_booking_completed || meta.tour_skipped || lsBooking === 'true';
     
     setTourState({
         mainDone,
         bookingDone,
         ready: true
     });
  }, [user, userRole]);

  // Phase logic
  useEffect(() => {
      if (!tourState.ready) return;

      if (!tourState.mainDone) {
          if (activeTab === 'home' && !selectedTutorId) {
              if (subStep !== 'main_explore') setSubStep('main_explore');
          } else if (activeTab === 'search' && !selectedTutorId) {
              if (subStep !== 'main_filter' && subStep !== 'main_card') {
                  setSubStep('main_filter');
              }
          } else {
              setSubStep(null);
          }
      } else if (!tourState.bookingDone) {
          if (selectedTutorId) {
              if (subStep !== 'booking_start' && subStep !== 'booking_fields' && subStep !== 'booking_submit') {
                  setSubStep('booking_start');
              }
          } else {
              setSubStep(null);
          }
      } else {
          setSubStep(null);
      }
  }, [tourState, activeTab, selectedTutorId, subStep]);

  const completeMain = () => {
      setTourState(prev => ({...prev, mainDone: true}));
      setSubStep(null);
      localStorage.setItem('tour_main_done', 'true');
      if (user) supabase.auth.updateUser({ data: { tour_main_completed: true } });
  };

  const completeBooking = () => {
      setTourState(prev => ({...prev, bookingDone: true}));
      setSubStep(null);
      localStorage.setItem('tour_booking_done', 'true');
      if (user) supabase.auth.updateUser({ data: { tour_booking_completed: true } });
  };

  if (!tourState.ready || !subStep) return null;

  return createPortal(
     <TourEngine 
         subStep={subStep} 
         onNext={(step: string) => setSubStep(step)} 
         onCompleteMain={completeMain}
         onCompleteBooking={completeBooking}
     />,
     document.body
  );
}

function TourEngine({ subStep, onNext, onCompleteMain, onCompleteBooking }: any) {
    const isMobile = window.innerWidth < 768;
    let config: any = null;

    if (subStep === 'main_explore') {
        config = {
            targetSelector: isMobile ? '.tour-explore-mobile' : '.tour-explore-desktop',
            title: 'Mulai Pencarian',
            content: 'Ketuk menu Eksplorasi ini untuk berpindah ke halaman pencarian tutor.',
            actionType: 'wait_click',
            actionText: 'Ketuk untuk lanjut'
        };
    } else if (subStep === 'main_filter') {
        config = {
            targetSelector: '.tour-filter-gender',
            title: 'Saring Sesuai Kebutuhan',
            content: 'Kamu bisa memfilter tutor berdasarkan Jenis Kelamin dan Mata Pelajaran.',
            actionType: 'button',
            actionText: 'Paham',
            onAction: () => onNext('main_card'),
            placement: 'bottom'
        };
    } else if (subStep === 'main_card') {
        config = {
            targetSelector: '.tour-tutor-card-list > div:not(.text-center)', 
            fallbackSelector: '.tour-tutor-card-list',
            title: 'Pilih Tutor',
            content: 'Ini adalah kartu tutor. Pilih salah satu untuk melihat profil lengkap, jadwal, dan mulai booking!',
            actionType: 'button',
            actionText: 'Selesai Tour',
            onAction: onCompleteMain,
            placement: 'top'
        };
    } else if (subStep === 'booking_start') {
        config = {
            targetSelector: '.tour-schedule',
            title: 'Jadwal Sesi Pertama',
            content: 'Di sini, kamu bisa melihat dan memilih jadwal sesi mengajar yang sedang tersedia pada minggu ini.',
            actionType: 'button',
            actionText: 'Oke, Lanjut',
            onAction: () => onNext('booking_fields'),
            placement: 'bottom'
        };
    } else if (subStep === 'booking_fields') {
        config = {
            targetSelector: '.tour-mapel',
            title: 'Isi Detail Kelas',
            content: 'Pastikan kamu memilih Mata Pelajaran wajib yang diinginkan dan Metode Pertemuan di bagian ini ya.',
            actionType: 'button',
            actionText: 'Mengerti',
            onAction: () => onNext('booking_submit'),
            placement: 'bottom'
        };
    } else if (subStep === 'booking_submit') {
        config = {
            targetSelector: '.tour-book-now',
            title: 'Booking Tutor!',
            content: 'Jika semua sudah sesuai, klik tombol ini untuk mengirim permintaan kelasmu ke tutor.',
            actionType: 'button',
            actionText: 'Selesai Tour',
            onAction: onCompleteBooking,
            placement: 'top'
        };
    }

    if (!config) return null;

    return <Spotlight config={config} />;
}

function Spotlight({ config }: { config: any }) {
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        let scrolled = false;
        const check = () => {
             const el = document.querySelector(config.targetSelector) || (config.fallbackSelector ? document.querySelector(config.fallbackSelector) : null);
             if (el) {
                 if (!scrolled) {
                     // Attempt to scroll the target smoothly into the center of the scrollable view
                     el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                     scrolled = true;
                 }
                 const newRect = el.getBoundingClientRect();
                 setRect(prev => {
                     // Dampen micro-movements during scroll slightly or accept if changed > 1px
                     if (!prev || Math.abs(prev.top - newRect.top) > 1 || Math.abs(prev.left - newRect.left) > 1 || prev.width !== newRect.width || prev.height !== newRect.height) {
                         return newRect;
                     }
                     return prev;
                 });
             }
        };
        check();
        const iv = setInterval(check, 100);
        window.addEventListener('resize', check);
        
        return () => {
           clearInterval(iv);
           window.removeEventListener('resize', check);
        };
    }, [config.targetSelector, config.fallbackSelector]);

    if (!rect) return null;

    const padding = 10;
    const tRect = {
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        bottom: rect.bottom + padding,
        right: rect.right + padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
    };

    const tooltipW = 280;
    let tTop = tRect.bottom + 16;
    let tLeft = tRect.left + (tRect.width / 2) - (tooltipW / 2);
    let pointerPos = 'top';

    if (config.placement === 'top' || tTop + 160 > window.innerHeight) {
        tTop = tRect.top - 16 - 160; 
        pointerPos = 'bottom'; 
        if (tTop < 16) {
           tTop = 16;
           pointerPos = 'none';
        }
    }

    if (tLeft < 16) tLeft = 16;
    if (tLeft + tooltipW > window.innerWidth - 16) tLeft = window.innerWidth - tooltipW - 16;

    return (
        <div className="fixed inset-0 z-[100000] pointer-events-none">
            {/* Top Backdrop */}
            <div className="absolute top-0 left-0 right-0 bg-bg-base/70 backdrop-blur-sm pointer-events-none transition-all duration-500 ease-out" style={{ height: Math.max(0, tRect.top + 1) }} />
            {/* Bottom Backdrop */}
            <div className="absolute left-0 right-0 bg-bg-base/70 backdrop-blur-sm pointer-events-none transition-all duration-500 ease-out" style={{ top: Math.max(0, tRect.bottom - 1), bottom: 0 }} />
            {/* Left Backdrop */}
            <div className="absolute bg-bg-base/70 backdrop-blur-sm pointer-events-none transition-all duration-500 ease-out" style={{ top: tRect.top, height: tRect.height, left: 0, width: Math.max(0, tRect.left + 1) }} />
            {/* Right Backdrop */}
            <div className="absolute bg-bg-base/70 backdrop-blur-sm pointer-events-none transition-all duration-500 ease-out" style={{ top: tRect.top, height: tRect.height, left: Math.max(0, tRect.right - 1), right: 0 }} />
            
            {/* Spotlight Border - Hole is naturally left untouched inside this boundary */}
            <div className="absolute rounded-[14px] border-2 border-lime animate-pulse pointer-events-none transition-all duration-500 ease-out shadow-[0_0_30px_rgba(200,255,0,0.2)]"
                 style={{ top: tRect.top, left: tRect.left, width: tRect.width, height: tRect.height }} />
            
            {/* Tooltip Card */}
            <motion.div 
               initial={{ opacity: 0, y: pointerPos === 'top' ? -10 : 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               key={config.title} 
               className="absolute bg-bg-2 border-[1.5px] border-border rounded-2xl p-4 w-[280px] shadow-[0_10px_50px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-auto"
               style={{ top: tTop, left: tLeft, transition: 'top 0.5s ease-out, left 0.5s ease-out' }}
            >
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-lime/10 flex items-center justify-center text-lime shrink-0">
                     <Sparkles size={12} />
                  </div>
                  <h4 className="font-display font-bold text-text-main text-[13px]">{config.title}</h4>
               </div>
               <p className="text-text-sub text-[12px] leading-relaxed mb-4">
                  {config.content}
               </p>
               
               <div className="flex justify-end relative z-10">
                  {config.actionType === 'button' ? (
                      <button 
                         onClick={config.onAction}
                         className="bg-lime text-black px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sh1 hover:shadow-sh2 active:scale-95 transition-all"
                      >
                          {config.actionText}
                      </button>
                  ) : (
                      <div className="bg-lime/10 border border-lime/20 text-lime px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase font-bold flex items-center gap-2">
                          <span className="animate-pulse">{config.actionText}</span>
                          <Navigation size={12} className="rotate-45 text-lime" />
                      </div>
                  )}
               </div>
            </motion.div>
        </div>
    );
}

