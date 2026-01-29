/**
 * Radio Browser API Integration
 * Uses radio-browser.info API for reliable Islamic radio stations
 */

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
  private readonly API_BASE = 'https://at1.api.radio-browser.info/json/stations';
  
  // Fetch Islamic radio stations with quality filter
  async getIslamicStations(limit: number = 20): Promise<RadioStation[]> {
    try {
      const url = `${this.API_BASE}/search?tag=islamic&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch radio stations: ${response.status}`);
      }
      
      const stations: RadioStation[] = await response.json();
      
      // Filter for quality stations (lastcheckok == 1)
      const qualityStations = stations.filter(station => station.lastcheckok === 1);
      
      return qualityStations;
    } catch (error) {
      console.error('Error fetching radio stations:', error);
      return this.getFallbackStations(); // Fallback to reliable stations
    }
  }

  // Get radio stations by language
  async getStationsByLanguage(language: string, limit: number = 20): Promise<RadioStation[]> {
    try {
      const url = `${this.API_BASE}/search?tag=islamic&language=${language}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch radio stations: ${response.status}`);
      }
      
      const stations: RadioStation[] = await response.json();
      
      // Filter for quality stations
      const qualityStations = stations.filter(station => station.lastcheckok === 1);
      
      return qualityStations;
    } catch (error) {
      console.error('Error fetching radio stations by language:', error);
      return this.getFallbackStations(); // Fallback to reliable stations
    }
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
        url: "http://stream.radiojar.com/8smp5vq8z",
        url_resolved: "http://stream.radiojar.com/8smp5vq8z",
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
        url: "http://qurankareem.radio:8000/",
        url_resolved: "http://qurankareem.radio:8000/",
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

  // Validate stream URL
  async validateStream(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Stream validation failed:', error);
      return false;
    }
  }
}

export const radioBrowser = new RadioBrowser();
