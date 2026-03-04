import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, ChevronRight, Bookmark, Edit3, History, FileText, Headphones, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext-new";
import { useI18n } from "@/hooks/useI18n";
import { PageTransition } from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { AppBar } from "@/components/AppBar";
import { fetchTafsir, TAFSIR_EDITIONS, type TafsirEdition } from "@/lib/tafsir";
import { useToast } from "@/hooks/use-toast";
import { TTSPlayer } from "@/components/TTSPlayer";

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

interface ComparisonTafsir {
  edition: TafsirEdition;
  tafsirs: TafsirData[];
}

const Tafsir = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
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
  const [bookmarks, setBookmarks] = useState<Array<{surah: number, surahName: string}>>([]);
  const [searchTafsirQuery, setSearchTafsirQuery] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [expandedComparisonAyahs, setExpandedComparisonAyahs] = useState<Set<number>>(new Set());
  const [tafsirHistory, setTafsirHistory] = useState<Array<{surah: number, surahName: string, timestamp: number}>>([]);
  const [personalNotes, setPersonalNotes] = useState<Record<string, string>>({});
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [currentAyahForNote, setCurrentAyahForNote] = useState<{surah: number, ayah: number} | null>(null);
  const [showTTSPlayer, setShowTTSPlayer] = useState(false);
  const [currentTTSText, setCurrentTTSText] = useState("");
  const [comparisonData, setComparisonData] = useState<ComparisonTafsir[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);

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
      return [historyEntry, ...filtered].slice(0, 10);
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
    if (!currentSurahTafsir || !searchTafsirQuery) return currentSurahTafsir.tafsirs;
    
    return currentSurahTafsir.tafsirs.filter(tafsir =>
      tafsir.text.toLowerCase().includes(searchTafsirQuery.toLowerCase())
    );
  };

  const getComparisonTafsirs = async (surah: Surah, editions: string[]): Promise<ComparisonTafsir[]> => {
    const results: ComparisonTafsir[] = [];
    
    for (const editionId of editions) {
      try {
        const edition = TAFSIR_EDITIONS.find(e => e.id === editionId);
        if (!edition) continue;
        
        const tafsirs: TafsirData[] = [];
        for (let ayah = 1; ayah <= Math.min(surah.numberOfAyahs, 10); ayah++) {
          try {
            const tafsir = await fetchTafsir(surah.number, ayah, editionId);
            tafsirs.push(tafsir);
          } catch (error) {
            console.warn(`Failed to fetch comparison tafsir for ${surah.number}:${ayah}`, error);
          }
        }
        
        results.push({ edition, tafsirs });
      } catch (error) {
        console.warn(`Failed to load edition ${editionId}`, error);
      }
    }
    
    return results;
  };

  const handleComparison = async () => {
    if (!selectedSurah) return;
    
    setComparisonLoading(true);
    try {
      const editions = [selectedEdition, ...TAFSIR_EDITIONS.filter(e => e.id !== selectedEdition).slice(0, 2).map(e => e.id)];
      const data = await getComparisonTafsirs(selectedSurah, editions);
      setComparisonData(data);
      setExpandedComparisonAyahs(new Set());
    } catch (error) {
      console.error("Error loading comparison:", error);
      toast({
        title: "Error",
        description: "Failed to load comparison data",
        variant: "destructive"
      });
    } finally {
      setComparisonLoading(false);
    }
  };

  const toggleComparisonAyah = (ayah: number) => {
    const newExpanded = new Set(expandedComparisonAyahs);
    if (newExpanded.has(ayah)) {
      newExpanded.delete(ayah);
    } else {
      newExpanded.add(ayah);
    }
    setExpandedComparisonAyahs(newExpanded);
  };

  const handleTTS = (text: string) => {
    setCurrentTTSText(text);
    setShowTTSPlayer(true);
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
      <div className="min-h-screen bg-background pb-20">
        <AppBar 
          title={currentSurahTafsir ? currentSurahTafsir.englishName : selectedSurah ? selectedSurah.englishName : "Tafsir"} 
          showBack={true} 
        />

        <div className="max-w-lg mx-auto px-5 py-4 space-y-6">

          {/* Tafsir Header */}
          {!selectedSurah && (
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 shadow-xl shadow-emerald-500/10">
              <div className="absolute top-0 end-0 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 start-0 w-32 h-32 bg-white/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{ti18n('quranicCommentary')}</span>
                </div>

                <h1 className="text-3xl font-black text-white mb-2 font-arabic tracking-tight">{ti18n('tafsir')}</h1>
                <p className="text-white/60 text-xs font-medium max-w-[200px]">{ti18n('exploreDeeperMeanings')}</p>

                <div className="grid grid-cols-2 gap-2 mt-6">
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
                    <p className="text-white text-sm font-black">{TAFSIR_EDITIONS.length}</p>
                    <p className="text-white/40 text-[9px] uppercase font-bold">{ti18n('editions')}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
                    <p className="text-white text-sm font-black">{bookmarks.length}</p>
                    <p className="text-white/40 text-[9px] uppercase font-bold">{ti18n('bookmarks')}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
                    <p className="text-white text-sm font-black">{tafsirHistory.length}</p>
                    <p className="text-white/40 text-[9px] uppercase font-bold">{ti18n('history')}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
                    <p className="text-white text-sm font-black">{Object.keys(personalNotes).length}</p>
                    <p className="text-white/40 text-[9px] uppercase font-bold">{ti18n('notes')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Header */}
          {!selectedSurah && (
            <div className="sticky top-[4.5rem] z-30 bg-background/80 backdrop-blur-xl py-2 -mx-5 px-5">
              <div className="relative group">
                <div className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors">
                  <Search className="w-4 h-4" />
                </div>
                <Input
                  placeholder={ti18n('searchBySurahNameOrNumber')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-11 h-12 bg-card/50 border-border/40 rounded-2xl focus:ring-emerald-600/20"
                />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {!selectedSurah && tafsirHistory.length === 0 && bookmarks.length === 0 && (
            <Card className="p-4 border-purple-200 bg-purple-50/50">
              <h3 className="font-bold text-purple-800 mb-3">{ti18n('quickActions')}</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="bg-white/60 hover:bg-white/80 border-purple-300 text-purple-700"
                  onClick={() => {
                    const randomSurah = surahs[Math.floor(Math.random() * Math.min(114, surahs.length))];
                    handleSurahSelect(randomSurah);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {ti18n('randomSurah')}
                </Button>
                <Button
                  variant="outline"
                  className="bg-white/60 hover:bg-white/80 border-purple-300 text-purple-700"
                  onClick={() => {
                    if (currentSurahTafsir) {
                      const firstTafsir = currentSurahTafsir.tafsirs[0];
                      if (firstTafsir) {
                        handleTTS(firstTafsir.text);
                      }
                    } else {
                      toast({
                        title: ti18n('noTafsirAvailable'),
                        description: ti18n('selectSurahFirst')
                      });
                    }
                  }}
                >
                  <Headphones className="w-4 h-4 mr-2" />
                  {ti18n('audioTafsir')} (TTS)
                </Button>
              </div>
            </Card>
          )}

          {/* History & Bookmarks */}
          {!selectedSurah && (tafsirHistory.length > 0 || bookmarks.length > 0) && (
            <div className="space-y-4">
              {tafsirHistory.length > 0 && (
                <Card className="p-4 border-blue-200 bg-blue-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-blue-800 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      {ti18n('recentlyViewed')}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {tafsirHistory.slice(0, 3).map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSurahSelect(surahs.find(s => s.number === item.surah)!)}
                        className="w-full flex items-center justify-between p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-blue-700">{item.surahName}</span>
                        <span className="text-xs text-blue-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              {bookmarks.length > 0 && (
                <Card className="p-4 border-emerald-200 bg-emerald-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                      <Bookmark className="w-4 h-4" />
                      {ti18n('bookmarkedSurahs')}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {bookmarks.slice(0, 3).map((bookmark, index) => (
                      <button
                        key={index}
                        onClick={() => handleSurahSelect(surahs.find(s => s.number === bookmark.surah)!)}
                        className="w-full p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-emerald-700">{bookmark.surahName}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Edition Selector */}
          {selectedSurah && !currentSurahTafsir && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">{ti18n('tafsirEdition')}:</span>
              <Select value={selectedEdition} onValueChange={setSelectedEdition}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAFSIR_EDITIONS.map((edition) => (
                    <SelectItem key={edition.id} value={edition.id}>
                      {edition.name} ({edition.language})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Loading State */}
          {selectedSurah && !currentSurahTafsir && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">{ti18n('loadingCompleteSurahTafsir')}</p>
              <p className="text-xs text-muted-foreground mt-1">{ti18n('thisMayTakeMoment')}</p>
            </div>
          )}

          {/* Comparison View */}
          {showComparison && comparisonData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="p-6 border-orange-200 bg-orange-50/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-orange-800">
                    {ti18n('tafsirComparison')} - {currentSurahTafsir?.englishName}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowComparison(false)}
                  >
                    {ti18n('closeComparison')}
                  </Button>
                </div>
                
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {comparisonData[0]?.tafsirs.map((tafsir, ayahIndex) => (
                    <div key={ayahIndex} className="border border-orange-200 rounded-lg overflow-hidden mb-4">
                      <div 
                        className="bg-orange-100 p-3 cursor-pointer hover:bg-orange-200 transition-colors"
                        onClick={() => toggleComparisonAyah(tafsir.ayah)}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-orange-800">
                            {ti18n('ayah')} {tafsir.ayah}
                          </h4>
                          <div className="text-orange-600">
                            {expandedComparisonAyahs.has(tafsir.ayah) ? '−' : '+'}
                          </div>
                        </div>
                      </div>
                      
                      {expandedComparisonAyahs.has(tafsir.ayah) && (
                        <div className="p-4 space-y-4 bg-white">
                          {comparisonData.map((editionData, editionIndex) => {
                            const editionTafsir = editionData.tafsirs.find(t => t.ayah === tafsir.ayah);
                            if (!editionTafsir) return null;
                            
                            return (
                              <div key={editionIndex} className="border-l-4 border-orange-300 pl-4">
                                <h5 className="font-medium text-orange-600 mb-2">
                                  {editionData.edition.name} ({editionData.edition.language})
                                </h5>
                                <p className="text-gray-700 leading-relaxed text-sm bg-orange-50 p-3 rounded">
                                  {editionTafsir.text}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Tafsir Content */}
          {currentSurahTafsir && !showComparison && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Action Bar */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-64">
                  <div className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors">
                    <Search className="w-4 h-4" />
                  </div>
                  <Input
                    placeholder={ti18n('searchWithinTafsir')}
                    value={searchTafsirQuery}
                    onChange={(e) => setSearchTafsirQuery(e.target.value)}
                    className="ps-10 h-10 bg-card/50 border-border/40 rounded-xl"
                  />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleComparison}
                  disabled={comparisonLoading}
                  className={showComparison ? "bg-emerald-100 border-emerald-300" : ""}
                >
                  {comparisonLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600" />
                  ) : (
                    <GitCompare className="w-4 h-4 mr-1" />
                  )}
                  {ti18n('compare')}
                </Button>
                
                <Dialog open={showNotesEditor} onOpenChange={setShowNotesEditor}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit3 className="w-4 h-4 mr-1" />
                      {ti18n('notes')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{ti18n('addPersonalNote')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder={ti18n('enterPersonalNote')}
                        defaultValue={currentAyahForNote ? personalNotes[`${currentAyahForNote.surah}:${currentAyahForNote.ayah}`] || "" : ""}
                        className="min-h-32"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => {
                          const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                          if (textarea) saveNote(textarea.value);
                        }}>
                          {ti18n('saveNote')}
                        </Button>
                        <Button variant="outline" onClick={() => setShowNotesEditor(false)}>
                          {ti18n('cancel')}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="p-6 border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-emerald-800">
                      {currentSurahTafsir.surahName} ({currentSurahTafsir.englishName})
                    </h3>
                    <p className="text-sm text-emerald-600">
                      {ti18n('completeSurahTafsir')} {searchTafsirQuery && `(${getFilteredTafsirs().length} ${ti18n('results')})`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBookmark}
                      className={isBookmarked ? "bg-emerald-100 border-emerald-300" : ""}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-emerald-600 text-emerald-600" : ""}`} />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {getFilteredTafsirs().map((tafsir, index) => {
                    const noteKey = `${tafsir.surah}:${tafsir.ayah}`;
                    const hasNote = personalNotes[noteKey];
                    
                    return (
                      <div key={index} className="border-l-4 border-emerald-300 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-emerald-700">
                            {ti18n('ayah')} {tafsir.ayah}
                          </h4>
                          <div className="flex gap-1">
                            {hasNote && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" title={ti18n('hasPersonalNote')} />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleNote(tafsir.surah, tafsir.ayah)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTTS(tafsir.text)}
                              className="h-6 w-6 p-0"
                              title={ti18n('listenToTafsir')}
                            >
                              <Headphones className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-justify mb-2">
                          {tafsir.text}
                        </p>
                        {hasNote && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                            <p className="text-sm text-blue-800 font-medium mb-1">{ti18n('personalNote')}:</p>
                            <p className="text-sm text-blue-700">{personalNotes[noteKey]}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Surah List */}
          {!selectedSurah && !loading && (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredSurahs.map((surah, index) => (
                  <motion.div
                    key={surah.number}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => handleSurahSelect(surah)}
                      className="w-full group"
                    >
                      <Card className="p-4 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 border-emerald-100 hover:border-emerald-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                              <span className="text-emerald-700 font-bold text-sm">{surah.number}</span>
                            </div>
                            <div className="text-left">
                              <p className="font-arabic text-lg text-emerald-800 font-medium">{surah.name}</p>
                              <p className="text-sm text-gray-600">{surah.englishName}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-emerald-600 opacity-50 ml-2" />
                        </div>
                      </Card>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && filteredSurahs.length === 0 && !selectedSurah && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{ti18n('noSurahsFound')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Global TTS Player */}
      <TTSPlayer
        text={currentTTSText}
        isVisible={showTTSPlayer}
        onToggle={() => setShowTTSPlayer(false)}
      />

      <div className="px-8 mt-12 text-center opacity-40">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em]">
          Noor Connect • {ti18n('spiritualCompanion')}
        </p>
      </div>
    </PageTransition>
  );
};

export default Tafsir;
