import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, BellOff, Calendar, CheckCircle, Clock, Minus, Plus } from "lucide-react";
import { AppBar } from "@/components/AppBar";
import { LayoutManager } from "@/components/LayoutManager";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  activateMenstrualMode,
  deactivateMenstrualMode,
  getMenstrualModeData,
  updateCycleLengthDays,
  updateMenstrualModeSettings,
  type MenstrualModeData,
} from "@/lib/menstrual-mode";

const formatDateTime = (iso: string): string => {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDateOnly = (iso: string): string => {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export default function MenstrualMode() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [modeData, setModeData] = useState<MenstrualModeData>(() => getMenstrualModeData());

  useEffect(() => {
    const handleModeUpdate = () => {
      setModeData(getMenstrualModeData());
    };

    window.addEventListener("menstrual-mode-updated", handleModeUpdate);
    return () => window.removeEventListener("menstrual-mode-updated", handleModeUpdate);
  }, []);

  const activeDays = useMemo(() => {
    if (!modeData.isActive || !modeData.startedAt) return 0;

    const start = new Date(modeData.startedAt);
    const now = new Date();

    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);
    const nowDay = new Date(now);
    nowDay.setHours(0, 0, 0, 0);

    const diff = Math.floor((nowDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }, [modeData.isActive, modeData.startedAt]);

  const expectedEndDate = useMemo(() => {
    if (!modeData.startedAt) return null;
    const expected = new Date(modeData.startedAt);
    expected.setDate(expected.getDate() + modeData.cycleLengthDays - 1);
    return expected;
  }, [modeData.startedAt, modeData.cycleLengthDays]);

  const clearPrayerNotifications = async () => {
    try {
      const { localNotifications } = await import("@/lib/local-notifications");
      await localNotifications.clearPrayerNotifications();
    } catch (error) {
      console.error("Failed to clear prayer notifications:", error);
    }
  };

  const schedulePrayerNotifications = async () => {
    try {
      const { localNotifications } = await import("@/lib/local-notifications");
      await localNotifications.schedulePrayerNotificationsFromAPI();
    } catch (error) {
      console.error("Failed to reschedule prayer notifications:", error);
    }
  };

  const handleStartMode = async () => {
    const updated = activateMenstrualMode(new Date());
    setModeData(updated);

    // Disable the web adhan alarm state immediately while mode is active.
    localStorage.setItem("prayer-alarm-enabled", "false");

    if (updated.pausePrayerNotifications) {
      await clearPrayerNotifications();
    }

    toast({
      title: "Menstrual Mode enabled",
      description: "Prayer reminders and auto Qaza sync are paused while this mode is active.",
    });
  };

  const handleEndMode = async () => {
    const updated = deactivateMenstrualMode(new Date());
    setModeData(updated);

    if (updated.pausePrayerNotifications) {
      await schedulePrayerNotifications();
    }

    toast({
      title: "Menstrual Mode ended",
      description: "Prayer reminder scheduling has resumed.",
    });
  };

  const handleCycleLengthChange = (delta: number) => {
    const updated = updateCycleLengthDays(modeData.cycleLengthDays + delta);
    setModeData(updated);
  };

  const handlePauseNotificationsChange = async (checked: boolean) => {
    const updated = updateMenstrualModeSettings({ pausePrayerNotifications: checked });
    setModeData(updated);

    if (updated.isActive) {
      if (checked) {
        await clearPrayerNotifications();
      } else {
        await schedulePrayerNotifications();
      }
    }
  };

  const handlePauseQazaChange = (checked: boolean) => {
    const updated = updateMenstrualModeSettings({ pauseQazaAutoSync: checked });
    setModeData(updated);
  };

  return (
    <LayoutManager>
      <div className="min-h-screen bg-background">
        <AppBar title={t("menstrualMode")} />

        <div className="max-w-lg mx-auto p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{t("menstrualMode")}</h1>
              <p className="text-sm text-muted-foreground">Manage prayer reminders and tracking during your cycle</p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                modeData.isActive ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              {modeData.isActive ? "Active" : "Inactive"}
            </div>
          </div>

          <Card
            className={`p-4 space-y-4 ${
              modeData.isActive
                ? "bg-gradient-to-br from-rose-500/15 to-rose-600/5 border-rose-500/20"
                : "bg-muted/30"
            }`}
          >
            {modeData.isActive && modeData.startedAt ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">Menstrual Mode is active</p>
                    <p className="text-sm text-muted-foreground">Started: {formatDateTime(modeData.startedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{activeDays}</p>
                    <p className="text-xs text-muted-foreground">Day count</p>
                  </div>
                </div>

                {expectedEndDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Expected end: {formatDateOnly(expectedEndDate.toISOString())}</span>
                  </div>
                )}

                <Button className="w-full" variant="destructive" onClick={handleEndMode}>
                  End Menstrual Mode
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">Mode is currently off</p>
                  <p className="text-sm text-muted-foreground">
                    Start this mode to pause prayer reminders and auto Qaza sync based on your settings.
                  </p>
                </div>
                <Button className="w-full" onClick={handleStartMode}>
                  Start Menstrual Mode
                </Button>
              </>
            )}
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-medium">Typical cycle length</span>
            </div>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => handleCycleLengthChange(-1)}
                disabled={modeData.cycleLengthDays <= 3}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{modeData.cycleLengthDays}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => handleCycleLengthChange(1)}
                disabled={modeData.cycleLengthDays >= 15}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <BellOff className="w-5 h-5 text-primary" />
              <span className="font-medium">Mode behavior</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>Pause prayer reminders</Label>
                <p className="text-xs text-muted-foreground">Stops scheduled prayer notifications while active</p>
              </div>
              <Switch
                checked={modeData.pausePrayerNotifications}
                onCheckedChange={handlePauseNotificationsChange}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>Pause auto Qaza sync</Label>
                <p className="text-xs text-muted-foreground">Prevents missed-prayer auto addition while active</p>
              </div>
              <Switch checked={modeData.pauseQazaAutoSync} onCheckedChange={handlePauseQazaChange} />
            </div>
          </Card>

          <Card className="p-4 space-y-2 bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Notes</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This feature helps manage app behavior only. Follow your own fiqh guidance or scholar for rulings.
            </p>
          </Card>

          {modeData.history.length > 0 && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-medium">Recent sessions</span>
              </div>
              <div className="space-y-2">
                {modeData.history.slice(0, 5).map((entry, index) => (
                  <div key={`${entry.startedAt}-${entry.endedAt}-${index}`} className="rounded-lg bg-muted/40 p-3">
                    <p className="text-sm font-medium">{entry.durationDays} day session</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateOnly(entry.startedAt)} to {formatDateOnly(entry.endedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </LayoutManager>
  );
}
