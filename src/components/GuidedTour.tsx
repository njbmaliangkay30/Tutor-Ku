import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../AppContext';
import { supabase } from '../lib/supabase';
import { Sparkles, Navigation } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export function GuidedTour() {
  const { user, userRole, activeTab, selectedTutorId, userProfile } = useAppContext();
  
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

     if (!userProfile || !userProfile.phone) return;

     const meta = user.user_metadata || {};
     
     // Detect account mismatches and clear leftover localStorage keys
     // If the database metadata says the user has NOT completed/skipped the tour,
     // but the local browser cache says they have, it must be from a previous user session.
     const dbMainDone = meta.tour_main_completed === true || meta.tour_skipped === true;
     const dbBookingDone = meta.tour_booking_completed === true || meta.tour_skipped === true;

     if (!dbMainDone && localStorage.getItem('tour_main_done') === 'true') {
         localStorage.removeItem('tour_main_done');
     }
     if (!dbBookingDone && localStorage.getItem('tour_booking_done') === 'true') {
         localStorage.removeItem('tour_booking_done');
     }

     const lsMain = localStorage.getItem('tour_main_done');
     const lsBooking = localStorage.getItem('tour_booking_done');
     
     const mainDone = dbMainDone || lsMain === 'true';
     const bookingDone = dbBookingDone || lsBooking === 'true';
     
     // Cache them to localStorage if they are true from DB meta for faster future loading
     if (dbMainDone && lsMain !== 'true') {
         localStorage.setItem('tour_main_done', 'true');
     }
     if (dbBookingDone && lsBooking !== 'true') {
         localStorage.setItem('tour_booking_done', 'true');
     }

     setTourState({
         mainDone,
         bookingDone,
         ready: true
     });
  }, [user, userRole, userProfile]);

  // Phase logic
  useEffect(() => {
      if (!tourState.ready) return;

      if (!tourState.mainDone) {
          if (activeTab === 'home' && !selectedTutorId) {
              if (subStep !== 'main_explore') setSubStep('main_explore');
          } else if (activeTab === 'search' && !selectedTutorId) {
              if (subStep !== 'main_filter_gender' && subStep !== 'main_filter_subject' && subStep !== 'main_card') {
                  setSubStep('main_filter_gender');
              }
          } else {
              setSubStep(null);
          }
      } else if (!tourState.bookingDone) {
          if (selectedTutorId) {
              if (!['book_review', 'book_package', 'book_schedule', 'book_method', 'book_notes', 'book_submit'].includes(subStep || '')) {
                  setSubStep('book_review');
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

  const skipTour = () => {
      setTourState({ mainDone: true, bookingDone: true, ready: true });
      setSubStep(null);
      localStorage.setItem('tour_main_done', 'true');
      localStorage.setItem('tour_booking_done', 'true');
      if (user) supabase.auth.updateUser({ data: { tour_skipped: true } });
  };

  if (!tourState.ready || !subStep) return null;

  return createPortal(
     <TourEngine 
         subStep={subStep} 
         onNext={(step: string) => setSubStep(step)} 
         onCompleteMain={completeMain}
         onCompleteBooking={completeBooking}
         onSkip={skipTour}
     />,
     document.body
  );
}

function TourEngine({ subStep, onNext, onCompleteMain, onCompleteBooking, onSkip }: any) {
    const isMobile = window.innerWidth < 768;
    const { t } = useTranslation();
    let config: any = null;

    if (subStep === 'main_explore') {
        config = {
            targetSelector: isMobile ? '.tour-explore-mobile' : '.tour-explore-desktop',
            title: t('tour.step_main_explore_title'),
            content: t('tour.step_main_explore_content'),
            actionType: 'wait_click',
            actionText: t('tour.step_main_explore_action')
        };
    } else if (subStep === 'main_filter_gender') {
        config = {
            targetSelector: '.tour-filter-gender',
            title: t('tour.step_main_filter_gender_title'),
            content: t('tour.step_main_filter_gender_content'),
            actionType: 'button',
            actionText: t('tour.step_main_filter_gender_action'),
            onAction: () => onNext('main_filter_subject'),
            placement: 'bottom'
        };
    } else if (subStep === 'main_filter_subject') {
        config = {
            targetSelector: '.tour-filter-subject',
            title: t('tour.step_main_filter_subject_title'),
            content: t('tour.step_main_filter_subject_content'),
            actionType: 'button',
            actionText: t('tour.step_main_filter_subject_action'),
            onAction: () => onNext('main_card'),
            placement: 'bottom'
        };
    } else if (subStep === 'main_card') {
        config = {
            targetSelector: '.tour-tutor-card-list > div:not(.text-center)', 
            fallbackSelector: '.tour-tutor-card-list',
            title: t('tour.step_main_card_title'),
            content: t('tour.step_main_card_content'),
            actionType: 'wait_click',
            actionText: t('tour.step_main_card_action'),
            onAction: onCompleteMain,
            placement: 'top'
        };
    } else if (subStep === 'book_review') {
        config = {
            targetSelector: '.tour-book-review',
            title: t('tour.step_book_review_title'),
            content: t('tour.step_book_review_content'),
            actionType: 'button',
            actionText: t('tour.step_book_review_action'),
            onAction: () => onNext('book_package'),
            placement: 'bottom'
        };
    } else if (subStep === 'book_package') {
        config = {
            targetSelector: '.tour-package',
            fallbackSelector: '.tour-schedule',
            title: t('tour.step_book_package_title'),
            content: t('tour.step_book_package_content'),
            actionType: 'button',
            actionText: t('tour.step_book_package_action'),
            onAction: () => onNext('book_schedule'),
            placement: 'top'
        };
    } else if (subStep === 'book_schedule') {
        config = {
            targetSelector: '.tour-schedule',
            title: t('tour.step_book_schedule_title'),
            content: t('tour.step_book_schedule_content'),
            actionType: 'button',
            actionText: t('tour.step_book_schedule_action'),
            onAction: () => onNext('book_method'),
            placement: 'top',
            fixedPlacement: true
        };
    } else if (subStep === 'book_method') {
        config = {
            targetSelector: '.tour-mapel-method',
            title: t('tour.step_book_method_title'),
            content: t('tour.step_book_method_content'),
            actionType: 'button',
            actionText: t('tour.step_book_method_action'),
            onAction: () => onNext('book_notes'),
            placement: 'top'
        };
    } else if (subStep === 'book_notes') {
        config = {
            targetSelector: '.tour-notes',
            title: t('tour.step_book_notes_title'),
            content: t('tour.step_book_notes_content'),
            actionType: 'button',
            actionText: t('tour.step_book_notes_action'),
            onAction: () => onNext('book_submit'),
            placement: 'top'
        };
    } else if (subStep === 'book_submit') {
        config = {
            targetSelector: '.tour-book-now',
            title: t('tour.step_book_submit_title'),
            content: t('tour.step_book_submit_content'),
            actionType: 'button',
            actionText: t('tour.step_book_submit_action'),
            onAction: onCompleteBooking,
            placement: 'top'
        };
    }

    if (!config) return null;

    config.onSkip = onSkip;

    return <Spotlight config={config} />;
}

function Spotlight({ config }: { config: any }) {
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        let scrolled = false;
        let frame: number;
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
                     // Only update if dimensions changed or moved more than a subpixel
                     if (!prev || Math.abs(prev.top - newRect.top) > 0.5 || Math.abs(prev.left - newRect.left) > 0.5 || prev.width !== newRect.width || prev.height !== newRect.height) {
                         return newRect;
                     }
                     return prev;
                 });
             }
             frame = requestAnimationFrame(check); // Super smooth 60fps tracking
        };
        check();
        window.addEventListener('resize', check);
        
        return () => {
           cancelAnimationFrame(frame);
           window.removeEventListener('resize', check);
        };
    }, [config.targetSelector, config.fallbackSelector]);

    useEffect(() => {
        if (config.actionType !== 'wait_click') return;
        const hc = (e: MouseEvent) => {
            const el = document.querySelector(config.targetSelector) || (config.fallbackSelector ? document.querySelector(config.fallbackSelector) : null);
            if (el && el.contains(e.target as Node)) {
                if (config.onAction) config.onAction();
            }
        };
        document.addEventListener('click', hc, true);
        return () => document.removeEventListener('click', hc, true);
    }, [config]);

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

    if (config.placement === 'top' || (!config.fixedPlacement && tTop + 160 > window.innerHeight)) {
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
            <div className="absolute top-0 left-0 right-0 bg-bg-base/70 backdrop-blur-sm pointer-events-none" style={{ height: Math.max(0, tRect.top + 1) }} />
            {/* Bottom Backdrop */}
            <div className="absolute left-0 right-0 bg-bg-base/70 backdrop-blur-sm pointer-events-none" style={{ top: Math.max(0, tRect.bottom - 1), bottom: 0 }} />
            {/* Left Backdrop */}
            <div className="absolute bg-bg-base/70 backdrop-blur-sm pointer-events-none" style={{ top: tRect.top, height: tRect.height, left: 0, width: Math.max(0, tRect.left + 1) }} />
            {/* Right Backdrop */}
            <div className="absolute bg-bg-base/70 backdrop-blur-sm pointer-events-none" style={{ top: tRect.top, height: tRect.height, left: Math.max(0, tRect.right - 1), right: 0 }} />
            
            {/* Spotlight Border - Hole is naturally left untouched inside this boundary */}
            <div className="absolute rounded-[14px] border-[1.5px] border-lime pointer-events-none shadow-[0_0_30px_rgba(200,255,0,0.2)]"
                 style={{ top: tRect.top, left: tRect.left, width: tRect.width, height: tRect.height }} />
            
            {/* Tooltip Card */}
            <motion.div 
               initial={{ opacity: 0, y: pointerPos === 'top' ? -10 : 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               key={config.title} 
               className="absolute bg-bg-2 border-[1.5px] border-border rounded-2xl p-4 w-[280px] shadow-[0_10px_50px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-auto"
               style={{ top: tTop, left: tLeft }}
            >
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-lime/10 flex items-center justify-center text-lime shrink-0">
                       <Sparkles size={12} />
                    </div>
                    <h4 className="font-display font-bold text-text-main text-[13px]">{config.title}</h4>
                 </div>
                 <button onClick={config.onSkip} className="w-6 h-6 rounded-full hover:bg-bg-3 flex items-center justify-center text-text-sub transition-colors">
                    <span className="text-[10px] font-bold">✕</span>
                 </button>
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

