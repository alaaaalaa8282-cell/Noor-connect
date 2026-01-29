import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Radio, Play, Headphones, Wifi, WifiOff, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { radioStations, type RadioStation } from "@/data/radio-stations";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    loadStations();
    
    // Cleanup on unmount
    return () => {
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
    
    // IMPORTANT: Don't reset src to window.location
    // Keep the original stream URL for debugging
    
    setIsPlaying(false);
    toast({
      title: "Stream Error",
      description: `Failed to play ${currentStation?.name}. Try another station.`,
      variant: "destructive"
    });
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

      // Create new audio element (fresh instance)
      const audio = new Audio();
      audioRef.current = audio;
      
      // Set new source from hardcoded data
      audio.src = streamUrl;
      audio.preload = 'none';
      audio.crossOrigin = 'anonymous';
      
      // Add event listeners
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('error', handleError);
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('ended', handleEnded);
      
      // Update state
      setCurrentStation(station);
      setIsPlaying(false);
      
      // Attempt to play with proper error handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Play failed:', error);
          setIsPlaying(false);
          toast({
            title: "Play Failed",
            description: `Could not play ${station.name}. Try another station.`,
            variant: "destructive"
          });
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
          console.error('Play failed:', error);
          toast({
            title: "Play Failed",
            description: "Could not resume playback.",
            variant: "destructive"
          });
        });
      }
    } else {
      // Pause if playing
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Quran Radio</h1>
            <p className="text-xs text-muted-foreground">Live Quran recitation 24/7</p>
          </div>
        </div>

        {/* Current Playing Status */}
        {currentStation && (
          <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Radio className={`w-6 h-6 text-primary ${isPlaying ? 'animate-pulse' : ''}`} />
                <h3 className="text-lg font-semibold">
                  {isPlaying ? 'Now Playing' : 'Selected Station'}
                </h3>
              </div>
              <p className="text-sm font-medium">{currentStation.name}</p>
              <p className="text-xs text-muted-foreground">
                {isPlaying ? 'Live Quran Recitation' : 'Click play to start streaming'}
              </p>
              
              {/* Audio Controls */}
              <div className="flex items-center justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePlayPause}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      Play
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleStopRadio}
                >
                  Stop
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Features */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="font-medium text-sm">Multi-Language</h3>
                <p className="text-xs text-muted-foreground">Stations in 20+ languages</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Headphones className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="font-medium text-sm">High Quality</h3>
                <p className="text-xs text-muted-foreground">128kbps streaming</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Popular Stations */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Popular Stations</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {popularStations.map((station) => (
                <Card 
                  key={station.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleStationSelect(station)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src={station.img} 
                          alt={station.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to radio icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
                                </svg>
                              </div>
                            `;
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{station.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Islamic Radio</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* All Stations */}
        {allStations.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">All Stations ({allStations.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allStations.slice(0, 20).map((station) => (
                <Card 
                  key={station.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleStationSelect(station)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src={station.img} 
                          alt={station.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to radio icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
                                </svg>
                              </div>
                            `;
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{station.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Islamic Radio</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Card className="p-4 bg-muted/30">
          <h3 className="font-medium text-sm mb-2">How to Use</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Click on any station to start playing</li>
            <li>• Radio continues playing in background</li>
            <li>• Use the global player at the bottom for controls</li>
          </ul>
        </Card>

        {/* Network Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Connected</span>
            </div>
            <span className="text-xs text-muted-foreground">Ready for streaming</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QuranRadio;
