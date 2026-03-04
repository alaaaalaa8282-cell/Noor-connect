import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAdhanPreferences, getAdhanUrlForPrayer, type PrayerName } from '@/lib/adhan-preferences';
import { Play, Volume2 } from 'lucide-react';

export const AdhanDebugPanel = () => {
  const [preferences, setPreferences] = useState(getAdhanPreferences());
  const [adhanUrls, setAdhanUrls] = useState<Record<PrayerName, string>>({} as Record<PrayerName, string>);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUrls = async () => {
      setLoading(true);
      const urls: Record<PrayerName, string> = {} as Record<PrayerName, string>;
      
      for (const prayer of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as PrayerName[]) {
        urls[prayer] = await getAdhanUrlForPrayer(prayer);
      }
      
      setAdhanUrls(urls);
      setLoading(false);
    };

    loadUrls();
  }, []);

  const testPrayerAdhan = async (prayer: PrayerName) => {
    const url = await getAdhanUrlForPrayer(prayer);
    const audio = new Audio(url);
    audio.volume = 0.5;
    await audio.play();
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded" />
          <div className="h-3 bg-muted rounded w-3/4" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">Adhan System Debug</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="font-medium">Current Preferences:</div>
        {Object.entries(preferences).map(([prayer, adhanId]) => (
          <div key={prayer} className="flex justify-between items-center">
            <span className="font-medium">{prayer}:</span>
            <span className="text-muted-foreground text-xs">{adhanId}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm">
        <div className="font-medium">Adhan URLs:</div>
        {Object.entries(adhanUrls).map(([prayer, url]) => (
          <div key={prayer} className="flex justify-between items-center">
            <span className="font-medium">{prayer}:</span>
            <span className="text-muted-foreground text-xs truncate ml-2">{url.split('/').pop()}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="font-medium text-sm">Test Each Prayer:</div>
        <div className="grid grid-cols-5 gap-1">
          {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as PrayerName[]).map((prayer) => (
            <Button
              key={prayer}
              size="sm"
              variant="outline"
              onClick={() => testPrayerAdhan(prayer)}
              className="text-xs"
            >
              <Play className="w-3 h-3 mr-1" />
              {prayer}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};
