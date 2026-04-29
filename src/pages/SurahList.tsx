import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Star, Clock, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
      <div className="min-h-screen bg-background relative overflow-hidden pb-24">
        {/* Decorative Background Map/Pattern */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-200/30 via-amber-100/10 to-transparent dark:from-amber-600/10 dark:via-amber-500/5 pointer-events-none" />
        <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-100/30 via-transparent to-transparent dark:from-emerald-500/10 pointer-events-none" />

        <AppBar title={ti18n('quran') || "Quran"} showBack />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-8 mt-2 lg:mt-6 pb-10">
          
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#d4af37] via-[#c5a028] to-[#a6861f] shadow-2xl shadow-amber-900/10 p-8 sm:p-12">
            {/* Islamic Geometric overlay (simulated with CSS layers) */}
            <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_2px_2px,_#ffffff_1px,_transparent_0)] bg-[length:24px_24px]" />
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10 text-center md:text-left">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-inner border border-white/20 shrink-0 transform -rotate-6 hover:rotate-0 transition-all duration-500">
                <BookOpen className="w-12 h-12 text-white drop-shadow-md" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 text-xs font-bold tracking-widest uppercase mb-4 hidden sm:inline-flex shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Al-Quran Al-Kareem
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-3 drop-shadow-lg tracking-tight">
                  The Holy Quran
                </h1>
                <p className="text-white/80 text-lg sm:text-xl font-medium tracking-wide">
                  Divine Guidance for Humanity
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 mt-8">
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/10 backdrop-blur-md border border-white/10 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 text-amber-100" />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-white font-bold text-sm">114 Surahs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/10 backdrop-blur-md border border-white/10 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-amber-100" />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-white font-bold text-sm">2 Translations</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/10 backdrop-blur-md border border-white/10 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-amber-100" />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-white font-bold text-sm">Read & Study</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative max-w-3xl mx-auto -mt-14 sm:-mt-16 z-20 px-2 sm:px-0">
            <div className="group shadow-2xl shadow-amber-900/5 dark:shadow-black/30 rounded-2xl bg-card/90 dark:bg-card/80 backdrop-blur-xl border border-border/50 p-2 flex items-center focus-within:ring-4 focus-within:ring-amber-500/20 transition-all duration-300">
              <div className="flex items-center justify-center w-14 shrink-0">
                 <Search className="w-6 h-6 text-amber-600/50 group-focus-within:text-amber-600 transition-colors duration-300" />
              </div>
              <Input
                placeholder="Search surah by name, number, or meaning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-0 shadow-none focus-visible:ring-0 bg-transparent text-lg h-14 placeholder:text-muted-foreground/50 font-medium px-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mr-2 rounded-full hover:bg-amber-100 text-amber-700/60 hover:text-amber-700 h-10 w-10 flex items-center justify-center shrink-0 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {searchQuery && (
            <div className="flex justify-center -mt-4 animate-in fade-in slide-in-from-top-2">
              <div className="px-5 py-2 bg-amber-100/50 text-amber-800 text-xs font-bold rounded-full border border-amber-200/50 uppercase tracking-widest shadow-sm">
                Found {filteredSurahs.length} surah{filteredSurahs.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSurahs.map((surah) => (
              <button
                key={surah.number}
                onClick={() => handleSurahClick(surah.number)}
                className="text-left group outline-none"
              >
                <div className="relative h-full bg-card rounded-3xl p-6 border border-border/50 shadow-sm hover:shadow-xl hover:shadow-amber-900/5 dark:hover:shadow-black/30 transition-all duration-300 transform group-hover:-translate-y-1.5 overflow-hidden ring-1 ring-border/40">
                  {/* Subtle background flair */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-50 dark:bg-amber-500/10 rounded-full blur-2xl -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className="absolute inset-0 bg-amber-50 dark:bg-amber-500/10 rotate-45 rounded-xl group-hover:rotate-90 group-hover:bg-amber-400 group-hover:shadow-md transition-all duration-700 ease-in-out border border-amber-100 dark:border-amber-500/20" />
                        <span className="relative z-10 font-bold text-[17px] text-amber-700 group-hover:text-white transition-colors duration-300">{surah.number}</span>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-transparent border 
                          ${surah.revelationType === "Meccan" 
                            ? "border-emerald-200 text-emerald-600 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" 
                            : "border-blue-200 text-blue-600 bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"}`}
                      >
                        {surah.revelationType}
                      </Badge>
                    </div>

                    {/* Name Row */}
                    <div className="space-y-1 mb-5">
                      <h3 className="font-bold text-xl text-foreground group-hover:text-amber-600 transition-colors">
                        {surah.englishName}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium truncate">
                        {surah.englishNameTranslation}
                      </p>
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-none px-2.5 py-1 text-[11px] font-bold tracking-wide">
                        {surah.numberOfAyahs} ayahs
                      </Badge>
                      <p className="font-arabic text-[26px] text-amber-600 group-hover:scale-110 transition-transform duration-500 transform origin-right drop-shadow-sm">
                        {surah.name}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredSurahs.length === 0 && (
             <div className="text-center py-24 px-6 bg-card/70 dark:bg-card/80 backdrop-blur-md rounded-[3rem] border border-border/50 shadow-xl shadow-amber-900/5 dark:shadow-black/30">
               <div className="w-24 h-24 mx-auto bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-amber-100 dark:border-amber-500/20">
                 <Search className="w-10 h-10 text-amber-400" />
               </div>
               <h3 className="text-2xl font-black text-foreground mb-2">No surahs found</h3>
               <p className="text-muted-foreground mb-8 font-medium max-w-md mx-auto">
                 We couldn't find any surahs matching the term &ldquo;<span className="text-foreground font-bold">{searchQuery}</span>&rdquo;. Try searching by another name or number.
               </p>
               <Button
                 onClick={() => setSearchQuery("")}
                 className="px-8 py-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
               >
                 Clear Search
               </Button>
             </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
