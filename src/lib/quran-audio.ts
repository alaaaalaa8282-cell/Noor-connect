// Quran Audio Service using verified audio URLs
// Professional audio recitations with rich metadata
// Multiple reciters, chapter and verse-level audio
// Based on verified working URLs from download.quranicaudio.com

export interface Reciter {
  id: number;
  name: string;
  arabicName?: string;
  recitationId: number;
}

export interface ChapterRecitation {
  id: number;
  chapterId: number;
  reciterId: number;
  reciterName: string;
  reciterNameArabic: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
  format: string;
}

export interface VerseRecitation {
  id: number;
  verseKey: string;
  url: string;
  duration: number;
  segments?: Array<{
    timestamp: number;
    verseNumber: number;
  }>;
  format?: string;
}

export interface SurahAudio {
  sequence: number;
  ayahCount: number;
  type: {
    arabic: string;
    latin: string;
  };
  name: {
    arabic: {
      long: string;
      short: string;
    };
    latin: {
      long: string;
      short: string;
    };
  };
  translation: string;
  tafsir: string | null;
  recitation: ChapterRecitation;
}

export interface QuranAudioResponse {
  success: boolean;
  message: string;
  data: SurahAudio;
}

export interface RecitationsResponse {
  recitations: ChapterRecitation[];
}

export interface VerseRecitationsResponse {
  audioFiles: VerseRecitation[];
  pagination?: {
    total: number;
    limit: number;
    page: number;
  };
}

// Verified working audio URLs from download.quranicaudio.com
export const QURAN_AUDIO_API = {
  BASE_URL: 'https://staticquran.vercel.app/api/v1',
  
  // Verified working reciter mappings from testing
  RECITER_AUDIO_MAP: {
    1: { 
      name: 'Abdul Basit', 
      url: 'https://download.quranicaudio.com/qdc/abdul_baset/mujawwad',
      requiresZeroPadding: false 
    },
    3: { 
      name: 'Abdurrahman Sudais', 
      url: 'https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal',
      requiresZeroPadding: false 
    },
    5: { 
      name: 'Hani Ar-Rifai', 
      url: 'https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal',
      requiresZeroPadding: false 
    },
    7: { 
      name: 'Mishary Alafasy', 
      url: 'https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal',
      requiresZeroPadding: false 
    },
    8: { 
      name: 'Khalil Al-Husary', 
      url: 'https://download.quranicaudio.com/qdc/khalil_al_husary/murattal',
      requiresZeroPadding: false 
    },
    9: { 
      name: 'Minshawi', 
      url: 'https://download.quranicaudio.com/qdc/siddiq_minshawi/murattal',
      requiresZeroPadding: false 
    },
    10: { 
      name: 'Abdul Muhsin Al-Qasim', 
      url: 'https://download.quranicaudio.com/quran/abdul_muhsin_alqasim',
      requiresZeroPadding: true 
    },
    11: { 
      name: 'Khalil Al-Husary (Muallim)', 
      url: 'https://download.quranicaudio.com/qdc/khalil_al_husary/muallim',
      requiresZeroPadding: false 
    }
  },

  /**
   * Get Surah audio with recitation data using verified URLs
   * @param chapterId - Chapter number (1-114)
   * @param recitationId - Recitation ID (1-11)
   * @returns Promise with Surah audio data
   */
  async getSurahAudio(chapterId: number, recitationId: number): Promise<QuranAudioResponse> {
    try {
      // Get chapter info from rzkytmgr/quran-api (for metadata)
      const metadataResponse = await fetch(`${this.BASE_URL}/surah/${chapterId}`);
      const metadata = await metadataResponse.json();
      
      if (!metadata.success) {
        throw new Error('Failed to fetch chapter metadata');
      }
      
      // Get reciter-specific audio URL
      const reciterInfo = this.RECITER_AUDIO_MAP[recitationId];
      if (!reciterInfo) {
        throw new Error(`Reciter ${recitationId} not found`);
      }
      
      // Generate reciter-specific audio URL
      let audioUrl: string;
      if (reciterInfo.requiresZeroPadding) {
        // For reciters that require zero-padding (e.g., Abdul Muhsin Al-Qasim)
        const paddedChapter = chapterId.toString().padStart(3, '0');
        audioUrl = `${reciterInfo.url}/${paddedChapter}.mp3`;
      } else {
        // For reciters that use simple numbering
        audioUrl = `${reciterInfo.url}/${chapterId}.mp3`;
      }
      
      console.log(`Generated reciter-specific audio URL: ${audioUrl}`);
      
      // Create recitation object with reciter-specific audio URL
      const recitation: ChapterRecitation = {
        id: recitationId,
        chapterId: chapterId,
        reciterId: recitationId,
        reciterName: reciterInfo.name,
        reciterNameArabic: '',
        audioUrl: audioUrl,
        duration: 0,
        fileSize: 0,
        format: 'mp3'
      };
      
      // Combine recitation data with metadata
      const surahAudio: SurahAudio = {
        ...metadata.data,
        recitation: recitation
      };
      
      console.log(`Surah audio for chapter ${chapterId}, recitation ${recitationId}:`, surahAudio);
      
      return {
        success: true,
        message: 'Surah audio retrieved successfully',
        data: surahAudio
      };
    } catch (error) {
      console.error('Error fetching Surah audio:', error);
      throw error;
    }
  },
  
  /**
   * Get available reciters from verified mapping
   * @returns Promise with reciters list
   */
  async getReciters(): Promise<any> {
    try {
      // Convert RECITER_AUDIO_MAP to reciter array
      const reciters = Object.entries(this.RECITER_AUDIO_MAP).map(([id, info]: [string, { name: string, url: string, requiresZeroPadding: boolean }]) => ({
        id: parseInt(id),
        recitationId: parseInt(id),
        name: info.name,
        arabicName: '',
        url: info.url,
        requiresZeroPadding: info.requiresZeroPadding
      }));
      
      console.log('Reciters loaded:', reciters);
      
      return {
        success: true,
        message: 'Reciters retrieved successfully',
        data: reciters
      };
    } catch (error) {
      console.error('Error fetching reciters:', error);
      throw error;
    }
  },
  
  /**
   * Get Surah list with basic info
   * @returns Promise with Surah information
   */
  async getSurahList(): Promise<any> {
    try {
      // Use rzkytmgr/quran-api for Surah metadata
      const response = await fetch('https://staticquran.vercel.app/api/v1/surah');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'API request failed');
      }
      
      console.log('Surah list loaded:', apiResponse.data);
      return apiResponse;
    } catch (error) {
      console.error('Error fetching Surah list:', error);
      throw error;
    }
  },
  
  /**
   * Get reciter by ID
   * @param reciterId - Reciter identifier
   * @returns Reciter object or null
   */
  async getReciterById(reciterId: number): Promise<Reciter | null> {
    try {
      const response = await this.getReciters();
      const reciters = response.data;
      return reciters.find((reciter: Reciter) => reciter.id === reciterId) || null;
    } catch (error) {
      console.error('Error getting reciter by ID:', error);
      return null;
    }
  },
  
  /**
   * Get Surah info by number
   * @param surahNumber - Surah number
   * @returns Surah info object or null
   */
  async getSurahInfo(surahNumber: number): Promise<any> {
    try {
      const response = await this.getSurahList();
      const surahs = response.data;
      return surahs.find((surah: any) => surah.sequence === surahNumber) || null;
    } catch (error) {
      console.error('Error getting Surah info:', error);
      return null;
    }
  },
  
  /**
   * Get default reciter (first available reciter)
   * @returns Default reciter object
   */
  async getDefaultReciter(): Promise<Reciter> {
    try {
      const response = await this.getReciters();
      const reciters = response.data;
      return reciters[0] || { id: 1, name: 'Default Reciter', recitationId: 1 };
    } catch (error) {
      console.error('Error getting default reciter:', error);
      // Fallback to a basic reciter object
      return { id: 1, name: 'Default Reciter', recitationId: 1 };
    }
  },
  
  /**
   * Test if a reciter's audio URL is working
   * @param reciterId - Reciter ID to test
   * @returns Promise with test result
   */
  async testReciterAudio(reciterId: number): Promise<{working: boolean, url: string, error?: string}> {
    try {
      const reciterInfo = this.RECITER_AUDIO_MAP[reciterId];
      if (!reciterInfo) {
        return { working: false, url: '', error: `Reciter ${reciterId} not found` };
      }
      
      // Test with Surah 1 (Al-Fatiha)
      const chapterId = 1;
      let testUrl: string;
      
      if (reciterInfo.requiresZeroPadding) {
        const paddedChapter = chapterId.toString().padStart(3, '0');
        testUrl = `${reciterInfo.url}/${paddedChapter}.mp3`;
      } else {
        testUrl = `${reciterInfo.url}/${chapterId}.mp3`;
      }
      
      const response = await fetch(testUrl, { method: 'HEAD' });
      
      return {
        working: response.ok,
        url: testUrl,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        working: false,
        url: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
