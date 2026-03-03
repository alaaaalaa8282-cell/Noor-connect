import { useLanguage } from '@/contexts/LanguageContext-new';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages, Check } from 'lucide-react';

export function I18nTest() {
  const { language, setLanguage, t, isRTL } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'ur', name: 'اردو', dir: 'rtl' },
    { code: 'tr', name: 'Türkçe', dir: 'ltr' },
    { code: 'id', name: 'Bahasa', dir: 'ltr' },
  ];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          i18n Test Component
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language Selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Select Language:</label>
          <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className={lang.dir === 'rtl' ? 'font-arabic' : ''}>
                    {lang.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Language Info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm space-y-1">
            <div><strong>Current:</strong> {language}</div>
            <div><strong>Direction:</strong> {isRTL ? 'RTL' : 'LTR'}</div>
            <div><strong>Document dir:</strong> {document.documentElement.dir}</div>
          </div>
        </div>

        {/* Translation Examples */}
        <div className="space-y-2">
          <h4 className="font-medium">Translation Examples:</h4>
          <div className="text-sm space-y-1 p-3 bg-muted rounded">
            <div><strong>App Title:</strong> {t('appTitle')}</div>
            <div><strong>Home:</strong> {t('home')}</div>
            <div><strong>Quran:</strong> {t('quran')}</div>
            <div><strong>Settings:</strong> {t('settings')}</div>
            <div><strong>Next Prayer:</strong> {t('nextPrayer')}</div>
            <div><strong>Digital Tasbeeh:</strong> {t('digitalTasbeeh')}</div>
          </div>
        </div>

        {/* Urdu Font Test */}
        {language === 'ur' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm">
              <div className="font-arabic text-lg">
                <strong>Urdu Font Test:</strong> نور کنیکٹ میں خوش آمدید
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {document.documentElement.style.fontFamily || 'Default font'}
              </div>
            </div>
          </div>
        )}

        {/* RTL Layout Test */}
        <div className={`p-3 bg-green-50 dark:bg-green-900/20 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="text-sm">
            <div><strong>Layout Test:</strong> {isRTL ? 'Right-to-Left' : 'Left-to-Right'}</div>
            <div className={isRTL ? 'font-arabic' : ''}>
              {isRTL ? 'ترتیب سے دائیں سے بائیں' : 'Left-to-Right Layout'}
            </div>
          </div>
        </div>

        {/* Test Button */}
        <Button 
          onClick={() => {
            console.log('Current language:', language);
            console.log('Is RTL:', isRTL);
            console.log('Document direction:', document.documentElement.dir);
            console.log('Document font:', document.documentElement.style.fontFamily);
          }}
          className="w-full"
        >
          <Check className="w-4 h-4 mr-2" />
          Test Console Output
        </Button>
      </CardContent>
    </Card>
  );
}
