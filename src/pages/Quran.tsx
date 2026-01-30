import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Play, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

const Quran = () => {
  const navigate = useNavigate();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await fetch("https://api.alquran.cloud/v1/surah");
        const data = await response.json();
        setSurahs(data.data);
        setFilteredSurahs(data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  useEffect(() => {
    const filtered = surahs.filter(
      (surah) =>
        surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.name.includes(searchQuery) ||
        surah.number.toString().includes(searchQuery)
    );
    setFilteredSurahs(filtered);
  }, [searchQuery, surahs]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold font-arabic">القرآن الكريم</h1>
            <p className="text-sm text-primary">The Noble Qur'an</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Surah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 py-2 text-center">
          <div>
            <p className="text-xl font-bold text-primary">114</p>
            <p className="text-xs text-muted-foreground">Surahs</p>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <p className="text-xl font-bold text-primary">6236</p>
            <p className="text-xs text-muted-foreground">Ayahs</p>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <p className="text-xl font-bold text-primary">30</p>
            <p className="text-xs text-muted-foreground">Juz</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-2">
              {filteredSurahs.map((surah) => (
                <Card
                  key={surah.number}
                  className="p-3 hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/quran/${surah.number}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary text-sm">{surah.number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{surah.englishName}</p>
                        <p className="font-arabic text-base">{surah.name}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{surah.revelationType}</span>
                        <span className="text-xs text-muted-foreground">• {surah.numberOfAyahs} Ayahs</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/quran/${surah.number}`);
                      }}
                    >
                      <Play className="w-4 h-4 text-primary" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default Quran;
