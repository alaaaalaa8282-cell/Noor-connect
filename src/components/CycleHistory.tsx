/**
 * Cycle History Component
 * Displays historical cycle records with statistics
 */

import { useMemo } from 'react';
import { Calendar, Clock, Droplets, TrendingUp, Activity, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { CycleRecord, CycleStatistics } from '@/types/menstrual';
import { format, differenceInDays } from 'date-fns';

interface CycleHistoryProps {
  cycles: CycleRecord[];
  statistics: CycleStatistics | null;
  onCycleSelect?: (cycle: CycleRecord) => void;
}

export function CycleHistory({ cycles, statistics, onCycleSelect }: CycleHistoryProps) {
  const completedCycles = useMemo(() => {
    return cycles.filter(c => c.endDate).sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [cycles]);

  const activeCycles = useMemo(() => {
    return cycles.filter(c => !c.endDate);
  }, [cycles]);

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      {statistics && (
        <Card className="p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Cycle Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-rose-600">{statistics.averageCycleLength}</p>
              <p className="text-xs text-muted-foreground">Avg Cycle (days)</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{statistics.averagePeriodLength}</p>
              <p className="text-xs text-muted-foreground">Avg Period (days)</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600">
                {Math.round(statistics.cycleRegularity * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">Regularity</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-violet-600">{statistics.totalCyclesTracked}</p>
              <p className="text-xs text-muted-foreground">Cycles Tracked</p>
            </div>
          </div>

          {/* Regularity indicator */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Cycle Regularity</span>
              <span className="font-medium">{Math.round(statistics.cycleRegularity * 100)}%</span>
            </div>
            <Progress value={statistics.cycleRegularity * 100} className="h-2" />
          </div>

          {/* Range info */}
          {statistics.shortestCycle !== statistics.longestCycle && (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Shortest: {statistics.shortestCycle} days</span>
              <span>Longest: {statistics.longestCycle} days</span>
            </div>
          )}
        </Card>
      )}

      {/* Most Common Symptoms */}
      {statistics && statistics.mostCommonSymptoms.length > 0 && (
        <Card className="p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Most Common Symptoms
          </h3>
          <div className="space-y-2">
            {statistics.mostCommonSymptoms.map(({ symptom, averageSeverity }) => (
              <div key={symptom} className="flex items-center gap-3">
                <span className="text-sm capitalize min-w-[100px]">{symptom.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className="flex-1">
                  <Progress value={(averageSeverity / 5) * 100} className="h-2" />
                </div>
                <span className="text-xs font-medium w-8 text-right">{averageSeverity}/5</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Cycles */}
      {activeCycles.length > 0 && (
        <Card className="p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-rose-500" />
            Active Cycles
          </h3>
          <div className="space-y-2">
            {activeCycles.map(cycle => {
              const startDate = new Date(cycle.startDate);
              const daysActive = differenceInDays(new Date(), startDate) + 1;
              return (
                <div
                  key={cycle.id}
                  onClick={() => onCycleSelect?.(cycle)}
                  className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-200 dark:border-rose-800 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Started {format(startDate, 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {daysActive} day{daysActive !== 1 ? 's' : ''} active
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                      Active
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Completed Cycles */}
      <Card className="p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Cycle History
        </h3>
        {completedCycles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No completed cycles yet. Start tracking to build your history.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {completedCycles.map(cycle => {
              const startDate = new Date(cycle.startDate);
              const endDate = cycle.endDate ? new Date(cycle.endDate) : null;
              const duration = endDate ? differenceInDays(endDate, startDate) + 1 : 0;
              const symptomsCount = cycle.symptoms.length;
              const moodsCount = cycle.moodEntries.length;

              return (
                <div
                  key={cycle.id}
                  onClick={() => onCycleSelect?.(cycle)}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {format(startDate, 'MMM d')} - {endDate ? format(endDate, 'MMM d, yyyy') : 'Ongoing'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{duration} days</span>
                      {cycle.cycleLength && <span>Cycle: {cycle.cycleLength}d</span>}
                      {symptomsCount > 0 && <span>{symptomsCount} symptoms</span>}
                      {moodsCount > 0 && <span>{moodsCount} moods</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cycle.periodLength && (
                      <Badge variant="outline" className="text-xs">
                        {cycle.periodLength}d period
                      </Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default CycleHistory;
