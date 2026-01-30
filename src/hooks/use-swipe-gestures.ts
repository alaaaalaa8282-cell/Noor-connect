import { useRef, useEffect, useCallback } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefault?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGestures(options: SwipeOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefault = true
  } = options;

  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);

  const minSwipeDistance = threshold;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchEnd.current = null;
  }, [preventDefault]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefault && touchStart.current) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, [preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current || !touchEnd.current) return;

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;

    // Check if swipe was fast enough and far enough
    const isSwipe = Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance;
    const isQuickSwipe = deltaTime < 500; // Max 500ms for a swipe

    if (!isSwipe || !isQuickSwipe) return;

    // Determine swipe direction
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    // Reset
    touchStart.current = null;
    touchEnd.current = null;
  }, [minSwipeDistance, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const addGestureListeners = useCallback((element: HTMLElement) => {
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);

  return {
    addGestureListeners,
    // For direct use in components
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}
