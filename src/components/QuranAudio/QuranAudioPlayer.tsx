import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, SkipBack, SkipForward, Volume2, Download, Loader2 } from 'lucide-react';
import { QURAN_AUDIO_API, Reciter, SurahAudio } from '@/lib/quran-audio';
import { useToast } from '@/hooks/use-toast';

interface QuranAudioPlayerProps {
  className?: string;
}

export function QuranAudioPlayer({ className }: QuranAudioPlayerProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // State
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [currentAudio, setCurrentAudio] = useState<SurahAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [surahList, setSurahList] = useState<any[]>([]);
  const [reciterList, setReciterList] = useState<Reciter[]>([]);
  
  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Load initial data
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Load reciters and Surahs in parallel
      const [reciterResponse, surahResponse] = await Promise.all([
        QURAN_AUDIO_API.getReciters(),
        QURAN_AUDIO_API.getSurahList()
      ]);
      
      if (reciterResponse.data) {
        setReciterList(reciterResponse.data);
        // Set default reciter (Mishary Rashid Alafasy - ID: 5)
        const defaultReciter = reciterResponse.data.find((r: Reciter) => r.id === 5) || reciterResponse.data[0];
        setSelectedReciter(defaultReciter);
      }
      
      if (surahResponse.data) {
        setSurahList(surahResponse.data);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to load Quran data',
        variant: 'destructive'
      });
    }
  };
  
  // Load Surah audio
  const loadSurahAudio = async (surahNumber: number, recitationId: number) => {
    try {
      setIsLoading(true);
      
      const response = await QURAN_AUDIO_API.getSurahAudio(surahNumber, recitationId);
      
      if (response.data && response.data.recitation) {
        setCurrentAudio(response.data);
        
        // Set audio source with crossOrigin for CORS
        if (audioRef.current) {
          audioRef.current.crossOrigin = 'anonymous';
          audioRef.current.src = response.data.recitation.audioUrl;
          audioRef.current.load();
        }
      }
    } catch (error) {
      console.error('Failed to load Surah audio:', error);
      setIsLoading(false);
      toast({
        title: 'Audio Loading Issue',
        description: 'Trying to load audio... This may take a moment.',
        variant: 'default'
      });
    }
  };
  
  // Handle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current || !currentAudio || isLoading) return;
    
    // Check if audio is ready to play
    if (audioRef.current.readyState < 2) { // HAVE_CURRENT_DATA
      toast({
        title: 'Loading',
        description: 'Audio is still loading, please wait...',
        variant: 'default'
      });
      return;
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('Play failed:', error);
          setIsPlaying(false);
          toast({
            title: 'Playback Error',
            description: 'Failed to play audio. Please try again.',
            variant: 'destructive'
          });
        });
    }
  };
  
  // Navigation functions
  const playPreviousSurah = () => {
    if (selectedSurah > 1) {
      handleSurahChange((selectedSurah - 1).toString());
    }
  };
  
  const playNextSurah = () => {
    if (selectedSurah < 114) {
      const nextSurah = selectedSurah + 1;
      setSelectedSurah(nextSurah);
      if (selectedReciter) {
        loadSurahAudio(nextSurah, selectedReciter.recitationId);
      }
    }
  };
  
  // Handle download
  const handleDownload = () => {
    if (currentAudio && currentAudio.recitation) {
      const link = document.createElement('a');
      link.href = currentAudio.recitation.audioUrl;
      link.download = `surah-${selectedSurah}-${selectedReciter?.name || 'reciter'}.mp3`;
      link.target = '_blank'; // Add target blank to handle CORS
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-play next Surah
      if (selectedSurah < 114) {
        playNextSurah();
      }
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    const handleLoadStart = () => {
      setIsLoading(true);
    };
    
    const handleCanPlay = () => {
      setIsLoading(false);
    };
    
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsLoading(false);
      setIsPlaying(false);
      
      // Provide helpful error message
      const audio = e.target as HTMLAudioElement;
      if (audio.error) {
        console.error('Audio error code:', audio.error.code);
        toast({
          title: 'Audio Loading Error',
          description: 'Unable to load audio. You can try downloading the file directly.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Audio Error',
          description: 'Failed to load audio. Please try a different Surah or reciter.',
          variant: 'destructive'
        });
      }
    };
    
    // Add all event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    
    return () => {
      // Remove all event listeners
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [selectedSurah]);
  
  // Load initial Surah
  useEffect(() => {
    if (selectedReciter) {
      loadSurahAudio(1, selectedReciter.recitationId);
    }
  }, [selectedReciter]);
  
  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Get current Surah info
  const getCurrentSurahInfo = () => {
    return surahList.find(surah => surah.sequence === selectedSurah);
  };
  
  const currentSurahInfo = getCurrentSurahInfo();
  
  // Handle reciter change
  const handleReciterChange = (reciterValue: string) => {
    const recitationId = parseInt(reciterValue);
    const reciter = reciterList.find(r => r.id === recitationId);
    if (reciter) {
      setSelectedReciter(reciter);
      loadSurahAudio(selectedSurah, recitationId);
    }
  };
  
  // Handle Surah change
  const handleSurahChange = (surahValue: string) => {
    const surahNumber = parseInt(surahValue);
    setSelectedSurah(surahNumber);
    if (selectedReciter) {
      loadSurahAudio(surahNumber, selectedReciter.recitationId);
    }
  };
  
  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <span className="text-2xl">📖</span>
          Quran Audio Player
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Reciter and Surah Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reciter</label>
            <Select value={selectedReciter?.id?.toString() || ""} onValueChange={handleReciterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select reciter" />
              </SelectTrigger>
              <SelectContent>
                {reciterList.map((reciter) => (
                  <SelectItem key={reciter.id} value={reciter.id.toString()}>
                    <div className="flex flex-col">
                      <span>{reciter.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Surah</label>
            <Select value={selectedSurah.toString()} onValueChange={handleSurahChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Surah" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {surahList.map((surah) => (
                  <SelectItem key={surah.sequence} value={surah.sequence.toString()}>
                    <div className="flex flex-col">
                      <span>{surah.name?.latin?.short || surah.name?.latin?.long}</span>
                      <span className="text-xs text-muted-foreground">
                        {surah.ayahCount} verses • {surah.type?.latin}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Current Surah Info */}
        {currentAudio && (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <h3 className="text-lg font-semibold">
              {currentSurahInfo?.name?.latin?.short || `Surah ${selectedSurah}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentSurahInfo?.name?.arabic?.short || ''} • {currentAudio.ayahCount} verses
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {currentAudio.type?.latin}
            </p>
            {currentAudio.recitation && (
              <div className="mt-2 text-xs text-muted-foreground">
                <p>Duration: {Math.floor(currentAudio.recitation.duration / 60)}:{(currentAudio.recitation.duration % 60).toString().padStart(2, '0')}</p>
                <p>Size: {(currentAudio.recitation.fileSize / (1024 * 1024)).toFixed(1)} MB • {currentAudio.recitation.format}</p>
                <p>Reciter: {currentAudio.recitation.reciterName}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Audio Player */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              />
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={playPreviousSurah}
              disabled={selectedSurah <= 1 || isLoading}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              size="lg"
              onClick={togglePlayPause}
              disabled={!currentAudio || isLoading}
              className="w-16 h-16 rounded-full"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={playNextSurah}
              disabled={selectedSurah >= 114 || isLoading}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Additional Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  if (audioRef.current) {
                    audioRef.current.volume = newVolume;
                  }
                }}
                className="w-20"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!currentAudio}
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
        
        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </CardContent>
    </Card>
  );
}
