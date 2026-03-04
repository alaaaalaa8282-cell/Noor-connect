import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { notificationManager } from "@/lib/notification-manager";
import { serviceWorkerManager } from "@/lib/service-worker-registration";
import { getPerformanceMonitor } from "@/lib/performance-monitor";
import { islamicEventsService } from "@/lib/islamic-events-service";
import { LayoutManager } from "@/components/LayoutManager";
import { SplashScreen } from "@/components/SplashScreen";

// Lazy load critical components
const GlobalPrayerAlarm = lazy(() => import("@/components/GlobalPrayerAlarm").then(module => ({ default: module.GlobalPrayerAlarm })));
const SalamGreeting = lazy(() => import("@/components/SalamGreeting").then(module => ({ default: module.SalamGreeting })));
const FestivePopup = lazy(() => import("@/components/FestivePopup").then(module => ({ default: module.FestivePopup })));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt").then(module => ({ default: module.PWAInstallPrompt })));

// Global Radio and Quran Players - imported directly (not lazy loaded to avoid double wrapping)
import { GlobalRadioPlayer } from "@/components/GlobalRadioPlayer";
import { GlobalQuranPlayer } from "@/components/GlobalQuranPlayer";

// Set default theme to light if no preference saved
if (!localStorage.getItem("theme")) {
  localStorage.setItem("theme", "light");
} else if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

// Lazy load route components for code splitting - INCLUDING Dashboard for better LCP
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Quran = lazy(() => import("./pages/Quran"));
const QuranReader = lazy(() => import("./pages/QuranReader"));
const QuranProgress = lazy(() => import("./pages/QuranProgress"));
const Tasbeeh = lazy(() => import("./pages/Tasbeeh"));
const Qibla = lazy(() => import("./pages/Qibla"));
const Duas = lazy(() => import("./pages/Duas"));
const Hadith = lazy(() => import("./pages/Hadith"));
const Profile = lazy(() => import("./pages/Profile"));
const IslamicCalendar = lazy(() => import("./pages/IslamicCalendar"));
const Ebooks = lazy(() => import("./pages/EbooksModern"));
const QazaPage = lazy(() => import("./pages/QazaPage"));
const RamadanMode = lazy(() => import("./pages/RamadanMode"));
const MenstrualMode = lazy(() => import("./pages/MenstrualMode"));
const NotificationHistory = lazy(() => import("./pages/NotificationHistory"));
const ZakatCalculator = lazy(() => import("./pages/ZakatCalculator"));
const NamesOfAllah = lazy(() => import("./pages/NamesOfAllah"));
const IslamicQuiz = lazy(() => import("./pages/EnhancedIslamicQuiz"));
const PrayerStats = lazy(() => import("./pages/PrayerStats"));
const HabitTracker = lazy(() => import("./pages/HabitTracker"));
const QuranRadio = lazy(() => import("./pages/QuranRadio"));
const LiveStreams = lazy(() => import("./pages/LiveStreams"));
const Services = lazy(() => import("./pages/Services"));
const IslamicRemedies = lazy(() => import("./pages/IslamicRemedies"));
const RemedyFavorites = lazy(() => import("./pages/RemedyFavorites"));
const Tafsir = lazy(() => import("./pages/Tafsir"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { prefetchCriticalChunks } from "@/lib/build-optimization";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

// Prefetch critical route chunks after initial load
const prefetchRoutes = () => {
  // Use optimized prefetch strategy
  prefetchCriticalChunks();
};

// Start prefetching once the page is loaded
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    prefetchRoutes();
  } else {
    window.addEventListener('load', prefetchRoutes, { once: true });
  }
}


interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

const isStandaloneMode = (): boolean => {
  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean(navigatorWithStandalone.standalone) ||
    document.referrer.includes('android-app://')
  );
};

function AppRoutes() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a1128] via-[#1a237e] to-[#0d1b2a] relative overflow-hidden">
        {/* Static background orbs optimized for mobile performance */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#e0c097] rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#4fd1c5] rounded-full opacity-[0.03] blur-3xl" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Premium Spinner Container */}
          <div className="relative">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-[#e0c097]/20 scale-150" />

            {/* Spinner */}
            <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-[#e0c097]/30 border-t-[#e0c097]" />

            {/* Inner glow */}
            <div className="absolute inset-2 rounded-full bg-[#e0c097] blur-xl opacity-30 animate-pulse" />
          </div>

          {/* Text with glass effect */}
          <div className="glass-card px-6 py-3 rounded-2xl">
            <p className="text-[#e0c097] text-sm font-semibold tracking-widest uppercase">{t('loading')}</p>
          </div>
        </div>
      </div>
    }>
      <Routes location={location}>
        {/* Home/Dashboard */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/quran" element={<Quran />} />
        <Route path="/quran-reader/:surahNumber" element={<QuranReader />} />
        <Route path="/quran-progress" element={<QuranProgress />} />
        <Route path="/tasbeeh" element={<Tasbeeh />} />
        <Route path="/qibla" element={<Qibla />} />
        <Route path="/duas" element={<Duas />} />
        <Route path="/hadith" element={<Hadith />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/calendar" element={<IslamicCalendar />} />
        <Route path="/ebooks" element={<Ebooks />} />
        <Route path="/qaza" element={<QazaPage />} />
        <Route path="/ramadan" element={<RamadanMode />} />
        <Route path="/menstrual-mode" element={<MenstrualMode />} />
        <Route path="/notification-history" element={<NotificationHistory />} />
        <Route path="/zakat" element={<ZakatCalculator />} />
        <Route path="/names-of-allah" element={<NamesOfAllah />} />
        <Route path="/quiz" element={<IslamicQuiz />} />
        <Route path="/prayer-stats" element={<PrayerStats />} />
        <Route path="/habit-tracker" element={<HabitTracker />} />
        <Route path="/quran-radio" element={<QuranRadio />} />
        <Route path="/live" element={<LiveStreams />} />
        <Route path="/services" element={<Services />} />
        <Route path="/islamic-remedies" element={<IslamicRemedies />} />
        <Route path="/remedy-favorites" element={<RemedyFavorites />} />
        <Route path="/tafsir" element={<Tafsir />} />
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
        // Only log if we have a valid score or sufficient time has passed
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 Performance Score: ${score}/100`);
        }
      }, 5000);
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

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Initialize notification system and Service Worker
  useEffect(() => {
    // Check if we're in APK/PWA mode and handle permissions
    const isStandalone = isStandaloneMode();

    // Start the notification manager (only runs once per app load)
    notificationManager.start();

    // Initialize Islamic events service
    islamicEventsService.scheduleUpcomingEvents().catch(error => {
      console.error('Failed to schedule Islamic events:', error);
    });

    // Request permissions automatically
    const requestInitialPermissions = async () => {
      try {
        await import('@/lib/unified-notifications').then(mod => mod.unifiedNotifications.requestPermission());
        if (typeof window !== 'undefined' && 'Geolocation' in navigator) {
          import('@/lib/geolocation-service').then(mod => {
            if (mod.GeolocationService.isSupported()) {
              mod.GeolocationService.requestPermissions();
            }
          });
        }
      } catch (e) {
        console.error('Failed to request initial permissions:', e);
      }
    };

    // Request notification permission natively
    requestInitialPermissions();

    // Register Service Worker (only in production and if not already registered)
    if (import.meta.env.PROD && !navigator.serviceWorker.controller) {
      serviceWorkerManager.register().then(success => {
        if (success) {
          console.log('Service Worker registered successfully');
        }
      });
    }

    // Start widget auto-updates
    const savedLocation = localStorage.getItem('user-location');
    if (savedLocation) {
      try {
        const { latitude, longitude, locationName } = JSON.parse(savedLocation);
        import('@/lib/widget-service').then(({ WidgetService }) => {
          WidgetService.startAutoUpdate(latitude, longitude, locationName);
        });
      } catch (err) {
        console.warn('Failed to start widget auto-update', err);
      }
    }

    // Initialize global radio state
    const savedRadioState = localStorage.getItem('global-radio-state');
    if (savedRadioState) {
      try {
        JSON.parse(savedRadioState);
        // If there was a playing station when app closed, the GlobalRadioPlayer will handle auto-showing
      } catch (error) {
        console.error('Failed to restore radio state:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      notificationManager.stop();
    };
  }, []); // Remove dependencies to prevent re-runs

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="flex flex-col min-h-screen overflow-hidden">
          {/* Header/Top Elements */}
          <div className="flex-shrink-0">
            <Suspense fallback={null}>
              <GlobalPrayerAlarm />
              <SalamGreeting />
              <FestivePopup />
              <PWAInstallPrompt />
            </Suspense>
          </div>

          {/* Main Content - Takes available space */}
          <LayoutManager>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </LayoutManager>
        </div>

        {/* Bottom Navigation */}
        <BottomNav />

        {/* Global Players - Only render when needed */}
        <GlobalRadioPlayer />
        <GlobalQuranPlayer />
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;
