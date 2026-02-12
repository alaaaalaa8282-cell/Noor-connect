/**
 * Local Notifications Service
 * Handles prayer time reminders using Capacitor Local Notifications
 * FOSS-friendly - no proprietary wake lock libraries
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { AladhanAPI, type AladhanPrayerTime } from './aladhan-api';
import { getPrayerSettings } from './storage';

// Task 2: Use SW registration for more robust "Native" notifications
let swRegistration: ServiceWorkerRegistration | null = null;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(reg => {
    swRegistration = reg;
  });
}

const LOCATION_STORAGE_KEY = 'user-location-data';

export interface PrayerTime {
  name: string;
  time: string;
  date: Date;
}

export interface ScheduledNotification {
  id: number;
  title: string;
  body: string;
  scheduleTime: Date;
  prayerName: string;
}

export class LocalNotificationManager {
  private isInitialized: boolean = false;
  private static hasStarted: boolean = false; // Global flag to prevent multiple starts
  private scheduledNotifications: Map<number, ScheduledNotification> = new Map();

  constructor() {
    // Check if LocalNotifications plugin is available
    if (!LocalNotifications) {
      console.warn('LocalNotifications plugin not available');
      return;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const permission = await LocalNotifications.checkPermissions();
      return permission.display === 'granted';
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      return false;
    }
  }

  /**
   * Request notification permissions (call this only when user toggles switch)
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const permission = await LocalNotifications.requestPermissions();

      if (permission.display !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      this.isInitialized = true;
      console.log('Local notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Start the notification service (only runs once per app load)
   */
  async start(): Promise<void> {
    // Prevent multiple starts
    if (LocalNotificationManager.hasStarted) {
      return;
    }

    LocalNotificationManager.hasStarted = true;
    const initialized = await this.initialize();
    if (initialized) {
      console.log('Notification service started');
    }
  }

  /**
   * Initialize the local notifications service (without requesting permissions)
   */
  async initialize(): Promise<boolean> {
    try {
      // Only check permissions, don't request them
      const hasPermission = await this.checkPermissions();

      if (!hasPermission) {
        return false;
      }

      this.isInitialized = true;
      console.log('Local notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize local notifications:', error);
      return false;
    }
  }

  /**
   * Schedule prayer time notifications using Aladhan API for accurate times
   * Only schedules when location is successfully resolved and times have actually changed
   */
  async schedulePrayerNotificationsFromAPI(): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return;
    }

    try {
      // Check if we have valid location data
      const storedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (!storedLocation) {
        console.log('No location data available, skipping notification scheduling');
        return;
      }

      const locationData = JSON.parse(storedLocation);
      const now = new Date();
      const storedTime = new Date(locationData.timestamp);
      const hoursDiff = (now.getTime() - storedTime.getTime()) / (1000 * 60 * 60);

      // Only schedule if location is recent (less than 24 hours) and not manual/default
      if (hoursDiff >= 24 || locationData.source === 'manual' || locationData.source === 'default') {
        console.log('Location data is stale or manual, skipping notification scheduling');
        return;
      }

      // Check if we already have notifications scheduled for today
      const today = now.toDateString();
      const lastScheduledDate = localStorage.getItem('last-notification-schedule-date');

      if (lastScheduledDate === today) {
        console.log('Notifications already scheduled for today, skipping');
        return;
      }

      // Only clear existing prayer notifications if we're going to schedule new ones
      // and we haven't already scheduled them today
      await this.clearPrayerNotifications();

      // Get today's prayer times from Aladhan API
      let timings: AladhanPrayerTime;

      if (locationData.city && locationData.country) {
        // Use city-based API for IP locations
        timings = await AladhanAPI.getTodaysPrayerTimesByCity(
          locationData.city,
          locationData.country,
          1 // Muslim World League method
        );
      } else {
        // Use coordinates-based API
        // Use coordinates-based API
        const result = await AladhanAPI.getTodaysPrayerTimes(
          locationData.latitude,
          locationData.longitude,
          1 // Muslim World League method
        );
        timings = result.timings;
      }

      const notifications = [];

      // Parse prayer times and create notifications
      const prayers = [
        { name: 'Fajr', time: timings.Fajr },
        { name: 'Dhuhr', time: timings.Dhuhr },
        { name: 'Asr', time: timings.Asr },
        { name: 'Maghrib', time: timings.Maghrib },
        { name: 'Isha', time: timings.Isha }
      ];

      for (const prayer of prayers) {
        const cleaned = prayer.time.replace(/\s*\(.*?\)\s*/g, '').trim();
        const [hours, minutes] = cleaned.split(':').map(Number);
        const prayerDate = new Date();
        prayerDate.setHours(hours, minutes, 0, 0);

        // Only schedule future prayers for today
        if (prayerDate > now) {
          const notificationId = this.getNotificationId(prayer.name);

          const notification = {
            id: notificationId,
            title: `🕌 ${prayer.name} Prayer Time`,
            body: `It's time for ${prayer.name} prayer. ${prayer.time}`,
            schedule: {
              at: prayerDate,
              allowWhileIdle: true, // Wake up device
              repeats: false,
            },
            sound: 'default',
            smallIcon: 'ic_stat_notification',
            iconColor: '#22c55e',
            extra: {
              prayerName: prayer.name,
              prayerTime: prayer.time,
              type: 'prayer_reminder',
              location: locationData,
              scheduledDate: today
            }
          };

          notifications.push(notification);

          // Store for tracking
          this.scheduledNotifications.set(notificationId, {
            id: notificationId,
            title: notification.title,
            body: notification.body,
            scheduleTime: prayerDate,
            prayerName: prayer.name
          });
        }
      }

      // Schedule all notifications
      if (notifications.length > 0) {
        await LocalNotifications.schedule({
          notifications
        });

        // Mark that we've scheduled notifications for today
        localStorage.setItem('last-notification-schedule-date', today);

        // Sync with Service Worker for background persistence (for PWA/APK)
        const swTimings: Record<string, { time: string }> = {};
        for (const p of prayers) {
          swTimings[p.name.toLowerCase()] = { time: p.time };
        }
        this.syncWithServiceWorker(swTimings);

        console.log(`Scheduled ${notifications.length} prayer notifications for location: ${locationData.city || `${locationData.latitude.toFixed(2)},${locationData.longitude.toFixed(2)}`}`);
      }

    } catch (error) {
      console.error('Failed to schedule prayer notifications from API:', error);
      throw error;
    }
  }
  async schedulePrayerNotifications(prayerTimes: PrayerTime[]): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return;
    }

    try {
      // Clear existing prayer notifications
      await this.clearPrayerNotifications();

      const now = new Date();
      const notifications = [];

      for (const prayer of prayerTimes) {
        // Only schedule future prayers for today
        if (prayer.date > now) {
          const notificationId = this.getNotificationId(prayer.name);

          const notification = {
            id: notificationId,
            title: `🕌 ${prayer.name} Prayer Time`,
            body: `It's time for ${prayer.name} prayer. ${prayer.time}`,
            schedule: {
              at: prayer.date,
              allowWhileIdle: true, // Wake up device
              repeats: false,
            },
            sound: 'default',
            smallIcon: 'ic_stat_notification',
            iconColor: '#22c55e',
            extra: {
              prayerName: prayer.name,
              prayerTime: prayer.time,
              type: 'prayer_reminder'
            }
          };

          notifications.push(notification);

          // Store for tracking
          this.scheduledNotifications.set(notificationId, {
            id: notificationId,
            title: notification.title,
            body: notification.body,
            scheduleTime: prayer.date,
            prayerName: prayer.name
          });
        }
      }

      // Schedule all notifications
      if (notifications.length > 0) {
        await LocalNotifications.schedule({
          notifications
        });

        // Sync with Service Worker
        const swTimings: Record<string, { time: string }> = {};
        for (const p of prayerTimes) {
          swTimings[p.name.toLowerCase()] = { time: p.time };
        }
        this.syncWithServiceWorker(swTimings);

        console.log(`Scheduled ${notifications.length} prayer notifications`);
      }
    } catch (error) {
      console.error('Failed to schedule prayer notifications:', error);
    }
  }

  /**
   * Schedule a single prayer notification
   */
  async scheduleSinglePrayerNotification(
    prayerName: string,
    prayerTime: string,
    prayerDate: Date
  ): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return;
    }

    try {
      const notificationId = this.getNotificationId(prayerName);

      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId,
          title: `🕌 ${prayerName} Prayer Time`,
          body: `It's time for ${prayerName} prayer. ${prayerTime}`,
          schedule: {
            at: prayerDate,
            allowWhileIdle: true, // Wake up device
            repeats: false,
          },
          sound: 'default',
          smallIcon: 'ic_stat_notification',
          iconColor: '#22c55e',
          extra: {
            prayerName,
            prayerTime,
            type: 'prayer_reminder'
          }
        }]
      });

      this.scheduledNotifications.set(notificationId, {
        id: notificationId,
        title: `🕌 ${prayerName} Prayer Time`,
        body: `It's time for ${prayerName} prayer. ${prayerTime}`,
        scheduleTime: prayerDate,
        prayerName
      });

      console.log(`Scheduled notification for ${prayerName} at ${prayerTime}`);
    } catch (error) {
      console.error(`Failed to schedule ${prayerName} notification:`, error);
    }
  }

  /**
   * Get notification ID for a prayer
   */
  private getNotificationId(prayerName: string): number {
    const ids: Record<string, number> = {
      'Fajr': 1001,
      'Dhuhr': 1002,
      'Asr': 1003,
      'Maghrib': 1004,
      'Isha': 1005
    };
    return ids[prayerName] || 1000 + Math.floor(Math.random() * 100);
  }

  /**
   * Clear all prayer notifications
   */
  async clearPrayerNotifications(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      const prayerNotificationIds = pending.notifications
        .filter(n => n.extra?.type === 'prayer_reminder')
        .map(n => n.id);

      if (prayerNotificationIds.length > 0) {
        await LocalNotifications.cancel({
          notifications: prayerNotificationIds.map(id => ({ id }))
        });

        // Clear from our tracking
        prayerNotificationIds.forEach(id => this.scheduledNotifications.delete(id));

        console.log(`Cancelled ${prayerNotificationIds.length} prayer notifications`);
      }
    } catch (error) {
      console.error('Failed to clear prayer notifications:', error);
    }
  }

  /**
   * Get all scheduled prayer notifications
   */
  async getScheduledPrayerNotifications(): Promise<ScheduledNotification[]> {
    try {
      const pending = await LocalNotifications.getPending();
      const prayerNotifications = pending.notifications
        .filter(n => n.extra?.type === 'prayer_reminder')
        .map(n => ({
          id: n.id,
          title: n.title || '',
          body: n.body || '',
          scheduleTime: n.schedule?.at || new Date(),
          prayerName: n.extra?.prayerName || ''
        }));

      return prayerNotifications;
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const permission = await LocalNotifications.checkPermissions();
      return permission.display === 'granted';
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      return false;
    }
  }

  /**
   * Show an immediate notification using Service Worker Registration
   * Task 2: Native Push Notifications logic
   */
  /**
   * Helper to get the active SW registration
   */
  private async getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (swRegistration) return swRegistration;
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        swRegistration = reg;
        return reg;
      } catch (e) {
        console.error('Error getting SW registration:', e);
      }
    }
    return null;
  }

  /**
   * Show an immediate notification using Service Worker Registration
   * Task 2: Native Push Notifications logic
   */
  async showNativeNotification(title: string, body: string, data: any = {}): Promise<void> {
    try {
      const reg = await this.getSWRegistration();

      if (!reg) {
        // Fallback for Safari/No-SW environments
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/favicon.png',
            requireInteraction: true,
            data: { ...data, url: data.url || '/dashboard' }
          });
        }
        return;
      }

      const options: any = {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200],
        requireInteraction: true, // task 2 requirement
        data: {
          ...data,
          url: data.url || '/dashboard' // opens dashboard by default
        },
        tag: data.tag || 'prayer-reminder'
      };

      await reg.showNotification(title, options);
      console.log('Native SW notification shown:', title);
    } catch (error) {
      console.error('Failed to show native notification:', error);
    }
  }

  /**
   * Schedule daily notification reset (for next day's prayers)
   */
  async scheduleDailyReset(): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return;
    }

    try {
      // Schedule at 2 AM for next day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(2, 0, 0, 0);

      await LocalNotifications.schedule({
        notifications: [{
          id: 9999,
          title: 'Prayer Times Update',
          body: 'Updating prayer times for today',
          schedule: {
            at: tomorrow,
            allowWhileIdle: true,
            repeats: true, // Repeat daily
          },
          sound: null, // Silent notification
          extra: {
            type: 'daily_reset'
          }
        }]
      });

      console.log('Scheduled daily prayer time reset at 2 AM');
    } catch (error) {
      console.error('Failed to schedule daily reset:', error);
    }
  }

  /**
   * Sync prayer times to the Service Worker for persistent background checks
   */
  private syncWithServiceWorker(timings: any): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_PRAYER_TIMES',
        data: { timings }
      });
      console.log('Prayer times synced to Service Worker');
    } else if (swRegistration?.active) {
      swRegistration.active.postMessage({
        type: 'UPDATE_PRAYER_TIMES',
        data: { timings }
      });
      console.log('Prayer times synced to active Service Worker registration');
    }
  }
}

export const localNotifications = new LocalNotificationManager();
