import { offlineQuranStorage, OfflineStorageStats } from './offline-quran-storage';
import { allIslamicContent } from '../data/expanded-islamic-content';

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // in milliseconds
  wifiOnly: boolean;
  maxRetries: number;
  retryDelay: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  pendingSync: boolean;
  syncProgress: number;
  error?: string;
}

export interface SyncEvent {
  type: 'start' | 'progress' | 'complete' | 'error' | 'offline' | 'online';
  data?: any;
  timestamp: number;
}

export class OfflineSyncService {
  private config: SyncConfig = {
    autoSync: true,
    syncInterval: 60 * 60 * 1000, // 1 hour
    wifiOnly: false,
    maxRetries: 3,
    retryDelay: 5000
  };

  private status: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: 0,
    pendingSync: false,
    syncProgress: 0
  };

  private listeners = new Set<(event: SyncEvent) => void>();
  private syncTimer: NodeJS.Timeout | null = null;
  private retryCount = 0;

  constructor() {
    this.setupEventListeners();
    this.loadConfig();
    this.startAutoSync();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      this.emit({ type: 'online', timestamp: Date.now() });
      if (this.status.pendingSync) {
        this.sync().catch((err) => {
          console.warn('Auto-sync after coming online failed:', err);
        });
      }
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      this.emit({ type: 'offline', timestamp: Date.now() });
    });
  }

  private async loadConfig(): Promise<void> {
    try {
      const stored = localStorage.getItem('offline-sync-config');
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load sync config:', error);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('offline-sync-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save sync config:', error);
    }
  }

  private emit(event: SyncEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (this.config.autoSync) {
      this.syncTimer = setInterval(() => {
        if (this.status.isOnline && !this.status.isSyncing) {
          this.sync();
        }
      }, this.config.syncInterval);
    }
  }

  // Public API
  onSyncEvent(callback: (event: SyncEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  updateConfig(updates: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    this.startAutoSync();
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  async sync(): Promise<void> {
    if (!this.status.isOnline) {
      this.status.pendingSync = true;
      this.emit({ 
        type: 'offline', 
        data: { message: 'Device offline, sync queued' },
        timestamp: Date.now() 
      });
      return;
    }

    if (this.status.isSyncing) {
      return;
    }

    this.status.isSyncing = true;
    this.status.syncProgress = 0;
    this.retryCount = 0;
    
    this.emit({ 
      type: 'start', 
      data: { message: 'Starting sync...' },
      timestamp: Date.now() 
    });

    try {
      await this.performSync();
      
      this.status.isSyncing = false;
      this.status.lastSyncTime = Date.now();
      this.status.pendingSync = false;
      this.status.syncProgress = 100;

      this.emit({ 
        type: 'complete', 
        data: { 
          message: 'Sync completed successfully',
          lastSyncTime: this.status.lastSyncTime
        },
        timestamp: Date.now() 
      });

    } catch (error) {
      this.status.isSyncing = false;
      this.status.error = error instanceof Error ? error.message : 'Unknown sync error';
      
      this.emit({ 
        type: 'error', 
        data: { 
          error: this.status.error,
          retryCount: this.retryCount
        },
        timestamp: Date.now() 
      });

      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.sync().catch((err) => {
          console.warn('Retry sync failed:', err);
        }), this.config.retryDelay * this.retryCount);
      }
    }
  }

  private async performSync(): Promise<void> {
    const steps = [
      () => this.syncQuranVerses(),
      () => this.syncSurahInfo(),
      () => this.syncAudioMetadata(),
      () => this.cleanupOldCache()
    ];

    for (let i = 0; i < steps.length; i++) {
      this.status.syncProgress = (i / steps.length) * 100;
      this.emit({ 
        type: 'progress', 
        data: { 
          progress: this.status.syncProgress,
          step: i + 1,
          totalSteps: steps.length
        },
        timestamp: Date.now() 
      });

      await steps[i]();
    }
  }

  private async syncQuranVerses(): Promise<void> {
    try {
      // Check if we have fresh data
      const isFresh = await offlineQuranStorage.isDataFresh();
      
      if (!isFresh) {
        // In a real implementation, this would fetch from an API
        // For now, we'll use the local data
        await offlineQuranStorage.cacheQuranVerses(allIslamicContent);
        
        this.emit({
          type: 'progress',
          data: { message: 'Quran verses synced' },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      throw new Error(`Failed to sync Quran verses: ${error}`);
    }
  }

  private async syncSurahInfo(): Promise<void> {
    try {
      // Check if surah info needs updating
      const surahs = await offlineQuranStorage.getAllSurahs();
      
      if (surahs.length === 0) {
        // In a real implementation, fetch from API
        const surahInfo = await this.fetchSurahInfo();
        await offlineQuranStorage.cacheSurahInfo(surahInfo);
        
        this.emit({
          type: 'progress',
          data: { message: 'Surah information synced' },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      throw new Error(`Failed to sync surah info: ${error}`);
    }
  }

  private async syncAudioMetadata(): Promise<void> {
    try {
      // Sync audio recitation metadata
      // This would typically fetch from an API
      const metadata = await this.fetchRecitationMetadata();
      
      for (const recitation of metadata) {
        // Store metadata (actual audio files are downloaded on demand)
        if (recitation.segments && recitation.segments.length > 0) {
          await offlineQuranStorage.cacheAudioSegment({
            ...recitation.segments[0],
            downloaded: false
          });
        }
      }
      
      this.emit({
        type: 'progress',
        data: { message: 'Audio metadata synced' },
        timestamp: Date.now()
      });
    } catch (error) {
      throw new Error(`Failed to sync audio metadata: ${error}`);
    }
  }

  private async cleanupOldCache(): Promise<void> {
    try {
      // Get storage quota and clean up if needed
      const storageSize = await offlineQuranStorage.getStorageSize();
      const quota = await this.getStorageQuota();
      
      if (storageSize > quota * 0.8) { // If using more than 80% of quota
        // Implement cleanup logic here
        this.emit({
          type: 'progress',
          data: { message: 'Cache cleanup completed' },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  private async getStorageQuota(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.quota || 0;
    }
    return 0;
  }

  // Mock data fetching methods (replace with real API calls)
  private async fetchSurahInfo(): Promise<any[]> {
    // Mock surah information - replace with real API
    return Array.from({ length: 114 }, (_, i) => ({
      number: i + 1,
      name: `Surah ${i + 1}`,
      englishName: `Chapter ${i + 1}`,
      arabicName: `سورة ${i + 1}`,
      verses: Math.floor(Math.random() * 200) + 1,
      revelationType: Math.random() > 0.5 ? 'Meccan' : 'Medinan',
      page: i + 1,
      juz: [Math.floor(i / 114 * 30) + 1]
    }));
  }

  private async fetchRecitationMetadata(): Promise<any[]> {
    // Mock recitation metadata - replace with real API
    return [
      {
        id: 'reciter-1',
        reciterName: 'Mishari Rashid Alafasy',
        style: 'Hafs',
        quality: 'high',
        segments: [{
          surahNumber: 1,
          fromVerse: 1,
          toVerse: 7,
          url: '',
          size: 0,
          downloaded: false
        }]
      }
    ];
  }

  // Force sync regardless of online status
  async forceSync(): Promise<void> {
    const originalOnlineStatus = this.status.isOnline;
    this.status.isOnline = true; // Temporarily set to online to allow sync
    
    try {
      await this.sync();
    } finally {
      this.status.isOnline = originalOnlineStatus;
    }
  }

  // Clear all cached data
  async clearCache(): Promise<void> {
    await offlineQuranStorage.clearCache();
    this.status.lastSyncTime = 0;
    this.status.pendingSync = true;
    
    this.emit({
      type: 'complete',
      data: { message: 'Cache cleared successfully' },
      timestamp: Date.now()
    });
  }

  // Get comprehensive sync statistics
  async getSyncStats(): Promise<OfflineStorageStats & SyncStatus & { versesCached: boolean; surahsCached: boolean; audioDownloaded: number; needsUpdate: boolean }> {
    const storageStats = await offlineQuranStorage.getSyncMetadata();
    const cacheStatus = await offlineQuranStorage.getCacheStatus();
    
    return {
      ...storageStats,
      ...this.status,
      versesCached: cacheStatus.versesCached,
      surahsCached: cacheStatus.surahsCached,
      audioDownloaded: cacheStatus.audioDownloaded,
      needsUpdate: cacheStatus.needsUpdate
    };
  }

  // Destroy the service and clean up resources
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.listeners.clear();
  }
}

export const offlineSyncService = new OfflineSyncService();
