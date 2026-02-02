import { useState } from "react";
import { moods, Mood, MoodContent } from "@/data/mood-data";
import { Card } from "./ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Play, Copy, Check, Sparkles, BookOpen, Quote, X } from "lucide-react";
import { useGlobalQuran } from "@/lib/global-quran";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function MoodSelector() {
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
    const { playSurah, reciter } = useGlobalQuran();
    const { toast } = useToast();
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleMoodClick = (mood: Mood) => {
        setSelectedMood(mood);
    };

    const handlePlaySurah = (surahNumber: number, title: string) => {
        if (!reciter) {
            toast({
                title: "Reciter Loading",
                description: "Please wait for the audio player to initialize.",
                variant: "destructive"
            });
            return;
        }
        playSurah(surahNumber, title, reciter);
        toast({
            title: "Playing Surah",
            description: `Now playing ${title} for your mood.`
        });
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
        toast({ title: "Copied to clipboard" });
    };

    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl tracking-tight text-foreground">How are you feeling?</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">
                    Islamic Remedies
                </span>
            </div>

            <div className="relative group/scroll">
                <ScrollArea className="w-full whitespace-nowrap pb-4 outline-none border-none relative">
                    <div className="flex w-max space-x-3 sm:space-x-4 px-4 py-1">
                        {moods.map((mood, idx) => {
                            const Icon = mood.icon;
                            return (
                                <motion.button
                                    key={mood.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMoodClick(mood)}
                                    className={`group relative flex flex-col items-center justify-center gap-1.5 sm:gap-3 p-2 sm:p-4 w-20 h-20 sm:w-28 sm:h-28 rounded-[1.2rem] sm:rounded-[2rem] border transition-all duration-300
                    bg-card/40 border-border/40 backdrop-blur-md shadow-sm
                    hover:border-primary/40 hover:bg-card/60
                    ${mood.glow} hover:shadow-xl
                 `}
                                >
                                    {/* Inner Soft Glow Background */}
                                    <div className={`absolute inset-0 rounded-[1.25rem] sm:rounded-[2rem] bg-gradient-to-br ${mood.gradient} opacity-30 group-hover:opacity-50 transition-opacity`} />

                                    <div className={`relative p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-background/80 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                        <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${mood.color}`} />
                                    </div>

                                    <span className="relative text-[10px] sm:text-[11px] font-bold tracking-wide text-foreground/80 group-hover:text-primary transition-colors">
                                        {mood.label}
                                    </span>

                                    {/* Active Indicator Dot */}
                                    <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity`} />
                                </motion.button>
                            );
                        })}
                        {/* Peeking spacer to ensure last item is scrollable past the fade */}
                        <div className="w-10" />
                    </div>
                </ScrollArea>

                {/* Visual affordance for scrolling */}
                <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none z-10 sm:hidden" />

                <div className="flex items-center justify-center gap-2 mt-[-10px] opacity-40 group-hover/scroll:opacity-100 transition-opacity">
                    <div className="h-0.5 w-6 rounded-full bg-primary/20 overflow-hidden">
                        <motion.div
                            animate={{ x: [-24, 24] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="h-full w-full bg-primary/40"
                        />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Swipe to explore</span>
                    <div className="h-0.5 w-6 rounded-full bg-primary/20 overflow-hidden">
                        <motion.div
                            animate={{ x: [-24, 24] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="h-full w-full bg-primary/40"
                        />
                    </div>
                </div>
            </div>

            {/* Mood Details Drawer */}
            <Drawer open={!!selectedMood} onOpenChange={(open) => !open && setSelectedMood(null)}>
                <DrawerContent className="max-h-[85vh] border-t-0 bg-transparent p-0">
                    <div className="mx-auto w-full max-w-lg bg-background rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full ring-1 ring-border/50">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-muted-foreground/20" />

                        <DrawerHeader className="p-8 pb-4 text-center space-y-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br ${selectedMood?.gradient} shadow-2xl relative group`}
                            >
                                <div className="absolute inset-0 rounded-3xl bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                {selectedMood && <selectedMood.icon className={`w-10 h-10 ${selectedMood.color} relative z-10 drop-shadow-lg`} />}
                            </motion.div>

                            <div className="space-y-1">
                                <DrawerTitle className="text-3xl font-black tracking-tight text-center">
                                    Feeling <span className={`${selectedMood?.color}`}>{selectedMood?.label}</span>?
                                </DrawerTitle>
                                <DrawerDescription className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-1.5">
                                    <BookOpen className="w-4 h-4" /> Spiritual Healing & Comfort
                                </DrawerDescription>
                            </div>

                            {/* Hidden Close for Focus Trap */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-4 rounded-full opacity-40 hover:opacity-100"
                                onClick={() => setSelectedMood(null)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </DrawerHeader>

                        <ScrollArea className="flex-1 px-6 pb-12 overflow-y-auto">
                            <div className="space-y-6">
                                {selectedMood?.content.map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <Card className="overflow-hidden border-none bg-secondary/30 backdrop-blur-sm hover:bg-secondary/50 transition-colors group">
                                            <div className="p-6 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg bg-background shadow-sm border border-border/50`}>
                                                            {item.type === 'surah' ? <Play className="w-3 h-3 text-primary" /> : <Quote className="w-3 h-3 text-primary" />}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                                            {item.type}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {item.type === 'surah' && item.surahNumber && (
                                                            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-sm hover:bg-primary hover:text-white transition-all transform active:scale-90" onClick={() => handlePlaySurah(item.surahNumber!, item.reference)}>
                                                                <Play className="w-4 h-4 fill-current ml-0.5" />
                                                            </Button>
                                                        )}
                                                        <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-sm hover:bg-primary hover:text-white transition-all transform active:scale-90" onClick={() => handleCopy(`${item.arabic ? item.arabic + '\n\n' : ''}${item.text} - ${item.reference}`, idx)}>
                                                            {copiedIndex === idx ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {item.arabic && (
                                                        <p className="font-arabic text-3xl text-right leading-[1.8] text-foreground font-medium drop-shadow-sm">{item.arabic}</p>
                                                    )}
                                                    <div className="relative pl-4 border-l-2 border-primary/20">
                                                        <p className="text-[15px] text-foreground/80 leading-relaxed font-serif italic">
                                                            "{item.text}"
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-end pt-2">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-background/50 px-3 py-1.5 rounded-full ring-1 ring-border/50">
                                                            — {item.reference}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-6 bg-gradient-to-t from-background to-transparent pointer-events-none sticky bottom-0 flex justify-center pb-8 pt-12">
                            <Button variant="ghost" className="pointer-events-auto rounded-full bg-secondary/50 backdrop-blur-sm text-xs font-bold uppercase tracking-widest px-8" onClick={() => setSelectedMood(null)}>
                                Minimize
                            </Button>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

