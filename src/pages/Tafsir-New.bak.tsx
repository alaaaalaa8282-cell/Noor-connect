import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Search,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Bookmark,
  Share2,
  Filter,
  Edit3,
  History,
  FileText,
  Languages,
  MoreVertical,
  Type,
  Settings,
  ChevronDown,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext-new";
import { useI18n } from "@/hooks/useI18n";
import { PageTransition } from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { AppBar } from "@/components/AppBar";
import { fetchTafsir, TAFSIR_EDITIONS, type TafsirEdition } from "@/lib/tafsir";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface TafsirData {
  surah: number;
  ayah: number;
  text: string;
}

interface SurahTafsir {
  surah: number;
  surahName: string;
  englishName: string;
  tafsirs: TafsirData[];
}


const Tafsir = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { t: ti18n } = useI18n();
  const { toast } = useToast();

  const [surahs, setSurahs] = useState<Surah[]>(() => {
    try {
      const cached = localStorage.getItem('quran-surahs-cache');
      if (cached) return JSON.parse(cached);
    } catch (error) {
      console.warn("localStorage cache load failed:", error);
    }
    return [];
  });

  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>(surahs);
  const [loading, setLoading] = useState(surahs.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [currentSurahTafsir, setCurrentSurahTafsir] = useState<SurahTafsir | null>(null);
  const [selectedEdition, setSelectedEdition] = useState<string>("en-tafisr-ibn-kathir");
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<Array<{ surah: number, surahName: string }>>([]);
  const [searchTafsirQuery, setSearchTafsirQuery] = useState("");
  const [tafsirHistory, setTafsirHistory] = useState<Array<{ surah: number, surahName: string, timestamp: number }>>([]);
  const [personalNotes, setPersonalNotes] = useState<Record<string, string>>({});
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [currentAyahForNote, setCurrentAyahForNote] = useState<{ surah: number, ayah: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"surahs" | "bookmarks" | "history">("surahs");
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">("base");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fontSizeClasses = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  };

  useEffect(() => {
    const saved = localStorage.getItem('tafsir-bookmarks');
    if (saved) setBookmarks(JSON.parse(saved));

    const savedHistory = localStorage.getItem('tafsir-history');
    if (savedHistory) setTafsirHistory(JSON.parse(savedHistory));

    const savedNotes = localStorage.getItem('tafsir-notes');
    if (savedNotes) setPersonalNotes(JSON.parse(savedNotes));
  }, []);


  const fetchSurahs = async () => {
    try {
      const response = await fetch("https://api.alquran.cloud/v1/surah");
      const data = await response.json();
      setSurahs(data.data);
      setFilteredSurahs(prev => searchQuery ? prev : data.data);
      try { localStorage.setItem('quran-surahs-cache', JSON.stringify(data.data)); } catch (error) { console.warn("localStorage cache save failed:", error); }
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const handleSurahSelect = async (surah: Surah) => {
    setSelectedSurah(surah);
    setTafsirLoading(true);

    // Add to history
    const historyEntry = {
      surah: surah.number,
      surahName: surah.name,
      timestamp: Date.now()
    };
    setTafsirHistory(prev => {
      const filtered = prev.filter(h => h.surah !== surah.number);
      return [historyEntry, ...filtered].slice(0, 10); // Keep last 10
    });
    try {
      localStorage.setItem('tafsir-history', JSON.stringify([historyEntry, ...tafsirHistory.filter(h => h.surah !== surah.number)].slice(0, 10)));
    } catch (error) {
      console.warn("Failed to save history:", error);
    }

    try {
      // Check cache first
      const cacheKey = `tafsir-surah-${selectedEdition}-${surah.number}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        setCurrentSurahTafsir(JSON.parse(cached));
        setTafsirLoading(false);
        return;
      }

      // Fetch Tafsir for all ayahs in surah
      const tafsirs: TafsirData[] = [];

      for (let ayah = 1; ayah <= surah.numberOfAyahs; ayah++) {
        try {
          const tafsir = await fetchTafsir(surah.number, ayah, selectedEdition);
          tafsirs.push(tafsir);
        } catch (error) {
          console.warn(`Failed to fetch tafsir for ${surah.number}:${ayah}`, error);
          // Continue with next ayah even if one fails
        }
      }

      const surahTafsir: SurahTafsir = {
        surah: surah.number,
        surahName: surah.name,
        englishName: surah.englishName,
        tafsirs: tafsirs
      };

      setCurrentSurahTafsir(surahTafsir);

      // Cache the result
      try {
        localStorage.setItem(cacheKey, JSON.stringify(surahTafsir));
      } catch (error) {
        console.warn("Failed to cache surah tafsir:", error);
      }
    } catch (error) {
      console.error("Error loading surah tafsir:", error);
      toast({
        title: "Error",
        description: "Failed to load Tafsir for this Surah",
        variant: "destructive"
      });
    } finally {
      setTafsirLoading(false);
    }
  };

  const handleBookmark = () => {
    if (!selectedSurah || !currentSurahTafsir) return;

    const bookmark = {
      surah: selectedSurah.number,
      surahName: selectedSurah.name
    };

    const exists = bookmarks.some(b => b.surah === bookmark.surah);

    if (exists) {
      setBookmarks(prev => prev.filter(b => b.surah !== bookmark.surah));
      toast({
        title: "Bookmark Removed",
        description: "Surah Tafsir has been removed from bookmarks"
      });
    } else {
      setBookmarks(prev => [...prev, bookmark]);
      toast({
        title: "Bookmarked",
        description: "Surah Tafsir has been bookmarked"
      });
    }

    try {
      const updated = exists ? bookmarks.filter(b => b.surah !== bookmark.surah) : [...bookmarks, bookmark];
      localStorage.setItem('tafsir-bookmarks', JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save bookmarks:", error);
    }
  };

  const handleNote = (surah: number, ayah: number) => {
    setCurrentAyahForNote({ surah, ayah });
    setShowNotesEditor(true);
  };

  const saveNote = (note: string) => {
    if (!currentAyahForNote) return;

    const key = `${currentAyahForNote.surah}:${currentAyahForNote.ayah}`;
    const updatedNotes = { ...personalNotes, [key]: note };
    setPersonalNotes(updatedNotes);

    try {
      localStorage.setItem('tafsir-notes', JSON.stringify(updatedNotes));
    } catch (error) {
      console.warn("Failed to save notes:", error);
    }

    setShowNotesEditor(false);
    setCurrentAyahForNote(null);
    toast({
      title: "Note Saved",
      description: "Personal note has been saved"
    });
  };

  const getFilteredTafsirs = () => {
    if (!currentSurahTafsir?.tafsirs) return [];
    if (!searchTafsirQuery) return currentSurahTafsir.tafsirs;

    return currentSurahTafsir.tafsirs.filter(tafsir =>
      tafsir.text?.toLowerCase().includes(searchTafsirQuery.toLowerCase())
    );
  };


  const isBookmarked = selectedSurah &&
    bookmarks.some(b => b.surah === selectedSurah.number);

  const goBack = () => {
    if (currentSurahTafsir) {
      setCurrentSurahTafsir(null);
    } else {
      navigate('/services');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAF9] pb-20 dark:bg-slate-950">
        <AppBar
          title={currentSurahTafsir ? currentSurahTafsir.englishName : selectedSurah ? selectedSurah.englishName : "Tafsir"}
          showBack={true}
          onBack={goBack}
          actions={
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-emerald-700">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <div className="p-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">Appearance</p>
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-sm">Font Size</span>
                      <div className="flex gap-1">
                        {(['sm', 'base', 'lg', 'xl'] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={cn(
                              "w-8 h-8 rounded flex items-center justify-center text-xs font-bold border transition-all",
                              fontSize === size
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                            )}
                          >
                            {size.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">Tafsir Edition</p>
                    {TAFSIR_EDITIONS.map((edition) => (
                      <DropdownMenuItem
                        key={edition.id}
                        onClick={() => {
                          setSelectedEdition(edition.id);
                          if (selectedSurah) handleSurahSelect(selectedSurah);
                        }}
                        className={cn("flex items-center justify-between", selectedEdition === edition.id && "bg-emerald-50 text-emerald-700")}
                      >
                        <div className="flex flex-col">
                          <span>{edition.name}</span>
                          {edition.author && (
                            <span className="text-[10px] opacity-70">by {edition.author}</span>
                          )}
                        </div>
                        <span className="text-[10px] opacity-50">{edition.language}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />

        <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
          {/* Dashboard Mode (Surah List) */}
          {!selectedSurah && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Modern Header Hero */}
              <div className="relative rounded-[2.5rem] bg-gradient-to-br from-[#115E59] via-[#0D9488] to-[#0891B2] p-8 shadow-2xl shadow-emerald-900/20 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white tracking-tight">Holy Tafsir</h1>
                      <p className="text-emerald-100/70 text-sm font-medium">Explore the depths of Quran</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setActiveTab("history")}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/10 transition-all text-left group"
                    >
                      <History className="w-4 h-4 text-emerald-200 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-white text-xs font-bold uppercase tracking-tighter opacity-60">History</p>
                      <p className="text-white text-lg font-black">{tafsirHistory.length}</p>
                    </button>
                    <button
                      onClick={() => setActiveTab("bookmarks")}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/10 transition-all text-left group"
                    >
                      <Bookmark className="w-4 h-4 text-emerald-200 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-white text-xs font-bold uppercase tracking-tighter opacity-60">Saved</p>
                      <p className="text-white text-lg font-black">{bookmarks.length}</p>
                    </button>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-left">
                      <Edit3 className="w-4 h-4 text-emerald-200 mb-2" />
                      <p className="text-white text-xs font-bold uppercase tracking-tighter opacity-60">Notes</p>
                      <p className="text-white text-lg font-black">{Object.keys(personalNotes).length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Section */}
              <div className="sticky top-20 z-20 transition-all duration-300 space-y-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <Input
                    placeholder="Search Surah name or number..."
                    className="h-14 pl-12 rounded-2xl border-none bg-white shadow-xl shadow-slate-200/50 focus-visible:ring-emerald-500/30 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180" />
                    </button>
                  )}
                </div>

                {/* Tafsir Author Selector - Visible UI */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Languages className="w-5 h-5 text-emerald-600" />
                    <span>Select Tafsir Author</span>
                  </div>
                  <Select
                    value={selectedEdition}
                    onValueChange={(value) => {
                      setSelectedEdition(value);
                      if (selectedSurah) handleSurahSelect(selectedSurah);
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 text-slate-700">
                      <SelectValue placeholder="Choose a Tafsir" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-80 overflow-y-auto">
                      {TAFSIR_EDITIONS.map((edition) => (
                        <SelectItem key={edition.id} value={edition.id} className="rounded-lg py-3">
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-slate-800">{edition.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100">
                                {edition.language}
                              </Badge>
                              {edition.author && (
                                <span className="text-[10px] text-slate-400">by {edition.author}</span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Navigation Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="w-full bg-slate-200/50 p-1 rounded-xl h-12">
                  <TabsTrigger value="surahs" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">All Surahs</TabsTrigger>
                  <TabsTrigger value="bookmarks" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Bookmarks</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">History</TabsTrigger>
                </TabsList>

                <TabsContent value="surahs" className="mt-6 space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {filteredSurahs.map((surah) => (
                      <button
                        key={surah.number}
                        onClick={() => handleSurahSelect(surah)}
                        className="group relative flex items-center p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-100 transition-all text-left"
                      >
                        <div className="relative w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-black group-hover:bg-emerald-600 group-hover:text-white transition-all overflow-hidden">
                          <span className="relative z-10">{surah.number}</span>
                          <div className="absolute inset-0 opacity-10 font-arabic text-3xl flex items-center justify-center translate-x-2 translate-y-2 select-none">{surah.name}</div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{surah.englishName}</h3>
                          <p className="text-xs text-slate-400 font-medium">{surah.englishNameTranslation} • {surah.numberOfAyahs} Ayahs</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="font-arabic text-lg text-emerald-600 font-bold">{surah.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{surah.revelationType}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="bookmarks" className="mt-6">
                  {bookmarks.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-white rounded-3xl border border-dashed border-slate-200">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <Bookmark className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="font-bold text-slate-800">No bookmarks yet</h3>
                      <p className="text-sm text-slate-500 max-w-[200px] mx-auto mt-2">Save surahs you read frequently for quick access.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {bookmarks.map((bookmark) => (
                        <button
                          key={bookmark.surah}
                          onClick={() => {
                            const s = surahs.find(x => x.number === bookmark.surah);
                            if (s) handleSurahSelect(s);
                          }}
                          className="flex items-center p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                            {bookmark.surah}
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="font-bold text-slate-800">{bookmark.surahName}</h3>
                            <p className="text-xs text-slate-400">Bookmarked</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  {tafsirHistory.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-white rounded-3xl border border-dashed border-slate-200">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <History className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="font-bold text-slate-800">No history available</h3>
                      <p className="text-sm text-slate-500 max-w-[200px] mx-auto mt-2">Start exploring Tafsir to see your history here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {tafsirHistory.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const s = surahs.find(x => x.number === item.surah);
                            if (s) handleSurahSelect(s);
                          }}
                          className="flex items-center p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {item.surah}
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="font-bold text-slate-800">{item.surahName}</h3>
                            <p className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Reader Mode (Tafsir Content) */}
          {selectedSurah && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
              {/* Reader Header Card */}
              <div className="relative rounded-[2.5rem] bg-white p-6 shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-600/20">
                      {selectedSurah.number}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{selectedSurah.englishName}</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedSurah.revelationType} • {selectedSurah.numberOfAyahs} Ayahs</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("rounded-xl transition-all", isBookmarked && "bg-emerald-50 text-emerald-600")}
                      onClick={handleBookmark}
                    >
                      <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <Separator className="bg-slate-100 mb-4" />

                <div className="flex flex-wrap items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-10 px-4 bg-slate-50 border-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                      >
                        <Languages className="w-4 h-4 mr-2" />
                        {TAFSIR_EDITIONS.find(e => e.id === selectedEdition)?.name.split(' ')[0] || "Author"}
                        <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72 rounded-2xl max-h-80 overflow-y-auto">
                      {TAFSIR_EDITIONS.map((edition) => (
                        <DropdownMenuItem
                          key={edition.id}
                          onClick={() => {
                            setSelectedEdition(edition.id);
                            if (selectedSurah) handleSurahSelect(selectedSurah);
                          }}
                          className={cn("flex items-center justify-between py-3 rounded-xl", selectedEdition === edition.id && "bg-emerald-50 text-emerald-700")}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold">{edition.name}</span>
                            {edition.author && (
                              <span className="text-[10px] opacity-70">by {edition.author}</span>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[9px]">{edition.language}</Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search in Tafsir..."
                      className="h-10 pl-9 rounded-xl border-none bg-slate-50 focus-visible:ring-emerald-500/20 text-sm"
                      value={searchTafsirQuery}
                      onChange={(e) => setSearchTafsirQuery(e.target.value)}
                    />
                  </div>
                </div>

              </div>

              {/* Loading State for Tafsir */}
              {tafsirLoading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
                    <BookOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">Fetching Wisdom</p>
                    <p className="text-sm text-slate-500">Loading comprehensive Tafsir for {selectedSurah.englishName}...</p>
                  </div>
                </div>
              )}

              {/* Tafsir Content List */}
              <div className="space-y-4">
                {getFilteredTafsirs().map((tafsir, idx) => {
                  const noteKey = `${tafsir.surah}:${tafsir.ayah}`;
                  const hasNote = personalNotes[noteKey];
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-sm">
                            {tafsir.ayah}
                          </span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ayah {tafsir.ayah}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 rounded-lg", hasNote && "bg-blue-50 text-blue-600")}
                            onClick={() => handleNote(tafsir.surah, tafsir.ayah)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>

                        </div>
                      </div>

                      <div className={cn(
                        "font-medium text-slate-700 leading-relaxed text-justify",
                        fontSizeClasses[fontSize]
                      )}>
                        {tafsir.text}
                      </div>

                      {hasNote && (
                        <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                            <MessageSquare className="w-3 h-3" />
                            Personal Note
                          </div>
                          <p className="text-sm text-blue-800/80 italic">{personalNotes[noteKey]}</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* No Results in Search */}
              {!tafsirLoading && getFilteredTafsirs().length === 0 && (
                <div className="text-center py-12 px-6 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-800">No matches found</h3>
                  <p className="text-sm text-slate-500 mt-2">Try searching for different keywords within this Tafsir.</p>
                </div>
              )}
            </div>
          )}

          {/* Note Editor Dialog */}
          <Dialog open={showNotesEditor} onOpenChange={setShowNotesEditor}>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  Ayah Note
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Source Verse</p>
                  <p className="text-sm text-slate-600 font-medium line-clamp-2">
                    {currentAyahForNote && currentSurahTafsir?.tafsirs.find(t => t.ayah === currentAyahForNote.ayah)?.text}
                  </p>
                </div>
                <Textarea
                  placeholder="Reflect on this ayah..."
                  defaultValue={currentAyahForNote ? personalNotes[`${currentAyahForNote.surah}:${currentAyahForNote.ayah}`] || "" : ""}
                  className="min-h-[150px] rounded-2xl border-slate-200 focus-visible:ring-emerald-500/20 text-base"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowNotesEditor(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                    if (textarea) saveNote(textarea.value);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Save Reflection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>



        </div>
      </div>
    </PageTransition>
  );
};

export default Tafsir;
