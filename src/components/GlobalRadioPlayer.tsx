import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useGlobalRadio, getGlobalAudioRef, setGlobalAudioRef } from "@/lib/global-radio";

export function GlobalRadioPlayer() {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const globalRadio = useGlobalRadio();
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Initialize global audio reference
  useEffect(() => {
    setGlobalAudioRef(audioRef.current);
  }, []);

  // Handle audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      globalRadio.updateRadioState({ isPlaying: true });
    };

    const handlePause = () => {
      globalRadio.updateRadioState({ isPlaying: false });
    };

    const handleError = (e: Event) => {
      console.error('Global radio error:', e);
      globalRadio.updateRadioState({ isPlaying: false });
      setIsLoading(false);
      
      const audio = e.target as HTMLAudioElement;
      let errorMessage = "Failed to play radio station.";
      
      if (audio.error) {
        switch (audio.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Playback was aborted.";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Network error. Please check your internet connection.";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Audio format not supported.";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Radio stream not available.";
            break;
          default:
            errorMessage = `Audio error: ${audio.error.message}`;
        }
      }
      
      toast({
        title: "Radio Error",
        description: errorMessage,
        variant: "destructive"
      });
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [globalRadio]);

  // Update audio properties when global state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !globalRadio) return;

    audio.volume = globalRadio.isMuted ? 0 : globalRadio.volume / 100;
  }, [globalRadio?.volume, globalRadio?.isMuted]);

  // Handle play/pause based on global state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !globalRadio?.currentStation) return;

    if (globalRadio.isPlaying) {
      // Only play if not already playing
      if (audio.paused) {
        audio.play().catch(error => {
          console.error('Global radio play error:', error);
          globalRadio?.updateRadioState({ isPlaying: false });
        });
      }
    } else {
      // Only pause if currently playing
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [globalRadio?.isPlaying, globalRadio?.currentStation]);

  // Handle station changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !globalRadio.currentStation) return;

    // Only update if the station actually changed
    if (audio.src !== globalRadio.currentStation.url) {
      audio.src = globalRadio.currentStation.url;
      audio.crossOrigin = 'anonymous';
      audio.load();
    }
  }, [globalRadio.currentStation]);

  // Auto-show player when radio starts playing
  useEffect(() => {
    if (globalRadio.isPlaying && globalRadio.currentStation) {
      setIsVisible(true);
    }
  }, [globalRadio.isPlaying, globalRadio.currentStation]);

  const handlePlayPause = async () => {
    if (!audioRef.current || !globalRadio.currentStation) return;

    try {
      if (globalRadio.isPlaying) {
        audioRef.current.pause();
        globalRadio.pauseRadio();
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        globalRadio.playRadio(globalRadio.currentStation);
      }
    } catch (error) {
      console.error('Play/pause error:', error);
      setIsLoading(false);
      toast({
        title: "Playback Error",
        description: "Failed to play radio. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleVolumeChange = (value: number[]) => {
    globalRadio?.setVolume(value[0]);
  };

  const toggleMute = () => {
    globalRadio?.toggleMute();
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!globalRadio?.currentStation || !isVisible) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 left-0 right-0 z-[60] shadow-lg bg-card/95 backdrop-blur-lg border-border border-t">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Quran Radio</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Track Info */}
        <div className="p-2 bg-muted/30 rounded-lg">
          <p className="text-sm font-medium truncate">{globalRadio?.currentTrackInfo || ''}</p>
          <p className="text-xs text-muted-foreground">Live Quran Recitation</p>
        </div>

        {/* Audio Controls */}
        <div className="space-y-3">
          {/* Play/Pause Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handlePlayPause}
              disabled={isLoading}
              className="w-20 h-20 rounded-full"
            >
              {isLoading ? (
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              ) : globalRadio?.isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleMute}>
                {globalRadio?.isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[globalRadio?.volume || 0]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-10">{globalRadio?.volume || 0}%</span>
            </div>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          preload="none"
          crossOrigin="anonymous"
        />
      </div>
    </Card>
  );
}
