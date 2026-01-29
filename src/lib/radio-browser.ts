/**
 * Radio Browser API Integration
 * Uses radio-browser.info API for reliable Islamic radio stations
 */

import { CapacitorHttp } from '@capacitor/core';

export interface RadioStation {
  id: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon?: string;
  country: string;
  language: string;
  tags: string[];
  lastcheckok: number;
  bitrate?: number;
  codec?: string;
}

export interface RadioBrowserResponse {
  stations: RadioStation[];
}

class RadioBrowser {
  private readonly API_BASE = 'https://all.api.radio-browser.info/json/stations';
  
  // Fetch Islamic radio stations with quality filter
  async getIslamicStations(limit: number = 20): Promise<RadioStation[]> {
    try {
      const url = `${this.API_BASE}/search?tag=islamic&limit=${limit * 2}&https=true`;
      const response = await CapacitorHttp.get({ url });
      
      if (response.status !== 200) {
        throw new Error(`Failed to fetch radio stations: ${response.status}`);
      }
      
      const stations: RadioStation[] = response.data;
      
      // Filter for quality stations (lastcheckok == 1)
      const qualityStations = stations.filter(station => station.lastcheckok === 1);
      
      // Remove duplicates by name (keep first occurrence)
      const uniqueStations = this.removeDuplicatesByName(qualityStations);
      
      // Return limited number of unique stations
      return uniqueStations.slice(0, limit);
    } catch (error) {
      console.error('Error fetching radio stations:', error);
      return this.getFallbackStations(); // Fallback to reliable stations
    }
  }

  // Get radio stations by language
  async getStationsByLanguage(language: string, limit: number = 20): Promise<RadioStation[]> {
    try {
      const url = `${this.API_BASE}/search?tag=islamic&language=${language}&limit=${limit * 2}&https=true`;
      const response = await CapacitorHttp.get({ url });
      
      if (response.status !== 200) {
        throw new Error(`Failed to fetch radio stations: ${response.status}`);
      }
      
      const stations: RadioStation[] = response.data;
      
      // Filter for quality stations
      const qualityStations = stations.filter(station => station.lastcheckok === 1);
      
      // Remove duplicates by name (keep first occurrence)
      const uniqueStations = this.removeDuplicatesByName(qualityStations);
      
      // Return limited number of unique stations
      return uniqueStations.slice(0, limit);
    } catch (error) {
      console.error('Error fetching radio stations by language:', error);
      return this.getFallbackStations(); // Fallback to reliable stations
    }
  }

  // Remove duplicate stations by name (case-insensitive)
  private removeDuplicatesByName(stations: RadioStation[]): RadioStation[] {
    const seen = new Set<string>();
    return stations.filter(station => {
      const normalizedName = station.name.toLowerCase().trim();
      if (seen.has(normalizedName)) {
        return false; // Skip duplicate
      }
      seen.add(normalizedName);
      return true; // Keep first occurrence
    });
  }

  // Get popular/reliable Islamic radio stations (fallback)
  getFallbackStations(): RadioStation[] {
    return [
      {
        id: "fallback1",
        name: "Quran Radio - Main",
        url: "https://backup.qurango.net/radio/mix",
        url_resolved: "https://backup.qurango.net/radio/mix",
        country: "International",
        language: "ar",
        tags: ["islamic", "quran"],
        lastcheckok: 1,
        bitrate: 128,
        codec: "mp3"
      },
      {
        id: "fallback2", 
        name: "Islamic Radio - English",
        url: "https://stream.radiojar.com/8smp5vq8z",
        url_resolved: "https://stream.radiojar.com/8smp5vq8z",
        country: "International",
        language: "en",
        tags: ["islamic", "english"],
        lastcheckok: 1,
        bitrate: 128,
        codec: "mp3"
      },
      {
        id: "fallback3",
        name: "Quran Kareem Radio",
        url: "https://qurankareem.radio:8000/",
        url_resolved: "https://qurankareem.radio:8000/",
        country: "International",
        language: "ar",
        tags: ["islamic", "quran"],
        lastcheckok: 1,
        bitrate: 64,
        codec: "mp3"
      }
    ];
  }

  // Get popular stations (highest quality)
  async getPopularStations(): Promise<RadioStation[]> {
    try {
      const stations = await this.getIslamicStations(10);
      
      // Sort by bitrate (higher bitrate = better quality)
      return stations
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting popular stations:', error);
      return this.getFallbackStations();
    }
  }
}

export const radioBrowser = new RadioBrowser();
