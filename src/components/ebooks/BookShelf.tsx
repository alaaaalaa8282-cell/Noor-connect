
import { memo, useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookCard } from "./BookCard";
import { LibraryBook } from "@/types/ebooks";
import { Collection } from "@/lib/book-collections";
import { ensureHttps } from "@/lib/ebooks-storage";

interface BookShelfProps {
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
}

export const BookShelf = memo(({
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
}: BookShelfProps) => {
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
  
  useEffect(() => {
    const handleScroll = () => checkScroll();
    const handleResize = () => checkScroll();

    const currentScrollRef = scrollRef.current;
    if (currentScrollRef) {
      currentScrollRef.addEventListener('scroll', handleScroll);
      checkScroll(); // Initial check
    }

    window.addEventListener('resize', handleResize);

    return () => {
      if (currentScrollRef) {
        currentScrollRef.removeEventListener('scroll', handleScroll);
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
