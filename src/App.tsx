import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { LoadingSpinner } from "@/components/LoadingSkeleton";
import { OnboardingLoader } from "@/components/OnboardingLoader";
import { performanceMonitor } from "@/lib/performance-monitor";

// Set default theme to dark if no preference saved
if (!localStorage.getItem("theme")) {
  localStorage.setItem("theme", "dark");
  document.documentElement.classList.add("dark");
} else if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

// Optimized: Lazy load route components with prefetch hints
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PrayerTimes = lazy(() => import("./pages/PrayerTimes"));
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
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load heavy global components
const GlobalPrayerAlarm = lazy(() => import("@/components/GlobalPrayerAlarm"));
const SalamGreeting = lazy(() => import("@/components/SalamGreeting"));
const FestivePopup = lazy(() => import("@/components/FestivePopup"));

// Optimized: Memoized route component to prevent unnecessary re-renders
function AppRoutes() {
  const location = useLocation();

  // Optimized: Memoize the routes to prevent recreation on every render
  const routes = useMemo(() => (
    <>
      {/* Home/Dashboard */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/prayer-times" element={<PrayerTimes />} />
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
      <Route path="*" element={<NotFound />} />
    </>
  ), []);

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <Routes location={location}>
        {routes}
      </Routes>
    </Suspense>
  );
}

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Check if it's first time and handle onboarding
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('noor-connect-visited');
    const lastVersion = localStorage.getItem('noor-connect-version');
    const currentVersion = '1.0.3';
    
    // Check if first time or version updated
    const isFirstTime = !hasVisitedBefore || lastVersion !== currentVersion;
    
    if (isFirstTime) {
      localStorage.setItem('noor-connect-visited', 'true');
      localStorage.setItem('noor-connect-version', currentVersion);
      // For first time users, show onboarding for 8 seconds max
      const timer = setTimeout(() => {
        setShowOnboarding(false);
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      // If not first time, show onboarding for shorter duration
      const timer = setTimeout(() => {
        setShowOnboarding(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show onboarding loader for first-time users or updates
  if (showOnboarding) {
    return <OnboardingLoader onComplete={handleOnboardingComplete} />;
  }
  // Optimized: Initialize services only when needed
  useEffect(() => {
    // Defer heavy initialization to not block initial render
    const timer = setTimeout(async () => {
      try {
        // Dynamic import to avoid blocking initial load
        const { notificationManager } = await import("@/lib/notification-manager");
        const { serviceWorkerManager } = await import("@/lib/service-worker-registration");
        
        // Start the notification manager
        notificationManager.start();
        
        // Register Service Worker
        serviceWorkerManager.register().then(success => {
          if (success) {
            console.log('Service Worker registered successfully');
          }
        });
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    }, 1000); // 1 second delay
    
    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      // Only cleanup if services were loaded
      import("@/lib/notification-manager").then(({ notificationManager }) => {
        notificationManager.stop();
      }).catch(() => {});
    };
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <GlobalPrayerAlarm />
          <SalamGreeting />
          <FestivePopup />
        </Suspense>
        <div className="min-h-screen w-full pb-28">
          <main className="flex-1">
            <AppRoutes />
          </main>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;
