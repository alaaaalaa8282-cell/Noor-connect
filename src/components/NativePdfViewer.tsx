import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ZoomIn, ZoomOut, RotateCw, Loader2, ExternalLink, Scroll } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { getPdfBlobUrl } from '@/lib/ebooks-storage';
import { getReadingProgress, saveReadingProgress } from '@/lib/reading-progress';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface NativePdfViewerProps {
  url: string;
  title: string;
  localKey?: string;
  progressKey?: string;
  onClose: () => void;
}

type ViewerMode = 'loading' | 'pdfjs' | 'iframe' | 'error';

// Sub-component for rendering individual pages in vertical mode
function PdfPage({ pdf, pageNumber, scale }: { pdf: any; pageNumber: number; scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { rootMargin: '100% 0px' } // Preload nicely
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !pdf || !canvasRef.current) return;

    let mounted = true;

    const render = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (!mounted) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Only resize if different to avoid flickering
        if (canvas.height !== viewport.height || canvas.width !== viewport.width) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
        }

        // Cancel previous render if any
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (error: any) {
        if (error.name !== 'RenderingCancelledException') {
          console.error('Error rendering page', pageNumber, error);
        }
      }
    };

    render();

    return () => {
      mounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [inView, pdf, pageNumber, scale]);

  return (
    <div ref={containerRef} className="flex justify-center my-4 min-h-[400px]">
      <canvas ref={canvasRef} className="border border-border shadow-lg bg-white" />
    </div>
  );
}

export default function NativePdfViewer({ url, title, localKey, progressKey, onClose }: NativePdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [viewerMode, setViewerMode] = useState<ViewerMode>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isVertical, setIsVertical] = useState(false); // New state for vertical scroll mode
  const effectiveProgressKey = progressKey || (localKey ? `local:${localKey}` : url);

  useEffect(() => {
    loadPdf();
  }, [url, localKey]);

  useEffect(() => {
    if (!effectiveProgressKey || totalPages <= 0) return;
    saveReadingProgress(effectiveProgressKey, currentPage, totalPages);
  }, [effectiveProgressKey, currentPage, totalPages]);


  const loadPdf = async () => {
    try {
      setViewerMode('loading');
      setError(null);

      let pdfUrl = url;

      // If we have a localKey, get the blob URL from storage
      if (localKey) {
        console.log('Loading local PDF from storage:', localKey);
        const blobUrl = await getPdfBlobUrl(localKey);
        if (blobUrl) {
          pdfUrl = blobUrl;
        } else if (!url) {
          throw new Error('Local PDF not found in storage');
        }
      }

      if (!pdfUrl) {
        throw new Error('No PDF URL available');
      }

      console.log('Loading PDF from:', pdfUrl);

      // Configure PDF.js with proper settings
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        enableXfa: true,
        // Add withCredentials: false to avoid credential issues
        withCredentials: false,
      });

      const pdf = await loadingTask.promise;
      const savedProgress = getReadingProgress(effectiveProgressKey);
      const initialPage = savedProgress && savedProgress.currentPage >= 1 && savedProgress.currentPage <= pdf.numPages
        ? savedProgress.currentPage
        : 1;

      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(initialPage);
      setViewerMode('pdfjs');

      // Only render page 1 if we remain in single-page mode or want to init
      if (!isVertical) {
        await renderPage(pdf, initialPage, scale);
      }

      saveReadingProgress(effectiveProgressKey, initialPage, pdf.numPages);
    } catch (err: any) {
      console.error('Failed to load PDF with pdf.js:', err);

      // Check if it's a CORS error
      const isCorsError = err?.message?.includes('Failed to fetch') ||
        err?.name === 'UnknownErrorException' ||
        err?.message?.includes('CORS');

      if (isCorsError) {
        console.log('CORS error detected, switching to iframe viewer');
        // Fall back to iframe-based viewer for CORS-restricted PDFs
        setViewerMode('iframe');
      } else {
        setError(`Unable to load PDF: ${err?.message || 'Unknown error'}`);
        setViewerMode('error');
      }
    }
  };

  const renderPage = async (pdf: any, pageNum: number, scaleValue: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const viewport = page.getViewport({ scale: scaleValue });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Failed to render page:', err);
      setError('Failed to render PDF page.');
    }
  };

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || !pdfDocument) return;

    setCurrentPage(newPage);
    if (!isVertical) {
      renderPage(pdfDocument, newPage, scale);
    }
  };

  const zoomIn = () => {
    const newScale = Math.min(scale + 0.25, 3.0);
    setScale(newScale);
    if (pdfDocument && !isVertical) {
      renderPage(pdfDocument, currentPage, newScale);
    }
  };

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.25, 0.5);
    setScale(newScale);
    if (pdfDocument && !isVertical) {
      renderPage(pdfDocument, currentPage, newScale);
    }
  };

  const rotate = () => {
    // For simplicity, we'll just reload the page/layout
    if (pdfDocument && !isVertical) {
      renderPage(pdfDocument, currentPage, scale);
    }
  };

  const downloadPdf = () => {
    window.open(url, '_blank');
  };

  const toggleLayout = () => {
    setIsVertical(!isVertical);
    // If switching back to single page, re-render current page
    if (isVertical && pdfDocument) {
      // We need to wait for layout change then render, but effect might handle or we can just trigger it
      setTimeout(() => renderPage(pdfDocument, currentPage, scale), 50);
    }
  };

  // Loading state
  if (viewerMode === 'loading') {
    return (
      <div className="fixed inset-0 bg-background z-[1000] flex flex-col">
        <header className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border shrink-0 safe-area-top">
          <Button size="icon" variant="ghost" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 font-medium text-sm truncate">{title}</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading PDF...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (viewerMode === 'error') {
    return (
      <div className="fixed inset-0 bg-background z-[1000] flex flex-col">
        <header className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border shrink-0 safe-area-top">
          <Button size="icon" variant="ghost" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 font-medium text-sm truncate">{title}</h1>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <p className="text-destructive mb-2 text-sm">{error}</p>
            <p className="text-xs text-muted-foreground mb-4">
              Some PDF sources may be restricted by browser CORS policies.
              You can try opening the PDF directly in your browser.
            </p>
            <div className="flex gap-2 flex-col sm:flex-row justify-center">
              <Button variant="outline" onClick={loadPdf}>
                Retry
              </Button>
              <Button variant="default" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Browser
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper to handle archive.org URLs and other external links
  const getBetterViewerUrl = (pdfUrl: string): string => {
    if (pdfUrl.includes('archive.org')) {
      const downloadMatch = pdfUrl.match(/archive\.org\/download\/([^/]+)/);
      if (downloadMatch?.[1]) {
        return `https://archive.org/details/${downloadMatch[1]}`;
      }
      if (pdfUrl.includes('archive.org/details/')) {
        return pdfUrl;
      }
    }
    return pdfUrl;
  };

  // External viewer mode (fallback for CORS-restricted PDFs)
  if (viewerMode === 'iframe') {
    const viewerUrl = getBetterViewerUrl(url);

    return (
      <div className="fixed inset-0 bg-background z-[1000] flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border shrink-0 safe-area-top">
          <Button size="icon" variant="ghost" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 font-medium text-sm truncate">{title}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(viewerUrl, '_blank', 'noopener,noreferrer')}
            title="Open in browser"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </header>

        {/* Content - Embedded online reader */}
        <div className="flex-1 bg-muted/20">
          <iframe
            src={viewerUrl}
            title={title}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          />
        </div>

        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          If the PDF does not load here, use the external open button in the header.
        </div>
      </div>
    );
  }

  // PDF.js canvas viewer mode (for PDFs without CORS issues)
  return (
    <div className="fixed inset-0 bg-background z-[1000] flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border shrink-0 safe-area-top">
        <Button size="icon" variant="ghost" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="flex-1 font-medium text-sm truncate">{title}</h1>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant={isVertical ? "secondary" : "ghost"}
            onClick={toggleLayout}
            title={isVertical ? "Switch to Page View" : "Switch to Vertical Scroll"}
          >
            <Scroll className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={downloadPdf}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* PDF Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          {!isVertical && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </>
          )}
          {isVertical && (
            <span className="text-sm font-medium px-2">
              {totalPages} Pages
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium px-2">
            {Math.round(scale * 100)}%
          </span>
          <Button size="sm" variant="outline" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          {!isVertical && (
            <Button size="sm" variant="outline" onClick={rotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        <div className="flex justify-center flex-col items-center">
          {isVertical ? (
            // Vertical Scroll Mode: Render all pages with lazy loading
            Array.from({ length: totalPages }, (_, i) => (
              <PdfPage
                key={i + 1}
                pdf={pdfDocument}
                pageNumber={i + 1}
                scale={scale}
              />
            ))
          ) : (
            // Single Page Mode: Render simplified single canvas
            <canvas
              ref={canvasRef}
              className="border border-border shadow-lg bg-white"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

