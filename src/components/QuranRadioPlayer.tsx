import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, Loader2, RefreshCw, Globe, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { quranRadio, type RadioStation } from "@/lib/quran-radio";
import { audioNotificationService, type AudioNotificationData } from "@/lib/audio-notifications";
import { NotificationContentGenerator } from "@/lib/notification-content";

interface QuranRadioPlayerProps {
  onClose: () => void;
}

const LANGUAGES = [
  { code: 'ar', name: 'العربية' },
  { code: 'eng', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'ru', name: 'Русский' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'cn', name: '中文' },
  { code: 'ur', name: 'اردو' },
  { code: 'fa', name: 'فارسی' },
  { code: 'id', name: 'Bahasa Indonesia' }
];

export function QuranRadioPlayer({ onClose }: QuranRadioPlayerProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ar');
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackInfo, setCurrentTrackInfo] = useState<string>('');
  const [stationValue, setStationValue] = useState<string>(''); // Controlled value for Select

  // Setup notification service on mount
  useEffect(() => {
    // Request notification permission for radio playback
    audioNotificationService.requestPermission().then(granted => {
      if (granted) {
        console.log('Radio notifications permission granted');
      } else {
        console.warn('Radio notifications permission denied');
      }
    });

    // Cleanup notifications on unmount
    return () => {
      audioNotificationService.closeNotification();
    };
  }, []);

  // Load radio stations
  useEffect(() => {
    loadRadioStations();
  }, [selectedLanguage]);

  const loadRadioStations = async () => {
    setIsLoadingStations(true);
    setError(null);
    
    try {
      const radioStations = await quranRadio.getRadioStations(selectedLanguage);
      if (radioStations.length === 0) {
        // Fallback to popular stations if API fails
        const popularStations = quranRadio.getPopularStations();
        setStations(popularStations);
        setError('Using popular stations - API unavailable');
      } else {
        setStations(radioStations);
      }
    } catch (error) {
      console.error('Failed to load radio stations:', error);
      // Fallback to popular stations
      const popularStations = quranRadio.getPopularStations();
      setStations(popularStations);
      setError('Using popular stations - API unavailable');
    } finally {
      setIsLoadingStations(false);
    }
  };

  // Setup audio element with enhanced background support and notifications
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume / 100;

    const handlePlay = () => {
      setIsPlaying(true);
      // Show notification when radio starts playing
      if (selectedStation) {
        audioNotificationService.showNotification({
          type: 'quran-radio',
          title: selectedStation.name,
          artist: 'Quran Radio Live',
          album: 'Noor Connect Radio',
          isPlaying: true
        });
      }
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      // Update notification when paused
      audioNotificationService.updateNotification({ isPlaying: false });
    };
    
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      setIsLoading(false);
      audioNotificationService.closeNotification();
      
      // Get more detailed error information
      const audio = e.target as HTMLAudioElement;
      let errorMessage = "Failed to play radio station. Please try another station.";
      
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
            errorMessage = "Radio stream not available or blocked by browser.";
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
    const handleEnded = () => {
      setIsPlaying(false);
      audioNotificationService.closeNotification();
    };

    // Enhanced visibility change handler for background playback
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying && audio.paused) {
        console.log('Attempting to resume radio playback in background');
        audio.play().then(() => {
          // Ensure notification is shown when going to background with rich content
          const notificationContent = NotificationContentGenerator.generateQuranRadioContent({
            stationName: selectedStation.name,
            stationLanguage: selectedStation.language || 'Arabic',
            isPlaying: true,
            bitrate: selectedStation.bitrate || '128kbps',
            location: selectedStation.country || 'Global'
          });
          
          audioNotificationService.showNotification({
            type: 'quran-radio',
            title: selectedStation.name,
            artist: 'Quran Radio Live',
            album: 'Noor Connect Radio',
            isPlaying: true
          });
        }).catch(error => {
          console.warn('Failed to resume background radio playback:', error);
        });
      } else if (!document.hidden && !isPlaying) {
        audioNotificationService.closeNotification();
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [volume, isMuted, toast, isPlaying, selectedStation]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handlePlayPause = async () => {
    if (!audioRef.current || !selectedStation) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        // Update notification when paused
        audioNotificationService.updateNotification({ isPlaying: false });
      } else {
        setIsLoading(true);
        
        // Validate stream URL before attempting to play
        if (!quranRadio.isValidRadioUrl(selectedStation.url)) {
          throw new Error('Invalid radio stream URL');
        }
        
        // Set the radio stream URL with proper headers
        audioRef.current.src = selectedStation.url;
        audioRef.current.crossOrigin = 'anonymous';
        
        // Add timeout for loading
        const loadTimeout = setTimeout(() => {
          setIsLoading(false);
          toast({
            title: "Loading Timeout",
            description: "Radio stream is taking too long to load. Please try another station.",
            variant: "destructive"
          });
        }, 10000); // 10 second timeout
        
        audioRef.current.load();
        
        await audioRef.current.play();
        clearTimeout(loadTimeout);
        setIsPlaying(true);
        setCurrentTrackInfo(selectedStation.name);
        
        // Show persistent notification for radio playback with rich content
        const notificationContent = NotificationContentGenerator.generateQuranRadioContent({
          stationName: selectedStation.name,
          stationLanguage: selectedStation.language || 'Arabic',
          isPlaying: true,
          bitrate: selectedStation.bitrate || '128kbps',
          location: selectedStation.country || 'Global'
        });
        
        audioNotificationService.showNotification({
          type: 'quran-radio',
          title: selectedStation.name,
          artist: 'Quran Radio Live',
          album: 'Noor Connect Radio',
          isPlaying: true
        });
        
        toast({
          title: "Radio Playing",
          description: `Now playing: ${selectedStation.name}`,
        });
      }
    } catch (error) {
      console.error('Play/pause error:', error);
      setIsLoading(false);
      
      let errorMessage = "Failed to play radio. Please try another station.";
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = "Radio stream blocked by browser. Please try a different station.";
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = "Radio station not available. Please try another station.";
        } else if (error.message.includes('NotAllowedError')) {
          errorMessage = "Autoplay blocked. Please interact with the page first.";
        }
      }
      
      toast({
        title: "Playback Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleStationChange = (stationId: string) => {
    setStationValue(stationId); // Update controlled value
    const station = stations.find(s => s.id.toString() === stationId);
    if (station) {
      setSelectedStation(station);
      setIsPlaying(false);
      setCurrentTrackInfo('');
      audioNotificationService.closeNotification();
      
      // Reset audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (isMuted && value[0] > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const refreshStations = () => {
    loadRadioStations();
    toast({
      title: "Refreshing Stations",
      description: "Loading latest radio stations...",
    });
  };

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 shadow-lg bg-card/95 backdrop-blur-lg border-border">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Quran Radio</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ×
          </Button>
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refreshStations} disabled={isLoadingStations}>
            <RefreshCw className={`w-4 h-4 ${isLoadingStations ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Station Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Radio Station</label>
          {isLoadingStations ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading stations...</span>
            </div>
          ) : (
            <Select value={stationValue} onValueChange={handleStationChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a radio station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={station.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4" />
                      <span>{station.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {error && (
            <p className="text-xs text-muted-foreground">{error}</p>
          )}
        </div>

        {/* Current Track Info */}
        {currentTrackInfo && (
          <div className="p-2 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium truncate">{currentTrackInfo}</p>
            <p className="text-xs text-muted-foreground">Live Quran Recitation</p>
          </div>
        )}

        {/* Audio Controls */}
        <div className="space-y-3">
          {/* Play/Pause Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handlePlayPause}
              disabled={!selectedStation || isLoading}
              className="w-20 h-20 rounded-full"
            >
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : isPlaying ? (
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
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-10">{volume}%</span>
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
