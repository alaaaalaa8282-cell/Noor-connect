import { useState, useEffect, useRef, useCallback, memo } from 'react';

interface UseImageOptimizationProps {
  src: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

export const useImageOptimization = ({
  src,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3C/svg%3E',
  threshold = 0.1,
  rootMargin = '50px'
}: UseImageOptimizationProps) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const loadImage = useCallback(() => {
    if (!src) return;
    
    setIsLoading(true);
    setIsError(false);
    
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setIsError(true);
      setIsLoading(false);
    };
  }, [src]);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [loadImage, threshold, rootMargin]);

  return {
    ref: imgRef,
    src: imageSrc,
    isLoading,
    isError,
    retry: loadImage
  };
};

// Optimized image component
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className,
  placeholder,
  onLoad,
  onError
}: OptimizedImageProps) {
  const { ref, src: imageSrc, isLoading, isError } = useImageOptimization({
    src,
    placeholder
  });

  useEffect(() => {
    if (!isLoading && !isError && onLoad) {
      onLoad();
    }
  }, [isLoading, isError, onLoad]);

  useEffect(() => {
    if (isError && onError) {
      onError();
    }
  }, [isError, onError]);

  return (
    <img
      ref={ref}
      src={imageSrc}
      alt={alt}
      className={className}
      style={{
        opacity: isLoading ? 0.7 : 1,
        transition: 'opacity 0.3s ease'
      }}
    />
  );
});
