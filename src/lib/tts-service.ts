import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { detectLanguage } from './pdf-text-extractor';
import { App } from '@capacitor/app';

// TTS State
type TtsState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface TtsCallbacks {
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

interface TtsOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
}

// Supported languages with their TTS language codes
const LANGUAGE_CODES: Record<string, string> = {
  'en': 'en-US',     // English
  'ar': 'ar-SA',     // Arabic
  'ur': 'ur-PK',     // Urdu
  'fa': 'fa-IR',     // Persian/Farsi
  'hi': 'hi-IN',     // Hindi
  'bn': 'bn-BD',     // Bengali
  'fr': 'fr-FR',     // French
  'de': 'de-DE',     // German
  'es': 'es-ES',     // Spanish
  'tr': 'tr-TR',     // Turkish
  'id': 'id-ID',     // Indonesian
  'ms': 'ms-MY',     // Malay
};

// Language names for display
const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'ar': 'Arabic',
  'ur': 'Urdu',
  'fa': 'Persian',
  'hi': 'Hindi',
  'bn': 'Bengali',
  'fr': 'French',
  'de': 'German',
  'es': 'Spanish',
  'tr': 'Turkish',
  'id': 'Indonesian',
  'ms': 'Malay',
};

class TtsService {
  private state: TtsState = 'idle';
  private currentText: string = '';
  private callbacks: TtsCallbacks = {};
  private options: TtsOptions = {};
  private supportedLanguages: string[] = [];
  private isBackgroundMode: boolean = false;
  private audioContext: AudioContext | null = null;
  private resumeOnAppStateChange: boolean = false;
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    try {
      // Get supported languages
      const { languages } = await TextToSpeech.getSupportedLanguages();
      this.supportedLanguages = languages;
      console.log('TTS supported languages:', languages);
      
      // Listen for app state changes for background playback
      App.addListener('appStateChange', ({ isActive }) => {
        this.handleAppStateChange(isActive);
      });
      
      // Initialize audio context for background playback
      this.initAudioContext();
    } catch (error) {
      console.error('TTS initialization error:', error);
    }
  }
  
  private initAudioContext() {
    try {
      // Create audio context to keep audio session active
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported');
    }
  }
  
  private handleAppStateChange(isActive: boolean) {
    if (!isActive && this.state === 'playing') {
      // App going to background
      this.isBackgroundMode = true;
      this.resumeOnAppStateChange = true;
      
      // Keep audio session alive
      this.maintainAudioSession();
    } else if (isActive && this.resumeOnAppStateChange) {
      // App coming to foreground
      this.isBackgroundMode = false;
      this.resumeOnAppStateChange = false;
    }
  }
  
  private maintainAudioSession() {
    // Keep audio session alive for background playback
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  /**
   * Map app language to TTS language code
   */
  private getLanguageCode(preferredLang?: string, text?: string): string {
    // If preferred language is specified, use it
    if (preferredLang) {
      const code = LANGUAGE_CODES[preferredLang];
      if (code) return code;
    }
    
    // Try to detect from text
    if (text) {
      const detected = detectLanguage(text);
      const code = LANGUAGE_CODES[detected];
      if (code) return code;
    }
    
    // Get from app settings/localStorage
    const appLang = localStorage.getItem('app-language') || 'en';
    return LANGUAGE_CODES[appLang] || 'en-US';
  }
  
  /**
   * Find the best voice for a language
   */
  private async findBestVoice(languageCode: string): Promise<string | undefined> {
    try {
      const { voices } = await TextToSpeech.getSupportedVoices();
      
      // Filter voices by language
      const matchingVoices = voices.filter(voice => 
        voice.lang.toLowerCase().startsWith(languageCode.toLowerCase())
      );
      
      if (matchingVoices.length === 0) return undefined;
      
      // Prefer high-quality or enhanced voices
      const enhancedVoice = matchingVoices.find(v => 
        v.name.toLowerCase().includes('enhanced') ||
        v.name.toLowerCase().includes('premium')
      );
      
      if (enhancedVoice) return enhancedVoice.name;
      
      // Return first matching voice
      return matchingVoices[0].name;
    } catch (error) {
      console.error('Error finding voice:', error);
      return undefined;
    }
  }
  
  /**
   * Speak text using TTS
   */
  async speak(
    text: string, 
    options: TtsOptions & TtsCallbacks = {}
  ): Promise<void> {
    try {
      // Extract callbacks
      const { onStart, onComplete, onError, onProgress, ...ttsOptions } = options;
      this.callbacks = { onStart, onComplete, onError, onProgress };
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text to speak');
      }
      
      this.currentText = text;
      this.state = 'loading';
      
      // Get language code
      const languageCode = this.getLanguageCode(ttsOptions.language, text);
      
      // Find best voice
      const voice = ttsOptions.voice || await this.findBestVoice(languageCode);
      
      // Prepare TTS options
      const speakOptions = {
        text: text.slice(0, 4000), // Limit text length for TTS
        lang: languageCode,
        rate: ttsOptions.rate ?? 1.0,
        pitch: ttsOptions.pitch ?? 1.0,
        volume: ttsOptions.volume ?? 1.0,
        voice: voice,
      };
      
      console.log('TTS speaking with options:', speakOptions);
      
      // Notify start
      this.state = 'playing';
      this.callbacks.onStart?.();
      
      // Speak
      await TextToSpeech.speak(speakOptions);
      
      // Notify complete
      this.state = 'idle';
      this.callbacks.onComplete?.();
      
    } catch (error) {
      console.error('TTS speak error:', error);
      this.state = 'error';
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }
  
  /**
   * Stop speaking
   */
  async stop(): Promise<void> {
    try {
      await TextToSpeech.stop();
      this.state = 'idle';
    } catch (error) {
      console.error('TTS stop error:', error);
    }
  }
  
  /**
   * Check if TTS is currently speaking
   */
  isSpeaking(): boolean {
    return this.state === 'playing';
  }
  
  /**
   * Get current state
   */
  getState(): TtsState {
    return this.state;
  }
  
  /**
   * Open TTS settings on the device
   */
  async openSettings(): Promise<void> {
    try {
      await TextToSpeech.openInstall();
    } catch (error) {
      console.error('TTS open settings error:', error);
    }
  }
  
  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return this.supportedLanguages;
  }
  
  /**
   * Check if a language is supported
   */
  isLanguageSupported(langCode: string): boolean {
    const ttsCode = LANGUAGE_CODES[langCode];
    if (!ttsCode) return false;
    return this.supportedLanguages.some(l => 
      l.toLowerCase().startsWith(ttsCode.toLowerCase())
    );
  }
  
  /**
   * Get language name
   */
  getLanguageName(langCode: string): string {
    return LANGUAGE_NAMES[langCode] || langCode;
  }
  
  /**
   * Check if TTS engine is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const { languages } = await TextToSpeech.getSupportedLanguages();
      return languages.length > 0;
    } catch {
      return false;
    }
  }
  
  /**
   * Get default TTS options
   */
  getDefaultOptions(): Required<TtsOptions> {
    return {
      language: 'en',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      voice: '',
    };
  }
}

// Export singleton instance
export const ttsService = new TtsService();

// Audiobook Player for PDFs
export class PdfAudiobookPlayer {
  private tts = ttsService;
  private pdfCacheKey: string = '';
  private currentPage: number = 1;
  private totalPages: number = 0;
  private isPlaying: boolean = false;
  private playbackOptions: TtsOptions = {
    language: 'en',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  };
  private callbacks: {
    onPageChange?: (page: number) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  } = {};
  
  constructor(
    pdfCacheKey: string,
    totalPages: number,
    callbacks: {
      onPageChange?: (page: number) => void;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ) {
    this.pdfCacheKey = pdfCacheKey;
    this.totalPages = totalPages;
    this.callbacks = callbacks;
  }
  
  /**
   * Play audiobook from current page
   */
  async play(startPage?: number): Promise<void> {
    if (typeof startPage === 'number') {
      this.currentPage = startPage;
    }
    
    this.isPlaying = true;
    await this.playCurrentPage();
  }

  setPlaybackOptions(options: TtsOptions): void {
    this.playbackOptions = {
      ...this.playbackOptions,
      ...options
    };
  }
  
  /**
   * Stop audiobook
   */
  async stop(): Promise<void> {
    this.isPlaying = false;
    await this.tts.stop();
  }
  
  /**
   * Pause audiobook (same as stop for TTS)
   */
  async pause(): Promise<void> {
    this.isPlaying = false;
    await this.tts.stop();
  }
  
  /**
   * Play next page
   */
  async nextPage(): Promise<void> {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.callbacks.onPageChange?.(this.currentPage);
      
      if (this.isPlaying) {
        await this.playCurrentPage();
      }
    }
  }
  
  /**
   * Play previous page
   */
  async previousPage(): Promise<void> {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.callbacks.onPageChange?.(this.currentPage);
      
      if (this.isPlaying) {
        await this.playCurrentPage();
      }
    }
  }
  
  /**
   * Go to specific page
   */
  async goToPage(page: number): Promise<void> {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.callbacks.onPageChange?.(this.currentPage);
      
      if (this.isPlaying) {
        await this.playCurrentPage();
      }
    }
  }
  
  private async playCurrentPage(): Promise<void> {
    try {
      // Import dynamically to avoid circular dependency
      const { pdfTextCache } = await import('./pdf-text-extractor');
      
      // Get text from current page
      const text = await pdfTextCache.getText(this.pdfCacheKey, this.currentPage);
      
      if (!text || text.trim().length === 0) {
        // Skip empty pages
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this.callbacks.onPageChange?.(this.currentPage);
          await this.playCurrentPage();
        } else {
          this.isPlaying = false;
          this.callbacks.onComplete?.();
        }
        return;
      }
      
      // Speak the text
      await this.tts.speak(text, {
        ...this.playbackOptions,
        onComplete: () => {
          // Auto-advance to next page
          if (this.isPlaying && this.currentPage < this.totalPages) {
            this.currentPage++;
            this.callbacks.onPageChange?.(this.currentPage);
            void this.playCurrentPage();
          } else if (this.currentPage >= this.totalPages) {
            this.isPlaying = false;
            this.callbacks.onComplete?.();
          }
        },
        onError: (error) => {
          this.callbacks.onError?.(error);
        }
      });
      
    } catch (error) {
      console.error('Error playing page:', error);
      this.callbacks.onError?.(error as Error);
    }
  }
  
  /**
   * Get current playing state
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
  
  /**
   * Get current page
   */
  getCurrentPage(): number {
    return this.currentPage;
  }
  
  /**
   * Get total pages
   */
  getTotalPages(): number {
    return this.totalPages;
  }
}

export default ttsService;
