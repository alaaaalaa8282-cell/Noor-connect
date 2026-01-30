// version 1.0.2
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Pause, Play, SkipBack, SkipForward, User, Volume2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";

interface QuranComRecitation {
  id: number;
  reciter_name: string;
  style: string | null;
  translated_name?: {
    name: string;
    language_name: string;
  };
}

const SURAH_AYAH_COUNTS: number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98,
  135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11,
  11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25,
  22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3,
  6, 3, 5, 4, 5, 6,
];

const SURAH_STARTS: number[] = (() => {
  const starts: number[] = [];
  let acc = 0;
  for (const c of SURAH_AYAH_COUNTS) {
    starts.push(acc);
    acc += c;
  }
  return starts;
})();

const RECITER_MAP: Record<number, string> = {
  7: "ar.alafasy",
  3: "ar.abdurrahmaansudais",
  10: "ar.shuraym",
  11: "ar.tablawi",
  2: "ar.abdulbasitmurattal",
  1: "ar.abdulbasitmurattal",
  6: "ar.husary",
  12: "ar.husary",
  8: "ar.minshawi",
  9: "ar.minshawi",
  4: "ar.ashatri",
  5: "ar.hanirifai",
};

interface QuranAudioPlayerProps {
  surahNumber: number;
  surahName: string;
  totalAyahs: number;
  currentAyah: number;
  onAyahChange?: (ayah: number) => void;
  onClose: () => void;
}

export function QuranAudioPlayer({ 
  surahNumber, 
  surahName, 
  totalAyahs,
  currentAyah = 1,
  onAyahChange,
  onClose 
}: QuranAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const bufferAudioRef = useRef<HTMLAudioElement | null>(null);
  const nextBufferAudioRef = useRef<HTMLAudioElement | null>(null); // Additional buffer
  const bufferedAyahRef = useRef<number | null>(null);
  const nextBufferedAyahRef = useRef<number | null>(null);
  const bufferedSrcRef = useRef<string | null>(null);
  const nextBufferedSrcRef = useRef<string | null>(null);
  const skipNextAudioSrcEffectRef = useRef(false);
  const retryingTo64Ref = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [ayah, setAyah] = useState(currentAyah);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recitations, setRecitations] = useState<QuranComRecitation[]>([]);
  const [recitationId, setRecitationId] = useState<number>(7);
  const [isSeamlessMode, setIsSeamlessMode] = useState(true); // New seamless mode toggle
  const [isBackgroundMode, setIsBackgroundMode] = useState(false); // New background mode toggle

  useEffect(() => {
    setAyah(currentAyah);
  }, [currentAyah]);

  // Setup Media Session API for background playback
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const updateMediaSession = () => {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Surah ${surahName} - Ayah ${ayah}`,
        artist: recitations.find(r => r.id === recitationId)?.reciter_name || 'Quran Recitation',
        album: 'Holy Quran',
        artwork: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        handlePlayPause();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        handlePlayPause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        handlePrevAyah();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleNextAyah();
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
      // Cleanup media session handlers
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      }
    };
  }, [surahName, ayah, recitationId, recitations]);

  const getGlobalAyah = (surahNum: number, ayahNum: number) => {
    // Global ayah id is 1..6236. Surah starts are 0-based offsets (Surah 1 starts at 0, Surah 2 at 7, etc.)
    if (surahNum <= 0 || surahNum > 114) return 1;
    if (ayahNum <= 0) return 1; // Ensure ayah starts at 1, not 0
    
    const start0 = SURAH_STARTS[surahNum - 1] ?? 0;
    const global = start0 + ayahNum;

    // Some datasets store a separate basmala audio per-surah. Islamic Network's by-ayah audio generally does NOT.
    // Keep this toggle available (default off) in case a specific edition needs it.
    const includeBismillahAsSeparateFile = false;
    if (!includeBismillahAsSeparateFile) return global;

    if (surahNum === 9) return global;
    if (surahNum === 1) return global;
    return global + (ayahNum >= 1 ? 1 : 0);
  };

  const verseKey = `${surahNumber}:${ayah}`;

  const edition = useMemo(() => {
    const slug = RECITER_MAP[recitationId];
    if (!slug) {
      console.warn(`Reciter ID ${recitationId} not in RECITER_MAP; falling back to ar.alafasy`);
      return "ar.alafasy";
    }
    return slug;
  }, [recitationId]);

  const audioSrc = useMemo(() => {
    const globalAyah = getGlobalAyah(surahNumber, ayah);
    const base = `https://cdn.islamic.network/quran/audio`;
    const paddedAyah = String(globalAyah).padStart(3, '0'); // Zero-pad to 3 digits (e.g., 001, 002, 003)
    return `${base}/128/${edition}/${paddedAyah}.mp3`;
  }, [ayah, edition, surahNumber]);

  const nextAudioSrc = useMemo(() => {
    if (ayah >= totalAyahs) return null;
    const nextAyah = ayah + 1;
    const globalAyah = getGlobalAyah(surahNumber, nextAyah);
    const base = `https://cdn.islamic.network/quran/audio`;
    const paddedAyah = String(globalAyah).padStart(3, '0'); // Zero-pad to 3 digits
    return `${base}/128/${edition}/${paddedAyah}.mp3`;
  }, [ayah, edition, surahNumber, totalAyahs]);

  const fallbackTo64 = useCallback(() => {
    if (retryingTo64Ref.current) return;
    retryingTo64Ref.current = true;
    const globalAyah = getGlobalAyah(surahNumber, ayah);
    const paddedAyah = String(globalAyah).padStart(3, '0'); // Zero-pad to 3 digits
    const fallbackUrl = `https://cdn.islamic.network/quran/audio/64/${edition}/${paddedAyah}.mp3`;
    console.error(`Audio failed for slug (128): ${edition}; retrying with 64kbps`);
    const audio = audioRef.current;
    if (audio) {
      audio.src = fallbackUrl;
      audio.load();
      void audio.play().catch(() => {
        console.error(`Even 64kbps failed for slug: ${edition}`);
        setIsPlaying(false);
        setIsLoading(false);
      });
    }
  }, [ayah, edition, surahNumber]);

  useEffect(() => {
    const fetchReciters = async () => {
      try {
        const res = await fetch("https://api.quran.com/api/v4/resources/recitations");
        const json = await res.json();
        const list: QuranComRecitation[] = json?.recitations || [];
        console.log("Quran.com recitations:", list);
        setRecitations(list);
      } catch (e) {
        console.error("Failed to fetch reciters:", e);
      }
    };

    fetchReciters();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (skipNextAudioSrcEffectRef.current && audio.src === audioSrc) {
      skipNextAudioSrcEffectRef.current = false;
      return;
    }

    retryingTo64Ref.current = false;

    setIsLoading(true);

    // Stabilized change: pause -> set src -> load -> (try) play
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

    // Prevent audio from stopping when app loses focus or page becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying && isBackgroundMode) {
        // Keep playing in background
        audio.play().catch(console.error);
      }
    };

    const handlePageUnload = () => {
      // Save current playback state to localStorage
      if (isPlaying) {
        localStorage.setItem('quran-audio-state', JSON.stringify({
          surahNumber,
          surahName,
          ayah,
          recitationId,
          isPlaying: true,
          isSeamlessMode,
          isBackgroundMode,
          timestamp: Date.now()
        }));
      }
    };

    // Restore playback state if available
    const savedState = localStorage.getItem('quran-audio-state');
    if (savedState && !isPlaying) {
      try {
        const state = JSON.parse(savedState);
        const timeDiff = Date.now() - state.timestamp;
        
        // Only restore if within last 30 minutes
        if (timeDiff < 30 * 60 * 1000 && state.surahNumber === surahNumber) {
          setAyah(state.ayah);
          setRecitationId(state.recitationId);
          setIsSeamlessMode(state.isSeamlessMode);
          setIsBackgroundMode(state.isBackgroundMode);
          
          // Auto-resume if background mode was enabled
          if (state.isBackgroundMode && state.isPlaying) {
            setTimeout(() => {
              handlePlayPause();
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
  }, [isPlaying, isBackgroundMode, surahNumber, surahName, ayah, recitationId, isSeamlessMode]);

  useEffect(() => {
    if (!nextAudioSrc) {
      bufferAudioRef.current = null;
      bufferedAyahRef.current = null;
      bufferedSrcRef.current = null;
      return;
    }

    const nextAyah = ayah + 1;
    if (bufferedAyahRef.current === nextAyah && bufferedSrcRef.current === nextAudioSrc) return;

    if (bufferAudioRef.current) {
      bufferAudioRef.current.pause();
      bufferAudioRef.current.src = "";
      bufferAudioRef.current.load();
    }

    const a = new Audio();
    a.setAttribute("loading", "lazy");
    a.preload = "auto";
    a.src = nextAudioSrc;
    
    // Enhanced buffering for seamless playback
    if (isSeamlessMode) {
      a.addEventListener('canplaythrough', () => {
        // Audio is ready for seamless playback
        console.log(`Next ayah ${nextAyah} buffered and ready for seamless playback`);
      }, { once: true });
    }
    
    a.load();
    bufferAudioRef.current = a;
    bufferedAyahRef.current = nextAyah;
    bufferedSrcRef.current = nextAudioSrc;
  }, [ayah, nextAudioSrc, isSeamlessMode]);


  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error("Play error:", e);
        setIsPlaying(false);
      }
    }
  };

  const handlePrevAyah = () => {
    if (ayah > 1) {
      const newAyah = ayah - 1;
      setAyah(newAyah);
      onAyahChange?.(newAyah);
    }
  };

  const handleNextAyah = () => {
    if (ayah < totalAyahs) {
      const newAyah = ayah + 1;
      setAyah(newAyah);
      onAyahChange?.(newAyah);
    }
  };

  const handleAudioEnded = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextAyah = ayah + 1;
    if (nextAyah > totalAyahs) return;

    if (
      bufferAudioRef.current &&
      bufferedAyahRef.current === nextAyah &&
      bufferedSrcRef.current &&
      bufferedSrcRef.current === nextAudioSrc
    ) {
      skipNextAudioSrcEffectRef.current = true;
      retryingTo64Ref.current = false;
      audio.src = bufferedSrcRef.current;
      audio.load();
      void audio.play().catch(() => {
        setIsPlaying(false);
      });

      setAyah(nextAyah);
      onAyahChange?.(nextAyah);
      return;
    }

    handleNextAyah();
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(audio.currentTime);
    setDuration(audio.duration || 0);

    // Update media session position - only if all values are valid numbers
    if ('mediaSession' in navigator && 
        navigator.mediaSession.setPositionState && 
        !isNaN(audio.duration) && 
        !isNaN(audio.playbackRate) && 
        !isNaN(audio.currentTime) && 
        audio.duration > 0) {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: audio.currentTime
      });
    }

    // Seamless playback: Preload next ayah when current is 80% complete
    if (isSeamlessMode && nextAudioSrc && bufferAudioRef.current) {
      const progressPercent = (audio.currentTime / audio.duration) * 100;
      if (progressPercent >= 80 && bufferAudioRef.current.readyState < 3) {
        bufferAudioRef.current.load();
      }
    }

    // Auto-transition to next ayah seamlessly
    if (isSeamlessMode && audio.duration > 0) {
      const timeRemaining = audio.duration - audio.currentTime;
      if (timeRemaining <= 0.05 && ayah < totalAyahs) { // 50ms before end
        handleNextAyahSeamless();
      }
    }
  };

  const handleNextAyahSeamless = () => {
    if (ayah >= totalAyahs) return;

    const nextAyah = ayah + 1;
    
    if (isSeamlessMode && bufferAudioRef.current && bufferAudioRef.current.readyState >= 3) {
      // True cross-fade: Start next audio immediately, then switch
      const currentAudio = audioRef.current;
      const nextAudio = bufferAudioRef.current;
      
      // Set volume and start next audio immediately (don't wait for promise)
      nextAudio.volume = volume / 100;
      nextAudio.currentTime = 0;
      
      // Start playing next audio
      const playPromise = nextAudio.play();
      
      // Switch references immediately (don't wait for play promise)
      audioRef.current = nextAudio;
      bufferAudioRef.current = currentAudio;
      
      // Update state immediately
      setAyah(nextAyah);
      onAyahChange?.(nextAyah);
      
      // Handle play promise in background
      playPromise.catch(error => {
        console.error('Seamless transition failed:', error);
        // Fallback to regular transition
        handleNextAyah();
      });
      
      // Clean up old audio after a short delay
      setTimeout(() => {
        if (currentAudio && currentAudio !== audioRef.current) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }, 100);
    } else {
      // Fallback to regular transition
      handleNextAyah();
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

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 shadow-lg bg-card/95 backdrop-blur-lg border-border h-80">
      <div className="p-4 space-y-3 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{surahName}</p>
            <p className="text-xs text-muted-foreground">Ayah {ayah} of {totalAyahs}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Reciter Selector */}
        <Select
          value={String(recitationId)}
          onValueChange={(id) => setRecitationId(parseInt(id, 10))}
        >
          <SelectTrigger className="w-full">
            <User className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select reciter" />
          </SelectTrigger>
          <SelectContent>
            {recitations.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.reciter_name}{r.style ? ` (${r.style})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Seamless Mode Toggle */}
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Seamless Playback</span>
          </div>
          <Button
            variant={isSeamlessMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsSeamlessMode(!isSeamlessMode)}
          >
            {isSeamlessMode ? "ON" : "OFF"}
          </Button>
        </div>

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
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePrevAyah}
            disabled={ayah <= 1}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full"
            onClick={handlePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNextAyah}
            disabled={ayah >= totalAyahs}
          >
            <SkipForward className="w-4 h-4" />
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
