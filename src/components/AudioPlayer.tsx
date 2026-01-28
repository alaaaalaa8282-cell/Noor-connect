import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface AudioPlayerProps {
  surahNumber: number;
  surahName: string;
  onClose: () => void;
}

export const AudioPlayer = ({ surahNumber, surahName, onClose }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAndPlayAudio = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`https://api.quran.com/api/v4/chapter_recitations/7/${surahNumber}`);
        const data = await response.json();
        const audioUrl = data.audio_file.audio_url;
        
        const audio = audioRef.current;
        if (!audio) return;

        audio.src = audioUrl;
        audio.load();
        
        // Try to play immediately
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Autoplay blocked:", error);
              toast({
                title: "Tap Play to start audio",
                duration: 3000,
              });
              setIsPlaying(false);
            });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Audio playback error:", error);
        toast({
          title: "Failed to load audio",
          description: "Please try again",
          variant: "destructive",
          duration: 3000,
        });
        setIsLoading(false);
      }
    };

    fetchAndPlayAudio();
  }, [surahNumber, toast]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Play error:", error);
            toast({
              title: "Tap Play to start audio",
              duration: 3000,
            });
          });
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t shadow-glow rounded-t-xl">
      <audio ref={audioRef} id="quranAudio" preload="auto" />
      
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">{surahName}</p>
            <p className="text-xs text-muted-foreground">Mishary Rashid Alafasy</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={togglePlay}
            size="icon"
            className="rounded-full w-12 h-12"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0] / 100)}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
