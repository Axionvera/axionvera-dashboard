import React from "react";
import { Skeleton } from "./Skeleton";

export function StatisticsSkeleton() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6 h-full">
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
    <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
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
    <div className="divide-y divide-slate-800">
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

export function ChartSkeleton() {
  return (
    <div className="h-[400px] w-full rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
      <div className="relative h-[250px] w-full">
        <div className="absolute inset-0 flex items-end justify-between px-2">
          {[...Array(12)].map((_, i) => (
            <Skeleton
              key={i}
              className="w-[6%] rounded-t-lg"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl mt-4" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-6 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}
