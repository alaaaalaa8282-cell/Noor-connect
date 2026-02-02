import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Share2, BookmarkCheck, Play, Settings, BookOpen, Loader2, Pause, Download, Check, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { getBookmarksForSurah, toggleBookmark } from "@/lib/storage";
import { quranFontManager, type QuranFont } from "@/lib/quran-font-manager";
import { fetchTafsir, TAFSIR_EDITIONS, type TafsirEdition } from "@/lib/tafsir";
import { useGlobalQuran } from "@/lib/global-quran";
import { useReciters } from "@/hooks/useReciters";

// Translation editions
const TRANSLATIONS = [
  { id: "en.sahih", name: "Sahih International", lang: "English" },
  { id: "en.pickthall", name: "Pickthall", lang: "English" },
  { id: "en.yusufali", name: "Yusuf Ali", lang: "English" },
  { id: "ur.ahmedali", name: "Ahmed Ali", lang: "Urdu" },
  { id: "fr.hamidullah", name: "Hamidullah", lang: "French" },
  { id: "id.indonesian", name: "Indonesian", lang: "Indonesian" },
  { id: "tr.ates", name: "Suleyman Ates", lang: "Turkish" },
  { id: "de.aburida", name: "Abu Rida", lang: "German" },
];

interface QuranWord {
  id: number;
  position: number;
  char_type_name: string;
  text: string;
  text_qpc_hafs?: string;
}

interface Ayah {
  id: number; // global ayah id (1..6236)
  verseKey: string; // e.g. 2:255
  numberInSurah: number;
  textUthmani: string;
  words: QuranWord[];
  translation?: string;
}

interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

const SurahDetail = () => {
  const { surahNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Global Quran State
  const {
    isPlaying,
    surahNumber: currentPlayingSurah,
    reciter,
    playSurah,
    pause,
    resume,
    updateState
  } = useGlobalQuran();

  const { reciters, isLoading: isReciterLoading } = useReciters();

  // Component State
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState(TRANSLATIONS[0]);
  const [fontSize, setFontSize] = useState(24);
  const [currentQuranFont, setCurrentQuranFont] = useState<QuranFont>('uthmani');

  // Download State
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'downloaded'>('idle');

  // Tafsir state
  const [tafsirDrawerOpen, setTafsirDrawerOpen] = useState(false);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirError, setTafsirError] = useState<string | null>(null);
  const [selectedTafsirEdition, setSelectedTafsirEdition] = useState<TafsirEdition>(TAFSIR_EDITIONS[0]);
  const [selectedAyahForTafsir, setSelectedAyahForTafsir] = useState<number | null>(null);

  // Check if surah is downloaded for current reciter
  const checkDownloadStatus = useCallback(async () => {
    if (reciter && surahNumber) {
      const { downloadManager } = await import("@/lib/download-manager");
      const isDown = await downloadManager.isSurahDownloaded(reciter.id, parseInt(surahNumber));
      setDownloadState(isDown ? 'downloaded' : 'idle');
    }
  }, [reciter, surahNumber]);

  useEffect(() => {
    checkDownloadStatus();
  }, [checkDownloadStatus]);

  // Load Preferences
  useEffect(() => {
    setCurrentQuranFont(quranFontManager.getCurrentFont());
    const savedFontSize = localStorage.getItem('quran-font-size');
    if (savedFontSize) setFontSize(parseInt(savedFontSize));

    const savedTrans = localStorage.getItem('quran-translation');
    if (savedTrans) {
      const trans = TRANSLATIONS.find(t => t.id === savedTrans);
      if (trans) setSelectedTranslation(trans);
    }

    quranFontManager.initialize();
  }, []);

  const fetchSurah = useCallback(async () => {
    if (!surahNumber) return;
    try {
      const [metaRes, versesRes, transRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`),
        fetch(
          `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?words=true&word_fields=text_qpc_hafs&fields=text_uthmani&per_page=300&page=1`
        ),
        fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${selectedTranslation.id}`),
      ]);

      const [metaJson, versesJson, transJson] = await Promise.all([
        metaRes.json(),
        versesRes.json(),
        transRes.json(),
      ]);

      const translationsByAyah: Record<number, string> = {};
      const transAyahs: Array<{ numberInSurah: number; text: string }> = transJson?.data?.ayahs || [];
      for (const a of transAyahs) {
        translationsByAyah[a.numberInSurah] = a.text;
      }

      const mergedAyahs: Ayah[] = (versesJson?.verses || []).map((v: any) => ({
        id: v.id,
        verseKey: v.verse_key,
        numberInSurah: v.verse_number,
        textUthmani: v.text_uthmani,
        words: v.words || [],
        translation: translationsByAyah[v.verse_number] || "",
      }));

      setSurahData({
        ...metaJson.data,
        ayahs: mergedAyahs,
        numberOfAyahs: mergedAyahs.length,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error loading Surah:", error);
      setLoading(false);
      toast({
        title: "Error loading Surah",
        description: "Failed to load surah data. Please check your internet connection.",
        variant: "destructive"
      });
    }
  }, [surahNumber, selectedTranslation, toast]);

  useEffect(() => {
    setLoading(true);
    fetchSurah();
  }, [fetchSurah]);

  useEffect(() => {
    if (surahNumber) {
      setBookmarkedAyahs(getBookmarksForSurah(parseInt(surahNumber)));
    }
  }, [surahNumber]);

  // Handlers
  const handleToggleBookmark = (ayahNumber: number) => {
    if (!surahNumber) return;
    const isNowBookmarked = toggleBookmark(
      parseInt(surahNumber),
      ayahNumber,
      surahData?.englishName || ""
    );
    setBookmarkedAyahs(getBookmarksForSurah(parseInt(surahNumber)));
    toast({ title: isNowBookmarked ? "Bookmark added" : "Bookmark removed" });
  };

  const shareAyah = async (ayahNumber: number, arabicText: string, translation?: string) => {
    const shareText = `Quran ${surahData?.englishName} (${ayahNumber})\n\n${arabicText}\n\n${translation || ""}`;
    if (navigator.share) {
      await navigator.share({ text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Copied to clipboard" });
    }
  };

  const handleFontChange = async (font: QuranFont) => {
    setCurrentQuranFont(font);
    await quranFontManager.setFont(font);
    toast({ title: "Quran font changed" });
  };

  const handleTranslationChange = (transId: string) => {
    const trans = TRANSLATIONS.find(t => t.id === transId);
    if (trans) {
      setSelectedTranslation(trans);
      localStorage.setItem('quran-translation', transId);
      toast({ title: "Translation updated" });
      fetchSurah();
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem('quran-font-size', size.toString());
  };

  const handleOpenTafsir = async (ayahNumber: number) => {
    if (!surahNumber) return;
    setSelectedAyahForTafsir(ayahNumber);
    setTafsirDrawerOpen(true);
    setTafsirLoading(true);
    setTafsirError(null);
    setTafsirText(null);

    try {
      const response = await fetchTafsir(
        parseInt(surahNumber),
        ayahNumber,
        selectedTafsirEdition.id
      );
      setTafsirText(response.text);
    } catch (error) {
      setTafsirError(error instanceof Error ? error.message : "Failed to load tafsir");
    } finally {
      setTafsirLoading(false);
    }
  };

  const handleTafsirEditionChange = async (editionId: string) => {
    const edition = TAFSIR_EDITIONS.find(e => e.id === editionId);
    if (edition && selectedAyahForTafsir && surahNumber) {
      setSelectedTafsirEdition(edition);
      setTafsirLoading(true);
      try {
        const response = await fetchTafsir(parseInt(surahNumber), selectedAyahForTafsir, edition.id);
        setTafsirText(response.text);
      } catch (error) {
        setTafsirError("Failed to load tafsir");
      } finally {
        setTafsirLoading(false);
      }
    }
  };

  const handlePlayClick = () => {
    if (!surahData || !surahNumber) return;
    const targetSurah = parseInt(surahNumber);
    if (currentPlayingSurah === targetSurah) {
      isPlaying ? pause() : resume();
    } else {
      if (reciter) {
        playSurah(targetSurah, surahData.name, reciter);
      } else {
        toast({ title: "Select a reciter first" });
        setShowSettings(true);
      }
    }
  };

  const handleReciterChange = (reciterId: string) => {
    const selected = reciters.find(r => r.id === reciterId);
    if (selected) {
      updateState({ reciter: selected });
      toast({ title: "Reciter set", description: selected.name });
    }
  };

  const handleDownload = async () => {
    if (!reciter || !surahNumber) return;
    const surahId = parseInt(surahNumber);

    setDownloadState('loading');

    // Check availability
    if (reciter.surahList && !reciter.surahList.includes(surahId)) {
      setDownloadState('idle');
      toast({
        title: "Download Unavailable",
        description: "This reciter does not have a recording for this Surah.",
        variant: "destructive"
      });
      return;
    }

    try {
      const paddedSurah = surahId.toString().padStart(3, '0');
      const server = reciter.server.endsWith('/') ? reciter.server : `${reciter.server}/`;
      const url = `${server}${paddedSurah}.mp3`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const { downloadManager } = await import("@/lib/download-manager");
      await downloadManager.saveSurah(reciter.id, surahId, blob);

      setDownloadState('downloaded');
      toast({ title: "Surah Downloaded", description: "Saved for offline listening." });
    } catch (e) {
      console.error(e);
      setDownloadState('idle');
      toast({ title: "Download Failed", variant: "destructive" });
    }
  };

  const handleDeleteDownload = async () => {
    if (!reciter || !surahNumber) return;
    try {
      const { downloadManager } = await import("@/lib/download-manager");
      await downloadManager.removeSurah(reciter.id, parseInt(surahNumber));
      setDownloadState('idle');
      toast({ title: "Download Removed" });
    } catch (e) {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground animate-pulse">Preparing Surah...</p>
      </div>
    );
  }

  if (!surahData) {
    return <div className="p-8 text-center">Surah not found.</div>;
  }

  const isCurrentSurahPlaying = currentPlayingSurah === parseInt(surahNumber || "0") && isPlaying;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/quran")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold quran-text text-primary">
              {surahData.name}
            </h1>
            <p className="text-sm font-medium">{surahData.englishName}</p>
          </div>
          <div className="flex gap-1">
            {downloadState === 'downloaded' ? (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-destructive hover:bg-destructive/10"
                onClick={handleDeleteDownload}
                title="Delete Download"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={handleDownload}
                disabled={downloadState === 'loading'}
                title="Download for offline"
              >
                {downloadState === 'loading' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant={isCurrentSurahPlaying ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
              onClick={handlePlayClick}
            >
              {isCurrentSurahPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
          <span>{surahData.revelationType}</span>
          <span>•</span>
          <span>{surahData.numberOfAyahs} Ayahs</span>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b bg-card animate-in slide-in-from-top duration-300">
          <div className="max-w-md mx-auto space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="w-3 h-3" /> Reciter
              </label>
              <Select value={reciter?.id} onValueChange={handleReciterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Reciter" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-60">
                    {reciters.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Font</label>
                <Select value={currentQuranFont} onValueChange={handleFontChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quranFontManager.getAvailableFonts().map((font) => (
                      <SelectItem key={font.id} value={font.id}>{font.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Translation</label>
                <Select value={selectedTranslation.id} onValueChange={handleTranslationChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSLATIONS.map((trans) => (
                      <SelectItem key={trans.id} value={trans.id}>{trans.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Font Size: {fontSize}px</label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleFontSizeChange(Math.max(16, fontSize - 2))}>-</Button>
                <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${((fontSize - 16) / 26) * 100}%` }} />
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleFontSizeChange(Math.min(42, fontSize + 2))}>+</Button>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowSettings(false)}>Close Settings</Button>
          </div>
        </div>
      )}

      {/* Main Content - Verse List */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 space-y-6 pb-32">
          {surahData.ayahs.map((ayah) => (
            <div key={ayah.numberInSurah} className="group relative">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                    {ayah.numberInSurah}
                  </div>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-primary/20 to-transparent" />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleToggleBookmark(ayah.numberInSurah)}
                    >
                      {bookmarkedAyahs.has(ayah.numberInSurah) ? (
                        <BookmarkCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => shareAyah(ayah.numberInSurah, ayah.textUthmani, ayah.translation)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleOpenTafsir(ayah.numberInSurah)}
                    >
                      <BookOpen className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <p
                    className="quran-text leading-[2.8] text-right text-foreground/90 selection:bg-primary/30"
                    style={{
                      fontSize: `${fontSize}px`,
                      fontFamily: 'var(--quran-font)'
                    }}
                  >
                    {ayah.words
                      .filter(w => w.char_type_name === 'word')
                      .map((word) => word.text_qpc_hafs || word.text)
                      .join(' ')}
                  </p>

                  {selectedTranslation && ayah.translation && (
                    <p className="text-base text-muted-foreground leading-relaxed pl-1 border-l-2 border-primary/10 italic">
                      {ayah.translation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Tafsir Drawer */}
      <Drawer open={tafsirDrawerOpen} onOpenChange={setTafsirDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader className="border-b">
              <DrawerTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Tafsir - {surahData?.englishName} Ayah {selectedAyahForTafsir}
              </DrawerTitle>
              <DrawerDescription className="pt-2">
                <Select value={selectedTafsirEdition.id} onValueChange={handleTafsirEditionChange}>
                  <SelectTrigger className="w-full">
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
              </DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="p-6 h-[50vh]">
              {tafsirLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading interpretation...</p>
                </div>
              ) : tafsirError ? (
                <div className="text-center py-8">
                  <p className="text-destructive font-medium">{tafsirError}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => selectedAyahForTafsir && handleOpenTafsir(selectedAyahForTafsir)}>Retry</Button>
                </div>
              ) : tafsirText ? (
                <div
                  className={`leading-relaxed text-lg ${selectedTafsirEdition.language === 'Arabic' ? 'text-right font-arabic text-2xl' : 'font-serif'}`}
                  dangerouslySetInnerHTML={{ __html: tafsirText }}
                />
              ) : null}
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default SurahDetail;
