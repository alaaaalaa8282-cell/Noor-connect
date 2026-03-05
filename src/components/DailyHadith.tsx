import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, RefreshCw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pickNonRepeatingIndex } from "@/lib/non-repeating-picker";
import { getAllCollections, EnhancedHadith } from "@/data/hadith-collections";

// Sample enhanced hadith data (would be loaded from collections in production)
const enhancedHadithData: EnhancedHadith[] = [
  {
    id: "bukhari-1-1",
    collection: "bukhari",
    bookNumber: "1",
    bookName: "Revelation",
    chapterNumber: "1",
    chapterName: "How the Revelation Started",
    hadithNumber: "1",
    arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ",
    arabicPlain: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى، فمن كانت هجرته إلى الله ورسوله، فهجرته إلى الله ورسوله، ومن كانت هجرته لدنيا يصيبها أو امرأة ينكحها، فهجرته إلى ما هاجر إليه",
    englishTranslation: "Actions are judged by intentions, and each person will have what he intended. So whoever emigrated for Allah and His Messenger, his emigration is for Allah and His Messenger. Whoever emigrated to get some worldly benefit or for a woman to marry, his emigration is for what he emigrated for.",
    narrator: "Umar ibn al-Khattab (may Allah be pleased with him)",
    grade: "Sahih",
    category: "Intentions",
    tags: ["intentions", "actions", "emigration", "faith"],
    references: "Bukhari 1, Muslim 1907"
  },
  {
    id: "muslim-1-1",
    collection: "muslim",
    bookNumber: "1",
    bookName: "Faith",
    chapterNumber: "1",
    chapterName: "Chapter on Faith",
    hadithNumber: "1",
    arabic: "إِنَّمَا بُنِيَ آدَمَ، وَإِنَّمَا بَنِيَ إِبْرَاهِيمَ، وَإِنَّمَا بَنِيَ مُحَمَّدٍ، وَإِنَّمَا بَنِيَ عَبْدِ اللَّهِ بْنِ عَبَّاسٍ، وَإِنَّمَا بَنِيَ عُمَرَ بْنِ الْخَطَّابِ، وَإِنَّمَا بَنِيَ عُثْمَانَ بْنِ عَبِّ اللَّهِ الشَّافِعِيِّ، قَالُوا: قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهِ عَلَيْهِ وَسَلَّمَ: بُنِيَ آدَمَ خَيْرٌ مِنْكُمْ، أَوْ أَبُو بَكْرٍ خَيْرٌ مِنْكُمْ، أَوْ مُحَمَّدُ بْنُ مَسْلَمٍ خَيْرٌ مِنْكُمْ، أَوْ عَبْدُ اللَّهِ بْنُ عَبَّاسٍ خَيْرٌ مِنْكُمْ، أَوْ عُمَرُ بْنُ الْخَطَّابِ خَيْرٌ مِنْكُمْ، أَوْ عُثْمَانُ بْنُ عَبِّ اللَّهِ الشَّافِعِيِّ خَيْرٌ مِنْكُمْ",
    arabicPlain: "إنما بني آدم خير منكم، أو أبو بكر خير منكم، أو محمد بن مسلم خير منكم، أو عبد الله بن عباس خير منكم، أو عمر بن الخطاب خير منكم، أو عثمان بن عفان خير منكم",
    englishTranslation: "The best among you are the sons of Adam, or Abu Bakr, or Muhammad ibn Muslim, or Abdullah ibn Abbas, or Umar ibn al-Khattab, or Uthman ibn Affan.",
    narrator: "Abu Hurairah (may Allah be pleased with him)",
    grade: "Sahih",
    category: "Companions",
    tags: ["companions", "virtue", "islam"],
    references: "Muslim 2534"
  }
];

interface Hadith {
  text: string;
  translation: string;
  source: string;
  number: string;
}

const HADITH_HISTORY_KEY = "dashboard-hadith-history";

export function DailyHadith() {
  const [hadithIndex, setHadithIndex] = useState(() =>
    pickNonRepeatingIndex({
      storageKey: HADITH_HISTORY_KEY,
      length: enhancedHadithData.length,
      maxRecent: 12,
    })
  );

  const hadith = enhancedHadithData[hadithIndex] ?? enhancedHadithData[0];

  const refreshHadith = () => {
    const nextIndex = pickNonRepeatingIndex({
      storageKey: HADITH_HISTORY_KEY,
      length: enhancedHadithData.length,
      maxRecent: 12,
      exclude: [hadithIndex],
    });
    setHadithIndex(nextIndex);
  };

  const shareHadith = async () => {
    const text = `"${hadith.englishTranslation}"\n- ${hadith.collection} ${hadith.bookNumber}:${hadith.hadithNumber} #${hadith.references}`;
    
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


  return (
    <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-foreground/50 to-transparent" />
      
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent/30">
              <MessageCircle className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="text-sm font-semibold text-accent-foreground">Daily Hadith</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-accent/20"
              onClick={refreshHadith}
              aria-label="Show another hadith"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-accent/20"
              onClick={shareHadith}
              aria-label="Share hadith"
            >
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        
        {/* Glass card for Arabic text */}
        <div className="glass-card p-4 rounded-xl">
          <p className="text-lg font-arabic text-right leading-loose text-foreground" dir="rtl">
            {hadith.arabic}
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          "{hadith.englishTranslation}"
        </p>
        
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-foreground/30 to-transparent" />
          <p className="text-xs text-accent-foreground font-semibold px-2">
            - {hadith.collection} {hadith.bookNumber}:{hadith.hadithNumber}
          </p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-foreground/30 to-transparent" />
        </div>
        
        {hadith.narrator && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Narrated by: {hadith.narrator}
            </p>
          </div>
        )}
        
        {hadith.grade && (
          <div className="flex items-center justify-between mt-2">
            <Badge variant="secondary" className="text-xs">
              {hadith.grade}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {hadith.references}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DailyHadith;
