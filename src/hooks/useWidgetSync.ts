import { useEffect } from 'react';
import { WidgetPlugin } from '@/lib/widgetPlugin';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';

/**
 * Custom hook to synchronize prayer and ayah data with the new
 * Kotlin-based native Android widget suite. Runs whenever prayerTimes updates.
 */
export function useWidgetSync() {
  const { prayerTimes } = usePrayerTimes();

  useEffect(() => {
    if (!prayerTimes) return;

    try {
      // 1. Serialize Prayer Data (using epoch timestamps as requested)
      const now = Date.now();
      const prayersArray = [
        { name: 'Fajr', time: prayerTimes.fajr.getTime() },
        { name: 'Sunrise', time: prayerTimes.sunrise.getTime() },
        { name: 'Dhuhr', time: prayerTimes.dhuhr.getTime() },
        { name: 'Asr', time: prayerTimes.asr.getTime() },
        { name: 'Maghrib', time: prayerTimes.maghrib.getTime() },
        { name: 'Isha', time: prayerTimes.isha.getTime() },
      ];

      // Find next prayer index (the first prayer with a time strictly greater than now)
      let nextIndex = prayersArray.findIndex(p => p.time > now);
      if (nextIndex === -1) nextIndex = 0; // Fallback to Fajr (for tomorrow)

      const prayerData = JSON.stringify({
        prayers: prayersArray,
        nextPrayerIndex: nextIndex,
        lastUpdated: now
      });

      // 2. Serialize Ayah Data
      const ayahDataObj = { ayahs: [] as any[] };
      try {
        const raw = localStorage.getItem('daily-ayah-cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          ayahDataObj.ayahs.push({
            arabic: parsed.text_arabic || parsed.textArabic || parsed.arabic || '',
            translation: parsed.translation || parsed.translit || '',
            reference: parsed.reference || parsed.ref || '',
          });
        }
      } catch (e) {
        console.error('[useWidgetSync] Failed to parse Ayah cache', e);
      }

      const ayahData = JSON.stringify(ayahDataObj);

      // 3. Sync with Native Plugin
      WidgetPlugin.notifyWidgetDataChanged({
        prayerData,
        ayahData
      }).catch(err => {
        console.error('[useWidgetSync] failed to sync to native widgets:', err);
      });

    } catch (err) {
      console.error('[useWidgetSync] error serializing data:', err);
    }
  }, [prayerTimes]);
}
