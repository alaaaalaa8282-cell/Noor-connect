// Performance monitoring utilities for Noor Connect

export interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay  
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  loadTime: number; // Page load time
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initObservers();
  }

  private initObservers() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        console.log(`LCP: ${lastEntry.startTime}ms`);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    }

    // First Input Delay
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart) {
            this.metrics.fid = entry.processingStart - entry.startTime;
            console.log(`FID: ${this.metrics.fid}ms`);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.metrics.cls = clsValue;
        console.log(`CLS: ${clsValue}`);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }

    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime;
          console.log(`FCP: ${fcpEntry.startTime}ms`);
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    }
  }

  // Get Time to First Byte
  getTTFB(): number {
    if (performance.timing) {
      return performance.timing.responseStart - performance.timing.navigationStart;
    }
    return 0;
  }

  // Get total page load time
  getLoadTime(): number {
    if (performance.timing) {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    }
    return 0;
  }

  // Get all current metrics
  getMetrics(): PerformanceMetrics {
    return {
      lcp: this.metrics.lcp || 0,
      fid: this.metrics.fid || 0,
      cls: this.metrics.cls || 0,
      fcp: this.metrics.fcp || 0,
      ttfb: this.getTTFB(),
      loadTime: this.getLoadTime()
    };
  }

  // Log performance summary
  logPerformanceSummary() {
    const metrics = this.getMetrics();
    console.group('🚀 Noor Connect Performance Metrics');
    console.log(`Largest Contentful Paint (LCP): ${metrics.lcp.toFixed(2)}ms ${this.getRating('lcp', metrics.lcp)}`);
    console.log(`First Input Delay (FID): ${metrics.fid.toFixed(2)}ms ${this.getRating('fid', metrics.fid)}`);
    console.log(`Cumulative Layout Shift (CLS): ${metrics.cls.toFixed(3)} ${this.getRating('cls', metrics.cls)}`);
    console.log(`First Contentful Paint (FCP): ${metrics.fcp.toFixed(2)}ms ${this.getRating('fcp', metrics.fcp)}`);
    console.log(`Time to First Byte (TTFB): ${metrics.ttfb.toFixed(2)}ms ${this.getRating('ttfb', metrics.ttfb)}`);
    console.log(`Page Load Time: ${metrics.loadTime.toFixed(2)}ms`);
    console.groupEnd();
  }

  // Get performance rating
  private getRating(metric: keyof PerformanceMetrics, value: number): string {
    const ratings = {
      lcp: { good: 2500, needsImprovement: 4000 },
      fid: { good: 100, needsImprovement: 300 },
      cls: { good: 0.1, needsImprovement: 0.25 },
      fcp: { good: 1800, needsImprovement: 3000 },
      ttfb: { good: 800, needsImprovement: 1800 }
    };

    const threshold = ratings[metric];
    if (!threshold) return '';

    if (value <= threshold.good) return '✅ Good';
    if (value <= threshold.needsImprovement) return '⚠️ Needs Improvement';
    return '❌ Poor';
  }

  // Cleanup observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Report metrics to analytics (placeholder for future implementation)
  reportMetrics() {
    const metrics = this.getMetrics();
    // TODO: Send to analytics service
    console.log('Performance metrics ready for reporting:', metrics);
  }
}

// Initialize performance monitoring
export const performanceMonitor = new PerformanceMonitor();

// Auto-report metrics when page loads
window.addEventListener('load', () => {
  setTimeout(() => {
    performanceMonitor.logPerformanceSummary();
    performanceMonitor.reportMetrics();
  }, 1000);
});

// Export utilities for manual performance tracking
export const measureFunction = <T extends (...args: any[]) => any>(fn: T, name: string): T => {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(`${name} took ${(end - start).toFixed(2)}ms`);
    return result;
  }) as T;
};

export const markPerformance = (name: string) => {
  if (performance.mark) {
    performance.mark(name);
  }
};

export const measurePerformance = (name: string, startMark: string) => {
  if (performance.measure) {
    performance.measure(name, startMark);
    const measures = performance.getEntriesByName(name, 'measure');
    if (measures.length > 0) {
      console.log(`${name}: ${measures[0].duration.toFixed(2)}ms`);
    }
  }
};
