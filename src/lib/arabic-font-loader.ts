const LOCAL_ARABIC_FONTS = [
  "Noto Naskh Arabic",
  "Scheherazade New",
  "Traditional Arabic",
  "Noto Nastaliq Urdu",
  "Noto Sans Arabic",
  "Arial Unicode MS",
  "Tahoma"
];

const LOCAL_ARABIC_FONT_STACK = [
  "'Noto Naskh Arabic'",
  "'Scheherazade New'",
  "'Traditional Arabic'",
  "'Noto Nastaliq Urdu'",
  "'Noto Sans Arabic'",
  "Tahoma",
  "serif"
].join(", ");

export class ArabicFontLoader {
  private static readonly FALLBACK_FONTS = LOCAL_ARABIC_FONTS;

  /**
   * Apply a local Arabic font stack.
   */
  static async loadAmiriFont(): Promise<void> {
    this.loadFallbackFont();
  }

  /**
   * Load fallback Arabic font
   */
  private static loadFallbackFont(): void {
    document.documentElement.style.setProperty('--quran-font', LOCAL_ARABIC_FONT_STACK);
  }

  /**
   * Check if font is loaded
   */
  static isFontLoaded(): boolean {
    return this.FALLBACK_FONTS.some((fontName) => document.fonts.check(`16px "${fontName}"`));
  }
}

// Compatibility export to match existing imports (`arabicFontLoader.loadAmiriFont()`)
export const arabicFontLoader = ArabicFontLoader;
