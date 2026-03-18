/**
 * Global Location State Management
 * Centralized location handling with localStorage persistence
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GeolocationService } from '@/lib/geolocation-service';

export interface LocationState {
  latitude: number;
  longitude: number;
  locationName: string;
  isDetecting: boolean;
  timeZone?: string;
  lastUpdated: string;
  isIpBased?: boolean; // true if location was detected via IP fallback
}

const DEFAULT_LOCATION: LocationState = {
  latitude: 24.8607, // Karachi
  longitude: 67.0011, // Karachi
  locationName: 'Karachi, Pakistan',
  isDetecting: false,
  timeZone: 'Asia/Karachi',
  isIpBased: false,
  lastUpdated: new Date().toISOString()
};

const STORAGE_KEY = 'location-storage';

// Load location from localStorage
const loadStoredLocation = (): LocationState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_LOCATION,
        ...parsed,
        isDetecting: false // Reset detecting state on load
      };
    }
  } catch (error) {
    console.error('Failed to load location from storage:', error);
  }
  return DEFAULT_LOCATION;
};

// Save location to localStorage
const saveLocation = (location: LocationState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      latitude: location.latitude,
      longitude: location.longitude,
      locationName: location.locationName,
      timeZone: location.timeZone,
      lastUpdated: location.lastUpdated
    }));
  } catch (error) {
    console.error('Failed to save location to storage:', error);
  }
};

// Global location state hook
export const useLocationState = () => {
  const [location, setLocationState] = useState<LocationState>(loadStoredLocation);

  const setLocation = useCallback((lat: number, lng: number, name?: string, timeZone?: string) => {
    setLocationState(prev => {
      const newLocation: LocationState = {
        ...prev,
        latitude: lat,
        longitude: lng,
        locationName: name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        timeZone: timeZone || prev.timeZone,
        lastUpdated: new Date().toISOString()
      };
      saveLocation(newLocation);

      // Update Android widget with new location
      import('@/lib/widget-service').then(({ WidgetService }) => {
        WidgetService.updateWidget(newLocation.latitude, newLocation.longitude, newLocation.locationName);
      });

      return newLocation;
    });
  }, []); // No dependency on location — uses functional setState

  const detectLocation = useCallback(async (): Promise<boolean> => {
    if (location.isDetecting) {
      return false;
    }

    setLocationState(prev => ({ ...prev, isDetecting: true }));

    try {
      // --- STEP 1: IP-BASED DETECTION (Private, No Google API) ---
      try {
        const response = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.latitude && data.longitude) {
            const newLocation: LocationState = {
              latitude: data.latitude,
              longitude: data.longitude,
              locationName: `${data.city}, ${data.country_name}`,
              timeZone: data.timezone,
              isDetecting: false,
              lastUpdated: new Date().toISOString()
            };

            setLocationState(newLocation);
            saveLocation(newLocation);
            return true;
          }
        }
      } catch (ipError) {
        console.warn('IP-based detection failed, falling back to system GPS:', ipError);
      }

      // --- STEP 2: SYSTEM GPS (Fallback, may trigger Google API in browser) ---
      if (!GeolocationService.isSupported()) {
        throw new Error('Geolocation not supported');
      }

      const position = await GeolocationService.getCurrentPosition({
        enableHighAccuracy: false, // Low accuracy avoids Google Network Provider in some browsers
        timeout: 5000,
        maximumAge: 300000
      });

      const { latitude, longitude } = position;

      // Get location name using reverse geocoding
      let locationName = 'Current Location';
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          {
            headers: { 'User-Agent': 'Noor-Connect-Islamic-App/1.0' },
            signal: AbortSignal.timeout(5000)
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.display_name) {
            locationName = data.display_name.split(',').slice(0, 2).join(', ');
          }
        }
      } catch {
        // Keep default name
      }

      const newLocation: LocationState = {
        latitude,
        longitude,
        locationName,
        isDetecting: false,
        isIpBased: false, // GPS-based location
        lastUpdated: new Date().toISOString()
      };

      setLocationState(newLocation);
      saveLocation(newLocation);
      return true;
    } catch (error) {
      console.warn('Geolocation detection failed, trying IP-based fallback:', error);

      try {
        // IP-based fallback (no key required for basic usage)
        const response = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.latitude && data.longitude) {
            const newLocation: LocationState = {
              latitude: data.latitude,
              longitude: data.longitude,
              locationName: `${data.city}, ${data.country_name} (IP)`,
              timeZone: data.timezone,
              isDetecting: false,
              isIpBased: true, // Flag to indicate IP-based detection
              lastUpdated: new Date().toISOString()
            };

            setLocationState(newLocation);
            saveLocation(newLocation);
            return true;
          }
        }
      } catch (ipError) {
        console.error('IP-based location detection also failed:', ipError);
      }

      setLocationState(prev => ({ ...prev, isDetecting: false }));
      return false;
    }
  }, [location.isDetecting]);

  const resetToDefault = useCallback(() => {
    const newLocation = { ...DEFAULT_LOCATION };
    setLocationState(newLocation);
    saveLocation(newLocation);
  }, []);

  return useMemo(() => ({
    ...location,
    setLocation,
    detectLocation,
    resetToDefault,
    coordinates: {
      lat: location.latitude,
      lng: location.longitude
    }
  }), [location, setLocation, detectLocation, resetToDefault]);
};
