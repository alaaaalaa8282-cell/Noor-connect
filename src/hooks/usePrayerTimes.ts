/**
 * Prayer Times Hook using Aladhan API with Geolocation
 * Fetches prayer times from https://api.aladhan.com/v1/timings
 * Uses geolocation API with IP-based fallback
 */

import { useState, useEffect, useCallback } from 'react';
import { AladhanAPI, type AladhanPrayerTime } from '@/lib/aladhan-api';

export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  midnight: Date;
}

export interface PrayerTimesWithEnd {
  fajr: { start: Date; end: Date };
  sunrise: { start: Date; end: Date };
  dhuhr: { start: Date; end: Date };
  asr: { start: Date; end: Date };
  maghrib: { start: Date; end: Date };
  isha: { start: Date; end: Date };
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  source: 'geolocation' | 'ip' | 'stored';
}

export interface UsePrayerTimesReturn {
  prayerTimes: PrayerTimes | null;
  prayerTimesWithEnd: PrayerTimesWithEnd | null;
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const LOCATION_STORAGE_KEY = 'user-location-data';

export function usePrayerTimes(): UsePrayerTimesReturn {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [prayerTimesWithEnd, setPrayerTimesWithEnd] = useState<PrayerTimesWithEnd | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse time string to Date object
  const parseTimeToDate = useCallback((timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }, []);

  // Calculate end times based on API data
  const calculateEndTimes = useCallback((times: PrayerTimes): PrayerTimesWithEnd => {
    return {
      fajr: {
        start: times.fajr,
        end: times.sunrise // Fajr ends at sunrise
      },
      sunrise: {
        start: times.sunrise,
        end: times.dhuhr // Sunrise ends at Dhuhr
      },
      dhuhr: {
        start: times.dhuhr,
        end: times.asr // Dhuhr ends at Asr
      },
      asr: {
        start: times.asr,
        end: times.maghrib // Asr ends at Maghrib
      },
      maghrib: {
        start: times.maghrib,
        end: times.isha // Maghrib ends at Isha
      },
      isha: {
        start: times.isha,
        end: times.midnight // Isha ends at Midnight (recommended end)
      }
    };
  }, []);

  // Get location from IP-based service
  const getLocationFromIP = useCallback(async (): Promise<LocationData> => {
    try {
      console.log('Getting location from IP...');
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
        throw new Error(`IP API responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.latitude || !data.longitude) {
        throw new Error('IP API did not return valid coordinates');
      }

      const locationData: LocationData = {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        city: data.city,
        country: data.country_name,
        source: 'ip'
      };

      console.log('Location from IP:', locationData);
      return locationData;
    } catch (error) {
      console.error('Failed to get location from IP:', error);
      throw new Error('Could not determine your location. Please enable location services.');
    }
  }, []);

  // Get location from geolocation API
  const getLocationFromGeolocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      console.log('Getting location from geolocation...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            source: 'geolocation'
          };

          console.log('Location from geolocation:', locationData);
          resolve(locationData);
        },
        (error) => {
          console.warn('Geolocation failed:', error);
          reject(new Error('Location access denied. Using IP-based location instead.'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3600000 // 1 hour
        }
      );
    });
  }, []);

  // Get stored location from localStorage
  const getStoredLocation = useCallback((): LocationData | null => {
    try {
      const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) {
        const locationData = JSON.parse(stored);
        // Check if stored location is recent (less than 24 hours)
        const storedTime = new Date(locationData.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - storedTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          console.log('Using stored location:', locationData);
          return locationData;
        }
      }
    } catch (error) {
      console.warn('Failed to parse stored location:', error);
    }
    return null;
  }, []);

  // Save location to localStorage
  const saveLocation = useCallback((locationData: LocationData) => {
    try {
      const dataToStore = {
        ...locationData,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(dataToStore));
      console.log('Location saved to localStorage:', dataToStore);
    } catch (error) {
      console.warn('Failed to save location to localStorage:', error);
    }
  }, []);

  // Fetch prayer times using coordinates
  const fetchPrayerTimesWithCoordinates = useCallback(async (locationData: LocationData) => {
    try {
      console.log('Fetching prayer times for location:', locationData);
      
      let timings: AladhanPrayerTime;

      if (locationData.source === 'ip' && locationData.city && locationData.country) {
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

      // Convert API times to Date objects
      const times: PrayerTimes = {
        fajr: parseTimeToDate(timings.Fajr),
        sunrise: parseTimeToDate(timings.Sunrise),
        dhuhr: parseTimeToDate(timings.Dhuhr),
        asr: parseTimeToDate(timings.Asr),
        maghrib: parseTimeToDate(timings.Maghrib),
        isha: parseTimeToDate(timings.Isha),
        midnight: parseTimeToDate(timings.Midnight)
      };

      // Calculate end times
      const withEnd = calculateEndTimes(times);

      setPrayerTimes(times);
      setPrayerTimesWithEnd(withEnd);
      setLocation(locationData);
      setError(null);
      
    } catch (err) {
      console.error('Failed to fetch prayer times:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prayer times');
      throw err;
    }
  }, [parseTimeToDate, calculateEndTimes]);

  // Main fetch function
  const fetchPrayerTimes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get stored location first
      const storedLocation = getStoredLocation();
      if (storedLocation) {
        await fetchPrayerTimesWithCoordinates(storedLocation);
        return;
      }

      // Try geolocation first
      try {
        const geoLocation = await getLocationFromGeolocation();
        saveLocation(geoLocation);
        await fetchPrayerTimesWithCoordinates(geoLocation);
        return;
      } catch (geoError) {
        console.warn('Geolocation failed, trying IP-based location:', geoError);
      }

      // Fallback to IP-based location
      const ipLocation = await getLocationFromIP();
      saveLocation(ipLocation);
      await fetchPrayerTimesWithCoordinates(ipLocation);
      
    } catch (err) {
      console.error('All location methods failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to determine location and prayer times');
    } finally {
      setIsLoading(false);
    }
  }, [getStoredLocation, getLocationFromGeolocation, getLocationFromIP, saveLocation, fetchPrayerTimesWithCoordinates]);

  // Initial fetch
  useEffect(() => {
    fetchPrayerTimes();
  }, [fetchPrayerTimes]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (location) {
        fetchPrayerTimesWithCoordinates(location);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [location, fetchPrayerTimesWithCoordinates]);

  return {
    prayerTimes,
    prayerTimesWithEnd,
    location,
    isLoading,
    error,
    refresh: fetchPrayerTimes
  };
}
