/**
 * Weekly Salah History Chart
 * Shows prayer completion over the past 7 days
 */
import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";
import { getPrayerHistory, type DailyPrayers } from "@/lib/salah-tracker";
import { Skeleton } from "@/components/LoadingSkeleton";

// Lazy load Recharts components to reduce bundle size
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })));
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })));
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));
const Cell = lazy(() => import('recharts').then(module => ({ default: module.Cell })));

interface ChartData {
  day: string;
  fullDate: string;
  completed: number;
  total: number;
}

export function WeeklySalahChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ completed: 0, total: 0, percentage: 0 });

  useEffect(() => {
    const history = getPrayerHistory(7);
    console.log('Prayer history data:', history); // Debug log
    
    // Reverse to show oldest first (left to right)
    const data = history.reverse().map((day: DailyPrayers) => {
      const completed = [day.fajr, day.dhuhr, day.asr, day.maghrib, day.isha].filter(Boolean).length;
      const date = new Date(day.date);
      return {
        day: date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2),
        fullDate: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        completed,
        total: 5
      };
    });
    
    console.log('Chart data:', data); // Debug log
    setChartData(data);
    
    // Calculate weekly stats
    const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);
    const totalPossible = 7 * 5;
    setWeeklyStats({
      completed: totalCompleted,
      total: totalPossible,
      percentage: Math.round((totalCompleted / totalPossible) * 100)
    });
  }, []);

  const getBarColor = (completed: number): string => {
    if (completed === 5) return "hsl(var(--primary))";
    if (completed >= 3) return "hsl(var(--primary) / 0.7)";
    if (completed >= 1) return "hsl(var(--primary) / 0.4)";
    return "hsl(var(--muted))";
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Weekly Progress
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span className="font-semibold text-primary">{weeklyStats.percentage}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Stats Summary */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-muted-foreground">
            {weeklyStats.completed} / {weeklyStats.total} prayers this week
          </span>
        </div>
        
        {/* Chart */}
        <div className="h-24 w-full">
          {chartData.length > 0 ? (
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="20%">
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis hide domain={[0, 5]} />
                  <Bar 
                    dataKey="completed" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.completed)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Suspense>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
              Loading chart...
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>5/5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary/70" />
            <span>3-4</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary/40" />
            <span>1-2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span>0</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
