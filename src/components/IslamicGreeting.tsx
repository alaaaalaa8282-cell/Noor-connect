import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface IslamicEvent {
  name: string;
  greeting: string;
  arabicGreeting: string;
  month: number;
  day: number;
  hijri?: boolean;
}

// Approximate Gregorian dates for 2024-2025 (these change yearly)
const islamicEvents: IslamicEvent[] = [
  { name: "Eid al-Fitr", greeting: "Eid Mubarak!", arabicGreeting: "عيد مبارك", month: 4, day: 10 },
  { name: "Eid al-Adha", greeting: "Eid Mubarak!", arabicGreeting: "عيد مبارك", month: 6, day: 16 },
  { name: "Ramadan", greeting: "Ramadan Mubarak!", arabicGreeting: "رمضان مبارك", month: 3, day: 11 },
  { name: "Islamic New Year", greeting: "Happy Islamic New Year!", arabicGreeting: "سنة هجرية مباركة", month: 7, day: 7 },
  { name: "Jumu'ah", greeting: "Jumu'ah Mubarak!", arabicGreeting: "جمعة مباركة", month: -1, day: 5 }, // Friday
];

export function IslamicGreeting() {
  const [greeting, setGreeting] = useState<IslamicEvent | null>(null);

  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Check for Friday (Jumu'ah)
    if (dayOfWeek === 5) {
      const friday = islamicEvents.find(e => e.day === 5 && e.month === -1);
      if (friday) {
        setGreeting(friday);
        return;
      }
    }

    // Check for special Islamic dates (approximate)
    const event = islamicEvents.find(e => e.month === month && e.day === day);
    if (event) {
      setGreeting(event);
    }
  }, []);

  if (!greeting) return null;

  return (

    <div className="mb-4">
      <div className="relative overflow-hidden rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 border border-primary/20 p-1 shadow-sm">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative flex items-center justify-center gap-4 py-2 px-6">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center">
            <span className="text-lg font-bold font-arabic text-primary leading-none mt-1">{greeting.arabicGreeting}</span>
            <span className="hidden sm:inline text-primary/30">•</span>
            <span className="text-sm font-medium text-foreground">{greeting.greeting}</span>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
