/**
 * Qaza (Missed Prayer) Tracker Component
 * Track and complete missed prayers
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, AlertCircle, Check } from "lucide-react";
import { 
  getQazaPrayers, 
  addQazaPrayer, 
  completeQazaPrayer,
  setQazaCount,
  getQazaStats,
  type PrayerName 
} from "@/lib/qaza-tracker";
import { useToast } from "@/hooks/use-toast";

const prayerLabels: { id: PrayerName; label: string; arabicLabel: string }[] = [
  { id: "fajr", label: "Fajr", arabicLabel: "الفجر" },
  { id: "dhuhr", label: "Dhuhr", arabicLabel: "الظهر" },
  { id: "asr", label: "Asr", arabicLabel: "العصر" },
  { id: "maghrib", label: "Maghrib", arabicLabel: "المغرب" },
  { id: "isha", label: "Isha", arabicLabel: "العشاء" },
];

interface QazaTrackerProps {
  compact?: boolean;
}

export function QazaTracker({ compact = false }: QazaTrackerProps) {
  const [prayers, setPrayers] = useState<Record<PrayerName, number>>({
    fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0
  });
  const [stats, setStats] = useState({ total: 0, byPrayer: prayers });
  const [editMode, setEditMode] = useState<PrayerName | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setPrayers(getQazaPrayers());
    setStats(getQazaStats());
  }, []);

  const refresh = () => {
    setPrayers(getQazaPrayers());
    setStats(getQazaStats());
  };

  const handleAdd = (prayer: PrayerName) => {
    addQazaPrayer(prayer, 1);
    refresh();
  };

  const handleComplete = (prayer: PrayerName) => {
    if (prayers[prayer] > 0) {
      completeQazaPrayer(prayer, 1);
      refresh();
      toast({ 
        title: "Prayer completed", 
        description: `MashaAllah! ${prayerLabels.find(p => p.id === prayer)?.label} Qaza marked as prayed.`
      });
    }
  };

  const handleEditStart = (prayer: PrayerName) => {
    setEditMode(prayer);
    setEditValue(prayers[prayer].toString());
  };

  const handleEditSave = () => {
    if (editMode) {
      const count = parseInt(editValue) || 0;
      setQazaCount(editMode, count);
      setEditMode(null);
      refresh();
    }
  };

  if (compact) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Qaza Prayers
            </CardTitle>
            {stats.total > 0 && (
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-medium">
                {stats.total} to make up
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {stats.total === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-2">
              ✨ No Qaza prayers pending. Alhamdulillah!
            </p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {prayerLabels.map((prayer) => (
                <div key={prayer.id} className="text-center">
                  <button
                    onClick={() => handleComplete(prayer.id)}
                    disabled={prayers[prayer.id] === 0}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all mx-auto ${
                      prayers[prayer.id] > 0
                        ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {prayers[prayer.id]}
                  </button>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {prayer.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Qaza Prayer Tracker
          </CardTitle>
          {stats.total > 0 && (
            <span className="text-sm bg-destructive/10 text-destructive px-3 py-1 rounded-full font-medium">
              Total: {stats.total}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Track and complete missed prayers
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {prayerLabels.map((prayer) => (
          <div 
            key={prayer.id} 
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="text-center min-w-[40px]">
                <span className="text-lg font-bold">{prayers[prayer.id]}</span>
              </div>
              <div>
                <p className="font-medium text-sm">{prayer.label}</p>
                <p className="text-[10px] text-muted-foreground font-arabic">{prayer.arabicLabel}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {editMode === prayer.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-16 h-8 text-center text-sm"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleEditSave}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-primary hover:bg-primary/10"
                    onClick={() => handleComplete(prayer.id)}
                    disabled={prayers[prayer.id] === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8"
                    onClick={() => handleEditStart(prayer.id)}
                  >
                    <span className="text-xs font-medium">#</span>
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleAdd(prayer.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {stats.total === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              ✨ No Qaza prayers pending. Alhamdulillah!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
