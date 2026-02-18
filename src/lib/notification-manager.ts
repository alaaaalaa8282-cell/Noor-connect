/**
 * Intelligent Notification System
 * Handles Islamic event notifications, Ramadan countdown, and daily reminders
 */

import { importantIslamicDates, IslamicDate, isRamadanCountdownPeriod, getDaysUntilRamadan } from '@/data/islamic-dates';

export interface NotificationPreferences {
  ramadanCountdowns: boolean;
  eidGreetings: boolean;
  fridayKahfReminders: boolean;
  dailyHadithNotifications: boolean;
  morningReminders: boolean;
  eveningReminders: boolean;
}

export interface NotificationEvent {
  id: string;
  title: string;
  body: string;
  icon?: string;
  timestamp: number;
  type: 'ramadan-countdown' | 'eid-greeting' | 'islamic-date' | 'friday-kahf' | 'daily-hadith';
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  ramadanCountdowns: true,
  eidGreetings: true,
  fridayKahfReminders: true,
  dailyHadithNotifications: false,
  morningReminders: false,
  eveningReminders: false,
};

const STORAGE_KEY = 'notification-preferences';
const SENT_NOTIFICATIONS_KEY = 'sent-notifications-today';
const LAST_NOTIFICATION_DATE_KEY = 'last-notification-date';

export class NotificationManager {
  private preferences: NotificationPreferences;
  private lastNotificationDate: string | null = null;
  private sentNotificationIds: Set<string> = new Set();
  private isSupported: boolean;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private static instance: NotificationManager | null = null;
  private permissionCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.isSupported = 'Notification' in window;
    this.preferences = this.loadPreferences();
    this.lastNotificationDate = this.getLastNotificationDate();
    this.sentNotificationIds = this.loadSentNotifications();
  }

  // Load preferences from localStorage
  private loadPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  }

  // Save preferences to localStorage
  private savePreferences(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  // Load last notification date
  private getLastNotificationDate(): string | null {
    try {
      return localStorage.getItem(LAST_NOTIFICATION_DATE_KEY);
    } catch {
      return null;
    }
  }

  // Save last notification date
  private saveLastNotificationDate(date: string): void {
    try {
      localStorage.setItem(LAST_NOTIFICATION_DATE_KEY, date);
      this.lastNotificationDate = date;
    } catch (error) {
      console.error('Failed to save last notification date:', error);
    }
  }

  // Load sent notification IDs for today
  private loadSentNotifications(): Set<string> {
    try {
      const today = new Date().toDateString();
      const stored = localStorage.getItem(SENT_NOTIFICATIONS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Only return if it's from today
        if (data.date === today) {
          return new Set(data.ids);
        }
      }
    } catch (error) {
      console.error('Failed to load sent notifications:', error);
    }
    return new Set();
  }

  // Save sent notification ID
  private saveSentNotification(id: string): void {
    try {
      const today = new Date().toDateString();
      this.sentNotificationIds.add(id);
      localStorage.setItem(SENT_NOTIFICATIONS_KEY, JSON.stringify({
        date: today,
        ids: Array.from(this.sentNotificationIds)
      }));
    } catch (error) {
      console.error('Failed to save sent notification:', error);
    }
  }

  // Check if notification was already sent today
  private wasNotificationSentToday(id: string): boolean {
    const today = new Date().toDateString();
    // Reset if it's a new day
    if (this.lastNotificationDate !== today) {
      this.sentNotificationIds.clear();
      this.saveLastNotificationDate(today);
    }
    return this.sentNotificationIds.has(id);
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Check if notifications are enabled
  areNotificationsEnabled(): boolean {
    // We already have Notification.permission check, but let's make it smarter
    if (this.isSupported) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  // Get current preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Update preferences
  updatePreferences(newPreferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
  }

  // Send a notification
  private async sendNotification(event: NotificationEvent): Promise<void> {
    if (!this.areNotificationsEnabled()) {
      return;
    }

    // Check if already sent today
    if (this.wasNotificationSentToday(event.id)) {
      return;
    }

    try {
      const notification = new Notification(event.title, {
        body: event.body,
        icon: event.icon || '/icon-192x192.png',
        tag: event.id,
        requireInteraction: event.type === 'eid-greeting',
        badge: '/icon-192x192.png',
      });

      // Auto-close after 5 seconds for non-important notifications
      if (event.type !== 'eid-greeting') {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle click events
      notification.onclick = () => {
        notification.close();
        window.focus();
      };

      // Mark as sent
      this.saveSentNotification(event.id);
      this.saveLastNotificationDate(new Date().toDateString());
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Check and send Ramadan countdown notifications
  private async checkRamadanCountdown(): Promise<void> {
    if (!this.preferences.ramadanCountdowns) {
      return;
    }

    const today = new Date();

    if (isRamadanCountdownPeriod(today)) {
      const daysUntil = getDaysUntilRamadan(today);

      if (daysUntil > 0 && daysUntil <= 30) {
        const event: NotificationEvent = {
          id: `ramadan-countdown-${daysUntil}`,
          title: 'Ramadan Countdown',
          body: `${daysUntil} day${daysUntil > 1 ? 's' : ''} until Ramadan ${today.getFullYear() + (today.getMonth() < 6 ? 1447 : 1446)} AH`,
          type: 'ramadan-countdown',
          timestamp: Date.now(),
        };

        await this.sendNotification(event);
      }
    }
  }

  // Check and send Eid greetings
  private async checkEidGreetings(): Promise<void> {
    if (!this.preferences.eidGreetings) {
      return;
    }

    const today = new Date();

    // Check for Eid-ul-Fitr (10th of Shawwal, Hijri month 10)
    // Check for Eid-ul-Adha (10th of Dhul Hijjah, Hijri month 12)
    // This is simplified - in production, you'd use a proper Hijri calendar API

    const eidDates = importantIslamicDates.filter(date => date.type === 'eid');

    for (const eid of eidDates) {
      // Simplified check - would need proper Hijri calendar conversion
      if (this.isEidDay(today, eid)) {
        const event: NotificationEvent = {
          id: `eid-${eid.id}`,
          title: eid.name,
          body: eid.notificationMessage,
          icon: '/eid-icon.png',
          type: 'eid-greeting',
          timestamp: Date.now(),
        };

        await this.sendNotification(event);

        // Trigger festive UI event
        this.triggerFestiveUI(eid);
        break;
      }
    }
  }

  // Simplified Eid day check (would need proper Hijri calendar in production)
  private isEidDay(date: Date, eid: IslamicDate): boolean {
    // This is a placeholder - implement proper Hijri calendar conversion
    // For now, using approximate Gregorian dates
    const currentYear = date.getFullYear();

    if (eid.id === 'eid-ul-fitr') {
      // Approximate dates for Eid-ul-Fitr
      const eidFitrDates: Record<number, { month: number; day: number }> = {
        2025: { month: 3, day: 30 },
        2026: { month: 3, day: 20 },
        2027: { month: 3, day: 9 },
        2028: { month: 2, day: 26 },
        2029: { month: 2, day: 15 },
        2030: { month: 2, day: 5 },
      };

      const targetDate = eidFitrDates[currentYear];
      return targetDate && date.getMonth() === targetDate.month - 1 && date.getDate() === targetDate.day;
    }

    if (eid.id === 'eid-ul-adha') {
      // Approximate dates for Eid-ul-Adha
      const eidAdhaDates: Record<number, { month: number; day: number }> = {
        2025: { month: 6, day: 7 },
        2026: { month: 5, day: 27 },
        2027: { month: 5, day: 17 },
        2028: { month: 5, day: 5 },
        2029: { month: 4, day: 25 },
        2030: { month: 4, day: 14 },
      };

      const targetDate = eidAdhaDates[currentYear];
      return targetDate && date.getMonth() === targetDate.month - 1 && date.getDate() === targetDate.day;
    }

    return false;
  }

  // Check and send Friday Surah Kahf reminders
  private async checkFridayKahfReminder(): Promise<void> {
    if (!this.preferences.fridayKahfReminders) {
      return;
    }

    const today = new Date();

    // Check if today is Friday (day 5 in JavaScript, where 0 = Sunday)
    if (today.getDay() === 5) {
      const event: NotificationEvent = {
        id: 'friday-kahf',
        title: 'Friday Reminder',
        body: 'Don\'t forget to read Surah Al-Kahf today! It\'s a Sunnah with great rewards.',
        type: 'friday-kahf',
        timestamp: Date.now(),
      };

      await this.sendNotification(event);
    }
  }

  // Check and send daily hadith notifications
  private async checkDailyHadith(): Promise<void> {
    if (!this.preferences.dailyHadithNotifications) {
      return;
    }

    const today = new Date();
    const todayStr = today.toDateString();

    // Send at a specific time (e.g., 9 AM)
    if (today.getHours() === 9 && today.getMinutes() === 0) {
      const hadith = this.getRandomHadith();

      const event: NotificationEvent = {
        id: `daily-hadith-${todayStr}`,
        title: 'Daily Hadith',
        body: hadith,
        type: 'daily-hadith',
        timestamp: Date.now(),
      };

      await this.sendNotification(event);
    }
  }

  // Get random hadith (simplified - would use hadith database in production)
  private getRandomHadith(): string {
    const hadiths = [
      "The best among you are those who learn the Quran and teach it. - Bukhari",
      "Kindness is a mark of faith, and whoever is not kind has no faith. - Muslim",
      "Speak good or remain silent. - Bukhari",
      "The strong believer is better and more beloved to Allah than the weak believer. - Muslim",
      "None of you truly believes until he wishes for his brother what he wishes for himself. - Bukhari",
    ];

    return hadiths[Math.floor(Math.random() * hadiths.length)];
  }

  // Trigger festive UI for special events
  private triggerFestiveUI(event: IslamicDate): void {
    // Dispatch custom event for UI components to listen to
    const customEvent = new CustomEvent('islamicEvent', {
      detail: {
        type: event.type,
        name: event.name,
        arabicName: event.arabicName,
        message: event.notificationMessage,
      },
    });

    window.dispatchEvent(customEvent);
  }

  // Main check method - call this periodically
  async checkAllNotifications(): Promise<void> {
    if (!this.areNotificationsEnabled()) {
      return;
    }

    await Promise.all([
      this.checkRamadanCountdown(),
      this.checkEidGreetings(),
      this.checkFridayKahfReminder(),
      this.checkDailyHadith(),
    ]);
  }

  // Start the notification service - runs outside React render cycle
  start(): void {
    // Prevent duplicate intervals
    if (this.intervalId !== null) {
      return;
    }

    // Check notifications every minute using plain setInterval (outside React)
    this.intervalId = setInterval(() => {
      this.checkAllNotifications();
    }, 60000);

    // For APK users, add persistent permission checking
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       ('standalone' in window.navigator && (window.navigator as any).standalone) || 
                       document.referrer.includes('android-app://');

    if (isStandalone) {
      // Check permissions every 5 minutes for APK users
      this.permissionCheckInterval = setInterval(() => {
        if (Notification.permission === 'default') {
          console.log('APK user still has default notification permission - should request again');
          // Trigger a permission request event that UI can listen to
          const permissionEvent = new CustomEvent('requestNotificationPermission', {
            detail: { source: 'apk-persistent-check' }
          });
          window.dispatchEvent(permissionEvent);
        }
      }, 5 * 60 * 1000); // 5 minutes
    }

    // Check immediately on start
    this.checkAllNotifications();
  }

  // Stop the notification service and clean up intervals
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.permissionCheckInterval !== null) {
      clearInterval(this.permissionCheckInterval);
      this.permissionCheckInterval = null;
    }
    
    console.log('Notification service stopped');
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();
