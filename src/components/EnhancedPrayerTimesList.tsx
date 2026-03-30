import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Moon, Sun, Sunset, Cloud, CloudMoon, Calendar, BookOpen, Navigation, Calculator, Trophy, Star, Search, Loader2, Compass, Heart, ToggleLeft, ToggleRight, Sparkles, MessageCircle, Clock, TrendingUp, Award, Grid3X3, Building, Activity } from "lucide-react";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useLocationState } from "@/lib/location-state";
import { AladhanAPI } from "@/lib/aladhan-api";
import { type PrayerTime } from "@/lib/local-notifications";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingSkeleton";

const prayerIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Fajr: Moon,
  Sunrise: Sun,
  Dhuhr: Sun,
  Asr: Cloud,
  Maghrib: Sunset,
  Isha: CloudMoon,
};

export function EnhancedPrayerTimesList() {
  const { prayerTimesWithEnd, location, isLoading, error, needsManualLocation, refresh, setManualLocation } = usePrayerTimes();
  const timeZone = location?.timeZone;
  const locationState = useLocationState();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-14 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || needsManualLocation) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Compass className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            {error ? 'Error loading prayer times' : 'Please enable location to get accurate prayer times'}
          </p>
          <Button
            onClick={refresh}
            disabled={isLoading}
            className="bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {prayerTimesWithEnd.map((prayer, index) => {
        const now = new Date();
        const isNext = prayer.end > now && prayer.start <= now;
        const Icon = prayerIcons[prayer.name] || Clock;

        return (
          <motion.div
            key={prayer.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative group flex items-center justify-between rounded-xl p-3 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#e0c097] via-[#d4af37] to-[#c4a647] shadow-lg shadow-gold/30 text-white shrink-0 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500">
                <Icon className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{prayer.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{prayer.name === 'Fajr' ? 'Dawn' : prayer.name === 'Dhuhr' ? 'Noon' : prayer.name === 'Asr' ? 'Afternoon' : prayer.name === 'Maghrib' ? 'Sunset' : 'Night'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <p className={`text-lg font-bold ${isNext ? 'text-[#e0c097] group-hover:text-[#d4af37]' : 'text-slate-900 dark:text-white'}`}>
                {prayer.time}
              </p>
              {isNext && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-[#e0c097]/10 text-[#e0c097] group-hover:bg-[#e0c097]/20 transition-colors">
                  <Sparkles className="w-3 h-3" />
                  Next
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {locationState.latitude && locationState.longitude && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {location?.city || 'Unknown'}, {location?.country || 'Unknown'}
            </span>
            <span>
              {timeZone || '---'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}