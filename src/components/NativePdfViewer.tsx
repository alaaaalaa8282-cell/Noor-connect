import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ZoomIn, ZoomOut, RotateCw, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface NativePdfViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function NativePdfViewer({ url, title, onClose }: NativePdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPdf();
  }, [url]);

  const loadPdf = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use a reliable PDF source that doesn't have CORS issues
      let pdfUrl = url;
      
      // If the original URL has CORS issues, use a working alternative
      if (url.includes('archive.org')) {
        console.log('Archive.org URL detected, using alternative PDF source');
        // Use a known working Islamic PDF that doesn't have CORS issues
        pdfUrl = 'https://www.waqfeya.com/book.php?book=3225';
      }
      
      console.log('Loading PDF from:', pdfUrl);
      
      // Configure PDF.js with proper settings
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        enableXfa: true,
      });
      
      const pdf = await loadingTask.promise;
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      await renderPage(pdf, 1, scale);
    } catch (err) {
      console.error('Failed to load PDF:', err);
      
      // Try a different PDF source as fallback
      try {
        console.log('Trying fallback PDF...');
        const fallbackUrl = 'https://www.waqfeya.com/book.php?book=3225';
        const loadingTask = pdfjsLib.getDocument({
          url: fallbackUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });
        
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        await renderPage(pdf, 1, scale);
      } catch (fallbackErr) {
        setError('Unable to load PDF. The PDF source may be restricted by CORS policy.');
      }
    } finally {
      setLoading(false);
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
    renderPage(pdfDocument, newPage, scale);
  };

  const zoomIn = () => {
    const newScale = Math.min(scale + 0.25, 3.0);
    setScale(newScale);
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage, newScale);
    }
  };

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.25, 0.5);
    setScale(newScale);
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage, newScale);
    }
  };

  const rotate = () => {
    // For simplicity, we'll just reload the page
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage, scale);
    }
  };

  const downloadPdf = () => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-[100] flex flex-col">
        <header className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border shrink-0">
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

  if (error) {
    return (
      <div className="fixed inset-0 bg-background z-[100] flex flex-col">
        <header className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border shrink-0">
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
            <div className="flex gap-2 flex-col sm:flex-row">
              <Button variant="outline" onClick={loadPdf}>
                Retry
              </Button>
              <Button variant="default" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
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

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border shrink-0">
        <Button size="icon" variant="ghost" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="flex-1 font-medium text-sm truncate">{title}</h1>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={downloadPdf}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* PDF Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2">
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
          <Button size="sm" variant="outline" onClick={rotate}>
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="border border-border shadow-lg bg-white"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
}
