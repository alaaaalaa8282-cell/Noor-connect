import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import {
  Search, Book, Download, Plus, X, Trash2, CheckCircle, Clock,
  BookOpen, Bookmark, BookmarkCheck, ArrowUpDown, HardDrive,
  TrendingUp, Star, Filter, ChevronRight, BarChart3, LibraryBig,
  Grid3X3, List, Sparkles, MoreHorizontal, Play, Pause, Heart,
  ChevronLeft, BookMarked, FolderHeart, Zap, Eye, Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import {
  detectCategory, cleanTitle, CATEGORY_THEMES, type BookCategory,
  generateSubtitle, extractAuthor, getDecorationElements
} from "@/lib/book-themes";
import ebooksData from "@/data/ebooks-library.json";
import PdfViewer from "@/components/PdfViewer";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
interface LibraryBook {
  title: string;
  file: string;
  url: string;
  size: string;
}

const books = ebooksData as LibraryBook[];
const LOCAL_PREFIX = 'local:';

// --- Collection System ---
interface Collection {
  id: string;
  name: string;
  description: string;
  books: string[];
  color: string;
  icon: string;
  createdAt: Date;
}

const createCollection = (name: string, description: string, color: string, icon: string): Collection => ({
  id: Date.now().toString(),
  name,
  description,
  books: [],
  color,
  icon,
  createdAt: new Date()
});

const getCollections = (): Collection[] => {
  const stored = localStorage.getItem('book-collections');
  return stored ? JSON.parse(stored) : [
    { id: '1', name: 'Ramadan Reading', description: 'Books for Ramadan', books: [], color: 'from-emerald-500 to-emerald-700', icon: '🌙', createdAt: new Date() },
    { id: '2', name: 'Favorites', description: 'My favorite books', books: [], color: 'from-rose-500 to-rose-700', icon: '❤️', createdAt: new Date() }
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

// --- Book Cover Component ---
const BookCover = memo(({ 
  title, 
  category, 
  size,
  progress = 0,
  showProgress = true,
  className = ""
}: { 
  title: string; 
  category: BookCategory; 
  size?: string;
  progress?: number;
  showProgress?: boolean;
  className?: string;
}) => {
  const theme = CATEGORY_THEMES[category];
  const clean = cleanTitle(title);
  const author = extractAuthor(title);
  const subtitle = generateSubtitle(title, category);
  
  return (
    <div className={`relative group ${className}`}>
      <div 
        className={`w-full h-full rounded-lg bg-gradient-to-br ${theme.gradient} shadow-lg overflow-hidden relative`}
        style={{ aspectRatio: '2/3' }}
      >
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: theme.pattern, backgroundSize: '30px 30px' }}
        />
        
        {/* Decorative corner */}
        <div 
          className="absolute top-0 left-0 w-16 h-16 opacity-20"
          style={{ backgroundImage: getDecorationElements(theme.decoration).corner, backgroundSize: '100% 100%' }}
        />
        <div 
          className="absolute bottom-0 right-0 w-16 h-16 opacity-20 transform rotate-180"
          style={{ backgroundImage: getDecorationElements(theme.decoration).corner, backgroundSize: '100% 100%' }}
        />
        
        {/* Spine effect */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-white/20 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">
          {/* Top: Category badge */}
          <div className="flex items-start justify-between">
            <Badge 
              variant="secondary" 
              className="bg-white/10 backdrop-blur-sm border-0 text-[9px] text-white/90 font-medium px-1.5 py-0.5"
            >
              <span className="mr-1">{theme.icon}</span>
              {category}
            </Badge>
            {size && (
              <span className="text-[9px] text-white/60 bg-black/20 px-1.5 py-0.5 rounded">
                {formatFileSize(parseInt(size))}
              </span>
            )}
          </div>
          
          {/* Center: Title and icon */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-1">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-2">
              <span className="text-2xl">{theme.icon}</span>
            </div>
            <h3 className="text-[11px] font-semibold leading-tight line-clamp-3 drop-shadow-sm">
              {clean}
            </h3>
            {author && (
              <p className="text-[9px] text-white/70 mt-1 line-clamp-1">{author}</p>
            )}
          </div>
          
          {/* Bottom: Subtitle */}
          <p className="text-[9px] text-white/60 text-center line-clamp-1">
            {subtitle}
          </p>
        </div>
        
        {/* Progress bar */}
        {showProgress && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div 
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </div>
  );
});
BookCover.displayName = 'BookCover';

// --- Book Card Component ---
const BookCard = memo(({
  book,
  onClick,
  onDownload,
  onBookmark,
  isBookmarked,
  isDownloaded,
  downloadProgress,
  showActions = true,
  onAddToCollection,
  collectionsCount = 0
}: {
  book: LibraryBook;
  onClick: () => void;
  onDownload?: (e: React.MouseEvent) => void;
  onBookmark?: (e: React.MouseEvent) => void;
  isBookmarked?: boolean;
  isDownloaded?: boolean;
  downloadProgress?: number;
  showActions?: boolean;
  onAddToCollection?: () => void;
  collectionsCount?: number;
}) => {
  const category = detectCategory(cleanTitle(book.title));
  const theme = CATEGORY_THEMES[category];
  const readProgress = getProgressPercentage(ensureHttps(book.url));
  const clean = cleanTitle(book.title);
  
  return (
    <motion.div 
      className="group cursor-pointer"
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        <BookCover 
          title={book.title} 
          category={category} 
          size={book.size}
          progress={readProgress}
        />
        
        {/* Hover actions overlay */}
        {showActions && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex flex-col items-center justify-center gap-2 p-3">
            <Button size="sm" variant="secondary" className="w-full text-xs">
              <BookOpen className="w-3 h-3 mr-1.5" /> Read
            </Button>
            {!isDownloaded && downloadProgress === undefined && (
              <Button 
                size="sm" 
                className="w-full text-xs"
                onClick={onDownload}
              >
                <Download className="w-3 h-3 mr-1.5" /> Download
              </Button>
            )}
          </div>
        )}
        
        {/* Download progress overlay */}
        {downloadProgress !== undefined && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <div className="text-lg font-bold">{downloadProgress}%</div>
              <div className="w-20 h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Downloaded badge */}
        {isDownloaded && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        )}
        
        {/* Bookmark button */}
        {onBookmark && (
          <button 
            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onBookmark}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Bookmark className="w-3.5 h-3.5 text-white/70" />
            )}
          </button>
        )}
        
        {/* Collection indicator */}
        {collectionsCount > 0 && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 rounded-full bg-purple-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg" title={`In ${collectionsCount} collection(s)`}>
              <LibraryBig className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
        
        {/* Collection button */}
        {onAddToCollection && (
          <button 
            className="absolute top-2 left-10 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 hover:scale-110"
            onClick={onAddToCollection}
            title="Add to collection"
          >
            <LibraryBig className="w-3.5 h-3.5 text-white/70" />
          </button>
        )}
      </div>
      
      {/* Title below cover */}
      <div className="mt-2 px-0.5">
        <h4 className="text-xs font-medium line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {clean}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{category}</span>
          {readProgress > 0 && (
            <span className="text-[10px] text-emerald-500 font-medium">{readProgress}%</span>
          )}
        </div>
      </div>
    </motion.div>
  );
});
BookCard.displayName = 'BookCard';

// --- Book Shelf Component (Horizontal scrolling) ---
const BookShelf = memo(({
  title,
  icon: Icon,
  books,
  onBookClick,
  onDownload,
  onBookmark,
  onAddToCollection,
  collections,
  bookmarkedSet,
  downloadedSet,
  downloadProgress,
  emptyMessage
}: {
  title: string;
  icon: React.ElementType;
  books: LibraryBook[];
  onBookClick: (book: LibraryBook) => void;
  onDownload: (book: LibraryBook, e: React.MouseEvent) => void;
  onBookmark: (book: LibraryBook, e: React.MouseEvent) => void;
  onAddToCollection?: (book: LibraryBook) => void;
  collections: Collection[];
  bookmarkedSet: Set<string>;
  downloadedSet: Set<string>;
  downloadProgress: Record<string, number>;
  emptyMessage?: string;
}) => {
  // Hooks must be called before any conditional returns
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);
  
  // Always call hooks first
  useEffect(() => {
    const handleScroll = () => checkScroll();
    const handleResize = () => checkScroll();

    if (scrollRef.current) {
      scrollRef.current.addEventListener('scroll', handleScroll);
      checkScroll(); // Initial check
    }

    window.addEventListener('resize', handleResize);

    return () => {
      if (scrollRef.current) {
        scrollRef.current.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Handle empty state without early returns
  if (books.length === 0) {
    if (emptyMessage) {
      return (
        <div className="py-8 text-center">
          <Icon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }
    return null;
  }
  
  return (
    <div className="relative group/shelf">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground">{books.length} books</span>
      </div>
      
      {/* Scroll buttons */}
      {canScrollLeft && (
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/90 backdrop-blur shadow-lg border border-border flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {canScrollRight && (
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/90 backdrop-blur shadow-lg border border-border flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
      
      {/* Books container */}
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {books.map((book, i) => (
          <div key={`${book.url}-${i}`} className="flex-shrink-0 w-28 sm:w-32">
            <BookCard
              book={book}
              onClick={() => onBookClick(book)}
              onDownload={(e) => onDownload(book, e as React.MouseEvent)}
              onBookmark={(e) => onBookmark(book, e as React.MouseEvent)}
              isBookmarked={bookmarkedSet.has(ensureHttps(book.url))}
              isDownloaded={downloadedSet.has(ensureHttps(book.url))}
              downloadProgress={downloadProgress[book.url]}
              onAddToCollection={() => onAddToCollection?.(book)}
              collectionsCount={collections.filter(c => c.books.includes(ensureHttps(book.url))).length}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
BookShelf.displayName = 'BookShelf';

// --- Continue Reading Card ---
const ContinueReadingCard = memo(({
  book,
  progress,
  onClick
}: {
  book: LibraryBook | DownloadedBook | UserBook;
  progress: number;
  onClick: () => void;
}) => {
  const title = 'file' in book ? cleanTitle(book.title) : book.title;
  const category = detectCategory(title);
  const theme = CATEGORY_THEMES[category];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card 
        className="relative overflow-hidden cursor-pointer group"
        onClick={onClick}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-10`} />
        
        <div className="relative p-4 flex items-center gap-4">
          {/* Mini cover */}
          <div className={`w-14 h-20 rounded-lg bg-gradient-to-br ${theme.gradient} shadow-md flex items-center justify-center flex-shrink-0`}>
            <span className="text-xl">{theme.icon}</span>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
                <Play className="w-3 h-3 mr-1" /> Continue Reading
              </Badge>
            </div>
            <h3 className="font-semibold text-sm truncate">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{category}</p>
            
            {/* Progress */}
            <div className="flex items-center gap-3 mt-2">
              <Progress value={progress} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground font-medium">{progress}%</span>
            </div>
          </div>
          
          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </Card>
    </motion.div>
  );
});
// --- Category Grid Item ---
const CategoryGridItem = memo(({
  category,
  count,
  onClick
}: {
  category: BookCategory;
  count: number;
  onClick: () => void;
}) => {
  const theme = CATEGORY_THEMES[category];
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <Card className="p-4 cursor-pointer overflow-hidden relative group">
        {/* Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
        
        <div className="relative flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-xl shadow-md`}>
            {theme.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{category}</h4>
            <p className="text-xs text-muted-foreground">{count} books</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </Card>
    </motion.div>
  );
});
CategoryGridItem.displayName = 'CategoryGridItem';

// --- Book Detail Modal ---
const BookDetailModal = ({
  book,
  isOpen,
  onClose,
  onRead,
  onDownload,
  onBookmark,
  isBookmarked,
  isDownloaded,
  progress
}: {
  book: LibraryBook | null;
  isOpen: boolean;
  onClose: () => void;
  onRead: () => void;
  onDownload: () => void;
  onBookmark: () => void;
  isBookmarked: boolean;
  isDownloaded: boolean;
  progress: number;
}) => {
  if (!book) return null;
  
  const category = detectCategory(cleanTitle(book.title));
  const theme = CATEGORY_THEMES[category];
  const clean = cleanTitle(book.title);
  const author = extractAuthor(book.title);
  const subtitle = generateSubtitle(book.title, category);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Hero section */}
        <div className={`relative h-48 bg-gradient-to-br ${theme.gradient}`}>
          {/* Pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: theme.pattern, backgroundSize: '40px 40px' }}
          />
          
          {/* Back button */}
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Bookmark button */}
          <button 
            onClick={onBookmark}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/30 transition-colors"
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-amber-400" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <span className="text-4xl">{theme.icon}</span>
            </div>
          </div>
          
          {/* Category badge */}
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
              {category}
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <DialogHeader className="text-left mb-4">
            <DialogTitle className="text-lg leading-tight">{clean}</DialogTitle>
            {author && (
              <p className="text-sm text-muted-foreground mt-1">by {author}</p>
            )}
          </DialogHeader>
          
          <DialogDescription className="text-sm mb-4">
            {subtitle}
          </DialogDescription>
          
          {/* Stats */}
          <div className="flex items-center gap-4 mb-5 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="w-4 h-4" />
              <span>{formatFileSize(parseInt(book.size))}</span>
            </div>
            {progress > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-500">
                <BookOpen className="w-4 h-4" />
                <span>{progress}% read</span>
              </div>
            )}
            {isDownloaded && (
              <div className="flex items-center gap-1.5 text-emerald-500">
                <CheckCircle className="w-4 h-4" />
                <span>Downloaded</span>
              </div>
            )}
          </div>
          
          {/* Progress bar if started */}
          {progress > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Reading progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              className="flex-1 h-11"
              onClick={onRead}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {progress > 0 ? 'Continue Reading' : 'Start Reading'}
            </Button>
            {!isDownloaded && (
              <Button 
                variant="outline" 
                className="h-11 px-4"
                onClick={onDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Component ---
export default function EbooksModern() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'browse' | 'saved' | 'downloads'>('home');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'a-z' | 'z-a' | 'recent'>('a-z');
  
  // Data state
  const [downloadedBooks, setDownloadedBooks] = useState<DownloadedBook[]>([]);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [bookmarks, setBookmarks] = useState<EbookBookmark[]>([]);
  const [recentlyRead, setRecentlyRead] = useState<ReadingProgress[]>([]);
  const [readingStats, setReadingStats] = useState({ totalBooks: 0, completedBooks: 0, inProgress: 0 });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  
  // UI state
  const [viewingBook, setViewingBook] = useState<{ url: string; title: string; localKey?: string } | null>(null);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [lastReadBookKey, setLastReadBookKey] = useState<string | null>(null);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [selectedBookForCollection, setSelectedBookForCollection] = useState<LibraryBook | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCollectionForView, setSelectedCollectionForView] = useState<Collection | null>(null);
  const [isEditingCollection, setIsEditingCollection] = useState(false);
  const [editingCollectionName, setEditingCollectionName] = useState('');
  const [editingCollectionDescription, setEditingCollectionDescription] = useState('');
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Load data
  useEffect(() => {
    const load = async () => {
      const [downloaded, user] = await Promise.all([
        getDownloadedBooks(), 
        getUserBooks()
      ]);
      setDownloadedBooks(downloaded);
      setUserBooks(user);
      setRecentlyRead(getRecentlyRead(5));
      setReadingStats(getReadingStats());
      setBookmarks(getBookBookmarks());
      setLastReadBookKey(getLastReadBook());
      setCollections(getCollections());
    };
    load();
  }, [viewingBook]);
  
  // Derived data
  const bookmarkedSet = useMemo(() => new Set(bookmarks.map(b => b.bookUrl)), [bookmarks]);
  const downloadedSet = useMemo(() => new Set(downloadedBooks.map(b => b.url)), [downloadedBooks]);
  
  // Get new arrivals
  const newArrivals = useMemo(() => {
    return books
      .filter(b => !b.title.toLowerCase().includes('read me first'))
      .sort(() => Math.random() - 0.5)
      .slice(0, 12);
  }, []);
  
  // Get trending books
  const trendingBooks = useMemo(() => {
    const popularCategories: BookCategory[] = ['Quran & Tafsir', 'Hadith', 'Fiqh', 'Seerah', 'Dua & Dhikr'];
    return books
      .filter(book => {
        const title = cleanTitle(book.title);
        if (title.toLowerCase().includes('read me first')) {
          return false;
        }
        const category = detectCategory(title);
        return popularCategories.includes(category);
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 12);
  }, []);
  
  // Get recommendations
  const recommendedBooks = useMemo(() => {
    if (recentlyRead.length === 0) {
      return books
        .filter(book => !book.title.toLowerCase().includes('read me first'))
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);
    }
    
    const readCategories = new Set<string>();
    recentlyRead.forEach(item => {
      const book = books.find(b => ensureHttps(b.url) === item.bookUrl);
      if (book) {
        readCategories.add(detectCategory(cleanTitle(book.title)));
      }
    });
    
    return books
      .filter(book => {
        const title = cleanTitle(book.title);
        if (title.toLowerCase().includes('read me first')) {
          return false;
        }
        const category = detectCategory(title);
        return readCategories.has(category);
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);
  }, [recentlyRead]);
  
  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    books
      .filter(b => !b.title.toLowerCase().includes('read me first'))
      .forEach(b => {
        const cat = detectCategory(cleanTitle(b.title));
        counts[cat] = (counts[cat] || 0) + 1;
      });
    return counts;
  }, []);
  
  // Filtered books for browse
  const filteredBooks = useMemo(() => {
    let filtered = books.filter(b => 
      !b.title.toLowerCase().includes('read me first') && 
      !b.title.toLowerCase().includes('table of contents')
    );
    
    if (selectedCategory) {
      filtered = filtered.filter(b => detectCategory(cleanTitle(b.title)) === selectedCategory);
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
      case 'recent': sorted.sort(() => Math.random() - 0.5); break;
    }
    
    return sorted;
  }, [selectedCategory, debouncedQuery, sortBy]);
  
  // Lazy loading for browse grid
  const { visibleItems, hasMore, loadMoreRef } = useLazyLoad(filteredBooks, {
    initialLoadCount: 18,
    batchSize: 24,
    rootMargin: '300px'
  });
  
  // Resolve book by key
  const resolveOpenTargetByKey = useCallback((bookKey: string): (LibraryBook | DownloadedBook | UserBook | null) => {
    if (bookKey.startsWith(LOCAL_PREFIX)) {
      const localKey = bookKey.slice(LOCAL_PREFIX.length);
      return userBooks.find(b => b.localKey === localKey) || downloadedBooks.find(b => b.localKey === localKey) || null;
    }
    const secureKey = ensureHttps(bookKey);
    return books.find(b => ensureHttps(b.url) === secureKey) || downloadedBooks.find(b => ensureHttps(b.url) === secureKey) || null;
  }, [downloadedBooks, userBooks]);
  
  // Last read entry
  const lastReadEntry = useMemo(() => {
    if (!lastReadBookKey) {
      return null;
    }
    const openTarget = resolveOpenTargetByKey(lastReadBookKey);
    if (!openTarget) {
      return null;
    }
    return {
      openTarget,
      bookKey: lastReadBookKey,
      title: "file" in openTarget ? cleanTitle(openTarget.title) : openTarget.title,
      progress: getProgressPercentage(lastReadBookKey),
    };
  }, [lastReadBookKey, resolveOpenTargetByKey]);
  
  // Handlers
  const openBook = (book: LibraryBook | DownloadedBook | UserBook) => {
    if ('url' in book && book.url) {
      const downloaded = downloadedBooks.find(b => b.url === ensureHttps(book.url));
      setViewingBook({ 
        url: ensureHttps(book.url), 
        title: 'file' in book ? cleanTitle(book.title) : book.title, 
        localKey: downloaded?.localKey 
      });
    } else if ('localKey' in book) {
      setViewingBook({ url: '', title: book.title, localKey: book.localKey });
    }
  };
  
  const handleDownload = async (book: LibraryBook, e?: React.MouseEvent) => {
    e?.stopPropagation();
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
  
  const handleToggleBookmark = (book: LibraryBook, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const bookKey = ensureHttps(book.url);
    const title = cleanTitle(book.title);
    const isNowBookmarked = toggleBookBookmark(bookKey, title);
    setBookmarks(getBookBookmarks());
    toast({
      title: isNowBookmarked ? "Bookmarked" : "Bookmark removed",
      description: `${title} ${isNowBookmarked ? "added to" : "removed from"} bookmarks`,
    });
  };
  
  const handleDelete = async (url: string) => {
    await deleteDownloadedBook(url);
    setDownloadedBooks(prev => prev.filter(b => b.url !== url));
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
  
  const openBookDetail = (book: LibraryBook) => {
    setSelectedBook(book);
    setIsDetailOpen(true);
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

  const handleViewCollection = (collection: Collection) => {
    setSelectedCollectionForView(collection);
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

  const getBookCollectionsCount = (bookUrl: string): number => {
    return collections.filter(collection => 
      collection.books.includes(ensureHttps(bookUrl))
    ).length;
  };

  const handleEditCollection = (collection: Collection) => {
    setIsEditingCollection(true);
    setEditingCollectionName(collection.name);
    setEditingCollectionDescription(collection.description);
  };

  const handleSaveCollectionEdit = () => {
    if (!selectedCollectionForView) return;
    
    const updatedCollections = collections.map(collection => 
      collection.id === selectedCollectionForView.id
        ? { ...collection, name: editingCollectionName, description: editingCollectionDescription }
        : collection
    );
    
    setCollections(updatedCollections);
    saveCollections(updatedCollections);
    setSelectedCollectionForView({ ...selectedCollectionForView, name: editingCollectionName, description: editingCollectionDescription });
    setIsEditingCollection(false);
    
    toast({
      title: "Collection updated",
      description: "Collection name and description have been updated"
    });
  };

  const handleCancelCollectionEdit = () => {
    setIsEditingCollection(false);
    setEditingCollectionName('');
    setEditingCollectionDescription('');
  };
  
  // PDF viewer back button
  useEffect(() => {
    if (viewingBook) {
      window.history.pushState({ pdfOpen: true }, '');
      const handlePopState = () => setViewingBook(null);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [viewingBook]);
  
  // Storage used (moved before early return to follow hooks rules)
  const storageUsed = useMemo(() => {
    const total = downloadedBooks.reduce((sum, b) => sum + b.fileSize, 0) + userBooks.reduce((sum, b) => sum + b.fileSize, 0);
    return formatFileSize(total);
  }, [downloadedBooks, userBooks]);
  
  // If viewing PDF, show viewer
  if (viewingBook) {
    return <PdfViewer url={viewingBook.url} title={viewingBook.title} localKey={viewingBook.localKey} onClose={() => window.history.back()} />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <LibraryBig className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Library</h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">Islamic Literature</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* View toggle */}
              {activeTab === 'browse' && (
                <div className="flex items-center bg-muted rounded-lg p-0.5">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    className="h-7 w-7 px-0"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    className="h-7 w-7 px-0"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              
              {/* Upload button */}
              <Button size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Plus className="w-4 h-4" />
                Upload eBook
              </Button>
              <input type="file" accept=".pdf,application/pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10 bg-muted/50 border-0 rounded-xl focus-visible:ring-1"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        
        {/* Navigation tabs */}
        <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'home', label: 'Home', icon: Sparkles },
            { id: 'browse', label: 'Browse', icon: Grid3X3 },
            { id: 'saved', label: 'Saved', icon: Bookmark },
            { id: 'downloads', label: 'Offline', icon: Download },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === 'saved' && bookmarks.length > 0 && (
                <span className="ml-0.5 w-4 h-4 rounded-full bg-primary-foreground/20 text-[9px] flex items-center justify-center">
                  {bookmarks.length}
                </span>
              )}
              {tab.id === 'downloads' && (downloadedBooks.length + userBooks.length) > 0 && (
                <span className="ml-0.5 w-4 h-4 rounded-full bg-primary-foreground/20 text-[9px] flex items-center justify-center">
                  {downloadedBooks.length + userBooks.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 pb-24">
        <AnimatePresence mode="wait">
          {/* ===== HOME TAB ===== */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Continue Reading */}
              {lastReadEntry && (
                <section>
                  <ContinueReadingCard
                    book={lastReadEntry.openTarget}
                    progress={lastReadEntry.progress}
                    onClick={() => openBook(lastReadEntry.openTarget)}
                  />
                </section>
              )}
              
              {/* Reading Stats */}
              {readingStats.totalBooks > 0 && (
                <section className="grid grid-cols-3 gap-3">
                  <Card className="p-3 text-center">
                    <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-xl font-bold">{readingStats.totalBooks}</p>
                    <p className="text-[10px] text-muted-foreground">Started</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <TrendingUp className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-xl font-bold">{readingStats.inProgress}</p>
                    <p className="text-[10px] text-muted-foreground">In Progress</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <Star className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-xl font-bold">{readingStats.completedBooks}</p>
                    <p className="text-[10px] text-muted-foreground">Completed</p>
                  </Card>
                </section>
              )}
              
              {/* Recommended for You */}
              <section>
                <BookShelf
                  title="Recommended for You"
                  icon={Sparkles}
                  books={recommendedBooks}
                  onBookClick={openBookDetail}
                  onDownload={handleDownload}
                  onBookmark={handleToggleBookmark}
                  onAddToCollection={handleAddToCollection}
                  collections={collections}
                  bookmarkedSet={bookmarkedSet}
                  downloadedSet={downloadedSet}
                  downloadProgress={downloadProgress}
                  emptyMessage="Start reading to get personalized recommendations"
                />
              </section>
              
              {/* Trending */}
              <section>
                <BookShelf
                  title="Trending Now"
                  icon={TrendingUp}
                  books={trendingBooks}
                  onBookClick={openBookDetail}
                  onDownload={handleDownload}
                  onBookmark={handleToggleBookmark}
                  onAddToCollection={handleAddToCollection}
                  collections={collections}
                  bookmarkedSet={bookmarkedSet}
                  downloadedSet={downloadedSet}
                  downloadProgress={downloadProgress}
                />
              </section>
              
              {/* New Arrivals */}
              <section>
                <BookShelf
                  title="New Arrivals"
                  icon={Zap}
                  books={newArrivals}
                  onBookClick={openBookDetail}
                  onDownload={handleDownload}
                  onBookmark={handleToggleBookmark}
                  onAddToCollection={handleAddToCollection}
                  collections={collections}
                  bookmarkedSet={bookmarkedSet}
                  downloadedSet={downloadedSet}
                  downloadProgress={downloadProgress}
                />
              </section>
              
              {/* Categories Preview */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <FolderHeart className="w-4 h-4 text-primary" /> Browse by Topic
                  </h3>
                  <button 
                    onClick={() => setActiveTab('browse')}
                    className="text-xs text-primary hover:underline"
                  >
                    See all
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(categoryCounts) as [BookCategory, number][])
                    .filter(([_, count]) => count > 0)
                    .slice(0, 6)
                    .map(([category, count]) => (
                      <CategoryGridItem
                        key={category}
                        category={category}
                        count={count}
                        onClick={() => {
                          setSelectedCategory(category);
                          setActiveTab('browse');
                        }}
                      />
                    ))}
                </div>
              </section>
            </motion.div>
          )}
          
          {/* ===== BROWSE TAB ===== */}
          {activeTab === 'browse' && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    !selectedCategory 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  All Books
                </button>
                {(Object.entries(categoryCounts) as [BookCategory, number][])
                  .filter(([_, count]) => count > 0)
                  .map(([category]) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === category 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {CATEGORY_THEMES[category].icon} {category}
                    </button>
                  ))}
              </div>
              
              {/* Sort and count */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {filteredBooks.length} books
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Sort:</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="text-xs bg-transparent border-0 focus:ring-0 cursor-pointer"
                  >
                    <option value="a-z">A-Z</option>
                    <option value="z-a">Z-A</option>
                    <option value="recent">Recent</option>
                  </select>
                </div>
              </div>
              
              {/* Book Grid/List */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {visibleItems.map((book, i) => (
                    <BookCard
                      key={`${book.url}-${i}`}
                      book={book}
                      onClick={() => openBookDetail(book)}
                      onDownload={(e) => handleDownload(book, e)}
                      onBookmark={(e) => handleToggleBookmark(book, e)}
                      isBookmarked={bookmarkedSet.has(ensureHttps(book.url))}
                      isDownloaded={downloadedSet.has(ensureHttps(book.url))}
                      downloadProgress={downloadProgress[book.url]}
                      onAddToCollection={() => handleAddToCollection(book)}
                      collectionsCount={getBookCollectionsCount(book.url)}
                    />
                  ))}
                  {hasMore && Array.from({ length: 6 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="space-y-2">
                      <div className="aspect-[2/3] bg-muted animate-pulse rounded-xl" />
                      <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleItems.map((book, i) => {
                    const category = detectCategory(cleanTitle(book.title));
                    const theme = CATEGORY_THEMES[category];
                    const progress = getProgressPercentage(ensureHttps(book.url));
                    
                    return (
                      <Card 
                        key={`${book.url}-${i}`}
                        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => openBookDetail(book)}
                      >
                        <div className={`w-12 h-16 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-lg shrink-0`}>
                          {theme.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{cleanTitle(book.title)}</h4>
                          <p className="text-xs text-muted-foreground">{category}</p>
                          {progress > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={progress} className="h-1 flex-1 max-w-[100px]" />
                              <span className="text-[10px] text-emerald-500">{progress}%</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => handleToggleBookmark(book, e)}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                          >
                            {bookmarkedSet.has(ensureHttps(book.url)) ? (
                              <BookmarkCheck className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Bookmark className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          {!downloadedSet.has(ensureHttps(book.url)) && (
                            <button 
                              onClick={(e) => handleDownload(book, e)}
                              className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                              <Download className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
              
              {hasMore && <div ref={loadMoreRef} className="h-4" />}
            </motion.div>
          )}
          
          {/* ===== SAVED TAB ===== */}
          {activeTab === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Collections */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">My Collections</h3>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      const newCollection = createCollection('New Collection', 'My custom collection', 'from-purple-500 to-purple-700', '📚');
                      const updated = [...collections, newCollection];
                      setCollections(updated);
                      saveCollections(updated);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> New
                  </Button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {collections.map(collection => {
                    const booksInCollection = getBooksInCollection(collection.id);
                    return (
                      <Card 
                        key={collection.id}
                        className="p-3 min-w-[140px] cursor-pointer hover:bg-accent/50 transition-colors relative group"
                        onClick={() => handleViewCollection(collection)}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${collection.color} flex items-center justify-center text-lg mb-2`}>
                          {collection.icon}
                        </div>
                        <h4 className="font-medium text-sm">{collection.name}</h4>
                        <p className="text-xs text-muted-foreground">{booksInCollection.length} books</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollection(collection.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </section>
              
              {/* Bookmarked Books */}
              <section>
                <h3 className="text-sm font-semibold mb-3">Bookmarked Books</h3>
                {bookmarks.length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No bookmarks yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Tap the bookmark icon on any book to save it here</p>
                    <Button variant="outline" className="mt-4" onClick={() => setActiveTab('browse')}>
                      Browse Books
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {bookmarks.map(bookmark => {
                      const book = books.find(b => ensureHttps(b.url) === bookmark.bookUrl);
                      if (!book) return null;
                      
                      return (
                        <BookCard
                          key={bookmark.bookUrl}
                          book={book}
                          onClick={() => openBookDetail(book)}
                          onDownload={(e) => handleDownload(book, e)}
                          onBookmark={(e) => handleToggleBookmark(book, e)}
                          isBookmarked={true}
                          isDownloaded={downloadedSet.has(ensureHttps(book.url))}
                          downloadProgress={downloadProgress[book.url]}
                          onAddToCollection={() => handleAddToCollection(book)}
                          collectionsCount={getBookCollectionsCount(book.url)}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            </motion.div>
          )}
          
          {/* ===== DOWNLOADS TAB ===== */}
          {activeTab === 'downloads' && (
            <motion.div
              key="downloads"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Storage info */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Offline Storage</p>
                      <p className="text-xs text-muted-foreground">{storageUsed} used</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{downloadedBooks.length + userBooks.length} books</p>
                </div>
              </Card>
              
              {/* Downloaded books */}
              {downloadedBooks.length === 0 && userBooks.length === 0 ? (
                <div className="text-center py-12">
                  <Download className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No books saved offline</p>
                  <p className="text-sm text-muted-foreground mt-1">Download books to read without internet</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab('browse')}>
                    Browse Library
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {downloadedBooks.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold mb-3">Downloaded</h3>
                      <div className="space-y-2">
                        {downloadedBooks.map(book => {
                          const category = detectCategory(book.title);
                          const theme = CATEGORY_THEMES[category];
                          const progress = getProgressPercentage(book.url);
                          
                          return (
                            <Card 
                              key={book.url}
                              className="p-3 flex items-center gap-3"
                            >
                              <div 
                                className={`w-12 h-16 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-lg shrink-0 cursor-pointer`}
                                onClick={() => openBook(book)}
                              >
                                {theme.icon}
                              </div>
                              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openBook(book)}>
                                <h4 className="font-medium text-sm truncate">{book.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatFileSize(book.fileSize)}</span>
                                  {progress > 0 && (
                                    <Badge variant="secondary" className="text-[10px]">{progress}% read</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openBook(book)}>
                                  <BookOpen className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(book.url)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </section>
                  )}
                  
                  {userBooks.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold mb-3">Your Uploads</h3>
                      <div className="space-y-2">
                        {userBooks.map(book => (
                          <Card 
                            key={book.id}
                            className="p-3 flex items-center gap-3"
                          >
                            <div 
                              className="w-12 h-16 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0 cursor-pointer"
                              onClick={() => openBook(book)}
                            >
                              <Book className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openBook(book)}>
                              <h4 className="font-medium text-sm truncate">{book.title}</h4>
                              <p className="text-xs text-muted-foreground">{formatFileSize(book.fileSize)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openBook(book)}>
                                <BookOpen className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onRead={() => selectedBook && openBook(selectedBook)}
        onDownload={() => selectedBook && handleDownload(selectedBook)}
        onBookmark={() => selectedBook && handleToggleBookmark(selectedBook)}
        isBookmarked={selectedBook ? bookmarkedSet.has(ensureHttps(selectedBook.url)) : false}
        isDownloaded={selectedBook ? downloadedSet.has(ensureHttps(selectedBook.url)) : false}
        progress={selectedBook ? getProgressPercentage(ensureHttps(selectedBook.url)) : 0}
      />
      
      {/* Collection Dialog */}
      {showCollectionDialog && selectedBookForCollection && (
        <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LibraryBig className="w-5 h-5" />
                Add to Collection
              </DialogTitle>
              <DialogDescription>
                Choose a collection for "{cleanTitle(selectedBookForCollection.title)}"
              </DialogDescription>
            </DialogHeader>
            
            {/* Quick Add Option */}
            <div className="mb-4">
              <Button
                variant="outline"
                className="w-full gap-2 border-dashed"
                onClick={() => {
                  const newCollection = createCollection(
                    `${cleanTitle(selectedBookForCollection.title)} Collection`,
                    `Collection for ${cleanTitle(selectedBookForCollection.title)}`,
                    'from-blue-500 to-blue-700',
                    '📚'
                  );
                  const updated = [...collections, newCollection];
                  setCollections(updated);
                  saveCollections(updated);
                  
                  // Auto-add to new collection
                  addBookToCollection(newCollection.id, ensureHttps(selectedBookForCollection.url));
                  const finalUpdated = getCollections();
                  setCollections(finalUpdated);
                  
                  toast({
                    title: "New collection created",
                    description: `"${cleanTitle(selectedBookForCollection.title)}" added to new collection`
                  });
                  
                  setShowCollectionDialog(false);
                  setSelectedBookForCollection(null);
                  setSelectedCollectionId(null);
                }}
              >
                <Plus className="w-4 h-4" />
                Create New Collection + Add Book
              </Button>
            </div>
            
            {/* Existing Collections */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Or choose existing collection:</p>
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {collections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <LibraryBig className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No collections yet</p>
                    <p className="text-xs">Create your first collection above!</p>
                  </div>
                ) : (
                  collections.map(collection => {
                    const isBookInThisCollection = isBookInCollection(collection.id, ensureHttps(selectedBookForCollection.url));
                    return (
                      <button
                        key={collection.id}
                        onClick={() => {
                          if (!isBookInThisCollection) {
                            setSelectedCollectionId(collection.id);
                            handleConfirmAddToCollection();
                          } else {
                            // Remove from collection
                            handleRemoveFromCollection(collection.id, ensureHttps(selectedBookForCollection.url));
                            setShowCollectionDialog(false);
                            setSelectedBookForCollection(null);
                            setSelectedCollectionId(null);
                          }
                        }}
                        className={`w-full p-3 rounded-lg border transition-all text-left ${
                          isBookInThisCollection
                            ? 'bg-primary/10 border-primary/30 hover:bg-primary/20'
                            : 'border-border/50 hover:bg-accent/50 hover:border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${collection.color} flex items-center justify-center text-sm flex-shrink-0`}>
                            {collection.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{collection.name}</p>
                              {isBookInThisCollection && (
                                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{collection.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{collection.books.length} books</span>
                              {isBookInThisCollection && (
                                <span className="text-xs text-primary font-medium">Already in collection</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
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
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Collection View Modal */}
      {selectedCollectionForView && (
        <Dialog open={!!selectedCollectionForView} onOpenChange={() => setSelectedCollectionForView(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedCollectionForView.color} flex items-center justify-center text-lg`}>
                    {selectedCollectionForView.icon}
                  </div>
                  <div>
                    {isEditingCollection ? (
                      <div className="space-y-2">
                        <Input
                          value={editingCollectionName}
                          onChange={(e) => setEditingCollectionName(e.target.value)}
                          placeholder="Collection name"
                          className="text-lg font-semibold h-8"
                        />
                        <Input
                          value={editingCollectionDescription}
                          onChange={(e) => setEditingCollectionDescription(e.target.value)}
                          placeholder="Collection description"
                          className="text-sm h-7"
                        />
                      </div>
                    ) : (
                      <>
                        <DialogTitle>{selectedCollectionForView.name}</DialogTitle>
                        <DialogDescription>{selectedCollectionForView.description}</DialogDescription>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditingCollection ? (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={handleSaveCollectionEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelCollectionEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleEditCollection(selectedCollectionForView)}>
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>
            
            <div className="mt-4">
              {(() => {
                const booksInCollection = getBooksInCollection(selectedCollectionForView.id);
                return booksInCollection.length === 0 ? (
                  <div className="text-center py-12">
                    <LibraryBig className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No books in this collection</p>
                    <p className="text-sm text-muted-foreground mt-1">Add books to this collection to see them here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto">
                    {booksInCollection.map((book) => (
                      <BookCard
                        key={book.url}
                        book={book}
                        onClick={() => openBookDetail(book)}
                        onDownload={(e) => handleDownload(book, e)}
                        onBookmark={(e) => handleToggleBookmark(book, e)}
                        isBookmarked={bookmarkedSet.has(ensureHttps(book.url))}
                        isDownloaded={downloadedSet.has(ensureHttps(book.url))}
                        downloadProgress={downloadProgress[book.url]}
                        onAddToCollection={() => handleAddToCollection(book)}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
