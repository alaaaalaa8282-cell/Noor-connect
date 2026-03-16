/**
 * Quran Reader Page
 * Clean text-based Quran reader using quran-json CDN.
 * Fetches Arabic + English + Urdu per surah on demand.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { BookmarkCheck, Bookmark, Eye, EyeOff, ChevronDown, AlertCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppBar } from '@/components/AppBar';
import { PageTransition } from '@/components/PageTransition';
import { quranService } from '@/lib/quran-service';
import { useToast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────
interface Verse {
  id: number;
  text: string;
  translation?: string;
}

interface SurahData {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: string;
  total_verses: number;
  verses: Verse[];
}

// ─── Constants ───────────────────────────────────────────────
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/chapters';
const LS_LAST_SURAH = 'quran-reader-last-surah';
const LS_LAST_AYAH  = 'quran-reader-last-ayah';
const LS_SHOW_EN    = 'quran-reader-show-en';
const LS_SHOW_UR    = 'quran-reader-show-ur';

const allSurahs = quranService.getAllSurahs();

// ─── Fetch helpers ────────────────────────────────────────────
async function fetchArabic(surahNum: number): Promise<Verse[]> {
  const res = await fetch(`${CDN_BASE}/${surahNum}.json`);
  if (!res.ok) throw new Error(`Failed to fetch Arabic (${res.status})`);
  const data: SurahData = await res.json();
  return data.verses;
}

async function fetchTranslation(surahNum: number, lang: 'en' | 'ur'): Promise<Verse[]> {
  const res = await fetch(`${CDN_BASE}/${lang}/${surahNum}.json`);
  if (!res.ok) throw new Error(`Failed to fetch ${lang} translation (${res.status})`);
  const data: SurahData = await res.json();
  return data.verses;
}

// ─── Component ────────────────────────────────────────────────
export default function QuranReader() {
  const { surahName } = useParams<{ surahName: string }>();
  const { toast } = useToast();

  // ── Resolve initial surah from URL param ──
  const initialSurah = (() => {
    if (surahName) {
      const m = surahName.match(/surah-(\d+)/);
      if (m) return parseInt(m[1]);
    }
    const saved = localStorage.getItem(LS_LAST_SURAH);
    return saved ? parseInt(saved) : 1;
  })();

  // ── State ──
  const [surahNum, setSurahNum]       = useState(initialSurah);
  const [arabicVerses, setArabicVerses] = useState<Verse[]>([]);
  const [enVerses, setEnVerses]       = useState<Verse[]>([]);
  const [urVerses, setUrVerses]       = useState<Verse[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [showEn, setShowEn]           = useState(() => localStorage.getItem(LS_SHOW_EN) !== 'false');
  const [showUr, setShowUr]           = useState(() => localStorage.getItem(LS_SHOW_UR) !== 'false');
  const [bookmarks, setBookmarks]     = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('quran-ayah-bookmarks') || '[]'); }
    catch { return []; }
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const ayahRefs      = useRef<Record<number, HTMLDivElement | null>>({});

  const surahInfo = quranService.getSurahInfo(surahNum);

  // ── Persist toggle prefs ──
  useEffect(() => { localStorage.setItem(LS_SHOW_EN, String(showEn)); }, [showEn]);
  useEffect(() => { localStorage.setItem(LS_SHOW_UR, String(showUr)); }, [showUr]);

  // ── Load surah data ──
  const loadSurah = useCallback(async (num: number) => {
    setLoading(true);
    setError(null);
    ayahRefs.current = {};
    try {
      const [arabic, en, ur] = await Promise.all([
        fetchArabic(num),
        fetchTranslation(num, 'en'),
        fetchTranslation(num, 'ur'),
      ]);
      setArabicVerses(arabic);
      setEnVerses(en);
      setUrVerses(ur);
      localStorage.setItem(LS_LAST_SURAH, String(num));
    } catch (e: any) {
      setError(e.message || 'Failed to load surah');
      toast({ title: 'Error', description: 'Could not load surah data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadSurah(surahNum); }, [surahNum, loadSurah]);

  // ── Scroll to last read ayah after load ──
  useEffect(() => {
    if (loading) return;
    const lastAyah = parseInt(localStorage.getItem(LS_LAST_AYAH) || '1');
    const target = ayahRefs.current[lastAyah];
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
    }
  }, [loading]);

  // ── Track last-read ayah via IntersectionObserver ──
  useEffect(() => {
    if (loading || arabicVerses.length === 0) return;
    const nodes = Object.entries(ayahRefs.current);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          const ids = visible
            .map(e => parseInt(e.target.getAttribute('data-ayah') || '1'))
            .filter(Boolean);
          const max = Math.max(...ids);
          localStorage.setItem(LS_LAST_AYAH, String(max));
        }
      },
      { threshold: 0.5 }
    );

    nodes.forEach(([, el]) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [loading, arabicVerses]);

  // ── Bookmark helpers ──
  const toggleBookmark = (ayahId: number) => {
    setBookmarks(prev => {
      const next = prev.includes(ayahId)
        ? prev.filter(b => b !== ayahId)
        : [...prev, ayahId];
      localStorage.setItem('quran-ayah-bookmarks', JSON.stringify(next));
      return next;
    });
  };

  // ── Surah selector ──
  const handleSurahChange = (val: string) => {
    setSurahNum(parseInt(val));
    localStorage.setItem(LS_LAST_AYAH, '1');
  };

  // ── Skeleton ──
  const Skeleton = () => (
    <div className="space-y-6 p-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-3 p-5 rounded-2xl bg-amber-100/60 dark:bg-amber-900/20">
          <div className="h-8 bg-amber-200/70 dark:bg-amber-800/40 rounded-xl w-full" />
          <div className="h-4 bg-amber-100 dark:bg-amber-900/30 rounded w-3/4" />
          <div className="h-4 bg-amber-100 dark:bg-amber-900/30 rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  // ── Error state ──
  if (error && !loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20">
          <AppBar title="Quran Reader" showBack />
          <div className="flex flex-col items-center justify-center h-80 gap-4 p-6 text-center">
            <AlertCircle className="w-14 h-14 text-red-400" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{error}</p>
            <Button
              onClick={() => loadSurah(surahNum)}
              className="bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold px-6 rounded-xl"
            >
              Try Again
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {/* Amiri Quran font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap');
        .font-quran { font-family: 'Amiri Quran', serif; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20">
        <AppBar
          title={surahInfo ? `${surahInfo.englishName}` : 'Quran Reader'}
          showBack
        />

        {/* ── Controls Bar ── */}
        <div className="sticky top-16 z-20 bg-amber-50/90 dark:bg-amber-950/80 backdrop-blur-md border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 shadow-sm">
          <div className="max-w-2xl mx-auto flex items-center gap-2 flex-wrap">
            {/* Surah Selector */}
            <Select value={String(surahNum)} onValueChange={handleSurahChange}>
              <SelectTrigger
                id="surah-selector"
                className="h-9 flex-1 min-w-[160px] border-2 border-amber-300 dark:border-amber-700 bg-white/70 dark:bg-amber-900/40 rounded-xl text-sm font-semibold text-amber-900 dark:text-amber-100"
              >
                <SelectValue>
                  {surahInfo
                    ? `${surahNum}. ${surahInfo.englishName}`
                    : 'Select Surah'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {allSurahs.map(s => (
                  <SelectItem key={s.number} value={String(s.number)}>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-6 shrink-0">{s.number}.</span>
                      <span>{s.englishName}</span>
                      <span className="ml-auto font-arabic text-base text-amber-700 dark:text-amber-300">{s.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Translation toggles */}
            <Button
              id="toggle-english"
              variant={showEn ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowEn(v => !v)}
              className={`h-9 rounded-xl gap-1.5 text-xs font-bold border-2 transition-all ${
                showEn
                  ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600'
                  : 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-white/60 dark:bg-amber-900/40'
              }`}
            >
              {showEn ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              EN
            </Button>

            <Button
              id="toggle-urdu"
              variant={showUr ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowUr(v => !v)}
              className={`h-9 rounded-xl gap-1.5 text-xs font-bold border-2 transition-all ${
                showUr
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  : 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-white/60 dark:bg-amber-900/40'
              }`}
            >
              {showUr ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              اردو
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-3 py-4">
          {/* ── Surah Header ── */}
          {surahInfo && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700 p-6 mb-4 shadow-xl text-center">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,white,transparent_70%)]" />
              <p className="font-quran text-3xl text-white mb-1 leading-loose">{surahInfo.name}</p>
              <p className="text-teal-100 font-bold text-lg">{surahInfo.englishName}</p>
              <p className="text-teal-200 text-sm">{surahInfo.englishNameTranslation}</p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {surahInfo.revelationType}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {surahInfo.numberOfAyahs} Verses
                </Badge>
              </div>
            </div>
          )}

          {/* ── Basmala (for all except Al-Fatiha and At-Tawbah) ── */}
          {surahNum !== 1 && surahNum !== 9 && !loading && (
            <div className="text-center py-4 mb-2">
              <p className="font-quran text-2xl text-amber-800 dark:text-amber-200 leading-loose">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            </div>
          )}

          {/* ── Loading Skeleton ── */}
          {loading && <Skeleton />}

          {/* ── Ayah List ── */}
          {!loading && arabicVerses.length > 0 && (
            <ScrollArea className="h-[calc(100vh-220px)]" ref={scrollAreaRef}>
              <div className="space-y-4 pb-24">
                {arabicVerses.map((verse, idx) => {
                  const enVerse  = enVerses[idx];
                  const urVerse  = urVerses[idx];
                  const isBookmarked = bookmarks.includes(verse.id);

                  return (
                    <div
                      key={verse.id}
                      id={`ayah-${verse.id}`}
                      data-ayah={verse.id}
                      ref={el => { ayahRefs.current[verse.id] = el; }}
                      className="group relative rounded-2xl bg-white/80 dark:bg-white/5 border border-amber-100 dark:border-amber-900/50 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 overflow-hidden"
                    >
                      {/* Ayah number + bookmark row */}
                      <div className="flex items-center justify-between px-4 pt-3 pb-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                          {verse.id}
                        </div>
                        <button
                          id={`bookmark-ayah-${verse.id}`}
                          onClick={() => toggleBookmark(verse.id)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isBookmarked
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30'
                              : 'text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-amber-400'
                          }`}
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this ayah'}
                        >
                          {isBookmarked
                            ? <BookmarkCheck className="w-4 h-4" />
                            : <Bookmark className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Arabic text */}
                      <div className="px-4 pb-3 pt-1">
                        <p
                          className="font-quran text-right leading-loose text-gray-900 dark:text-amber-50"
                          style={{ fontSize: '1.65rem', lineHeight: '3rem' }}
                          dir="rtl"
                        >
                          {verse.text}
                        </p>
                      </div>

                      {/* Divider */}
                      {(showEn || showUr) && (
                        <div className="h-px bg-amber-100 dark:bg-amber-900/30 mx-4" />
                      )}

                      {/* English translation */}
                      {showEn && enVerse?.translation && (
                        <div className="px-4 py-2.5">
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mr-1.5">EN</span>
                            {enVerse.translation}
                          </p>
                        </div>
                      )}

                      {/* Urdu translation */}
                      {showUr && urVerse?.translation && (
                        <div className="px-4 pb-3 pt-1">
                          <p
                            className="text-sm text-right text-gray-700 dark:text-gray-300 leading-loose"
                            dir="rtl"
                            style={{ fontFamily: 'Noto Nastaliq Urdu, serif' }}
                          >
                            {urVerse.translation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
