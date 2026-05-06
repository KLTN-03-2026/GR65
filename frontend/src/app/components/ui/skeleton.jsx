import { cn } from "./utils";

/**
 * Skeleton — Shimmer loading placeholder
 * 
 * Basic usage: <Skeleton className="w-full h-4" />
 * Variant usage: <Skeleton variant="card" /> | <Skeleton variant="stats" /> | <Skeleton variant="table-row" count={5} />
 */
function Skeleton({ className, variant, count = 1, ...props }) {
  if (variant === 'card') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-xl bg-gray-200 animate-pulse")}></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 rounded-lg w-2/3 bg-gray-200 animate-pulse"></div>
            <div className="h-3 rounded-lg w-1/3 bg-gray-100 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 rounded-lg w-full bg-gray-100 animate-pulse"></div>
          <div className="h-3 rounded-lg w-4/5 bg-gray-100 animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 rounded-lg w-20 bg-gray-200 animate-pulse"></div>
          <div className="h-8 rounded-lg w-16 bg-gray-100 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (variant === 'table-row') {
    return Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50">
        <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3.5 rounded-lg w-1/3 bg-gray-200 animate-pulse"></div>
          <div className="h-3 rounded-lg w-1/5 bg-gray-100 animate-pulse"></div>
        </div>
        <div className="h-6 rounded-lg w-16 bg-gray-100 animate-pulse"></div>
      </div>
    ));
  }

  if (variant === 'stats') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse"></div>
            <div className="h-7 rounded-lg w-16 bg-gray-200 animate-pulse"></div>
            <div className="h-3 rounded-lg w-24 bg-gray-100 animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  // Default: simple bar skeleton  
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-gray-200 animate-pulse rounded-md", className)}
      {...props} />
  );
}

export { Skeleton };