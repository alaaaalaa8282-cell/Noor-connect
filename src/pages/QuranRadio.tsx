import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Radio, Play, Pause, Headphones, Wifi, WifiOff, Globe, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { radioStations, type RadioStation } from "@/data/radio-stations";
import { useToast } from "@/hooks/use-toast";
import { androidAudioHelper } from "@/lib/android-audio-helper";
import "@/lib/media-session-test";

const QuranRadio = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [popularStations, setPopularStations] = useState<RadioStation[]>([]);
  const [allStations, setAllStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Single audio instance using useRef
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSessionSetupRef = useRef(false);

  // Setup Media Session API for lock screen controls
  const setupMediaSession = (station: RadioStation) => {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: 'Noor Connect',
        album: 'Quran Radio',
        artwork: [
          {
            src: station.img,
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: station.img,
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: station.img,
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: station.img,
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: station.img,
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: station.img,
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      });

      // Action handlers for lock screen controls
      navigator.mediaSession.setActionHandler('play', () => {
        handlePlayPause();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        handlePlayPause();
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        handleStopRadio();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        // Go to previous station
        const currentIndex = allStations.findIndex(s => s.id === station.id);
        if (currentIndex > 0) {
          handleStationSelect(allStations[currentIndex - 1]);
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        // Go to next station
        const currentIndex = allStations.findIndex(s => s.id === station.id);
        if (currentIndex < allStations.length - 1) {
          handleStationSelect(allStations[currentIndex + 1]);
        }
      });

      mediaSessionSetupRef.current = true;
    } catch (error) {
      console.warn('Media Session API setup failed:', error);
    }
  };

  // Cleanup Media Session
  const cleanupMediaSession = () => {
    if (!('mediaSession' in navigator) || !mediaSessionSetupRef.current) return;

    try {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('stop', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      mediaSessionSetupRef.current = false;
    } catch (error) {
      console.warn('Media Session cleanup failed:', error);
    }
  };

  useEffect(() => {
    loadStations();
    
    // Check for Android audio issues and show recommendation if needed
    const recommendation = androidAudioHelper.getCapacitorPluginRecommendation();
    if (recommendation && process.env.NODE_ENV === 'development') {
      console.log(recommendation);
    }
    
    // Cleanup on unmount
    return () => {
      cleanupMediaSession();
      androidAudioHelper.cleanup();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('play', handlePlay);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.removeEventListener('loadeddata', handleLoadedData);
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const loadStations = async () => {
    try {
      setIsLoading(true);
      
      // Use hardcoded data instead of API
      // First 8 stations as popular stations
      const popular = radioStations.slice(0, 8);
      setPopularStations(popular);
      
      // All stations
      setAllStations(radioStations);
      
    } catch (error) {
      console.error('Failed to load stations:', error);
      toast({
        title: "Error Loading Stations",
        description: "Failed to load radio stations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Event handlers with proper references
  const handlePlay = () => {
    console.log('Audio playing:', currentStation?.name);
    setIsPlaying(true);
  };
  
  const handleError = (e: Event) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    console.error('Audio Error:', {
      error: audio.error,
      src: audio.src,
      networkState: audio.networkState,
      readyState: audio.readyState
    });
    
    // Only show error toast if it's a critical error that actually stops playback
    // Don't show errors for minor network issues if audio might still play
    if (audio.error && audio.error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      setIsPlaying(false);
      toast({
        title: "Stream Not Supported",
        description: `This station format is not supported. Try another station.`,
        variant: "destructive"
      });
    } else if (audio.error && audio.error.code === MediaError.MEDIA_ERR_ABORTED) {
      // Don't show error for aborted playback (user initiated)
      setIsPlaying(false);
    } else {
      // For other errors, just log but don't show toast since audio might still work
      console.warn('Non-critical audio error, playback may continue');
    }
  };
  
  const handleLoadedData = () => {
    console.log('Audio data loaded for:', currentStation?.name);
  };
  
  const handleCanPlay = () => {
    console.log('Audio can play:', currentStation?.name);
  };
  
  const handleEnded = () => {
    console.log('Audio ended:', currentStation?.name);
    setIsPlaying(false);
  };

  const handleStationSelect = (station: RadioStation) => {
    try {
      // Use the url field from hardcoded data
      const streamUrl = station.url;
      
      // Validate stream URL
      if (!streamUrl || streamUrl.includes(window.location.hostname)) {
        console.error('Invalid stream URL:', streamUrl);
        toast({
          title: "Invalid Stream",
          description: "This station has an invalid stream URL.",
          variant: "destructive"
        });
        return;
      }

      // Setup Media Session for lock screen controls
      setupMediaSession(station);

      // IMPORTANT: Stop current audio completely before starting new one
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = ''; // Clear source to stop completely
        // Remove old event listeners
        audioRef.current.removeEventListener('play', handlePlay);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.removeEventListener('loadeddata', handleLoadedData);
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.removeEventListener('ended', handleEnded);
      }

      // Create or reuse audio element for better background performance
      let audio = audioRef.current;
      if (!audio) {
        audio = new Audio();
        audioRef.current = audio;
        
        // Configure audio for background playback
        audio.preload = 'none';
        audio.crossOrigin = 'anonymous';
        
        // Apply Android-specific optimizations
        androidAudioHelper.setupAndroidOptimizations(audio);
        
        // Request audio focus for better mobile experience
        if ('audioFocus' in navigator) {
          (navigator as any).audioFocus.request();
        }
      }
      
      // Set new source
      audio.src = streamUrl;
      
      // Add event listeners
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('error', handleError);
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('ended', handleEnded);
      
      // Update state
      setCurrentStation(station);
      setIsPlaying(false);
      
      // Set a timeout to check if audio actually starts playing
      const playbackTimeout = setTimeout(() => {
        if (audioRef.current && !isPlaying && audioRef.current.paused) {
          console.warn('Audio did not start playing within 5 seconds');
          // Only show error if audio is actually not playing
          toast({
            title: "Playback Delay",
            description: `Taking longer than expected to load ${station.name}. The station may still start playing.`,
            variant: "default"
          });
        }
      }, 5000);
      
      // Attempt to play with proper error handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            clearTimeout(playbackTimeout); // Clear timeout if play succeeds
          })
          .catch(error => {
            clearTimeout(playbackTimeout); // Clear timeout on error too
            console.error('Play promise rejected:', error);
            // Don't show error toast immediately - wait to see if audio actually plays
            // The audio might still play even if the promise rejects
            // We'll handle actual errors in the 'error' event listener
          });
      }
      
      toast({
        title: "Station Selected",
        description: `Loading: ${station.name}`,
      });
    } catch (error) {
      console.error('Failed to play station:', error);
      setIsPlaying(false);
      toast({
        title: "Stream Unreachable",
        description: "Try another station.",
        variant: "destructive"
      });
    }
  };

  const handleStopRadio = () => {
    // Cleanup Media Session
    cleanupMediaSession();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = ''; // Clear the source to fully stop
      setIsPlaying(false);
      setCurrentStation(null);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !currentStation) return;
    
    if (audioRef.current.paused) {
      // Play if paused
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Play promise rejected:', error);
          // Don't show error toast immediately - wait to see if audio actually plays
          // The audio might still play even if the promise rejects
          // We'll handle actual errors in the 'error' event listener
        });
      }
    } else {
      // Pause if playing
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Quran Radio</h1>
              <p className="text-sm text-muted-foreground">Live Quran recitation 24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Popular Stations */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            Popular Reciters
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularStations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                isPlaying={currentStation?.id === station.id && isPlaying}
                onSelect={() => handleStationSelect(station)}
              />
            ))}
          </div>
        </div>

        {/* All Stations */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            All Stations ({allStations.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allStations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                isPlaying={currentStation?.id === station.id && isPlaying}
                onSelect={() => handleStationSelect(station)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Player Bar */}
      {currentStation && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Station Thumbnail */}
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={currentStation.img} 
                  alt={currentStation.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Station Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{currentStation.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isPlaying ? 'Now Playing' : 'Paused'}
                </p>
              </div>
              
              {/* Play/Pause Button */}
              <Button
                size="lg"
                onClick={handlePlayPause}
                className="rounded-full w-12 h-12 p-0"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              
              {/* Stop Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopRadio}
                className="rounded-full"
              >
                Stop
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Station Card Component
interface StationCardProps {
  station: RadioStation;
  isPlaying: boolean;
  onSelect: () => void;
}

const StationCard: React.FC<StationCardProps> = ({ station, isPlaying, onSelect }) => {
  return (
    <Card 
      className={`group relative overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${
        isPlaying 
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse' 
          : 'hover:scale-105'
      }`}
      onClick={onSelect}
    >
      {/* Station Image */}
      <div className="aspect-square relative overflow-hidden">
        <img 
          src={station.img} 
          alt={station.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.innerHTML = `
              <div class="w-full h-full bg-primary/10 flex items-center justify-center">
                <svg class="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
                </svg>
              </div>
            `;
          }}
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-primary ml-0.5" />
          </div>
        </div>
        
        {/* Now Playing Indicator */}
        {isPlaying && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-current animate-pulse"></div>
                <div className="w-1 h-3 bg-current animate-pulse delay-75"></div>
                <div className="w-1 h-3 bg-current animate-pulse delay-150"></div>
              </div>
              Playing
            </div>
          </div>
        )}
      </div>
      
      {/* Station Name */}
      <div className="p-3 text-center">
        <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{station.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">Islamic Radio</p>
      </div>
    </Card>
  );
};

export default QuranRadio;
