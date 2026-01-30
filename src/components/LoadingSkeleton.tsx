/**
 * Loading Skeleton Components for Performance Optimization
 * Provides visual feedback during async operations with shimmer animations
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-muted relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-shimmer-slide",
        className
      )}
      {...props}
    />
  );
};

// Book Card Skeleton
export const BookCardSkeleton = () => {
  return (
    <div className="p-3 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="w-8 h-8 rounded" />
    </div>
  );
};

// Prayer Time Skeleton
export const PrayerTimeSkeleton = () => {
  return (
    <div className="p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div>
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  );
};

// Ramadan Time Skeleton
export const RamadanTimeSkeleton = () => {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div>
          <Skeleton className="h-3 w-20 mb-1" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
};

// Location Card Skeleton
export const LocationCardSkeleton = () => {
  return (
    <div className="p-4 flex items-center justify-between">
      <div>
        <Skeleton className="h-4 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-8 w-24 rounded" />
    </div>
  );
};

// Countdown Card Skeleton
export const CountdownCardSkeleton = () => {
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="text-right">
        <Skeleton className="h-6 w-20 ml-auto" />
      </div>
    </div>
  );
};

// Dashboard Card Skeleton
export const DashboardCardSkeleton = () => {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
};

// Quran Surah Skeleton
export const QuranSurahSkeleton = () => {
  return (
    <div className="p-4 flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="w-16 h-8 rounded" />
    </div>
  );
};

// Radio Station Skeleton
export const RadioStationSkeleton = () => {
  return (
    <div className="aspect-square relative overflow-hidden rounded-2xl">
      <Skeleton className="w-full h-full" />
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
};

// Stats Grid Skeleton
export const StatsGridSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
};

// List Skeleton (for hadith, duas, etc.)
export const ListSkeleton = ({ items = 5 }: { items?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-3 flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Page Skeleton (full page loading)
export const PageSkeleton = () => {
  return (
    <div className="min-h-screen pb-24">
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <StatsGridSkeleton />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <DashboardCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Loading Spinner with smooth animation
export const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-2 border-primary border-t-transparent",
        "transition-all duration-300 ease-in-out",
        sizeClasses[size]
      )} 
    />
  );
};

// Pulse Loading Dots
export const LoadingDots = () => {
  return (
    <div className="flex gap-1 items-center">
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
    </div>
  );
};
