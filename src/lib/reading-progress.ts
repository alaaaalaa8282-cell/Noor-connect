/**
 * Reading Progress Tracker - localStorage based
 */

const PROGRESS_KEY = 'ebook-reading-progress';
const LAST_READ_KEY = 'ebook-last-read';

export interface ReadingProgress {
  bookUrl: string;
  currentPage: number;
  totalPages: number;
  lastRead: number;
  completed: boolean;
}

const getAllProgress = (): Record<string, ReadingProgress> => {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const getReadingProgress = (bookUrl: string): ReadingProgress | null => {
  const all = getAllProgress();
  return all[bookUrl] || null;
};

export const saveReadingProgress = (
  bookUrl: string,
  currentPage: number,
  totalPages: number
): void => {
  const progress = getAllProgress();
  const completed = currentPage >= totalPages;
  
  progress[bookUrl] = {
    bookUrl,
    currentPage,
    totalPages,
    lastRead: Date.now(),
    completed,
  };
  
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  localStorage.setItem(LAST_READ_KEY, bookUrl);
};

export const getLastReadBook = (): string | null => {
  return localStorage.getItem(LAST_READ_KEY);
};

export const clearBookProgress = (bookUrl: string): void => {
  const progress = getAllProgress();
  delete progress[bookUrl];
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

export const getReadingStats = (): {
  totalBooks: number;
  completedBooks: number;
  inProgress: number;
} => {
  const progress = getAllProgress();
  const entries = Object.values(progress);
  
  return {
    totalBooks: entries.length,
    completedBooks: entries.filter(p => p.completed).length,
    inProgress: entries.filter(p => !p.completed && p.currentPage > 1).length,
  };
};

export const getProgressPercentage = (bookUrl: string): number => {
  const progress = getReadingProgress(bookUrl);
  if (!progress || progress.totalPages === 0) return 0;
  return Math.round((progress.currentPage / progress.totalPages) * 100);
};

export const getRecentlyRead = (limit: number = 5): ReadingProgress[] => {
  const progress = getAllProgress();
  return Object.values(progress)
    .sort((a, b) => b.lastRead - a.lastRead)
    .slice(0, limit);
};
