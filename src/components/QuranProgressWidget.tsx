/**
 * Quran Progress Widget
 * Displays overall Quran reading progress including completed surahs, streak, and achievements
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Award, Calendar } from 'lucide-react';
import { quranFeaturesService } from '@/lib/quran-features';
import { useToast } from '@/hooks/use-toast';

interface OverallProgress {
  totalSurahs: number;
  completedSurahs: number;
  totalAyahs: number;
  completedAyahs: number;
  percentage: number;
}

interface QuranProgressWidgetProps {
  className?: string;
}

export function QuranProgressWidget({ className }: QuranProgressWidgetProps) {
  const [progress, setProgress] = useState<OverallProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const progressData = await quranFeaturesService.getOverallProgress();
        setProgress(progressData);
      } catch (error) {
        console.error('Error loading Quran progress:', error);
        toast({
          title: 'Error',
          description: 'Failed to load Quran progress',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, []);

  const getAchievementBadge = (percentage: number) => {
    if (percentage >= 100) return { icon: Award, text: 'Completed', color: 'bg-green-500' };
    if (percentage >= 75) return { icon: TrendingUp, text: 'Advanced', color: 'bg-purple-500' };
    if (percentage >= 50) return { icon: BookOpen, text: 'Progressing', color: 'bg-blue-500' };
    if (percentage >= 25) return { icon: Calendar, text: 'Started', color: 'bg-orange-500' };
    return { icon: BookOpen, text: 'Beginner', color: 'bg-gray-500' };
  };

  const getMotivationalMessage = (percentage: number) => {
    if (percentage >= 100) return '🎉 Congratulations! You have completed the entire Quran!';
    if (percentage >= 75) return '🌟 Excellent progress! You\'re almost there!';
    if (percentage >= 50) return '💪 Great job! Half way through the Quran!';
    if (percentage >= 25) return '📚 Keep going! You\'re building momentum!';
    return '🌱 Start your Quran journey today!';
  };

  if (loading) {
    return (
      <Card className={`${className || ''}`}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Quran Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-2/4 ml-2" />
              <div className="h-4 bg-muted rounded w-1/4 ml-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card className={`${className || ''}`}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Quran Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No progress data available</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => window.location.href = '/quran'}
            >
              Start Reading
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const achievement = getAchievementBadge(progress.percentage);
  const motivationalMessage = getMotivationalMessage(progress.percentage);

  return (
    <Card className={`${className || ''}`}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Quran Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Progress Display */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress.percentage / 100)}`}
                className="text-primary transition-all duration-500"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '48px 48px' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{Math.round(progress.percentage)}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-3xl font-bold text-primary">
              {progress.completedSurahs} / {progress.totalSurahs}
            </p>
            <p className="text-sm text-muted-foreground">Surahs Completed</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress.percentage} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {progress.completedAyahs.toLocaleString()} / {progress.totalAyahs.toLocaleString()} Ayahs Read
          </p>
        </div>

        {/* Achievement Badge */}
        <div className="flex items-center justify-center">
          <Badge className={`${achievement.color} text-white flex items-center gap-2 px-3 py-2`}>
            <achievement.icon className="w-4 h-4" />
            {achievement.text}
          </Badge>
        </div>

        {/* Motivational Message */}
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">{motivationalMessage}</p>
        </div>

        {/* Action Button */}
        <div className="text-center space-y-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => window.location.href = '/quran'}
            className="gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Continue Reading
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/quran-progress'}
            className="gap-2 w-full"
          >
            <TrendingUp className="w-4 h-4" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
