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
import { Suspense } from "react";
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
import { PdfViewer, loadEbooksData } from "@/components/lazy/EbooksComponents";

// --- Types ---
interface LibraryBook {
  title: string;
  file: string;
  url: string;
  size: string;
}

// --- Category System ---
type BookCategory = 'Quran & Tafsir' | 'Hadith' | 'Fiqh' | 'Aqeedah' | 'Seerah' | 'Biography' | 'Dua & Dhikr' | 'Family & Women' | 'History' | 'Knowledge' | 'General';

const CATEGORY_CONFIG: Record<BookCategory, { color: string; hue: number; icon: string }> = {
  'Quran & Tafsir': { color: 'from-emerald-700 to-emerald-900', hue: 160, icon: '📖' },
  'Hadith': { color: 'from-amber-700 to-amber-900', hue: 40, icon: '📜' },
  'Fiqh': { color: 'from-blue-700 to-blue-900', hue: 220, icon: '⚖️' },
  'Aqeedah': { color: 'from-purple-700 to-purple-900', hue: 280, icon: '🕌' },
  'Seerah': { color: 'from-rose-700 to-rose-900', hue: 350, icon: '🌙' },
  'Biography': { color: 'from-orange-700 to-orange-900', hue: 30, icon: '👤' },
  'Dua & Dhikr': { color: 'from-green-700 to-green-900', hue: 120, icon: '🤲' },
  'Family & Women': { color: 'from-pink-700 to-pink-900', hue: 340, icon: '👨‍👩‍👧‍👦' },
  'History': { color: 'from-indigo-700 to-indigo-900', hue: 260, icon: '🏛️' },
  'Knowledge': { color: 'from-cyan-700 to-cyan-900', hue: 180, icon: '🎓' },
  'General': { color: 'from-gray-700 to-gray-900', hue: 220, icon: '📚' },
};

const EbooksPage = () => {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | 'All'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'size'>('title');
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBookUrl, setNewBookUrl] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookCategory, setNewBookCategory] = useState<BookCategory>('General');
  const [downloadedBooks, setDownloadedBooks] = useState<DownloadedBook[]>([]);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [readingStats, setReadingStats] = useState<any>(null);
  const [recentlyRead, setRecentlyRead] = useState<any[]>([]);
  const [lastReadBook, setLastReadBook] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<{ url: string; title: string; localKey?: string } | null>(null);
  const { toast } = useToast();

  // Lazy load ebooks data
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const ebooksModule = await loadEbooksData();
        const booksData = ebooksModule.default as LibraryBook[];
        setBooks(booksData);
      } catch (error) {
        console.error('Failed to load ebooks data:', error);
        toast({
          title: "Error",
          description: "Failed to load ebooks library",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [toast]);

  // Load other data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [downloaded, user, stats, recent, lastRead] = await Promise.all([
          getDownloadedBooks(),
          getUserBooks(),
          getReadingStats(),
          getRecentlyRead(),
          getLastReadBook()
        ]);
        
        setDownloadedBooks(downloaded);
        setUserBooks(user);
        setReadingStats(stats);
        setRecentlyRead(recent);
        setLastReadBook(lastRead);
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadData();
  }, []);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let filtered = books;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(book => 
        getCategoryForBook(book) === selectedCategory
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else {
        const sizeA = parseInt(a.size.replace(/[^0-9]/g, '')) || 0;
        const sizeB = parseInt(b.size.replace(/[^0-9]/g, '')) || 0;
        return sizeB - sizeA;
      }
    });
  }, [books, selectedCategory, searchTerm, sortBy]);

  // Helper function to determine category (simplified)
  const getCategoryForBook = (book: LibraryBook): BookCategory => {
    const title = book.title.toLowerCase();
    if (title.includes('quran') || title.includes('tafsir')) return 'Quran & Tafsir';
    if (title.includes('hadith') || title.includes('sahih')) return 'Hadith';
    if (title.includes('fiqh') || title.includes('shariah')) return 'Fiqh';
    if (title.includes('aqeedah') || title.includes('creed')) return 'Aqeedah';
    if (title.includes('seerah') || title.includes('prophet')) return 'Seerah';
    if (title.includes('biography') || title.includes('life')) return 'Biography';
    if (title.includes('dua') || title.includes('dhikr')) return 'Dua & Dhikr';
    if (title.includes('family') || title.includes('women')) return 'Family & Women';
    if (title.includes('history') || title.includes('islamic')) return 'History';
    if (title.includes('knowledge') || title.includes('learn')) return 'Knowledge';
    return 'General';
  };

  const handleDownloadBook = async (book: LibraryBook) => {
    try {
      await downloadBook(book);
      const updated = await getDownloadedBooks();
      setDownloadedBooks(updated);
      toast({
        title: "Download started",
        description: `${book.title} is being downloaded`
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the book",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBook = async (localKey: string) => {
    try {
      await deleteDownloadedBook(localKey);
      const updated = await getDownloadedBooks();
      setDownloadedBooks(updated);
      toast({
        title: "Book deleted",
        description: "The book has been removed from your device"
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the book",
        variant: "destructive"
      });
    }
  };

  const handleAddUserBook = async () => {
    if (!newBookUrl || !newBookTitle) {
      toast({
        title: "Missing information",
        description: "Please provide both title and URL",
        variant: "destructive"
      });
      return;
    }

    try {
      const newBook: UserBook = {
        id: Date.now().toString(),
        title: newBookTitle,
        url: ensureHttps(newBookUrl),
        category: newBookCategory,
        addedAt: new Date().toISOString()
      };

      await addUserBook(newBook);
      const updated = await getUserBooks();
      setUserBooks(updated);
      
      setNewBookUrl('');
      setNewBookTitle('');
      setNewBookCategory('General');
      setShowAddBook(false);
      
      toast({
        title: "Book added",
        description: `${newBookTitle} has been added to your library`
      });
    } catch (error) {
      toast({
        title: "Add failed",
        description: "Failed to add the book",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">E-Books Library</h1>
              <p className="text-muted-foreground">Islamic literature at your fingertips</p>
            </div>
            <Button onClick={() => setShowAddBook(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as BookCategory | 'All')}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="All">All Categories</option>
              {Object.keys(CATEGORY_CONFIG).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'title' | 'size')}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="title">Sort by Title</option>
              <option value="size">Sort by Size</option>
            </select>
            
            <div className="flex border rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-muted' : ''}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-muted' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Books</p>
                <p className="text-2xl font-bold">{books.length}</p>
              </div>
              <LibraryBig className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Downloaded</p>
                <p className="text-2xl font-bold">{downloadedBooks.length}</p>
              </div>
              <Download className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custom Books</p>
                <p className="text-2xl font-bold">{userBooks.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">
                  {formatFileSize(downloadedBooks.reduce((acc, book) => acc + (book.size || 0), 0))}
                </p>
              </div>
              <HardDrive className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Books Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
          {filteredBooks.map((book) => {
            const isDownloaded = downloadedBooks.some(d => d.url === book.url);
            const category = getCategoryForBook(book);
            const categoryConfig = CATEGORY_CONFIG[category];
            
            return (
              <Card key={book.url} className={`overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}>
                <div className={`bg-gradient-to-br ${categoryConfig.color} p-4 ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                  <div className="text-white">
                    <div className="text-2xl mb-2">{categoryConfig.icon}</div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {category}
                    </Badge>
                  </div>
                </div>
                
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <h3 className="font-semibold mb-2 line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{book.size}</p>
                  
                  <div className="flex gap-2">
                    {isDownloaded ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setSelectedBook({ url: book.url, title: book.title })}
                          className="flex-1"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Read
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteBook(book.url)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleDownloadBook(book)}
                        className="flex-1"
                        disabled={isDownloaded}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isDownloaded ? 'Downloaded' : 'Download'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Add Book Modal */}
        {showAddBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Add Custom Book</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                    placeholder="Enter book title"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">URL</label>
                  <Input
                    value={newBookUrl}
                    onChange={(e) => setNewBookUrl(e.target.value)}
                    placeholder="Enter PDF URL"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={newBookCategory}
                    onChange={(e) => setNewBookCategory(e.target.value as BookCategory)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    {Object.keys(CATEGORY_CONFIG).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button onClick={handleAddUserBook} className="flex-1">
                  Add Book
                </Button>
                <Button variant="outline" onClick={() => setShowAddBook(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* PDF Viewer Modal */}
        {selectedBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">{selectedBook.title}</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedBook(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading PDF...</p>
                    </div>
                  </div>
                }>
                  <PdfViewer
                    url={selectedBook.url}
                    title={selectedBook.title}
                    localKey={selectedBook.localKey}
                    onClose={() => setSelectedBook(null)}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EbooksPage;
