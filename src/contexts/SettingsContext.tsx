import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark';

interface SettingsContextProps {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  animationEnabled: boolean;
  setAnimationEnabled: (enabled: boolean) => void;
  toggleAnimation: () => void;
  greetingEnabled: boolean;
  setGreetingEnabled: (enabled: boolean) => void;
  toggleGreeting: () => void;
  splashGreetingEnabled: boolean;
  setSplashGreetingEnabled: (enabled: boolean) => void;
  toggleSplashGreeting: () => void;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

const THEME_KEY = 'theme';
const ANIMATION_KEY = 'animationEnabled';
const GREETING_KEY = 'greetingEnabled';
const LEGACY_GREETING_KEY = 'salam-greeting-enabled';
const SPLASH_GREETING_KEY = 'splashGreetingEnabled';

const getStoredTheme = (): ThemePreference => {
  const storedTheme = localStorage.getItem(THEME_KEY);
  return storedTheme === 'dark' ? 'dark' : 'light';
};

const getStoredBoolean = (key: string, fallback = true): boolean => {
  const storedValue = localStorage.getItem(key);
  return storedValue === null ? fallback : storedValue === 'true';
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredTheme());
  const [animationEnabled, setAnimationEnabledState] = useState<boolean>(() => getStoredBoolean(ANIMATION_KEY, true));
  const [greetingEnabled, setGreetingEnabledState] = useState<boolean>(() => {
    const currentValue = localStorage.getItem(GREETING_KEY);
    if (currentValue !== null) return currentValue === 'true';
    return getStoredBoolean(LEGACY_GREETING_KEY, true);
  });
  const [splashGreetingEnabled, setSplashGreetingEnabledState] = useState<boolean>(() =>
    getStoredBoolean(SPLASH_GREETING_KEY, true)
  );

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Persist changes
  useEffect(() => {
    localStorage.setItem(ANIMATION_KEY, animationEnabled.toString());
    document.documentElement.dataset.animations = animationEnabled ? 'on' : 'off';
  }, [animationEnabled]);

  useEffect(() => {
    localStorage.setItem(GREETING_KEY, greetingEnabled.toString());
    localStorage.removeItem(LEGACY_GREETING_KEY);
  }, [greetingEnabled]);

  useEffect(() => {
    localStorage.setItem(SPLASH_GREETING_KEY, splashGreetingEnabled.toString());
  }, [splashGreetingEnabled]);

  const setTheme = (nextTheme: ThemePreference) => setThemeState(nextTheme);
  const toggleTheme = () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const setAnimationEnabled = (enabled: boolean) => setAnimationEnabledState(enabled);
  const toggleAnimation = () => setAnimationEnabledState((prev) => !prev);
  const setGreetingEnabled = (enabled: boolean) => setGreetingEnabledState(enabled);
  const toggleGreeting = () => setGreetingEnabledState((prev) => !prev);
  const setSplashGreetingEnabled = (enabled: boolean) => setSplashGreetingEnabledState(enabled);
  const toggleSplashGreeting = () => setSplashGreetingEnabledState((prev) => !prev);

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        animationEnabled,
        setAnimationEnabled,
        toggleAnimation,
        greetingEnabled,
        setGreetingEnabled,
        toggleGreeting,
        splashGreetingEnabled,
        setSplashGreetingEnabled,
        toggleSplashGreeting,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
