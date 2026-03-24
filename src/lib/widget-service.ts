/**
 * widget-service.ts
 * Sends enriched prayer + Quran data to the Android home-screen widgets.
 */
import { registerPlugin } from '@capacitor/core';
import { calculatePrayerTimes, formatPrayerTime, getNextPrayer } from './prayer-calculator';
import type { WidgetPluginInterface, PrayerEntry, WidgetStrings } from './widgetPlugin';
import { runIfNative } from './capacitor-utils'; // Added user's utility

/* Re-export the plugin type for convenience */
export type { WidgetPluginInterface, PrayerEntry, WidgetStrings };

const WidgetPlugin = registerPlugin<WidgetPluginInterface>('WidgetPlugin');

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/**
 * Convert a Gregorian Date to a human-readable Hijri string.
 * Uses the `Intl` API — no external library required.
 */
function getHijriDateString(): string {
    try {
        const islamicFormatter = new Intl.DateTimeFormat('en-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        return islamicFormatter.format(new Date());
    } catch {
        return '';
    }
}

/**
 * Get a formatted clock string for the widget header (e.g. "14:35").
 */
function getCurrentTimeString(): string {
    return new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

/**
 * Build the all-5-prayers array with pass/active/upcoming status.
 */
function buildAllPrayers(lat: number, lon: number): PrayerEntry[] {
    const now = new Date();
    const times = calculatePrayerTimes(lat, lon, now);
    const names = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
    const dates = [times.fajr, times.dhuhr, times.asr, times.maghrib, times.isha];

    let activeAssigned = false;
    const result: PrayerEntry[] = [];

    for (let i = dates.length - 1; i >= 0; i--) {
        if (!activeAssigned && now >= dates[i]) {
            result[i] = {
                name: names[i],
                time: formatPrayerTime(dates[i]),
                status: 'active',
            };
            activeAssigned = true;
        }
    }

    for (let i = 0; i < dates.length; i++) {
        if (!result[i]) {
            result[i] = {
                name: names[i],
                time: formatPrayerTime(dates[i]),
                status: now > dates[i] ? 'passed' : 'upcoming',
            };
        }
    }

    return result;
}

/**
 * Read today's Quran verse from localStorage (set by the DailyAyah component).
 */
function getStoredQuranVerse(): { arabic: string; translit: string; ref: string } | null {
    try {
        const raw = localStorage.getItem('daily-ayah-cache');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Support both camelCase and snake_case keys from different sources
        return {
            arabic: parsed.arabic || parsed.text_arabic || parsed.textArabic || '',
            translit: parsed.transliteration || parsed.translit || '',
            ref: parsed.reference || parsed.ref || '',
        };
    } catch {
        return null;
    }
}

// ─────────────────────────────────────────────────────────
// Public service class
// ─────────────────────────────────────────────────────────

export class WidgetService {
    /**
     * Full widget update: sends prayer schedule, Hijri date, current time,
     * and today's Quran verse to ALL Noor Connect home-screen widgets.
     */
    static async updateWidget(
        latitude: number,
        longitude: number,
        locationName?: string,
    ) {
        try {
            const next = getNextPrayer(latitude, longitude);
            if (!next) return;

            const isRamadan = localStorage.getItem('ramadan-mode') === 'true';
            let prayerName = next.name;
            if (isRamadan) {
                if (next.name === 'Maghrib') prayerName += ' (Iftar)';
                if (next.name === 'Fajr') prayerName += ' (Suhoor)';
            }

            const nextTimeStr = next.time.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });

            const allPrayers = buildAllPrayers(latitude, longitude);
            const quran = getStoredQuranVerse();

            // Using the user's runIfNative utility!
            await runIfNative(() => 
                WidgetPlugin.updateWidgetFull({
                    name: prayerName,
                    time: nextTimeStr,
                    remaining: next.timeUntil,
                    location: locationName ?? '',
                    hijriDate: getHijriDateString(),
                    currentTime: getCurrentTimeString(),
                    allPrayers,
                    quranArabic: quran?.arabic ?? '',
                    quranTranslit: quran?.translit ?? '',
                    quranRef: quran?.ref ?? '',
                })
            );

        } catch (error) {
            console.error('[WidgetService] updateWidget failed:', error);
        }
    }

    /**
     * Start auto-update timer (every 30 minutes).
     * Returns the interval ID for cleanup.
     */
    static startAutoUpdate(
        latitude: number,
        longitude: number,
        locationName?: string,
    ): ReturnType<typeof setInterval> {
        WidgetService.updateWidget(latitude, longitude, locationName).catch(console.error);
        return setInterval(
            () => WidgetService.updateWidget(latitude, longitude, locationName).catch(console.error),
            30 * 60 * 1000,
        );
    }
}
