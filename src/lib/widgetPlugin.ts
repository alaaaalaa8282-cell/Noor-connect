import { Capacitor } from '@capacitor/core';
import { isNativePlatform, runIfNative } from './capacitor-utils';

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

  /** Sync new Kotlin widgets with raw JSON payload */
  notifyWidgetDataChanged(options: {
    prayerData: string;
    ayahData: string;
  }): Promise<{ status: string }>;
}

// Lazy initialization of WidgetPlugin to avoid top-level await
let widgetPluginInstance: WidgetPluginInterface | null = null;

const mockPlugin: WidgetPluginInterface = {
  updateWidget: () => Promise.resolve({ status: 'ok' }),
  updateWidgetFull: () => Promise.resolve({ status: 'ok' }),
  setWidgetStrings: () => Promise.resolve({ status: 'ok' }),
  notifyWidgetDataChanged: () => Promise.resolve({ status: 'ok' }),
};

async function getWidgetPlugin(): Promise<WidgetPluginInterface> {
  if (widgetPluginInstance) return widgetPluginInstance;
  
  const result = await runIfNative<WidgetPluginInterface>(() => 
    Promise.resolve(Capacitor.registerPlugin<WidgetPluginInterface>('WidgetPlugin'))
  );
  
  widgetPluginInstance = result || mockPlugin;
  return widgetPluginInstance;
}

// Export a proxy object that lazily initializes the plugin
export const WidgetPlugin: WidgetPluginInterface = {
  updateWidget: async (options) => {
    const plugin = await getWidgetPlugin();
    return plugin.updateWidget(options);
  },
  updateWidgetFull: async (options) => {
    const plugin = await getWidgetPlugin();
    return plugin.updateWidgetFull(options);
  },
  setWidgetStrings: async (options) => {
    const plugin = await getWidgetPlugin();
    return plugin.setWidgetStrings(options);
  },
  notifyWidgetDataChanged: async (options) => {
    const plugin = await getWidgetPlugin();
    return plugin.notifyWidgetDataChanged(options);
  },
};
