// version 2.0.0 - MP3Quran.net V3 API Integration
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AlertCircle, Pause, Play, User, Volume2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { androidAudioHelper } from "@/lib/android-audio-helper";
import { useGlobalRadio } from "@/lib/global-radio";

// MP3Quran.net V3 API Types
interface Moshaf {
  id: number;
  name: string;
  server: string;
  surah_total: number;
  surah_list: string;
}

interface Reciter {
  id: number;
  name: string;
  moshaf: Moshaf[];
}

interface MP3QuranResponse {
  reciters: Reciter[];
}

// Flattened structure for dropdown display
interface FlattenedReciter {
  id: string; // "{reciterId}-{moshafId}" for unique key
  reciterId: number;
  moshafId: number;
  name: string;
  moshafName: string;
  server: string;
  surahList: number[];
  surahTotal: number;
}

interface QuranAudioPlayerProps {
  surahNumber: number;
  surahName: string;
  totalAyahs: number;
  currentAyah: number;
  onAyahChange?: (ayah: number) => void;
  onClose: () => void;
}

// Parse surah_list string "1,2,3,..." to number array
function parseSurahList(surahListStr: string): number[] {
  if (!surahListStr) return [];
  return surahListStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
}

// Local storage key for persisting selected reciter
const RECITER_STORAGE_KEY = 'mp3quran-selected-reciter';

export function QuranAudioPlayer({
  surahNumber,
  surahName,
  totalAyahs,
  currentAyah = 1,
  onAyahChange,
  onClose
}: QuranAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [reciters, setReciters] = useState<FlattenedReciter[]>([]);
  const [selectedReciterId, setSelectedReciterId] = useState<string>('');
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  const [surahAvailable, setSurahAvailable] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { updateRadioState, isPlaying: isRadioPlaying } = useGlobalRadio();


  const togglePlayback = useCallback(async () => {
    if (!audioRef.current || !surahAvailable) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Pause global radio if playing
      if (isRadioPlaying) {
        updateRadioState({ isPlaying: false });
      }

      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error("Play error:", e);
        setIsPlaying(false);
      }
    }
  }, [isPlaying, surahAvailable, isRadioPlaying, updateRadioState]);

  // Get currently selected reciter object
  const selectedReciter = useMemo(() => {
    return reciters.find(r => r.id === selectedReciterId) || null;
  }, [reciters, selectedReciterId]);

  // Check if current surah is available for selected reciter
  useEffect(() => {
    if (!selectedReciter) {
      setSurahAvailable(false);
      setAvailabilityError(null);
      return;
    }

    const isAvailable = selectedReciter.surahList.includes(surahNumber);
    setSurahAvailable(isAvailable);

    if (!isAvailable) {
      setAvailabilityError(`Surah ${surahNumber} is not available for ${selectedReciter.name}. This reciter has ${selectedReciter.surahTotal} surahs recorded.`);
      // Stop playback if currently playing
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setAvailabilityError(null);
    }
  }, [selectedReciter, surahNumber, isPlaying]);

  // Handle Android background audio optimizations
  useEffect(() => {
    if (isBackgroundMode && audioRef.current) {
      if (androidAudioHelper.isAndroid()) {
        androidAudioHelper.setupAndroidOptimizations(audioRef.current);
      } else {
        androidAudioHelper.requestWakeLock();
      }
    } else {
      androidAudioHelper.cleanup();
    }
    return () => {
      androidAudioHelper.cleanup();
    };
  }, [isBackgroundMode]);

  // Setup Media Session API for background playback
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const updateMediaSession = () => {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Surah ${surahName}`,
        artist: selectedReciter?.name || 'Quran Recitation',
        album: 'Holy Quran',
        artwork: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        togglePlayback();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlayback();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          setProgress(0);
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (surahNumber < 114) {
          console.log('Next surah requested - parent component should handle this');
        } else {
          togglePlayback();
        }
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setProgress(details.seekTime);
        }
      });
    };

    updateMediaSession();

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      }
    };
  }, [surahName, selectedReciter, togglePlayback]);

  // Generate audio URL from selected reciter
  const audioSrc = useMemo(() => {
    if (!selectedReciter || !surahAvailable) {
      return '';
    }

    const paddedSurahNumber = surahNumber.toString().padStart(3, '0');
    const url = `${selectedReciter.server}${paddedSurahNumber}.mp3`;
    console.log(`Loading Surah ${surahNumber} from: ${url}`);
    return url;
  }, [surahNumber, selectedReciter, surahAvailable]);

  // Fetch reciters from MP3Quran.net V3 API
  useEffect(() => {
    const fetchReciters = async () => {
      try {
        setFetchError(null);
        const res = await fetch("https://mp3quran.net/api/v3/reciters?language=en");

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json: MP3QuranResponse = await res.json();
        const rawReciters = json?.reciters || [];

        // Flatten reciters with their moshaf options
        const flattened: FlattenedReciter[] = [];

        for (const reciter of rawReciters) {
          for (const moshaf of reciter.moshaf) {
            flattened.push({
              id: `${reciter.id}-${moshaf.id}`,
              reciterId: reciter.id,
              moshafId: moshaf.id,
              name: reciter.name,
              moshafName: moshaf.name,
              server: moshaf.server,
              surahList: parseSurahList(moshaf.surah_list),
              surahTotal: moshaf.surah_total,
            });
          }
        }

        // Sort by name for easier navigation
        flattened.sort((a, b) => a.name.localeCompare(b.name));

        console.log(`Loaded ${flattened.length} reciter options from MP3Quran.net`);
        setReciters(flattened);

        // Try to restore previously selected reciter from localStorage
        const savedReciterId = localStorage.getItem(RECITER_STORAGE_KEY);
        if (savedReciterId && flattened.find(r => r.id === savedReciterId)) {
          setSelectedReciterId(savedReciterId);
        } else {
          // Default to Mishary Alafasi (Hafs) if available, or first reciter with 114 surahs
          const mishary = flattened.find(r =>
            r.name.toLowerCase().includes('mishary') &&
            r.moshafName.toLowerCase().includes('hafs') &&
            r.surahTotal === 114
          );

          const defaultReciter = mishary || flattened.find(r => r.surahTotal === 114) || flattened[0];

          if (defaultReciter) {
            setSelectedReciterId(defaultReciter.id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch reciters from MP3Quran.net:", e);
        setFetchError("Failed to load reciters. Please check your internet connection.");
      }
    };

    fetchReciters();
  }, []);

  // Persist selected reciter to localStorage
  useEffect(() => {
    if (selectedReciterId) {
      localStorage.setItem(RECITER_STORAGE_KEY, selectedReciterId);
    }
  }, [selectedReciterId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    if (audio.src === audioSrc) return;

    setIsLoading(true);

    audio.pause();
    audio.src = audioSrc;
    audio.load();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Autoplay blocked:", error);
          setIsPlaying(false);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [audioSrc]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying && isBackgroundMode && audio.paused) {
        audio.play().catch(console.error);
      }
    };

    const handlePageUnload = () => {
      if (isPlaying) {
        localStorage.setItem('quran-audio-state', JSON.stringify({
          surahNumber,
          surahName,
          selectedReciterId,
          isPlaying: true,
          isBackgroundMode,
          timestamp: Date.now()
        }));
      }
    };

    const savedState = localStorage.getItem('quran-audio-state');
    if (savedState && !isPlaying) {
      try {
        const state = JSON.parse(savedState);
        const timeDiff = Date.now() - state.timestamp;

        if (timeDiff < 30 * 60 * 1000 && state.surahNumber === surahNumber) {
          if (state.selectedReciterId) {
            setSelectedReciterId(state.selectedReciterId);
          }
          setIsBackgroundMode(state.isBackgroundMode);

          if (state.isBackgroundMode && state.isPlaying) {
            setTimeout(() => {
              togglePlayback();
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Failed to restore audio state:', error);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handlePageUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handlePageUnload);
    };
  }, [isPlaying, isBackgroundMode, surahNumber, surahName, selectedReciterId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleError = (error: Event) => {
      console.error(`Audio failed to load: ${audio.src}`);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('error', handleError);
    };
  }, [audioSrc]);



  const handleAudioEnded = () => {
    console.log(`Surah ${surahName} playback completed`);
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || isNaN(audio.duration) || audio.duration === 0) return;
    setProgress(audio.currentTime);
    setDuration(audio.duration || 0);

    if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: audio.currentTime
      });
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const formatTime = (time: number): string => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReciterChange = (id: string) => {
    setSelectedReciterId(id);
    // Reset playback state when switching reciters
    setProgress(0);
    setDuration(0);
  };

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 shadow-lg bg-card/95 backdrop-blur-lg border-border">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{surahName}</p>
            <p className="text-xs text-muted-foreground">Full Surah Recitation</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Fetch Error */}
        {fetchError && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Reciter Selector */}
        <Select
          value={selectedReciterId}
          onValueChange={handleReciterChange}
          disabled={reciters.length === 0}
        >
          <SelectTrigger className="w-full">
            <User className="w-4 h-4 mr-2" />
            <SelectValue placeholder={reciters.length === 0 ? "Loading reciters..." : "Select reciter"} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {reciters.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                <div className="flex flex-col">
                  <span>{r.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.moshafName} ({r.surahTotal} surahs)
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Surah Not Available Error */}
        {availabilityError && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{availabilityError}</span>
          </div>
        )}

        {/* Background Mode Toggle */}
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Background Play</span>
          </div>
          <Button
            variant={isBackgroundMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsBackgroundMode(!isBackgroundMode)}
          >
            {isBackgroundMode ? "ON" : "OFF"}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={duration || 100}
            step={0.1}
            className="w-full"
            disabled={!surahAvailable}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">

          <Button
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={togglePlayback}
            disabled={isLoading || !surahAvailable || !selectedReciter}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>


          <div className="flex items-center gap-2 ml-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              onValueChange={(v) => setVolume(v[0])}
              max={100}
              step={1}
              className="w-20"
            />
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
      />
    </Card>
  );
}
