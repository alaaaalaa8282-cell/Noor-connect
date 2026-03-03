import { useState, useEffect, useCallback } from 'react';
import { offlineQuranStorage, AudioSegment, SurahInfo } from '../lib/offline-quran-storage';
import { offlineSyncService, SyncEvent, SyncStatus } from '../lib/offline-sync-service';
import { IslamicContent } from '../data/expanded-islamic-content';

export interface UseOfflineQuranReturn {
  // Data
  verses: IslamicContent[];
  surahs: SurahInfo[];
  audioSegments: AudioSegment[];
  
  // Status
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: number;
  lastSyncTime: number;
  cacheStatus: {
    versesCached: boolean;
    surahsCached: boolean;
    audioDownloaded: number;
    needsUpdate: boolean;
  };
  
  // Actions
  sync: () => Promise<void>;
  downloadAudio: (surahNumber: number, fromVerse?: number, toVerse?: number) => Promise<void>;
  removeAudio: (surahNumber: number, fromVerse?: number, toVerse?: number) => Promise<void>;
  clearCache: () => Promise<void>;
  
  // Configuration
  updateSyncConfig: (config: Partial<{ autoSync: boolean; syncInterval: number; wifiOnly: boolean }>) => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export function useOfflineQuran(): UseOfflineQuranReturn {
  const [verses, setVerses] = useState<IslamicContent[]>([]);
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: 0,
    pendingSync: false,
    syncProgress: 0
  });
  const [cacheStatus, setCacheStatus] = useState({
    versesCached: false,
    surahsCached: false,
    audioDownloaded: 0,
    needsUpdate: false
  });
  const [error, setError] = useState<string | null>(null);

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
    updateCacheStatus();
  }, []);

  // Listen to sync events
  useEffect(() => {
    const unsubscribe = offlineSyncService.onSyncEvent(handleSyncEvent);
    return unsubscribe;
  }, []);

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCachedData = useCallback(async () => {
    try {
      const [cachedVerses, cachedSurahs, cachedAudio] = await Promise.all([
        offlineQuranStorage.getCachedVerses(),
        offlineQuranStorage.getAllSurahs(),
        offlineQuranStorage.getDownloadedSegments()
      ]);

      setVerses(cachedVerses);
      setSurahs(cachedSurahs);
      setAudioSegments(cachedAudio);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cached data');
    }
  }, []);

  const updateCacheStatus = useCallback(async () => {
    try {
      const status = await offlineQuranStorage.getCacheStatus();
      setCacheStatus(status);
    } catch (err) {
      console.warn('Failed to update cache status:', err);
    }
  }, []);

  const handleSyncEvent = useCallback((event: SyncEvent) => {
    switch (event.type) {
      case 'start':
        setSyncStatus(prev => ({ ...prev, isSyncing: true, syncProgress: 0, error: undefined }));
        break;
        
      case 'progress':
        if (event.data?.progress !== undefined) {
          setSyncStatus(prev => ({ ...prev, syncProgress: event.data.progress }));
        }
        break;
        
      case 'complete':
        setSyncStatus(prev => ({ 
          ...prev, 
          isSyncing: false, 
          syncProgress: 100,
          lastSyncTime: event.timestamp,
          error: undefined
        }));
        loadCachedData();
        updateCacheStatus();
        break;
        
      case 'error':
        setSyncStatus(prev => ({ 
          ...prev, 
          isSyncing: false, 
          error: event.data?.error || 'Sync failed'
        }));
        setError(event.data?.error || 'Sync failed');
        break;
        
      case 'online':
        setSyncStatus(prev => ({ ...prev, isOnline: true }));
        break;
        
      case 'offline':
        setSyncStatus(prev => ({ ...prev, isOnline: true }));
        break;
    }
  }, [loadCachedData, updateCacheStatus]);

  const sync = useCallback(async () => {
    try {
      setError(null);
      await offlineSyncService.sync();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    }
  }, []);

  const downloadAudio = useCallback(async (
    surahNumber: number, 
    fromVerse: number = 1, 
    toVerse?: number
  ) => {
    try {
      setError(null);
      
      // In a real implementation, this would download from an API
      // For now, we'll create a mock audio segment
      const segment: AudioSegment = {
        surahNumber,
        fromVerse,
        toVerse: toVerse || fromVerse,
        url: `https://example.com/audio/${surahNumber}/${fromVerse}-${toVerse || fromVerse}.mp3`,
        size: 1024 * 1024, // 1MB mock size
        downloaded: true,
        blob: new Blob(['mock audio data'], { type: 'audio/mpeg' })
      };

      await offlineQuranStorage.cacheAudioSegment(segment);
      await loadCachedData();
      await updateCacheStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download audio');
    }
  }, [loadCachedData, updateCacheStatus]);

  const removeAudio = useCallback(async (
    surahNumber: number, 
    fromVerse?: number, 
    toVerse?: number
  ) => {
    try {
      setError(null);
      
      if (fromVerse && toVerse) {
        // Remove specific segment
        const segment = await offlineQuranStorage.getAudioSegment(surahNumber, fromVerse, toVerse);
        if (segment) {
          await offlineQuranStorage.cacheAudioSegment({ ...segment, downloaded: false, blob: undefined });
        }
      } else {
        // Remove all segments for the surah
        const segments = await offlineQuranStorage.getDownloadedSegments(surahNumber);
        for (const segment of segments) {
          await offlineQuranStorage.cacheAudioSegment({ ...segment, downloaded: false, blob: undefined });
        }
      }
      
      await loadCachedData();
      await updateCacheStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove audio');
    }
  }, [loadCachedData, updateCacheStatus]);

  const clearCache = useCallback(async () => {
    try {
      setError(null);
      await offlineSyncService.clearCache();
      setVerses([]);
      setSurahs([]);
      setAudioSegments([]);
      await updateCacheStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    }
  }, [updateCacheStatus]);

  const updateSyncConfig = useCallback((config: Partial<{
    autoSync: boolean;
    syncInterval: number;
    wifiOnly: boolean;
  }>) => {
    offlineSyncService.updateConfig(config);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    verses,
    surahs,
    audioSegments,
    
    // Status
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    syncProgress: syncStatus.syncProgress,
    lastSyncTime: syncStatus.lastSyncTime,
    cacheStatus,
    
    // Actions
    sync,
    downloadAudio,
    removeAudio,
    clearCache,
    
    // Configuration
    updateSyncConfig,
    
    // Error handling
    error,
    clearError
  };
}

// Utility hook for checking if specific content is available offline
export function useOfflineContentAvailability() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkAvailability = useCallback(async (contentType: 'verses' | 'surahs' | 'audio', identifier?: any) => {
    setIsChecking(true);
    
    try {
      let available = false;
      
      switch (contentType) {
        case 'verses':
          const verses = await offlineQuranStorage.getCachedVerses();
          available = verses.length > 0;
          break;
          
        case 'surahs':
          if (identifier) {
            const surah = await offlineQuranStorage.getSurahInfo(identifier);
            available = !!surah;
          } else {
            const surahs = await offlineQuranStorage.getAllSurahs();
            available = surahs.length > 0;
          }
          break;
          
        case 'audio':
          if (identifier?.surahNumber) {
            const segment = await offlineQuranStorage.getAudioSegment(
              identifier.surahNumber,
              identifier.fromVerse || 1,
              identifier.toVerse || identifier.fromVerse || 1
            );
            available = !!(segment && segment.downloaded && segment.blob);
          } else {
            const segments = await offlineQuranStorage.getDownloadedSegments();
            available = segments.length > 0;
          }
          break;
      }
      
      setIsAvailable(available);
    } catch (err) {
      console.warn('Failed to check availability:', err);
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    isAvailable,
    isChecking,
    checkAvailability
  };
}

// Hook for storage quota management
export function useStorageQuota() {
  const [quota, setQuota] = useState({ usage: 0, quota: 0, percentage: 0 });
  const [isChecking, setIsChecking] = useState(false);

  const checkQuota = useCallback(async () => {
    setIsChecking(true);
    
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const totalQuota = estimate.quota || 0;
        const percentage = totalQuota > 0 ? (usage / totalQuota) * 100 : 0;
        
        setQuota({ usage, quota: totalQuota, percentage });
      }
    } catch (err) {
      console.warn('Failed to check storage quota:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkQuota();
  }, [checkQuota]);

  return {
    ...quota,
    isChecking,
    checkQuota,
    isNearLimit: quota.percentage > 80,
    isLowSpace: quota.percentage > 90
  };
}
