/**
 * Qaza (Missed Prayer) Tracker
 * Track prayers that need to be made up
 * All data stored locally
 */

const QAZA_STORAGE_KEY = 'qaza-prayers';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface QazaPrayer {
  id: string;
  prayer: PrayerName;
  count: number;
  dateAdded: string;
  dateUpdated: string;
}

export interface QazaStats {
  total: number;
  byPrayer: Record<PrayerName, number>;
}

// Get all Qaza prayers
export const getQazaPrayers = (): Record<PrayerName, number> => {
  try {
    const data = localStorage.getItem(QAZA_STORAGE_KEY);
    return data ? JSON.parse(data) : {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0
    };
  } catch {
    return {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0
    };
  }
};

// Save Qaza prayers
const saveQazaPrayers = (prayers: Record<PrayerName, number>): void => {
  localStorage.setItem(QAZA_STORAGE_KEY, JSON.stringify(prayers));
};

// Add Qaza prayer
export const addQazaPrayer = (prayer: PrayerName, count: number = 1): void => {
  const prayers = getQazaPrayers();
  prayers[prayer] = Math.max(0, (prayers[prayer] || 0) + count);
  saveQazaPrayers(prayers);
};

// Remove/complete Qaza prayer
export const completeQazaPrayer = (prayer: PrayerName, count: number = 1): void => {
  const prayers = getQazaPrayers();
  prayers[prayer] = Math.max(0, (prayers[prayer] || 0) - count);
  saveQazaPrayers(prayers);
};

// Set specific Qaza count
export const setQazaCount = (prayer: PrayerName, count: number): void => {
  const prayers = getQazaPrayers();
  prayers[prayer] = Math.max(0, count);
  saveQazaPrayers(prayers);
};

// Get Qaza stats
export const getQazaStats = (): QazaStats => {
  const prayers = getQazaPrayers();
  const total = Object.values(prayers).reduce((sum, count) => sum + count, 0);
  return {
    total,
    byPrayer: prayers
  };
};

// Clear all Qaza
export const clearAllQaza = (): void => {
  saveQazaPrayers({
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0
  });
};
