import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Moon, Sunrise, Sunset, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrayerTime } from "@/lib/time-formatter";
import type { PrayerTimesWithEnd } from "@/hooks/usePrayerTimes";

export interface RamadanWidgetProps {
  isRamadan: boolean;
  ramadanDay: number;
  prayerTimesWithEnd: PrayerTimesWithEnd | null;
  timeFormat: "12" | "24";
  timeZone?: string;
}

const formatCountdown = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

export function RamadanWidget({
  isRamadan,
  ramadanDay,
  prayerTimesWithEnd,
  timeFormat,
  timeZone,
}: RamadanWidgetProps) {
  const navigate = useNavigate();
  const [nextLabel, setNextLabel] = useState<string>("");
  const [nextTime, setNextTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  const fajrStart = prayerTimesWithEnd?.fajr?.start ?? null;
  const maghribStart = prayerTimesWithEnd?.maghrib?.start ?? null;

  const suhoorTimeText = useMemo(() => {
    if (!fajrStart) return "";
    return formatPrayerTime(fajrStart, timeFormat, timeZone);
  }, [fajrStart, timeFormat, timeZone]);

  const iftarTimeText = useMemo(() => {
    if (!maghribStart) return "";
    return formatPrayerTime(maghribStart, timeFormat, timeZone);
  }, [maghribStart, timeFormat, timeZone]);

  const computeNext = useCallback(() => {
    if (!isRamadan || !fajrStart || !maghribStart) {
      setNextLabel("");
      setNextTime(null);
      setCountdown("");
      return;
    }

    const now = new Date();

    // Ramadan day events:
    // - Before Fajr: Suhoor ends at Fajr
    // - Between Fajr and Maghrib: Iftar at Maghrib
    // - After Maghrib: Suhoor ends tomorrow (approx. +24h from today's Fajr)
    if (now < fajrStart) {
      setNextLabel("Suhoor ends");
      setNextTime(fajrStart);
      setCountdown(formatCountdown(fajrStart.getTime() - now.getTime()));
      return;
    }

    if (now < maghribStart) {
      setNextLabel("Iftar");
      setNextTime(maghribStart);
      setCountdown(formatCountdown(maghribStart.getTime() - now.getTime()));
      return;
    }

    const approxTomorrowFajr = new Date(fajrStart.getTime() + 24 * 60 * 60 * 1000);
    setNextLabel("Suhoor ends (tomorrow)");
    setNextTime(approxTomorrowFajr);
    setCountdown(formatCountdown(approxTomorrowFajr.getTime() - now.getTime()));
  }, [isRamadan, fajrStart, maghribStart]);

  useEffect(() => {
    computeNext();
    const id = window.setInterval(computeNext, 1000);
    return () => window.clearInterval(id);
  }, [computeNext]);

  const fastingProgress = useMemo(() => {
    if (!isRamadan || !fajrStart || !maghribStart) return null;
    const now = new Date();
    if (now <= fajrStart) return 0;
    if (now >= maghribStart) return 100;
    const total = maghribStart.getTime() - fajrStart.getTime();
    const done = now.getTime() - fajrStart.getTime();
    return Math.round((done / Math.max(1, total)) * 100);
  }, [isRamadan, fajrStart, maghribStart]);

  if (!isRamadan) {
    return (
      <Card className="relative overflow-hidden border-emerald-200/60 bg-gradient-to-br from-emerald-50/70 via-card to-transparent dark:from-emerald-950/20 dark:via-card dark:to-transparent">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Ramadan
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded-xl"
              onClick={() => navigate("/ramadan")}
            >
              Open
              <ArrowUpRight className="w-4 h-4 ms-1" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Set goals, track fasting, and get Suhoor/Iftar times.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="rounded-full">
              Not in Ramadan
            </Badge>
            <Badge variant="outline" className="rounded-full">
              Plan ahead
            </Badge>
          </div>
          <Button
            variant="default"
            size="sm"
            className="w-full rounded-xl"
            onClick={() => navigate("/ramadan")}
          >
            Open Ramadan Mode
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasTimes = Boolean(fajrStart && maghribStart);

  return (
    <Card className="relative overflow-hidden border-emerald-200/60 bg-gradient-to-br from-emerald-50/70 via-card to-transparent dark:from-emerald-950/20 dark:via-card dark:to-transparent">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            Ramadan
          </CardTitle>
          <Badge variant="secondary" className="rounded-full">
            Day {ramadanDay || "—"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasTimes ? (
          <div className="text-sm text-muted-foreground">
            Loading Suhoor and Iftar times…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl border border-border/60 bg-card/70">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Sunrise className="w-3.5 h-3.5" />
                  Suhoor ends
                </div>
                <div className="text-lg font-bold tabular-nums text-foreground">
                  {suhoorTimeText}
                </div>
              </div>
              <div className="p-3 rounded-2xl border border-border/60 bg-card/70">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Sunset className="w-3.5 h-3.5" />
                  Iftar
                </div>
                <div className="text-lg font-bold tabular-nums text-foreground">
                  {iftarTimeText}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-200/60">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-foreground">{nextLabel || "Next"}</span>
                </div>
                <span className="text-sm font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
                  {countdown || "—"}
                </span>
              </div>

              {typeof fastingProgress === "number" && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Fasting progress</span>
                    <span className="font-semibold">{fastingProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-emerald-900/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                      style={{ width: `${fastingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl"
              onClick={() => navigate("/ramadan")}
            >
              Open Ramadan Mode
              <ArrowUpRight className="w-4 h-4 ms-2" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default RamadanWidget;

