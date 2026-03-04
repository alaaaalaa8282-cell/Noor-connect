import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, VolumeX, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext-new';
import { ttsEngine, type TTSVoice } from '@/lib/tts';
import { useToast } from '@/hooks/use-toast';
import { VoiceCheckDialog } from '@/components/VoiceCheckDialog';

interface TTSPlayerProps {
  text?: string;
  title?: string;
  isVisible: boolean;
  onToggle: () => void;
  autoPlayToken?: number;
}

export const TTSPlayer = ({ text, title, isVisible, onToggle, autoPlayToken }: TTSPlayerProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceCheck, setShowVoiceCheck] = useState(false);
  const [hasVoiceForLanguage, setHasVoiceForLanguage] = useState(true);

  const playbackIdRef = useRef(0);
  const previousTextRef = useRef<string | undefined>(undefined);
  const isInitializingRef = useRef(false);
  const isPlayingRef = useRef(false);

  const initializeTTS = useCallback(async () => {
    if (isInitializingRef.current) {
      return;
    }
    
    try {
      isInitializingRef.current = true;
      await ttsEngine.initialize(language);
      const voices = ttsEngine.getAvailableVoices();
      setAvailableVoices(voices);

      const preferred = ttsEngine.getPreferredVoice();
      if (preferred) {
        setSelectedVoice(preferred);
      }

      const voiceCheck = await ttsEngine.checkVoiceAvailability(language);
      setHasVoiceForLanguage(voiceCheck.hasVoice);
    } catch (error) {
      console.error('Failed to initialize TTS:', error);
      toast({
        title: 'TTS Error',
        description: 'Failed to initialize text-to-speech',
        variant: 'destructive'
      });
    } finally {
      isInitializingRef.current = false;
    }
  }, [language, toast]);

  const handleStop = useCallback(async () => {
    try {
      playbackIdRef.current += 1;
      await ttsEngine.stop();
      setIsPlaying(false);
      setIsPaused(false);
      isPlayingRef.current = false;
    } catch (error) {
      console.error('TTS stop error:', error);
      isPlayingRef.current = false;
    }
  }, []);

  const handlePlay = useCallback(async () => {
    if (!text?.trim()) {
      toast({
        title: 'No Text',
        description: 'No text available for speech',
        variant: 'destructive'
      });
      return;
    }

    // Prevent rapid successive calls
    if (isPlayingRef.current) {
      return;
    }

    try {
      if (isPaused) {
        await ttsEngine.resume();
        setIsPaused(false);
        setIsPlaying(true);
        isPlayingRef.current = true;
        return;
      }

      await ttsEngine.stop();
      const playbackId = Date.now();
      playbackIdRef.current = playbackId;
      setIsPaused(false);
      setIsPlaying(true);
      isPlayingRef.current = true;

      ttsEngine.speak({
        text,
        rate,
        pitch: 1.0,
        volume,
        voice: selectedVoice || undefined,
        language
      }).then(() => {
        if (playbackIdRef.current === playbackId) {
          setIsPlaying(false);
          setIsPaused(false);
          isPlayingRef.current = false;
        }
      }).catch((error) => {
        if (playbackIdRef.current === playbackId) {
          setIsPlaying(false);
          setIsPaused(false);
          isPlayingRef.current = false;
        }
        console.error('TTS play error:', error);
        // Only show toast for non-interruption errors
        if (!error.message?.includes('interrupted')) {
          toast({
            title: 'TTS Error',
            description: 'Failed to play speech',
            variant: 'destructive'
          });
        }
      });
    } catch (error) {
      setIsPlaying(false);
      setIsPaused(false);
      isPlayingRef.current = false;
      console.error('TTS play error:', error);
      if (!error.message?.includes('interrupted')) {
        toast({
          title: 'TTS Error',
          description: 'Failed to play speech',
          variant: 'destructive'
        });
      }
    }
  }, [isPaused, language, rate, selectedVoice, text, toast, volume]);

  const handlePause = useCallback(async () => {
    try {
      await ttsEngine.pause();
      setIsPaused(true);
      setIsPlaying(false);
      isPlayingRef.current = false;
    } catch (error) {
      console.error('TTS pause error:', error);
      isPlayingRef.current = false;
    }
  }, []);

  const handleDismiss = useCallback(async () => {
    await handleStop();
    onToggle();
  }, [handleStop, onToggle]);

  const handleVoiceChange = (voiceName: string) => {
    const voice = availableVoices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
      ttsEngine.setPreferredVoice(voice);
    }
  };

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    void initializeTTS();
  }, [initializeTTS, isVisible]);

  useEffect(() => {
    return () => {
      void ttsEngine.stop();
    };
  }, []);

  // Stop playback when player is hidden.
  useEffect(() => {
    if (!isVisible && (isPlaying || isPaused)) {
      void handleStop();
    }
  }, [handleStop, isPaused, isPlaying, isVisible]);

  // Reset playback when text changes.
  useEffect(() => {
    const hasChanged = previousTextRef.current !== text;
    previousTextRef.current = text;

    if (hasChanged && (isPlaying || isPaused)) {
      void handleStop();
    }
  }, [handleStop, isPaused, isPlaying, text]);

  // Auto-play when requested by caller.
  useEffect(() => {
    if (!isVisible || !autoPlayToken || !text?.trim() || isPlayingRef.current) {
      return;
    }
    
    // Small delay to prevent race conditions
    const timeoutId = setTimeout(() => {
      if (!isPlayingRef.current) {
        void handlePlay();
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [autoPlayToken, handlePlay, isVisible, text]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = setInterval(async () => {
      const speaking = await ttsEngine.isSpeaking();
      if (!speaking && isPlaying) {
        setIsPlaying(false);
        setIsPaused(false);
        isPlayingRef.current = false;
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background to-transparent">
      <Card className="max-w-lg mx-auto border-emerald-200 bg-emerald-50/95 backdrop-blur-sm shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-300'}`} />
              <span className="text-sm font-medium text-emerald-700">
                {isPlaying ? 'Playing' : isPaused ? 'Paused' : 'Ready'}
              </span>
              {!hasVoiceForLanguage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoiceCheck(true)}
                  className="h-6 px-2 text-xs text-orange-600 hover:text-orange-700"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  No Voice
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-8 w-8 p-0"
              >
                <Settings className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0"
              >
                <VolumeX className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {title && (
            <p className="text-xs text-emerald-700/90 mb-3 truncate">{title}</p>
          )}

          <div className="grid grid-cols-3 gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlay}
              disabled={isPlaying}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <Play className="w-4 h-4" />
              <span className="text-xs">{isPaused ? 'Resume' : 'Play'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              disabled={!isPlaying}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <Pause className="w-4 h-4" />
              <span className="text-xs">Pause</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
              disabled={!isPlaying && !isPaused}
              className="flex flex-col items-center gap-1 h-auto py-3 border-red-200 text-red-600 hover:bg-red-50"
            >
              <Square className="w-4 h-4" />
              <span className="text-xs">Stop</span>
            </Button>
          </div>

          {showSettings && (
            <div className="space-y-3 pt-3 border-t border-emerald-200">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-16">Voice:</label>
                <Select value={selectedVoice?.name || ''} onValueChange={handleVoiceChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVoices.map((voice, index) => (
                      <SelectItem key={`${voice.name}-${index}`} value={voice.name}>
                        {voice.name} ({voice.language})
                        {voice.gender ? ` - ${voice.gender}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-16">Speed:</label>
                <div className="flex-1 flex items-center gap-2">
                  <Slider
                    value={[rate]}
                    onValueChange={(newRate) => setRate(newRate[0])}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">{rate.toFixed(1)}x</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-16">Volume:</label>
                <div className="flex-1 flex items-center gap-2">
                  <Slider
                    value={[volume]}
                    onValueChange={(newVolume) => setVolume(newVolume[0])}
                    min={0}
                    max={1.0}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">{Math.round(volume * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {text && (
            <div className="mt-3 pt-3 border-t border-emerald-200">
              <p className="text-xs text-gray-600 line-clamp-2">{text}</p>
            </div>
          )}
        </div>
      </Card>

      <VoiceCheckDialog
        isOpen={showVoiceCheck}
        onClose={() => setShowVoiceCheck(false)}
        language={language}
        onVoiceAvailable={() => {
          setHasVoiceForLanguage(true);
          void initializeTTS();
        }}
      />
    </div>
  );
};
