/**
 * Prayer Stats Widget
 * Shows prayer tracking statistics and achievements
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Award, Target, Clock, CheckCircle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrayerStats {
  totalPrayers: number;
  onTimePrayers: number;
  missedPrayers: number;
  currentStreak: number;
  longestStreak: number;
  weeklyAverage: number;
  monthlyProgress: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

const STATS_STORAGE_KEY = "prayer-stats-data";

export function PrayerStatsWidget() {
  const [stats, setStats] = useState<PrayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const { toast } = useToast();

  const calculateStats = useCallback((): PrayerStats => {
    // This would typically integrate with your prayer tracking system
    // For now, we'll simulate with localStorage data
    const storedData = localStorage.getItem('prayer-tracking-data');
    const prayerData = storedData ? JSON.parse(storedData) : {};
    
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let totalPrayers = 0;
    let onTimePrayers = 0;
    let missedPrayers = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    
    // Calculate stats from stored prayer data
    Object.entries(prayerData).forEach(([date, dayPrayers]: [string, any]) => {
      const prayerDate = new Date(date);
      
      if (prayerDate >= weekAgo) {
        Object.values(dayPrayers).forEach((prayer: any) => {
          if (prayer && typeof prayer === 'object') {
            totalPrayers++;
            if (prayer.status === 'on-time') {
              onTimePrayers++;
            } else if (prayer.status === 'missed') {
              missedPrayers++;
            }
          }
        });
      }
    });
    
    // Calculate streak (simplified)
    currentStreak = Math.floor(Math.random() * 15) + 1; // Simulated
    longestStreak = Math.floor(Math.random() * 30) + currentStreak; // Simulated
    
    const weeklyAverage = totalPrayers / 7;
    const monthlyProgress = (onTimePrayers / Math.max(totalPrayers, 1)) * 100;
    
    // Generate achievements based on stats
    const achievements: Achievement[] = [
      {
        id: 'first-week',
        title: 'Consistent Worshipper',
        description: 'Completed all prayers for a week',
        icon: '🏆',
        unlockedAt: currentStreak >= 7 ? new Date().toISOString() : undefined
      },
      {
        id: 'on-time-master',
        title: 'Punctual Muslim',
        description: '80% prayers on time this month',
        icon: '⏰',
        unlockedAt: monthlyProgress >= 80 ? new Date().toISOString() : undefined
      },
      {
        id: 'streak-warrior',
        title: 'Streak Master',
        description: '15 day prayer streak',
        icon: '🔥',
        unlockedAt: currentStreak >= 15 ? new Date().toISOString() : undefined
      }
    ];
    
    return {
      totalPrayers,
      onTimePrayers,
      missedPrayers,
      currentStreak,
      longestStreak,
      weeklyAverage,
      monthlyProgress,
      achievements
    };
  }, []);

  const loadStats = useCallback(() => {
    setLoading(true);
    try {
      const calculatedStats = calculateStats();
      setStats(calculatedStats);
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(calculatedStats));
    } catch (error) {
      console.error('Error loading prayer stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prayer statistics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [calculateStats, toast]);

  useEffect(() => {
    loadStats();

    // Listen for prayer tracking updates
    const handlePrayerUpdate = () => {
      loadStats();
    };

    // Listen for widget refresh events
    const handleRefresh = () => {
      loadStats();
    };

    window.addEventListener('prayer-tracked', handlePrayerUpdate);
    window.addEventListener('widget-refresh', handleRefresh);

    return () => {
      window.removeEventListener('prayer-tracked', handlePrayerUpdate);
      window.removeEventListener('widget-refresh', handleRefresh);
    };
  }, [loadStats]);

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-green-600 bg-green-50 border-green-200';
    if (streak >= 14) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (streak >= 7) return 'text-purple-600 bg-purple-50 border-purple-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="relative overflow-hidden border-purple-200 bg-gradient-to-br from-purple-50/50 to-transparent transition-all duration-500 hover:shadow-lg hover:shadow-purple-100">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-100/30 rounded-full blur-2xl" />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Prayer Statistics
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={timeRange === 'week' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs rounded-lg"
              onClick={() => setTimeRange('week')}
            >
              Week
            </Button>
            <Button
              variant={timeRange === 'month' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs rounded-lg"
              onClick={() => setTimeRange('month')}
            >
              Month
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200/50">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground">On Time</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {stats.onTimePrayers}
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.onTimePrayers / Math.max(stats.totalPrayers, 1)) * 100)}% rate
            </p>
          </div>
          
          <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200/50">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-muted-foreground">Total</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {stats.totalPrayers}
            </p>
            <p className="text-xs text-muted-foreground">
              {timeRange === 'week' ? 'This week' : 'This month'}
            </p>
          </div>
        </div>

        {/* Current Streak */}
        <div className={`p-3 rounded-xl border ${getStreakColor(stats.currentStreak)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Current Streak</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
              <p className="text-xs">days</p>
            </div>
          </div>
          {stats.longestStreak > stats.currentStreak && (
            <p className="text-xs mt-1">
              Longest: {stats.longestStreak} days
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Prayer Performance</span>
            <span className="text-muted-foreground">
              {Math.round(stats.monthlyProgress)}%
            </span>
          </div>
          <Progress 
            value={stats.monthlyProgress} 
            className="h-2"
            // @ts-expect-error - CSS custom property type not recognized
            style={{ '--progress-background': getProgressColor(stats.monthlyProgress) }}
          />
        </div>

        {/* Achievements */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-600" />
            Recent Achievements
          </h4>
          <div className="space-y-2">
            {stats.achievements
              .filter(achievement => achievement.unlockedAt)
              .slice(0, 2)
              .map(achievement => (
                <div key={achievement.id} className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50/50 border border-yellow-200/50">
                  <span className="text-lg">{achievement.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 border-purple-300 hover:bg-purple-50"
          onClick={() => window.location.href = '/salah-tracker'}
        >
          <Calendar className="w-4 h-4" />
          View Detailed Stats
        </Button>
      </CardContent>
    </Card>
  );
}

export default PrayerStatsWidget;
