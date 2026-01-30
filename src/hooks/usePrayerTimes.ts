/**
 * Prayer Times Hook using Aladhan API with Geolocation
 * Fetches prayer times from https://api.aladhan.com/v1/timings
 * Uses geolocation API with multiple fallbacks and manual search
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
  source: 'geolocation' | 'ip' | 'stored' | 'manual' | 'default';
}

export interface UsePrayerTimesReturn {
  prayerTimes: PrayerTimes | null;
  prayerTimesWithEnd: PrayerTimesWithEnd | null;
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  needsManualLocation: boolean;
  refresh: () => Promise<void>;
  setManualLocation: (city: string, country: string) => Promise<void>;
}

const LOCATION_STORAGE_KEY = 'user-location-data';

// Default fallback locations
const DEFAULT_LOCATIONS = [
  { city: 'Mecca', country: 'Saudi Arabia', latitude: 21.3891, longitude: 39.8579 },
  { city: 'Karachi', country: 'Pakistan', latitude: 24.8607, longitude: 67.0011 },
  { city: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357 },
  { city: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784 },
  { city: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456 }
];

export function usePrayerTimes(): UsePrayerTimesReturn {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [prayerTimesWithEnd, setPrayerTimesWithEnd] = useState<PrayerTimesWithEnd | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsManualLocation, setNeedsManualLocation] = useState(false);
  
  // Add ref to prevent multiple fetches
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
  // Track previous prayer times to prevent unnecessary notification scheduling
  const previousPrayerTimesRef = useRef<string | null>(null);

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

  // Get location from IP-based service (CORS-safe alternative)
  const getLocationFromIP = useCallback(async (): Promise<LocationData> => {
    try {
      console.log('Getting location from IP...');
      
      // Try multiple IP services with CORS-safe approach
      const ipServices = [
        {
          name: 'ip-api.com',
          url: 'http://ip-api.com/json/',
          parser: (data: { lat: number; lon: number; city: string; country: string }) => ({
            latitude: data.lat,
            longitude: data.lon,
            city: data.city,
            country: data.country
          })
        },
        {
          name: 'ipinfo.io',
          url: 'https://ipinfo.io/json',
          parser: (data: { loc: string; city: string; country: string }) => {
            const [lat, lon] = data.loc.split(',').map(Number);
            return {
              latitude: lat,
              longitude: lon,
              city: data.city,
              country: data.country
            };
          }
        }
      ];

      for (const service of ipServices) {
        try {
          console.log(`Trying ${service.name}...`);
          const response = await fetch(service.url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
          });
          
          if (!response.ok) {
            throw new Error(`${service.name} responded with ${response.status}`);
          }
          
          const data = await response.json();
          const locationData = service.parser(data);
          
          if (!locationData.latitude || !locationData.longitude) {
            throw new Error(`${service.name} did not return valid coordinates`);
          }

          const result: LocationData = {
            latitude: parseFloat(locationData.latitude.toString()),
            longitude: parseFloat(locationData.longitude.toString()),
            city: locationData.city,
            country: locationData.country,
            source: 'ip'
          };

          console.log('Location from IP:', result);
          return result;
        } catch (error) {
          console.warn(`${service.name} failed:`, error);
          continue;
        }
      }

      throw new Error('All IP services failed');
    } catch (error) {
      console.error('Failed to get location from IP:', error);
      throw new Error('Could not determine your location automatically.');
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
          reject(new Error('Location access denied.'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3600000 // 1 hour
        }
      );
    });
  }, []);

  // Get default location
  const getDefaultLocation = useCallback((): LocationData => {
    const defaultLoc = DEFAULT_LOCATIONS[0]; // Mecca as primary default
    return {
      latitude: defaultLoc.latitude,
      longitude: defaultLoc.longitude,
      city: defaultLoc.city,
      country: defaultLoc.country,
      source: 'default'
    };
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

  // Set manual location
  const setManualLocation = useCallback(async (city: string, country: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use Aladhan API to get coordinates for the city
      const timings = await AladhanAPI.getTodaysPrayerTimesByCity(city, country, 1);
      
      // For manual location, we'll use approximate coordinates based on the city
      // In a real implementation, you might want a geocoding API here
      const approximateCoords = DEFAULT_LOCATIONS.find(loc => 
        loc.city.toLowerCase() === city.toLowerCase()
      ) || DEFAULT_LOCATIONS[0];

      const locationData: LocationData = {
        latitude: approximateCoords.latitude,
        longitude: approximateCoords.longitude,
        city,
        country,
        source: 'manual'
      };

      saveLocation(locationData);
      await fetchPrayerTimesWithCoordinates(locationData);
      setNeedsManualLocation(false);
    } catch (error) {
      console.error('Failed to set manual location:', error);
      setError('Failed to set location. Please try a different city.');
    } finally {
      setIsLoading(false);
    }
  }, [saveLocation]);

  // Fetch prayer times using coordinates
  const fetchPrayerTimesWithCoordinates = useCallback(async (locationData: LocationData) => {
    try {
      console.log('Fetching prayer times for location:', locationData);
      
      let timings: AladhanPrayerTime;

      if (locationData.city && locationData.country) {
        // Use city-based API for locations with city/country data
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
    } catch (error) {
      console.error('Failed to fetch prayer times:', error);
      setError('Failed to fetch prayer times. Please try again.');
    }
  }, []); // No dependencies - this function is stable

  // Main fetch function
  const fetchPrayerTimes = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);
      setNeedsManualLocation(false);

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

      // Try IP-based location
      try {
        const ipLocation = await getLocationFromIP();
        saveLocation(ipLocation);
        await fetchPrayerTimesWithCoordinates(ipLocation);
        return;
      } catch (ipError) {
        console.warn('IP location failed:', ipError);
      }

      // All auto-detection failed - use default location
      console.log('Using default location (Mecca)');
      const defaultLocation = getDefaultLocation();
      saveLocation(defaultLocation);
      await fetchPrayerTimesWithCoordinates(defaultLocation);
      
    } catch (err) {
      console.error('All location methods failed:', err);
      // Don't show error - instead show manual location option
      setNeedsManualLocation(true);
      setError('Could not determine your location automatically. Please search for your city.');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [getStoredLocation, getLocationFromGeolocation, getLocationFromIP, getDefaultLocation, saveLocation, fetchPrayerTimesWithCoordinates]);

  // Initial fetch - only run once
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchPrayerTimes();
    }
  }, []); // Remove fetchPrayerTimes dependency to prevent re-runs

  // Auto-refresh prayer times every minute when location is available
  useEffect(() => {
    if (!location || needsManualLocation) return;
    
    const interval = setInterval(() => {
      // Only fetch if not already fetching
      if (!isFetchingRef.current) {
        fetchPrayerTimesWithCoordinates(location);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [location?.latitude, location?.longitude, needsManualLocation]); // Remove fetchPrayerTimesWithCoordinates dependency

  // Schedule notifications only when prayer times actually change (deep comparison)
  useEffect(() => {
    if (!prayerTimesWithEnd || !location) return;
    
    // Create deep comparison string to prevent unnecessary notification scheduling
    const prayerTimesString = JSON.stringify({
      fajr: prayerTimesWithEnd.fajr.start,
      dhuhr: prayerTimesWithEnd.dhuhr.start,
      asr: prayerTimesWithEnd.asr.start,
      maghrib: prayerTimesWithEnd.maghrib.start,
      isha: prayerTimesWithEnd.isha.start,
      location: `${location.latitude},${location.longitude}`
    });
    
    // Only schedule if prayer times have actually changed
    if (previousPrayerTimesRef.current !== prayerTimesString) {
      previousPrayerTimesRef.current = prayerTimesString;
      
      // Throttle notification scheduling to prevent rapid calls
      const timeoutId = setTimeout(() => {
        import('@/lib/local-notifications').then(({ localNotifications }) => {
          localNotifications.schedulePrayerNotificationsFromAPI().catch((error) => {
            console.error('Failed to schedule prayer notifications:', error);
          });
        });
      }, 1000); // 1 second throttle
      
      return () => clearTimeout(timeoutId);
    }
  }, [prayerTimesWithEnd?.fajr.start, prayerTimesWithEnd?.dhuhr.start, prayerTimesWithEnd?.asr.start, prayerTimesWithEnd?.maghrib.start, prayerTimesWithEnd?.isha.start, location?.latitude, location?.longitude]); // Use specific properties instead of JSON.stringify

  return {
    prayerTimes,
    prayerTimesWithEnd,
    location,
    isLoading,
    error,
    needsManualLocation,
    refresh: fetchPrayerTimes,
    setManualLocation
  };
}
