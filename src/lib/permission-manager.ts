/**
 * Unified Permission Manager
 * Centralized permission handling for web and mobile platforms
 */

import { unifiedNotifications } from './unified-notifications';
import { GeolocationService } from './geolocation-service';

export type PermissionType = 'location' | 'notifications';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'not-supported';

export type PlatformType = 'web' | 'mobile';

export interface PermissionInfo {
  type: PermissionType;
  status: PermissionStatus;
  platform: PlatformType;
  title: string;
  description: string;
  rationale: string;
  benefits: string[];
  instructions?: {
    web?: string;
    mobile?: string;
  };
}

export interface PermissionRequestOptions {
  type: PermissionType;
  rationale?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

class PermissionManager {
  private platform: PlatformType;
  private permissionCache: Map<PermissionType, PermissionStatus> = new Map();

  constructor() {
    this.platform = this.detectPlatform();
    this.initializeCache();
  }

  private detectPlatform(): PlatformType {
    // Check if running in Capacitor (mobile app)
    const capacitor = (window as unknown as { Capacitor?: unknown }).Capacitor;
    
    // Debug logging to help identify issues
    console.log('Platform Detection Debug:', {
      capacitor: !!capacitor,
      userAgent: window.navigator.userAgent,
      protocol: window.location.protocol,
      cordova: !!(window as any).cordova,
      devicePlatform: (window as any).device?.platform,
      hasCapacitorInUA: window.navigator.userAgent.includes('Capacitor')
    });
    
    // More robust platform detection
    if (capacitor) {
      // Additional check to ensure we're actually in a native app
      const isNativeApp = !!(window as unknown as { 
        cordova?: unknown;
        // Check for mobile-specific indicators
        device?: { platform?: string };
      }).cordova || 
      (window as any).device?.platform ||
      // Check if we're in a standalone mobile app context
      window.location.protocol === 'file:' ||
      window.navigator.userAgent.includes('Capacitor');
      
      console.log('Detected platform:', isNativeApp ? 'mobile' : 'web');
      return isNativeApp ? 'mobile' : 'web';
    }
    
    console.log('Detected platform: web (no Capacitor)');
    return 'web';
  }

  private initializeCache(): void {
    // Initialize cache with default values
    this.permissionCache.set('location', 'prompt');
    this.permissionCache.set('notifications', 'prompt');
  }

  private updateCache(type: PermissionType, status: PermissionStatus): void {
    this.permissionCache.set(type, status);
  }

  getPlatform(): PlatformType {
    return this.platform;
  }

  // Get permission information
  getPermissionInfo(type: PermissionType): PermissionInfo {
    const status = this.permissionCache.get(type) || 'prompt';
    
    const permissionMap: Record<PermissionType, Omit<PermissionInfo, 'type'>> = {
      location: {
        status,
        platform: this.platform,
        title: 'Location Access',
        description: 'Access your device location to provide accurate prayer times based on your current position.',
        rationale: 'Noor Connect needs location access to calculate accurate prayer times for your specific location and provide Qibla direction.',
        benefits: [
          'Accurate prayer times for your location',
          'Automatic Qibla direction',
          'Location-based prayer reminders',
          'Hijri calendar adjustments'
        ],
        instructions: {
          web: 'Click the location icon in your browser address bar and allow location access.',
          mobile: 'Go to Settings → Apps → Noor Connect → Permissions → Location and allow access.'
        }
      },
      notifications: {
        status,
        platform: this.platform,
        title: 'Notification Access',
        description: 'Receive prayer time reminders and Islamic event notifications.',
        rationale: 'Noor Connect needs notification access to remind you of prayer times, Ramadan alerts, and important Islamic events.',
        benefits: [
          'Prayer time reminders (Fajr to Isha)',
          'Ramadan countdowns and alerts',
          'Eid greetings and reminders',
          'Friday Surah Al-Kahf alerts',
          'Daily Hadith notifications'
        ],
        instructions: {
          web: 'Click the lock icon in your browser address bar and allow notifications.',
          mobile: 'Go to Settings → Apps → Noor Connect → Notifications and allow access.'
        }
      }
    };

    return { type, ...permissionMap[type] };
  }

  // Get current permission status
  async getPermissionStatus(type: PermissionType): Promise<PermissionStatus> {
    // Check cache first
    if (this.permissionCache.has(type)) {
      const cached = this.permissionCache.get(type);
      if (cached !== 'prompt') return cached;
    }

    try {
      let status: PermissionStatus;

      if (type === 'location') {
        status = await this.checkLocationPermission();
      } else if (type === 'notifications') {
        status = await this.checkNotificationPermission();
      } else {
        status = 'not-supported';
      }

      this.updateCache(type, status);
      return status;
    } catch (error) {
      console.error(`Failed to check ${type} permission:`, error);
      this.updateCache(type, 'denied');
      return 'denied';
    }
  }

  // Request permission
  async requestPermission(options: PermissionRequestOptions): Promise<boolean> {
    const { type, rationale, onSuccess, onError } = options;
    const permissionInfo = this.getPermissionInfo(type);

    try {
      // Show rationale if provided
      if (rationale) {
        const confirmed = confirm(permissionInfo.rationale + '\n\n' + rationale);
        if (!confirmed) return false;
      }

      let granted = false;

      if (type === 'location') {
        granted = await this.requestLocationPermission();
      } else if (type === 'notifications') {
        granted = await this.requestNotificationPermission();
      } else {
        throw new Error(`Unsupported permission type: ${type}`);
      }

      this.updateCache(type, granted ? 'granted' : 'denied');

      if (granted) {
        onSuccess?.();
      } else {
        onError?.(new Error(`${permissionInfo.title} was denied`));
      }

      return granted;
    } catch (error) {
      console.error(`Failed to request ${type} permission:`, error);
      this.updateCache(type, 'denied');
      onError?.(error as Error);
      return false;
    }
  }

  // Check location permission
  private async checkLocationPermission(): Promise<PermissionStatus> {
    if (this.platform === 'mobile') {
      try {
        const permissions = await GeolocationService.checkPermissions();
        return (permissions as any).location === 'granted' ? 'granted' : 'denied';
      } catch {
        return 'denied';
      }
    } else {
      // Web - check if geolocation is supported and permission is granted
      if (!navigator.geolocation) return 'not-supported';
      
      return navigator.permissions ? 
        await this.checkWebPermission('geolocation') :
        'prompt'; // Can't check without permissions API
    }
  }

  // Request location permission
  private async requestLocationPermission(): Promise<boolean> {
    if (this.platform === 'mobile') {
      try {
        const granted = await GeolocationService.requestPermissions();
        return granted;
      } catch {
        return false;
      }
    } else {
      // Web - request geolocation permission.
      // Note: Permissions API does not provide a standard `request()` method.
      // The reliable way to trigger the browser prompt is calling getCurrentPosition()
      if (!navigator.geolocation) return false;

      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          (error: any) => {
            // PERMISSION_DENIED is code 1
            if (error && error.code === 1) {
              resolve(false);
              return;
            }
            // If it failed for another reason (timeout/unavailable), permission may still be granted.
            // Treat as granted so the UI can proceed and handle location retrieval separately.
            resolve(true);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
      });
    }
  }

  // Check notification permission
  private async checkNotificationPermission(): Promise<PermissionStatus> {
    if (this.platform === 'mobile') {
      const status = await unifiedNotifications.getPermissionStatus();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'prompt';
    } else {
      // Web - check if notifications are supported
      if (!('Notification' in window)) return 'not-supported';
      
      if (Notification.permission === 'granted') return 'granted';
      if (Notification.permission === 'denied') return 'denied';
      
      return navigator.permissions ? 
        await this.checkWebPermission('notifications') :
        'prompt';
    }
  }

  // Request notification permission
  private async requestNotificationPermission(): Promise<boolean> {
    return await unifiedNotifications.requestPermission();
  }

  // Check web permission using Permissions API
  private async checkWebPermission(permissionName: PermissionName): Promise<PermissionStatus> {
    if (!navigator.permissions) return 'prompt';

    try {
      const result = await navigator.permissions.query({ name: permissionName });
      switch (result.state) {
        case 'granted': return 'granted';
        case 'denied': return 'denied';
        case 'prompt': return 'prompt';
        default: return 'prompt';
      }
    } catch {
      return 'prompt';
    }
  }

  // Get all permissions status
  async getAllPermissionsStatus(): Promise<Map<PermissionType, PermissionInfo>> {
    const permissions = new Map<PermissionType, PermissionInfo>();
    
    for (const type of ['location', 'notifications'] as PermissionType[]) {
      const status = await this.getPermissionStatus(type);
      permissions.set(type, this.getPermissionInfo(type));
    }

    return permissions;
  }

  // Check if all critical permissions are granted
  async areCriticalPermissionsGranted(): Promise<boolean> {
    const locationStatus = await this.getPermissionStatus('location');
    const notificationStatus = await this.getPermissionStatus('notifications');
    
    return locationStatus === 'granted' && notificationStatus === 'granted';
  }

  // Refresh permission cache
  async refreshPermissions(): Promise<void> {
    this.permissionCache.clear();
    await this.getAllPermissionsStatus();
  }
}

// Singleton instance
export const permissionManager = new PermissionManager();

// Helper function for easy permission requests
export const requestPermission = async (
  type: PermissionType,
  options?: Omit<PermissionRequestOptions, 'type'>
): Promise<boolean> => {
  return permissionManager.requestPermission({ type, ...options });
};

// Helper function to check permission status
export const checkPermission = async (type: PermissionType): Promise<PermissionInfo> => {
  const status = await permissionManager.getPermissionStatus(type);
  const info = permissionManager.getPermissionInfo(type);
  return { ...info, status };
};
