import { useState, useEffect, useCallback } from "react";
import { Volume2, Download, ExternalLink, CheckCircle, AlertCircle, Play, Pause, RefreshCw, Globe, User, Settings, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext-new";
import { ttsEngine, type TTSVoice, type VoiceCheckResult, type VoiceDownloadLink } from "@/lib/tts";

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoiceSettings = ({ isOpen, onClose }: VoiceSettingsProps) => {
  const { toast } = useToast();
  const { language, t } = useLanguage();
  
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
  const [voiceCheckResults, setVoiceCheckResults] = useState<Record<string, VoiceCheckResult>>({});
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice | null>(null);
  const [testText, setTestText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState([1.0]);
  const [speechPitch, setSpeechPitch] = useState([1.0]);
  const [isChecking, setIsChecking] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Languages to check for voice availability
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' }
  ];

  const testTexts: Record<string, string> = {
    en: "Hello, this is a test of the text-to-speech system.",
    ur: "ہیلو، یہ ٹیکسٹ ٹو اسپیچ سسٹم کا ٹیسٹ ہے۔",
    tr: "Merhaba, bu metin konuşma sisteminin bir testidir.",
    ar: "مرحبا، هذا اختبار لنظام تحويل النص إلى كلام.",
    hi: "नमस्ते, यह टेक्स्ट-टू-स्पीच सिस्टम का एक परीक्षण है।",
    es: "Hola, esta es una prueba del sistema de texto a voz.",
    fr: "Bonjour, ceci est un test du système de synthèse vocale.",
    de: "Hallo, dies ist ein Test des Text-zu-Sprache-Systems.",
    id: "Halo, ini adalah tes sistem teks-ke-suara.",
    bn: "হ্যালো, এটি টেক্সট-টু-স্পিচ সিস্টেমের একটি পরীক্ষা।"
  };

  useEffect(() => {
    if (isOpen) {
      loadVoices();
      checkAllLanguages();
    }
  }, [isOpen]);

  const loadVoices = async () => {
    try {
      await ttsEngine.initialize(language);
      const voices = ttsEngine.getAvailableVoices();
      setAvailableVoices(voices);
      
      // Set current preferred voice
      const preferred = ttsEngine.getPreferredVoice();
      if (preferred) {
        setSelectedVoice(preferred);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
      toast({
        title: "Error",
        description: "Failed to load available voices",
        variant: "destructive"
      });
    }
  };

  const checkAllLanguages = async () => {
    setIsChecking(true);
    const results: Record<string, VoiceCheckResult> = {};
    
    for (const lang of languages) {
      try {
        const result = await ttsEngine.checkVoiceAvailability(lang.code);
        results[lang.code] = result;
      } catch (error) {
        console.error(`Failed to check ${lang.code}:`, error);
        results[lang.code] = {
          hasVoice: false,
          language: lang.code,
          recommendedVoices: [],
          downloadLinks: []
        };
      }
    }
    
    setVoiceCheckResults(results);
    setIsChecking(false);
  };

  const testVoice = async () => {
    if (!selectedVoice || !testText) return;
    
    setIsTesting(true);
    setIsSpeaking(true);
    
    try {
      await ttsEngine.speak({
        text: testText,
        language: selectedVoice.language,
        rate: speechRate[0],
        pitch: speechPitch[0],
        voice: selectedVoice
      });
    } catch (error) {
      console.error('TTS test failed:', error);
      toast({
        title: "Test Failed",
        description: "Failed to speak with selected voice",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
      setIsSpeaking(false);
    }
  };

  const stopTest = async () => {
    try {
      await ttsEngine.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Failed to stop TTS:', error);
    }
  };

  const handleVoiceSelect = (voice: TTSVoice) => {
    setSelectedVoice(voice);
    ttsEngine.setPreferredVoice(voice);
    
    // Set test text for the voice's language
    const langCode = voice.language.split('-')[0].toLowerCase();
    setTestText(testTexts[langCode] || testTexts.en);
  };

  const openDownloadLink = (link: VoiceDownloadLink) => {
    window.open(link.url, '_blank');
    toast({
      title: "Opening Download",
      description: `Opening ${link.name} in new tab`
    });
  };

  const getLanguageDisplayName = (code: string) => {
    const lang = languages.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code.toUpperCase();
  };

  const getVoiceDisplayName = (voice: TTSVoice) => {
    const langCode = voice.language.split('-')[0].toLowerCase();
    const lang = languages.find(l => l.code === langCode);
    const flag = lang ? lang.flag : '🌐';
    return `${flag} ${voice.name}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            Voice & Text-to-Speech Settings
          </DialogTitle>
          <DialogDescription>
            Manage text-to-speech voices and download additional language support
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Voice Selection */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Current Voice Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Voice</label>
                <Select value={selectedVoice?.name || ""} onValueChange={(value) => {
                  const voice = availableVoices.find(v => v.name === value);
                  if (voice) handleVoiceSelect(voice);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a voice">
                      {selectedVoice && getVoiceDisplayName(selectedVoice)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableVoices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {getVoiceDisplayName(voice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Speech Rate: {speechRate[0].toFixed(1)}x
                </label>
                <Slider
                  value={speechRate}
                  onValueChange={setSpeechRate}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Speech Pitch: {speechPitch[0].toFixed(1)}
                </label>
                <Slider
                  value={speechPitch}
                  onValueChange={setSpeechPitch}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* Voice Testing */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Test Voice
            </h3>
            
            <div className="space-y-3">
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to test the voice..."
                className="w-full p-3 border rounded-md resize-none h-20 text-sm"
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={testVoice}
                  disabled={!selectedVoice || !testText || isTesting}
                  className="flex-1"
                >
                  {isSpeaking ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Test Voice
                    </>
                  )}
                </Button>
                
                {isSpeaking && (
                  <Button onClick={stopTest} variant="outline">
                    <Pause className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Language Availability */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Language Voice Availability
              </h3>
              <Button
                onClick={checkAllLanguages}
                disabled={isChecking}
                variant="outline"
                size="sm"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-3">
              {languages.map((lang) => {
                const result = voiceCheckResults[lang.code];
                const hasVoice = result?.hasVoice || false;
                
                return (
                  <div key={lang.code} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{lang.flag}</span>
                        <span className="font-medium">{lang.name}</span>
                        <Badge variant={hasVoice ? "default" : "secondary"}>
                          {hasVoice ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Available
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Not Available
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>

                    {hasVoice && result?.recommendedVoices.length > 0 && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Available voices: {result.recommendedVoices.map(v => v.name).join(', ')}
                      </div>
                    )}

                    {!hasVoice && result?.downloadLinks && result.downloadLinks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Download voice support:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.downloadLinks.map((link, index) => (
                            <Button
                              key={index}
                              onClick={() => openDownloadLink(link)}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              {link.isDirect ? (
                                <Download className="w-3 h-3 mr-1" />
                              ) : (
                                <ExternalLink className="w-3 h-3 mr-1" />
                              )}
                              {link.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">📖 How to Install Voices</h3>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>• <strong>Android:</strong> Install Google Text-to-Speech from Play Store, then open Settings &gt; System &gt; Language &amp; Input &gt; Text-to-Speech Output to download voice data.</p>
              <p>• <strong>iOS:</strong> Go to Settings &gt; Accessibility &gt; Spoken Content &gt; Voices &gt; Select a language and download voices.</p>
              <p>• <strong>Web:</strong> Voice availability depends on your browser and operating system. Chrome and Edge generally have the best support.</p>
              <p>• After installing new voices, restart the app and click "Refresh" to detect them.</p>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceSettings;
