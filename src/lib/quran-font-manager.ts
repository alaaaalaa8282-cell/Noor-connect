/**
 * Quran Font Manager
 * Handles Quran font switching with CSS variables and localStorage persistence
 */

export type QuranFont = 'uthmani' | 'indopak' | 'system';

export interface QuranFontOption {
  id: QuranFont;
  name: string;
  description: string;
  fontFamily: string;
  googleFonts?: string[];
}

export const QURAN_FONTS: Record<QuranFont, QuranFontOption> = {
  uthmani: {
    id: 'uthmani',
    name: 'Uthmani',
    description: 'Standard Madinah/Mushaf look',
    fontFamily: "'Amiri', serif",
    googleFonts: ['Amiri']
  },
  indopak: {
    id: 'indopak',
    name: 'Indo-Pak',
    description: 'Common in Pakistan/India',
    fontFamily: "'Lateef', 'Gulzar', serif",
    googleFonts: ['Lateef', 'Gulzar']
  },
  system: {
    id: 'system',
    name: 'System Arabic',
    description: 'Standard digital font',
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', 'Noto Sans Arabic', sans-serif",
    googleFonts: ['Inter']
  }
};

export class QuranFontManager {
  private static instance: QuranFontManager;
  private currentFont: QuranFont = 'uthmani';

  static getInstance(): QuranFontManager {
    if (!QuranFontManager.instance) {
      QuranFontManager.instance = new QuranFontManager();
    }
    return QuranFontManager.instance;
  }

  constructor() {
    this.loadSavedFont();
  }

  /**
   * Load saved font from localStorage
   */
  private loadSavedFont(): void {
    try {
      const saved = localStorage.getItem('quran-font') as QuranFont;
      if (saved && Object.keys(QURAN_FONTS).includes(saved)) {
        this.currentFont = saved;
        this.applyFont(saved);
      }
    } catch (error) {
      console.warn('Failed to load saved Quran font:', error);
    }
  }

  /**
   * Get current font
   */
  getCurrentFont(): QuranFont {
    return this.currentFont;
  }

  /**
   * Get all available fonts
   */
  getAvailableFonts(): QuranFontOption[] {
    return Object.values(QURAN_FONTS);
  }

  /**
   * Set Quran font
   */
  setFont(font: QuranFont): void {
    if (!Object.keys(QURAN_FONTS).includes(font)) {
      console.warn(`Invalid Quran font: ${font}`);
      return;
    }

    this.currentFont = font;
    this.applyFont(font);
    this.saveFont(font);
  }

  /**
   * Apply font to CSS variable
   */
  private applyFont(font: QuranFont): void {
    try {
      const fontOption = QURAN_FONTS[font];
      document.documentElement.style.setProperty('--quran-font', fontOption.fontFamily);
      console.log(`Quran font changed to: ${fontOption.name} (${fontOption.fontFamily})`);
    } catch (error) {
      console.error('Failed to apply Quran font:', error);
    }
  }

  /**
   * Save font to localStorage
   */
  private saveFont(font: QuranFont): void {
    try {
      localStorage.setItem('quran-font', font);
    } catch (error) {
      console.warn('Failed to save Quran font:', error);
    }
  }

  /**
   * Get font option by ID
   */
  getFontOption(font: QuranFont): QuranFontOption {
    return QURAN_FONTS[font];
  }

  /**
   * Check if a font is already loaded in the document
   */
  private isFontLoaded(fontName: string): boolean {
    const existingLinks = document.querySelectorAll('link[rel="stylesheet"]');
    return Array.from(existingLinks).some(link => 
      (link as HTMLLinkElement).href && (link as HTMLLinkElement).href.includes(`family=${encodeURIComponent(fontName)}`)
    );
  }

  /**
   * Load Google Fonts for a specific font
   */
  async loadGoogleFonts(font: QuranFont): Promise<void> {
    const fontOption = QURAN_FONTS[font];
    if (!fontOption.googleFonts || fontOption.googleFonts.length === 0) {
      return;
    }

    try {
      // Create link elements for each font, but only if not already loaded
      const fontPromises = fontOption.googleFonts.map(fontName => {
        // Skip if font is already loaded
        if (this.isFontLoaded(fontName)) {
          console.log(`Font ${fontName} already loaded, skipping...`);
          return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;700&display=swap`;
          link.onload = () => resolve();
          link.onerror = () => reject(new Error(`Failed to load font: ${fontName}`));
          document.head.appendChild(link);
        });
      });

      await Promise.all(fontPromises);
      console.log(`Loaded Google fonts for ${fontOption.name}`);
    } catch (error) {
      console.warn(`Failed to load Google fonts for ${fontOption.name}:`, error);
    }
  }

  /**
   * Initialize fonts on app start
   */
  async initialize(): Promise<void> {
    // Load Google Fonts for current font
    await this.loadGoogleFonts(this.currentFont);
    
    // Preload other fonts in background
    const otherFonts = Object.keys(QURAN_FONTS).filter(f => f !== this.currentFont) as QuranFont[];
    for (const font of otherFonts) {
      this.loadGoogleFonts(font).catch(() => {
        // Silently fail for background loading
      });
    }
  }
}

// Export singleton instance
export const quranFontManager = QuranFontManager.getInstance();
