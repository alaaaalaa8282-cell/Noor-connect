import { useState } from 'react';
import { AlertCircle, Download, ExternalLink, Settings, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ttsEngine, type VoiceCheckResult, type VoiceDownloadLink } from '@/lib/tts';
import { useToast } from '@/hooks/use-toast';

interface VoiceCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onVoiceAvailable?: () => void;
}

export const VoiceCheckDialog = ({ isOpen, onClose, language, onVoiceAvailable }: VoiceCheckDialogProps) => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<VoiceCheckResult | null>(null);

  const checkVoiceAvailability = async () => {
    setIsChecking(true);
    try {
      const result = await ttsEngine.checkVoiceAvailability(language);
      setCheckResult(result);
      
      if (result.hasVoice) {
        toast({
          title: "Voice Available",
          description: `${result.language} voice is available on your device`,
        });
        onVoiceAvailable?.();
        onClose();
      }
    } catch (error) {
      console.error('Error checking voice availability:', error);
      toast({
        title: "Check Failed",
        description: "Failed to check voice availability",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const openLink = (url: string, isDirect?: boolean) => {
    if (isDirect) {
      // For direct app links, try to open in Play Store
      window.open(url, '_blank');
    } else {
      // For guide links, open in new tab
      window.open(url, '_blank');
    }
  };

  const getLanguageDisplayName = (langCode: string): string => {
    const langMap: Record<string, string> = {
      'ur': 'Urdu',
      'tr': 'Turkish',
      'en': 'English',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German'
    };
    return langMap[langCode.toLowerCase()] || langCode.toUpperCase();
  };

  const getLanguageNativeName = (langCode: string): string => {
    const nativeNames: Record<string, string> = {
      'ur': 'اردو',
      'tr': 'Türkçe',
      'en': 'English',
      'ar': 'العربية',
      'hi': 'हिन्दी',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch'
    };
    return nativeNames[langCode.toLowerCase()] || langCode.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Voice Check - {getLanguageDisplayName(language)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!checkResult && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Checking if {getLanguageDisplayName(language)} ({getLanguageNativeName(language)}) voice is available on your device...
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={checkVoiceAvailability} 
                disabled={isChecking}
                className="w-full"
              >
                {isChecking ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Checking...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Check Voice Availability
                  </div>
                )}
              </Button>
            </div>
          )}

          {checkResult && !checkResult.hasVoice && (
            <div className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  {getLanguageDisplayName(language)} voice not found. Click below to download it for free (offline).
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700">Recommended Solutions:</h4>
                
                {checkResult.downloadLinks.map((link, index) => (
                  <Card key={index} className="p-3 border-gray-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-sm truncate">{link.name}</h5>
                          {link.isDirect && (
                            <Badge variant="secondary" className="text-xs">
                              Direct
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{link.description}</p>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openLink(link.url, link.isDirect)}
                        className="flex-shrink-0"
                      >
                        {link.isDirect ? (
                          <Download className="w-4 h-4" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h5 className="font-medium text-sm text-blue-800 mb-2">Installation Steps:</h5>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Click "Google Text-to-Speech" above</li>
                  <li>Install the app from Google Play Store</li>
                  <li>Open Android Settings → Accessibility → Text-to-speech output</li>
                  <li>Select "Google Text-to-Speech" as your engine</li>
                  <li>Tap "Install voice data" and choose {getLanguageDisplayName(language)}</li>
                  <li>Return to Noor Connect and enjoy TTS!</li>
                </ol>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close
                </Button>
                <Button onClick={checkVoiceAvailability} className="flex-1">
                  Re-check
                </Button>
              </div>
            </div>
          )}

          {checkResult && checkResult.hasVoice && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Great! {getLanguageDisplayName(language)} voice is available on your device.
                </AlertDescription>
              </Alert>

              {checkResult.recommendedVoices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Available Voices:</h4>
                  <div className="space-y-1">
                    {checkResult.recommendedVoices.map((voice, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs bg-gray-50 rounded p-2">
                        <span className="font-medium">{voice.name}</span>
                        <span className="text-gray-500">({voice.language})</span>
                        {voice.gender && (
                          <Badge variant="outline" className="text-xs">
                            {voice.gender}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={onClose} className="w-full">
                Continue
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
