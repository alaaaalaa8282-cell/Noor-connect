import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, RefreshCw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import hadithData from "@/data/hadith.json";

interface Hadith {
  text: string;
  translation: string;
  source: string;
  number: string;
}

const DAILY_HADITH_KEY = 'daily-hadith-date';
const HADITH_INDEX_KEY = 'daily-hadith-index';

export function DailyHadith() {
  const [hadith, setHadith] = useState<Hadith | null>(null);

  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem(DAILY_HADITH_KEY);
    
    if (savedDate === today) {
      const savedIndex = parseInt(localStorage.getItem(HADITH_INDEX_KEY) || '0');
      setHadith(hadithData[savedIndex]);
    } else {
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const index = dayOfYear % hadithData.length;
      localStorage.setItem(DAILY_HADITH_KEY, today);
      localStorage.setItem(HADITH_INDEX_KEY, index.toString());
      setHadith(hadithData[index]);
    }
  }, []);

  const refreshHadith = () => {
    const randomIndex = Math.floor(Math.random() * hadithData.length);
    localStorage.setItem(HADITH_INDEX_KEY, randomIndex.toString());
    setHadith(hadithData[randomIndex]);
  };

  const shareHadith = async () => {
    if (!hadith) return;
    const text = `"${hadith.translation}"\n— ${hadith.source} #${hadith.number}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (err) {
        navigator.clipboard.writeText(text);
      }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  if (!hadith) return null;

  return (
    <Card className="overflow-hidden border-accent/20 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-accent-foreground">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Daily Hadith</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refreshHadith}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={shareHadith}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-lg font-arabic text-right leading-loose text-foreground" dir="rtl">
          {hadith.text}
        </p>
        
        <p className="text-sm text-muted-foreground italic">
          "{hadith.translation}"
        </p>
        
        <p className="text-xs text-primary font-medium">
          — {hadith.source} #{hadith.number}
        </p>
      </CardContent>
    </Card>
  );
}
