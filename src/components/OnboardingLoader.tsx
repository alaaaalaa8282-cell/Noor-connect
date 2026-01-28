import { useState, useEffect, useCallback } from 'react';
import { Loader2, BookOpen, MapPin, Calendar, Settings, Moon, Wifi, Download } from 'lucide-react';

interface LoadingSection {
  name: string;
  icon: React.ReactNode;
  description: string;
  estimatedTime: number; // in seconds
  actualLoadFunction?: () => Promise<void>;
}

const LOADING_SECTIONS: LoadingSection[] = [
  {
    name: 'App Core',
    icon: <Settings className="w-5 h-5" />,
    description: 'Initializing application framework',
    estimatedTime: 1.5
  },
  {
    name: 'Location Services',
    icon: <MapPin className="w-5 h-5" />,
    description: 'Setting up prayer times for your location',
    estimatedTime: 2
  },
  {
    name: 'Prayer Schedule',
    icon: <Moon className="w-5 h-5" />,
    description: 'Loading prayer times and notifications',
    estimatedTime: 2.5
  },
  {
    name: 'Quran Library',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Preparing Quran and recitations',
    estimatedTime: 2
  },
  {
    name: 'Islamic Content',
    icon: <Calendar className="w-5 h-5" />,
    description: 'Loading calendar events and duas',
    estimatedTime: 1.5
  },
  {
    name: 'Final Setup',
    icon: <Download className="w-5 h-5" />,
    description: 'Completing initialization',
    estimatedTime: 1
  }
];

interface OnboardingLoaderProps {
  onComplete?: () => void;
}

export const OnboardingLoader = ({ onComplete }: OnboardingLoaderProps) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState<'initializing' | 'loading' | 'complete'>('initializing');

  // Check if it's first time opening
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('noor-connect-visited');
    const lastVersion = localStorage.getItem('noor-connect-version');
    const currentVersion = '1.0.3'; // Update this with each version
    
    // Check if first time or version updated
    if (!hasVisitedBefore || lastVersion !== currentVersion) {
      setIsFirstTime(true);
      localStorage.setItem('noor-connect-visited', 'true');
      localStorage.setItem('noor-connect-version', currentVersion);
    }
    
    setLoadingStage('loading');
  }, []);

  // Simulate loading progress for each section
  useEffect(() => {
    if (loadingStage !== 'loading') return;
    
    if (currentSection >= LOADING_SECTIONS.length) {
      // All sections loaded
      setLoadingStage('complete');
      setTimeout(() => {
        onComplete?.();
      }, 800);
      return;
    }

    const section = LOADING_SECTIONS[currentSection];
    const sectionDuration = section.estimatedTime * 1000; // Convert to ms
    const progressInterval = 50; // Update every 50ms
    const progressIncrement = 100 / (sectionDuration / progressInterval);

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + progressIncrement;
        if (newProgress >= 100) {
          clearInterval(timer);
          // Move to next section
          setTimeout(() => {
            setCurrentSection(prev => prev + 1);
            setProgress(0);
            // Update total progress
            setTotalProgress(prev => Math.min(prev + (100 / LOADING_SECTIONS.length), 95));
          }, 300);
          return 100;
        }
        return newProgress;
      });
    }, progressInterval);

    return () => clearInterval(timer);
  }, [currentSection, loadingStage, onComplete]);

  if (loadingStage === 'initializing') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  if (loadingStage === 'complete') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold animate-fade-in">Ready!</h2>
          <p className="text-muted-foreground">Noor Connect is prepared for you</p>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentSectionData = LOADING_SECTIONS[currentSection];

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          {isFirstTime ? (
            <>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Moon className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Welcome to Noor Connect</h1>
              </div>
              <p className="text-muted-foreground">
                Setting up your Islamic companion for the first time
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                <Wifi className="w-3 h-3 mr-1" />
                <span>This will only take a few moments</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Settings className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-foreground">Loading Noor Connect</h1>
              </div>
              <p className="text-muted-foreground">
                Updating your Islamic companion
              </p>
            </>
          )}
        </div>

        {/* Current Section */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-primary animate-pulse">
              {currentSectionData.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{currentSectionData.name}</h3>
              <p className="text-sm text-muted-foreground">{currentSectionData.description}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              ~{currentSectionData.estimatedTime}s
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Loading...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Overall Progress</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Section {currentSection + 1} of {LOADING_SECTIONS.length}</span>
            <span>{Math.round((currentSection + 1) / LOADING_SECTIONS.length * 100)}% Complete</span>
          </div>
        </div>

        {/* Section List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {LOADING_SECTIONS.map((section, index) => (
            <div 
              key={section.name}
              className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 ${
                index === currentSection 
                  ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                  : index < currentSection 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-muted/30 border border-transparent opacity-60'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                index < currentSection 
                  ? 'bg-green-500 text-white scale-110' 
                  : index === currentSection 
                    ? 'bg-primary text-primary-foreground animate-pulse' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {index < currentSection ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : index === currentSection ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium transition-colors ${
                  index <= currentSection ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {section.name}
                </p>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {index < currentSection && (
                  <span className="text-green-600 dark:text-green-400 text-xs font-medium">Done</span>
                )}
                {index === currentSection && (
                  <span className="text-primary text-xs font-medium animate-pulse">Loading...</span>
                )}
                {index > currentSection && (
                  <span className="text-muted-foreground text-xs">~{section.estimatedTime}s</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Message */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {isFirstTime 
              ? "Preparing your personalized Islamic experience"
              : "Updating your Islamic companion"
            }
          </p>
          {isFirstTime && (
            <p className="text-xs text-muted-foreground">
              ⚡ Optimized for performance • 📱 PWA Ready • 🌙 Dark Mode
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
