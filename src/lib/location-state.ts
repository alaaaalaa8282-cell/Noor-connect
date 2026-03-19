/**
 * Global Location State Management
 * Centralized location handling with localStorage persistence
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GeolocationService } from '@/lib/geolocation-service';

// FOSS offline fallback locations - major Islamic cities by timezone
const FALLBACK_LOCATIONS = {
  'Asia/Karachi': { name: 'Karachi', lat: 24.8607, lon: 67.0011 },
  'Asia/Dhaka': { name: 'Dhaka', lat: 23.8103, lon: 90.4125 },
  'Asia/Jakarta': { name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
  'Asia/Istanbul': { name: 'Istanbul', lat: 41.0082, lon: 28.9784 },
  'Asia/Riyadh': { name: 'Riyadh', lat: 24.7136, lon: 46.6753 },
  'Asia/Cairo': { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
  'Asia/Dubai': { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
  'Asia/Tehran': { name: 'Tehran', lat: 35.6892, lon: 51.3890 },
  'Europe/London': { name: 'London', lat: 51.5074, lon: -0.1278 },
  'America/New_York': { name: 'New York', lat: 40.7128, lon: -74.0060 },
  'America/Los_Angeles': { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  'Australia/Sydney': { name: 'Sydney', lat: -33.8688, lon: 151.2093 }
};

function getFallbackLocationByTimezone(timezone: string) {
  // Return matching city or default to Mecca
  return FALLBACK_LOCATIONS[timezone as keyof typeof FALLBACK_LOCATIONS] || 
         { name: 'Mecca', lat: 21.3891, lon: 39.8579 };
}

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
        const response = await fetch('http://ip-api.com/json/', {
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.lat && data.lon) {
            const newLocation: LocationState = {
              latitude: data.lat,
              longitude: data.lon,
              locationName: `${data.city}, ${data.country}`,
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
        // IP-based fallback using free FOSS service
        const response = await fetch('http://ip-api.com/json/', {
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.lat && data.lon) {
            const newLocation: LocationState = {
              latitude: data.lat,
              longitude: data.lon,
              locationName: `${data.city}, ${data.country} (IP)`,
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
        
        // FOSS offline fallback - use major Islamic city based on timezone
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const fallbackLocation = getFallbackLocationByTimezone(userTimezone);
        
        if (fallbackLocation) {
          const newLocation: LocationState = {
            latitude: fallbackLocation.lat,
            longitude: fallbackLocation.lon,
            locationName: `${fallbackLocation.name} (Offline)`,
            timeZone: userTimezone,
            isDetecting: false,
            isIpBased: false,
            lastUpdated: new Date().toISOString()
          };
          
          setLocationState(newLocation);
          saveLocation(newLocation);
          return true;
        }
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
