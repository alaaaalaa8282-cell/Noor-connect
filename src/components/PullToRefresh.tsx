import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  maxPull?: number;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  disabled = false,
  threshold = 80,
  maxPull = 120 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const touch = e.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    
    // Only enable pull-to-refresh at the top of the page
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 0) return;
    
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const touch = e.touches[0];
    currentY.current = touch.clientY;
    
    const deltaY = currentY.current - startY.current;
    
    // Only allow pulling down (negative delta)
    if (deltaY > 0) return;
    
    const distance = Math.abs(deltaY);
    const resistance = distance > threshold ? 0.3 : 1; // Add resistance after threshold
    const adjustedDistance = Math.min(distance * resistance, maxPull);
    
    setPullDistance(adjustedDistance);
    
    // Prevent default to stop page scroll when pulling
    if (deltaY < -10) {
      e.preventDefault();
    }
  }, [isPulling, disabled, isRefreshing, threshold, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled || isRefreshing) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(0);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const showRefreshIndicator = pullDistance > 20;

  return (
    <div ref={containerRef} className="relative min-h-full">
      {/* Pull to refresh indicator */}
      <div 
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center bg-background border-b border-border transition-all duration-200"
        style={{
          height: `${showRefreshIndicator ? pullDistance : 0}px`,
          opacity: pullProgress
        }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <div 
                className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full transition-transform duration-200"
                style={{ transform: `rotate(${pullProgress * 360}deg)` }}
              />
              <span>{pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}</span>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div 
        className="transition-transform duration-200"
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : 'translateY(0)'
        }}
      >
        {children}
      </div>
    </div>
  );
}
