/**
 * Optimized Image Component
 * Supports WebP, lazy loading, and responsive sizes
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean; // For above-the-fold images
  sizes?: string; // Responsive sizes
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  width, 
  height, 
  priority = false,
  sizes 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate optimized src set
  const generateSrcSet = (baseSrc: string) => {
    const baseName = baseSrc.replace(/\.[^/.]+$/, '');
    const extension = baseSrc.includes('.webp') ? 'webp' : 'png';
    
    // If we have responsive sizes, generate srcset
    if (sizes) {
      return `
        ${baseName}-400.${extension} 400w,
        ${baseName}-800.${extension} 800w,
        ${baseName}-1200.${extension} 1200w
      `;
    }
    
    // Try WebP first, fallback to original
    return `${baseName}.webp, ${baseSrc}`;
  };

  // Handle lazy loading
  useEffect(() => {
    if (!priority && imgRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
            }
            observer.unobserve(img);
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(imgRef.current);
      return () => observer.disconnect();
    }
  }, [priority]);

  const handleError = () => {
    setHasError(true);
    console.warn(`Failed to load image: ${src}`);
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // For priority images, load immediately
  const imageSrc = priority ? src : undefined;
  const dataSrc = priority ? undefined : src;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
      )}
      
      {hasError ? (
        <div className="flex items-center justify-center h-full w-full bg-muted rounded-lg">
          <span className="text-muted-foreground text-sm">Image not available</span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={imageSrc}
          data-src={dataSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
        />
      )}
    </div>
  );
}

// Audio optimization component
interface OptimizedAudioProps {
  src: string;
  className?: string;
  preload?: boolean;
}

export function OptimizedAudio({ src, className, preload = false }: OptimizedAudioProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoad = () => {
      setIsLoaded(true);
      console.log(`Audio loaded: ${src}`);
    };

    const handleError = () => {
      console.warn(`Failed to load audio: ${src}`);
    };

    audio.addEventListener('canplay', handleLoad);
    audio.addEventListener('error', handleError);

    // Preload if requested
    if (preload) {
      audio.load();
    }

    return () => {
      audio.removeEventListener('canplay', handleLoad);
      audio.removeEventListener('error', handleError);
    };
  }, [src, preload]);

  return (
    <audio
      ref={audioRef}
      src={src}
      preload={preload ? "auto" : "none"}
      className={className}
    />
  );
}

export default OptimizedImage;
