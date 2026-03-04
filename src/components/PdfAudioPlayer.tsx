import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Headphones, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ttsService, PdfAudiobookPlayer } from '@/lib/tts-service';
import { detectLanguage, pdfTextCache } from '@/lib/pdf-text-extractor';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface PdfAudioPlayerProps {
  pdfSource: string;
  cacheKey: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
}

export default function PdfAudioPlayer({
  pdfSource,
  cacheKey,
  currentPage,
  totalPages,
  onPageChange,
  onClose
}: PdfAudioPlayerProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en');
  const [isTtsAvailable, setIsTtsAvailable] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const playerRef = useRef<PdfAudiobookPlayer | null>(null);
  const isPreloadingRef = useRef(false);
  
  // Initialize TTS and pre-load PDF
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if TTS is available
        const available = await ttsService.isAvailable();
        setIsTtsAvailable(available);
        
        if (!available) {
          toast({
            title: t('ttsNotAvailable'),
            description: t('ttsInstallPrompt'),
            variant: 'destructive'
          });
          return;
        }
        
        // Pre-load PDF for text extraction
        if (!pdfTextCache.isLoaded(cacheKey) && !isPreloadingRef.current) {
          isPreloadingRef.current = true;
          console.log('Pre-loading PDF for audio:', cacheKey);
          await pdfTextCache.preload(pdfSource, cacheKey);
          isPreloadingRef.current = false;
        }
        
        // Detect language from first page
        try {
          const firstPageText = await pdfTextCache.getText(cacheKey, 1);
          const lang = detectLanguage(firstPageText);
          setDetectedLanguage(lang || i18n.language || 'en');
        } catch (error) {
          console.log('Could not detect language, using app language');
          setDetectedLanguage(i18n.language || 'en');
        }
        
      } catch (error) {
        console.error('Audio player initialization error:', error);
        toast({
          title: t('audioInitError'),
          description: t('audioInitErrorDesc'),
          variant: 'destructive'
        });
      }
    };
    
    initialize();
    
    // Cleanup
    return () => {
      if (playerRef.current) {
        void playerRef.current.stop();
      }
    };
  }, [pdfSource, cacheKey, i18n.language, toast, t]);
  
  // Create player instance
  useEffect(() => {
    playerRef.current = new PdfAudiobookPlayer(cacheKey, totalPages, {
      onPageChange: (page) => {
        onPageChange(page);
      },
      onComplete: () => {
        setIsPlaying(false);
        toast({
          title: t('audiobookComplete'),
          description: t('audiobookCompleteDesc')
        });
      },
      onError: (error) => {
        console.error('Audio playback error:', error);
        setIsPlaying(false);
        toast({
          title: t('audioPlaybackError'),
          description: error.message,
          variant: 'destructive'
        });
      }
    });

    playerRef.current.setPlaybackOptions({
      language: detectedLanguage,
      rate,
      volume
    });
    
    return () => {
      void playerRef.current?.stop();
    };
  }, [cacheKey, onPageChange, t, toast, totalPages]);

  useEffect(() => {
    if (!playerRef.current) {
      return;
    }

    playerRef.current.setPlaybackOptions({
      language: detectedLanguage,
      rate,
      volume
    });
  }, [detectedLanguage, rate, volume]);
  
  // Handle play/pause
  const togglePlay = async () => {
    if (!playerRef.current || !isTtsAvailable) return;
    
    try {
      if (isPlaying) {
        await playerRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        await playerRef.current.goToPage(currentPage);
        await playerRef.current.play(currentPage);
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Toggle play error:', error);
      setIsLoading(false);
      setIsPlaying(false);
      toast({
        title: t('audioPlaybackError'),
        description: (error as Error).message,
        variant: 'destructive'
      });
    }
  };
  
  // Handle stop
  const handleStop = async () => {
    if (!playerRef.current) return;
    
    await playerRef.current.stop();
    setIsPlaying(false);
  };
  
  // Handle next page
  const handleNext = async () => {
    if (!playerRef.current) return;
    
    await playerRef.current.nextPage();
    if (isPlaying) {
      // Re-start playing from new page
      await playerRef.current.pause();
      await playerRef.current.play(playerRef.current.getCurrentPage());
    }
  };
  
  // Handle previous page
  const handlePrevious = async () => {
    if (!playerRef.current) return;
    
    await playerRef.current.previousPage();
    if (isPlaying) {
      await playerRef.current.pause();
      await playerRef.current.play(playerRef.current.getCurrentPage());
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
  };
  
  // Handle rate change
  const handleRateChange = (value: number[]) => {
    const newRate = 0.5 + (value[0] / 100) * 1.5; // Range: 0.5 - 2.0
    setRate(newRate);
  };
  
  // Open TTS settings
  const openTtsSettings = async () => {
    try {
      await ttsService.openSettings();
    } catch (error) {
      toast({
        title: t('cannotOpenSettings'),
        description: t('cannotOpenSettingsDesc'),
        variant: 'destructive'
      });
    }
  };
  
  if (!isTtsAvailable) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-card border border-border rounded-xl p-4 shadow-xl z-50">
        <div className="flex items-center gap-3">
          <Headphones className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">{t('ttsNotAvailable')}</p>
            <p className="text-xs text-muted-foreground">{t('ttsInstallPrompt')}</p>
          </div>
          <Button size="sm" variant="outline" onClick={openTtsSettings}>
            {t('install')}
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <span className="sr-only">{t('close')}</span>
            <span className="text-lg">x</span>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-20 left-4 right-4 bg-card border border-border rounded-xl p-4 shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">{t('audiobookMode')}</span>
          <Badge variant="secondary" className="text-[10px]">
            {t('page')} {currentPage} / {totalPages}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onClose}
          >
            <span className="text-lg">x</span>
          </Button>
        </div>
      </div>
      
      {/* Main Controls */}
      <div className="flex items-center justify-center gap-2">
        {/* Previous Page */}
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10"
          onClick={handlePrevious}
          disabled={currentPage <= 1}
        >
          <SkipBack className="w-5 h-5" />
        </Button>
        
        {/* Stop */}
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10"
          onClick={handleStop}
          disabled={!isPlaying}
        >
          <Square className="w-5 h-5" />
        </Button>
        
        {/* Play/Pause */}
        <Button
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>
        
        {/* Next Page */}
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {/* Volume Control */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Volume2 className="w-3 h-3" />
              <span>{t('volume')}</span>
            </div>
            <Slider
              value={[volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          
          {/* Speed Control */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('speed')}</span>
              <span>{rate.toFixed(1)}x</span>
            </div>
            <Slider
              value={[(rate - 0.5) / 1.5 * 100]}
              onValueChange={handleRateChange}
              max={100}
              step={10}
              className="w-full"
            />
          </div>
          
          {/* Language Info */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('language')}:</span>
            <Badge variant="outline" className="text-[10px]">
              {ttsService.getLanguageName(detectedLanguage)}
            </Badge>
          </div>
          
          {/* TTS Settings Link */}
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs"
            onClick={openTtsSettings}
          >
            {t('openTtsSettings')}
          </Button>
        </div>
      )}
    </div>
  );
}
