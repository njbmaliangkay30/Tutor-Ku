import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../AppContext';
import { supabase } from '../lib/supabase';
import { X, ChevronRight, Check } from 'lucide-react';

export function GuidedTour() {
  const { user, userRole, activeTab, selectedTutorId } = useAppContext();
  
  const [isCompleted, setIsCompleted] = useState(true);
  const [subStep, setSubStep] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (userRole !== 'siswa' || !user) {
      setIsCompleted(true);
      return;
    }
    
    // Slight delay to ensure UI has loaded before popping up tour
    const timer = setTimeout(() => {
       const lsChecked = localStorage.getItem('tutorku_tour_v3');
       if (lsChecked) {
         setIsCompleted(true);
         return;
       }
       const meta = user.user_metadata || {};
       if (meta.tour_v3) {
         localStorage.setItem('tutorku_tour_v3', 'true');
         setIsCompleted(true);
       } else {
         setIsCompleted(false);
       }
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, userRole]);

  const markCompleted = async () => {
    setIsCompleted(true);
    localStorage.setItem('tutorku_tour_v3', 'true');
    if (user) {
       await supabase.auth.updateUser({
         data: { tour_v3: true }
       });
       user.user_metadata = { ...user.user_metadata, tour_v3: true };
    }
  };

  if (isCompleted || !mounted) return null;

  let phase = null;
  if (activeTab === 'home' && !selectedTutorId) {
    phase = 'home';
  } else if (activeTab === 'search' && !selectedTutorId) {
    phase = subStep === 'search_card' ? 'search_card' : 'search_filter';
  } else if (selectedTutorId) {
    phase = subStep === 'book_button' ? 'book_button' : 'booking_schedule';
  }

  if (!phase) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      <TourTipManager
        key={phase}
        phase={phase}
        onNext={(nextSub) => setSubStep(nextSub)}
        onSkip={markCompleted}
      />
    </AnimatePresence>,
    document.body
  );
}

function TourTipManager({ phase, onNext, onSkip }: { 
  phase: string; 
  onNext: (sub: string | null) => void; 
  onSkip: () => void 
}) {
  const isMobile = window.innerWidth < 768;

  let config: any = null;
  
  if (phase === 'home') {
    config = {
      targetSelector: isMobile ? '.tour-explore-mobile' : '.tour-explore-desktop',
      title: 'Selamat Datang!',
      content: 'Halo! Mari kita cari tutor yang pas buatmu. Kamu bisa mulai dengan membuka halaman Eksplorasi ya.',
      placement: isMobile ? 'top' : 'right',
      actionWait: true,
      actionText: 'Ketuk menu di bar',
      requireRect: true
    };
  } else if (phase === 'search_filter') {
    config = {
      targetSelector: '.tour-filter-gender',
      title: 'Filter Pencarian',
      content: 'Di sini kamu bisa mencari dan menyaring tutor berdasarkan gender atau mata pelajaran tertentu.',
      placement: 'bottom',
      requireRect: true,
      onAction: () => onNext('search_card')
    };
  } else if (phase === 'search_card') {
    config = {
      targetSelector: '.tour-tutor-card-list',
      title: 'Pilih Tutor',
      content: 'Wah banyak sekali ya! Coba ketuk salah satu kartu tutor untuk melihat jadwal dan detail selengkapnya.',
      placement: 'top',
      actionWait: true,
      actionText: 'Pilih satu tutor',
      requireRect: true
    };
  } else if (phase === 'booking_schedule') {
    config = {
      targetSelector: '.tour-schedule',
      title: 'Jadwal Mengajar',
      content: 'Setelah melihat profil tutor, kamu bisa menentukan jadwal mengajar di sesi-sesi yang tersedia ini.',
      placement: 'bottom',
      requireRect: true,
      onAction: () => onNext('book_button')
    };
  } else if (phase === 'book_button') {
    config = {
      targetSelector: '.tour-book-now',
      title: 'Ayo Mulai!',
      content: 'Kalau sudah yakin, tekan tombol ini untuk request kelas ya. Selesai deh tour singkatnya!',
      placement: 'top',
      requireRect: true,
      isFinal: true,
      onAction: onSkip
    };
  }

  if (!config) return null;

  return <TourTip {...config} onSkip={onSkip} />;
}

// Actual floating component
function TourTip({ 
  targetSelector, 
  title, 
  content, 
  placement, 
  requireRect,
  actionWait, 
  actionText, 
  onAction,
  isFinal,
  onSkip 
}: any) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => {
      const el = document.querySelector(targetSelector);
      if (el) {
         setRect(el.getBoundingClientRect());
      }
    };
    updateRect();
    const iv = setInterval(updateRect, 500);
    window.addEventListener('resize', updateRect);
    return () => {
      clearInterval(iv);
      window.removeEventListener('resize', updateRect);
    };
  }, [targetSelector]);

  // wait until we find the element
  if (requireRect && !rect) return null;

  let top = 0;
  let left = 0;
  const tooltipWidth = 280;
  const margin = 16;

  if (rect) {
    if (placement === 'bottom') {
      top = rect.bottom + margin;
      left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    } else if (placement === 'top') {
      top = rect.top - margin - 140; // rough height estimate
      left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    } else if (placement === 'right') {
      top = rect.top + (rect.height / 2) - 70;
      left = rect.right + margin;
    } else if (placement === 'left') {
      top = rect.top + (rect.height / 2) - 70;
      left = rect.left - tooltipWidth - margin;
    }
  }

  // Viewport bounds correction
  if (left < margin) left = margin;
  if (left + tooltipWidth > window.innerWidth - margin) {
     left = window.innerWidth - tooltipWidth - margin;
  }
  
  if (top < margin) {
      if (rect && placement === 'top') {
          // Flip to bottom if no space top
          top = rect.bottom + margin;
      } else {
          top = margin;
      }
  }
  
  if (top + 140 > window.innerHeight - margin) {
      if (rect && placement === 'bottom') {
          top = rect.top - margin - 140;
      }
  }

  return (
    <div style={{ position: 'fixed', zIndex: 999999, top, left, width: tooltipWidth }} className="pointer-events-auto">
      <motion.div 
        initial={{ opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
        className="bg-bg-2 border-[1.5px] border-lime/50 rounded-[14px] p-4 shadow-[0_10px_50px_rgba(0,0,0,0.8),0_0_0_1px_rgba(200,255,0,0.1)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-lime/10 blur-[40px] -m-10 rounded-full pointer-events-none" />
        
        <div className="flex justify-between items-start mb-2 relative z-10">
          <h3 className="font-display font-bold text-[14px] text-lime">{title}</h3>
          <button onClick={onSkip} className="text-text-sub hover:text-text-main transition-colors p-[2px] -m-[2px] rounded">
            <X size={14} />
          </button>
        </div>
        
        <p className="text-[12.5px] text-text-sub mb-4 leading-relaxed relative z-10">
           {content}
        </p>
        
        <div className="flex justify-end mt-2 relative z-10">
          {actionWait ? (
             <div className="text-[10px] text-lime/80 italic font-mono uppercase tracking-[0.05em] flex items-center gap-1.5 bg-lime/[0.08] px-2.5 py-1.5 rounded-md border border-lime/20 shadow-inner">
                {actionText || 'Menunggu aksi...'} <span className="animate-pulse text-lime">●</span>
             </div>
          ) : (
            <button 
               onClick={onAction} 
               className="bg-lime text-black px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-sh1 hover:shadow-sh2"
            >
              {isFinal ? 'Selesai' : 'Oke'} {isFinal ? <Check size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
