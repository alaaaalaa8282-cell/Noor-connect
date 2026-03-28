/**
 * Enhanced Cycle Calendar View
 * Full monthly calendar with cycle phase visualization
 */

import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Droplets, Flower2, Sun, Moon, AlertCircle, Calendar, Activity, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { determinePhase, getPhaseColor as getPhaseHex } from '@/lib/menstrual-storage';
import type { CycleRecord, DailySymptoms, CyclePhase } from '@/types/menstrual';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths, isWithinInterval } from 'date-fns';

interface CycleCalendarViewProps {
  cycles: CycleRecord[];
  activeCycle: CycleRecord | null;
  profileId?: string;
  onDaySelect?: (date: Date, symptoms: DailySymptoms | null) => void;
}

const PHASE_COLORS: Record<CyclePhase, { bg: string; text: string; border: string; label: string }> = {
  menstrual: { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-500', label: 'Menstrual' },
  follicular: { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-500', label: 'Follicular' },
  ovulatory: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-500', label: 'Ovulatory' },
  luteal: { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-500', label: 'Luteal' },
  premenstrual: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500', label: 'Premenstrual' },
};

const PHASE_ICONS: Record<CyclePhase, React.ComponentType<any>> = {
  menstrual: Droplets,
  follicular: Flower2,
  ovulatory: Sun,
  luteal: Moon,
  premenstrual: AlertCircle,
};

const FLOW_LABELS: Record<string, string> = {
  none: 'None',
  spotting: 'Spotting',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};

export function CycleCalendarView({ cycles, activeCycle, profileId, onDaySelect }: CycleCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<DailySymptoms | null>(null);

  // Build a map of date -> phase from cycle data
  const datePhaseMap = useMemo(() => {
    const map = new Map<string, { phase: CyclePhase; cycleDay: number }>();

    for (const cycle of cycles) {
      const start = new Date(cycle.startDate);
      const end = cycle.endDate ? new Date(cycle.endDate) : new Date();
      const days = eachDayOfInterval({ start, end });

      days.forEach((day, index) => {
        const cycleDay = index + 1;
        const { phase } = determinePhase(cycleDay, cycle.cycleLength || 28);
        const key = format(day, 'yyyy-MM-dd');
        map.set(key, { phase, cycleDay });
      });
    }

    return map;
  }, [cycles]);

  // Build a map of date -> symptoms
  const dateSymptomMap = useMemo(() => {
    const map = new Map<string, DailySymptoms>();
    for (const cycle of cycles) {
      for (const symptom of cycle.symptoms) {
        map.set(symptom.date, symptom);
      }
    }
    return map;
  }, [cycles]);

  // Calendar grid data
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPadding = getDay(monthStart);

    return { daysInMonth, startPadding };
  }, [currentMonth]);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    const key = format(date, 'yyyy-MM-dd');
    const symptoms = dateSymptomMap.get(key) || null;
    setSelectedSymptoms(symptoms);
    onDaySelect?.(date, symptoms);
  }, [dateSymptomMap, onDaySelect]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const getDayClasses = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const phaseInfo = datePhaseMap.get(key);
    const hasSymptoms = dateSymptomMap.has(key);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isDateToday = isToday(date);

    let classes = 'relative h-10 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all text-sm font-medium ';

    if (phaseInfo) {
      const colors = PHASE_COLORS[phaseInfo.phase];
      classes += `${colors.bg} ${colors.text} `;
    } else {
      classes += 'bg-muted/30 text-muted-foreground hover:bg-muted/50 ';
    }

    if (isSelected) {
      classes += 'ring-2 ring-primary ring-offset-2 ring-offset-background ';
    }

    if (isDateToday) {
      classes += 'font-bold ';
    }

    return classes;
  };

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Cycle Calendar
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-xs font-medium text-muted-foreground text-center p-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding for first week */}
        {Array.from({ length: calendarDays.startPadding }, (_, i) => (
          <div key={`pad-${i}`} className="h-10" />
        ))}

        {/* Days */}
        {calendarDays.daysInMonth.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const phaseInfo = datePhaseMap.get(key);
          const hasSymptoms = dateSymptomMap.has(key);

          return (
            <button
              key={key}
              onClick={() => handleDayClick(day)}
              className={getDayClasses(day)}
            >
              <span>{format(day, 'd')}</span>
              {hasSymptoms && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/80" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t">
        <div className="grid grid-cols-3 gap-2 text-xs">
          {Object.entries(PHASE_COLORS).map(([phase, colors]) => (
            <div key={phase} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${colors.bg}`} />
              <span>{colors.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h4>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedDate(null); setSelectedSymptoms(null); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {(() => {
            const key = format(selectedDate, 'yyyy-MM-dd');
            const phaseInfo = datePhaseMap.get(key);

            return (
              <div className="space-y-3">
                {phaseInfo && (
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = PHASE_ICONS[phaseInfo.phase];
                      return <Icon className="w-4 h-4" />;
                    })()}
                    <Badge className={`${PHASE_COLORS[phaseInfo.phase].bg} ${PHASE_COLORS[phaseInfo.phase].text}`}>
                      {PHASE_COLORS[phaseInfo.phase].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Day {phaseInfo.cycleDay}</span>
                  </div>
                )}

                {selectedSymptoms ? (
                  <div className="space-y-2">
                    {selectedSymptoms.flow && selectedSymptoms.flow !== 'none' && (
                      <div className="flex items-center gap-2 text-sm">
                        <Droplets className="w-4 h-4 text-rose-500" />
                        <span className="font-medium">Flow:</span>
                        <span>{FLOW_LABELS[selectedSymptoms.flow] || selectedSymptoms.flow}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'cramps', label: 'Cramps' },
                        { key: 'headaches', label: 'Headaches' },
                        { key: 'fatigue', label: 'Fatigue' },
                        { key: 'mood', label: 'Mood' },
                        { key: 'bloating', label: 'Bloating' },
                        { key: 'breastTenderness', label: 'Tenderness' },
                        { key: 'backache', label: 'Backache' },
                        { key: 'acne', label: 'Acne' },
                      ].map(({ key, label }) => {
                        const value = (selectedSymptoms as any)[key] || 0;
                        if (value === 0) return null;
                        return (
                          <div key={key} className="text-xs">
                            <span className="text-muted-foreground">{label}:</span>
                            <span className="ml-1 font-medium">{value}/5</span>
                          </div>
                        );
                      })}
                    </div>
                    {selectedSymptoms.notes && (
                      <p className="text-xs text-muted-foreground mt-2">{selectedSymptoms.notes}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No symptoms logged for this day</p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </Card>
  );
}

export default CycleCalendarView;
