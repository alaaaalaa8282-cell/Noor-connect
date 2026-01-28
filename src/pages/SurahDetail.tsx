// version 1.0.1
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

// Available Arabic fonts
const ARABIC_FONTS = [
  { id: "default", name: "Default", family: "var(--font-arabic)" },
  { id: "amiri", name: "Amiri Quran", family: "'Amiri Quran', serif" },
  { id: "scheherazade", name: "Scheherazade", family: "'Scheherazade New', serif" },
  { id: "lateef", name: "Lateef", family: "'Lateef', serif" },
  { id: "noto-naskh", name: "Noto Naskh Arabic", family: "'Noto Naskh Arabic', serif" },
  { id: "kitab", name: "Kitab", family: "'Kitab', serif" },
];

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

const FONT_KEY = 'quran-font';
const TRANSLATION_KEY = 'quran-translation';
const FONT_SIZE_KEY = 'quran-font-size';

const SurahDetail = () => {
  const { surahNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [currentAyah, setCurrentAyah] = useState(1);
  const [selectedFont, setSelectedFont] = useState(ARABIC_FONTS[0]);
  const [selectedTranslation, setSelectedTranslation] = useState(TRANSLATIONS[0]);
  const [fontSize, setFontSize] = useState(24);
  const [showSettings, setShowSettings] = useState(false);
  const [activeWord, setActiveWord] = useState<{ verseKey: string; wordPosition: number } | null>(null);
  const lastScrolledWordIdRef = useRef<string | null>(null);

  // Load saved preferences
  useEffect(() => {
    const savedFont = localStorage.getItem(FONT_KEY);
    const savedTrans = localStorage.getItem(TRANSLATION_KEY);
    const savedSize = localStorage.getItem(FONT_SIZE_KEY);
    
    if (savedFont) {
      const font = ARABIC_FONTS.find(f => f.id === savedFont);
      if (font) setSelectedFont(font);
    }
    if (savedTrans) {
      const trans = TRANSLATIONS.find(t => t.id === savedTrans);
      if (trans) setSelectedTranslation(trans);
    }
    if (savedSize) {
      setFontSize(parseInt(savedSize));
    }
  }, []);

  // Load Google Fonts dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Scheherazade+New:wght@400;700&family=Lateef&family=Noto+Naskh+Arabic:wght@400;700&display=swap';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
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
      console.error("Error:", error);
      setLoading(false);
      toast({ title: "Error loading Surah", variant: "destructive" });
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

  useEffect(() => {
    if (!activeWord) return;
    const targetId = `word-${activeWord.verseKey}-${activeWord.wordPosition}`;
    if (lastScrolledWordIdRef.current === targetId) return;
    lastScrolledWordIdRef.current = targetId;

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }, [activeWord]);

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

  const handleFontChange = (fontId: string) => {
    const font = ARABIC_FONTS.find(f => f.id === fontId);
    if (font) {
      setSelectedFont(font);
      localStorage.setItem(FONT_KEY, fontId);
    }
  };

  const handleTranslationChange = (transId: string) => {
    const trans = TRANSLATIONS.find(t => t.id === transId);
    if (trans) {
      setSelectedTranslation(trans);
      localStorage.setItem(TRANSLATION_KEY, transId);
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem(FONT_SIZE_KEY, size.toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!surahData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Surah not found</p>
          <Button onClick={() => navigate("/quran")}>Back to Quran</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/quran")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 
              className="text-2xl font-bold quran-arabic"
            >
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

        {/* Settings Panel */}
        {showSettings && (
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Arabic Font</label>
              <Select value={selectedFont.id} onValueChange={handleFontChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARABIC_FONTS.map(font => (
                    <SelectItem key={font.id} value={font.id}>
                      {font.name}
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
                  {TRANSLATIONS.map(trans => (
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
                  A-
                </Button>
                <div className="flex-1 h-2 bg-muted rounded-full">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${((fontSize - 16) / 24) * 100}%` }}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleFontSizeChange(Math.min(40, fontSize + 2))}
                >
                  A+
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Bismillah */}
        {surahData.number !== 9 && (
          <Card className="p-6 bg-primary text-primary-foreground border-0 text-center">
            <p 
              className="text-3xl quran-arabic"
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-xs mt-2 opacity-80">In the name of Allah, the Most Gracious, the Most Merciful</p>
          </Card>
        )}

        {/* Ayahs */}
        <ScrollArea className="h-[calc(100vh-320px)]" style={{ paddingBottom: showAudioPlayer ? '160px' : '0' }}>
          <div className="space-y-3 pb-20">
            {surahData.ayahs.map((ayah) => (
              <Card key={ayah.numberInSurah} className="p-4 group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-primary text-sm">{ayah.numberInSurah}</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <p 
                      className="text-right leading-[2.5] quran-arabic"
                      style={{ 
                        fontSize: `${fontSize}px`
                      }}
                    >
                      {ayah.words
                        .filter(w => w.char_type_name === 'word')
                        .map((w) => {
                          const isActive = activeWord?.verseKey === ayah.verseKey && activeWord?.wordPosition === w.position;
                          return (
                            <span
                              key={w.id}
                              id={`word-${ayah.verseKey}-${w.position}`}
                              className={isActive ? 'highlight-word' : undefined}
                            >
                              {w.text_qpc_hafs ?? w.text}{' '}
                            </span>
                          );
                        })}
                    </p>
                    {ayah.translation && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {ayah.translation}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
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

        {/* Audio Player */}
        {showAudioPlayer && (
          <QuranAudioPlayer
            surahNumber={surahData.number}
            surahName={surahData.englishName}
            totalAyahs={surahData.numberOfAyahs}
            currentAyah={currentAyah}
            onAyahChange={setCurrentAyah}
            verseKeyByAyahNumber={verseKeyByAyahNumber}
            onWordHighlight={(ayahNumber, wordPosition) => {
              const key = verseKeyByAyahNumber.get(ayahNumber)?.verseKey;
              if (!key) return;
              setActiveWord({ verseKey: key, wordPosition });
            }}
            onClose={() => setShowAudioPlayer(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SurahDetail;
