/**
 * Global Location State Management
 * Centralized location handling with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';

export interface LocationState {
  latitude: number;
  longitude: number;
  locationName: string;
  isDetecting: boolean;
  lastUpdated: string;
}

const DEFAULT_LOCATION: LocationState = {
  latitude: 24.8607, // Karachi
  longitude: 67.0011, // Karachi
  locationName: 'Karachi, Pakistan',
  isDetecting: false,
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
      lastUpdated: location.lastUpdated
    }));
  } catch (error) {
    console.error('Failed to save location to storage:', error);
  }
};

// Global location state hook
export const useLocationState = () => {
  const [location, setLocationState] = useState<LocationState>(loadStoredLocation);

  const setLocation = useCallback((lat: number, lng: number, name?: string) => {
    const newLocation: LocationState = {
      ...location,
      latitude: lat,
      longitude: lng,
      locationName: name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lastUpdated: new Date().toISOString()
    };
    setLocationState(newLocation);
    saveLocation(newLocation);
  }, [location]);

  const detectLocation = useCallback(async (): Promise<boolean> => {
    if (location.isDetecting) {
      return false;
    }

    setLocationState(prev => ({ ...prev, isDetecting: true }));

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Get location name using reverse geocoding (optional)
      let locationName = 'Current Location';
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          { headers: { 'User-Agent': 'IslamicCompanion/1.0' } }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.display_name) {
            locationName = data.display_name.split(',').slice(0, 2).join(', ');
          }
        }
      } catch {
        // Keep default name if geocoding fails
      }

      const newLocation: LocationState = {
        latitude,
        longitude,
        locationName,
        isDetecting: false,
        lastUpdated: new Date().toISOString()
      };

      setLocationState(newLocation);
      saveLocation(newLocation);
      return true;
    } catch (error) {
      console.error('Location detection failed:', error);
      setLocationState(prev => ({ ...prev, isDetecting: false }));
      return false;
    }
  }, [location.isDetecting]);

  const resetToDefault = useCallback(() => {
    const newLocation = { ...DEFAULT_LOCATION };
    setLocationState(newLocation);
    saveLocation(newLocation);
  }, []);

  return {
    ...location,
    setLocation,
    detectLocation,
    resetToDefault,
    coordinates: {
      lat: location.latitude,
      lng: location.longitude
    }
  };
};
