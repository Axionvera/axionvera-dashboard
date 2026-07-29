import React from "react";
import { Skeleton } from "./Skeleton";

export function StatisticsSkeleton() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6 h-full" role="status" aria-label="Loading statistics">
      <span className="sr-only">Loading statistics…</span>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>

      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-8 w-32" />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-7 w-24" />
          <Skeleton className="mt-1 h-3 w-56" />
        </div>
      </div>
    </section>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6" role="status" aria-label="Loading profile">
      <span className="sr-only">Loading profile…</span>
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="divide-y divide-slate-800" role="status" aria-label="Loading transactions">
      <span className="sr-only">Loading transactions…</span>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="grid grid-cols-[1.2fr_1fr_1fr_0.9fr] items-center gap-3 px-4 py-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
