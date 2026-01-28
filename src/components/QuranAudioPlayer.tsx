// version 1.0.2
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Pause, Play, SkipBack, SkipForward, User, Volume2, X, Infinity } from "lucide-react";
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
  currentAyah?: number;
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
  const bufferedAyahRef = useRef<number | null>(null);
  const bufferedSrcRef = useRef<string | null>(null);
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
  const [seamlessPlayback, setSeamlessPlayback] = useState(true);

  useEffect(() => {
    setAyah(currentAyah);
  }, [currentAyah]);

  const getGlobalAyah = (surahNum: number, ayahNum: number) => {
    // Global ayah id is 1..6236. Surah starts are 0-based offsets (Surah 1 starts at 0, Surah 2 at 7, etc.)
    if (surahNum <= 0 || surahNum > 114) return 1;
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

  const verseKey = useMemo(() => {
    return `${surahNumber}:${ayah}`;
  }, [ayah, surahNumber]);

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
    return `${base}/128/${edition}/${globalAyah}.mp3`;
  }, [ayah, edition, surahNumber]);

  const nextAudioSrc = useMemo(() => {
    if (ayah >= totalAyahs) return null;
    const nextAyah = ayah + 1;
    const globalAyah = getGlobalAyah(surahNumber, nextAyah);
    const base = `https://cdn.islamic.network/quran/audio`;
    return `${base}/128/${edition}/${globalAyah}.mp3`;
  }, [ayah, edition, surahNumber, totalAyahs]);

  const fallbackTo64 = useCallback(() => {
    if (retryingTo64Ref.current) return;
    retryingTo64Ref.current = true;
    const globalAyah = getGlobalAyah(surahNumber, ayah);
    const fallbackUrl = `https://cdn.islamic.network/quran/audio/64/${edition}/${globalAyah}.mp3`;
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

    const onError = () => {
      console.error("Audio failed for slug:", edition);
      fallbackTo64();
    };

    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("error", onError);
    };
  }, [edition, fallbackTo64]);

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
    
    // Set up for seamless playback
    a.addEventListener('canplaythrough', () => {
      console.log(`Next ayah ${nextAyah} buffered and ready for seamless playback`);
    });
    
    a.load();
    bufferAudioRef.current = a;
    bufferedAyahRef.current = nextAyah;
    bufferedSrcRef.current = nextAudioSrc;
  }, [ayah, nextAudioSrc]);

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
    if (nextAyah > totalAyahs) {
      setIsPlaying(false);
      return;
    }

    // Use seamless playback if enabled and buffer is ready
    if (seamlessPlayback &&
      bufferAudioRef.current &&
      bufferedAyahRef.current === nextAyah &&
      bufferedSrcRef.current &&
      bufferedSrcRef.current === nextAudioSrc
    ) {
      // Crossfade to next ayah without gap
      const nextAudio = bufferAudioRef.current;
      
      // Start playing next audio immediately
      nextAudio.currentTime = 0;
      nextAudio.play().then(() => {
        // Switch to next audio seamlessly
        audioRef.current = nextAudio;
        bufferAudioRef.current = null;
        bufferedAyahRef.current = null;
        bufferedSrcRef.current = null;
        
        setAyah(nextAyah);
        onAyahChange?.(nextAyah);
        
        // Set up event listeners for new audio
        nextAudio.addEventListener('ended', handleAudioEnded);
        nextAudio.addEventListener('timeupdate', handleTimeUpdate);
      }).catch((error) => {
        console.error('Seamless transition failed:', error);
        // Fallback to regular next ayah
        handleNextAyah();
      });
      return;
    }

    // Fallback to regular next ayah
    handleNextAyah();
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(audio.currentTime);
    setDuration(audio.duration || 0);
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
    <Card className="fixed bottom-20 left-4 right-4 z-[60] shadow-lg bg-card/95 backdrop-blur-lg border-border">
      <div className="p-4 space-y-3">
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
          
          <Button
            variant={seamlessPlayback ? "default" : "outline"}
            size="sm"
            onClick={() => setSeamlessPlayback(!seamlessPlayback)}
            className="ml-2"
            title={seamlessPlayback ? "Seamless playback enabled" : "Seamless playback disabled"}
          >
            <Infinity className="w-4 h-4" />
          </Button>
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
