import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Radio, Play, Headphones, Wifi, WifiOff, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { radioBrowser, type RadioStation } from "@/lib/radio-browser";
import { useToast } from "@/hooks/use-toast";

const QuranRadio = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [popularStations, setPopularStations] = useState<RadioStation[]>([]);
  const [allStations, setAllStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadStations();
    
    // Cleanup on unmount
    return () => {
      if (audioRef) {
        audioRef.pause();
        audioRef.src = '';
        setAudioRef(null);
      }
    };
  }, []);

  const loadStations = async () => {
    try {
      setIsLoading(true);
      // Load popular stations from Radio Browser API
      const popular = await radioBrowser.getPopularStations();
      setPopularStations(popular);
      
      // Load all Islamic stations (HTTPS only for Vercel)
      const stations = await radioBrowser.getIslamicStations(30);
      setAllStations(stations);
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

  const handleStationSelect = (station: RadioStation) => {
    try {
      // Stop and cleanup current audio if playing
      if (audioRef) {
        audioRef.pause();
        audioRef.removeEventListener('play', () => {});
        audioRef.removeEventListener('error', () => {});
        audioRef.removeEventListener('loadeddata', () => {});
        audioRef.removeEventListener('canplay', () => {});
        audioRef.src = '';
        setAudioRef(null);
      }

      // Clear current station first
      setCurrentStation(null);

      // Use url_resolved for direct streaming
      const streamUrl = station.url_resolved || station.url;
      
      // Validate stream URL is not empty and not our website
      if (!streamUrl || streamUrl.includes(window.location.hostname)) {
        console.error('Invalid stream URL:', streamUrl);
        toast({
          title: "Invalid Stream",
          description: "This station has an invalid stream URL.",
          variant: "destructive"
        });
        return;
      }
      
      // Create new audio element
      const audio = new Audio();
      audio.src = streamUrl;
      audio.preload = 'none';
      audio.crossOrigin = 'anonymous';
      
      // Add event listeners for debugging
      const handlePlay = () => {
        console.log('Attempting to play...', station.name, streamUrl);
      };
      
      const handleError = (e: Event) => {
        console.error('Audio Tag Error:', e);
        console.error('Audio Error Details:', {
          error: audio.error,
          src: audio.src,
          networkState: audio.networkState,
          readyState: audio.readyState
        });
        
        // Don't reset src to window.location - keep the original stream URL for debugging
        toast({
          title: "Stream Error",
          description: `Failed to play ${station.name}. Try another station.`,
          variant: "destructive"
        });
      };
      
      const handleLoadedData = () => {
        console.log('Audio data loaded for:', station.name);
      };
      
      const handleCanPlay = () => {
        console.log('Audio can play:', station.name);
      };
      
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('error', handleError);
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('canplay', handleCanPlay);
      
      // Set the audio reference and current station
      setAudioRef(audio);
      setCurrentStation(station);
      
      // Attempt to play with error handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Play failed:', error);
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
      toast({
        title: "Stream Unreachable",
        description: "Try another station.",
        variant: "destructive"
      });
    }
  };

  const handleStopRadio = () => {
    if (audioRef) {
      audioRef.pause();
      audioRef.removeEventListener('play', () => {});
      audioRef.removeEventListener('error', () => {});
      audioRef.removeEventListener('loadeddata', () => {});
      audioRef.removeEventListener('canplay', () => {});
      audioRef.src = '';
      setAudioRef(null);
      setCurrentStation(null);
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
                <Radio className="w-6 h-6 text-primary animate-pulse" />
                <h3 className="text-lg font-semibold">Now Playing</h3>
              </div>
              <p className="text-sm font-medium">{currentStation.name}</p>
              <p className="text-xs text-muted-foreground">Live Quran Recitation</p>
              
              {/* Native Audio Element */}
              {audioRef && (
                <div className="space-y-2">
                  <audio
                    ref={(el) => {
                      if (el && el !== audioRef) {
                        // Copy event listeners to the new element
                        el.src = audioRef.src;
                        el.addEventListener('play', () => {
                          console.log('Attempting to play...', currentStation.name, audioRef.src);
                        });
                        el.addEventListener('error', (e) => {
                          console.error('Audio Tag Error:', e);
                          console.error('Audio Error Details:', {
                            error: el.error,
                            src: el.src,
                            networkState: el.networkState,
                            readyState: el.readyState
                          });
                        });
                        el.addEventListener('loadeddata', () => {
                          console.log('Audio data loaded for:', currentStation.name);
                        });
                        el.addEventListener('canplay', () => {
                          console.log('Audio can play:', currentStation.name);
                        });
                      }
                    }}
                    controls
                    preload="none"
                    className="w-full max-w-xs mx-auto"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleStopRadio}
                  >
                    Stop
                  </Button>
                </div>
              )}
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
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Radio className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{station.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{station.country}</span>
                          {station.bitrate && (
                            <>
                              <span>•</span>
                              <span>{station.bitrate}kbps</span>
                            </>
                          )}
                          {station.lastcheckok === 1 && (
                            <>
                              <span>•</span>
                              <Wifi className="w-3 h-3 text-green-500" />
                              <span className="text-green-500">Verified</span>
                            </>
                          )}
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
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Radio className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{station.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{station.country}</span>
                          {station.bitrate && (
                            <>
                              <span>•</span>
                              <span>{station.bitrate}kbps</span>
                            </>
                          )}
                          {station.lastcheckok === 1 && (
                            <>
                              <span>•</span>
                              <Wifi className="w-3 h-3 text-green-500" />
                              <span className="text-green-500">Verified</span>
                            </>
                          )}
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
