import { useEffect, useRef } from 'react';

const GREETING_ENABLED_KEY = 'greetingEnabled';
const LEGACY_GREETING_ENABLED_KEY = 'salam-greeting-enabled';
const GREETING_PLAYED_KEY = 'salam-greeting-played-session';

export const isSalamGreetingEnabled = (): boolean => {
  const currentValue = localStorage.getItem(GREETING_ENABLED_KEY);
  if (currentValue !== null) return currentValue !== 'false';
  return localStorage.getItem(LEGACY_GREETING_ENABLED_KEY) !== 'false';
};

export const setSalamGreetingEnabled = (enabled: boolean): void => {
  localStorage.setItem(GREETING_ENABLED_KEY, enabled ? 'true' : 'false');
  localStorage.removeItem(LEGACY_GREETING_ENABLED_KEY);
};

export const SalamGreeting = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    // Check if enabled and not already played this session
    const isEnabled = isSalamGreetingEnabled();
    const sessionKey = sessionStorage.getItem(GREETING_PLAYED_KEY);
    
    if (!isEnabled || sessionKey || hasPlayedRef.current) {
      return;
    }

    // Create audio element with optimized loading
    audioRef.current = new Audio('/audio/salam-greeting.mp3');
    audioRef.current.volume = 0.7;
    audioRef.current.preload = 'none'; // Only load when needed

    // Play greeting after a short delay
    const playGreeting = () => {
      if (audioRef.current && !hasPlayedRef.current) {
        hasPlayedRef.current = true;
        sessionStorage.setItem(GREETING_PLAYED_KEY, 'true');
        
        audioRef.current.play().catch((error) => {
          // Autoplay may be blocked - that's okay
          console.log('Greeting autoplay blocked:', error);
        });
      }
    };

    // Wait for user interaction if autoplay is blocked
    const handleInteraction = () => {
      playGreeting();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    // Try to play immediately, fallback to user interaction
    const timer = setTimeout(() => {
      audioRef.current?.play()
        .then(() => {
          hasPlayedRef.current = true;
          sessionStorage.setItem(GREETING_PLAYED_KEY, 'true');
        })
        .catch(() => {
          // Add listeners for user interaction
          document.addEventListener('click', handleInteraction, { once: true });
          document.addEventListener('touchstart', handleInteraction, { once: true });
        });
    }, 500);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return null; // This is a background component
};
