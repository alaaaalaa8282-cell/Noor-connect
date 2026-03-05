import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, RefreshCw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pickNonRepeatingIndex } from "@/lib/non-repeating-picker";

interface Ayah {
  arabic: string;
  translation: string;
  surah: string;
  ayahNumber: number;
}

const ayahCollection: Ayah[] = [
  { arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", translation: "In the name of Allah, the Most Gracious, the Most Merciful", surah: "Al-Fatiha", ayahNumber: 1 },
  { arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translation: "All praise is due to Allah, Lord of the worlds", surah: "Al-Fatiha", ayahNumber: 2 },
  { arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", translation: "You alone we worship, and You alone we ask for help", surah: "Al-Fatiha", ayahNumber: 5 },
  { arabic: "وَإِلَٰهُكُمْ إِلَٰهٌ وَاحِدٌ ۖ لَّا إِلَٰهَ إِلَّا هُوَ الرَّحْمَٰنُ الرَّحِيمُ", translation: "And your god is one God. There is no deity except Him, the Most Gracious, the Most Merciful.", surah: "Al-Baqarah", ayahNumber: 163 },
  { arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", translation: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.", surah: "Al-Baqarah", ayahNumber: 255 },
  { arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", translation: "Our Lord, give us in this world good and in the Hereafter good and protect us from the punishment of the Fire.", surah: "Al-Baqarah", ayahNumber: 201 },
  { arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", translation: "Allah does not burden a soul beyond that it can bear.", surah: "Al-Baqarah", ayahNumber: 286 },
  { arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", translation: "And whoever relies upon Allah - then He is sufficient for him.", surah: "At-Talaq", ayahNumber: 3 },
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "Indeed, with hardship comes ease.", surah: "Ash-Sharh", ayahNumber: 6 },
  { arabic: "فَإِنَّ ذِكْرَى تَنفَعُ الْمُؤْمِنِينَ", translation: "For indeed, the reminder benefits the believers.", surah: "Adh-Dhariyat", ayahNumber: 55 },
  { arabic: "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ", translation: "And do not despair of relief from Allah.", surah: "Yusuf", ayahNumber: 87 },
  { arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ", translation: "Say, He is Allah, the One.", surah: "Al-Ikhlas", ayahNumber: 1 },
  { arabic: "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ", translation: "And be patient, and your patience is only through Allah.", surah: "An-Nahl", ayahNumber: 127 },
  { arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", translation: "Verily, in the remembrance of Allah do hearts find rest.", surah: "Ar-Ra'd", ayahNumber: 28 },
  { arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا", translation: "And say, 'My Lord, increase me in knowledge.'", surah: "Ta-Ha", ayahNumber: 114 },
  { arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", translation: "Indeed, Allah is with the patient.", surah: "Al-Baqarah", ayahNumber: 153 },
  { arabic: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ", translation: "And We have certainly made the Quran easy for remembrance.", surah: "Al-Qamar", ayahNumber: 17 },
  { arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ", translation: "So remember Me; I will remember you.", surah: "Al-Baqarah", ayahNumber: 152 },
  { arabic: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ", translation: "And I did not create the jinn and mankind except to worship Me.", surah: "Adh-Dhariyat", ayahNumber: 56 },
  { arabic: "كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ", translation: "Every soul will taste death.", surah: "Al-Imran", ayahNumber: 185 },
];

const AYAH_HISTORY_KEY = "dashboard-ayah-history";

export function DailyAyah() {
  const [ayahIndex, setAyahIndex] = useState(() =>
    pickNonRepeatingIndex({
      storageKey: AYAH_HISTORY_KEY,
      length: ayahCollection.length,
      maxRecent: 8,
    })
  );

  const ayah = ayahCollection[ayahIndex] ?? ayahCollection[0];

  const refreshAyah = () => {
    const nextIndex = pickNonRepeatingIndex({
      storageKey: AYAH_HISTORY_KEY,
      length: ayahCollection.length,
      maxRecent: 8,
      exclude: [ayahIndex],
    });
    setAyahIndex(nextIndex);
  };

  const shareAyah = async () => {
    const text = `"${ayah.translation}"\n- Quran ${ayah.surah}:${ayah.ayahNumber}`;
    
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
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-primary">Daily Ayah</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-primary/10"
              onClick={refreshAyah}
              aria-label="Show another ayah"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-primary/10"
              onClick={shareAyah}
              aria-label="Share ayah"
            >
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        
        {/* Glass card for Arabic text */}
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xl font-arabic text-right leading-loose text-foreground" dir="rtl">
            {ayah.arabic}
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          "{ayah.translation}"
        </p>
        
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <p className="text-xs text-primary font-semibold px-2">
            - Surah {ayah.surah}, Ayah {ayah.ayahNumber}
          </p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </CardContent>
    </Card>
  );
}
