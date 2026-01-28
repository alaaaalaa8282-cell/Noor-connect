import { useState, useEffect } from 'react';
import { Loader2, Moon, Settings } from 'lucide-react';

interface OnboardingLoaderProps {
  onComplete?: () => void;
}

export const OnboardingLoader = ({ onComplete }: OnboardingLoaderProps) => {
  const [progress, setProgress] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Check if it's first time opening
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('noor-connect-visited');
    const lastVersion = localStorage.getItem('noor-connect-version');
    const currentVersion = '1.0.3';
    
    // Check if first time or version updated
    if (!hasVisitedBefore || lastVersion !== currentVersion) {
      setIsFirstTime(true);
    }
  }, []);

  // Simple progress animation
  useEffect(() => {
    const duration = isFirstTime ? 8000 : 2000; // 8s for first time, 2s for returning
    const interval = 50; // Update every 50ms
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete?.();
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isFirstTime, onComplete]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Moon className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isFirstTime ? 'Welcome to Noor Connect' : 'Loading Noor Connect'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {isFirstTime 
              ? 'Setting up your Islamic companion for the first time'
              : 'Updating your Islamic companion'
            }
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-primary animate-pulse">
              <Settings className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {isFirstTime ? 'Initializing' : 'Loading'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isFirstTime 
                  ? 'Setting up your personalized Islamic experience'
                  : 'Preparing your Islamic companion'
                }
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{isFirstTime ? 'Setting up...' : 'Loading...'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {isFirstTime 
              ? "This will only take a few moments"
              : "Almost ready..."
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
