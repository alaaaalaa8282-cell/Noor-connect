import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useGlobalRadio, getGlobalAudioRef, setGlobalAudioRef } from "@/lib/global-radio";
import { radioStations } from "@/data/radio-stations";

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

  // Protection refs
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const isTransitioning = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Media Session API - for lock screen controls and background stability
  useEffect(() => {
    if (!('mediaSession' in navigator) || !globalRadio.currentStation) return;

    try {
      const station = globalRadio.currentStation;
      const stationData = radioStations.find(s => s.id === station.id);
      const artworkUrl = stationData?.img || '/icon-192x192.png';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: 'Quran Reciter',
        album: 'Noor Connect Radio',
        artwork: [
          { src: artworkUrl, sizes: '96x96', type: 'image/png' },
          { src: artworkUrl, sizes: '128x128', type: 'image/png' },
          { src: artworkUrl, sizes: '192x192', type: 'image/png' },
          { src: artworkUrl, sizes: '256x256', type: 'image/png' },
          { src: artworkUrl, sizes: '384x384', type: 'image/png' },
          { src: artworkUrl, sizes: '512x512', type: 'image/png' },
        ]
      });

      const updatePlaybackState = () => {
        if ('playbackState' in navigator.mediaSession) {
          navigator.mediaSession.playbackState = globalRadio.isPlaying ? 'playing' : 'paused';
        }
      };

      updatePlaybackState();

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
  }, [globalRadio.currentStation, globalRadio.isPlaying]);

  // Handle audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlaying = () => {
      isTransitioning.current = false;
      globalRadio.updateRadioState({ isPlaying: true, sessionStartTime: Date.now() });
      setIsLoading(false);
    };

    const handlePause = () => {
      isTransitioning.current = false;

      // Calculate additional time before updating state
      const additionalTime = globalRadio.sessionStartTime
        ? Math.floor((Date.now() - globalRadio.sessionStartTime) / 1000)
        : 0;

      globalRadio.updateRadioState({
        isPlaying: false,
        sessionStartTime: null,
        accumulatedTime: globalRadio.accumulatedTime + additionalTime
      });
      setIsLoading(false);
    };

    const handleEnded = () => {
      isTransitioning.current = false;
      globalRadio.updateRadioState({ isPlaying: false });
    };

    const handleError = (e: Event) => {
      isTransitioning.current = false;
      const audioElem = e.target as HTMLAudioElement;
      console.error('Global radio error:', audioElem.error);

      globalRadio.updateRadioState({ isPlaying: false });
      setIsLoading(false);

      let errorMessage = "Failed to play radio station.";
      if (audioElem.error) {
        switch (audioElem.error.code) {
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
        }
      }

      // Only show toast if it's not an abort error and we were trying to play
      if (audioElem.error?.code !== MediaError.MEDIA_ERR_ABORTED) {
        toast({
          title: "Radio Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
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

  // Integrated Player Controller (Handles station changes and play/pause intents)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !globalRadio.currentStation) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      // 1. Handle Station Change
      if (audio.src !== globalRadio.currentStation!.url) {
        if (isTransitioning.current) {
          // Retry later if transitioning
          debounceTimerRef.current = setTimeout(() => {
            if (globalRadio.currentStation && audio.src !== globalRadio.currentStation.url) {
              globalRadio.updateRadioState({ isPlaying: false });
            }
          }, 200);
          return;
        }

        try {
          isTransitioning.current = true;
          audio.pause();
          audio.src = globalRadio.currentStation!.url;
          audio.load(); // Explicit load as requested

          if (globalRadio.isPlaying) {
            const promise = audio.play();
            playPromiseRef.current = promise;
            await promise;
          }
        } catch (e: any) {
          if (e.name !== 'AbortError') console.error('Station change play error:', e);
        } finally {
          isTransitioning.current = false;
          playPromiseRef.current = null;
        }
        return;
      }

      // 2. Handle Play/Pause Sync
      if (isTransitioning.current) return;

      try {
        if (globalRadio.isPlaying && audio.paused) {
          isTransitioning.current = true;
          const promise = audio.play();
          playPromiseRef.current = promise;
          await promise;
        } else if (!globalRadio.isPlaying && !audio.paused) {
          audio.pause();
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Remote sync error:', error);
        }
      } finally {
        isTransitioning.current = false;
        playPromiseRef.current = null;
      }
    }, 200);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [globalRadio.currentStation?.url, globalRadio.isPlaying]);

  // Auto-show player when radio starts playing
  useEffect(() => {
    if (globalRadio.isPlaying && globalRadio.currentStation) {
      setIsVisible(true);
    }
  }, [globalRadio.isPlaying, globalRadio.currentStation]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !globalRadio.currentStation || isTransitioning.current) return;

    try {
      isTransitioning.current = true;
      if (globalRadio.isPlaying) {
        audio.pause();
        // UI state updates via handlePause listener
      } else {
        setIsLoading(true);
        const promise = audio.play();
        playPromiseRef.current = promise;
        await promise;
        // UI state updates via handlePlaying listener
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Manual play/pause error:', error);
        toast({
          title: "Playback Error",
          description: "Failed to toggle radio. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      isTransitioning.current = false;
      playPromiseRef.current = null;
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
        preload="auto"
        playsInline
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
