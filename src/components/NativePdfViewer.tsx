import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ZoomIn, ZoomOut, RotateCw, Loader2, ExternalLink } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { getPdfBlobUrl } from '@/lib/ebooks-storage';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface NativePdfViewerProps {
  url: string;
  title: string;
  localKey?: string;
  onClose: () => void;
}

type ViewerMode = 'loading' | 'pdfjs' | 'iframe' | 'error';

export default function NativePdfViewer({ url, title, localKey, onClose }: NativePdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [viewerMode, setViewerMode] = useState<ViewerMode>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPdf();
  }, [url, localKey]);


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

      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setViewerMode('pdfjs');

      await renderPage(pdf, 1, scale);
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

  // Loading state
  if (viewerMode === 'loading') {
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

  // Error state
  if (viewerMode === 'error') {
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
    const isArchiveOrg = url.includes('archive.org');

    return (
      <div className="fixed inset-0 bg-background z-[100] flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border shrink-0">
          <Button size="icon" variant="ghost" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 font-medium text-sm truncate">{title}</h1>
        </header>

        {/* Content - Prompt to open in browser */}
        <div className="flex-1 flex items-center justify-center px-4 bg-muted/30">
          <div className="text-center max-w-md bg-card p-6 rounded-xl shadow-lg border border-border">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <ExternalLink className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">
              {isArchiveOrg ? 'View on Archive.org' : 'Open PDF in Browser'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isArchiveOrg
                ? 'This book is hosted on Archive.org. Tap below to view it in their specialized reader.'
                : 'This PDF is hosted on an external server. For the best experience, open it in your browser.'}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full"
                onClick={() => window.open(viewerUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {isArchiveOrg ? 'View Book' : 'Open PDF'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={downloadPdf}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={onClose}
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PDF.js canvas viewer mode (for PDFs without CORS issues)
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

