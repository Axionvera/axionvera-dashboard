import { useEffect, useState } from "react";
import { Skeleton } from "./Skeleton";

function formatTVL(raw: string): string {
  // XLM has 7 decimal places (stroops)
  const num = Number(BigInt(raw)) / 1e7;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M XLM`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K XLM`;
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM`;
}

export default function TVLWidget() {
  const [tvl, setTvl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/tvl")
      .then((r) => r.json())
      .then((data) => setTvl(data.tvl))
      .catch(() => setError(true));
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-center backdrop-blur-sm">
      <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
        Total Value Locked
      </p>
      {error ? (
        <p className="mt-2 text-4xl font-bold text-white">—</p>
      ) : tvl === null ? (
        <div className="mt-2 flex justify-center">
          <Skeleton className="h-10 w-48" />
        </div>
      ) : (
        <p className="mt-2 text-4xl font-bold text-white">{formatTVL(tvl)}</p>
      )}
      <p className="mt-1 text-xs text-gray-500">Updated every 5 minutes</p>
    </div>
  );
}