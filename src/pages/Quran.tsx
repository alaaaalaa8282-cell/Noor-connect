import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Play, Search, Sparkles, BookMarked, History, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageTransition } from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { AppBar } from "@/components/AppBar";

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
  const { t } = useLanguage();
  const [surahs, setSurahs] = useState<Surah[]>(() => {
    try {
      const cached = localStorage.getItem('quran-surahs-cache');
      if (cached) return JSON.parse(cached);
    } catch (error) {
      console.warn("localStorage cache load failed:", error);
    }
    return [];
  });
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>(surahs);
  const [loading, setLoading] = useState(surahs.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRead, setLastRead] = useState<{ number: number; name: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('quran-last-read');
    if (saved) setLastRead(JSON.parse(saved));

    const fetchSurahs = async () => {
      try {
        const response = await fetch("https://api.alquran.cloud/v1/surah");
        const data = await response.json();
        setSurahs(data.data);
        setFilteredSurahs(prev => searchQuery ? prev : data.data);
        try { localStorage.setItem('quran-surahs-cache', JSON.stringify(data.data)); } catch (error) { console.warn("localStorage cache save failed:", error); }
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
    <PageTransition>
      <div className="min-h-screen bg-background pb-20">
        <AppBar title={t('quran')} showBack />

        <div className="max-w-lg mx-auto px-5 py-4 space-y-6">

          {/* Premium Hero Section */}
          <div className="relative overflow-hidden rounded-[32px] bg-[#1a4a4a] p-8 shadow-xl shadow-emerald-500/10">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Al-Qur'an Al-Kareem</span>
              </div>

              <h1 className="text-3xl font-black text-white mb-2 font-arabic tracking-tight">The Noble Qur'an</h1>
              <p className="text-white/60 text-xs font-medium max-w-[200px]">Read, listen, and contemplate the words of Allah.</p>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mt-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
                  <p className="text-primary text-sm font-black">114</p>
                  <p className="text-white/40 text-[9px] uppercase font-bold">Surahs</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
                  <p className="text-primary text-sm font-black">6236</p>
                  <p className="text-white/40 text-[9px] uppercase font-bold">Ayahs</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
                  <p className="text-primary text-sm font-black">30</p>
                  <p className="text-white/40 text-[9px] uppercase font-bold">Juz</p>
                </div>
              </div>
            </div>
          </div>

          {/* Last Read Card */}
          {lastRead && (
            <button
              onClick={() => navigate(`/quran-reader/${lastRead.number}`)}
              className="w-full flex items-center p-4 bg-primary/10 border border-primary/20 rounded-2xl gap-4 hover:bg-primary/15 transition-all group active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <History className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Continue Reading</p>
                <h3 className="text-lg font-black">{lastRead.name}</h3>
              </div>
              <ChevronRight className="w-5 h-5 text-primary opacity-50" />
            </button>
          )}

          {/* Search Header */}
          <div className="sticky top-[4.5rem] z-30 bg-background/80 backdrop-blur-xl py-2 -mx-5 px-5">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <Input
                placeholder="Search by Surah name or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 bg-card/50 border-border/40 rounded-2xl focus:ring-primary/20"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-2xl" />
              ))
            ) : (
              <AnimatePresence>
                {filteredSurahs.map((surah) => (
                  <motion.div
                    key={surah.number}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => navigate(`/quran-reader/${surah.number}`)}
                      className="w-full flex items-center p-4 bg-card border border-border/40 rounded-2xl hover:bg-muted/30 transition-all group active:scale-[0.99] text-left"
                    >
                      {/* Number Plate */}
                      <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                        <div className="absolute inset-0 bg-primary/10 rotate-45 rounded-xl group-hover:rotate-[135deg] transition-transform duration-500" />
                        <span className="relative z-10 font-black text-primary text-xs">{surah.number}</span>
                      </div>

                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-[15px] group-hover:text-primary transition-colors">{surah.englishName}</h3>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                              {surah.revelationType} • {surah.numberOfAyahs} Ayahs
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-arabic text-xl text-primary drop-shadow-sm">{surah.name}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {!loading && filteredSurahs.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No surahs found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Quran;
