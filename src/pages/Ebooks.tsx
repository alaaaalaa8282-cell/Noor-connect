import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import {
  Search, Book, Download, Plus, X, Trash2, CheckCircle, Clock,
  BookOpen, Bookmark, BookmarkCheck, ArrowUpDown, HardDrive,
  TrendingUp, Star, Filter, ChevronRight, BarChart3, LibraryBig,
  Grid3X3, List
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLazyLoad } from "@/hooks/useLazyLoad";
import {
  getDownloadedBooks, getUserBooks, downloadBook,
  deleteDownloadedBook, deleteUserBook, addUserBook,
  formatFileSize, ensureHttps,
  type DownloadedBook, type UserBook
} from "@/lib/ebooks-storage";
import {
  getProgressPercentage, getRecentlyRead, getReadingStats,
  getLastReadBook, getBookBookmarks, toggleBookBookmark,
  type EbookBookmark, type ReadingProgress
} from "@/lib/reading-progress";
import ebooksData from "@/data/ebooks-library.json";
import PdfViewer from "@/components/PdfViewer";

// --- Types ---
interface LibraryBook {
  title: string;
  file: string;
  url: string;
  size: string;
}

const books = ebooksData as LibraryBook[];

// --- Category System ---
type BookCategory = 'Quran & Tafsir' | 'Hadith' | 'Fiqh' | 'Aqeedah' | 'Seerah' | 'Biography' | 'Dua & Dhikr' | 'Family & Women' | 'History' | 'Knowledge' | 'General';

const CATEGORY_CONFIG: Record<BookCategory, { color: string; hue: number; icon: string }> = {
  'Quran & Tafsir': { color: 'from-emerald-700 to-emerald-900', hue: 160, icon: '📖' },
  'Hadith': { color: 'from-amber-700 to-amber-900', hue: 40, icon: '📜' },
  'Fiqh': { color: 'from-blue-700 to-blue-900', hue: 220, icon: '⚖️' },
  'Aqeedah': { color: 'from-purple-700 to-purple-900', hue: 280, icon: '🕌' },
  'Seerah': { color: 'from-rose-700 to-rose-900', hue: 350, icon: '🌙' },
  'Biography': { color: 'from-orange-700 to-orange-900', hue: 30, icon: '👤' },
  'Dua & Dhikr': { color: 'from-teal-700 to-teal-900', hue: 175, icon: '🤲' },
  'Family & Women': { color: 'from-pink-700 to-pink-900', hue: 330, icon: '🏠' },
  'History': { color: 'from-stone-600 to-stone-800', hue: 25, icon: '🏰' },
  'Knowledge': { color: 'from-indigo-700 to-indigo-900', hue: 240, icon: '🎓' },
  'General': { color: 'from-slate-600 to-slate-800', hue: 210, icon: '📘' },
};

const CATEGORY_KEYWORDS: Record<BookCategory, string[]> = {
  'Quran & Tafsir': ['quran', 'quranic', 'tafsir', 'surah', 'kahf', 'yusuf', 'etiquette with the quran'],
  'Hadith': ['hadith', 'sunnah', 'sahaba', 'nawawi', 'bukhari', 'riyadh', 'adab al-mufrad', 'fabricated'],
  'Fiqh': ['fiqh', 'prayer', 'hajj', 'wudho', 'salah', 'funeral', 'marriage', 'financial', 'congregational', 'fasting', 'eid ', 'worship'],
  'Aqeedah': ['tawheed', 'aqeedah', 'creed', 'shirk', 'belief', 'names of allah', 'predestination', 'divine will', 'nullifiers'],
  'Seerah': ['prophet', 'messenger', 'seerah', 'sealed nectar', 'muhammad'],
  'Biography': ['biography', 'biographies', 'ali ibn', 'umar ', 'abu bakr', 'caliphs', 'companions', 'commanders', 'hasan ibn'],
  'Dua & Dhikr': ['dua', 'dhikr', 'supplication', 'invocation', 'fortress'],
  'Family & Women': ['women', 'family', 'child', 'children', 'marriage', 'marital', 'parent', 'youth', 'garment', 'home', 'hijab'],
  'History': ['history', 'conquests', 'atlas', 'early days', 'ottoman', 'caliphate', 'war', 'muslim lands'],
  'Knowledge': ['knowledge', 'education', 'learning', 'scholar', 'advice', 'seeker', 'ilm', 'lessons'],
  'General': [],
};

function detectCategory(title: string): BookCategory {
  const lowerTitle = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'General') continue;
    if (keywords.some(kw => lowerTitle.includes(kw))) {
      return category as BookCategory;
    }
  }
  return 'General';
}

// --- Text-to-Speech System ---
const initializeTTS = (setTtsVoice: React.Dispatch<React.SetStateAction<SpeechSynthesisVoice | null>>) => {
  if ('speechSynthesis' in window) {
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en') || voice.lang.includes('ar') || voice.lang.includes('ur')
    ) || voices[0];
    setTtsVoice(preferredVoice);
  }
};

const speakText = (text: string, voice: SpeechSynthesisVoice | null) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }
};

const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// --- Collections System ---
interface Collection {
  id: string;
  name: string;
  description: string;
  books: string[];
  color: string;
  icon: string;
  createdAt: Date;
}

const createCollection = (name: string, description: string, color: string, icon: string): Collection => {
  return {
    id: Date.now().toString(),
    name,
    description,
    books: [],
    color,
    icon,
    createdAt: new Date()
  };
};

const getCollections = (): Collection[] => {
  const stored = localStorage.getItem('book-collections');
  return stored ? JSON.parse(stored) : [
    {
      id: '1',
      name: 'Ramadan Reading',
      description: 'Books to read during Ramadan',
      books: [],
      color: 'from-emerald-500 to-emerald-700',
      icon: '🌙',
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Islamic Studies',
      description: 'Books for learning Islam',
      books: [],
      color: 'from-blue-500 to-blue-700',
      icon: '🎓',
      createdAt: new Date()
    }
  ];
};

const saveCollections = (collections: Collection[]): void => {
  localStorage.setItem('book-collections', JSON.stringify(collections));
};

const addBookToCollection = (collectionId: string, bookUrl: string): void => {
  const collections = getCollections();
  const collection = collections.find(c => c.id === collectionId);
  if (collection && !collection.books.includes(bookUrl)) {
    collection.books.push(bookUrl);
    saveCollections(collections);
  }
};

const removeBookFromCollection = (collectionId: string, bookUrl: string): void => {
  const collections = getCollections();
  const collection = collections.find(c => c.id === collectionId);
  if (collection) {
    collection.books = collection.books.filter(url => url !== bookUrl);
    saveCollections(collections);
  }
};

// --- New Arrivals System ---
const getNewArrivals = (allBooks: LibraryBook[]): LibraryBook[] => {
  // Simulate new arrivals by taking a random selection
  // In a real app, this would be based on actual addition dates
  return allBooks
    .filter(book => !book.title.toLowerCase().includes('read me first'))
    .sort(() => Math.random() - 0.5) // Randomize for demo
    .slice(0, 8); // Show 8 new arrivals
};

// --- Trending Books System ---
const getTrendingBooks = (allBooks: LibraryBook[]): LibraryBook[] => {
  // Simulate trending books based on popular categories
  const popularCategories: BookCategory[] = [
    'Quran & Tafsir', 'Hadith', 'Fiqh', 'Seerah', 'Dua & Dhikr'
  ];
  
  return allBooks
    .filter(book => {
      const title = cleanTitle(book.title);
      if (title.toLowerCase().includes('read me first')) return false;
      const category = detectCategory(title);
      return popularCategories.includes(category);
    })
    .sort(() => Math.random() - 0.5) // Randomize for demo
    .slice(0, 12); // Show 12 trending books
};

// --- Recommendation System ---
const generateRecommendations = (recentBooks: ReadingProgress[], allBooks: LibraryBook[]): LibraryBook[] => {
  if (recentBooks.length === 0) {
    // If no reading history, return popular books
    return allBooks
      .filter(book => !book.title.toLowerCase().includes('read me first'))
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
  }

  // Get categories user has read
  const readCategories = new Set<string>();
  const readTitles = new Set<string>();
  
  recentBooks.forEach(item => {
    const book = allBooks.find(b => ensureHttps(b.url) === item.bookUrl);
    if (book) {
      readCategories.add(detectCategory(cleanTitle(book.title)));
      readTitles.add(book.title);
    }
  });

  // Find books in similar categories that haven't been read
  const recommendations = allBooks
    .filter(book => {
      const title = cleanTitle(book.title);
      if (readTitles.has(title)) return false; // Already read
      if (title.toLowerCase().includes('read me first')) return false; // Skip system books
      
      const category = detectCategory(title);
      return readCategories.has(category); // Same category as read books
    })
    .sort(() => Math.random() - 0.5) // Randomize
    .slice(0, 8); // Limit to 8 recommendations

  return recommendations;
};

// --- Helpers ---
const cleanTitle = (title: string): string => title.replace(/\.pdf$/i, '').replace(/_/g, ' ').trim();

const formatSize = (sizeStr: string): string => {
  const bytes = parseInt(sizeStr, 10);
  if (isNaN(bytes)) return '';
  return formatFileSize(bytes);
};

type SortOption = 'a-z' | 'z-a' | 'size-asc' | 'size-desc';

// --- Main Component ---
export default function Ebooks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [recommendedBooks, setRecommendedBooks] = useState<LibraryBook[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<LibraryBook[]>([]);
  const [newArrivals, setNewArrivals] = useState<LibraryBook[]>([]);
  const [readingGoals, setReadingGoals] = useState({
    daily: { pages: 10, enabled: false },
    weekly: { pages: 50, enabled: false },
    streak: { days: 0, enabled: true }
  });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsVoice, setTtsVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [downloadedBooks, setDownloadedBooks] = useState<DownloadedBook[]>([]);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [viewingBook, setViewingBook] = useState<{ url: string; title: string; localKey?: string } | null>(null);
  const [recentlyRead, setRecentlyRead] = useState<ReadingProgress[]>([]);
  const [readingStats, setReadingStats] = useState({ totalBooks: 0, completedBooks: 0, inProgress: 0 });
  const [bookmarks, setBookmarks] = useState<EbookBookmark[]>([]);
  const [lastReadBookKey, setLastReadBookKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("browse");
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [selectedBookForCollection, setSelectedBookForCollection] = useState<LibraryBook | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const LOCAL_PREFIX = 'local:';

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load data
  useEffect(() => {
    const load = async () => {
      const [downloaded, user] = await Promise.all([getDownloadedBooks(), getUserBooks()]);
      setDownloadedBooks(downloaded);
      setUserBooks(user);
      setRecentlyRead(getRecentlyRead(5));
      setReadingStats(getReadingStats());
      setBookmarks(getBookBookmarks());
      setLastReadBookKey(getLastReadBook());
      setCollections(getCollections());
      
      // Generate recommendations based on reading history
      const recommendations = generateRecommendations(getRecentlyRead(10), books);
      setRecommendedBooks(recommendations);
      
      // Get trending books
      const trending = getTrendingBooks(books);
      setTrendingBooks(trending);
      
      // Get new arrivals
      const arrivals = getNewArrivals(books);
      setNewArrivals(arrivals);
      
      // Initialize TTS
      initializeTTS(setTtsVoice);
    };
    load();
  }, [viewingBook]);
  
  // Initialize TTS on mount
  useEffect(() => {
    initializeTTS(setTtsVoice);
    
    // Listen for voice changes
    const handleVoiceChange = () => initializeTTS(setTtsVoice);
    window.speechSynthesis?.addEventListener('voiceschanged', handleVoiceChange);
    
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', handleVoiceChange);
    };
  }, []);

  const getBookKey = useCallback((book: LibraryBook | DownloadedBook | UserBook): string => {
    if ("url" in book && book.url) return ensureHttps(book.url);
    return `${LOCAL_PREFIX}${(book as UserBook | DownloadedBook).localKey}`;
  }, []);

  const bookmarkedSet = useMemo(() => new Set(bookmarks.map(b => b.bookUrl)), [bookmarks]);

  const handleToggleBookmark = useCallback((book: LibraryBook | DownloadedBook | UserBook) => {
    const bookKey = getBookKey(book);
    const title = "file" in book ? cleanTitle(book.title) : book.title;
    const isNowBookmarked = toggleBookBookmark(bookKey, title);
    setBookmarks(getBookBookmarks());
    toast({
      title: isNowBookmarked ? "Bookmarked" : "Bookmark removed",
      description: `${title} ${isNowBookmarked ? "added to" : "removed from"} bookmarks`,
    });
  }, [getBookKey, toast]);

  // PDF viewer back button
  useEffect(() => {
    if (viewingBook) {
      window.history.pushState({ pdfOpen: true }, '');
      const handlePopState = () => setViewingBook(null);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [viewingBook]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    books
      .filter(b => !b.title.toLowerCase().includes('read me first') && !b.title.toLowerCase().includes('table of contents'))
      .forEach(b => {
        const cat = detectCategory(cleanTitle(b.title));
        counts[cat] = (counts[cat] || 0) + 1;
      });
    return counts;
  }, []);

  // Filtered and sorted books
  const filteredBooks = useMemo(() => {
    let filtered = books.filter(b =>
      !b.title.toLowerCase().includes('read me first') && !b.title.toLowerCase().includes('table of contents')
    );

    if (selectedCategory) {
      filtered = filtered.filter(b => detectCategory(cleanTitle(b.title)) === selectedCategory);
    }

    if (selectedLetter) {
      filtered = filtered.filter(b => {
        const firstChar = cleanTitle(b.title).charAt(0).toUpperCase();
        return (/[A-Z]/.test(firstChar) ? firstChar : '#') === selectedLetter;
      });
    }

    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter(b => cleanTitle(b.title).toLowerCase().includes(query));
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'a-z': sorted.sort((a, b) => cleanTitle(a.title).localeCompare(cleanTitle(b.title))); break;
      case 'z-a': sorted.sort((a, b) => cleanTitle(b.title).localeCompare(cleanTitle(a.title))); break;
      case 'size-asc': sorted.sort((a, b) => parseInt(a.size) - parseInt(b.size)); break;
      case 'size-desc': sorted.sort((a, b) => parseInt(b.size) - parseInt(a.size)); break;
    }

    return sorted;
  }, [selectedCategory, selectedLetter, debouncedQuery, sortBy]);

  // Lazy loading
  const { visibleItems, hasMore, loadMoreRef } = useLazyLoad(filteredBooks, {
    initialLoadCount: 12,
    batchSize: 24,
    rootMargin: '200px'
  });

  // A-Z letter list
  const letterCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    books.filter(b => !b.title.toLowerCase().includes('read me first'))
      .forEach(b => {
        const c = cleanTitle(b.title).charAt(0).toUpperCase();
        const letter = /[A-Z]/.test(c) ? c : '#';
        counts[letter] = (counts[letter] || 0) + 1;
      });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).map(([letter, count]) => ({ letter, count }));
  }, []);

  const isDownloaded = useCallback((url: string) =>
    downloadedBooks.some(b => b.url === ensureHttps(url)), [downloadedBooks]);

  const getDownloadedBookData = useCallback((url: string) =>
    downloadedBooks.find(b => b.url === ensureHttps(url)), [downloadedBooks]);

  // Resolve book by key
  const resolveOpenTargetByKey = useCallback((bookKey: string): (LibraryBook | DownloadedBook | UserBook | null) => {
    if (bookKey.startsWith(LOCAL_PREFIX)) {
      const localKey = bookKey.slice(LOCAL_PREFIX.length);
      return userBooks.find(b => b.localKey === localKey) || downloadedBooks.find(b => b.localKey === localKey) || null;
    }
    const secureKey = ensureHttps(bookKey);
    return books.find(b => ensureHttps(b.url) === secureKey) || downloadedBooks.find(b => ensureHttps(b.url) === secureKey) || null;
  }, [downloadedBooks, userBooks]);

  const lastReadEntry = useMemo(() => {
    if (!lastReadBookKey) return null;
    const openTarget = resolveOpenTargetByKey(lastReadBookKey);
    if (!openTarget) return null;
    return {
      openTarget,
      bookKey: lastReadBookKey,
      title: "file" in openTarget ? cleanTitle(openTarget.title) : openTarget.title,
      progress: getProgressPercentage(lastReadBookKey),
    };
  }, [lastReadBookKey, resolveOpenTargetByKey]);

  const bookmarkedEntries = useMemo(() => {
    return bookmarks
      .map(bookmark => {
        const openTarget = resolveOpenTargetByKey(bookmark.bookUrl);
        if (!openTarget) return null;
        const title = "file" in openTarget ? cleanTitle(openTarget.title) : openTarget.title;
        return { bookmark, openTarget, title, progress: getProgressPercentage(bookmark.bookUrl) };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [bookmarks, resolveOpenTargetByKey]);

  // Storage used
  const storageUsed = useMemo(() => {
    const total = downloadedBooks.reduce((sum, b) => sum + b.fileSize, 0) + userBooks.reduce((sum, b) => sum + b.fileSize, 0);
    return formatFileSize(total);
  }, [downloadedBooks, userBooks]);

  // Handlers
  const handleDownload = async (book: LibraryBook) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [book.url]: 0 }));
      const downloaded = await downloadBook(
        { title: cleanTitle(book.title), url: book.url, category: '' },
        (progress) => setDownloadProgress(prev => ({ ...prev, [book.url]: progress }))
      );
      setDownloadedBooks(prev => [...prev, downloaded]);
      setDownloadProgress(prev => { const s = { ...prev }; delete s[book.url]; return s; });
      toast({ title: "Downloaded", description: `${cleanTitle(book.title)} saved for offline reading` });
    } catch {
      setDownloadProgress(prev => { const s = { ...prev }; delete s[book.url]; return s; });
      toast({ title: "Download failed", description: "Try opening in browser instead", variant: "destructive" });
    }
  };

  const handleDelete = async (url: string) => {
    await deleteDownloadedBook(url);
    setDownloadedBooks(prev => prev.filter(b => b.url !== url));
    toast({ title: "Deleted", description: "Book removed from device" });
  };

  const handleDeleteUserBook = async (id: string) => {
    await deleteUserBook(id);
    setUserBooks(prev => prev.filter(b => b.id !== id));
    toast({ title: "Deleted", description: "Book removed from device" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast({ title: "Invalid file", description: "Please select a PDF file", variant: "destructive" });
      return;
    }
    try {
      const title = file.name.replace('.pdf', '');
      const userBook = await addUserBook(file, title);
      setUserBooks(prev => [...prev, userBook]);
      toast({ title: "Added", description: `${title} added to your library` });
    } catch {
      toast({ title: "Error", description: "Failed to add book", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Collection Management Handlers ---
  const handleAddToCollection = (book: LibraryBook) => {
    setSelectedBookForCollection(book);
    setShowCollectionDialog(true);
  };

  const handleConfirmAddToCollection = () => {
    if (selectedBookForCollection && selectedCollectionId) {
      addBookToCollection(selectedCollectionId, ensureHttps(selectedBookForCollection.url));
      const updated = getCollections();
      setCollections(updated);
      toast({
        title: "Added to collection",
        description: `${cleanTitle(selectedBookForCollection.title)} added to collection`
      });
    }
    setShowCollectionDialog(false);
    setSelectedBookForCollection(null);
    setSelectedCollectionId(null);
  };

  const handleRemoveFromCollection = (collectionId: string, bookUrl: string) => {
    removeBookFromCollection(collectionId, bookUrl);
    const updated = getCollections();
    setCollections(updated);
    toast({
      title: "Removed from collection",
      description: "Book removed from collection"
    });
  };

  const handleDeleteCollection = (collectionId: string) => {
    const updated = collections.filter(c => c.id !== collectionId);
    setCollections(updated);
    saveCollections(updated);
    toast({
      title: "Collection deleted",
      description: "Collection has been removed"
    });
  };

  const getBooksInCollection = (collectionId: string): LibraryBook[] => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return [];
    return collection.books
      .map(bookUrl => books.find(b => ensureHttps(b.url) === bookUrl))
      .filter((book): book is LibraryBook => book !== undefined);
  };

  const isBookInCollection = (collectionId: string, bookUrl: string): boolean => {
    const collection = collections.find(c => c.id === collectionId);
    return collection ? collection.books.includes(bookUrl) : false;
  };

  // --- Reading Goals System ---
  const updateReadingGoal = (goalType: 'daily' | 'weekly', pages: number) => {
    setReadingGoals(prev => ({
      ...prev,
      [goalType]: { pages, enabled: true }
    }));
    
    // Update reading stats when goals are met
    const today = new Date().toDateString();
    const todayStats = JSON.parse(localStorage.getItem(`reading-stats-${today}`) || '{}');
    const totalPagesRead = todayStats.totalPages || 0;
    
    // Check if daily goal is met
    if (readingGoals.daily.enabled && totalPagesRead >= readingGoals.daily.pages) {
      localStorage.setItem('daily-goal-met', new Date().toISOString());
    }
  };

  const openBook = (book: LibraryBook | DownloadedBook | UserBook) => {
    if ('url' in book && book.url) {
      const downloaded = getDownloadedBookData(book.url);
      setViewingBook({ url: ensureHttps(book.url), title: 'file' in book ? cleanTitle(book.title) : book.title, localKey: downloaded?.localKey });
    } else if ('localKey' in book) {
      setViewingBook({ url: '', title: book.title, localKey: book.localKey });
    }
  };

  if (viewingBook) {
    return <PdfViewer url={viewingBook.url} title={viewingBook.title} localKey={viewingBook.localKey} onClose={() => window.history.back()} />;
  }

  // --- BookListItem ---
  const BookListItem = memo(({ 
    book, 
    showProgress = false, 
    onOpen, 
    onToggleBookmark 
  }: { 
    book: LibraryBook; 
    showProgress?: boolean; 
    onOpen: () => void;
    onToggleBookmark: () => void;
  }) => {
    const downloaded = isDownloaded(book.url);
    const readProgress = getProgressPercentage(ensureHttps(book.url));
    const bookKey = ensureHttps(book.url);
    const isBookmarked = bookmarkedSet.has(bookKey);
    const title = cleanTitle(book.title);
    const size = formatSize(book.size);
    const category = detectCategory(title);
    const catConfig = CATEGORY_CONFIG[category];
    const [showCollectionMenu, setShowCollectionMenu] = useState(false);

    return (
      <Card className="p-3 hover:bg-accent/50 transition-colors cursor-pointer group"
            onClick={onOpen}>
        <div className="flex gap-3">
          {/* Book Cover Thumbnail */}
          <div className="w-12 h-16 rounded-lg bg-gradient-to-br flex-shrink-0 relative overflow-hidden"
               style={{ background: `linear-gradient(135deg, ${catConfig.color.split(' ')[0]}, ${catConfig.color.split(' ')[2]})` }}>
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-[0.06]"
                 style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 0L40 20L20 40L0 20z\' fill=\'%23fff\' fill-opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '20px 20px' }}
            />
            
            {/* Content */}
            <div className="absolute inset-0 p-2 flex flex-col items-center justify-center text-white">
              <div className="text-lg mb-1">{catConfig.icon}</div>
              <div className="text-[9px] opacity-60 font-medium tracking-wider uppercase">{category}</div>
            </div>
            
            {/* Progress indicator */}
            {showProgress && readProgress > 0 && (
              <div className="absolute bottom-0 inset-inline-start-0 inset-inline-end-0 h-0.5 bg-black/30">
                <div className="h-full bg-emerald-400 transition-all" style={{ width: `${readProgress}%` }} />
              </div>
            )}
            
            {/* Downloaded indicator */}
            {downloaded && (
              <div className="absolute top-1 inset-inline-end-1">
                <CheckCircle className="w-3 h-3 text-emerald-300" />
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">
                {title}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="icon" variant="ghost" className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}>
                  {isBookmarked
                    ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
                    : <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />}
                </Button>
                <div className="relative">
                  <Button size="icon" variant="ghost" className="h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); setShowCollectionMenu(!showCollectionMenu); }}>
                    <LibraryBig className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  {showCollectionMenu && collections.length > 0 && (
                    <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-xl z-50 py-1 w-40">
                      {collections.map(collection => (
                        <button key={collection.id}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors ${
                            isBookInCollection(collection.id, bookKey) ? 'text-primary font-medium bg-primary/5' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isBookInCollection(collection.id, bookKey)) {
                              handleRemoveFromCollection(collection.id, bookKey);
                            } else {
                              addBookToCollection(collection.id, bookKey);
                              const updated = getCollections();
                              setCollections(updated);
                              toast({
                                title: "Added to collection",
                                description: `${title} added to ${collection.name}`
                              });
                            }
                            setShowCollectionMenu(false);
                          }}>
                          {collection.icon} {collection.name}
                          {isBookInCollection(collection.id, bookKey) && ' ✓'}
                        </button>
                      ))}
                      <button className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors border-t border-border/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCollection(book);
                                setShowCollectionMenu(false);
                              }}>
                        <Plus className="w-3 h-3 inline mr-1" /> New Collection
                      </button>
                    </div>
                  )}
                </div>
                {!downloaded && (
                  <Button size="sm" className="h-6 px-2 text-xs"
                          onClick={(e) => { e.stopPropagation(); handleDownload(book); }}>
                    <Download className="w-3 h-3 me-1" />
                    Download
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{size}</span>
              <div className="flex items-center gap-2">
                {showProgress && readProgress > 0 && (
                  <Badge variant="secondary" className="text-[9px]">
                    {readProgress}% read
                  </Badge>
                )}
                <span className="text-[9px]">{category}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onOpen}>
              <BookOpen className="w-4 h-4" />
            </Button>
            {downloaded && (
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" 
                      onClick={(e) => { e.stopPropagation(); handleDelete(book.url); }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  });
  BookListItem.displayName = 'BookListItem';

  // --- BookCard ---
  const BookCard = memo(({ book, showProgress = false }: { book: LibraryBook; showProgress?: boolean }) => {
    const downloaded = isDownloaded(book.url);
    const progress = downloadProgress[book.url];
    const readProgress = getProgressPercentage(ensureHttps(book.url));
    const bookKey = ensureHttps(book.url);
    const isBookmarked = bookmarkedSet.has(bookKey);
    const title = cleanTitle(book.title);
    const size = formatSize(book.size);
    const category = detectCategory(title);
    const catConfig = CATEGORY_CONFIG[category];
    const [showCollectionMenu, setShowCollectionMenu] = useState(false);

    return (
      <div className="group relative flex flex-col gap-2 cursor-pointer" onClick={() => openBook(book)}>
        {/* Book Cover */}
        <div className="aspect-[2/3] w-full relative rounded-xl overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
          {/* Cover Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${catConfig.color}`} />

          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 0L40 20L20 40L0 20z\' fill=\'%23fff\' fill-opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '20px 20px' }}
          />

          {/* Spine Effect */}
          <div className="absolute inset-inline-start-0 top-0 bottom-0 w-1.5 bg-white/15" />

          {/* Cover Content */}
          <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">
            <div className="flex items-start justify-between">
              <div className="text-[9px] opacity-60 font-medium tracking-wider uppercase">{category}</div>
              <div className="flex items-center gap-1">
                <Button variant="secondary" size="icon"
                  className="h-6 w-6 bg-black/25 hover:bg-black/45 border-0"
                  onClick={(e) => { e.stopPropagation(); handleToggleBookmark(book); }}
                >
                  {isBookmarked
                    ? <BookmarkCheck className="w-3.5 h-3.5 text-emerald-300" />
                    : <Bookmark className="w-3.5 h-3.5 text-white/70" />}
                </Button>
                <div className="relative">
                  <Button variant="secondary" size="icon"
                    className="h-6 w-6 bg-black/25 hover:bg-black/45 border-0"
                    onClick={(e) => { e.stopPropagation(); setShowCollectionMenu(!showCollectionMenu); }}
                  >
                    <LibraryBig className="w-3.5 h-3.5 text-white/70" />
                  </Button>
                  {showCollectionMenu && collections.length > 0 && (
                    <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-xl z-50 py-1 w-40">
                      {collections.map(collection => (
                        <button key={collection.id}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors ${
                            isBookInCollection(collection.id, bookKey) ? 'text-primary font-medium bg-primary/5' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isBookInCollection(collection.id, bookKey)) {
                              handleRemoveFromCollection(collection.id, bookKey);
                            } else {
                              addBookToCollection(collection.id, bookKey);
                              const updated = getCollections();
                              setCollections(updated);
                              toast({
                                title: "Added to collection",
                                description: `${title} added to ${collection.name}`
                              });
                            }
                            setShowCollectionMenu(false);
                          }}>
                          {collection.icon} {collection.name}
                          {isBookInCollection(collection.id, bookKey) && ' ✓'}
                        </button>
                      ))}
                      <button className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors border-t border-border/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCollection(book);
                                setShowCollectionMenu(false);
                              }}>
                        <Plus className="w-3 h-3 inline mr-1" /> New Collection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center flex-1 flex flex-col items-center justify-center px-1">
              <div className="text-xl mb-2">{catConfig.icon}</div>
              <h3 className="text-[11px] font-semibold leading-tight line-clamp-4 drop-shadow-sm">{title}</h3>
            </div>

            <div className="flex justify-between items-end">
              <div className="text-[9px] opacity-70 bg-black/20 px-1.5 py-0.5 rounded">{size}</div>
              {downloaded && <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />}
            </div>
          </div>

          {/* Read Progress Bar */}
          {showProgress && readProgress > 0 && (
            <div className="absolute bottom-0 inset-inline-start-0 inset-inline-end-0 h-1 bg-black/30">
              <div className="h-full bg-emerald-400 transition-all" style={{ width: `${readProgress}%` }} />
            </div>
          )}

          {/* Download Progress Overlay */}
          {progress !== undefined && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-lg font-bold">{progress}%</div>
                <div className="w-24 h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
            <Button size="sm" variant="secondary" className="w-full text-xs h-8">
              <BookOpen className="w-3 h-3 me-2" /> Read Now
            </Button>
            {!downloaded && progress === undefined && (
              <Button size="sm" className="w-full text-xs h-8"
                onClick={(e) => { e.stopPropagation(); handleDownload(book); }}>
                <Download className="w-3 h-3 me-2" /> Download
              </Button>
            )}
          </div>
        </div>

        {/* Meta below cover */}
        <div className="space-y-0.5 px-0.5">
          <h4 className="text-xs font-medium truncate leading-tight group-hover:text-primary transition-colors">{title}</h4>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{size}</span>
            {showProgress && readProgress > 0 && <span className="text-emerald-500 font-medium">{readProgress}%</span>}
          </div>
        </div>
      </div>
    );
  });
  BookCard.displayName = 'BookCard';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <LibraryBig className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Islamic Library</h1>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Sort & View Controls */}
            <div className="flex items-center gap-1.5">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  className="h-6 w-6 px-1"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  className="h-6 w-6 px-1"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Sort */}
              <div className="relative">
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => setShowSortMenu(!showSortMenu)}>
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
                {showSortMenu && (
                  <div className="absolute right-0 top-9 bg-card border border-border rounded-lg shadow-xl z-50 py-1 w-40">
                    {[
                      { value: 'a-z' as SortOption, label: 'A → Z' },
                      { value: 'z-a' as SortOption, label: 'Z → A' },
                      { value: 'size-asc' as SortOption, label: 'Size ↑' },
                      { value: 'size-desc' as SortOption, label: 'Size ↓' },
                    ].map(opt => (
                      <button key={opt.value}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors ${sortBy === opt.value ? 'text-primary font-medium bg-primary/5' : ''}`}
                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* TTS Toggle */}
              {ttsVoice && (
                <Button
                  variant={ttsEnabled ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  title={ttsEnabled ? 'Disable Text-to-Speech' : 'Enable Text-to-Speech'}
                >
                  {ttsEnabled ? (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🔊</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs">🔇</span>
                    </div>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search 200+ Islamic books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10 pe-10 bg-card rounded-xl"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute inset-inline-end-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </header>

      {/* Stats Bar */}
      <div className="px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><Book className="w-3.5 h-3.5 inline me-1" />{filteredBooks.length} books</span>
            <span><Download className="w-3.5 h-3.5 inline me-1" />{downloadedBooks.length} saved</span>
            <span><HardDrive className="w-3.5 h-3.5 inline me-1" />{storageUsed}</span>
          </div>
          {readingStats.inProgress > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              <TrendingUp className="w-3 h-3 me-1" />{readingStats.inProgress} reading
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 py-3">
        <TabsList className="w-full grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 mb-4 h-9">
          <TabsTrigger value="browse" className="text-[11px]">Browse</TabsTrigger>
          <TabsTrigger value="recommended" className="text-[11px] relative">
            For You
            {recommendedBooks.length > 0 && (
              <span className="absolute -top-1 -inset-inline-end-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center">
                {recommendedBooks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="trending" className="text-[11px] relative">
            Trending
            {trendingBooks.length > 0 && (
              <span className="absolute -top-1 -inset-inline-end-1 w-4 h-4 bg-amber-500 text-white text-[9px] rounded-full flex items-center justify-center">
                🔥
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="new" className="text-[11px] relative">
            New
            {newArrivals.length > 0 && (
              <span className="absolute -top-1 -inset-inline-end-1 w-4 h-4 bg-green-500 text-white text-[9px] rounded-full flex items-center justify-center">
                ✨
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="collections" className="text-[11px] relative">
            Collections
            {collections.length > 0 && (
              <span className="absolute -top-1 -inset-inline-end-1 w-4 h-4 bg-purple-500 text-white text-[9px] rounded-full flex items-center justify-center">
                {collections.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-[11px]">Topics</TabsTrigger>
          <TabsTrigger value="bookmarks" className="text-[11px] relative">
            Saved
            {bookmarks.length > 0 && (
              <span className="absolute -top-1 -inset-inline-end-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center">
                {bookmarks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="downloads" className="text-[11px]">Offline</TabsTrigger>
          <TabsTrigger value="upload" className="text-[11px]">Add</TabsTrigger>
        </TabsList>

        {/* ===== COLLECTIONS TAB ===== */}
        <TabsContent value="collections" className="space-y-4 mt-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">My Collections</h3>
            <Button size="sm" onClick={() => {
              const newCollection = createCollection('New Collection', 'Create your own book collection', 'from-purple-500 to-purple-700', '📚');
              setCollections(prev => [...prev, newCollection]);
              saveCollections([...collections, newCollection]);
            }}>
              <Plus className="w-4 h-4 me-2" /> Create Collection
            </Button>
          </div>
          
          {collections.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <p className="text-muted-foreground font-medium">No collections yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create collections to organize your books by topic or reading goals</p>
              <Button variant="outline" className="mt-4" onClick={() => setActiveTab("browse")}>Browse Books</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {collections.map((collection) => {
                const booksInCollection = getBooksInCollection(collection.id);
                return (
                  <Card key={collection.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${collection.color} flex items-center justify-center shrink-0`}>
                        <span className="text-lg">{collection.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">{collection.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{collection.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{booksInCollection.length} books</span>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                              onClick={() => handleDeleteCollection(collection.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {booksInCollection.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {booksInCollection.map((book) => {
                                const bookKey = ensureHttps(book.url);
                                const isBookmarked = bookmarkedSet.has(bookKey);
                                const title = cleanTitle(book.title);
                                const category = detectCategory(title);
                                const catConfig = CATEGORY_CONFIG[category];
                                
                                return (
                                  <div key={book.url} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                    <div className="w-8 h-10 rounded bg-gradient-to-br flex-shrink-0 relative overflow-hidden"
                                         style={{ background: `linear-gradient(135deg, ${catConfig.color.split(' ')[0]}, ${catConfig.color.split(' ')[2]})` }}>
                                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                                        {catConfig.icon}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{title}</p>
                                      <p className="text-[9px] text-muted-foreground">{category}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button size="icon" variant="ghost" className="h-6 w-6"
                                              onClick={() => openBook(book)}>
                                        <BookOpen className="w-3 h-3" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                                              onClick={() => handleRemoveFromCollection(collection.id, ensureHttps(book.url))}>
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {booksInCollection.length === 0 && (
                          <div className="mt-3 text-center py-4 bg-muted/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">No books in this collection yet</p>
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => setActiveTab("browse")}>
                              Browse Books to Add
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== NEW ARRIVALS TAB ===== */}
        <TabsContent value="new" className="space-y-4 mt-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✨</span>
              </div>
              <h3 className="text-sm font-semibold">New Arrivals</h3>
            </div>
            <p className="text-xs text-muted-foreground">Freshly added Islamic books</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {newArrivals.map((book, i) => (
              <BookCard key={`new-${book.url}-${i}`} book={book} showProgress />
            ))}
          </div>
        </TabsContent>

        {/* ===== TRENDING TAB ===== */}
        <TabsContent value="trending" className="space-y-4 mt-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold">Trending Books</h3>
            </div>
            <p className="text-xs text-muted-foreground">Popular books in the community</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {trendingBooks.map((book, i) => (
              <BookCard key={`trending-${book.url}-${i}`} book={book} showProgress />
            ))}
          </div>
        </TabsContent>

        {/* ===== RECOMMENDED TAB ===== */}
        <TabsContent value="recommended" className="space-y-4 mt-0">
          {recommendedBooks.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No recommendations yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start reading books to get personalized recommendations</p>
              <Button variant="outline" className="mt-4" onClick={() => setActiveTab("browse")}>Browse Library</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold">Recommended for You</h3>
                <p className="text-xs text-muted-foreground">Based on your reading history</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {recommendedBooks.map((book, i) => (
                  <BookCard key={`recommended-${book.url}-${i}`} book={book} showProgress />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ===== BROWSE TAB ===== */}
        <TabsContent value="browse" className="space-y-4 mt-0">
          {/* Continue Reading Hero */}
          {lastReadEntry && !debouncedQuery && !selectedLetter && (
            <Card className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 cursor-pointer hover:bg-primary/15 transition-colors"
              onClick={() => openBook(lastReadEntry.openTarget)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-16 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-primary font-medium uppercase tracking-wider">Continue Reading</p>
                  <p className="font-semibold text-sm truncate mt-0.5">{lastReadEntry.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Progress value={lastReadEntry.progress} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground shrink-0">{lastReadEntry.progress}%</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </Card>
          )}

          {/* Reading Stats */}
          {readingStats.totalBooks > 0 && !debouncedQuery && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-card rounded-xl p-3 text-center border border-border/50">
                  <BarChart3 className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{readingStats.totalBooks}</p>
                  <p className="text-[10px] text-muted-foreground">Started</p>
                </div>
                <div className="bg-card rounded-xl p-3 text-center border border-border/50">
                  <TrendingUp className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{readingStats.inProgress}</p>
                  <p className="text-[10px] text-muted-foreground">In Progress</p>
                </div>
                <div className="bg-card rounded-xl p-3 text-center border border-border/50">
                  <Star className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{readingStats.completedBooks}</p>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                </div>
              </div>
              
              </div>
          )}

          {/* Recently Read */}
          {recentlyRead.length > 0 && !debouncedQuery && !selectedLetter && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" /> Recently Read
              </h3>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {recentlyRead.map((item) => {
                    const openTarget = resolveOpenTargetByKey(item.bookUrl);
                    if (!openTarget) return null;
                    const itemTitle = "file" in openTarget ? cleanTitle(openTarget.title) : openTarget.title;
                    const category = "file" in openTarget ? detectCategory(itemTitle) : 'General';
                    const catConfig = CATEGORY_CONFIG[category];
                    return (
                      <Card key={item.bookUrl}
                        className="p-3 w-36 shrink-0 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => openBook(openTarget)}>
                        <div className="text-lg mb-1">{catConfig.icon}</div>
                        <p className="text-xs font-medium truncate">{itemTitle}</p>
                        <Progress value={Math.round((item.currentPage / item.totalPages) * 100)} className="h-1 mt-2" />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Page {item.currentPage}/{item.totalPages}
                        </p>
                      </Card>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Active Filters */}
          {(selectedLetter || selectedCategory) && (
            <div className="flex items-center gap-2 flex-wrap">
              {selectedCategory && (
                <Badge variant="outline" className="cursor-pointer text-xs gap-1"
                  onClick={() => setSelectedCategory(null)}>
                  {CATEGORY_CONFIG[selectedCategory].icon} {selectedCategory} <X className="w-3 h-3" />
                </Badge>
              )}
              {selectedLetter && (
                <Badge variant="outline" className="cursor-pointer text-xs"
                  onClick={() => setSelectedLetter(null)}>
                  {selectedLetter} <X className="w-3 h-3 ms-1" />
                </Badge>
              )}
              <button className="text-xs text-primary hover:underline" onClick={() => { setSelectedCategory(null); setSelectedLetter(null); }}>
                Clear all
              </button>
            </div>
          )}

          {/* Book Count */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <p>Showing {visibleItems.length} of {filteredBooks.length} books</p>
          </div>

          {/* Book Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {visibleItems.map((book, i) => (
                <BookCard key={`${book.url}-${i}`} book={book} showProgress />
              ))}
              {hasMore && Array.from({ length: 6 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="space-y-2">
                  <div className="aspect-[2/3] bg-muted animate-pulse rounded-xl" />
                  <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-2 bg-muted animate-pulse rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {visibleItems.map((book, i) => (
                <BookListItem key={`${book.url}-${i}`} book={book} showProgress onOpen={() => openBook(book)} onToggleBookmark={() => handleToggleBookmark(book)} />
              ))}
              {hasMore && Array.from({ length: 3 }).map((_, i) => (
                <div key={`skeleton-list-${i}`} className="flex gap-3 p-3 bg-card rounded-lg border border-border/50">
                  <div className="w-12 h-16 bg-muted animate-pulse rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && <div ref={loadMoreRef} className="h-4" />}
          {!hasMore && visibleItems.length > 0 && (
            <div className="flex items-center justify-center py-6 opacity-50">
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
          )}
        </TabsContent>

        {/* ===== CATEGORIES TAB ===== */}
        <TabsContent value="categories" className="mt-0 space-y-3">
          <p className="text-sm text-muted-foreground">Browse by topic</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(CATEGORY_CONFIG) as [BookCategory, { color: string; hue: number; icon: string }][]).map(([cat, config]) => {
              const count = categoryCounts[cat] || 0;
              if (count === 0) return null;
              return (
                <Card key={cat}
                  className={`p-3 cursor-pointer hover:scale-[1.02] transition-all border-border/50`}
                  onClick={() => { setSelectedCategory(cat); setActiveTab("browse"); }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-lg`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cat}</p>
                      <p className="text-[11px] text-muted-foreground">{count} books</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* A-Z Quick Access */}
          <h3 className="text-sm font-semibold mt-4">Browse A-Z</h3>
          <div className="grid grid-cols-6 gap-1.5">
            {letterCategories.map(({ letter, count }) => (
              <button key={letter}
                className="p-2 rounded-lg bg-card border border-border/50 hover:bg-accent/50 transition-colors text-center"
                onClick={() => { setSelectedLetter(letter); setActiveTab("browse"); }}>
                <p className="font-bold text-sm text-primary">{letter}</p>
                <p className="text-[9px] text-muted-foreground">{count}</p>
              </button>
            ))}
          </div>
        </TabsContent>

        {/* ===== BOOKMARKS TAB ===== */}
        <TabsContent value="bookmarks" className="mt-0 space-y-3">
          {bookmarkedEntries.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No bookmarks yet</p>
              <p className="text-sm text-muted-foreground mt-1">Tap the bookmark icon on any book to save it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{bookmarkedEntries.length} bookmarked books</p>
              {bookmarkedEntries.map(({ bookmark, openTarget, title, progress }) => (
                <Card key={bookmark.bookUrl} className="p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => openBook(openTarget)}>
                  <div className="w-10 h-14 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white text-sm shrink-0">
                    📖
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{title}</p>
                    {progress > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={progress} className="h-1 flex-1" />
                        <span className="text-[10px] text-muted-foreground">{progress}%</span>
                      </div>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleToggleBookmark(openTarget); }}>
                    <BookmarkCheck className="w-4 h-4 text-amber-500" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== DOWNLOADS TAB ===== */}
        <TabsContent value="downloads" className="space-y-3 mt-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {downloadedBooks.length + userBooks.length} books • {storageUsed}
            </p>
          </div>

          {downloadedBooks.length === 0 && userBooks.length === 0 ? (
            <div className="text-center py-12">
              <Download className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No books saved offline</p>
              <p className="text-sm text-muted-foreground mt-1">Download books to read without internet</p>
              <Button variant="outline" className="mt-4" onClick={() => setActiveTab("browse")}>Browse Library</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {downloadedBooks.map((book, i) => (
                <Card key={i} className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 cursor-pointer"
                    onClick={() => openBook(book)}>
                    <Book className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openBook(book)}>
                    <p className="font-medium text-sm truncate">{book.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{formatFileSize(book.fileSize)}</p>
                      {getProgressPercentage(book.url) > 0 && (
                        <Badge variant="secondary" className="text-[10px]">{getProgressPercentage(book.url)}% read</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openBook(book)}>
                      <BookOpen className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(book.url)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              {userBooks.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold mt-4 pt-4 border-t">Your Uploads</h3>
                  {userBooks.map((book, i) => (
                    <Card key={`user-${i}`} className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0 cursor-pointer"
                        onClick={() => openBook(book)}>
                        <Book className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openBook(book)}>
                        <p className="font-medium text-sm truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(book.fileSize)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openBook(book)}>
                          <BookOpen className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteUserBook(book.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* ===== UPLOAD TAB ===== */}
        <TabsContent value="upload" className="mt-0">
          <Card className="p-6 text-center border-dashed border-2">
            <Plus className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Add Your Own PDF</h3>
            <p className="text-sm text-muted-foreground mb-4">Upload any Islamic PDF or eBook to read it in-app</p>
            <input type="file" accept=".pdf,application/pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} className="rounded-full">
              <Plus className="w-4 h-4 me-2" /> Select PDF File
            </Button>
          </Card>

          <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/30">
            <h4 className="font-medium text-sm mb-2">💡 Features</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• <strong>200+ books</strong> from the Kalamullah collection</li>
              <li>• <strong>Smart categories</strong> — Fiqh, Hadith, Tafsir, Seerah & more</li>
              <li>• <strong>Reading progress</strong> saved automatically</li>
              <li>• <strong>Offline reading</strong> — download for no-internet access</li>
              <li>• <strong>Bookmarks</strong> — save books for quick access</li>
              <li>• <strong>Upload your own</strong> PDFs for guaranteed access</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      {/* Collection Dialog */}
      {showCollectionDialog && selectedBookForCollection && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add to Collection</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCollectionDialog(false);
                    setSelectedBookForCollection(null);
                    setSelectedCollectionId(null);
                  }}
                >
                  ×
                </Button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Add "{cleanTitle(selectedBookForCollection.title)}" to:
                </p>
                <div className="space-y-2">
                  {collections.map(collection => (
                    <label key={collection.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-accent/50 transition-colors">
                      <input
                        type="radio"
                        name="collection"
                        value={collection.id}
                        checked={selectedCollectionId === collection.id}
                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                        className="w-4 h-4"
                      />
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${collection.color} flex items-center justify-center text-sm`}>
                        {collection.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{collection.name}</p>
                        <p className="text-xs text-muted-foreground">{collection.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{collection.books.length} books</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCollectionDialog(false);
                    setSelectedBookForCollection(null);
                    setSelectedCollectionId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirmAddToCollection}
                  disabled={!selectedCollectionId}
                >
                  Add to Collection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
