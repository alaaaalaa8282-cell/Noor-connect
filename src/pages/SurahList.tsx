import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Star, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { quranService, type SurahInfo } from "@/lib/quran-service";
import { AppBar } from "@/components/AppBar";
import { PageTransition } from "@/components/PageTransition";
import { useI18n } from "@/hooks/useI18n";

export default function SurahList() {
  const navigate = useNavigate();
  const { t: ti18n } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");

  const allSurahs: SurahInfo[] = quranService.getAllSurahs();

  // Filter surahs based on search
  const filteredSurahs = searchQuery.trim()
    ? allSurahs.filter(
        (s) =>
          s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.includes(searchQuery) ||
          s.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.number.toString() === searchQuery
      )
    : allSurahs;

  const handleSurahClick = (surahNumber: number) => {
    navigate(`/quran/surah-${surahNumber}`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <AppBar title={ti18n('quran') || "Quran"} showBack />

        <div className="max-w-6xl mx-auto p-4 space-y-6">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/80 to-primary/60 p-8 text-white">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">The Holy Quran</h1>
                  <p className="text-white/90 text-lg">Divine Guidance for Humanity</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 mt-6 items-center">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <span className="font-medium">114 Surahs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-300" />
                  <span className="font-medium">2 Translations</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-300" />
                  <span className="font-medium">Read & Study</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <Input
              placeholder="Search surah by name, number, or meaning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-14 text-lg rounded-xl border-2 focus:border-primary/50 transition-all"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Search Stats */}
          {searchQuery && (
            <div className="text-center">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                Found {filteredSurahs.length} surah{filteredSurahs.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}

          {/* Surah Grid */}
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSurahs.map((surah) => (
                <button
                  key={surah.number}
                  onClick={() => handleSurahClick(surah.number)}
                  className="text-left group"
                >
                  <Card className="h-full hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer border-2 hover:border-primary/30">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                          <span className="font-bold text-lg text-primary">{surah.number}</span>
                        </div>
                        <Badge 
                          variant={surah.revelationType === "Meccan" ? "default" : "secondary"}
                          className="text-xs font-medium"
                        >
                          {surah.revelationType}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                            {surah.englishName}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {surah.englishNameTranslation}
                          </p>
                        </div>

                        {/* Arabic Name & Verses */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <p className="font-arabic text-xl text-primary/80">
                            {surah.name}
                          </p>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            {surah.numberOfAyahs} verses
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>

            {/* No Results */}
            {filteredSurahs.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No surahs found</h3>
                <p className="text-muted-foreground mb-4">
                  No surahs found for &ldquo;{searchQuery}&rdquo;
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="px-6"
                >
                  Clear Search
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </PageTransition>
  );
}
