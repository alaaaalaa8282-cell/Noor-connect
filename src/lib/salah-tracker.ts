/**
 * Salah (Prayer) Tracker with Streaks
 * All data stored locally
 */

const STORAGE_KEY = 'salah-tracker';
const STREAK_KEY = 'salah-streak';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface DailyPrayers {
  date: string; // YYYY-MM-DD
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export interface SalahStats {
  currentStreak: number;
  longestStreak: number;
  totalPrayers: number;
  todayCompleted: number;
}

const getTodayKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getYesterdayKey = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
};

// Get all tracked days
const getAllDays = (): Record<string, DailyPrayers> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

// Save all days
const saveAllDays = (days: Record<string, DailyPrayers>): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
};

// Get today's prayers
export const getTodayPrayers = (): DailyPrayers => {
  const days = getAllDays();
  const today = getTodayKey();
  
  if (!days[today]) {
    days[today] = {
      date: today,
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    };
    saveAllDays(days);
  }
  
  return days[today];
};

// Toggle prayer status (only if prayer time has arrived)
export const togglePrayer = (prayer: PrayerName, prayerTimes?: Record<string, { start: Date; end: Date }>): { success: boolean; message: string; completed: boolean } => {
  const days = getAllDays();
  const today = getTodayKey();
  
  if (!days[today]) {
    days[today] = {
      date: today,
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    };
  }

  // Check if prayer time has arrived
  if (prayerTimes && prayerTimes[prayer]) {
    const now = new Date();
    const prayerTime = prayerTimes[prayer];
    
    if (now < prayerTime.start) {
      return {
        success: false,
        message: `Cannot check in before ${prayer} time. Prayer starts at ${prayerTime.start.toLocaleTimeString()}`,
        completed: days[today][prayer]
      };
    }
  }

  days[today][prayer] = !days[today][prayer];
  saveAllDays(days);
  updateStreak();
  
  return {
    success: true,
    message: days[today][prayer] ? `${prayer} marked as completed!` : `${prayer} unchecked`,
    completed: days[today][prayer]
  };
};

// Legacy toggle function for backward compatibility
export const togglePrayerLegacy = (prayer: PrayerName): boolean => {
  const result = togglePrayer(prayer);
  return result.completed;
};

// Check if a day is complete (all 5 prayers)
const isDayComplete = (prayers: DailyPrayers): boolean => {
  return prayers.fajr && prayers.dhuhr && prayers.asr && prayers.maghrib && prayers.isha;
};

// Update streak
const updateStreak = (): void => {
  const days = getAllDays();
  const streakData = getStreakData();
  const today = getTodayKey();
  const yesterday = getYesterdayKey();
  
  const todayComplete = days[today] && isDayComplete(days[today]);
  const yesterdayComplete = days[yesterday] && isDayComplete(days[yesterday]);
  
  if (todayComplete) {
    if (yesterdayComplete || streakData.currentStreak === 0) {
      // Continue or start streak
      if (!streakData.lastCompleteDay || streakData.lastCompleteDay < today) {
        streakData.currentStreak += 1;
        streakData.lastCompleteDay = today;
      }
    }
    
    if (streakData.currentStreak > streakData.longestStreak) {
      streakData.longestStreak = streakData.currentStreak;
    }
  }
  
  saveStreakData(streakData);
};

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompleteDay: string | null;
}

const getStreakData = (): StreakData => {
  try {
    const data = localStorage.getItem(STREAK_KEY);
    return data ? JSON.parse(data) : { currentStreak: 0, longestStreak: 0, lastCompleteDay: null };
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastCompleteDay: null };
  }
};

const saveStreakData = (data: StreakData): void => {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
};

// Check and reset streak if day missed
export const checkStreakReset = (): void => {
  const streakData = getStreakData();
  const yesterday = getYesterdayKey();
  const days = getAllDays();
  
  if (streakData.lastCompleteDay && streakData.lastCompleteDay < yesterday) {
    const yesterdayComplete = days[yesterday] && isDayComplete(days[yesterday]);
    if (!yesterdayComplete) {
      streakData.currentStreak = 0;
      saveStreakData(streakData);
    }
  }
};

// Get statistics
export const getSalahStats = (): SalahStats => {
  checkStreakReset();
  
  const days = getAllDays();
  const streakData = getStreakData();
  const todayPrayers = getTodayPrayers();
  
  let totalPrayers = 0;
  Object.values(days).forEach(day => {
    if (day.fajr) totalPrayers++;
    if (day.dhuhr) totalPrayers++;
    if (day.asr) totalPrayers++;
    if (day.maghrib) totalPrayers++;
    if (day.isha) totalPrayers++;
  });
  
  const todayCompleted = [
    todayPrayers.fajr,
    todayPrayers.dhuhr,
    todayPrayers.asr,
    todayPrayers.maghrib,
    todayPrayers.isha,
  ].filter(Boolean).length;
  
  return {
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    totalPrayers,
    todayCompleted,
  };
};

// Get prayer history for last N days
export const getPrayerHistory = (days: number = 7): DailyPrayers[] => {
  const allDays = getAllDays();
  const result: DailyPrayers[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    result.push(allDays[key] || {
      date: key,
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    });
  }
  
  return result;
};
