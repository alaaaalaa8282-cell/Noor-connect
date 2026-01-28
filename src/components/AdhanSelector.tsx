import { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export const ADHAN_OPTIONS = [
  { id: 'adhan-makkah', name: 'Makkah Adhan', url: '/audio/adhan-makkah.mp3' },
  { id: 'adhan-madinah', name: 'Madinah Adhan', url: '/audio/adhan-madinah.mp3' },
  { id: 'adhan-egyptian', name: 'Egyptian Adhan', url: '/audio/adhan-egyptian.mp3' },
  { id: 'adhan-classic', name: 'Classic Adhan', url: '/audio/adhan-classic.mp3' },
  { id: 'adhan-tvquran', name: 'TV Quran Adhan', url: '/audio/adhan-tvquran.mp3' },
  { id: 'adhan-lovable', name: 'Noor Connect Adhan', url: '/audio/adhan-lovable.mp3' },
];

const ADHAN_STORAGE_KEY = 'selected-adhan-id';

export const getSelectedAdhanUrl = (): string => {
  const savedId = localStorage.getItem(ADHAN_STORAGE_KEY);
  const adhan = ADHAN_OPTIONS.find(a => a.id === savedId);
  return adhan?.url || ADHAN_OPTIONS[0].url;
};

// Global audio instance to prevent multiple audio playing
let globalPreviewAudio: HTMLAudioElement | null = null;

export const stopAllAdhanPreviews = () => {
  if (globalPreviewAudio) {
    globalPreviewAudio.pause();
    globalPreviewAudio.currentTime = 0;
    globalPreviewAudio = null;
  }
};

export const AdhanSelector = () => {
  const [selectedAdhan, setSelectedAdhan] = useState(() => {
    return localStorage.getItem(ADHAN_STORAGE_KEY) || ADHAN_OPTIONS[0].id;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAdhanPreviews();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsPlaying(false);
    };
  }, []);

  const handleAdhanChange = (value: string) => {
    setSelectedAdhan(value);
    localStorage.setItem(ADHAN_STORAGE_KEY, value);
    
    // Stop any playing preview
    stopAllAdhanPreviews();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsPlaying(false);
  };

  const handlePreview = () => {
    const adhan = ADHAN_OPTIONS.find(a => a.id === selectedAdhan);
    if (!adhan) return;

    // If already playing, stop it
    if (isPlaying) {
      stopAllAdhanPreviews();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsPlaying(false);
      return;
    }

    // Stop any existing audio first
    stopAllAdhanPreviews();

    // Create new audio instance
    globalPreviewAudio = new Audio(adhan.url);
    globalPreviewAudio.volume = 0.5;
    
    const handleEnded = () => {
      setIsPlaying(false);
      globalPreviewAudio = null;
    };

    const handleError = () => {
      setIsPlaying(false);
      globalPreviewAudio = null;
    };

    globalPreviewAudio.addEventListener('ended', handleEnded);
    globalPreviewAudio.addEventListener('error', handleError);
    
    globalPreviewAudio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      setIsPlaying(false);
      globalPreviewAudio = null;
    });

    // Remove 10-second limit - let the Adhan play completely
    // timeoutRef.current = setTimeout(() => {
    //   stopAllAdhanPreviews();
    //   setIsPlaying(false);
    // }, 10000);
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center gap-3 mb-3">
        <Volume2 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Adhan Sound</h3>
      </div>
      <div className="flex gap-2">
        <Select value={selectedAdhan} onValueChange={handleAdhanChange}>
          <SelectTrigger className="flex-1 bg-background">
            <SelectValue placeholder="Select Adhan" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {ADHAN_OPTIONS.map((adhan) => (
              <SelectItem key={adhan.id} value={adhan.id}>
                {adhan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreview}
          className="shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Select your preferred Adhan for prayer notifications
      </p>
      <p className="text-xs text-primary/70 mt-1">
        Note: Fajr has a dedicated Adhan that cannot be changed
      </p>
    </Card>
  );
};
