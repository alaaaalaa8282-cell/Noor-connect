import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, ChevronRight, Bookmark, Edit3, History, FileText, Headphones, GitCompare, AlertCircle } from "lucide-react";
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
import { VoiceCheckDialog } from "@/components/VoiceCheckDialog";

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
  const { language } = useLanguage();
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
  const [currentTTSLabel, setCurrentTTSLabel] = useState("");
  const [ttsAutoPlayToken, setTtsAutoPlayToken] = useState<number | undefined>(undefined);
  const [comparisonData, setComparisonData] = useState<ComparisonTafsir[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [showVoiceCheck, setShowVoiceCheck] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tafsir-bookmarks');
    if (saved) setBookmarks(JSON.parse(saved));

    const savedHistory = localStorage.getItem('tafsir-history');
    if (savedHistory) setTafsirHistory(JSON.parse(savedHistory));

    const savedNotes = localStorage.getItem('tafsir-notes');
    if (savedNotes) setPersonalNotes(JSON.parse(savedNotes));
  }, []);

  useEffect(() => {
    if (surahs.length === 0) {
      void fetchSurahs();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSurahs(surahs);
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    const filtered = surahs.filter((surah) =>
      surah.name.toLowerCase().includes(query) ||
      surah.englishName.toLowerCase().includes(query) ||
      surah.englishNameTranslation.toLowerCase().includes(query) ||
      surah.number.toString() === query
    );
    setFilteredSurahs(filtered);
  }, [searchQuery, surahs]);

  const fetchSurahs = async () => {
    try {
      const response = await fetch("https://api.alquran.cloud/v1/surah");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSurahs(data.data);
      setFilteredSurahs(searchQuery ? [] : data.data);
      try { 
        localStorage.setItem('quran-surahs-cache', JSON.stringify(data.data)); 
      } catch (error) { 
        console.warn("localStorage cache save failed:", error); 
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching surahs:", error);
      toast({
        title: "Error",
        description: "Failed to load surahs",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleSurahSelect = async (
    surah: Surah,
    options?: { editionId?: string; addToHistory?: boolean }
  ) => {
    const editionId = options?.editionId ?? selectedEdition;
    const addToHistory = options?.addToHistory ?? true;
    setSelectedSurah(surah);
    setTafsirLoading(true);
    setShowComparison(false);
    setComparisonData([]);
    
    if (addToHistory) {
      const historyEntry = {
        surah: surah.number,
        surahName: surah.name,
        timestamp: Date.now()
      };
      setTafsirHistory(prev => {
        const updated = [historyEntry, ...prev.filter(h => h.surah !== surah.number)].slice(0, 10);
        try {
          localStorage.setItem('tafsir-history', JSON.stringify(updated));
        } catch (error) {
          console.warn("Failed to save history:", error);
        }
        return updated;
      });
    }
    
    try {
      const cacheKey = `tafsir-surah-${editionId}-${surah.number}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        setCurrentSurahTafsir(JSON.parse(cached));
        setTafsirLoading(false);
        return;
      }

      const tafsirs: TafsirData[] = [];
      
      for (let ayah = 1; ayah <= surah.numberOfAyahs; ayah++) {
        try {
          const tafsir = await fetchTafsir(surah.number, ayah, editionId);
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
      
      try { 
        localStorage.setItem(cacheKey, JSON.stringify(surahTafsir)); 
      } catch (error) { 
        console.warn("localStorage cache save failed:", error); 
      }
    } catch (error) {
      console.error("Error loading tafsir:", error);
      toast({
        title: "Error",
        description: "Failed to load tafsir",
        variant: "destructive"
      });
    } finally {
      setTafsirLoading(false);
    }
  };

  const getFilteredTafsirs = () => {
    if (!currentSurahTafsir) return [];
    if (!searchTafsirQuery.trim()) return currentSurahTafsir.tafsirs;
    
    return currentSurahTafsir.tafsirs.filter(tafsir =>
      tafsir.text.toLowerCase().includes(searchTafsirQuery.toLowerCase())
    );
  };

  const getComparisonTafsirs = async (surah: Surah, editions: string[]): Promise<ComparisonTafsir[]> => {
    const results: ComparisonTafsir[] = [];
    
    const promises = editions.map(async (editionId) => {
      const edition = TAFSIR_EDITIONS.find(e => e.id === editionId);
      if (!edition) return null;
      
      try {
        const tafsirs: TafsirData[] = [];
        const ayahsToFetch = Math.min(surah.numberOfAyahs, 20);
        
        for (let ayah = 1; ayah <= ayahsToFetch; ayah++) {
          try {
            const tafsir = await fetchTafsir(surah.number, ayah, editionId);
            tafsirs.push(tafsir);
          } catch (error) {
            console.warn(`Failed to fetch comparison tafsir for ${surah.number}:${ayah}`, error);
          }
        }
        
        return { edition, tafsirs };
      } catch (error) {
        console.warn(`Failed to load edition ${editionId}`, error);
        return null;
      }
    });
    
    const resolvedResults = await Promise.all(promises);
    return resolvedResults.filter((result): result is ComparisonTafsir => result !== null);
  };

  const handleComparison = async () => {
    if (!selectedSurah) return;
    
    setComparisonLoading(true);
    try {
      const otherEditions = TAFSIR_EDITIONS.filter(e => e.id !== selectedEdition).slice(0, 2);
      const editions = [selectedEdition, ...otherEditions.map(e => e.id)];
      const data = await getComparisonTafsirs(selectedSurah, editions);
      setComparisonData(data);
      setExpandedComparisonAyahs(new Set());
      setShowComparison(true);
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

  const handleTTS = (text: string, label?: string) => {
    if (!text.trim()) {
      toast({
        title: "No Text",
        description: "No tafsir text is available for audio",
        variant: "destructive"
      });
      return;
    }

    setCurrentTTSText(text);
    setCurrentTTSLabel(label || "Tafsir audio");
    setShowTTSPlayer(true);
    setTtsAutoPlayToken(Date.now());
  };

  const handlePlayVisibleTafsir = () => {
    if (!currentSurahTafsir) {
      return;
    }

    const tafsirsToPlay = getFilteredTafsirs();
    if (tafsirsToPlay.length === 0) {
      toast({
        title: "No Results",
        description: "No tafsir results found to play",
        variant: "destructive"
      });
      return;
    }

    const composedText = tafsirsToPlay
      .map((tafsir) => `Ayah ${tafsir.ayah}. ${tafsir.text}`)
      .join(" ");

    const maxLength = 12000;
    const textToPlay = composedText.length > maxLength ? composedText.slice(0, maxLength) : composedText;
    if (composedText.length > maxLength) {
      toast({
        title: "Long Tafsir",
        description: "Playing first part. Refine search to listen in smaller sections."
      });
    }

    const label = searchTafsirQuery.trim()
      ? `${currentSurahTafsir.englishName} - filtered tafsir`
      : `${currentSurahTafsir.englishName} - full tafsir`;
    handleTTS(textToPlay, label);
  };

  const isBookmarked = selectedSurah && 
    bookmarks.some(b => b.surah === selectedSurah.number);

  const goBack = () => {
    if (showComparison) {
      setShowComparison(false);
      return;
    }
    if (currentSurahTafsir) {
      setCurrentSurahTafsir(null);
      setSelectedSurah(null);
      setSearchTafsirQuery("");
      return;
    }

    if (selectedSurah) {
      setSelectedSurah(null);
      setSearchTafsirQuery("");
    } else {
      navigate('/services');
    }
  };

  const saveNote = (noteText: string) => {
    if (!currentAyahForNote) return;
    
    const noteKey = `${currentAyahForNote.surah}:${currentAyahForNote.ayah}`;
    setPersonalNotes(prev => {
      const updated = { ...prev, [noteKey]: noteText };
      try {
        localStorage.setItem('tafsir-notes', JSON.stringify(updated));
      } catch (error) {
        console.warn("Failed to save note:", error);
      }
      return updated;
    });
    setShowNotesEditor(false);
    setCurrentAyahForNote(null);
  };

  const handleBookmark = () => {
    if (!selectedSurah) return;
    
    const isBookmarked = bookmarks.some(b => b.surah === selectedSurah.number);
    const updatedBookmarks = isBookmarked 
      ? bookmarks.filter(b => b.surah !== selectedSurah.number)
      : [...bookmarks, { surah: selectedSurah.number, surahName: selectedSurah.name }];
    
    setBookmarks(updatedBookmarks);
    try {
      localStorage.setItem('tafsir-bookmarks', JSON.stringify(updatedBookmarks));
    } catch (error) {
      console.warn("Failed to save bookmark:", error);
    }
  };

  const handleNote = (surah: number, ayah: number) => {
    setCurrentAyahForNote({ surah, ayah });
    setShowNotesEditor(true);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-20">
        <AppBar 
          title={currentSurahTafsir ? currentSurahTafsir.englishName : selectedSurah ? selectedSurah.englishName : "Tafsir"} 
          showBack={true}
          onBack={goBack}
        />

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
          {/* Tafsir Header */}
          {!selectedSurah && (
            <div className="mb-8">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 shadow-2xl shadow-emerald-500/20">
                <div className="absolute top-0 end-0 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 start-0 w-32 h-32 bg-white/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{ti18n('quranicCommentary')}</span>
                  </div>
                  
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedSurah.name}
                    </h2>
                    <p className="text-white/90 text-lg">
                      {selectedSurah.englishName}
                    </p>
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
                    if (surahs.length === 0) {
                      toast({
                        title: "Loading",
                        description: "Surah list is still loading"
                      });
                      return;
                    }
                    const randomSurah = surahs[Math.floor(Math.random() * surahs.length)];
                    void handleSurahSelect(randomSurah);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {ti18n('randomSurah')}
                </Button>
                <Button
                  variant="outline"
                  className="bg-white/60 hover:bg-white/80 border-purple-300 text-purple-700"
                  onClick={() => {
                    handleTTS(
                      "Select any surah and tap the headphone icon to listen to tafsir.",
                      "How tafsir audio works"
                    );
                  }}
                >
                  <Headphones className="w-4 h-4 mr-2" />
                  {ti18n('audioTafsir')}
                </Button>
              </div>
            </Card>
          )}

          {/* History */}
          {!selectedSurah && tafsirHistory.length > 0 && (
            <Card className="p-4 border-blue-200 bg-blue-50/50">
              <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                {ti18n('recentHistory')}
              </h3>
              <div className="space-y-2">
                {tafsirHistory.slice(0, 3).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const historySurah = surahs.find(s => s.number === item.surah);
                      if (historySurah) {
                        void handleSurahSelect(historySurah);
                      }
                    }}
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

          {/* Bookmarks */}
          {!selectedSurah && bookmarks.length > 0 && (
            <Card className="p-4 border-emerald-200 bg-emerald-50/50">
              <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                {ti18n('bookmarks')}
              </h3>
              <div className="space-y-2">
                {bookmarks.slice(0, 3).map((bookmark, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const bookmarkedSurah = surahs.find(s => s.number === bookmark.surah);
                      if (bookmarkedSurah) {
                        void handleSurahSelect(bookmarkedSurah);
                      }
                    }}
                    className="w-full p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-emerald-700">{bookmark.surahName}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Edition Selector */}
          {selectedSurah && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">{ti18n('tafsirEdition')}:</span>
              <Select
                value={selectedEdition}
                onValueChange={(value) => {
                  setSelectedEdition(value);
                  if (selectedSurah) {
                    setCurrentSurahTafsir(null);
                    void handleSurahSelect(selectedSurah, { editionId: value, addToHistory: false });
                  }
                }}
              >
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
          {selectedSurah && tafsirLoading && !currentSurahTafsir && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">{ti18n('loadingCompleteSurahTafsir')}</p>
              <p className="text-xs text-muted-foreground mt-1">{ti18n('thisMayTakeMoment')}</p>
            </div>
          )}

          {selectedSurah && !tafsirLoading && !currentSurahTafsir && (
            <Card className="p-4 border-amber-200 bg-amber-50/60">
              <p className="text-sm text-amber-800 mb-3">Could not load tafsir for this surah yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSurahSelect(selectedSurah, { addToHistory: false })}
              >
                Retry
              </Button>
            </Card>
          )}

          {/* Comparison View */}
          {showComparison && comparisonData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="p-6 border-orange-200 bg-orange-50/50">
                <div className="flex items-center justify-between mb-6">
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
                
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {comparisonData[0]?.tafsirs.map((tafsir, ayahIndex) => (
                    <div key={ayahIndex} className="border border-orange-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <div 
                        className="bg-orange-100 p-4 cursor-pointer hover:bg-orange-200 transition-colors"
                        onClick={() => toggleComparisonAyah(tafsir.ayah)}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-orange-800">
                            {ti18n('ayah')} {tafsir.ayah}
                          </h4>
                          <div className="text-orange-600 font-mono">
                            {expandedComparisonAyahs.has(tafsir.ayah) ? '−' : '+'}
                          </div>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedComparisonAyahs.has(tafsir.ayah) && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 space-y-3 bg-gradient-to-br from-orange-50 to-white">
                              {comparisonData.map((editionData, editionIndex) => {
                                const editionTafsir = editionData.tafsirs.find(t => t.ayah === tafsir.ayah);
                                if (!editionTafsir) return null;
                                
                                return (
                                  <div key={editionIndex} className="border-l-4 border-orange-300 pl-4">
                                    <h5 className="font-medium text-orange-600 mb-2">
                                      {editionData.edition.name} ({editionData.edition.language})
                                    </h5>
                                    <p className="text-gray-700 leading-relaxed text-sm bg-white p-3 rounded shadow-sm">
                                      {editionTafsir.text}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
              className="space-y-6"
            >
              {/* Action Bar */}
              <div className="flex flex-col gap-4 mb-6">
                <div className="relative flex-1">
                  <div className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors">
                    <Search className="w-4 h-4" />
                  </div>
                  <Input
                    placeholder={ti18n('searchWithinTafsir')}
                    value={searchTafsirQuery}
                    onChange={(e) => setSearchTafsirQuery(e.target.value)}
                    className="ps-10 h-12 bg-card/50 border-border/40 rounded-xl text-base"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleComparison}
                    disabled={comparisonLoading}
                    className={showComparison ? "bg-emerald-100 border-emerald-300" : ""}
                  >
                    {comparisonLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600" />
                    ) : (
                      <GitCompare className="w-4 h-4 mr-2" />
                    )}
                    {ti18n('compare')}
                  </Button>

                  <Button
                    variant="outline"
                    size="default"
                    onClick={handlePlayVisibleTafsir}
                    disabled={getFilteredTafsirs().length === 0}
                  >
                    <Headphones className="w-4 h-4 mr-2" />
                    Listen
                  </Button>

                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setShowVoiceCheck(true)}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Voice
                  </Button>
                  
                  <Dialog open={showNotesEditor} onOpenChange={setShowNotesEditor}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="default">
                        <Edit3 className="w-4 h-4 mr-2" />
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
                          defaultValue={() => {
                            const noteKey = currentAyahForNote ? `${currentAyahForNote.surah}:${currentAyahForNote.ayah}` : '';
                            return personalNotes[noteKey] || '';
                          })()}
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
                                onClick={() => handleTTS(
                                  tafsir.text,
                                  `${currentSurahTafsir.englishName} - Ayah ${tafsir.ayah}`
                                )}
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
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Surah List */}
          {!selectedSurah && !loading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                      onClick={() => void handleSurahSelect(surah)}
                      className="w-full group"
                    >
                      <Card className="p-4 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 border-emerald-100 hover:border-emerald-300">
                        <div className="text-center mb-3">
                          <div className="w-12 h-16 mx-auto mb-2 rounded-lg bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg font-bold">{surah.number}</span>
                          </div>
                          <h3 className="font-semibold text-emerald-800">{surah.name}</h3>
                          <p className="text-sm text-emerald-600">{surah.englishName}</p>
                        </div>
                      </Card>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {loading && !selectedSurah && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
              <p className="text-sm text-muted-foreground mt-3">Loading surahs...</p>
            </div>
          )}
        </div>
      </div>

      {/* Global TTS Player */}
      <TTSPlayer
        text={currentTTSText}
        title={currentTTSLabel}
        isVisible={showTTSPlayer}
        autoPlayToken={ttsAutoPlayToken}
        onToggle={() => {
          setShowTTSPlayer(false);
          setCurrentTTSText("");
          setCurrentTTSLabel("");
          setTtsAutoPlayToken(undefined);
        }}
      />

      {/* Voice Check Dialog */}
      <VoiceCheckDialog
        isOpen={showVoiceCheck}
        onClose={() => setShowVoiceCheck(false)}
        language={language}
        onVoiceAvailable={() => {
          toast({
            title: "Voice Available",
            description: "Voice is now available for TTS"
          });
        }}
      />

      <div className="px-8 mt-12 text-center opacity-40">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em]">
          Noor Connect - {ti18n('spiritualCompanion')}
        </p>
      </div>
    </PageTransition>
  );
};

export default Tafsir;
