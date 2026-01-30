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
  7: "mishari_rashid_al_afasy",
  3: "sa3d_alghamidi",
  10: "saud_al-shuraim",
  11: "abdur_rahman_as_sudais",
  2: "abdul_basit_muhammad_abdus_samad_u",
  1: "abdul_basit_muhammad_abdus_samad_u",
  6: "mahmoud_khalil_al_husary",
  12: "mahmoud_khalil_al_husary",
  8: "mohammad_siddiq_al_minshawi",
  9: "mohammad_siddiq_al_minshawi",
  4: "abu_bakr_ash_shatri",
  5: "hani_ar_rifai",
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recitations, setRecitations] = useState<QuranComRecitation[]>([]);
  const [recitationId, setRecitationId] = useState<number>(7);
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);

  // Setup Media Session API for background playback
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const updateMediaSession = () => {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Surah ${surahName}`,
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
        // Reset to beginning of current surah
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          setProgress(0);
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        // Go to next surah if available, or stop playback
        if (surahNumber < 114) {
          // This would need to be handled by parent component
          console.log('Next surah requested - parent component should handle this');
        } else {
          handlePlayPause(); // Stop playback if at last surah
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
      // Cleanup media session handlers
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      }
    };
  }, [surahName, recitationId, recitations]);

  const audioSrc = useMemo(() => {
    const reciterPath = RECITER_MAP[recitationId];
    if (!reciterPath) {
      console.warn(`Reciter ID ${recitationId} not in RECITER_MAP; falling back to mishari_rashid_al_afasy`);
      return "https://download.quranicaudio.com/quran/mishari_rashid_al_afasy/001.mp3";
    }
    const paddedSurahNumber = surahNumber.toString().padStart(3, '0');
    const url = `https://download.quranicaudio.com/quran/${reciterPath}/${paddedSurahNumber}.mp3`;
    console.log(`Loading Surah ${surahNumber} from: ${url}`);
    return url;
  }, [surahNumber, recitationId]);



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

    if (audio.src === audioSrc) return;

    setIsLoading(true);

    // Pause -> set src -> load -> (try) play
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
          recitationId,
          isPlaying: true,
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
          setRecitationId(state.recitationId);
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
  }, [isPlaying, isBackgroundMode, surahNumber, surahName, recitationId]);

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


  const handleAudioEnded = () => {
    // Full surah playback completed
    console.log(`Surah ${surahName} playback completed`);
    setIsPlaying(false);
    // Could trigger next surah playback here if needed
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || isNaN(audio.duration) || audio.duration === 0) return;
    setProgress(audio.currentTime);
    setDuration(audio.duration || 0);

    // Update media session position
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
