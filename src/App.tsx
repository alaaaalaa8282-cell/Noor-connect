import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { GlobalPrayerAlarm } from "@/components/GlobalPrayerAlarm";
import { SalamGreeting } from "@/components/SalamGreeting";
import { FestivePopup } from "@/components/FestivePopup";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { notificationManager } from "@/lib/notification-manager";
import { serviceWorkerManager } from "@/lib/service-worker-registration";
import { getPerformanceMonitor } from "@/lib/performance-monitor";
import { useGlobalRadio } from "@/lib/global-radio";
import { LayoutManager } from "@/components/LayoutManager";

// Set default theme to light if no preference saved
if (!localStorage.getItem("theme")) {
  localStorage.setItem("theme", "light");
} else if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

// Lazy load route components for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Quran = lazy(() => import("./pages/Quran"));
const SurahDetail = lazy(() => import("./pages/SurahDetail"));
const Tasbeeh = lazy(() => import("./pages/Tasbeeh"));
const Qibla = lazy(() => import("./pages/Qibla"));
const Duas = lazy(() => import("./pages/Duas"));
const Hadith = lazy(() => import("./pages/Hadith"));
const Profile = lazy(() => import("./pages/Profile"));
const IslamicCalendar = lazy(() => import("./pages/IslamicCalendar"));
const Ebooks = lazy(() => import("./pages/Ebooks"));
const QazaPage = lazy(() => import("./pages/QazaPage"));
const RamadanMode = lazy(() => import("./pages/RamadanMode"));
const NotificationHistory = lazy(() => import("./pages/NotificationHistory"));
const ZakatCalculator = lazy(() => import("./pages/ZakatCalculator"));
const NamesOfAllah = lazy(() => import("./pages/NamesOfAllah"));
const IslamicQuiz = lazy(() => import("./pages/IslamicQuiz"));
const PrayerStats = lazy(() => import("./pages/PrayerStats"));
const HabitTracker = lazy(() => import("./pages/HabitTracker"));
const QuranRadio = lazy(() => import("./pages/QuranRadio"));
const GlobalRadioPlayer = lazy(() => import("./components/GlobalRadioPlayer").then(module => ({ default: module.GlobalRadioPlayer })));
const NotFound = lazy(() => import("./pages/NotFound"));

function AppRoutes() {
  const location = useLocation();

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    }>
      <Routes location={location}>
        {/* Home/Dashboard */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/quran" element={<Quran />} />
        <Route path="/quran/:surahNumber" element={<SurahDetail />} />
        <Route path="/tasbeeh" element={<Tasbeeh />} />
        <Route path="/qibla" element={<Qibla />} />
        <Route path="/duas" element={<Duas />} />
        <Route path="/hadith" element={<Hadith />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/calendar" element={<IslamicCalendar />} />
        <Route path="/ebooks" element={<Ebooks />} />
        <Route path="/qaza" element={<QazaPage />} />
        <Route path="/ramadan" element={<RamadanMode />} />
        <Route path="/notification-history" element={<NotificationHistory />} />
        <Route path="/zakat" element={<ZakatCalculator />} />
        <Route path="/names-of-allah" element={<NamesOfAllah />} />
        <Route path="/quiz" element={<IslamicQuiz />} />
        <Route path="/prayer-stats" element={<PrayerStats />} />
        <Route path="/habit-tracker" element={<HabitTracker />} />
        <Route path="/quran-radio" element={<QuranRadio />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => {
  // Initialize performance monitoring
  useEffect(() => {
    const monitor = getPerformanceMonitor();
    
    // Log performance score after page load
    const logPerformance = () => {
      setTimeout(() => {
        const score = monitor.getPerformanceScore();
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 Performance Score: ${score}/100`);
        }
      }, 3000);
    };

    if (document.readyState === 'complete') {
      logPerformance();
    } else {
      window.addEventListener('load', logPerformance);
    }

    return () => {
      window.removeEventListener('load', logPerformance);
      monitor.destroy();
    };
  }, []);

  // Initialize notification system and Service Worker
  useEffect(() => {
    // Start the notification manager
    notificationManager.start();
    
    // Register Service Worker (only if not already registered in main.tsx)
    if (!navigator.serviceWorker.controller) {
      serviceWorkerManager.register().then(success => {
        if (success) {
          console.log('Service Worker registered successfully');
        }
      });
    }
    
    // Initialize global radio state
    const savedRadioState = localStorage.getItem('global-radio-state');
    if (savedRadioState) {
      try {
        const parsed = JSON.parse(savedRadioState);
        // If there was a playing station when app closed, the GlobalRadioPlayer will handle auto-showing
      } catch (error) {
        console.error('Failed to restore radio state:', error);
      }
    }
    
    // Cleanup on unmount
    return () => {
      notificationManager.stop();
    };
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex flex-col h-screen overflow-hidden" role="application" aria-label="Noor Connect - Islamic Companion App" style={{ willChange: 'transform' }}>
          {/* Header/Top Elements */}
          <div className="flex-shrink-0">
            <GlobalPrayerAlarm />
            <SalamGreeting />
            <FestivePopup />
            <PWAInstallPrompt />
          </div>
          
          {/* Main Content - Takes available space */}
          <LayoutManager>
            <AppRoutes />
          </LayoutManager>
          
          {/* Bottom Navigation */}
          <div className="flex-shrink-0">
            <BottomNav />
          </div>
        </div>
        
        {/* Global Radio Player - Fixed at bottom with proper z-index */}
        <GlobalRadioPlayer />
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;
