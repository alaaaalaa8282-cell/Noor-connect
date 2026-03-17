import { useEffect, useState } from 'react';
import { parseEbookUrl } from '@/components/EnhancedNativePdfViewer';

interface EbookUrlState {
  url?: string;
  title?: string;
  isLoading: boolean;
  error?: string;
}

export function useEbookUrlParser() {
  const [ebookState, setEbookState] = useState<EbookUrlState>({
    isLoading: true,
    error: undefined
  });

  useEffect(() => {
    const parseUrl = () => {
      try {
        const parsed = parseEbookUrl();
        
        if (parsed && parsed.url && parsed.title) {
          setEbookState({
            url: parsed.url,
            title: parsed.title,
            isLoading: false
          });
        } else {
          setEbookState({
            isLoading: false
          });
        }
      } catch (error) {
        setEbookState({
          isLoading: false,
          error: 'Failed to parse ebook URL'
        });
      }
    };

    parseUrl();
  }, []);

  return ebookState;
}

// Hook for ebook sharing
export function useEbookSharing(url: string, title: string) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const generateShareableUrl = () => {
    const bookId = btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    return `${window.location.origin}${window.location.pathname}?book=${bookId}&title=${encodeURIComponent(title)}`;
  };

  const shareEbook = async () => {
    setIsSharing(true);
    setShareError(null);

    try {
      const shareUrl = generateShareableUrl();
      const shareText = `Check out this Islamic book: "${title}"`;

      if (navigator.share) {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        return { success: true, message: 'Link copied to clipboard!' };
      }
    } catch (error) {
      console.error('Error sharing ebook:', error);
      setShareError('Failed to share ebook');
      return { success: false, error: 'Failed to share' };
    } finally {
      setIsSharing(false);
    }
  };

  const copyDirectLink = async () => {
    try {
      const directUrl = generateShareableUrl();
      await navigator.clipboard.writeText(directUrl);
      return { success: true, message: 'Direct link copied!' };
    } catch (error) {
      console.error('Error copying link:', error);
      setShareError('Failed to copy link');
      return { success: false, error: 'Failed to copy link' };
    }
  };

  return {
    shareEbook,
    copyDirectLink,
    isSharing,
    shareError,
    generateShareableUrl
  };
}
