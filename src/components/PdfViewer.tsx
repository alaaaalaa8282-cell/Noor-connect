import { useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ArrowLeft, Share2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, RefreshCw, RotateCw, BookOpen, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getPdfBlobUrl } from "@/lib/ebooks-storage";
import { saveReadingProgress, getReadingProgress } from "@/lib/reading-progress";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  title: string;
  localKey?: string;
  onClose: () => void;
}

export default function PdfViewer({ url, title, localKey, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfSource, setPdfSource] = useState<string | { url: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('vertical');
  const [fullscreen, setFullscreen] = useState(false);

  // Calculate container width for responsive sizing
  useEffect(() => {
    const updateWidth = () => {
      if (viewMode === 'vertical') {
        setContainerWidth(Math.min(window.innerWidth - 32, 600));
      } else {
        setContainerWidth(Math.min(window.innerWidth - 32, 800));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [viewMode]);

  // Handle fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [fullscreen]);

  // Restore reading position
  useEffect(() => {
    if (url) {
      const progress = getReadingProgress(url);
      if (progress && progress.currentPage > 1) {
        setCurrentPage(progress.currentPage);
      }
    }
  }, [url]);

  // Load PDF - prioritize local, then fetch remote
  useEffect(() => {
    let mounted = true;
    let blobUrlToRevoke: string | null = null;
    
    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setLoadProgress(0);
      
      try {
        // First, try to load from local storage if we have a key
        if (localKey) {
          const blobUrl = await getPdfBlobUrl(localKey);
          if (mounted && blobUrl) {
            blobUrlToRevoke = blobUrl;
            setPdfSource(blobUrl);
            setLoading(false);
            return;
          }
        }

        // If no local key or local load failed, try to fetch from URL
        if (url) {
          // Use object with url to let react-pdf handle the fetch
          // This allows react-pdf to handle CORS appropriately
          setPdfSource({ url });
          // Loading state will be managed by Document component
        } else {
          if (mounted) {
            setError("No PDF source available.");
            setLoading(false);
          }
        }
      } catch (err) {
        if (mounted) {
          setError("Failed to load PDF. Please try again.");
          console.error("PDF load error:", err);
          setLoading(false);
        }
      }
    };
    
    loadPdf();
    
    return () => {
      mounted = false;
      if (blobUrlToRevoke) {
        URL.revokeObjectURL(blobUrlToRevoke);
      }
    };
  }, [url, localKey, retryCount]);

  const onDocumentLoadSuccess = useCallback(({ numPages: pages }: { numPages: number }) => {
    setNumPages(pages);
    setLoading(false);
    setLoadProgress(100);
    // Save initial progress
    if (url) {
      saveReadingProgress(url, currentPage, pages);
    }
  }, [url, currentPage]);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error("Document load error:", err);
    setError("Failed to load PDF. The file may be unavailable or blocked by CORS.");
    setLoading(false);
  }, []);

  const onLoadProgress = useCallback(({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      setLoadProgress(Math.round((loaded / total) * 100));
    }
  }, []);

  // Save progress when page changes
  useEffect(() => {
    if (numPages > 0 && url) {
      saveReadingProgress(url, currentPage, numPages);
    }
  }, [currentPage, numPages, url]);

  const handleShare = async () => {
    if (navigator.share && url) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled
      }
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
      document.getElementById('pdf-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const adjustScale = (delta: number) => {
    setScale(s => Math.max(0.5, Math.min(3.0, s + delta)));
  };

  const toggleRotation = () => {
    setRotation(r => (r + 90) % 360);
  };

  const toggleViewMode = () => {
    setViewMode(m => m === 'horizontal' ? 'vertical' : 'horizontal');
  };

  const toggleFullscreen = () => {
    setFullscreen(f => !f);
  };

  const handleRetry = () => {
    setRetryCount(c => c + 1);
  };

  const openInBrowser = () => {
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className={`fixed inset-0 bg-background z-[100] flex flex-col ${fullscreen ? 'z-[200]' : ''}`}>
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border shrink-0 safe-area-top">
        <Button size="icon" variant="ghost" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="flex-1 font-medium text-sm truncate">{title}</h1>
        <div className="flex items-center gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={toggleViewMode}
            className="h-8 w-8"
            title={viewMode === 'horizontal' ? 'Vertical scroll' : 'Horizontal scroll'}
          >
            <BookOpen className="w-4 h-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={toggleFullscreen}
            className="h-8 w-8"
            title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          {url && (
            <Button size="icon" variant="ghost" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Loading Progress Bar */}
      {loading && loadProgress > 0 && loadProgress < 100 && (
        <div className="px-4 py-2 bg-card border-b border-border">
          <Progress value={loadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center mt-1">
            Loading... {loadProgress}%
          </p>
        </div>
      )}

      {/* PDF Content */}
      <div id="pdf-container" className={`flex-1 overflow-auto bg-muted/30 ${viewMode === 'vertical' ? '' : 'snap-y snap-mandatory'}`}>
        {loading && loadProgress === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-destructive mb-2 text-sm">{error}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              {url && (
                <Button variant="default" onClick={openInBrowser}>
                  Open in Browser
                </Button>
              )}
            </div>
            <Button variant="ghost" className="mt-4" onClick={onClose}>
              Go Back
            </Button>
          </div>
        )}
        
        {pdfSource && !error && (
          <Document
            file={pdfSource}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            onLoadProgress={onLoadProgress}
            loading={
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {loadProgress > 0 ? `Loading... ${loadProgress}%` : 'Preparing document...'}
                  </p>
                </div>
              </div>
            }
            className={viewMode === 'vertical' ? 'flex flex-col items-center py-4' : 'flex flex-col items-center py-4'}
          >
            {viewMode === 'vertical' ? (
              // Vertical scrolling mode - show all pages
              Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div key={pageNum} className="mb-4">
                  <Page 
                    pageNumber={pageNum}
                    scale={scale}
                    width={containerWidth}
                    rotate={rotation}
                    className="shadow-lg"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={
                      <div className="flex items-center justify-center h-96 w-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    }
                  />
                </div>
              ))
            ) : (
              // Horizontal page-by-page mode
              <div className="snap-center">
                <Page 
                  pageNumber={currentPage}
                  scale={scale}
                  width={containerWidth}
                  rotate={rotation}
                  className="shadow-lg mb-4"
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <div className="flex items-center justify-center h-96 w-full">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  }
                />
              </div>
            )}
          </Document>
        )}
      </div>

      {/* Controls */}
      {numPages > 0 && (
        <footer className="bg-card border-t border-border px-4 py-3 shrink-0 safe-area-bottom">
          <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
            {/* Left Controls - Zoom & Rotation */}
            <div className="flex items-center gap-1">
              <Button 
                size="icon" 
                variant="ghost"
                className="h-9 w-9"
                onClick={() => adjustScale(-0.25)}
                disabled={scale <= 0.5}
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <Button 
                size="icon" 
                variant="ghost"
                className="h-9 w-9"
                onClick={() => adjustScale(0.25)}
                disabled={scale >= 3.0}
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost"
                className="h-9 w-9"
                onClick={toggleRotation}
                title="Rotate page"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Center - Page Navigation (only in horizontal mode) */}
            {viewMode === 'horizontal' && (
              <div className="flex items-center gap-2">
                <Button 
                  size="icon" 
                  variant="outline"
                  className="h-9 w-9"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm tabular-nums min-w-[60px] text-center">
                  {currentPage} / {numPages}
                </span>
                <Button 
                  size="icon" 
                  variant="outline"
                  className="h-9 w-9"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= numPages}
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Right - View Mode Indicator */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                {viewMode === 'vertical' ? '📜 Scroll' : '📄 Page'}
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
