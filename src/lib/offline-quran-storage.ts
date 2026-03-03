import { IslamicContent } from '../data/expanded-islamic-content';

export interface OfflineQuranData {
  verses: IslamicContent[];
  surahs: SurahInfo[];
  recitations: RecitationMetadata[];
  lastUpdated: number;
  version: string;
}

export interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  arabicName: string;
  verses: number;
  revelationType: 'Meccan' | 'Medinan';
  page: number;
  juz: number[];
}

export interface RecitationMetadata {
  id: string;
  reciterName: string;
  style: string;
  quality: 'low' | 'medium' | 'high';
  segments: AudioSegment[];
}

export interface AudioSegment {
  surahNumber: number;
  fromVerse: number;
  toVerse: number;
  url: string;
  size: number;
  downloaded: boolean;
  blob?: Blob;
}

export interface OfflineStorageStats {
  totalSize: number;
  downloadedSurahs: number;
  totalSurahs: number;
  cachedVerses: number;
  lastSyncTime: number;
}

export class OfflineQuranStorage {
  private dbName = 'noor-quran-offline';
  private version = 2;
  private db: IDBDatabase | null = null;
  
  private readonly STORES = {
    QURAN_DATA: 'quranData',
    SURAH_INFO: 'surahInfo', 
    RECITATIONS: 'recitations',
    AUDIO_SEGMENTS: 'audioSegments',
    SYNC_METADATA: 'syncMetadata'
  } as const;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(this.STORES.QURAN_DATA)) {
          db.createObjectStore(this.STORES.QURAN_DATA);
        }
        
        if (!db.objectStoreNames.contains(this.STORES.SURAH_INFO)) {
          const store = db.createObjectStore(this.STORES.SURAH_INFO, { keyPath: 'number' });
          store.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.STORES.RECITATIONS)) {
          const store = db.createObjectStore(this.STORES.RECITATIONS, { keyPath: 'id' });
          store.createIndex('reciterName', 'reciterName', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.STORES.AUDIO_SEGMENTS)) {
          const store = db.createObjectStore(this.STORES.AUDIO_SEGMENTS);
          store.createIndex('surahNumber', 'surahNumber', { unique: false });
          store.createIndex('downloaded', 'downloaded', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.STORES.SYNC_METADATA)) {
          db.createObjectStore(this.STORES.SYNC_METADATA);
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Quran Verses Storage
  async cacheQuranVerses(verses: IslamicContent[]): Promise<void> {
    await this.init();
    const store = this.getStore(this.STORES.QURAN_DATA, 'readwrite');
    
    const data: OfflineQuranData = {
      verses,
      surahs: [],
      recitations: [],
      lastUpdated: Date.now(),
      version: '1.0.0'
    };

    return new Promise((resolve, reject) => {
      const request = store.put(data, 'main');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedVerses(): Promise<IslamicContent[]> {
    await this.init();
    const store = this.getStore(this.STORES.QURAN_DATA);
    
    return new Promise((resolve, reject) => {
      const request = store.get('main');
      request.onsuccess = () => {
        const data = request.result as OfflineQuranData;
        resolve(data?.verses || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Surah Information Storage
  async cacheSurahInfo(surahs: SurahInfo[]): Promise<void> {
    await this.init();
    const store = this.getStore(this.STORES.SURAH_INFO, 'readwrite');
    
    const transaction = store.transaction;
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      
      surahs.forEach(surah => {
        store.put(surah);
      });
    });
  }

  async getSurahInfo(surahNumber: number): Promise<SurahInfo | null> {
    await this.init();
    const store = this.getStore(this.STORES.SURAH_INFO);
    
    return new Promise((resolve, reject) => {
      const request = store.get(surahNumber);
      request.onsuccess = () => resolve(request.result as SurahInfo || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSurahs(): Promise<SurahInfo[]> {
    await this.init();
    const store = this.getStore(this.STORES.SURAH_INFO);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as SurahInfo[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Audio Segment Storage
  async cacheAudioSegment(segment: AudioSegment): Promise<void> {
    await this.init();
    const store = this.getStore(this.STORES.AUDIO_SEGMENTS, 'readwrite');
    
    const key = `${segment.surahNumber}-${segment.fromVerse}-${segment.toVerse}`;
    
    return new Promise((resolve, reject) => {
      const request = store.put(segment, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAudioSegment(surahNumber: number, fromVerse: number, toVerse: number): Promise<AudioSegment | null> {
    await this.init();
    const store = this.getStore(this.STORES.AUDIO_SEGMENTS);
    
    const key = `${surahNumber}-${fromVerse}-${toVerse}`;
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as AudioSegment || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getDownloadedSegments(surahNumber?: number): Promise<AudioSegment[]> {
    await this.init();
    const store = this.getStore(this.STORES.AUDIO_SEGMENTS);
    
    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      
      if (surahNumber) {
        const index = store.index('surahNumber');
        request = index.getAll(surahNumber);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => {
        const segments = request.result as AudioSegment[];
        resolve(segments.filter(segment => segment.downloaded && segment.blob));
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Metadata
  async updateSyncMetadata(metadata: Partial<OfflineStorageStats>): Promise<void> {
    await this.init();
    const store = this.getStore(this.STORES.SYNC_METADATA, 'readwrite');
    
    const existing = await this.getSyncMetadata();
    const updated = { ...existing, ...metadata, lastSyncTime: Date.now() };
    
    return new Promise((resolve, reject) => {
      const request = store.put(updated, 'stats');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncMetadata(): Promise<OfflineStorageStats> {
    await this.init();
    const store = this.getStore(this.STORES.SYNC_METADATA);
    
    return new Promise((resolve, reject) => {
      const request = store.get('stats');
      request.onsuccess = () => {
        const defaultStats: OfflineStorageStats = {
          totalSize: 0,
          downloadedSurahs: 0,
          totalSurahs: 114,
          cachedVerses: 0,
          lastSyncTime: 0
        };
        resolve({ ...defaultStats, ...(request.result || {}) });
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Storage Management
  async clearCache(): Promise<void> {
    await this.init();
    const stores = Object.values(this.STORES);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(stores, 'readwrite');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      
      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        store.clear();
      });
    });
  }

  async getStorageSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }

  // Utility Methods
  async isDataFresh(maxAge: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    const metadata = await this.getSyncMetadata();
    return Date.now() - metadata.lastSyncTime < maxAge;
  }

  async getCacheStatus(): Promise<{
    versesCached: boolean;
    surahsCached: boolean;
    audioDownloaded: number;
    needsUpdate: boolean;
  }> {
    const verses = await this.getCachedVerses();
    const surahs = await this.getAllSurahs();
    const segments = await this.getDownloadedSegments();
    const isFresh = await this.isDataFresh();

    return {
      versesCached: verses.length > 0,
      surahsCached: surahs.length > 0,
      audioDownloaded: segments.length,
      needsUpdate: !isFresh
    };
  }
}

export const offlineQuranStorage = new OfflineQuranStorage();
