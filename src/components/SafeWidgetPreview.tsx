/**
 * SafeWidgetPreview - Wrapper component that safely renders widget previews
 * with error boundaries to prevent crashes and show fallback UI on errors
 */

import React, { Component, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  widgetName: string;
  onEnable?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class WidgetErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[SafeWidgetPreview] Error in ${this.props.widgetName}:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="overflow-hidden border-dashed border-amber-200/60 bg-amber-50/30">
          <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">Preview unavailable</p>
              <p className="text-xs text-amber-600/80 mt-1">
                This widget preview couldn't be loaded
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="text-xs h-8"
              >
                Retry
              </Button>
              {this.props.onEnable && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={this.props.onEnable}
                  className="text-xs h-8"
                >
                  Add Anyway
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Widget component imports
import { lazy, Suspense } from 'react';

// Lazy load widget components for safe preview
const QuranProgressWidget = lazy(() => import('./QuranProgressWidget'));
const IslamicEventsWidget = lazy(() => import('./IslamicEventsWidget'));
const PrayerStatsWidget = lazy(() => import('./PrayerStatsWidget'));
const WeatherWidget = lazy(() => import('./WeatherWidget'));
const RamadanWidget = lazy(() => import('./RamadanWidget'));

interface SafeWidgetPreviewProps {
  widgetId: string;
  isVisible: boolean;
  onEnable?: () => void;
}

// Loading fallback for lazy-loaded widgets
const WidgetLoadingFallback = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    </CardContent>
  </Card>
);

// Mini preview versions for widgets that need props
const MiniRamadanPreview = () => (
  <Card className="overflow-hidden border-emerald-200/60 bg-gradient-to-br from-emerald-50/70 via-card to-transparent">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-emerald-600 text-xs">🌙</span>
        </div>
        <div>
          <p className="text-sm font-semibold">Ramadan</p>
          <p className="text-xs text-muted-foreground">Suhoor & Iftar times</p>
        </div>
      </div>
      <div className="p-2 rounded-lg bg-emerald-100/50 text-xs text-emerald-800">
        Preview: Ramadan fasting tracker
      </div>
    </CardContent>
  </Card>
);

export function SafeWidgetPreview({ widgetId, isVisible, onEnable }: SafeWidgetPreviewProps) {
  const renderWidget = () => {
    switch (widgetId) {
      case 'quran-progress':
        return <QuranProgressWidget />;
      case 'islamic-events':
        return <IslamicEventsWidget />;
      case 'prayer-stats':
        return <PrayerStatsWidget />;
      case 'weather':
        return <WeatherWidget />;
      case 'ramadan':
        return <MiniRamadanPreview />;
      default:
        // For essential widgets or widgets without dedicated components,
        // show a generic preview
        return (
          <Card className="overflow-hidden border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Widget Preview</p>
                <p className="text-xs text-muted-foreground">
                  This widget will appear on your dashboard
                </p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  // For hidden widgets, we still want to show a preview
  // but it might be slightly dimmed to indicate it's not active
  return (
    <div className={isVisible ? '' : 'opacity-75 grayscale-[0.3]'}>
      <WidgetErrorBoundary widgetName={widgetId} onEnable={onEnable}>
        <Suspense fallback={<WidgetLoadingFallback />}>
          {renderWidget()}
        </Suspense>
      </WidgetErrorBoundary>
    </div>
  );
}

export default SafeWidgetPreview;
