/**
 * Backup & Restore - Export/Import all user data
 */
import { clearAllBooks, getStorageStats } from './ebooks-storage';

const BACKUP_VERSION = '1.0';

interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    theme: string | null;
    madhab: string | null;
    timeFormat: string | null;
    calculationMethod: string | null;
    tasbeehTotal: string | null;
    tasbeehHistory: string | null;
    favorites: string | null;
    bookmarks: string | null;
    prayerSettings: string | null;
    salahTracker: string | null;
    salahStreak: string | null;
    quranFontSize: string | null;
    selectedAdhan: string | null;
  };
}

// Export all user data
export const exportBackup = (): string => {
  const backup: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      theme: localStorage.getItem('theme'),
      madhab: localStorage.getItem('madhab'),
      timeFormat: localStorage.getItem('time-format'),
      calculationMethod: localStorage.getItem('calculation-method'),
      tasbeehTotal: localStorage.getItem('tasbeeh-total'),
      tasbeehHistory: localStorage.getItem('tasbeeh-history'),
      favorites: localStorage.getItem('favorites'),
      bookmarks: localStorage.getItem('bookmarks'),
      prayerSettings: localStorage.getItem('prayer-settings'),
      salahTracker: localStorage.getItem('salah-tracker'),
      salahStreak: localStorage.getItem('salah-streak'),
      quranFontSize: localStorage.getItem('quran-font-size'),
      selectedAdhan: localStorage.getItem('selected-adhan-id'),
    },
  };
  
  return JSON.stringify(backup, null, 2);
};

// Download backup as file
export const downloadBackup = (): void => {
  const backup = exportBackup();
  const blob = new Blob([backup], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `islamic-companion-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Import backup from file
export const importBackup = async (file: File): Promise<{ success: boolean; message: string }> => {
  try {
    const text = await file.text();
    const backup: BackupData = JSON.parse(text);
    
    if (!backup.version || !backup.data) {
      return { success: false, message: 'Invalid backup file format' };
    }
    
    // Restore all data
    Object.entries(backup.data).forEach(([key, value]) => {
      if (value !== null) {
        const storageKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        localStorage.setItem(storageKey, value);
      }
    });
    
    // Apply theme
    if (backup.data.theme) {
      document.documentElement.classList.toggle('dark', backup.data.theme === 'dark');
    }
    
    return { success: true, message: 'Backup restored successfully!' };
  } catch (error) {
    return { success: false, message: 'Failed to parse backup file' };
  }
};

// Clear all cache (PDFs and localforage)
export const clearCache = async (): Promise<void> => {
  await clearAllBooks();
  
  // Clear service worker caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
};

// Get Quran font size
export const getQuranFontSize = (): number => {
  return parseInt(localStorage.getItem('quran-font-size') || '24', 10);
};

export const setQuranFontSize = (size: number): void => {
  localStorage.setItem('quran-font-size', size.toString());
};
