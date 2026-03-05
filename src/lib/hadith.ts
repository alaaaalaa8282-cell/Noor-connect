import type { EnhancedHadith, HadithCollection } from "@/data/hadith-collections";

type ModuleLoader = () => Promise<unknown>;

const metadataLoaders: Record<string, ModuleLoader> = import.meta.glob(
  "../data/hadith-collections/*/metadata.json"
);
const bookLoaders: Record<string, ModuleLoader> = import.meta.glob(
  "../data/hadith-collections/*/*.json"
);

const metadataCache = new Map<string, HadithCollection | null>();
const bookCache = new Map<string, EnhancedHadith[] | null>();

function getCollectionPrefix(collectionName: string): string {
  return `../data/hadith-collections/${collectionName}/`;
}

function normalizeBookNumber(bookNumber: string): string {
  const stripped = bookNumber.trim().replace(/^book[-_]?/i, "");
  const parsed = Number.parseInt(stripped, 10);
  return Number.isNaN(parsed) ? stripped : String(parsed);
}

function getBookNumberFromPath(path: string): string | null {
  if (path.endsWith("/metadata.json")) {
    return null;
  }

  const filename = path.split("/").pop()?.replace(".json", "") ?? "";
  const match = filename.match(/(?:book[-_]?|^)(\d+)$/i);
  if (!match) {
    return null;
  }

  return String(Number.parseInt(match[1], 10));
}

async function loadModuleJson<T>(loader: ModuleLoader): Promise<T> {
  const moduleData = await loader();
  if (
    typeof moduleData === "object" &&
    moduleData !== null &&
    "default" in (moduleData as Record<string, unknown>)
  ) {
    return (moduleData as { default: T }).default;
  }
  return moduleData as T;
}

function resolveBookPath(collectionName: string, bookNumber: string): string | null {
  const prefix = getCollectionPrefix(collectionName);
  const normalized = normalizeBookNumber(bookNumber);

  const candidates = new Set<string>([
    `${prefix}${bookNumber}.json`,
    `${prefix}${normalized}.json`,
    `${prefix}book-${normalized}.json`,
    `${prefix}book_${normalized}.json`,
  ]);

  const numeric = Number.parseInt(normalized, 10);
  if (!Number.isNaN(numeric)) {
    for (const width of [2, 3]) {
      const padded = String(numeric).padStart(width, "0");
      candidates.add(`${prefix}${padded}.json`);
      candidates.add(`${prefix}book-${padded}.json`);
      candidates.add(`${prefix}book_${padded}.json`);
    }
  }

  for (const candidate of candidates) {
    if (bookLoaders[candidate] && !candidate.endsWith("/metadata.json")) {
      return candidate;
    }
  }

  for (const path of Object.keys(bookLoaders)) {
    if (!path.startsWith(prefix) || path.endsWith("/metadata.json")) {
      continue;
    }
    if (getBookNumberFromPath(path) === normalized) {
      return path;
    }
  }

  return null;
}

async function loadBookByPath(path: string): Promise<EnhancedHadith[] | null> {
  if (bookCache.has(path)) {
    return bookCache.get(path) ?? null;
  }

  const loader = bookLoaders[path];
  if (!loader || path.endsWith("/metadata.json")) {
    bookCache.set(path, null);
    return null;
  }

  try {
    const data = await loadModuleJson<EnhancedHadith[]>(loader);
    const normalized = Array.isArray(data) ? data : [];
    bookCache.set(path, normalized);
    return normalized;
  } catch (error) {
    console.warn(`Failed to load Hadith data from ${path}:`, error);
    bookCache.set(path, null);
    return null;
  }
}

// Load collection metadata from local data
export async function getHadithCollectionMetadata(collectionName: string): Promise<HadithCollection | null> {
  if (metadataCache.has(collectionName)) {
    return metadataCache.get(collectionName) ?? null;
  }

  const path = `${getCollectionPrefix(collectionName)}metadata.json`;
  const loader = metadataLoaders[path];
  if (!loader) {
    metadataCache.set(collectionName, null);
    return null;
  }

  try {
    const data = await loadModuleJson<HadithCollection>(loader);
    metadataCache.set(collectionName, data);
    return data;
  } catch (error) {
    console.warn(`Failed to load metadata for ${collectionName}:`, error);
    metadataCache.set(collectionName, null);
    return null;
  }
}

// Load Hadith data for a specific book
export async function getHadithBookData(collectionName: string, bookNumber: string): Promise<EnhancedHadith[] | null> {
  const path = resolveBookPath(collectionName, bookNumber);
  if (!path) {
    return null;
  }
  return loadBookByPath(path);
}

export function getAvailableHadithBooks(collectionName: string): string[] {
  const prefix = getCollectionPrefix(collectionName);
  const books = new Set<string>();

  for (const path of Object.keys(bookLoaders)) {
    if (!path.startsWith(prefix) || path.endsWith("/metadata.json")) {
      continue;
    }
    const number = getBookNumberFromPath(path);
    if (number) {
      books.add(number);
    }
  }

  return Array.from(books).sort((a, b) => {
    const aNum = Number.parseInt(a, 10);
    const bNum = Number.parseInt(b, 10);

    if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
      return a.localeCompare(b);
    }

    return aNum - bNum;
  });
}

export function getFirstAvailableHadithBook(collectionName: string): string | null {
  const books = getAvailableHadithBooks(collectionName);
  return books[0] ?? null;
}

export async function getDailyHadith(seedDate: Date = new Date()): Promise<EnhancedHadith | null> {
  const allBookPaths = Object.keys(bookLoaders)
    .filter((path) => !path.endsWith("/metadata.json"))
    .sort((a, b) => a.localeCompare(b));

  if (allBookPaths.length === 0) {
    return null;
  }

  const dayIndex = Math.floor(Date.UTC(seedDate.getFullYear(), seedDate.getMonth(), seedDate.getDate()) / 86400000);
  const selectedPath = allBookPaths[dayIndex % allBookPaths.length];
  const bookData = await loadBookByPath(selectedPath);
  if (!bookData || bookData.length === 0) {
    return null;
  }

  return bookData[dayIndex % bookData.length] ?? bookData[0] ?? null;
}
