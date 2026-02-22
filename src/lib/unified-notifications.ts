/**
 * Unified Notification System
 * Consolidates all notification functionality into a single, reliable system
 */

import { LocalNotifications } from '@capacitor/local-notifications';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

class UnifiedNotificationService {
  private isSupported: boolean;
  private permission: NotificationPermission = 'default';
  private isCapacitor: boolean;

  constructor() {
    this.isSupported = 'Notification' in window;
    this.isCapacitor = !!(window as unknown as { Capacitor?: unknown }).Capacitor;
    this.permission = this.isSupported ? Notification.permission : 'default';
  }

  // Check if notifications are supported
  isNotificationSupported(): boolean {
    // Web notifications require HTTPS (except localhost)
    if (!this.isCapacitor && this.isSupported) {
      const isSecure = location.protocol === 'https:' ||
        location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1';
      return isSecure;
    }
    return this.isCapacitor;
  }

  // Get current permission status
  async getPermissionStatus(): Promise<NotificationPermission> {
    if (this.isCapacitor) {
      try {
        const result = await LocalNotifications.checkPermissions();
        // If display is granted and we are on Android, we also check if notifications are actually enabled
        // for the app in system settings, but 'granted' here is usually sufficient.
        return result.display === 'granted' ? 'granted' : 'denied';
      } catch (error) {
        console.warn('Failed to check Capacitor notification permissions:', error);
        return 'denied';
      }
    }

    // Web fallback
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }

  // Check if we are running in an app wrapper
  isRunningAsNativeApp(): boolean {
    return this.isCapacitor;
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!this.isNotificationSupported()) {
      console.warn('Notifications not supported on this device');
      return false;
    }

    if (this.isCapacitor) {
      try {
        const result = await LocalNotifications.requestPermissions();
        this.permission = result.display === 'granted' ? 'granted' : 'denied';
        return this.permission === 'granted';
      } catch (error) {
        console.error('Failed to request Capacitor notification permission:', error);
        return false;
      }
    }

    // Web Notifications
    try {
      // Compatibility for older browsers that don't return a promise
      const permission = await new Promise<NotificationPermission>((resolve) => {
        const result = Notification.requestPermission(resolve);
        if (result && (result as any).then) {
          (result as any).then(resolve);
        }
      });

      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request web notification permission:', error);
      return false;
    }
  }

  // Show a notification
  async showNotification(options: NotificationOptions): Promise<boolean> {
    const hasPermission = await this.getPermissionStatus();
    if (hasPermission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      if (this.isCapacitor) {
        // Use Capacitor Local Notifications
        await LocalNotifications.schedule({
          notifications: [{
            id: Date.now(),
            title: options.title,
            body: options.body,
            schedule: { at: new Date() },
            sound: 'default',
            smallIcon: 'ic_notification',
            iconColor: '#22c55e',
            extra: options.data || {}
          }]
        });
      } else {
        // Use Web Notifications API
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: options.tag || 'default',
          requireInteraction: options.requireInteraction || false,
          data: options.data || {}
        });

        // Auto-close after 10 seconds unless interaction is required
        if (!options.requireInteraction) {
          setTimeout(() => notification.close(), 10000);
        }

        // Handle click events
        notification.onclick = () => {
          notification.close();
          window.focus();

          // Navigate if URL provided
          const url = options.data?.url;
          if (typeof url === 'string') {
            window.location.href = url;
          }
        };
      }

      console.log('Notification sent successfully:', options.title);
      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  // Test notification with detailed debugging
  async testNotification(): Promise<{ success: boolean; details: string }> {
    const details: string[] = [];

    details.push(`Platform: ${this.isCapacitor ? 'Capacitor (Mobile)' : 'Web'}`);
    details.push(`Protocol: ${location.protocol}`);
    details.push(`Hostname: ${location.hostname}`);
    details.push(`Supported: ${this.isNotificationSupported()}`);

    // Check HTTPS requirement for web
    if (!this.isCapacitor && this.isSupported) {
      const isSecure = location.protocol === 'https:' ||
        location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1';
      details.push(`Secure context: ${isSecure}`);

      if (!isSecure) {
        details.push('ERROR: Web notifications require HTTPS (except localhost)');
        return {
          success: false,
          details: details.join('\n')
        };
      }
    }

    const permission = await this.getPermissionStatus();
    details.push(`Permission: ${permission}`);

    if (!this.isNotificationSupported()) {
      return {
        success: false,
        details: details.join('\n')
      };
    }

    if (permission !== 'granted') {
      const granted = await this.requestPermission();
      details.push(`Permission requested: ${granted ? 'granted' : 'denied'}`);

      if (!granted) {
        return {
          success: false,
          details: details.join('\n')
        };
      }
    }

    // Test both direct notification and service worker if available
    let directSuccess = false;
    let swSuccess = false;

    // Test direct notification
    directSuccess = await this.showNotification({
      title: '🕌 Test Notification',
      body: 'Direct notification test successful!',
      tag: 'test-direct',
      requireInteraction: false,
      data: { test: true, source: 'direct' }
    });

    details.push(`Direct notification: ${directSuccess ? 'success' : 'failed'}`);

    // Test service worker if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'TEST_NOTIFICATION'
        });
        swSuccess = true;
        details.push('Service Worker notification: sent');
      } catch (error) {
        details.push(`Service Worker notification: failed - ${error}`);
      }
    } else {
      details.push('Service Worker: not available');
    }

    const overallSuccess = directSuccess || swSuccess;
    details.push(`Overall test: ${overallSuccess ? 'success' : 'failed'}`);

    return {
      success: overallSuccess,
      details: details.join('\n')
    };
  }

  // Schedule prayer notification
  async schedulePrayerNotification(
    prayerName: string,
    prayerTime: Date,
    options?: Partial<NotificationOptions>
  ): Promise<boolean> {
    const now = new Date();
    const delay = prayerTime.getTime() - now.getTime();

    if (delay <= 0) {
      console.warn(`Prayer time ${prayerName} is in the past`);
      return false;
    }

    const notificationOptions: NotificationOptions = {
      title: `🕌 ${prayerName} Prayer Time`,
      body: `It's time for ${prayerName} prayer`,
      tag: `prayer-${prayerName.toLowerCase()}`,
      requireInteraction: true,
      data: { prayerName, url: '/' },
      ...options
    };

    if (this.isCapacitor) {
      try {
        await LocalNotifications.schedule({
          notifications: [{
            id: this.getPrayerNotificationId(prayerName),
            title: notificationOptions.title,
            body: notificationOptions.body,
            schedule: {
              at: prayerTime,
              allowWhileIdle: true
            },
            sound: 'default',
            smallIcon: 'ic_notification',
            iconColor: '#22c55e',
            extra: notificationOptions.data
          }]
        });
        console.log(`Scheduled ${prayerName} notification for ${prayerTime}`);
        return true;
      } catch (error) {
        console.error(`Failed to schedule ${prayerName} notification:`, error);
        return false;
      }
    } else {
      // Web - use setTimeout for scheduling
      setTimeout(async () => {
        await this.showNotification(notificationOptions);
      }, delay);

      console.log(`Scheduled ${prayerName} notification for ${prayerTime}`);
      return true;
    }
  }

  // Get notification ID for prayer
  private getPrayerNotificationId(prayerName: string): number {
    const ids: Record<string, number> = {
      'Fajr': 1001,
      'Dhuhr': 1002,
      'Asr': 1003,
      'Maghrib': 1004,
      'Isha': 1005
    };
    return ids[prayerName] || 1000 + Math.floor(Math.random() * 100);
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    if (this.isCapacitor) {
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({
            notifications: pending.notifications.map(n => ({ id: n.id }))
          });
        }
      } catch (error) {
        console.error('Failed to clear Capacitor notifications:', error);
      }
    }

    // Close any active web notifications
    if (this.isSupported) {
      // Web notifications don't have a clear all method, but they auto-close
      console.log('Web notifications will auto-close');
    }
  }

  // Get scheduled notifications (Capacitor only)
  async getScheduledNotifications(): Promise<Array<{ id: number; title: string; body: string }>> {
    if (!this.isCapacitor) return [];

    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications.map(n => ({
        id: n.id,
        title: n.title || '',
        body: n.body || ''
      }));
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }
}

// Singleton instance
export const unifiedNotifications = new UnifiedNotificationService();
