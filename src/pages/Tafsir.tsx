// Tafsir Explorer - Version 2.0 - Updated with Download Feature
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, ChevronRight, Bookmark, Edit3, History, FileText, AlertCircle, Plus, Loader2, Download, FileText as FileIcon } from "lucide-react";
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
import { fetchTafsir, fetchSurahTafsir, TAFSIR_EDITIONS, type TafsirEdition } from "@/lib/tafsir";
import { useToast } from "@/hooks/use-toast";

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface TafsirData {
  ayah: number;
  surah: number;
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
  const [tafsirHistory, setTafsirHistory] = useState<Array<{surah: number, surahName: string, timestamp: number}>>([]);
  const [personalNotes, setPersonalNotes] = useState<Record<string, string>>({});
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [currentAyahForNote, setCurrentAyahForNote] = useState<{surah: number, ayah: number} | null>(null);
  const [expandedAyahs, setExpandedAyahs] = useState<Set<number>>(new Set());

  const toggleAyahExpansion = (ayahNumber: number) => {
    const newExpanded = new Set(expandedAyahs);
    if (newExpanded.has(ayahNumber)) {
      newExpanded.delete(ayahNumber);
    } else {
      newExpanded.add(ayahNumber);
    }
    setExpandedAyahs(newExpanded);
  };

  // Fetch surahs on mount
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        setSurahs(data.data);
        try { localStorage.setItem('quran-surahs-cache', JSON.stringify(data.data)); } catch (error) { console.warn("localStorage cache save failed:", error); }
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };

    if (surahs.length === 0) {
      fetchSurahs();
    }
  }, [surahs.length]);

  // Filter surahs based on search
  useEffect(() => {
    const filtered = surahs.filter(surah =>
      surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSurahs(filtered);
  }, [surahs, searchQuery]);

  const downloadTafsir = (format: 'txt' | 'json' | 'pdf') => {
    if (!currentSurahTafsir || !selectedSurah) return;

    const edition = TAFSIR_EDITIONS.find(e => e.id === selectedEdition);
    const fileName = `${selectedSurah.englishName.replace(/\s+/g, '_')}_${edition?.name.replace(/\s+/g, '_')}`;

    switch (format) {
      case 'txt':
        downloadAsText(fileName);
        break;
      case 'json':
        downloadAsJSON(fileName);
        break;
      case 'pdf':
        downloadAsPDF(fileName);
        break;
    }
  };

  const downloadAsText = (fileName: string) => {
    if (!currentSurahTafsir) return;

    let content = `${currentSurahTafsir.englishName} - ${currentSurahTafsir.surahName}\n`;
    content += `Tafsir Edition: ${TAFSIR_EDITIONS.find(e => e.id === selectedEdition)?.name}\n`;
    content += `Total Ayahs: ${currentSurahTafsir.tafsirs.length}\n`;
    content += `${'='.repeat(80)}\n\n`;

    currentSurahTafsir.tafsirs.forEach((tafsir) => {
      content += `Ayah ${tafsir.ayah}:\n`;
      content += `${tafsir.text}\n`;
      content += `${'-'.repeat(40)}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: `Tafsir downloaded as ${fileName}.txt`,
    });
  };

  const downloadAsJSON = (fileName: string) => {
    if (!currentSurahTafsir) return;

    const data = {
      surah: {
        number: currentSurahTafsir.surah,
        name: currentSurahTafsir.surahName,
        englishName: currentSurahTafsir.englishName,
      },
      edition: TAFSIR_EDITIONS.find(e => e.id === selectedEdition),
      tafsirs: currentSurahTafsir.tafsirs,
      downloadDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: `Tafsir downloaded as ${fileName}.json`,
    });
  };

  const downloadAsPDF = (fileName: string) => {
    if (!currentSurahTafsir) return;

    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${currentSurahTafsir.englishName} - Tafsir</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          h2 { color: #34495e; margin-top: 30px; }
          .ayah-number { color: #e74c3c; font-weight: bold; }
          .tafsir-text { background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 10px 0; }
          .header-info { background: #ecf0f1; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${currentSurahTafsir.englishName} - ${currentSurahTafsir.surahName}</h1>
        <div class="header-info">
          <p><strong>Tafsir Edition:</strong> ${TAFSIR_EDITIONS.find(e => e.id === selectedEdition)?.name}</p>
          <p><strong>Total Ayahs:</strong> ${currentSurahTafsir.tafsirs.length}</p>
          <p><strong>Download Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
    `;

    currentSurahTafsir.tafsirs.forEach((tafsir) => {
      content += `
        <h2><span class="ayah-number">Ayah ${tafsir.ayah}:</span></h2>
        <div class="tafsir-text">${tafsir.text}</div>
      `;
    });

    content += `
      </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: `Tafsir downloaded as ${fileName}.html (open in browser and print to PDF)`,
    });
  };

  const loadMoreTafsirs = async () => {
    if (!selectedSurah || !currentSurahTafsir) return;
    
    setTafsirLoading(true);
    
    try {
      const currentAyahCount = currentSurahTafsir.tafsirs.length;
      const nextAyahs = Array.from({ length: Math.min(50, selectedSurah.numberOfAyahs - currentAyahCount) }, (_, index) => currentAyahCount + index + 1);
      
      const tafsirResults = await Promise.allSettled(
        nextAyahs.map((ayah) => fetchTafsir(selectedSurah.number, ayah, selectedEdition))
      );
      
      const newTafsirs: TafsirData[] = [];
      tafsirResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          newTafsirs.push({
            ayah: nextAyahs[index],
            surah: selectedSurah.number,
            text: result.value.text
          });
        } else {
          console.warn(`Failed to fetch tafsir for ${selectedSurah.number}:${nextAyahs[index]}`, result.reason);
        }
      });
      
      const updatedSurahTafsir: SurahTafsir = {
        ...currentSurahTafsir,
        tafsirs: [...currentSurahTafsir.tafsirs, ...newTafsirs]
      };
      
      setCurrentSurahTafsir(updatedSurahTafsir);
      
      const cacheKey = `tafsir-surah-${selectedEdition}-${selectedSurah.number}`;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(updatedSurahTafsir));
      } catch (error) {
        console.warn("Failed to cache updated surah tafsir:", error);
      }
      
    } catch (error) {
      console.error("Error loading more tafsirs:", error);
      toast({
        title: "Error",
        description: "Failed to load more tafsirs",
        variant: "destructive"
      });
    } finally {
      setTafsirLoading(false);
    }
  };

  const handleSurahSelect = async (surah: Surah, options: { editionId?: string, addToHistory?: boolean } = {}) => {
    const editionId = options?.editionId ?? selectedEdition;
    const addToHistory = options?.addToHistory ?? true;
    setSelectedSurah(surah);
    setTafsirLoading(true);
    
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
        const cachedTafsir = JSON.parse(cached);
        setCurrentSurahTafsir(cachedTafsir);
        setTafsirLoading(false);
        return;
      }
      
      console.log(`Fetching tafsir for surah ${surah.number}, edition ${editionId}`);
      
      if (surah.numberOfAyahs > 100) {
        console.log(`Large surah detected (${surah.numberOfAyahs} ayahs), fetching individual ayahs`);
        const tafsirs: TafsirData[] = [];
        
        const initialAyahs = Array.from({ length: Math.min(50, surah.numberOfAyahs) }, (_, index) => index + 1);
        const tafsirResults = await Promise.allSettled(
          initialAyahs.map((ayah) => fetchTafsir(surah.number, ayah, editionId))
        );
        
        tafsirResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            tafsirs.push({
              ayah: initialAyahs[index],
              surah: surah.number,
              text: result.value.text
            });
          } else {
            console.warn(`Failed to fetch tafsir for ${surah.number}:${initialAyahs[index]}`, result.reason);
          }
        });
        
        console.log(`Successfully fetched initial ${tafsirs.length} tafsir entries for surah ${surah.number}`);
        
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
          console.warn("Failed to cache surah tafsir:", error);
        }
        
        setTafsirLoading(false);
        return;
      }
      
      const tafsirs = await fetchSurahTafsir(surah.number, editionId);
      console.log(`Successfully fetched ${tafsirs.length} tafsir entries for surah ${surah.number}`);
      
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

  const getFilteredTafsirs = () => {
    if (!currentSurahTafsir) return [];
    if (!searchTafsirQuery.trim()) return currentSurahTafsir.tafsirs;
    
    return currentSurahTafsir.tafsirs.filter(tafsir =>
      tafsir.text.toLowerCase().includes(searchTafsirQuery.toLowerCase())
    );
  };

  const goBack = () => {
    if (currentSurahTafsir) {
      setCurrentSurahTafsir(null);
      setSelectedSurah(null);
    } else {
      navigate('/services');
    }
  };

  const isBookmarked = selectedSurah && 
    bookmarks.some(b => b.surah === selectedSurah.number);

  const handleBookmark = () => {
    if (!selectedSurah || !currentSurahTafsir) return;
    
    const bookmark = {
      surah: selectedSurah.number,
      surahName: selectedSurah.name
    };
    
    const isBookmarked = bookmarks.some(b => b.surah === selectedSurah.number);
    
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(b => b.surah !== selectedSurah.number));
      toast({
        title: "Bookmark Removed",
        description: `${selectedSurah.englishName} removed from bookmarks`
      });
    } else {
      setBookmarks(prev => [...prev, bookmark]);
      toast({
        title: "Bookmark Added",
        description: `${selectedSurah.englishName} added to bookmarks`
      });
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
          {/* Surah Selection */}
          {!selectedSurah && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-emerald-800 mb-2">Tafsir Explorer</h1>
                <p className="text-muted-foreground">Read Quranic commentary from renowned scholars</p>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search surahs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-card/50 border-border/40 rounded-xl text-base"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={selectedEdition} onValueChange={(value) => {
                  setSelectedEdition(value);
                  if (selectedSurah) {
                    void handleSurahSelect(selectedSurah, { editionId: value, addToHistory: false });
                  }
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAFSIR_EDITIONS.map((edition) => (
                      <SelectItem key={edition.id} value={edition.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{edition.name}</span>
                          {edition.author && (
                            <span className="text-xs text-muted-foreground ml-1">
                              by {edition.author}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">({edition.language})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Loading State */}
          {selectedSurah && tafsirLoading && !currentSurahTafsir && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading tafsir...</p>
            </div>
          )}

          {selectedSurah && !tafsirLoading && !currentSurahTafsir && (
            <Card className="p-4 border-amber-200 bg-amber-50/60">
              <p className="text-sm text-amber-800 mb-3">Could not load tafsir for this surah.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSurahSelect(selectedSurah, { addToHistory: false })}
              >
                Retry
              </Button>
            </Card>
          )}

          {/* Tafsir Content */}
          {currentSurahTafsir && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-emerald-800 text-xl">
                        {currentSurahTafsir.englishName}
                      </CardTitle>
                      <CardDescription className="text-emerald-600">
                        {currentSurahTafsir.surahName} • {TAFSIR_EDITIONS.find(e => e.id === selectedEdition)?.name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBookmark}
                        className={isBookmarked ? "bg-emerald-100 border-emerald-300" : ""}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-emerald-600" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search within tafsir..."
                      value={searchTafsirQuery}
                      onChange={(e) => setSearchTafsirQuery(e.target.value)}
                      className="pl-10 h-12 bg-card/50 border-border/40 rounded-xl text-base"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="default"
                          disabled={!currentSurahTafsir || currentSurahTafsir.tafsirs.length === 0}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Download Tafsir</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Choose format to download {currentSurahTafsir?.englishName} tafsir:
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => downloadTafsir('txt')}
                              className="justify-start"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Text File (.txt)
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => downloadTafsir('json')}
                              className="justify-start"
                            >
                              <FileIcon className="w-4 h-4 mr-2" />
                              JSON File (.json)
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => downloadTafsir('pdf')}
                              className="justify-start"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              HTML File (.html) - Print to PDF
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {currentSurahTafsir?.tafsirs.length || 0} ayahs will be downloaded
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 bg-emerald-50/30 border-b border-emerald-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-emerald-800">
                      Tafsir Content ({getFilteredTafsirs().length} ayahs)
                    </h3>
                    <span className="text-sm text-emerald-600">
                      {currentSurahTafsir.tafsirs.length} total ayahs
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {getFilteredTafsirs().map((tafsir, index) => {
                    const noteKey = `${tafsir.surah}:${tafsir.ayah}`;
                    const hasNote = personalNotes[noteKey];
                    const isExpanded = expandedAyahs.has(tafsir.ayah);
                    
                    return (
                      <Card key={index} className="border border-emerald-200 bg-white shadow-sm overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-emerald-50/50 transition-colors"
                          onClick={() => toggleAyahExpansion(tafsir.ayah)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <span className="text-emerald-700 font-bold text-sm">{tafsir.ayah}</span>
                              </div>
                              <div className="text-left">
                                <h4 className="font-semibold text-emerald-700">
                                  Ayah {tafsir.ayah}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {isExpanded ? 'Click to collapse' : 'Click to expand'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasNote && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" title="Has personal note" />
                              )}
                              <div className="text-emerald-600">
                                {isExpanded ? (
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <span className="text-emerald-600 text-xs">−</span>
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <span className="text-emerald-600 text-xs">+</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-3">
                                <div className="bg-emerald-50/30 rounded-lg p-4">
                                  <p className="text-gray-700 leading-relaxed text-justify text-sm">
                                    {tafsir.text}
                                  </p>
                                </div>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-emerald-100">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNote(tafsir.surah, tafsir.ayah);
                                      }}
                                      className="h-8 px-3 text-xs"
                                    >
                                      <Edit3 className="w-3 h-3 mr-1" />
                                      Note
                                    </Button>
                                  </div>
                                </div>
                                
                                {hasNote && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800 font-medium mb-1">Personal Note:</p>
                                    <p className="text-sm text-blue-700">{personalNotes[noteKey]}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })}
                </div>
                
                {/* Load More button for large surahs */}
                {selectedSurah && selectedSurah.numberOfAyahs > 100 && 
                 currentSurahTafsir && 
                 currentSurahTafsir.tafsirs.length < selectedSurah.numberOfAyahs && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      onClick={() => loadMoreTafsirs()}
                      disabled={tafsirLoading}
                      className="px-6"
                    >
                      {tafsirLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Load More ({currentSurahTafsir.tafsirs.length} of {selectedSurah.numberOfAyahs})
                        </>
                      )}
                    </Button>
                  </div>
                )}
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
                      className="w-full text-left"
                    >
                      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white hover:shadow-lg hover:border-emerald-300 transition-all duration-200 cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-emerald-800 group-hover:text-emerald-700 transition-colors">
                                {surah.englishName}
                              </h3>
                              <p className="text-sm text-emerald-600">{surah.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Ayahs: {surah.numberOfAyahs} • {surah.revelationType}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-emerald-600 opacity-50 ml-2" />
                          </div>
                        </CardContent>
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
              <p className="text-muted-foreground">No surahs found</p>
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
    </PageTransition>
  );
};

export default Tafsir;
