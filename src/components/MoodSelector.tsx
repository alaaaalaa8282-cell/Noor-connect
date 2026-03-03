import { useState } from "react";
import { moods, type Mood, type MoodContent } from "@/data/mood-data";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Play, Copy, Check, Sparkles, BookOpen, Quote, Shuffle } from "lucide-react";
import { useGlobalQuran } from "@/lib/global-quran";
import { useToast } from "@/hooks/use-toast";
import { pickNonRepeatingIndex } from "@/lib/non-repeating-picker";

const storageKeyForMood = (moodId: string) => `dashboard-mood-remedy-${moodId}`;

const pickMoodIndex = (mood: Mood, exclude: number[] = []) =>
  pickNonRepeatingIndex({
    storageKey: storageKeyForMood(mood.id),
    length: mood.content.length,
    maxRecent: 3,
    exclude,
  });

const toCopyText = (item: MoodContent) =>
  `${item.arabic ? `${item.arabic}\n\n` : ""}${item.text}\n${item.reference}`;

export function MoodSelector() {
  const initialMood = moods[0] ?? null;
  const [selectedMood, setSelectedMood] = useState<Mood | null>(initialMood);
  const [activeIndexes, setActiveIndexes] = useState<Record<string, number>>(() => {
    if (!initialMood) return {};
    return { [initialMood.id]: pickMoodIndex(initialMood) };
  });
  const [copied, setCopied] = useState(false);
  const { playSurah, reciter } = useGlobalQuran();
  const { toast } = useToast();

  const currentIndex = selectedMood ? activeIndexes[selectedMood.id] ?? 0 : 0;
  const currentItem = selectedMood ? selectedMood.content[currentIndex] ?? selectedMood.content[0] : null;

  const handleMoodClick = (mood: Mood) => {
    setSelectedMood(mood);
    setActiveIndexes((prev) => {
      if (typeof prev[mood.id] === "number") return prev;
      return { ...prev, [mood.id]: pickMoodIndex(mood) };
    });
  };

  const handleAnotherRemedy = () => {
    if (!selectedMood) return;

    const nextIndex = pickMoodIndex(selectedMood, [currentIndex]);
    setActiveIndexes((prev) => ({ ...prev, [selectedMood.id]: nextIndex }));
  };

  const handlePlaySurah = () => {
    if (!selectedMood || !currentItem?.surahNumber) return;

    if (!reciter) {
      toast({
        title: "Reciter loading",
        description: "Please wait for the Quran player to initialize.",
        variant: "destructive",
      });
      return;
    }

    playSurah(currentItem.surahNumber, currentItem.reference, reciter);
    toast({
      title: "Playing Surah",
      description: `Now playing ${currentItem.reference}.`,
    });
  };

  const handleCopy = async () => {
    if (!currentItem) return;

    try {
      await navigator.clipboard.writeText(toCopyText(currentItem));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast({ title: "Remedy copied" });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard is not available on this device.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-8 space-y-4 rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-base font-bold tracking-tight text-foreground">Islamic Remedies</h3>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Mood guide
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {moods.map((mood) => {
          const Icon = mood.icon;
          const isActive = selectedMood?.id === mood.id;

          return (
            <button
              key={mood.id}
              type="button"
              onClick={() => handleMoodClick(mood)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/60 bg-background/70 text-foreground hover:border-primary/30 hover:bg-primary/5"
              }`}
              aria-label={`Show remedies for ${mood.label}`}
            >
              <Icon className={`h-4 w-4 ${mood.color}`} />
              <span>{mood.label}</span>
            </button>
          );
        })}
      </div>

      {selectedMood && currentItem ? (
        <Card className="space-y-4 border-border/60 bg-background/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl bg-gradient-to-br p-2 ${selectedMood.gradient}`}>
                <selectedMood.icon className={`h-5 w-5 ${selectedMood.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedMood.label} remedy</p>
                <p className="text-xs text-muted-foreground">{currentItem.reference}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              {currentItem.type === "surah" ? <BookOpen className="h-3 w-3" /> : <Quote className="h-3 w-3" />}
              {currentItem.type}
            </div>
          </div>

          {currentItem.arabic && (
            <p className="rounded-xl bg-muted/40 p-3 text-right font-arabic text-2xl leading-[1.9] text-foreground" dir="rtl">
              {currentItem.arabic}
            </p>
          )}

          <p className="rounded-xl border border-border/40 bg-card/70 p-3 text-sm leading-relaxed text-foreground/90">
            {currentItem.text}
          </p>

          <div className="flex flex-wrap gap-2">
            {currentItem.type === "surah" && currentItem.surahNumber && (
              <Button size="sm" className="rounded-full" onClick={handlePlaySurah}>
                <Play className="me-2 h-4 w-4" />
                Play Surah
              </Button>
            )}
            <Button size="sm" variant="secondary" className="rounded-full" onClick={handleCopy}>
              {copied ? <Check className="me-2 h-4 w-4" /> : <Copy className="me-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={handleAnotherRemedy}>
              <Shuffle className="me-2 h-4 w-4" />
              Another remedy
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
          Select a mood to get a Quran-based remedy.
        </Card>
      )}
    </div>
  );
}
