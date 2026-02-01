import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '@/lib/translations';

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
    dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

const STORAGE_KEY = 'app-language';

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Load saved language or detect
        const savedLang = localStorage.getItem(STORAGE_KEY) as Language;
        if (savedLang && ['en', 'ar', 'ur'].includes(savedLang)) {
            setLanguageState(savedLang);
        } else {
            // Basic detection
            // const browserLang = navigator.language.split('-')[0];
            // if (browserLang === 'ar' || browserLang === 'ur') {
            //   setLanguageState(browserLang as Language);
            // }
        }
    }, []);

    useEffect(() => {
        // Update document direction and lang attribute
        const dir = language === 'ar' || language === 'ur' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = language;
        localStorage.setItem(STORAGE_KEY, language);
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = (key: TranslationKey): string => {
        return translations[language][key] || translations['en'][key] || key;
    };

    const dir = language === 'ar' || language === 'ur' ? 'rtl' : 'ltr';

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
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
