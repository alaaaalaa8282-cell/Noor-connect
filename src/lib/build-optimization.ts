// Build optimization utilities for chunk splitting and lazy loading

// Critical components that should be prefetched
export const CRITICAL_CHUNKS = [
  () => import('../pages/Dashboard'),
  () => import('../pages/Quran'),
  () => import('../pages/Tasbeeh'),
  () => import('../pages/Profile'),
];

// Heavy components that should be loaded on demand
export const HEAVY_CHUNKS = {
  radio: () => import('../components/lazy/RadioComponents'),
  ebooks: () => import('../pages/EbooksModern'),
  pdfViewer: () => import('../components/lazy/EbooksComponents'),
};

// Prefetch strategy
export const prefetchCriticalChunks = () => {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      CRITICAL_CHUNKS.forEach(chunk => chunk());
    });
  } else {
    setTimeout(() => {
      CRITICAL_CHUNKS.forEach(chunk => chunk());
    }, 2000);
  }
};

// Load heavy chunks only when needed
export const loadHeavyChunk = (chunkName: keyof typeof HEAVY_CHUNKS) => {
  return HEAVY_CHUNKS[chunkName]();
};
