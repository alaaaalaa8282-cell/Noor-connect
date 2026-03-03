/**
 * Geolocation Service
 * Handles location detection with proper Android permission handling
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation, PermissionStatus } from '@capacitor/geolocation';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  country?: string;
}

export class GeolocationService {
  /**
   * Check if geolocation is supported
   */
  static isSupported(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true; // Capacitor plugin is available
    } else {
      return 'geolocation' in navigator;
    }
  }

  /**
   * Check current permission status
   */
  static async checkPermissions(): Promise<PermissionStatus> {
    if (Capacitor.isNativePlatform()) {
      return await Geolocation.checkPermissions();
    } else {
      // Web doesn't have granular permission checking
      return { location: 'prompt' as PermissionStatus['location'], coarseLocation: 'prompt' as PermissionStatus['coarseLocation'] };
    }
  }

  static async requestPermissions(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const permissions = await Geolocation.requestPermissions();
        return permissions.location === 'granted' || permissions.coarseLocation === 'granted';
      } catch (error) {
        return false;
      }
    } else {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 15000 }
        );
      });
    }
  }

  static async getCurrentPosition(options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }): Promise<LocationCoordinates> {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000,
      ...options
    };

    if (Capacitor.isNativePlatform()) {
      try {
        const position = await Geolocation.getCurrentPosition(defaultOptions);
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
      } catch (error) {
        throw new Error('Failed to get location. Please check your location permissions.');
      }
    } else {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error('Location access denied. Please enable location permissions.'));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error('Location information unavailable.'));
                break;
              case error.TIMEOUT:
                reject(new Error('Location request timed out.'));
                break;
              default:
                reject(new Error('An unknown error occurred while getting location.'));
                break;
            }
          },
          defaultOptions
        );
      });
    }
  }

  static async watchPosition(
    callback: (position: LocationCoordinates) => void,
    options?: {
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
    }
  ): Promise<string> {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000,
      ...options
    };

    if (Capacitor.isNativePlatform()) {
      return await Geolocation.watchPosition(defaultOptions, (position, err) => {
        if (err) {
          return;
        }
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      });
    } else {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          // Silently handle watch errors to avoid spam
        },
        defaultOptions
      );
      return watchId.toString();
    }
  }

  /**
   * Clear position watch
   */
  static async clearWatch(watchId: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Geolocation.clearWatch({ id: watchId });
    } else {
      navigator.geolocation.clearWatch(parseInt(watchId, 10));
    }
  }
}
