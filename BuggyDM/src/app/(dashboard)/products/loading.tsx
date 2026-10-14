import React from "react";
import { ProductMetricsSkeleton } from "@/components/ProductMetrics";

export default function ProductsLoading() {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6">
      {/* Header Title Skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-slate-800/80 animate-pulse" />
        <div className="h-3.5 w-72 rounded bg-slate-800/50 animate-pulse" />
      </div>

      {/* Metrics Row Skeleton */}
      <ProductMetricsSkeleton />

      {/* Filters Toolbar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800/80 bg-slate-900/30">
        <div className="flex-1 h-9 rounded-xl bg-slate-800/60 animate-pulse" />
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-40 h-9 rounded-xl bg-slate-800/60 animate-pulse" />
          <div className="w-40 h-9 rounded-xl bg-slate-800/60 animate-pulse" />
          <div className="w-36 h-9 rounded-xl bg-slate-800/60 animate-pulse" />
          <div className="w-16 h-9 rounded-xl bg-slate-800/60 animate-pulse" />
        </div>
      </div>

      {/* Product Catalog Display Skeleton (Grid) */}
      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-900/30 flex flex-col"
            >
              {/* Product Thumbnail Placeholder */}
              <div className="aspect-square w-full bg-slate-900/60 relative animate-pulse flex items-center justify-center border-b border-slate-800/40">
                <div className="w-12 h-12 rounded-xl bg-slate-800/50" />
              </div>

              {/* Details Placeholder */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-800/80 animate-pulse" />
                  <div className="h-3 w-full rounded bg-slate-800/50 animate-pulse" />
                </div>
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="h-5 w-16 rounded bg-slate-800/80 animate-pulse" />
                  <div className="h-4 w-12 rounded bg-slate-800/60 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
