import { Capacitor } from '@capacitor/core';

/** One prayer entry passed to updateWidgetFull */
export interface PrayerEntry {
  name: string;   // e.g. "Fajr"
  time: string;   // formatted time string e.g. "05:15"
  status: 'passed' | 'active' | 'upcoming';
}

/** Widget strings for localization */
export interface WidgetStrings {
  fajr?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
  sunrise?: string;
  nextPrayer?: string;
  inMin?: string;
}

/** Full widget data interface */
export interface WidgetPluginInterface {
  /** Legacy fast-path — basic next-prayer only */
  updateWidget(options: {
    name: string;
    time: string;
    remaining?: string;
    location?: string;
  }): Promise<{ status: string }>;

  /** Enriched update — all widget types refreshed */
  updateWidgetFull(options: {
    name: string;
    time: string;
    remaining?: string;
    location?: string;
    /** Hijri date string e.g. "5 Rajab 1446" */
    hijriDate?: string;
    /** Current 12/24h clock string for the clock display in the large widget */
    currentTime?: string;
    /** Array of all 5 prayers with status */
    allPrayers?: PrayerEntry[];
    /** Arabic Quran verse text */
    quranArabic?: string;
    /** Transliteration */
    quranTranslit?: string;
    /** Reference e.g. "Al-Baqarah 2:255" */
    quranRef?: string;
  }): Promise<{ status: string }>;

  /** Set localized widget strings (prayer labels, UI text) */
  setWidgetStrings(options: {
    strings: string; // JSON string of WidgetStrings
  }): Promise<{ status: string }>;
}

const WidgetPlugin = Capacitor.registerPlugin<WidgetPluginInterface>('WidgetPlugin');

export { WidgetPlugin };
