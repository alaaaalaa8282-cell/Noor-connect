// Mushaf Service - Handles loading and caching Mushaf Layout pages
// Data source: https://github.com/zonetecde/mushaf-layout

const MUSHAF_CDN_BASE = "https://raw.githubusercontent.com/zonetecde/mushaf-layout/refs/heads/main/mushaf";
const CACHE_PREFIX = "mushaf-page-";
const CACHE_VERSION = "1.0";
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB limit
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface MushafWord {
  location: string; // surah:verse:wordIndex (e.g., "2:1:1")
  word: string; // Arabic text with verse number if last word
  qpcV2: string; // QPC2 font glyphs
  qpcV1: string; // QPC1 font glyphs
}

export interface MushafLine {
  line: number;
  type: "surah-header" | "basmala" | "text";
  text?: string;
  surah?: string;
  qpcV2?: string;
  qpcV1?: string;
  verseRange?: string;
  words?: MushafWord[];
}

export interface MushafPage {
  page: number;
  lines: MushafLine[];
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

// Surah to page mapping (approximate - based on standard Madani Mushaf)
export const SURAH_START_PAGES: { [key: number]: number } = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 176, 9: 187,
  10: 198, 11: 208, 12: 221, 13: 230, 14: 233, 15: 238, 16: 242,
  17: 255, 18: 267, 19: 277, 20: 282, 21: 293, 22: 305, 23: 312,
  24: 318, 25: 327, 26: 334, 27: 350, 28: 359, 29: 370, 30: 376,
  31: 379, 32: 382, 33: 385, 34: 396, 35: 400, 36: 404, 37: 410,
  38: 418, 39: 425, 40: 434, 41: 445, 42: 452, 43: 458, 44: 467,
  45: 471, 46: 475, 47: 479, 48: 483, 49: 487, 50: 489, 51: 493,
  52: 496, 53: 499, 54: 502, 55: 506, 56: 510, 57: 514, 58: 518,
  59: 522, 60: 526, 61: 528, 62: 530, 63: 531, 64: 533, 65: 535,
  66: 537, 67: 538, 68: 541, 69: 544, 70: 547, 71: 550, 72: 552,
  73: 554, 74: 556, 75: 558, 76: 560, 77: 562, 78: 564, 79: 566,
  80: 568, 81: 570, 82: 572, 83: 573, 84: 575, 85: 576, 86: 578,
  87: 579, 88: 580, 89: 581, 90: 582, 91: 583, 92: 584, 93: 585,
  94: 586, 95: 586, 96: 587, 97: 587, 98: 588, 99: 588, 100: 589,
  101: 589, 102: 590, 103: 590, 104: 590, 105: 591, 106: 591, 107: 591,
  108: 592, 109: 592, 110: 592, 111: 593, 112: 593, 113: 593, 114: 594
};

class MushafService {
  private static instance: MushafService;
  private memoryCache: Map<number, MushafPage> = new Map();
  private preloadQueue: number[] = [];

  static getInstance(): MushafService {
    if (!MushafService.instance) {
      MushafService.instance = new MushafService();
    }
    return MushafService.instance;
  }

  private getCacheKey(pageNumber: number): string {
    return `${CACHE_PREFIX}${pageNumber}`;
  }

  private getCachedItem<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);

      if (entry.version !== CACHE_VERSION) {
        localStorage.removeItem(key);
        return null;
      }

      const now = Date.now();
      if (now - entry.timestamp > entry.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error(`Error reading Mushaf cache for ${key}:`, error);
      return null;
    }
  }

  private setCachedItem<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        version: CACHE_VERSION
      };

      const serialized = JSON.stringify(entry);

      if (this.getCacheSize() + serialized.length > MAX_CACHE_SIZE) {
        this.cleanupCache();
      }

      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error writing Mushaf cache for ${key}:`, error);
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        this.cleanupCache(true);
        try {
          const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
            version: CACHE_VERSION
          };
          localStorage.setItem(key, JSON.stringify(entry));
        } catch (retryError) {
          console.error("Failed to cache Mushaf page even after cleanup:", retryError);
        }
      }
    }
  }

  private getCacheSize(): number {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        const item = localStorage.getItem(key);
        if (item) {
          size += item.length;
        }
      }
    }
    return size;
  }

  private cleanupCache(aggressive: boolean = false): void {
    const entries: { key: string; timestamp: number; size: number }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            entries.push({
              key,
              timestamp: parsed.timestamp || 0,
              size: item.length
            });
          } catch {
            localStorage.removeItem(key);
          }
        }
      }
    }

    entries.sort((a, b) => a.timestamp - b.timestamp);

    const now = Date.now();
    for (const entry of entries) {
      const item = localStorage.getItem(entry.key);
      if (item) {
        try {
          const parsed = JSON.parse(item);
          if (now - parsed.timestamp > (parsed.ttl || DEFAULT_TTL)) {
            localStorage.removeItem(entry.key);
          }
        } catch {
          localStorage.removeItem(entry.key);
        }
      }
    }

    if (aggressive) {
      const remaining = entries.filter(e => localStorage.getItem(e.key) !== null);
      const toRemove = Math.floor(remaining.length / 2);
      for (let i = 0; i < toRemove && i < remaining.length; i++) {
        localStorage.removeItem(remaining[i].key);
      }
    }
  }

  async getPage(pageNumber: number): Promise<MushafPage | null> {
    if (pageNumber < 1 || pageNumber > 604) {
      console.error(`Invalid page number: ${pageNumber}`);
      return null;
    }

    // Check memory cache first
    if (this.memoryCache.has(pageNumber)) {
      return this.memoryCache.get(pageNumber)!;
    }

    // Check localStorage cache
    const cacheKey = this.getCacheKey(pageNumber);
    const cached = this.getCachedItem<MushafPage>(cacheKey);
    if (cached) {
      this.memoryCache.set(pageNumber, cached);
      return cached;
    }

    // Fetch from CDN
    try {
      const url = `${MUSHAF_CDN_BASE}/page-${pageNumber.toString().padStart(3, '0')}.json`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`Failed to fetch Mushaf page ${pageNumber}: ${response.status}`);
        return null;
      }

      const data: MushafPage = await response.json();

      // Cache the data
      this.memoryCache.set(pageNumber, data);
      this.setCachedItem(cacheKey, data);

      return data;
    } catch (error) {
      console.error(`Error loading Mushaf page ${pageNumber}:`, error);
      return null;
    }
  }

  async preloadPages(pageNumbers: number[]): Promise<void> {
    for (const pageNum of pageNumbers) {
      if (pageNum >= 1 && pageNum <= 604 && !this.memoryCache.has(pageNum)) {
        this.preloadQueue.push(pageNum);
      }
    }

    // Process preload queue
    while (this.preloadQueue.length > 0) {
      const pageNum = this.preloadQueue.shift()!;
      try {
        await this.getPage(pageNum);
      } catch (error) {
        console.error(`Error preloading page ${pageNum}:`, error);
      }
    }
  }

  getPageForSurah(surahNumber: number): number {
    return SURAH_START_PAGES[surahNumber] || 1;
  }

  getSurahForPage(pageNumber: number): number | null {
    const surahs = Object.entries(SURAH_START_PAGES);
    let currentSurah = 1;
    
    for (const [surah, startPage] of surahs) {
      if (pageNumber < startPage) {
        return currentSurah;
      }
      currentSurah = parseInt(surah);
    }
    
    return 114;
  }

  getAdjacentPages(pageNumber: number): { prev: number | null; next: number | null } {
    return {
      prev: pageNumber > 1 ? pageNumber - 1 : null,
      next: pageNumber < 604 ? pageNumber + 1 : null
    };
  }

  async preloadAdjacentPages(pageNumber: number): Promise<void> {
    const { prev, next } = this.getAdjacentPages(pageNumber);
    const pagesToPreload: number[] = [];
    
    if (prev) pagesToPreload.push(prev);
    if (next) pagesToPreload.push(next);
    
    // Also preload a few more for smoother navigation
    if (prev && prev > 1) pagesToPreload.push(prev - 1);
    if (next && next < 604) pagesToPreload.push(next + 1);
    
    await this.preloadPages(pagesToPreload);
  }

  clearCache(): void {
    this.memoryCache.clear();
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  }

  getCachedPageCount(): number {
    return this.memoryCache.size;
  }
}

export const mushafService = MushafService.getInstance();
