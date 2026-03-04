import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import {
  Search, Book, Download, Plus, X, Trash2, CheckCircle, Clock,
  BookOpen, Bookmark, BookmarkCheck, ArrowUpDown, HardDrive,
  TrendingUp, Star, Filter, ChevronRight, BarChart3, LibraryBig,
  Grid3X3, List, Upload, Folder, Heart, Target, Calendar, Volume2
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

interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  books: string[];
  createdAt: Date;
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

const CATEGORY_KEYWORDS: Record<BookCategory, string[]> = {
  'Quran & Tafsir': ['quran', 'quranic', 'tafsir', 'surah', 'kahf', 'yusuf'],
  'Hadith': ['hadith', 'sunnah', 'sahaba', 'nawawi', 'bukhari', 'riyadh'],
  'Fiqh': ['fiqh', 'prayer', 'hajj', 'wudho', 'salah', 'funeral', 'marriage'],
  'Aqeedah': ['tawheed', 'aqeedah', 'creed', 'shirk', 'belief', 'names of allah'],
  'Seerah': ['prophet', 'messenger', 'seerah', 'sealed nectar', 'muhammad'],
  'Biography': ['biography', 'biographies', 'ali ibn', 'umar', 'abu bakr', 'caliphs'],
  'Dua & Dhikr': ['dua', 'dhikr', 'supplication', 'invocation', 'fortress'],
  'Family & Women': ['women', 'family', 'child', 'children', 'marriage', 'parent'],
  'History': ['history', 'conquests', 'atlas', 'early days', 'ottoman', 'caliphate'],
  'Knowledge': ['knowledge', 'education', 'learning', 'scholar', 'advice', 'seeker'],
  'General': [],
};

// --- Collections System ---
const createCollection = (name: string, description: string, color: string, icon: string): Collection => {
  return {
    id: Date.now().toString(),
    name,
    description,
    color,
    icon,
    books: [],
    createdAt: new Date()
  };
};

const getCollections = (): Collection[] => {
  const stored = localStorage.getItem('book-collections');
  return stored ? JSON.parse(stored) : [
    {
      id: '1',
      name: 'Essential Reads',
      description: 'Must-read Islamic books for every Muslim',
      color: 'from-emerald-500 to-emerald-700',
      icon: '🌟',
      books: [],
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Study Collection',
      description: 'Books for deep Islamic study',
      color: 'from-blue-500 to-blue-700',
      icon: '📖',
      books: [],
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

// --- Helpers ---
const detectCategory = (title: string): BookCategory => {
  const lowerTitle = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'General') continue;
    if (keywords.some(kw => lowerTitle.includes(kw))) {
      return category as BookCategory;
    }
  }
  return 'General';
};

const cleanTitle = (title: string): string => title.replace(/\.pdf$/i, '').replace(/_/g, ' ').trim();

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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        const [downloaded, user, stats, recent, lastRead, collections] = await Promise.all([
          getDownloadedBooks(),
          getUserBooks(),
          getReadingStats(),
          getRecentlyRead(),
          getLastReadBook(),
          Promise.resolve(getCollections())
        ]);
        
        setDownloadedBooks(downloaded);
        setUserBooks(user);
        setReadingStats(stats);
        setRecentlyRead(recent);
        setLastReadBook(lastRead);
        setCollections(collections);
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
        detectCategory(book.title) === selectedCategory
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

  // Helper function to determine category
  const getCategoryForBook = (book: LibraryBook): BookCategory => {
    return detectCategory(book.title);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }

    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Create a local URL for the uploaded file
      const localUrl = URL.createObjectURL(file);
      const newBook: UserBook = {
        id: Date.now().toString(),
        title: file.name.replace('.pdf', ''),
        url: localUrl,
        category: 'General',
        addedAt: new Date().toISOString()
      };

      await addUserBook(newBook);
      const updated = await getUserBooks();
      setUserBooks(updated);
      
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been added to your library`
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload the book",
        variant: "destructive"
      });
      setUploadProgress(0);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateCollection = () => {
    const newCollection = createCollection(
      'New Collection',
      'Create your own book collection',
      'from-purple-500 to-purple-700',
      '📚'
    );
    setCollections(prev => [...prev, newCollection]);
    saveCollections([...collections, newCollection]);
    setActiveTab('collections');
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
      {/* Compact Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-3 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold">E-Books Library</h1>
              <p className="text-xs text-muted-foreground">Islamic literature</p>
            </div>
            <Button size="sm" onClick={() => setShowAddBook(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Compact Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Tabs */}
      <div className="px-3 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-8 text-xs">
            <TabsTrigger value="browse" className="text-xs">Browse</TabsTrigger>
            <TabsTrigger value="downloads" className="text-xs">Offline</TabsTrigger>
            <TabsTrigger value="collections" className="text-xs relative">
              Collections
              {collections.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-white">{collections.length}</span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs">Recent</TabsTrigger>
            <TabsTrigger value="upload" className="text-xs">Add</TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="mt-3 space-y-3">
            {/* Compact Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as BookCategory | 'All')}
                className="px-2 py-1 text-xs border rounded bg-background flex-shrink-0"
              >
                <option value="All">All</option>
                {Object.keys(CATEGORY_CONFIG).map(category => (
                  <option key={category} value={category}>{category.split(' ')[0]}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'title' | 'size')}
                className="px-2 py-1 text-xs border rounded bg-background flex-shrink-0"
              >
                <option value="title">Title</option>
                <option value="size">Size</option>
              </select>
              
              <div className="flex border rounded flex-shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2 py-1 text-xs ${viewMode === 'grid' ? 'bg-muted' : ''}`}
                >
                  <Grid3X3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 py-1 text-xs ${viewMode === 'list' ? 'bg-muted' : ''}`}
                >
                  <List className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-2 text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-bold">{books.length}</p>
              </Card>
              <Card className="p-2 text-center">
                <p className="text-xs text-muted-foreground">Offline</p>
                <p className="text-sm font-bold">{downloadedBooks.length}</p>
              </Card>
              <Card className="p-2 text-center">
                <p className="text-xs text-muted-foreground">Custom</p>
                <p className="text-sm font-bold">{userBooks.length}</p>
              </Card>
            </div>

            {/* Books Grid */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
              {filteredBooks.slice(0, 20).map((book) => {
                const isDownloaded = downloadedBooks.some(d => d.url === book.url);
                const category = getCategoryForBook(book);
                const categoryConfig = CATEGORY_CONFIG[category];
                
                return (
                  <Card key={book.url} className="overflow-hidden">
                    <div className={`bg-gradient-to-br ${categoryConfig.color} p-3`}>
                      <div className="text-white">
                        <div className="text-lg mb-1">{categoryConfig.icon}</div>
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                          {category.split(' ')[0]}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-semibold text-xs mb-1 line-clamp-2">{cleanTitle(book.title)}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{book.size}</p>
                      
                      <div className="flex gap-1">
                        {isDownloaded ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => setSelectedBook({ url: book.url, title: book.title })}
                              className="flex-1 h-7 text-xs"
                            >
                              <BookOpen className="w-3 h-3 mr-1" />
                              Read
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteBook(book.url)}
                              className="h-7 w-7 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleDownloadBook(book)}
                            className="flex-1 h-7 text-xs"
                            disabled={isDownloaded}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            {isDownloaded ? 'Downloaded' : 'Get'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Downloads Tab */}
          <TabsContent value="downloads" className="mt-3 space-y-2">
            {downloadedBooks.length === 0 ? (
              <Card className="p-6 text-center">
                <Download className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No offline books</p>
                <p className="text-xs text-muted-foreground mt-1">Download books to read offline</p>
              </Card>
            ) : (
              downloadedBooks.map((book) => (
                <Card key={book.url} className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <Book className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{book.title}</h4>
                    <p className="text-xs text-muted-foreground">{formatFileSize(book.size || 0)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => setSelectedBook({ url: book.url, title: book.title })} className="h-7 w-7 p-0">
                      <BookOpen className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteBook(book.url)} className="h-7 w-7 p-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">My Collections</h3>
              <Button size="sm" onClick={handleCreateCollection}>
                <Plus className="w-3 h-3 mr-1" />
                New
              </Button>
            </div>
            
            {collections.length === 0 ? (
              <Card className="p-4 text-center">
                <Folder className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No collections</p>
              </Card>
            ) : (
              collections.map((collection) => (
                <Card key={collection.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${collection.color} flex items-center justify-center shrink-0`}>
                      <span className="text-sm">{collection.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{collection.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{collection.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{collection.books.length} books</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                      onClick={() => {
                        const updated = collections.filter(c => c.id !== collection.id);
                        setCollections(updated);
                        saveCollections(updated);
                      }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="mt-3 space-y-2">
            {recentlyRead.length === 0 ? (
              <Card className="p-4 text-center">
                <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent reads</p>
              </Card>
            ) : (
              recentlyRead.map((item, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Book className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.bookTitle}</h4>
                      <p className="text-xs text-muted-foreground">
                        {getProgressPercentage(item.progress)}% complete
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setSelectedBook({ url: item.bookUrl, title: item.bookTitle })} className="h-7 w-7 p-0">
                      <BookOpen className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-3 space-y-3">
            <Card className="p-4 text-center border-dashed border-2">
              <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <h3 className="font-semibold text-sm mb-1">Add PDF</h3>
              <p className="text-xs text-muted-foreground mb-3">Upload or add books to your library</p>
              
              <div className="space-y-2">
                <input type="file" accept=".pdf,application/pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} className="w-full h-8 text-xs">
                  <Upload className="w-3 h-3 mr-1" />
                  Upload PDF
                </Button>
                
                <Button variant="outline" onClick={() => setShowAddBook(true)} className="w-full h-8 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Add URL
                </Button>
              </div>
              
              {uploadProgress > 0 && (
                <div className="mt-3">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Book Modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-50">
          <Card className="w-full max-w-sm p-4">
            <h2 className="text-lg font-bold mb-3">Add Book</h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="Enter book title"
                  className="h-9"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">URL</label>
                <Input
                  value={newBookUrl}
                  onChange={(e) => setNewBookUrl(e.target.value)}
                  placeholder="Enter PDF URL"
                  className="h-9"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={newBookCategory}
                  onChange={(e) => setNewBookCategory(e.target.value as BookCategory)}
                  className="w-full px-3 py-2 border rounded-md bg-background h-9"
                >
                  {Object.keys(CATEGORY_CONFIG).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddUserBook} className="flex-1 h-8 text-xs">
                Add Book
              </Button>
              <Button variant="outline" onClick={() => setShowAddBook(false)} className="flex-1 h-8 text-xs">
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-50">
          <div className="bg-background rounded-lg w-full h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="text-sm font-semibold truncate">{selectedBook.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedBook(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-xs text-muted-foreground">Loading PDF...</p>
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
  );
};

export default EbooksPage;
