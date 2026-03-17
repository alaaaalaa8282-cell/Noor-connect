import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type LanguageCode,
  LANGUAGES,
  SUPPORTED_CODES,
  DEFAULT_LANGUAGE,
  WIDGET_STRING_KEYS,
  isRTL as checkRTL,
  toLanguageCode,
} from '@/lib/language-config';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const PREF_KEY = 'app-language';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// ─── Side-effects applied whenever the language changes ───

function applyLanguageSideEffects(lang: LanguageCode) {
  const config = LANGUAGES[lang];
  const rtl = config.dir === 'rtl';
  const dir = rtl ? 'rtl' : 'ltr';

  // 1. Force HTML dir + lang attributes (critical for RTL layouts)
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;

  // 2. Toggle body class for global CSS hooks
  document.body.classList.toggle('rtl', rtl);
  document.body.classList.toggle('ltr', !rtl);

  // 3. Typographic leading — set CSS variables at the root so buttons/headers
  //    don't clip tall glyphs (Nastaliq Urdu, Arabic)
  const root = document.documentElement.style;
  root.setProperty('--lang-line-height', String(config.typography.lineHeight));
  root.setProperty('--lang-font-size-adjust', config.typography.fontSizeAdjust);

  // 4. Apply Noto Nastaliq Urdu font for Urdu
  if (lang === 'ur') {
    root.fontFamily = "'Noto Nastaliq Urdu', 'Noto Sans', sans-serif";
  } else {
    root.fontFamily = ''; // Reset to default
  }
}

// ─── Persistence: Capacitor Preferences is the ONLY source of truth ───

async function persistLanguage(lang: LanguageCode) {
  try {
    await Preferences.set({ key: PREF_KEY, value: lang });
  } catch (e) {
    console.warn('Failed to save language to Preferences:', e);
  }
}

async function loadSavedLanguageCode(): Promise<LanguageCode | null> {
  try {
    const { value } = await Preferences.get({ key: PREF_KEY });
    if (value && SUPPORTED_CODES.includes(value as LanguageCode)) {
      return value as LanguageCode;
    }
  } catch {
    // Preferences unavailable — first boot or web browser
  }
  return null;
}

// ─── System-first detection via @capacitor/device ───

async function detectSystemLanguage(): Promise<LanguageCode> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Device } = await import('@capacitor/device');
      const info = await Device.getLanguageCode();
      // info.value is e.g. "en-US" or "ar" — take the first 2 chars
      const twoLetter = (info.value || '').slice(0, 2).toLowerCase();
      if (SUPPORTED_CODES.includes(twoLetter as LanguageCode)) {
        return twoLetter as LanguageCode;
      }
    } catch (e) {
      console.warn('Device.getLanguageCode failed:', e);
    }
  } else {
    // Web fallback: navigator.language
    const twoLetter = (navigator.language || '').slice(0, 2).toLowerCase();
    if (SUPPORTED_CODES.includes(twoLetter as LanguageCode)) {
      return twoLetter as LanguageCode;
    }
  }
  return DEFAULT_LANGUAGE;
}

// ─── "Dumb Widget" bridge: send only the strings the widget needs ───

async function sendWidgetStrings(tFn: (key: string) => string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    // Build a tiny JSON payload of only the widget-relevant strings
    const payload: Record<string, string> = {};
    for (const key of WIDGET_STRING_KEYS) {
      payload[key] = tFn(key);
    }

    const { registerPlugin } = await import('@capacitor/core');
    const WidgetPlugin = registerPlugin<{
      setWidgetStrings: (opts: { strings: string }) => Promise<{ status: string }>;
    }>('WidgetPlugin');
    await WidgetPlugin.setWidgetStrings({ strings: JSON.stringify(payload) });
  } catch (e) {
    // Widget plugin might not be available — that's OK
    console.warn('Failed to send widget strings:', e);
  }
}

// ─── Provider ────────────────────────────────────────────

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n, t } = useTranslation();
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  const isLanguageRTL = checkRTL(language);

  // ── Load saved language on mount ──
  useEffect(() => {
    const bootstrap = async () => {
      // 1. Check Capacitor Preferences (sole source of truth)
      let lang = await loadSavedLanguageCode();

      // 2. First boot — no preference saved yet → detect from system
      if (!lang) {
        lang = await detectSystemLanguage();
        // Persist so we don't re-detect every launch
        await persistLanguage(lang);
      }

      setLanguageState(lang);
      i18n.changeLanguage(lang);
      applyLanguageSideEffects(lang);

      // Also push strings to the widget on boot
      sendWidgetStrings(i18n.t.bind(i18n));
    };

    bootstrap();
  }, []);

  // ── Apply side effects whenever language changes ──
  useEffect(() => {
    applyLanguageSideEffects(language);
  }, [language]);

  // ── Public setter ──
  const setLanguage = useCallback(
    (lang: LanguageCode) => {
      setLanguageState(lang);
      i18n.changeLanguage(lang);
      applyLanguageSideEffects(lang);
      persistLanguage(lang);

      // After i18next switches, send updated strings to native widget
      // Use a microtask so i18n.t() returns the new language's values
      queueMicrotask(() => {
        sendWidgetStrings(i18n.t.bind(i18n));
      });
    },
    [i18n]
  );

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL: isLanguageRTL,
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

// Re-export for convenience
export type { LanguageCode };
export { LANGUAGES, SUPPORTED_CODES };
