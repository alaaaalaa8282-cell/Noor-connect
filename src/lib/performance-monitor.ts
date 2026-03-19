// Minimal performance monitoring - no heavy libraries
interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
}

class MinimalPerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null
  };

  private observers: PerformanceObserver[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Only run in browser and if Performance API is available
    if (typeof window === 'undefined' || !window.performance) return;

    this.measureFCP();
    this.measureLCP();
    this.measureFID();
    this.measureCLS();
    this.measureTTFB();
  }

  private measureFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime;
          this.logMetric('FCP', this.metrics.fcp);
        }
      });
      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  private measureLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.metrics.lcp = lastEntry.startTime;
          this.logMetric('LCP', this.metrics.lcp);
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // LCP not supported
    }
  }

  private measureFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart) {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.logMetric('FID', this.metrics.fid);
          }
        });
      });
      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // FID not supported
    }
  }

  private measureCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;
        this.logMetric('CLS', this.metrics.cls);
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // CLS not supported
    }
  }

  private measureTTFB() {
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.navigationStart;
      this.metrics.ttfb = ttfb;
      this.logMetric('TTFB', this.metrics.ttfb);
    }
  }

  private logMetric(name: string, value: number | null) {
    if (value === null) return;

    const thresholds: Record<string, { good: number; poor: number }> = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 }
    };

    if (!thresholds[name]) return;
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getPerformanceScore(): number {
    const { fcp, lcp, fid, cls } = this.metrics;

    // Count how many valid metrics we have
    const validMetrics = [fcp, lcp, fid, cls].filter(metric => metric !== null).length;
    if (validMetrics === 0) return 0;

    let score = 100;
    let deductions = 0;

    // FCP scoring
    if (fcp !== null) {
      if (fcp > 3000) deductions += 25;
      else if (fcp > 1800) deductions += 15;
    }

    // LCP scoring  
    if (lcp !== null) {
      if (lcp > 4000) deductions += 25;
      else if (lcp > 2500) deductions += 15;
    }

    // FID scoring
    if (fid !== null) {
      if (fid > 300) deductions += 25;
      else if (fid > 100) deductions += 15;
    }

    // CLS scoring
    if (cls !== null) {
      if (cls > 0.25) deductions += 25;
      else if (cls > 0.1) deductions += 15;
    }

    // Calculate score based on valid metrics
    const averageDeduction = deductions / validMetrics;
    score -= averageDeduction;

    return Math.max(0, Math.round(score));
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitor: MinimalPerformanceMonitor | null = null;

export function getPerformanceMonitor(): MinimalPerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new MinimalPerformanceMonitor();
  }
  return performanceMonitor;
}

// React hook for easy usage
export function usePerformanceMetrics() {
  const monitor = getPerformanceMonitor();
  return {
    metrics: monitor.getMetrics(),
    score: monitor.getPerformanceScore()
  };
}
