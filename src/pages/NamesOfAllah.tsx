import { useState } from "react";
import { AppBar } from "@/components/AppBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Name {
  number: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  description?: string;
}

const namesOfAllah: Name[] = [
  { number: 1, arabic: "الرَّحْمَنُ", transliteration: "Ar-Rahman", meaning: "The Most Gracious", description: "The One who has plenty of mercy for believers and disbelievers in this world." },
  { number: 2, arabic: "الرَّحِيمُ", transliteration: "Ar-Raheem", meaning: "The Most Merciful", description: "The One who has plenty of mercy for believers." },
  { number: 3, arabic: "الْمَلِكُ", transliteration: "Al-Malik", meaning: "The King", description: "The One who has the power and command over all things." },
  { number: 4, arabic: "الْقُدُّوسُ", transliteration: "Al-Quddus", meaning: "The Most Holy", description: "The One who is pure from any imperfection." },
  { number: 5, arabic: "السَّلاَمُ", transliteration: "As-Salam", meaning: "The Source of Peace", description: "The One who is free from every imperfection." },
  { number: 6, arabic: "الْمُؤْمِنُ", transliteration: "Al-Mu'min", meaning: "The Granter of Security", description: "The One who witnessed for Himself that no one is God but Him." },
  { number: 7, arabic: "الْمُهَيْمِنُ", transliteration: "Al-Muhaymin", meaning: "The Guardian", description: "The One who witnesses the saying and deeds of His creatures." },
  { number: 8, arabic: "الْعَزِيزُ", transliteration: "Al-Aziz", meaning: "The Almighty", description: "The Defeater who is never defeated." },
  { number: 9, arabic: "الْجَبَّارُ", transliteration: "Al-Jabbar", meaning: "The Compeller", description: "The One that nothing happens in His Dominion except what He willed." },
  { number: 10, arabic: "الْمُتَكَبِّرُ", transliteration: "Al-Mutakabbir", meaning: "The Supreme", description: "The One who is clear from the attributes of the creatures." },
  { number: 11, arabic: "الْخَالِقُ", transliteration: "Al-Khaliq", meaning: "The Creator", description: "The One who brings everything from non-existence to existence." },
  { number: 12, arabic: "الْبَارِئُ", transliteration: "Al-Bari", meaning: "The Maker", description: "The Creator who has the power to turn the entities." },
  { number: 13, arabic: "الْمُصَوِّرُ", transliteration: "Al-Musawwir", meaning: "The Fashioner", description: "The One who forms His creatures in different pictures." },
  { number: 14, arabic: "الْغَفَّارُ", transliteration: "Al-Ghaffar", meaning: "The Great Forgiver", description: "The One who forgives the sins of His slaves time and time again." },
  { number: 15, arabic: "الْقَهَّارُ", transliteration: "Al-Qahhar", meaning: "The All-Prevailing", description: "The Dominant One who has the perfect Power." },
  { number: 16, arabic: "الْوَهَّابُ", transliteration: "Al-Wahhab", meaning: "The Bestower", description: "The One who is Generous in giving plenty without any return." },
  { number: 17, arabic: "الرَّزَّاقُ", transliteration: "Ar-Razzaq", meaning: "The Provider", description: "The One who gives sustenance to all creation." },
  { number: 18, arabic: "الْفَتَّاحُ", transliteration: "Al-Fattah", meaning: "The Opener", description: "The One who opens for His slaves the closed worldly and religious matters." },
  { number: 19, arabic: "اَلْعَلِيْمُ", transliteration: "Al-Alim", meaning: "The All-Knowing", description: "The One nothing is absent from His knowledge." },
  { number: 20, arabic: "الْقَابِضُ", transliteration: "Al-Qabid", meaning: "The Withholder", description: "The One who constricts the sustenance." },
  { number: 21, arabic: "الْبَاسِطُ", transliteration: "Al-Basit", meaning: "The Extender", description: "The One who expands and gives abundantly." },
  { number: 22, arabic: "الْخَافِضُ", transliteration: "Al-Khafid", meaning: "The Reducer", description: "The One who lowers whoever He willed by His Destruction." },
  { number: 23, arabic: "الرَّافِعُ", transliteration: "Ar-Rafi", meaning: "The Exalter", description: "The One who raises whoever He willed by His Endowment." },
  { number: 24, arabic: "الْمُعِزُّ", transliteration: "Al-Mu'izz", meaning: "The Honourer", description: "The One who gives esteem to whoever He willed." },
  { number: 25, arabic: "المُذِلُّ", transliteration: "Al-Muzil", meaning: "The Dishonourer", description: "The One who humiliates whoever He willed." },
  { number: 26, arabic: "السَّمِيعُ", transliteration: "As-Sami", meaning: "The All-Hearing", description: "The One who Hears all things that are heard by His Eternal Hearing." },
  { number: 27, arabic: "الْبَصِيرُ", transliteration: "Al-Basir", meaning: "The All-Seeing", description: "The One who Sees all things that are seen by His Eternal Seeing." },
  { number: 28, arabic: "الْحَكَمُ", transliteration: "Al-Hakam", meaning: "The Judge", description: "He is the Ruler and His judgment is His Word." },
  { number: 29, arabic: "الْعَدْلُ", transliteration: "Al-Adl", meaning: "The Just", description: "The One who is entitled to do what He does." },
  { number: 30, arabic: "اللَّطِيفُ", transliteration: "Al-Latif", meaning: "The Subtle", description: "The One who is kind to His slaves and endows upon them." },
  { number: 31, arabic: "الْخَبِيرُ", transliteration: "Al-Khabir", meaning: "The All-Aware", description: "The One who knows the truth of things." },
  { number: 32, arabic: "الْحَلِيمُ", transliteration: "Al-Halim", meaning: "The Forbearing", description: "The One who delays the punishment for those who deserve it." },
  { number: 33, arabic: "الْعَظِيمُ", transliteration: "Al-Azim", meaning: "The Magnificent", description: "The One deserving the attributes of Exaltment, Glory, Extolement." },
  { number: 34, arabic: "الْغَفُورُ", transliteration: "Al-Ghafoor", meaning: "The Forgiving", description: "The One who forgives a lot." },
  { number: 35, arabic: "الشَّكُورُ", transliteration: "Ash-Shakoor", meaning: "The Appreciative", description: "The One who gives a lot of reward for a little obedience." },
  { number: 36, arabic: "الْعَلِيُّ", transliteration: "Al-Ali", meaning: "The Most High", description: "The One who is clear from the attributes of the creatures." },
  { number: 37, arabic: "الْكَبِيرُ", transliteration: "Al-Kabir", meaning: "The Greatest", description: "The One who is greater than everything in status." },
  { number: 38, arabic: "الْحَفِيظُ", transliteration: "Al-Hafiz", meaning: "The Preserver", description: "The One who protects whatever and whoever He willed to protect." },
  { number: 39, arabic: "المُقيِت", transliteration: "Al-Muqit", meaning: "The Nourisher", description: "The One who has the Power." },
  { number: 40, arabic: "اﻟْحَسِيبُ", transliteration: "Al-Hasib", meaning: "The Reckoner", description: "The One who gives the satisfaction." },
  { number: 41, arabic: "الْجَلِيلُ", transliteration: "Al-Jalil", meaning: "The Majestic", description: "The One who is attributed with greatness of Power and Glory." },
  { number: 42, arabic: "الْكَرِيمُ", transliteration: "Al-Karim", meaning: "The Generous", description: "The One who is attributed with greatness of Power and Glory." },
  { number: 43, arabic: "الرَّقِيبُ", transliteration: "Ar-Raqib", meaning: "The Watchful", description: "The One that nothing is absent from Him." },
  { number: 44, arabic: "الْمُجِيبُ", transliteration: "Al-Mujib", meaning: "The Responsive", description: "The One who answers the one in need if he asks Him." },
  { number: 45, arabic: "الْوَاسِعُ", transliteration: "Al-Wasi", meaning: "The All-Encompassing", description: "The Knowledgeable." },
  { number: 46, arabic: "الْحَكِيمُ", transliteration: "Al-Hakim", meaning: "The Wise", description: "The One who is correct in His doings." },
  { number: 47, arabic: "الْوَدُودُ", transliteration: "Al-Wadud", meaning: "The Loving", description: "The One who loves His believing slaves and His believing slaves love Him." },
  { number: 48, arabic: "الْمَجِيدُ", transliteration: "Al-Majid", meaning: "The Glorious", description: "The One who is with perfect Power, High Status, Compassion." },
  { number: 49, arabic: "الْبَاعِثُ", transliteration: "Al-Ba'ith", meaning: "The Resurrector", description: "The One who resurrects His slaves after death for reward or punishment." },
  { number: 50, arabic: "الشَّهِيدُ", transliteration: "Ash-Shahid", meaning: "The Witness", description: "The One who nothing is absent from Him." },
  { number: 51, arabic: "الْحَقُّ", transliteration: "Al-Haqq", meaning: "The Truth", description: "The One who truly exists." },
  { number: 52, arabic: "الْوَكِيلُ", transliteration: "Al-Wakil", meaning: "The Trustee", description: "The One who gives the satisfaction and is relied upon." },
  { number: 53, arabic: "الْقَوِيُّ", transliteration: "Al-Qawiyy", meaning: "The Strong", description: "The One with the complete Power." },
  { number: 54, arabic: "الْمَتِينُ", transliteration: "Al-Matin", meaning: "The Firm", description: "The One with extreme Power which is un-interrupted." },
  { number: 55, arabic: "الْوَلِيُّ", transliteration: "Al-Waliyy", meaning: "The Protecting Friend", description: "The Supporter." },
  { number: 56, arabic: "الْحَمِيدُ", transliteration: "Al-Hamid", meaning: "The Praiseworthy", description: "The praised One who deserves to be praised." },
  { number: 57, arabic: "الْمُحْصِي", transliteration: "Al-Muhsi", meaning: "The Counter", description: "The One who the count of things are known to him." },
  { number: 58, arabic: "الْمُبْدِئُ", transliteration: "Al-Mubdi", meaning: "The Originator", description: "The One who started the human being." },
  { number: 59, arabic: "الْمُعِيدُ", transliteration: "Al-Mu'id", meaning: "The Restorer", description: "The One who brings back the creatures after death." },
  { number: 60, arabic: "الْمُحْيِي", transliteration: "Al-Muhyi", meaning: "The Giver of Life", description: "The One who took out a living human from semen that does not have a soul." },
  { number: 61, arabic: "اَلْمُمِيتُ", transliteration: "Al-Mumit", meaning: "The Bringer of Death", description: "The One who renders the living dead." },
  { number: 62, arabic: "الْحَيُّ", transliteration: "Al-Hayy", meaning: "The Ever Living", description: "The One attributed with a life that is unlike our life." },
  { number: 63, arabic: "الْقَيُّومُ", transliteration: "Al-Qayyum", meaning: "The Self-Subsisting", description: "The One who remains and does not end." },
  { number: 64, arabic: "الْوَاجِدُ", transliteration: "Al-Wajid", meaning: "The Finder", description: "The Rich who is never poor." },
  { number: 65, arabic: "الْمَاجِدُ", transliteration: "Al-Majid", meaning: "The Noble", description: "The One who is Majid." },
  { number: 66, arabic: "الْوَاحِدُ", transliteration: "Al-Wahid", meaning: "The One", description: "The One without a partner." },
  { number: 67, arabic: "اَلاَحَدُ", transliteration: "Al-Ahad", meaning: "The Unique", description: "The One." },
  { number: 68, arabic: "الصَّمَدُ", transliteration: "As-Samad", meaning: "The Eternal", description: "The Master who is relied upon in matters." },
  { number: 69, arabic: "الْقَادِرُ", transliteration: "Al-Qadir", meaning: "The Able", description: "The One attributed with Power." },
  { number: 70, arabic: "الْمُقْتَدِرُ", transliteration: "Al-Muqtadir", meaning: "The Powerful", description: "The One with the perfect Power that nothing is withheld from Him." },
  { number: 71, arabic: "الْمُقَدِّمُ", transliteration: "Al-Muqaddim", meaning: "The Expediter", description: "The One who puts things in their right places." },
  { number: 72, arabic: "الْمُؤَخِّرُ", transliteration: "Al-Mu'akhkhir", meaning: "The Delayer", description: "He puts things in their right places." },
  { number: 73, arabic: "الأوَّلُ", transliteration: "Al-Awwal", meaning: "The First", description: "The One whose Existence is without a beginning." },
  { number: 74, arabic: "الآخِرُ", transliteration: "Al-Akhir", meaning: "The Last", description: "The One whose Existence is without an end." },
  { number: 75, arabic: "الظَّاهِرُ", transliteration: "Az-Zahir", meaning: "The Manifest", description: "The One that nothing is above Him and nothing is underneath Him." },
  { number: 76, arabic: "الْبَاطِنُ", transliteration: "Al-Batin", meaning: "The Hidden", description: "The One that nothing is above Him and nothing is underneath Him." },
  { number: 77, arabic: "الْوَالِي", transliteration: "Al-Wali", meaning: "The Governor", description: "The One who owns things and manages them." },
  { number: 78, arabic: "الْمُتَعَالِي", transliteration: "Al-Muta'ali", meaning: "The Most Exalted", description: "The One who is clear from the attributes of the creation." },
  { number: 79, arabic: "الْبَرُّ", transliteration: "Al-Barr", meaning: "The Source of Goodness", description: "The One who is kind to His creatures." },
  { number: 80, arabic: "التَّوَّابُ", transliteration: "At-Tawwab", meaning: "The Acceptor of Repentance", description: "The One who grants repentance to whoever He willed." },
  { number: 81, arabic: "الْمُنْتَقِمُ", transliteration: "Al-Muntaqim", meaning: "The Avenger", description: "The One who victoriously prevails over His enemies." },
  { number: 82, arabic: "العَفُوُّ", transliteration: "Al-Afuww", meaning: "The Pardoner", description: "The One with wide forgiveness." },
  { number: 83, arabic: "الرَّؤُوفُ", transliteration: "Ar-Ra'uf", meaning: "The Compassionate", description: "The One with extreme Mercy." },
  { number: 84, arabic: "مَالِكُ الْمُلْكِ", transliteration: "Malik-ul-Mulk", meaning: "Owner of the Kingdom", description: "The One who controls the Dominion and gives dominion to whoever He willed." },
  { number: 85, arabic: "ذُوالْجَلاَلِ وَالإكْرَامِ", transliteration: "Dhul-Jalal wal-Ikram", meaning: "Lord of Majesty and Bounty", description: "The One who deserves to be Exalted and not denied." },
  { number: 86, arabic: "الْمُقْسِطُ", transliteration: "Al-Muqsit", meaning: "The Equitable", description: "The One who is Just in His judgment." },
  { number: 87, arabic: "الْجَامِعُ", transliteration: "Al-Jami", meaning: "The Gatherer", description: "The One who gathers the creatures on a day there is no doubt about." },
  { number: 88, arabic: "الْغَنِيُّ", transliteration: "Al-Ghaniyy", meaning: "The Self-Sufficient", description: "The One who does not need the creation." },
  { number: 89, arabic: "الْمُغْنِي", transliteration: "Al-Mughni", meaning: "The Enricher", description: "The One who satisfies the necessities of the creatures." },
  { number: 90, arabic: "اَلْمَانِعُ", transliteration: "Al-Mani'", meaning: "The Withholder", description: "The One who withholds." },
  { number: 91, arabic: "الضَّارَّ", transliteration: "Ad-Darr", meaning: "The Distresser", description: "The One who makes harm reach whoever He willed." },
  { number: 92, arabic: "النَّافِعُ", transliteration: "An-Nafi", meaning: "The Benefactor", description: "The One who gives benefits to whoever He wills." },
  { number: 93, arabic: "النُّورُ", transliteration: "An-Nur", meaning: "The Light", description: "The One who guides." },
  { number: 94, arabic: "الْهَادِي", transliteration: "Al-Hadi", meaning: "The Guide", description: "The One who guides." },
  { number: 95, arabic: "الْبَدِيعُ", transliteration: "Al-Badi", meaning: "The Originator", description: "The One who created the creation and formed it without any preceding example." },
  { number: 96, arabic: "اَلْبَاقِي", transliteration: "Al-Baqi", meaning: "The Everlasting", description: "The One that the state of non-existence is impossible for Him." },
  { number: 97, arabic: "الْوَارِثُ", transliteration: "Al-Warith", meaning: "The Inheritor", description: "The One whose Existence remains." },
  { number: 98, arabic: "الرَّشِيدُ", transliteration: "Ar-Rashid", meaning: "The Guide to the Right Path", description: "The One who guides." },
  { number: 99, arabic: "الصَّبُورُ", transliteration: "As-Sabur", meaning: "The Patient", description: "The One who does not quickly punish the sinners." },
];

const FAVORITES_KEY = 'names-of-allah-favorites';

export default function NamesOfAllah() {
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const toggleFavorite = (number: number) => {
    const newFavorites = favorites.includes(number)
      ? favorites.filter(n => n !== number)
      : [...favorites, number];
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  const filteredNames = namesOfAllah.filter(name => {
    const matchesSearch = 
      name.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.arabic.includes(searchQuery);
    
    if (showFavoritesOnly) {
      return matchesSearch && favorites.includes(name.number);
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppBar title="99 Names of Allah" showBack />
      
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/20">
          <CardContent className="p-4 text-center">
            <h1 className="text-2xl font-arabic mb-2">أَسْمَاءُ اللهِ الْحُسْنَى</h1>
            <p className="text-sm text-muted-foreground">
              The Beautiful Names of Allah
            </p>
          </CardContent>
        </Card>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Names Grid */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="grid grid-cols-1 gap-3">
            {filteredNames.map((name) => (
              <Card key={name.number} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {name.number}
                      </span>
                      <div>
                        <p className="font-medium">{name.transliteration}</p>
                        <p className="text-xs text-muted-foreground">{name.meaning}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleFavorite(name.number)}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(name.number) ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                  </div>
                  <p className="text-2xl font-arabic text-right text-primary mb-2" dir="rtl">
                    {name.arabic}
                  </p>
                  {name.description && (
                    <p className="text-xs text-muted-foreground">
                      {name.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {filteredNames.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No names found</p>
          </div>
        )}
      </div>
    </div>
  );
}
