/**
 * Aladhan API Integration for Dynamic Prayer Times
 * Fetches monthly calendar data with localStorage persistence
 */

export interface AladhanPrayerTime {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak: string; // For Ramadan Suhoor
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
}

export interface AladhanDayData {
  date: {
    readable: string;
    timestamp: string;
    gregorian: {
      date: string;
      format: string;
      day: string;
      weekday: {
        en: string;
      };
      month: {
        number: number;
        en: string;
      };
      year: string;
      designation: {
        abbreviated: string;
        expanded: string;
      };
    };
    hijri: {
      date: string;
      format: string;
      day: string;
      weekday: {
        en: string;
        ar: string;
      };
      month: {
        number: number;
        en: string;
        ar: string;
      };
      year: string;
      designation: {
        abbreviated: string;
        expanded: string;
      };
      holidays: string[];
    };
  };
  timings: AladhanPrayerTime;
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: {
      id: number;
      name: string;
      params: {
        Fajr: number;
        Isha: number;
      };
    };
    latitudeAdjustmentMethod: string;
    midnightMode: string;
    school: string;
  };
}

export interface AladhanMonthlyData {
  month: number;
  year: number;
  latitude: number;
  longitude: number;
  method: number;
  data: AladhanDayData[];
  lastUpdated: string;
}

const STORAGE_KEY = 'aladhan-monthly-data';
const API_BASE = 'https://api.aladhan.com/v1';

export class AladhanAPI {
  /**
   * Fetch monthly prayer calendar from Aladhan API
   */
  static async fetchMonthlyCalendar(
    latitude: number,
    longitude: number,
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth() + 1,
    method: number = 1 // Pakistan/Karachi (1), ISNA (2)
  ): Promise<AladhanMonthlyData> {
    const url = `${API_BASE}/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=${method}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.code !== 200) {
        throw new Error(`API Error: ${result.status}`);
      }

      const monthlyData: AladhanMonthlyData = {
        month,
        year,
        latitude,
        longitude,
        method,
        data: result.data,
        lastUpdated: new Date().toISOString()
      };

      // Save to localStorage
      this.saveMonthlyData(monthlyData);

      return monthlyData;
    } catch (error) {
      console.error('Failed to fetch monthly calendar:', error);
      throw error;
    }
  }

  /**
   * Get prayer times for a specific date from cached data
   */
  static getPrayerTimesForDate(date: Date): AladhanPrayerTime | null {
    const monthlyData = this.getStoredMonthlyData();
    if (!monthlyData) return null;

    const targetDate = new Date(date);
    const isSameMonth = targetDate.getFullYear() === monthlyData.year &&
      targetDate.getMonth() + 1 === monthlyData.month;

    if (!isSameMonth) return null;

    const dayData = monthlyData.data.find(day => {
      const apiDate = new Date(day.date.gregorian.date);
      return apiDate.toDateString() === targetDate.toDateString();
    });

    return dayData?.timings || null;
  }

  /**
   * Get today's prayer times by city
   */
  static async getTodaysPrayerTimesByCity(
    city: string,
    country: string,
    method: number = 1
  ): Promise<AladhanPrayerTime> {
    const url = `${API_BASE}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.code !== 200) {
        throw new Error(`API Error: ${result.status}`);
      }

      return result.data.timings;
    } catch (error) {
      console.error('Failed to fetch prayer times by city:', error);
      throw error;
    }
  }

  /**
   * Get today's prayer times with fallback to offline calculation
   */
  static async getTodaysPrayerTimes(
    latitude: number,
    longitude: number,
    method: number = 1
  ): Promise<AladhanPrayerTime> {
    // Try to get from cached data first
    const cached = this.getPrayerTimesForDate(new Date());
    if (cached) return cached;

    // If no cached data, try to fetch current month
    try {
      const monthlyData = await this.fetchMonthlyCalendar(latitude, longitude, undefined, undefined, method);
      const today = monthlyData.data.find(day => {
        const apiDate = new Date(day.date.gregorian.date);
        return apiDate.toDateString() === new Date().toDateString();
      });

      if (today?.timings) {
        return today.timings;
      }
    } catch (error) {
      console.warn('Failed to fetch API data, will use offline calculation');
    }

    // Fallback to offline calculation (convert to Aladhan format)
    const { calculatePrayerTimes } = await import('./prayer-calculator');
    const times = calculatePrayerTimes(latitude, longitude, new Date());

    return {
      Fajr: times.fajr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      Sunrise: times.sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      Dhuhr: times.dhuhr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      Asr: times.asr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      Maghrib: times.maghrib.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      Isha: times.isha.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      Imsak: times.fajr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), // Approximate
      Midnight: '00:00',
      Firstthird: '00:00',
      Lastthird: '00:00'
    };
  }

  /**
   * Check if cached data is still valid (same month and year)
   */
  static isCachedDataValid(): boolean {
    const monthlyData = this.getStoredMonthlyData();
    if (!monthlyData) return false;

    const now = new Date();
    return monthlyData.year === now.getFullYear() &&
      monthlyData.month === now.getMonth() + 1;
  }

  /**
   * Get stored monthly data from localStorage
   */
  static getStoredMonthlyData(): AladhanMonthlyData | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save monthly data to localStorage
   */
  static saveMonthlyData(data: AladhanMonthlyData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save monthly data:', error);
    }
  }

  /**
   * Clear cached data
   */
  static clearCachedData(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Get Ramadan-specific times (Suhoor/Iftar) for today
   */
  static async getRamadanTimes(
    latitude: number,
    longitude: number,
    method: number = 1
  ): Promise<{ suhoor: string; iftar: string } | null> {
    try {
      const timings = await this.getTodaysPrayerTimes(latitude, longitude, method);

      return {
        suhoor: timings.Imsak || timings.Fajr,
        iftar: timings.Maghrib
      };
    } catch {
      return null;
    }
  }

  /**
   * Get countdown to next prayer or Ramadan time
   */
  static async getNextEventCountdown(
    latitude: number,
    longitude: number,
    method: number = 1,
    isRamadan: boolean = false
  ): Promise<{ name: string; time: string; countdown: string } | null> {
    try {
      const timings = await this.getTodaysPrayerTimes(latitude, longitude, method);
      const now = new Date();

      // Convert prayer times to Date objects
      const prayerTimes = [
        { name: 'Fajr', time: this.parseTime(timings.Fajr) },
        { name: 'Sunrise', time: this.parseTime(timings.Sunrise) },
        { name: 'Dhuhr', time: this.parseTime(timings.Dhuhr) },
        { name: 'Asr', time: this.parseTime(timings.Asr) },
        { name: 'Maghrib', time: this.parseTime(timings.Maghrib) },
        { name: 'Isha', time: this.parseTime(timings.Isha) }
      ];

      // Add Ramadan times if applicable
      if (isRamadan) {
        prayerTimes.unshift(
          { name: 'Suhoor Ends', time: this.parseTime(timings.Imsak || timings.Fajr) },
          { name: 'Iftar', time: this.parseTime(timings.Maghrib) }
        );
      }

      // Find next event
      for (const prayer of prayerTimes) {
        if (prayer.time > now) {
          const diff = prayer.time.getTime() - now.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          return {
            name: prayer.name,
            time: prayer.time.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            countdown: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
          };
        }
      }

      // If all events passed, get tomorrow's first prayer
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowTimings = await this.getTodaysPrayerTimes(latitude, longitude, method);
      const firstPrayerTime = this.parseTime(tomorrowTimings.Fajr);

      const diff = firstPrayerTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return {
        name: 'Fajr (Tomorrow)',
        time: firstPrayerTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        countdown: `${hours}h ${minutes}m`
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse time string (HH:MM) to Date object for today
   */
  private static parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}
