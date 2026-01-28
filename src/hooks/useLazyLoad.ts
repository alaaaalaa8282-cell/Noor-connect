/**
 * Lazy Loading Hook for Performance Optimization
 * Uses Intersection Observer to load items as they come into view
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  initialLoadCount?: number;
  batchSize?: number;
}

export const useLazyLoad = <T,>(
  items: T[],
  options: UseLazyLoadOptions = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    initialLoadCount = 10,
    batchSize = 20
  } = options;

  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Initialize with first batch
  useEffect(() => {
    const initialBatch = items.slice(0, initialLoadCount);
    setVisibleItems(initialBatch);
    setHasMore(items.length > initialLoadCount);
  }, [items, initialLoadCount]);

  // Load more items
  const loadMore = useCallback(() => {
    if (!hasMore) return;

    const currentLength = visibleItems.length;
    const nextBatch = items.slice(currentLength, currentLength + batchSize);
    
    setVisibleItems(prev => [...prev, ...nextBatch]);
    setHasMore(currentLength + batchSize < items.length);
  }, [items, visibleItems.length, batchSize, hasMore]);

  // Setup Intersection Observer
  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, hasMore, loadMore]);

  return {
    visibleItems,
    hasMore,
    loadMoreRef,
    loadMore
  };
};

/**
 * Simple lazy load hook for individual items
 */
export const useLazyLoadItem = (
  options: IntersectionObserverInit = {}
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasLoaded, options.threshold, options.rootMargin]);

  return {
    elementRef,
    isVisible,
    hasLoaded
  };
};
