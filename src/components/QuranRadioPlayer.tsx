import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, Loader2, RefreshCw, Globe, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { quranRadio, type RadioStation } from "@/lib/quran-radio";

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

  // Setup audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume / 100;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      toast({
        title: "Radio Error",
        description: "Failed to play radio station. Please try another station.",
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
  }, [volume, isMuted, toast]);

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
      } else {
        setIsLoading(true);
        
        // Set the radio stream URL
        audioRef.current.src = selectedStation.url;
        audioRef.current.load();
        
        await audioRef.current.play();
        setIsPlaying(true);
        setCurrentTrackInfo(selectedStation.name);
        
        toast({
          title: "Radio Playing",
          description: `Now playing: ${selectedStation.name}`,
        });
      }
    } catch (error) {
      console.error('Play/pause error:', error);
      setIsLoading(false);
      toast({
        title: "Playback Error",
        description: "Failed to play radio. Please check your internet connection.",
        variant: "destructive"
      });
    }
  };

  const handleStationChange = (stationId: string) => {
    const station = stations.find(s => s.id.toString() === stationId);
    if (station) {
      setSelectedStation(station);
      setIsPlaying(false);
      setCurrentTrackInfo('');
      
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
            <Select value={selectedStation?.id.toString()} onValueChange={handleStationChange}>
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
