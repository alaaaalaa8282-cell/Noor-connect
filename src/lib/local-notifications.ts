/**
 * Local Notifications Service
 * Handles prayer time reminders using Capacitor Local Notifications
 * FOSS-friendly - no proprietary wake lock libraries
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { AladhanAPI, type AladhanPrayerTime } from './aladhan-api';
import { getPrayerSettings } from './storage';

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

class LocalNotificationsService {
  private isInitialized = false;
  private scheduledNotifications: Map<number, ScheduledNotification> = new Map();

  /**
   * Check notification permissions without requesting them
   */
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
   * Initialize the local notifications service (without requesting permissions)
   */
  async initialize(): Promise<boolean> {
    try {
      // Only check permissions, don't request them
      const hasPermission = await this.checkPermissions();
      
      if (!hasPermission) {
        console.log('Notification permission not yet granted');
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
   * Only schedules when location is successfully resolved
   */
  async schedulePrayerNotificationsFromAPI(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
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

      // Clear existing prayer notifications
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
        timings = await AladhanAPI.getTodaysPrayerTimes(
          locationData.latitude,
          locationData.longitude,
          1 // Muslim World League method
        );
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
        const [hours, minutes] = prayer.time.split(':').map(Number);
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
              location: locationData
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
        
        console.log(`Scheduled ${notifications.length} prayer notifications for location: ${locationData.city || `${locationData.latitude.toFixed(2)},${locationData.longitude.toFixed(2)}`}`);
      }

    } catch (error) {
      console.error('Failed to schedule prayer notifications from API:', error);
      throw error;
    }
  }
  async schedulePrayerNotifications(prayerTimes: PrayerTime[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
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
      await this.initialize();
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
   * Schedule daily notification reset (for next day's prayers)
   */
  async scheduleDailyReset(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
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
}

export const localNotifications = new LocalNotificationsService();
