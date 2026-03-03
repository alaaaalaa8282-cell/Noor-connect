import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'en' | 'ar' | 'ur' | 'id' | 'tr';

const STORAGE_KEY = 'app-language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n, t } = useTranslation();
  const [language, setLanguageState] = useState<Language>('en');

  // Detect if language is RTL
  const isRTL = language === 'ar' || language === 'ur';

  // Apply RTL direction and font changes
  useEffect(() => {
    const dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    
    // Apply Noto Nastaliq Urdu font for Urdu
    if (language === 'ur') {
      document.documentElement.style.fontFamily = "'Noto Nastaliq Urdu', 'Noto Sans', sans-serif";
    } else {
      document.documentElement.style.fontFamily = ''; // Reset to default
    }
    
    localStorage.setItem(STORAGE_KEY, language);
  }, [language, isRTL]);

  // Load saved language on mount
  useEffect(() => {
    const savedLang = localStorage.getItem(STORAGE_KEY) as Language;
    if (savedLang && ['en', 'ar', 'ur', 'id', 'tr'].includes(savedLang)) {
      setLanguageState(savedLang);
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
