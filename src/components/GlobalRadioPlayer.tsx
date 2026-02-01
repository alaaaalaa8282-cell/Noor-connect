import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useGlobalRadio, getGlobalAudioRef, setGlobalAudioRef } from "@/lib/global-radio";

// Helper to format seconds to MM:SS or HH:MM:SS
const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function GlobalRadioPlayer() {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const globalRadio = useGlobalRadio();
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [displayDuration, setDisplayDuration] = useState(0);

  // Initialize global audio reference
  useEffect(() => {
    setGlobalAudioRef(audioRef.current);
  }, []);

  // Listening timer - uses Date.now() delta for accuracy even when backgrounded
  useEffect(() => {
    if (!globalRadio.isPlaying || !globalRadio.sessionStartTime) {
      // When paused, just show accumulated time
      setDisplayDuration(globalRadio.accumulatedTime);
      return;
    }

    const updateTimer = () => {
      const currentSessionTime = Math.floor((Date.now() - globalRadio.sessionStartTime!) / 1000);
      setDisplayDuration(globalRadio.accumulatedTime + currentSessionTime);
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [globalRadio.isPlaying, globalRadio.sessionStartTime, globalRadio.accumulatedTime]);

  // Media Session API - for lock screen controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !globalRadio.currentStation) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: globalRadio.currentStation.name,
        artist: 'Noor Connect',
        album: 'Quran Radio',
      });

      navigator.mediaSession.setActionHandler('play', () => {
        handlePlayPause();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        handlePlayPause();
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        globalRadio.stopRadio();
        setIsVisible(false);
      });
    } catch (error) {
      console.warn('Media Session API setup failed:', error);
    }

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [globalRadio.currentStation]);

  // Handle audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      globalRadio.updateRadioState({ isPlaying: true, sessionStartTime: Date.now() });
    };

    const handlePause = () => {
      // Calculate additional time before updating state
      const additionalTime = globalRadio.sessionStartTime
        ? Math.floor((Date.now() - globalRadio.sessionStartTime) / 1000)
        : 0;
      globalRadio.updateRadioState({
        isPlaying: false,
        sessionStartTime: null,
        accumulatedTime: globalRadio.accumulatedTime + additionalTime
      });
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
      if (audio.paused) {
        audio.play().catch(error => {
          console.error('Global radio play error:', error);
          globalRadio?.updateRadioState({ isPlaying: false });
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [globalRadio?.isPlaying, globalRadio?.currentStation]);

  // Handle station changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !globalRadio.currentStation) return;

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
    if (audioRef.current) {
      audioRef.current.pause();
    }
    globalRadio?.stopRadio();
    setIsVisible(false);
  };

  // Always render audio element, but conditionally show UI
  return (
    <>
      {/* Hidden Audio Element - ALWAYS rendered */}
      <audio
        ref={audioRef}
        preload="none"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />

      {/* Mini Player UI - only shown when visible and station selected */}
      {globalRadio?.currentStation && isVisible && (
        <Card className="fixed bottom-20 left-0 right-0 z-40 shadow-lg bg-card/95 backdrop-blur-lg border-border border-t">
          <div className="p-3">
            {/* Compact Header with Station Info and Timer */}
            <div className="flex items-center gap-3">
              {/* Radio Icon & Station Info */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Radio className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{globalRadio?.currentTrackInfo || 'Unknown Station'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono">{formatDuration(displayDuration)}</span>
                    <span className="text-primary">•</span>
                    <span>{globalRadio.isPlaying ? 'Playing' : 'Paused'}</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                {/* Play/Pause Button */}
                <Button
                  size="icon"
                  onClick={handlePlayPause}
                  disabled={isLoading}
                  className="rounded-full w-10 h-10"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                  ) : globalRadio?.isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </Button>

                {/* Mute Toggle */}
                <Button variant="ghost" size="icon" onClick={toggleMute} className="w-8 h-8">
                  {globalRadio?.isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>

                {/* Close */}
                <Button variant="ghost" size="icon" onClick={handleClose} className="w-8 h-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Volume Slider */}
            <div className="mt-2 flex items-center gap-2">
              <Slider
                value={[globalRadio?.volume || 0]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8 text-right">{globalRadio?.volume || 0}%</span>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

