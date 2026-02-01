import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { Search, Book, Download, Plus, X, Trash2, CheckCircle, Clock, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLazyLoad } from "@/hooks/useLazyLoad";
import { BookCardSkeleton } from "@/components/LoadingSkeleton";
import {
  getDownloadedBooks,
  getUserBooks,
  downloadBook,
  deleteDownloadedBook,
  deleteUserBook,
  addUserBook,
  formatFileSize,
  ensureHttps,
  type DownloadedBook,
  type UserBook
} from "@/lib/ebooks-storage";
import {
  getProgressPercentage,
  getRecentlyRead,
  getReadingStats,
  type ReadingProgress
} from "@/lib/reading-progress";
import ebooksData from "@/data/ebooks-library.json";
import PdfViewer from "@/components/PdfViewer";

// New data model: array of books with title, file, url, size
interface LibraryBook {
  title: string;
  file: string;
  url: string;
  size: string;
}

// Cast imported data
const books = ebooksData as LibraryBook[];

// Helper to clean title (remove .pdf and underscores)
const cleanTitle = (title: string): string => {
  return title
    .replace(/\.pdf$/i, '')
    .replace(/_/g, ' ')
    .trim();
};

// Helper to format file size from string bytes
const formatSize = (sizeStr: string): string => {
  const bytes = parseInt(sizeStr, 10);
  if (isNaN(bytes)) return '';
  return formatFileSize(bytes);
};

// Categorize books by first letter for organization
const categorizeBooks = (books: LibraryBook[]): Record<string, LibraryBook[]> => {
  const categories: Record<string, LibraryBook[]> = {};
  books.forEach(book => {
    const firstChar = cleanTitle(book.title).charAt(0).toUpperCase();
    const category = /[A-Z]/.test(firstChar) ? firstChar : '#';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(book);
  });
  return categories;
};

export default function Ebooks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [downloadedBooks, setDownloadedBooks] = useState<DownloadedBook[]>([]);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [viewingBook, setViewingBook] = useState<{ url: string; title: string; localKey?: string } | null>(null);
  const [recentlyRead, setRecentlyRead] = useState<ReadingProgress[]>([]);
  const [readingStats, setReadingStats] = useState({ totalBooks: 0, completedBooks: 0, inProgress: 0 });
  const [activeTab, setActiveTab] = useState("browse");
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
      const [downloaded, user] = await Promise.all([
        getDownloadedBooks(),
        getUserBooks()
      ]);
      setDownloadedBooks(downloaded);
      setUserBooks(user);
      setRecentlyRead(getRecentlyRead(5));
      setReadingStats(getReadingStats());
    };
    load();
  }, [viewingBook]);

  // Handle hardware back button to close viewer
  useEffect(() => {
    if (viewingBook) {
      // Add a dummy state to history so back button pops it instead of leaving page
      window.history.pushState({ pdfOpen: true }, '');

      const handlePopState = () => {
        setViewingBook(null);
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [viewingBook]);

  // Get alphabet letters with counts
  const letterCategories = useMemo(() => {
    const categorized = categorizeBooks(books);
    return Object.entries(categorized)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([letter, books]) => ({ letter, count: books.length }));
  }, []);

  // Memoized filtered books to prevent re-renders
  const filteredBooks = useMemo(() => {
    let filtered = books;

    // Filter out the README file
    filtered = filtered.filter(b =>
      !b.title.toLowerCase().includes('read me first') &&
      !b.title.toLowerCase().includes('table of contents')
    );

    if (selectedLetter) {
      filtered = filtered.filter(b => {
        const firstChar = cleanTitle(b.title).charAt(0).toUpperCase();
        const category = /[A-Z]/.test(firstChar) ? firstChar : '#';
        return category === selectedLetter;
      });
    }

    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter(b =>
        cleanTitle(b.title).toLowerCase().includes(query)
      );
    }

    // Sort alphabetically by title
    return [...filtered].sort((a, b) => cleanTitle(a.title).localeCompare(cleanTitle(b.title)));
  }, [selectedLetter, debouncedQuery]);

  // Lazy loading for books
  const { visibleItems, hasMore, loadMoreRef } = useLazyLoad(filteredBooks, {
    initialLoadCount: 10,
    batchSize: 20,
    rootMargin: '100px'
  });

  // Check if book is downloaded
  const isDownloaded = useCallback((url: string) => {
    const secureUrl = ensureHttps(url);
    return downloadedBooks.some(b => b.url === secureUrl);
  }, [downloadedBooks]);

  // Get downloaded book
  const getDownloadedBookData = useCallback((url: string) => {
    const secureUrl = ensureHttps(url);
    return downloadedBooks.find(b => b.url === secureUrl);
  }, [downloadedBooks]);

  // Handle download
  const handleDownload = async (book: LibraryBook) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [book.url]: 0 }));

      const downloaded = await downloadBook(
        { title: cleanTitle(book.title), url: book.url, category: '' },
        (progress) => {
          setDownloadProgress(prev => ({ ...prev, [book.url]: progress }));
        }
      );

      setDownloadedBooks(prev => [...prev, downloaded]);
      setDownloadProgress(prev => {
        const newState = { ...prev };
        delete newState[book.url];
        return newState;
      });

      toast({ title: "Downloaded", description: `${cleanTitle(book.title)} saved for offline reading` });
    } catch (error) {
      console.error("Download error:", error);
      setDownloadProgress(prev => {
        const newState = { ...prev };
        delete newState[book.url];
        return newState;
      });

      toast({
        title: "Download failed",
        description: "Try opening in browser instead",
        variant: "destructive"
      });
    }
  };

  // Handle delete
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

  // Handle file upload
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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open book - now always opens in-app viewer
  const openBook = (book: LibraryBook | DownloadedBook | UserBook) => {
    if ('url' in book && book.url) {
      const downloaded = getDownloadedBookData(book.url);
      setViewingBook({
        url: ensureHttps(book.url),
        title: 'file' in book ? cleanTitle(book.title) : book.title,
        localKey: downloaded?.localKey
      });
    } else if ('localKey' in book) {
      // User book - always local
      setViewingBook({
        url: '',
        title: book.title,
        localKey: book.localKey
      });
    }
  };

  if (viewingBook) {
    return (
      <PdfViewer
        url={viewingBook.url}
        title={viewingBook.title}
        localKey={viewingBook.localKey}
        onClose={() => window.history.back()}
      />
    );
  }

  // Memoized BookCard component to prevent unnecessary re-renders
  const BookCard = memo(({ book, showProgress = false }: { book: LibraryBook; showProgress?: boolean }) => {
    const downloaded = isDownloaded(book.url);
    const progress = downloadProgress[book.url];
    const readProgress = getProgressPercentage(ensureHttps(book.url));
    const title = cleanTitle(book.title);
    const size = formatSize(book.size);
    const firstLetter = title.charAt(0).toUpperCase();

    // Generate a consistent color based on the title length/char
    const hue = (title.length * 10) % 360;

    return (
      <div
        className="group relative flex flex-col gap-2 cursor-pointer"
        onClick={() => openBook(book)}
      >
        {/* Book Cover */}
        <div className="aspect-[2/3] w-full relative rounded-lg overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
          {/* Dynamic Cover Background */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40"
            style={{
              background: `linear-gradient(135deg, hsl(${hue}, 40%, 40%) 0%, hsl(${hue}, 30%, 30%) 100%)`
            }}
          ></div>

          {/* Spine Effect */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/20 backdrop-blur-sm z-10"></div>

          {/* Cover Content */}
          <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">
            <div className="text-[10px] opacity-70 font-serif tracking-widest text-right">ISLAMIC LIBRARY</div>

            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 text-white/80 border-2 border-white/20 rounded-full flex items-center justify-center font-serif text-lg">
                {firstLetter}
              </div>
              <h3 className="text-sm font-semibold leading-tight line-clamp-3 drop-shadow-sm">
                {title}
              </h3>
            </div>

            <div className="flex justify-between items-end">
              <div className="text-[10px] opacity-80 bg-black/20 px-1.5 py-0.5 rounded">PDF</div>
              {downloaded && <CheckCircle className="w-4 h-4 text-emerald-300 drop-shadow-sm" />}
            </div>
          </div>

          {/* Progress Bar Overlay */}
          {showProgress && readProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${readProgress}%` }}
              />
            </div>
          )}

          {/* Hover Actions Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
            {downloaded ? (
              <Button size="sm" variant="secondary" className="w-full text-xs h-8">
                <BookOpen className="w-3 h-3 mr-2" /> Read
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(book);
                }}
                disabled={progress !== undefined}
              >
                {progress !== undefined ? `${progress}%` : <><Download className="w-3 h-3 mr-2" /> Download</>}
              </Button>
            )}
          </div>
        </div>

        {/* Book Meta (Below Cover) */}
        <div className="space-y-0.5 px-0.5">
          <h4 className="text-xs font-medium truncate leading-tight group-hover:text-primary transition-colors">
            {title}
          </h4>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{size}</span>
            {showProgress && readProgress > 0 && <span>{readProgress}%</span>}
          </div>
        </div>
      </div>
    );
  });

  BookCard.displayName = 'BookCard';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="text-xl font-serif font-bold text-center mb-3">Islamic Library</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-card"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </header>

      {/* Stats Bar */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              <Book className="w-3.5 h-3.5 inline mr-1" />
              {filteredBooks.length} books
            </span>
            <span className="text-muted-foreground">
              <Download className="w-3.5 h-3.5 inline mr-1" />
              {downloadedBooks.length} saved
            </span>
          </div>
          {readingStats.inProgress > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {readingStats.inProgress} in progress
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 py-4">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="browse" className="text-xs">Browse</TabsTrigger>
          <TabsTrigger value="letters" className="text-xs">A-Z</TabsTrigger>
          <TabsTrigger value="saved" className="text-xs">Saved</TabsTrigger>
          <TabsTrigger value="upload" className="text-xs">Add</TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-4 mt-0">
          {/* Recently Read */}
          {recentlyRead.length > 0 && !debouncedQuery && !selectedLetter && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" /> Continue Reading
              </h3>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {recentlyRead.map((item) => {
                    const isLocal = item.bookUrl.startsWith(LOCAL_PREFIX);
                    const localKey = isLocal ? item.bookUrl.slice(LOCAL_PREFIX.length) : null;

                    const book = !isLocal ? books.find(b => ensureHttps(b.url) === item.bookUrl) : null;
                    const userBook = isLocal && localKey ? userBooks.find(b => b.localKey === localKey) : null;
                    const downloadedBook = isLocal && localKey ? downloadedBooks.find(b => b.localKey === localKey) : null;

                    const openTarget = book || userBook || downloadedBook;
                    if (!openTarget) return null;

                    return (
                      <Card
                        key={item.bookUrl}
                        className="p-3 w-40 shrink-0 cursor-pointer hover:bg-accent/50"
                        onClick={() => openBook(openTarget)}
                      >
                        <Book className="w-6 h-6 text-primary mb-2" />
                        <p className="text-xs font-medium truncate">{"file" in openTarget ? cleanTitle(openTarget.title) : openTarget.title}</p>
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

          {/* Filter indicator */}
          {selectedLetter && (
            <Badge
              variant="outline"
              className="cursor-pointer text-xs"
              onClick={() => setSelectedLetter(null)}
            >
              {selectedLetter} <X className="w-3 h-3 ml-1" />
            </Badge>
          )}

          {/* Book List */}
          {/* Book List - Grid Layout */}
          <div className="space-y-4">
            {selectedLetter && (
              <button
                onClick={() => setSelectedLetter(null)}
                className="flex items-center gap-1 text-primary text-sm mb-4 bg-primary/10 px-3 py-1.5 rounded-full w-fit hover:bg-primary/20 transition-colors"
              >
                ← Back to All Books
              </button>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <p>
                Showing {visibleItems.length} of {filteredBooks.length} books
                {selectedLetter && ` starting with "${selectedLetter}"`}
              </p>
            </div>

            {/* Render visible books in Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {visibleItems.map((book, i) => (
                <BookCard key={`${book.url}-${i}`} book={book} showProgress />
              ))}

              {/* Loading skeleton for more items */}
              {hasMore && Array.from({ length: 4 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="space-y-3">
                  <div className="aspect-[2/3] bg-muted animate-pulse rounded-lg shadow-sm" />
                  <div className="space-y-1">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            {hasMore && <div ref={loadMoreRef} className="h-4" />}

            {/* No more items indicator */}
            {!hasMore && visibleItems.length > 0 && (
              <div className="flex items-center justify-center py-8 opacity-50">
                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>
            )}
          </div>
        </TabsContent>

        {/* A-Z Tab */}
        <TabsContent value="letters" className="mt-0">
          <div className="grid grid-cols-4 gap-2">
            {letterCategories.map(({ letter, count }) => (
              <Card
                key={letter}
                className="p-3 cursor-pointer hover:bg-accent/50 transition-colors text-center"
                onClick={() => {
                  setSelectedLetter(letter);
                  setActiveTab("browse");
                }}
              >
                <p className="font-bold text-lg text-primary">{letter}</p>
                <p className="text-xs text-muted-foreground">{count} books</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Saved Books Tab */}
        <TabsContent value="saved" className="space-y-4 mt-0">
          <p className="text-sm text-muted-foreground">
            {downloadedBooks.length + userBooks.length} books saved offline
          </p>

          {downloadedBooks.length === 0 && userBooks.length === 0 ? (
            <div className="text-center py-12">
              <Download className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No books saved yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Download books to read offline
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setActiveTab("browse")}
              >
                Browse Library
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {downloadedBooks.map((book, i) => (
                <Card key={i} className="p-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded bg-emerald-500/10 flex items-center justify-center shrink-0 cursor-pointer"
                    onClick={() => openBook(book)}
                  >
                    <Book className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openBook(book)}>
                    <p className="font-medium text-sm truncate">{book.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{formatFileSize(book.fileSize)}</p>
                      {getProgressPercentage(book.url) > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {getProgressPercentage(book.url)}% read
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openBook(book)}
                    >
                      <BookOpen className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(book.url)}
                    >
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
                      <div
                        className="w-10 h-10 rounded bg-accent flex items-center justify-center shrink-0 cursor-pointer"
                        onClick={() => openBook(book)}
                      >
                        <Book className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openBook(book)}>
                        <p className="font-medium text-sm truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(book.fileSize)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openBook(book)}
                        >
                          <BookOpen className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteUserBook(book.id)}
                        >
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

        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-0">
          <Card className="p-6 text-center">
            <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Add Your Own PDF</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a PDF from your device to read it in the app
            </p>
            <input
              type="file"
              accept=".pdf,application/pdf"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Plus className="w-4 h-4 mr-2" />
              Select PDF File
            </Button>
          </Card>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm mb-2">💡 Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• Tap any book to read it in-app</li>
              <li>• Downloaded books work offline</li>
              <li>• Reading progress is saved automatically</li>
              <li>• Upload your own PDFs for guaranteed access</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
