/**
 * Local Web Notifications for Prayer Reminders
 * No Firebase - uses Web Notifications API only
 */

const NOTIFICATION_PERMISSION_KEY = 'prayer-notifications-enabled';
const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled-prayer-notifications';

export interface ScheduledNotification {
  id: string;
  prayerName: string;
  time: Date;
  timeoutId?: number;
}

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Check current permission status
export const getNotificationPermission = (): NotificationPermission | null => {
  if (!isNotificationSupported()) return null;
  return Notification.permission;
};

// Check if user has enabled notifications in our app
export const isNotificationsEnabled = (): boolean => {
  return localStorage.getItem(NOTIFICATION_PERMISSION_KEY) === 'true';
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.log('Notifications not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Disable notifications
export const disableNotifications = (): void => {
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'false');
  clearAllScheduledNotifications();
};

// Enable notifications
export const enableNotifications = async (): Promise<boolean> => {
  const granted = await requestNotificationPermission();
  if (granted) {
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
  }
  return granted;
};

// Show a notification
export const showNotification = (title: string, options?: NotificationOptions): void => {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  if (!isNotificationsEnabled()) return;

  try {
    const notification = new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: options?.tag || 'prayer-reminder',
      requireInteraction: false,
      ...options,
    });

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

// Active timeout IDs for scheduled notifications
const activeTimeouts: Map<string, number> = new Map();

// Schedule a notification for a specific time
export const schedulePrayerNotification = (prayerName: string, prayerTime: Date): string | null => {
  if (!isNotificationsEnabled()) return null;
  
  const now = new Date();
  const delay = prayerTime.getTime() - now.getTime();
  
  // Don't schedule if time has passed
  if (delay <= 0) return null;
  
  const id = `${prayerName}-${prayerTime.getTime()}`;
  
  // Clear existing timeout for this prayer if exists
  const existingTimeout = activeTimeouts.get(id);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  
  const timeoutId = window.setTimeout(() => {
    showNotification(`${prayerName} Prayer Time`, {
      body: `It's time for ${prayerName} prayer. May Allah accept your worship.`,
      tag: `prayer-${prayerName.toLowerCase()}`,
    });
    activeTimeouts.delete(id);
  }, delay);
  
  activeTimeouts.set(id, timeoutId);
  
  return id;
};

// Schedule pre-prayer reminder (X minutes before)
export const schedulePrePrayerReminder = (
  prayerName: string, 
  prayerTime: Date, 
  minutesBefore: number
): string | null => {
  if (!isNotificationsEnabled()) return null;
  
  const reminderTime = new Date(prayerTime.getTime() - minutesBefore * 60 * 1000);
  const now = new Date();
  const delay = reminderTime.getTime() - now.getTime();
  
  if (delay <= 0) return null;
  
  const id = `${prayerName}-reminder-${minutesBefore}-${prayerTime.getTime()}`;
  
  const existingTimeout = activeTimeouts.get(id);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  
  const timeoutId = window.setTimeout(() => {
    showNotification(`${prayerName} in ${minutesBefore} minutes`, {
      body: `Prepare for ${prayerName} prayer. Time remaining: ${minutesBefore} minutes.`,
      tag: `prayer-reminder-${prayerName.toLowerCase()}`,
    });
    activeTimeouts.delete(id);
  }, delay);
  
  activeTimeouts.set(id, timeoutId);
  
  return id;
};

// Clear all scheduled notifications
export const clearAllScheduledNotifications = (): void => {
  activeTimeouts.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  activeTimeouts.clear();
};

// Schedule all prayer notifications for today
export const scheduleAllPrayerNotifications = (
  prayers: { name: string; time: Date }[],
  reminderMinutes: number = 10
): void => {
  // Clear existing
  clearAllScheduledNotifications();
  
  if (!isNotificationsEnabled()) return;
  
  prayers.forEach(({ name, time }) => {
    // Schedule the main prayer time notification
    schedulePrayerNotification(name, time);
    
    // Schedule pre-prayer reminder if enabled
    if (reminderMinutes > 0) {
      schedulePrePrayerReminder(name, time, reminderMinutes);
    }
  });
};
