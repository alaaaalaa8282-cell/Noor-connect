import { Capacitor } from '@capacitor/core';
import { SpeechSynthesis } from '@capgo/capacitor-speech-synthesis';

export interface TTSVoice {
  name: string;
  language: string;
  gender?: 'male' | 'female';
}

export interface TTSOptions {
  text: string;
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: TTSVoice;
}

export interface VoiceCheckResult {
  hasVoice: boolean;
  language: string;
  recommendedVoices: TTSVoice[];
  downloadLinks: VoiceDownloadLink[];
}

export interface VoiceDownloadLink {
  name: string;
  url: string;
  description: string;
  isDirect?: boolean;
}

export class TTSEngine {
  private static instance: TTSEngine;
  private isInitialized = false;
  private availableVoices: TTSVoice[] = [];
  private currentLanguage = 'en';
  private preferredVoice: TTSVoice | null = null;

  private constructor() {}

  static getInstance(): TTSEngine {
    if (!TTSEngine.instance) {
      TTSEngine.instance = new TTSEngine();
    }
    return TTSEngine.instance;
  }

  async initialize(language: string = 'en'): Promise<void> {
    if (this.isInitialized && this.currentLanguage === language) {
      return;
    }

    this.currentLanguage = language;

    try {
      // Initialize Capacitor Speech Synthesis
      if (Capacitor.isNativePlatform()) {
        await SpeechSynthesis.initialize();
      }

      // Get available voices
      await this.loadAvailableVoices();
      
      // Set preferred voice based on language
      this.setPreferredVoiceForLanguage(language);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize TTS:', error);
      throw error;
    }
  }

  private async loadAvailableVoices(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { voices } = await SpeechSynthesis.getVoices();
        this.availableVoices = voices.map(voice => ({
          name: voice.name,
          language: voice.language,
          gender: voice.gender
        }));
      } else {
        // Fallback to Web Speech API for web
        if ('speechSynthesis' in window) {
          const loadVoices = () => {
            const voices = speechSynthesis.getVoices();
            this.availableVoices = voices.map(voice => ({
              name: voice.name,
              language: voice.lang,
              gender: this.detectGender(voice.name)
            }));
          };

          if (speechSynthesis.getVoices().length > 0) {
            loadVoices();
          } else {
            return new Promise((resolve) => {
              speechSynthesis.onvoiceschanged = () => {
                loadVoices();
                resolve();
              };
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  }

  private detectGender(voiceName: string): 'male' | 'female' | undefined {
    const name = voiceName.toLowerCase();
    if (name.includes('female') || name.includes('woman') || name.includes('zira') || name.includes('samantha')) {
      return 'female';
    }
    if (name.includes('male') || name.includes('man') || name.includes('david') || name.includes('alex')) {
      return 'male';
    }
    return undefined;
  }

  private mapLanguageToLocale(language: string): string {
    const normalized = language.toLowerCase();
    const localeMap: Record<string, string> = {
      en: 'en-US',
      ar: 'ar-SA',
      ur: 'ur-PK',
      tr: 'tr-TR',
      id: 'id-ID',
      hi: 'hi-IN',
      fa: 'fa-IR'
    };

    // If caller already provided a locale (e.g. en-US), keep it.
    if (normalized.includes('-')) {
      return language;
    }

    return localeMap[normalized] || language;
  }

  private getPrimaryLanguageCode(language: string): string {
    const normalized = language.toLowerCase();
    return normalized.includes('-') ? normalized.split('-')[0] : normalized;
  }

  private voiceMatchesLanguage(voice: TTSVoice, language: string): boolean {
    const target = this.getPrimaryLanguageCode(language);
    const voicePrimary = this.getPrimaryLanguageCode(voice.language);
    const voiceName = voice.name.toLowerCase();

    return (
      voicePrimary === target ||
      voice.language.toLowerCase().includes(target) ||
      voiceName.includes(target)
    );
  }

  private setPreferredVoiceForLanguage(language: string): void {
    const languageCode = this.getPrimaryLanguageCode(language);
    
    if (languageCode === 'ur') {
      // Prefer Urdu voices
      const urduVoice = this.availableVoices.find(voice => 
        voice.language.toLowerCase().includes('ur') || 
        voice.name.toLowerCase().includes('urdu')
      );
      
      if (urduVoice) {
        this.preferredVoice = urduVoice;
      } else {
        // Fallback to Hindi voices for Urdu
        const hindiVoice = this.availableVoices.find(voice => 
          voice.language.toLowerCase().includes('hi') || 
          voice.name.toLowerCase().includes('hindi')
        );
        this.preferredVoice = hindiVoice || null;
      }
    } else if (languageCode === 'tr') {
      // Prefer Turkish voices
      const turkishVoice = this.availableVoices.find(voice => 
        voice.language.toLowerCase().includes('tr') || 
        voice.name.toLowerCase().includes('turkish')
      );
      this.preferredVoice = turkishVoice || null;
    } else if (languageCode === 'ar') {
      const arabicVoice = this.availableVoices.find(voice =>
        voice.language.toLowerCase().includes('ar') ||
        voice.name.toLowerCase().includes('arabic')
      );
      this.preferredVoice = arabicVoice || null;
    } else if (languageCode === 'id') {
      const indonesianVoice = this.availableVoices.find(voice =>
        voice.language.toLowerCase().includes('id') ||
        voice.name.toLowerCase().includes('indonesian')
      );
      this.preferredVoice = indonesianVoice || null;
    } else {
      // Default to English voices
      const englishVoice = this.availableVoices.find(voice => 
        voice.language.toLowerCase().startsWith('en')
      );
      this.preferredVoice = englishVoice || null;
    }
  }

  async checkVoiceAvailability(language: string): Promise<VoiceCheckResult> {
    const languageCode = this.getPrimaryLanguageCode(language);
    
    // Check for direct language matches
    const directMatches = this.availableVoices.filter(voice => 
      this.voiceMatchesLanguage(voice, languageCode)
    );

    // Check for fallback languages
    let fallbackMatches: TTSVoice[] = [];
    if (languageCode === 'ur') {
      fallbackMatches = this.availableVoices.filter(voice => 
        voice.language.toLowerCase().includes('hi') || 
        voice.name.toLowerCase().includes('hindi')
      );
    }

    const allMatches = [...directMatches, ...fallbackMatches];
    const hasVoice = allMatches.length > 0;

    return {
      hasVoice,
      language: languageCode,
      recommendedVoices: allMatches,
      downloadLinks: this.getDownloadLinks(languageCode)
    };
  }

  private getDownloadLinks(languageCode: string): VoiceDownloadLink[] {
    const links: VoiceDownloadLink[] = [];

    // Google Text-to-Speech (primary recommendation)
    links.push({
      name: 'Google Text-to-Speech',
      url: 'https://play.google.com/store/apps/details?id=com.google.android.tts',
      description: 'Official Google TTS engine with high-quality voices',
      isDirect: true
    });

    // Language-specific recommendations
    if (languageCode === 'ur') {
      links.push({
        name: 'Urdu Text To Speech',
        url: 'https://play.google.com/store/apps/details?id=com.lucidsws.readaloudurdu',
        description: 'Dedicated Urdu TTS app with natural voice',
        isDirect: true
      });
      
      links.push({
        name: 'Android TTS Settings Guide',
        url: 'https://support.google.com/accessibility/android/answer/6006983?hl=en',
        description: 'Step-by-step guide to install voice data',
        isDirect: false
      });
    } else if (languageCode === 'tr') {
      links.push({
        name: 'RHVoice Turkish',
        url: 'https://play.google.com/store/apps/details?id=com.github.olga_yakovleva.rhvoice.android',
        description: 'Free open-source TTS with Turkish support',
        isDirect: true
      });
    }

    // General alternatives
    links.push({
      name: 'RHVoice (Multi-language)',
      url: 'https://f-droid.org/packages/com.github.olga_yakovleva.rhvoice.android/',
      description: 'Free open-source TTS with extended language support',
      isDirect: false
    });

    return links;
  }

  async speak(options: TTSOptions): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize(this.currentLanguage);
    }

    const {
      text,
      language = this.currentLanguage,
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0,
      voice = this.preferredVoice || undefined
    } = options;
    const localeLanguage = this.mapLanguageToLocale(language);

    try {
      if (Capacitor.isNativePlatform()) {
        await SpeechSynthesis.speak({
          text,
          language: localeLanguage,
          rate,
          pitch,
          volume,
          voice: voice?.name
        });
      } else {
        // Fallback to Web Speech API
        if ('speechSynthesis' in window) {
          // Cancel any ongoing speech
          speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = rate;
          utterance.pitch = pitch;
          utterance.volume = volume;
          utterance.lang = localeLanguage;

          if (voice) {
            const webVoice = speechSynthesis.getVoices().find(v => v.name === voice.name);
            if (webVoice) {
              utterance.voice = webVoice;
            }
          }

          return new Promise((resolve, reject) => {
            utterance.onend = () => resolve();
            utterance.onerror = (event) => reject(new Error(`Speech error: ${event.error}`));
            speechSynthesis.speak(utterance);
          });
        } else {
          throw new Error('Speech synthesis not supported');
        }
      }
    } catch (error) {
      console.error('TTS speak error:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await SpeechSynthesis.stop();
      } else {
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel();
        }
      }
    } catch (error) {
      console.error('TTS stop error:', error);
    }
  }

  async pause(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await SpeechSynthesis.pause();
      } else {
        if ('speechSynthesis' in window) {
          speechSynthesis.pause();
        }
      }
    } catch (error) {
      console.error('TTS pause error:', error);
    }
  }

  async resume(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await SpeechSynthesis.resume();
      } else {
        if ('speechSynthesis' in window) {
          speechSynthesis.resume();
        }
      }
    } catch (error) {
      console.error('TTS resume error:', error);
    }
  }

  getAvailableVoices(): TTSVoice[] {
    return this.availableVoices;
  }

  getPreferredVoice(): TTSVoice | null {
    return this.preferredVoice;
  }

  setPreferredVoice(voice: TTSVoice): void {
    this.preferredVoice = voice;
  }

  async isSpeaking(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { speaking } = await SpeechSynthesis.isSpeaking();
        return speaking;
      } else {
        if ('speechSynthesis' in window) {
          return speechSynthesis.speaking;
        }
        return false;
      }
    } catch (error) {
      console.error('TTS isSpeaking error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const ttsEngine = TTSEngine.getInstance();
