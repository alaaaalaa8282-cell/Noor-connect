/**
 * Loading Skeleton Components for Performance Optimization
 * Provides visual feedback during async operations
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
        "animate-pulse rounded-md bg-muted",
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

// Loading Spinner
export const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size])} />
  );
};
