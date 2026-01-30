import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Share2, BookmarkCheck, Play, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getBookmarksForSurah, toggleBookmark } from "@/lib/storage";
import { QuranAudioPlayer } from "@/components/QuranAudioPlayer";
import { quranFontManager, type QuranFont } from "@/lib/quran-font-manager";

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
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState(TRANSLATIONS[0]);
  const [fontSize, setFontSize] = useState(24);
  const [currentQuranFont, setCurrentQuranFont] = useState<QuranFont>('uthmani');
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);

  // Initialize Quran font manager and load preferences
  useEffect(() => {
    // Set initial font from global manager
    setCurrentQuranFont(quranFontManager.getCurrentFont());
    setFontSize(24); // Default font size
    
    // Load saved translation preference
    const savedTrans = localStorage.getItem('quran-translation');
    if (savedTrans) {
      const trans = TRANSLATIONS.find(t => t.id === savedTrans);
      if (trans) setSelectedTranslation(trans);
    }
  }, []);

  // Load Google Fonts for Quran
  useEffect(() => {
    quranFontManager.initialize();
  }, []);

  const fetchSurah = useCallback(async () => {
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
      
      // Check if it's a 404 error
      if (error instanceof Error && error.message.includes('404')) {
        toast({ 
          title: "Surah Not Found", 
          description: `Surah ${surahNumber} was not found. Redirecting to Quran index...`,
          variant: "destructive" 
        });
        setTimeout(() => navigate('/quran'), 2000);
      } else {
        toast({ 
          title: "Error loading Surah", 
          description: "Failed to load surah data. Please check your internet connection.",
          variant: "destructive" 
        });
      }
    }
  }, [surahNumber, selectedTranslation, toast]);

  useEffect(() => {
    setLoading(true);
    fetchSurah();
  }, [fetchSurah]);

  useEffect(() => {
    setBookmarkedAyahs(getBookmarksForSurah(parseInt(surahNumber || "1")));
  }, [surahNumber]);

  const verseKeyByAyahNumber = useMemo(() => {
    const map = new Map<number, { verseKey: string; id: number }>();
    for (const ayah of surahData?.ayahs || []) {
      map.set(ayah.numberInSurah, { verseKey: ayah.verseKey, id: ayah.id });
    }
    return map;
  }, [surahData]);

  const handleToggleBookmark = (ayahNumber: number) => {
    const isNowBookmarked = toggleBookmark(
      parseInt(surahNumber || "1"),
      ayahNumber,
      surahData?.englishName || ""
    );
    setBookmarkedAyahs(getBookmarksForSurah(parseInt(surahNumber || "1")));
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
    
    const fontOption = quranFontManager.getFontOption(font);
    toast({ 
      title: "Quran font changed", 
      description: `Now using ${fontOption.name}` 
    });
  };

  const handleTranslationChange = (transId: string) => {
    const trans = TRANSLATIONS.find(t => t.id === transId);
    if (trans) {
      setSelectedTranslation(trans);
      localStorage.setItem('quran-translation', transId);
      toast({ title: "Translation updated" });
      // Refetch surah with new translation
      fetchSurah();
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem('quran-font-size', size.toString());
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/quran")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold">Loading...</h1>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </main>
      </div>
    );
  }

  if (!surahData) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/quran")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold">Surah not found</h1>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Surah not found</p>
            <Button onClick={() => navigate("/quran")}>Back to Quran</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/quran")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold quran-text">
              {surahData.name}
            </h1>
            <p className="text-sm text-primary">{surahData.englishName}</p>
            <p className="text-xs text-muted-foreground">
              {surahData.revelationType} • {surahData.numberOfAyahs} Ayahs
            </p>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => setShowAudioPlayer(!showAudioPlayer)}
            >
              <Play className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Quran Font
            </label>
            <Select value={currentQuranFont} onValueChange={handleFontChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {quranFontManager.getAvailableFonts().map((font) => (
                  <SelectItem key={font.id} value={font.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{font.name}</span>
                      <span className="text-xs text-muted-foreground">{font.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Translation</label>
            <Select value={selectedTranslation.id} onValueChange={handleTranslationChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSLATIONS.map((trans) => (
                  <SelectItem key={trans.id} value={trans.id}>
                    {trans.name} ({trans.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Font Size: {fontSize}px</label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleFontSizeChange(Math.max(16, fontSize - 2))}
              >
                -
              </Button>
              <span className="text-sm font-mono w-12 text-center">{fontSize}px</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleFontSizeChange(Math.min(42, fontSize + 2))}
              >
                +
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Main Content - Verse List */}
      <main className="flex-1 overflow-y-auto pb-32">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {surahData.ayahs.map((ayah) => (
              <Card key={ayah.numberInSurah} className="p-4 group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-primary text-sm">{ayah.numberInSurah}</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <p 
                      className="quran-text leading-[2.5] text-right"
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
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {ayah.translation}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={bookmarkedAyahs.has(ayah.numberInSurah) ? "default" : "outline"}
                      size="icon"
                      onClick={() => handleToggleBookmark(ayah.numberInSurah)}
                      className="h-8 w-8"
                    >
                      {bookmarkedAyahs.has(ayah.numberInSurah) ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => shareAyah(ayah.numberInSurah, ayah.textUthmani, ayah.translation)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </main>
      
      {/* Bottom Navigation */}
      <div className="flex-shrink-0">
        {/* Audio Player */}
        {showAudioPlayer && (
          <Card className="m-4 p-4">
            <QuranAudioPlayer
              surahNumber={parseInt(surahNumber || "1")}
              surahName={surahData.name}
              ayahs={surahData.ayahs}
              currentAyah={currentAyah}
              onAyahChange={setCurrentAyah}
              onClose={() => setShowAudioPlayer(false)}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default SurahDetail;
