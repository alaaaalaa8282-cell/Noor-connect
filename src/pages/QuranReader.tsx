/**
 * Quran Reader Page
 * Enhanced Quran reading with bookmarks, notes, and progress tracking
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookmarkCheck, Edit3, FileText, ChevronLeft, ChevronRight, Plus, X, Save, Trash2, Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { quranFontManager, type QuranFont } from '@/lib/quran-font-manager';
import { quranFeaturesService, type QuranBookmark, type QuranNote, type RecitationProgress } from '@/lib/quran-features';
import { AppBar } from '@/components/AppBar';
import { PageTransition } from '@/components/PageTransition';
import { useI18n } from '@/hooks/useI18n';

// Translation editions
const TRANSLATIONS = [
  { id: "en.sahih", name: "English (Sahih)", lang: "English" },
  { id: "en.pickthall", name: "English (Pickthall)", lang: "English" },
  { id: "en.yusufali", name: "English (Yusuf Ali)", lang: "English" },
  { id: "ur.ahmedali", name: "Urdu", lang: "Urdu" },
  { id: "fr.hamidullah", name: "French", lang: "French" },
  { id: "id.indonesian", name: "Indonesian", lang: "Indonesian" },
  { id: "tr.ates", name: "Turkish", lang: "Turkish" },
  { id: "de.aburida", name: "German", lang: "German" },
];

interface Ayah {
  number: number;
  text: string;
  translation?: string;
  audio?: string;
}

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: Ayah[];
}

export default function QuranReader() {
  const navigate = useNavigate();
  const { surahNumber } = useParams<{ surahNumber: string }>();
  const { toast } = useToast();
  const { t: ti18n } = useI18n();


  const [surah, setSurah] = useState<Surah | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAyah, setCurrentAyah] = useState(1);
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [notes, setNotes] = useState<QuranNote[]>([]);
  const [progress, setProgress] = useState<RecitationProgress | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editingNote, setEditingNote] = useState<QuranNote | null>(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState(TRANSLATIONS[0]);
  const [fontSize, setFontSize] = useState(24);
  const [currentQuranFont, setCurrentQuranFont] = useState<QuranFont>('uthmani');

  useEffect(() => {
    if (surahNumber) {
      loadSurah(parseInt(surahNumber));
      loadFeatures();
      // Update reading streak when user opens a surah
      quranFeaturesService.updateReadingStreak();
    }
  }, [surahNumber, selectedTranslation]);

  // Load preferences
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

  const loadSurah = async (surahNum: number) => {
    try {
      setLoading(true);

      // Fetch surah details
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}`);
      const data = await response.json();

      if (data.code === 200) {
        const surahData = data.data;

        // Fetch ayah details with translations
        const ayahsResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,${selectedTranslation.id}`);
        const ayahsData = await ayahsResponse.json();

        if (ayahsData.code === 200) {
          const quranEdition = ayahsData.data[0];
          const translationEdition = ayahsData.data[1];

          const ayahs: Ayah[] = quranEdition.ayahs.map((ayah: any, index: number) => ({
            number: ayah.numberInSurah,
            text: ayah.text,
            translation: translationEdition.ayahs[index]?.text,
            audio: ayah.audio
          }));

          setSurah({
            number: surahData.number,
            name: surahData.name,
            englishName: surahData.englishName,
            englishNameTranslation: surahData.englishNameTranslation,
            numberOfAyahs: surahData.numberOfAyahs,
            revelationType: surahData.revelationType,
            ayahs
          });
        }
      }
    } catch (error) {
      console.error('Error loading surah:', error);
      toast({
        title: 'Error',
        description: 'Failed to load surah',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async () => {
    if (!surahNumber) return;

    const surahNum = parseInt(surahNumber);

    try {
      const [bookmarksList, notesList, progressList] = await Promise.all([
        quranFeaturesService.getBookmarks(),
        quranFeaturesService.getNotes(),
        quranFeaturesService.getRecitationProgress()
      ]);

      setBookmarks(bookmarksList.filter(b => b.surahNumber === surahNum));
      setNotes(notesList.filter(n => n.surahNumber === surahNum));
      setProgress(progressList.find(p => p.surahNumber === surahNum) || null);
    } catch (error) {
      console.error('Error loading Quran features:', error);
    }
  };

  const toggleBookmark = async (ayahNumber: number) => {
    if (!surah) return;

    try {
      const existingBookmark = bookmarks.find(b => b.ayahNumber === ayahNumber);

      if (existingBookmark) {
        await quranFeaturesService.removeBookmark(existingBookmark.id);
        setBookmarks(prev => prev.filter(b => b.id !== existingBookmark.id));
        toast({
          title: 'Bookmark Removed',
          description: `Bookmark removed from Ayah ${ayahNumber}`
        });
      } else {
        const ayah = surah.ayahs.find(a => a.number === ayahNumber);
        if (ayah) {
          const bookmark = await quranFeaturesService.addBookmark(
            surah.number,
            ayahNumber,
            surah.name,
            ayah.text
          );
          setBookmarks(prev => [...prev, bookmark]);
          toast({
            title: 'Bookmark Added',
            description: `Ayah ${ayahNumber} bookmarked`
          });
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle bookmark',
        variant: 'destructive'
      });
    }
  };

  const saveNote = async () => {
    if (!surah || !noteText.trim()) return;

    try {
      if (editingNote) {
        await quranFeaturesService.updateNote(editingNote.id, noteText);
        setNotes(prev => prev.map(n =>
          n.id === editingNote.id
            ? { ...n, note: noteText, updatedAt: new Date().toISOString() }
            : n
        ));
        toast({
          title: 'Note Updated',
          description: 'Your note has been updated'
        });
      } else {
        const ayah = surah.ayahs.find(a => a.number === currentAyah);
        if (ayah) {
          const note = await quranFeaturesService.addNote(
            surah.number,
            currentAyah,
            surah.name,
            ayah.text,
            noteText
          );
          setNotes(prev => [...prev, note]);
          toast({
            title: 'Note Added',
            description: `Note added to Ayah ${currentAyah}`
          });
        }
      }

      setNoteText('');
      setEditingNote(null);
      setShowNoteDialog(false);
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save note',
        variant: 'destructive'
      });
    }
  };

  const updateProgress = async (ayahNumber: number) => {
    if (!surah) return;

    try {
      const completedAyahs = Math.max(progress?.completedAyahs || 0, ayahNumber);
      const updatedProgress = await quranFeaturesService.updateRecitationProgress(
        surah.number,
        surah.name,
        surah.numberOfAyahs,
        completedAyahs,
        ayahNumber
      );

      setProgress(updatedProgress);

      if (updatedProgress.isCompleted) {
        toast({
          title: 'Surah Completed!',
          description: `Congratulations! You've completed ${surah.englishName}`,
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const isBookmarked = (ayahNumber: number) => {
    return bookmarks.some(b => b.ayahNumber === ayahNumber);
  };

  const getNotesForAyah = (ayahNumber: number) => {
    return notes.filter(n => n.ayahNumber === ayahNumber);
  };

  const progressPercentage = progress ? (progress.completedAyahs / progress.totalAyahs) * 100 : 0;

  // Settings handlers
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
      if (surahNumber) {
        loadSurah(parseInt(surahNumber)); // Reload with new translation
      }
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem('quran-font-size', size.toString());
  };

  // Check for achievements when surah is completed
  const checkAchievements = async () => {
    try {
      const newAchievements = await quranFeaturesService.checkAndUnlockAchievements();
      if (newAchievements.length > 0) {
        newAchievements.forEach(achievement => {
          toast({
            title: `🎉 Achievement Unlocked!`,
            description: `${achievement.title}: ${achievement.description}`,
          });
        });
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  // Check achievements when component loads and when progress changes
  useEffect(() => {
    if (surah && progress) {
      checkAchievements();
    }
  }, [surah, progress]);

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <AppBar title={ti18n('quranReader')} showBack />
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!surah) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <AppBar title={ti18n('quranReader')} showBack />
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">{ti18n('surahNotFound')}</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background quran-reader-container">
        <AppBar title={`Surah ${surah.englishName}`} showBack />

        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Surah Header */}
          <Card className="quran-card">
            <CardHeader className="pb-3">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold font-arabic">{surah.name}</h1>
                  </div>
                  <div className="flex-1 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                      className="gap-1"
                    >
                      <Settings className="w-4 h-4" />
                      {ti18n('quranSettingsButton')}
                    </Button>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground">{surah.englishName}</p>
                <p className="text-sm text-muted-foreground">{surah.englishNameTranslation}</p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <Badge variant="secondary">{surah.revelationType}</Badge>
                  <Badge variant="outline">{surah.numberOfAyahs} Ayahs</Badge>
                </div>
              </div>
            </CardHeader>

            {/* Progress Bar */}
            {progress && (
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{ti18n('progress')}</span>
                  <span>{progress.completedAyahs}/{progress.totalAyahs} ayahs</span>
                </div>
                <Progress value={progressPercentage} className="h-2 quran-progress-bar" />
                <p className="text-xs text-muted-foreground">
                  {progressPercentage.toFixed(1)}% completed
                </p>
              </CardContent>
            )}
          </Card>

          {/* Settings Panel */}
          {showSettings && (
            <Card className="animate-in slide-in-from-top duration-300">
              <CardHeader>
                <CardTitle className="text-base">{ti18n('quranSettings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{ti18n('font')}</label>
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
                    <label className="text-sm font-medium">{ti18n('translation')}</label>
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
                  <label className="text-sm font-medium">{ti18n('fontSize')}: {fontSize}px</label>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleFontSizeChange(Math.max(16, fontSize - 2))}>-</Button>
                    <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${((fontSize - 16) / 26) * 100}%` }} />
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleFontSizeChange(Math.min(42, fontSize + 2))}>+</Button>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowSettings(false)}>{ti18n('closeSettings')}</Button>
              </CardContent>
            </Card>
          )}

          {/* All Ayahs in Vertical Scroll */}
          <Card className="quran-card">
            <CardContent className="p-6">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-6">
                  {surah.ayahs.map((ayah, index) => (
                    <div
                      key={ayah.number}
                      className={`relative p-4 rounded-lg border transition-colors ${isBookmarked(ayah.number) ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                        }`}
                    >
                      {/* Ayah Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">{ayah.number}</span>
                          {progress?.lastReadAyah === ayah.number && (
                            <Badge variant="secondary" className="text-xs">Last Read</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBookmark(ayah.number)}
                            className={`gap-1 ${isBookmarked(ayah.number) ? 'text-primary' : 'text-muted-foreground'}`}
                          >
                            <BookmarkCheck className="w-4 h-4" />
                          </Button>
                          <Dialog open={showNoteDialog && currentAyah === ayah.number} onOpenChange={(open) => {
                            setShowNoteDialog(open);
                            if (open) {
                              setCurrentAyah(ayah.number);
                              const existingNote = notes.find(n => n.ayahNumber === ayah.number);
                              if (existingNote) {
                                setEditingNote(existingNote);
                                setNoteText(existingNote.note);
                              } else {
                                setEditingNote(null);
                                setNoteText('');
                              }
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {editingNote ? 'Edit Note' : 'Add Note'} - Ayah {ayah.number}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Write your note here..."
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  rows={4}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={saveNote}>
                                    <Save className="w-4 h-4 ms-2" />
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      {/* Ayah Text */}
                      <div className="space-y-3">
                        <p
                          className="text-2xl font-arabic leading-relaxed text-right"
                          style={{
                            fontSize: `${fontSize}px`,
                            fontFamily: 'var(--quran-font)'
                          }}
                        >
                          {ayah.text}
                        </p>
                        {ayah.translation && (
                          <p className="text-muted-foreground italic">
                            {ayah.translation}
                          </p>
                        )}
                      </div>

                      {/* Notes for this Ayah */}
                      {getNotesForAyah(ayah.number).length > 0 && (
                        <div className="mt-3 space-y-2">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Notes
                          </h4>
                          {getNotesForAyah(ayah.number).map((note) => (
                            <div key={note.id} className="p-3 bg-muted rounded-lg">
                              <p className="text-sm">{note.note}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(note.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Mark Surah as Complete Button */}
          {surah && (
            <Card className="quran-card">
              <CardContent className="p-4">
                {progress?.isCompleted ? (
                  <div className="flex items-center justify-center gap-2 text-primary py-2">
                    <BookmarkCheck className="w-5 h-5" />
                    <span className="font-semibold">Surah Completed ✓</span>
                  </div>
                ) : (
                  <Button
                    className="w-full gap-2"
                    onClick={() => updateProgress(surah.numberOfAyahs)}
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    Mark Surah as Complete
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bookmarks Summary */}
          {bookmarks.length > 0 && (
            <Card className="quran-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4" />
                  Bookmarks ({bookmarks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <span className="text-sm">Ayah {bookmark.ayahNumber}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBookmark(bookmark.ayahNumber)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
