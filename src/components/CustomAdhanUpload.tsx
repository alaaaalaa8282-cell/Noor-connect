import { useState, useRef, useEffect } from "react";
import { Upload, Play, Pause, Trash2, Check, Music } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import localforage from "localforage";

const CUSTOM_ADHAN_KEY = 'custom-adhan-audio';
const SELECTED_ADHAN_KEY = 'selected-adhan';

interface CustomAdhan {
  id: string;
  name: string;
  data: string; // base64
  addedAt: number;
}

// Store for custom adhan files
const adhanStore = localforage.createInstance({
  name: 'islamic-companion',
  storeName: 'custom-adhans',
  description: 'User uploaded adhan audio files'
});

export function CustomAdhanUpload() {
  const [customAdhans, setCustomAdhans] = useState<CustomAdhan[]>([]);
  const [selectedAdhan, setSelectedAdhan] = useState<string>("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomAdhans();
    const saved = localStorage.getItem(SELECTED_ADHAN_KEY);
    if (saved) setSelectedAdhan(saved);
  }, []);

  const loadCustomAdhans = async () => {
    try {
      const saved = await adhanStore.getItem<CustomAdhan[]>(CUSTOM_ADHAN_KEY);
      if (saved) setCustomAdhans(saved);
    } catch (error) {
      console.error("Error loading custom adhans:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({ title: "Invalid file", description: "Please select an audio file (MP3, WAV, etc.)", variant: "destructive" });
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select a file under 10MB", variant: "destructive" });
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const newAdhan: CustomAdhan = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        data: base64,
        addedAt: Date.now()
      };

      const updated = [...customAdhans, newAdhan];
      await adhanStore.setItem(CUSTOM_ADHAN_KEY, updated);
      setCustomAdhans(updated);
      
      toast({ title: "Adhan uploaded", description: `${newAdhan.name} added to your collection` });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: "Could not save the audio file", variant: "destructive" });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePlay = (adhan: CustomAdhan) => {
    if (playingId === adhan.id) {
      // Stop
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingId(null);
    } else {
      // Play
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const binaryString = atob(adhan.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlayingId(null);
      audioRef.current.play();
      setPlayingId(adhan.id);
      
      // Auto-stop after 15 seconds
      setTimeout(() => {
        if (audioRef.current && playingId === adhan.id) {
          audioRef.current.pause();
          setPlayingId(null);
        }
      }, 15000);
    }
  };

  const handleDelete = async (id: string) => {
    const updated = customAdhans.filter(a => a.id !== id);
    await adhanStore.setItem(CUSTOM_ADHAN_KEY, updated);
    setCustomAdhans(updated);
    
    if (selectedAdhan === id) {
      localStorage.removeItem(SELECTED_ADHAN_KEY);
      setSelectedAdhan("");
    }
    
    toast({ title: "Adhan deleted" });
  };

  const handleSelect = (id: string) => {
    setSelectedAdhan(id);
    localStorage.setItem(SELECTED_ADHAN_KEY, id);
    toast({ title: "Adhan selected", description: "This will play for prayer notifications" });
  };

  // Export function to get custom adhan audio
  const getCustomAdhanUrl = async (id: string): Promise<string | null> => {
    const adhans = await adhanStore.getItem<CustomAdhan[]>(CUSTOM_ADHAN_KEY);
    const adhan = adhans?.find(a => a.id === id);
    if (!adhan) return null;
    
    const binaryString = atob(adhan.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    return URL.createObjectURL(blob);
  };

  // Make getCustomAdhanUrl available globally
  useEffect(() => {
    (window as any).getCustomAdhanUrl = getCustomAdhanUrl;
  }, []);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Custom Adhan</h3>
        </div>
        <input
          type="file"
          accept="audio/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload MP3
        </Button>
      </div>

      {customAdhans.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No custom adhans uploaded. Upload your own MP3 file to use as prayer notification.
        </p>
      ) : (
        <div className="space-y-2">
          {customAdhans.map((adhan) => (
            <div 
              key={adhan.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                selectedAdhan === adhan.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => handlePlay(adhan)}
              >
                {playingId === adhan.id ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{adhan.name}</p>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(adhan.addedAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant={selectedAdhan === adhan.id ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleSelect(adhan.id)}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(adhan.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Selected adhan will play for prayer time notifications. Max file size: 10MB.
      </p>
    </Card>
  );
}

// Export helper function
export async function getSelectedCustomAdhanUrl(): Promise<string | null> {
  const selectedId = localStorage.getItem('selected-adhan');
  if (!selectedId || !selectedId.startsWith('custom-')) return null;
  
  return (window as any).getCustomAdhanUrl?.(selectedId) || null;
}
