import { useState, useRef, useEffect } from "react";
import { Radio, Play, Pause, X, Volume2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Slider } from "./ui/slider";

export function QuranRadio() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (audioRef.current && !isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
      setIsPlaying(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <>
      {/* Floating Radio Button */}
      {!isOpen && (
        <div className="fixed bottom-24 right-6 z-50 animate-scale-in">
          <Button
            onClick={handleOpen}
            size="icon"
            className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform duration-200"
          >
            <Radio className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Radio Player */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 animate-slide-up">
          <Card className="w-72 bg-card/95 backdrop-blur-lg border-border shadow-lg">
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-primary animate-pulse" />
                  <h3 className="font-semibold text-foreground">Quran Radio</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Status */}
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                  <span className="text-sm font-medium text-foreground">
                    {isPlaying ? 'Connected to Radio' : 'Paused'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Live Quran Recitation</p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center">
                <Button
                  onClick={togglePlay}
                  size="icon"
                  className="h-12 w-12 rounded-full bg-primary text-primary-foreground"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
              </div>

              {/* Volume Control */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {volume}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src="https://Qurango.net/radio/tarateel"
        preload="none"
        onEnded={() => setIsPlaying(false)}
      />
    </>
  );
}
