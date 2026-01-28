/**
 * Quran Radio API Integration
 * Uses MP3Quran.net API for live Quran radio streams
 */

export interface RadioStation {
  id: number;
  name: string;
  url: string;
}

export interface RadioApiResponse {
  radios: RadioStation[];
}

class QuranRadio {
  private readonly API_BASE = 'https://mp3quran.net/api/v3/radios';
  
  // Fetch all available radio stations
  async getRadioStations(language: string = 'ar'): Promise<RadioStation[]> {
    try {
      const url = `${this.API_BASE}?language=${language}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch radio stations: ${response.status}`);
      }
      
      const data: RadioApiResponse = await response.json();
      return data.radios || [];
    } catch (error) {
      console.error('Error fetching radio stations:', error);
      return [];
    }
  }

  // Get radio stations by language
  async getRadioStationsByLanguage(language: string): Promise<RadioStation[]> {
    return this.getRadioStations(language);
  }

  // Get popular radio stations (handpicked selection)
  getPopularStations(): RadioStation[] {
    return [
      {
        id: 10,
        name: "Radio Alzain Mohammad Ahmad",
        url: "https://Qurango.net/radio/alzain_mohammad_ahmad"
      },
      {
        id: 100,
        name: "Radio Ahmad Khader Al-Tarabulsi",
        url: "https://Qurango.net/radio/ahmad_khader_altarabulsi"
      },
      {
        id: 1,
        name: "Radio Abdul Basit Abdus Samad",
        url: "https://Qurango.net/radio/abdul_basit_abdus_samad"
      },
      {
        id: 3,
        name: "Radio Mahmoud Khalil Al-Hussary",
        url: "https://Qurango.net/radio/mahmoud_khalil_al_hussary"
      },
      {
        id: 7,
        name: "Radio Mishary Rashid Al-Afasy",
        url: "https://Qurango.net/radio/mishary_rashid_al_afasy"
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
