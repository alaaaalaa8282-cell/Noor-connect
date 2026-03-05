// Dynamic Hadith Data Loader - Fetch-based for true lazy loading
// Data stored in public/data/hadith-collections/ - NOT bundled

export interface EnhancedHadith {
  id: string;
  collection: string;
  bookNumber: string;
  bookName: string;
  chapterNumber?: string;
  chapterName?: string;
  hadithNumber: string;
  arabic: string;
  arabicPlain?: string;
  englishTranslation?: string;
  narrator?: string;
  chain?: string;
  grade?: string;
  category: string;
  tags: string[];
  references?: string;
}

export interface HadithCollection {
  name: string;
  title: string;
  author: string;
  death: string;
  description: string;
  totalHadith: number;
  totalBooks: number;
  books: HadithBook[];
  authenticity: string;
  compilerPeriod: string;
  arabicTitle: string;
}

export interface HadithBook {
  number: string;
  name: string;
  arabicName: string;
  hadithCount: number;
  chapters?: HadithChapter[];
  description?: string;
}

export interface HadithChapter {
  number: string;
  name: string;
  arabicName: string;
  hadithCount: number;
}

interface CollectionProfile {
  title: string;
  author: string;
  death: string;
  description: string;
  totalHadith: number;
  totalBooks: number;
  authenticity: string;
  compilerPeriod: string;
  arabicTitle: string;
}

// Data URLs - served from public folder, not bundled
const DATA_BASE_URL = '/data/hadith-collections';

// Cache for loaded data
const metadataCache: Map<string, HadithCollection> = new Map();
const hadithCache: Map<string, EnhancedHadith[]> = new Map();
const bookCache: Map<string, EnhancedHadith[]> = new Map();

// Fallback profiles for instant UI rendering
const FALLBACK_COLLECTION_PROFILES: Record<string, CollectionProfile> = {
  bukhari: {
    title: "Sahih al-Bukhari",
    arabicTitle: "صحيح البخاري",
    author: "Imam Muhammad ibn Ismail al-Bukhari",
    death: "256 AH / 870 CE",
    description: "The most authentic collection of Hadith after the Quran.",
    totalHadith: 7277,
    totalBooks: 97,
    authenticity: "Sahih (Authentic)",
    compilerPeriod: "194-256 AH",
  },
  muslim: {
    title: "Sahih Muslim",
    arabicTitle: "صحيح مسلم",
    author: "Imam Muslim ibn al-Hajjaj",
    death: "261 AH / 875 CE",
    description: "Second most authentic collection of Hadith.",
    totalHadith: 7459,
    totalBooks: 57,
    authenticity: "Sahih (Authentic)",
    compilerPeriod: "204-261 AH",
  },
  tirmidhi: {
    title: "Sunan al-Tirmidhi",
    arabicTitle: "سنن الترمذي",
    author: "Imam Abu Isa al-Tirmidhi",
    death: "279 AH / 892 CE",
    description: "Collection containing authentic, good, and weak hadith.",
    totalHadith: 4053,
    totalBooks: 49,
    authenticity: "Hasan (Good)",
    compilerPeriod: "209-279 AH",
  },
  abudawud: {
    title: "Sunan Abu Dawud",
    arabicTitle: "سنن أبي داود",
    author: "Imam Abu Dawud al-Sijistani",
    death: "275 AH / 889 CE",
    description: "One of the six major Hadith collections focusing on Islamic jurisprudence.",
    totalHadith: 5274,
    totalBooks: 43,
    authenticity: "Hasan (Good)",
    compilerPeriod: "202-275 AH",
  },
  nasai: {
    title: "Sunan al-Nasa'i",
    arabicTitle: "سنن النسائي",
    author: "Imam al-Nasa'i",
    death: "303 AH / 915 CE",
    description: "Collection known for detailed chains of narration and strong authenticity standards.",
    totalHadith: 5685,
    totalBooks: 52,
    authenticity: "Hasan (Good)",
    compilerPeriod: "215-303 AH",
  },
  ibnmajah: {
    title: "Sunan Ibn Majah",
    arabicTitle: "سنن ابن ماجه",
    author: "Imam Ibn Majah",
    death: "273 AH / 887 CE",
    description: "One of the six canonical Hadith collections.",
    totalHadith: 4343,
    totalBooks: 37,
    authenticity: "Hasan (Good)",
    compilerPeriod: "209-273 AH",
  },
  malik: {
    title: "Muwatta Malik",
    arabicTitle: "موطأ مالك",
    author: "Imam Malik ibn Anas",
    death: "179 AH / 795 CE",
    description: "Early collection of Hadith and legal rulings compiled in Medina.",
    totalHadith: 1858,
    totalBooks: 61,
    authenticity: "Sahih (Authentic)",
    compilerPeriod: "93-179 AH",
  },
  "musnad-ahmad": {
    title: "Musnad Ahmad ibn Hanbal",
    arabicTitle: "مسند أحمد بن حنبل",
    author: "Imam Ahmad ibn Hanbal",
    death: "241 AH / 855 CE",
    description: "Large collection organized primarily by companion narrators.",
    totalHadith: 27645,
    totalBooks: 31,
    authenticity: "Varied",
    compilerPeriod: "164-241 AH",
  },
  "riyad-us-salihin": {
    title: "Riyad us-Salihin",
    arabicTitle: "رياض الصالحين",
    author: "Imam al-Nawawi",
    death: "676 AH / 1277 CE",
    description: "Collection focusing on spirituality, character, and daily Islamic practice.",
    totalHadith: 1896,
    totalBooks: 18,
    authenticity: "Sahih (Authentic)",
    compilerPeriod: "631-676 AH",
  },
};

// Helper functions
function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function normalizeBook(raw: unknown, index: number): HadithBook {
  const data = (raw ?? {}) as Partial<HadithBook>;
  return {
    number: String(data.number ?? index + 1),
    name: data.name ?? `Book ${index + 1}`,
    arabicName: data.arabicName ?? "",
    hadithCount: Number(data.hadithCount ?? 0),
    chapters: data.chapters,
    description: data.description,
  };
}

function normalizeCollection(nameFromPath: string, raw: unknown): HadithCollection {
  const data = (raw ?? {}) as Partial<HadithCollection>;
  const fallback = FALLBACK_COLLECTION_PROFILES[nameFromPath];
  const books = Array.isArray(data.books)
    ? data.books.map((book, index) => normalizeBook(book, index))
    : [];

  return {
    name: data.name || nameFromPath,
    title: data.title || fallback?.title || titleFromSlug(nameFromPath),
    author: data.author || fallback?.author || "Unknown",
    death: data.death || fallback?.death || "",
    description: data.description || fallback?.description || "Hadith collection",
    totalHadith: Number(data.totalHadith ?? fallback?.totalHadith ?? books.reduce((sum, book) => sum + book.hadithCount, 0)),
    totalBooks: Number(data.totalBooks ?? fallback?.totalBooks ?? books.length),
    books,
    authenticity: data.authenticity || fallback?.authenticity || "",
    compilerPeriod: data.compilerPeriod || fallback?.compilerPeriod || "",
    arabicTitle: data.arabicTitle || fallback?.arabicTitle || "",
  };
}

// Fetch with timeout and retry
async function fetchJSON<T>(url: string, retries = 2): Promise<T | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() as T;
    } catch (error) {
      if (i === retries) {
        console.error(`Failed to fetch ${url}:`, error);
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

// Load collection metadata
export async function loadCollectionMetadata(collection: string): Promise<HadithCollection | null> {
  if (metadataCache.has(collection)) {
    return metadataCache.get(collection)!;
  }

  const metadata = await fetchJSON<HadithCollection>(`${DATA_BASE_URL}/${collection}/metadata.json`);
  
  if (metadata) {
    const normalized = normalizeCollection(collection, metadata);
    metadataCache.set(collection, normalized);
    return normalized;
  }

  if (FALLBACK_COLLECTION_PROFILES[collection]) {
    const fallback = normalizeCollection(collection, FALLBACK_COLLECTION_PROFILES[collection]);
    metadataCache.set(collection, fallback);
    return fallback;
  }

  return null;
}

// Load all hadiths for a collection (cached)
export async function loadCollectionHadiths(collection: string): Promise<EnhancedHadith[]> {
  const cacheKey = `${collection}:all`;
  
  if (hadithCache.has(cacheKey)) {
    return hadithCache.get(cacheKey)!;
  }

  const hadiths = await fetchJSON<EnhancedHadith[]>(`${DATA_BASE_URL}/${collection}/hadiths.json`);
  
  if (hadiths) {
    hadithCache.set(cacheKey, hadiths);
    return hadiths;
  }

  return [];
}

// Load hadiths for a specific book (cached)
export async function loadBookHadiths(collection: string, bookNumber: string): Promise<EnhancedHadith[]> {
  const cacheKey = `${collection}:${bookNumber}`;
  
  if (bookCache.has(cacheKey)) {
    return bookCache.get(cacheKey)!;
  }

  const allCacheKey = `${collection}:all`;
  if (hadithCache.has(allCacheKey)) {
    const filtered = hadithCache.get(allCacheKey)!.filter(h => h.bookNumber === bookNumber);
    bookCache.set(cacheKey, filtered);
    return filtered;
  }

  const allHadiths = await loadCollectionHadiths(collection);
  const filtered = allHadiths.filter(h => h.bookNumber === bookNumber);
  bookCache.set(cacheKey, filtered);
  
  return filtered;
}

// Preload collection metadata for all collections
export async function preloadAllMetadata(): Promise<Record<string, HadithCollection>> {
  const collections: Record<string, HadithCollection> = {};
  
  const promises = Object.keys(FALLBACK_COLLECTION_PROFILES).map(async (slug) => {
    const meta = await loadCollectionMetadata(slug);
    if (meta) collections[slug] = meta;
  });
  
  await Promise.all(promises);
  return collections;
}

// Get collection (sync fallback)
export function getCollectionByName(name: string): HadithCollection | undefined {
  return FALLBACK_COLLECTION_PROFILES[name] 
    ? normalizeCollection(name, FALLBACK_COLLECTION_PROFILES[name])
    : undefined;
}

export function getAllCollections(): HadithCollection[] {
  return Object.keys(FALLBACK_COLLECTION_PROFILES).map(slug => 
    normalizeCollection(slug, FALLBACK_COLLECTION_PROFILES[slug])
  );
}

export function getCollectionTitle(name: string): string {
  return FALLBACK_COLLECTION_PROFILES[name]?.title || name;
}

// Clear cache if needed
export function clearHadithCache(): void {
  metadataCache.clear();
  hadithCache.clear();
  bookCache.clear();
}

// Get cache stats for debugging
export function getCacheStats(): { metadata: number; hadiths: number; books: number } {
  return {
    metadata: metadataCache.size,
    hadiths: hadithCache.size,
    books: bookCache.size
  };
}

// Backward compatible export using Proxy
export const HADITH_COLLECTIONS: Record<string, HadithCollection> = new Proxy(
  {} as Record<string, HadithCollection>,
  {
    get(target, prop: string) {
      if (FALLBACK_COLLECTION_PROFILES[prop]) {
        return normalizeCollection(prop, FALLBACK_COLLECTION_PROFILES[prop]);
      }
      return target[prop];
    },
    ownKeys() {
      return Object.keys(FALLBACK_COLLECTION_PROFILES);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (FALLBACK_COLLECTION_PROFILES[prop as string]) {
        return { enumerable: true, configurable: true };
      }
      return undefined;
    },
  }
);

// Legacy async loader
export async function getCollectionsAsync(): Promise<Record<string, HadithCollection>> {
  return preloadAllMetadata();
}
