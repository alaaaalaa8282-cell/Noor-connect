/**
 * Quran Radio API Integration
 * Uses MP3Quran.net API for live Quran radio streams
 */

export interface RadioStation {
  id: string;
  name: string;
  url: string;
  language?: string;
  bitrate?: string;
  country?: string;
}

export interface RadioApiResponse {
  Radios: RadioStation[];
}

class QuranRadio {
  private readonly API_BASE = 'https://www.mp3quran.net/api/radio';
  
  // Fetch all available radio stations
  async getRadioStations(language: string = 'en'): Promise<RadioStation[]> {
    try {
      const url = `${this.API_BASE}/radio_${language}.json`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch radio stations: ${response.status}`);
      }
      
      const data: RadioApiResponse = await response.json();
      return data.Radios || [];
    } catch (error) {
      console.error('Error fetching radio stations:', error);
      return this.getPopularStations(); // Fallback to popular stations
    }
  }

  // Get radio stations by language
  async getRadioStationsByLanguage(language: string): Promise<RadioStation[]> {
    return this.getRadioStations(language);
  }

  // Get popular radio stations (handpicked selection from API)
  getPopularStations(): RadioStation[] {
    return [
      {
        id: "108",
        name: "-Main Radio-",
        url: "https://backup.qurango.net/radio/mix",
        language: 'Arabic',
        bitrate: '128kbps',
        country: 'Global'
      },
      {
        id: "109",
        name: "-Beautiful Recitations-",
        url: "https://backup.qurango.net/radio/salma",
        language: 'Arabic',
        bitrate: '128kbps',
        country: 'Global'
      },
      {
        id: "115",
        name: "-Surah Al-Baqarah - Many Reciters",
        url: "https://backup.qurango.net/radio/albaqarah"
      },
      {
        id: "32",
        name: "Abdulbasit Abdulsamad",
        url: "https://backup.qurango.net/radio/abdulbasit_abdulsamad"
      },
      {
        id: "38",
        name: "Abdullah Al-Johany",
        url: "https://backup.qurango.net/radio/abdullah_aljohany"
      },
      {
        id: "30",
        name: "Abdulbasit Abdulsamad (Mojawwad)",
        url: "https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad"
      }
    ];
  }

  // Validate radio URL
  isValidRadioUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch {
      return false;
    }
  }

  // Get stream quality info
  getStreamInfo(url: string): { bitrate?: string; format?: string } {
    // Most MP3Quran streams are MP3 format
    if (url.includes('.mp3') || url.includes('radio')) {
      return { format: 'MP3', bitrate: '128kbps' };
    }
    return { format: 'Unknown', bitrate: 'Unknown' };
  }
}

export const quranRadio = new QuranRadio();
