import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Radio, Play, Globe, Headphones, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalRadio } from "@/lib/global-radio";
import { quranRadio, type RadioStation } from "@/lib/quran-radio";

const QuranRadio = () => {
  const navigate = useNavigate();
  const globalRadio = useGlobalRadio();
  const [isLoading, setIsLoading] = useState(true);
  const [popularStations, setPopularStations] = useState<RadioStation[]>([]);

  useEffect(() => {
    loadPopularStations();
  }, []);

  const loadPopularStations = async () => {
    try {
      const stations = quranRadio.getPopularStations();
      setPopularStations(stations);
    } catch (error) {
      console.error('Failed to load popular stations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStationSelect = (station: RadioStation) => {
    // Play the selected station using global radio
    globalRadio.playRadio(station);
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
        {globalRadio.currentStation && (
          <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Radio className="w-6 h-6 text-primary animate-pulse" />
                <h3 className="text-lg font-semibold">Now Playing</h3>
              </div>
              <p className="text-sm font-medium">{globalRadio.currentTrackInfo}</p>
              <p className="text-xs text-muted-foreground">Live Quran Recitation</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => globalRadio.pauseRadio()}
              >
                Pause
              </Button>
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
                        <p className="text-xs text-muted-foreground">Live Stream</p>
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <Card className="p-4 bg-muted/30">
          <h3 className="font-medium text-sm mb-2">How to Use</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Click "Open Radio Player" to launch the player</li>
            <li>• Select your preferred language and station</li>
            <li>• Adjust volume using the slider</li>
            <li>• Radio continues playing in background</li>
            <li>• Use system media controls for playback</li>
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
