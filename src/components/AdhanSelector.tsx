import { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  getAdhanPreferences,
  setAdhanForPrayer,
  ALL_ADHAN_OPTIONS,
  type PrayerName,
  type AdhanPreferences
} from '@/lib/adhan-preferences';

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

const PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export const AdhanSelector = () => {
  const [preferences, setPreferences] = useState<AdhanPreferences>(getAdhanPreferences);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playingPrayer, setPlayingPrayer] = useState<PrayerName | null>(null);
  const [customAdhans, setCustomAdhans] = useState<{ id: string, name: string }[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load custom adhans for the dropdown
    const loadCustomMetadata = async () => {
      try {
        const localforage = (await import('localforage')).default;
        const adhanStore = localforage.createInstance({
          name: 'islamic-companion',
          storeName: 'custom-adhans',
          description: 'User uploaded adhan audio files'
        });
        const saved = await adhanStore.getItem<any[]>('custom-adhan-audio');
        if (saved) {
          setCustomAdhans(saved.map(a => ({ id: a.id, name: `Custom: ${a.name}` })));
        }
      } catch (error) {
        console.error("Error loading custom adhan metadata:", error);
      }
    };

    loadCustomMetadata();

    // Sync preferences when storage changes
    const handleStorage = () => {
      setPreferences(getAdhanPreferences());
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      stopAllAdhanPreviews();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setPlayingPrayer(null);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleAdhanChange = (prayer: PrayerName, adhanId: string) => {
    setAdhanForPrayer(prayer, adhanId);
    setPreferences(prev => ({ ...prev, [prayer]: adhanId }));

    // Stop any playing preview
    stopAllAdhanPreviews();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setPlayingPrayer(null);

    // Trigger notification reschedule
    window.dispatchEvent(new Event('prayer-method-changed'));
  };

  const handlePreview = async (prayer: PrayerName) => {
    const adhanId = preferences[prayer];

    // If already playing this prayer's adhan, stop it
    if (playingPrayer === prayer) {
      stopAllAdhanPreviews();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setPlayingPrayer(null);
      return;
    }

    // Stop any existing audio first
    stopAllAdhanPreviews();

    let adhanUrl = "";
    if (adhanId.startsWith('custom-')) {
      const { getCustomAdhanUrl } = await import('./CustomAdhanUpload');
      const url = await getCustomAdhanUrl(adhanId);
      if (url) adhanUrl = url;
    } else {
      const adhan = ALL_ADHAN_OPTIONS.find(a => a.id === adhanId);
      if (adhan) adhanUrl = adhan.url;
    }

    if (!adhanUrl) return;

    // Create new audio instance
    globalPreviewAudio = new Audio(adhanUrl);
    globalPreviewAudio.volume = 0.5;

    const handleEnded = () => {
      setPlayingPrayer(null);
      globalPreviewAudio = null;
    };

    const handleError = () => {
      setPlayingPrayer(null);
      globalPreviewAudio = null;
    };

    globalPreviewAudio.addEventListener('ended', handleEnded);
    globalPreviewAudio.addEventListener('error', handleError);

    globalPreviewAudio.play().then(() => {
      setPlayingPrayer(prayer);
    }).catch(() => {
      setPlayingPrayer(null);
      globalPreviewAudio = null;
    });
  };

  const combinedOptions = [...ALL_ADHAN_OPTIONS, ...customAdhans];

  return (
    <Card className="p-4 bg-card border-border">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Adhan Sounds</h3>
            <p className="text-xs text-muted-foreground">
              Customize adhan for each prayer
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {PRAYERS.map((prayer) => (
            <div key={prayer} className="flex items-center gap-2">
              <span className="w-20 text-sm font-medium text-foreground">
                {prayer}
              </span>
              <Select
                value={preferences[prayer]}
                onValueChange={(value) => handleAdhanChange(prayer, value)}
              >
                <SelectTrigger className="flex-1 bg-background h-9">
                  <SelectValue placeholder="Select Adhan" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {combinedOptions.map((adhan) => (
                    <SelectItem key={adhan.id} value={adhan.id}>
                      {adhan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePreview(prayer)}
                className="shrink-0 h-9 w-9"
              >
                {playingPrayer === prayer ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}

          <p className="text-xs text-primary/70 mt-3 pt-2 border-t border-border/50">
            💡 Fajr defaults to a special Adhan, but you can change it
          </p>
        </div>
      )}
    </Card>
  );
};
