/**
 * Reading Progress Tracker - localStorage based
 */

const PROGRESS_KEY = 'ebook-reading-progress';
const LAST_READ_KEY = 'ebook-last-read';
const BOOKMARKS_KEY = 'ebook-bookmarks';

export interface ReadingProgress {
  bookUrl: string;
  currentPage: number;
  totalPages: number;
  lastRead: number;
  completed: boolean;
}

export interface EbookBookmark {
  bookUrl: string;
  title: string;
  createdAt: number;
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

export const getBookBookmarks = (): EbookBookmark[] => {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is EbookBookmark =>
        item &&
        typeof item.bookUrl === 'string' &&
        typeof item.title === 'string' &&
        typeof item.createdAt === 'number'
    );
  } catch {
    return [];
  }
};

export const isBookBookmarked = (bookUrl: string): boolean => {
  return getBookBookmarks().some((bookmark) => bookmark.bookUrl === bookUrl);
};

export const toggleBookBookmark = (bookUrl: string, title: string): boolean => {
  const bookmarks = getBookBookmarks();
  const existingIndex = bookmarks.findIndex((bookmark) => bookmark.bookUrl === bookUrl);

  if (existingIndex >= 0) {
    bookmarks.splice(existingIndex, 1);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    return false;
  }

  bookmarks.push({
    bookUrl,
    title,
    createdAt: Date.now(),
  });
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return true;
};

export const removeBookBookmark = (bookUrl: string): void => {
  const bookmarks = getBookBookmarks().filter((bookmark) => bookmark.bookUrl !== bookUrl);
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
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
