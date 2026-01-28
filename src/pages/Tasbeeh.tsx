import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTasbeehTotal, getTasbeehHistory, addTasbeehEntry, setTasbeehTotal } from "@/lib/storage";

const DHIKR_OPTIONS = [
  { value: "subhanallah", label: "سُبْحَانَ اللَّهِ", transliteration: "SubhanAllah" },
  { value: "alhamdulillah", label: "ٱلْحَمْدُ لِلَّٰهِ", transliteration: "Alhamdulillah" },
  { value: "allahuakbar", label: "اللَّٰهُ أَكْبَرُ", transliteration: "Allahu Akbar" },
  { value: "lailahaillallah", label: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", transliteration: "La ilaha illallah" },
  { value: "astagfirullah", label: "أَسْتَغْفِرُ ٱللَّٰهَ", transliteration: "Astagfirullah" },
];

const Tasbeeh = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedDhikr, setSelectedDhikr] = useState(DHIKR_OPTIONS[0].value);
  const [dailyHistory, setDailyHistory] = useState<{ date: string; count: number; label: string }[]>([]);

  const currentDhikr = DHIKR_OPTIONS.find(d => d.value === selectedDhikr) || DHIKR_OPTIONS[0];
  const label = `${currentDhikr.label} (${currentDhikr.transliteration})`;

  useEffect(() => {
    setTotalCount(getTasbeehTotal());
    setDailyHistory(getTasbeehHistory());
  }, []);

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    addTasbeehEntry(label);
    setTotalCount(getTasbeehTotal());
    setDailyHistory(getTasbeehHistory());
  };

  const handleReset = () => {
    setCount(0);
  };

  const nextMilestone = count < 33 ? 33 : count < 99 ? 99 : count < 100 ? 100 : Math.ceil((count + 1) / 100) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Tasbeeh</h1>
            <p className="text-xs text-muted-foreground">Digital Counter</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        {/* Dhikr Selector */}
        <Card className="p-3">
          <Select value={selectedDhikr} onValueChange={setSelectedDhikr}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {DHIKR_OPTIONS.map((dhikr) => (
                <SelectItem key={dhikr.value} value={dhikr.value}>
                  <span className="font-arabic">{dhikr.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">({dhikr.transliteration})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Main Counter */}
        <Card className="p-6 bg-primary text-primary-foreground border-0">
          <div className="text-center space-y-4">
            <p className="text-sm opacity-80">Current Count</p>
            <div className="text-7xl font-bold font-mono">{count}</div>
            <div>
              <p className="text-lg font-arabic">{currentDhikr.label}</p>
              <p className="text-sm opacity-80">{currentDhikr.transliteration}</p>
            </div>
            <p className="text-xs opacity-60">Next: {nextMilestone}</p>
            
            <button
              onClick={handleIncrement}
              className="w-28 h-28 mx-auto rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 active:scale-95 transition-all flex items-center justify-center text-3xl font-bold"
            >
              +1
            </button>

            <Button onClick={handleReset} variant="secondary" size="sm" className="bg-primary-foreground/10 border-0">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{totalCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">
                {dailyHistory.find(h => h.date === new Date().toLocaleDateString() && h.label === label)?.count || 0}
              </p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Tasbeeh;
