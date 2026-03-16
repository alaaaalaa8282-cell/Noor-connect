import { useEffect } from "react";

// Google Fonts URL for Amiri Quran font
const AMIRI_QURAN_FONT_URL = "https://fonts.googleapis.com/css2?family=Amiri+Quran:wght@400;700&display=swap";

export class ArabicFontLoader {
  private static readonly AMIRI_FONT_NAME = "Amiri Quran";
  private static readonly FALLBACK_FONTS = [
    "Noto Sans Arabic",
    "Arial Unicode MS",
    "Tahoma"
  ];

  /**
   * Load Amiri Quran font from Google Fonts
   */
  static async loadAmiriFont(): Promise<void> {
    try {
      // Create link element
      const link = document.createElement('link');
      link.href = AMIRI_QURAN_FONT_URL;
      link.rel = 'stylesheet';
      link.crossOrigin = 'anonymous';
      
      // Add to document head
      const existingLink = document.querySelector('link[data-amiri-font]');
      if (existingLink) {
        existingLink.remove();
      }
      
      document.head.appendChild(link);
      
      // Wait for font to load
      return new Promise((resolve) => {
        link.onload = () => {
          console.log('Amiri Quran font loaded successfully');
          resolve();
        };
        
        link.onerror = () => {
          console.warn('Failed to load Amiri Quran font, using fallback');
          this.loadFallbackFont();
          resolve();
        };
        
        // Set timeout
        setTimeout(() => {
          if (link.onload || link.onerror) return;
          console.warn('Amiri Quran font loading timeout, using fallback');
          this.loadFallbackFont();
          resolve();
        }, 5000); // 5 seconds
      });
    } catch (error) {
      console.error('Error loading Amiri Quran font:', error);
      this.loadFallbackFont();
    }
  }

  /**
   * Load fallback Arabic font
   */
  private static loadFallbackFont(): void {
    try {
      // Try fallback fonts in order
      for (const fontName of this.FALLBACK_FONTS) {
        if (document.fonts.check(fontName)) {
          document.body.style.fontFamily = `'${fontName}', ${this.AMIRI_FONT_NAME}`;
          console.log(`Using fallback font: ${fontName}`);
          return;
        }
      }
      
      // If no fallback fonts available, use system default
      document.body.style.fontFamily = this.AMIRI_FONT_NAME;
      console.log('Using Amiri Quran font (system default)');
    } catch (error) {
      console.error('Error setting fallback font:', error);
    }
  }

  /**
   * Check if font is loaded
   */
  static isFontLoaded(): boolean {
    return document.fonts.check(this.AMIRI_FONT_NAME);
  }
}

// Compatibility export to match existing imports (`arabicFontLoader.loadAmiriFont()`)
export const arabicFontLoader = ArabicFontLoader;
