import { useState } from "react";
import { moods, Mood, MoodContent } from "@/data/mood-data";
import { Card } from "./ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Play, Copy, Check } from "lucide-react";
import { useGlobalQuran } from "@/lib/global-quran";
import { useToast } from "@/hooks/use-toast";

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
        // Auto-play the surah
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
        <div className="space-y-3 mb-6 animate-in slide-in-from-right duration-500 delay-200">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-lg text-primary/90">How are you feeling?</h3>
                <span className="text-xs text-muted-foreground">Islamic Remedies</span>
            </div>

            <ScrollArea className="w-full whitespace-nowrap pb-2">
                <div className="flex w-max space-x-3 px-1">
                    {moods.map((mood) => {
                        const Icon = mood.icon;
                        return (
                            <button
                                key={mood.id}
                                onClick={() => handleMoodClick(mood)}
                                className={`group relative flex flex-col items-center justify-center gap-2 p-4 w-24 h-24 rounded-2xl border transition-all duration-300 hover:scale-105 active:scale-95 text-center
                    backdrop-blur-sm bg-card/40 border-border/40 hover:border-primary/50 shadow-sm
                    hover:shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]
                 `}
                            >
                                <div className={`p-2 rounded-full bg-gradient-to-br ${mood.gradient} group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-5 h-5 ${mood.color.replace('bg-', 'text-')}`} />
                                </div>
                                <span className="text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors">
                                    {mood.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </ScrollArea>

            {/* Mood Details Drawer */}
            <Drawer open={!!selectedMood} onOpenChange={(open) => !open && setSelectedMood(null)}>
                <DrawerContent className="max-h-[80vh]">
                    <DrawerHeader className="text-center">
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-gradient-to-br ${selectedMood?.gradient}`}>
                            {selectedMood && <selectedMood.icon className={`w-6 h-6 ${selectedMood.color.replace('bg-', 'text-')}`} />}
                        </div>
                        <DrawerTitle className="text-2xl font-bold">
                            Feeling {selectedMood?.label}?
                        </DrawerTitle>
                        <DrawerDescription>
                            Remedies from the Quran and Sunnah
                        </DrawerDescription>
                    </DrawerHeader>

                    <ScrollArea className="p-4 pt-0 overflow-y-auto">
                        <div className="space-y-4 pb-8">
                            {selectedMood?.content.map((item, idx) => (
                                <Card key={idx} className="p-4 space-y-3 border-l-4 border-l-primary/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary uppercase tracking-wider">
                                            {item.type}
                                        </span>
                                        <div className="flex gap-1">
                                            {item.type === 'surah' && item.surahNumber && (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary" onClick={() => handlePlaySurah(item.surahNumber!, item.reference)}>
                                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                                </Button>
                                            )}
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-muted" onClick={() => handleCopy(`${item.arabic}\n\n${item.text} - ${item.reference}`, idx)}>
                                                {copiedIndex === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {item.arabic && (
                                            <p className="font-arabic text-xl text-right leading-loose text-foreground/90">{item.arabic}</p>
                                        )}
                                        <p className="text-sm text-foreground/80 leading-relaxed italic">
                                            "{item.text}"
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium text-right">
                                            — {item.reference}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
