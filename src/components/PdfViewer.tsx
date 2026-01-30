import { useState, useEffect } from "react";
import { ArrowLeft, Share2, Loader2, RefreshCw, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { saveReadingProgress, getReadingProgress } from "@/lib/reading-progress";

interface PdfViewerProps {
  url: string;
  title: string;
  localKey?: string;
  onClose: () => void;
}

export default function PdfViewer({ url, title, localKey, onClose }: PdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [viewMode, setViewMode] = useState<'iframe' | 'external'>('iframe');

  // Restore reading position
  useEffect(() => {
    if (url) {
      const progress = getReadingProgress(url);
      if (progress && progress.currentPage > 1) {
        // Save progress for lightweight viewer
        saveReadingProgress(url, 1, 1);
      }
    }
  }, [url]);

  // Load PDF with progress simulation
  useEffect(() => {
    let mounted = true;
    
    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setLoadProgress(0);
      
      try {
        // Simulate loading progress for better UX
        const progressInterval = setInterval(() => {
          if (mounted) {
            setLoadProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }
        }, 100);

        // Check if URL is accessible
        if (url) {
          const response = await fetch(url, { method: 'HEAD' });
          clearInterval(progressInterval);
          
          if (!response.ok) {
            throw new Error(`PDF not accessible (${response.status})`);
          }
          
          if (mounted) {
            setLoadProgress(100);
            setLoading(false);
            // Save reading progress
            saveReadingProgress(url, 1, 1);
          }
        } else {
          throw new Error("No PDF URL provided");
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
    };
  }, [url, retryCount]);

  const handleShare = async () => {
    if (navigator.share && url) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled
      }
    }
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

  const openInNativeViewer = () => {
    if (url) {
      // Try to open in native PDF viewer
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col">
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
            onClick={() => setViewMode(viewMode === 'iframe' ? 'external' : 'iframe')}
            className="h-8 w-8"
            title={viewMode === 'iframe' ? 'Open in browser' : 'Embed viewer'}
          >
            <ExternalLink className="w-4 h-4" />
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
            Loading PDF... {loadProgress}%
          </p>
        </div>
      )}

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-muted/30">
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
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
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
        
        {!loading && !error && url && (
          <div className="h-full w-full">
            {viewMode === 'iframe' ? (
              <iframe
                src={url}
                className="w-full h-full border-0"
                title={title}
                onLoad={() => {
                  setLoadProgress(100);
                  setLoading(false);
                }}
                onError={() => {
                  setError("Failed to load PDF in embedded viewer. Try opening in browser.");
                  setLoading(false);
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <BookOpen className="w-16 h-16 text-primary mb-4" />
                <h2 className="text-lg font-semibold mb-2">{title}</h2>
                <p className="text-sm text-muted-foreground mb-6 text-center">
                  This PDF will open in your device's native PDF viewer for the best reading experience.
                </p>
                <div className="flex gap-3">
                  <Button onClick={openInNativeViewer} className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Open PDF Viewer
                  </Button>
                  <Button variant="outline" onClick={openInBrowser}>
                    Open in Browser
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Your progress will be saved automatically.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!loading && !error && (
        <footer className="bg-card border-t border-border px-4 py-3 shrink-0 safe-area-bottom">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">
              {viewMode === 'iframe' ? 'Embedded PDF Viewer' : 'Native PDF Viewer Mode'}
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}
