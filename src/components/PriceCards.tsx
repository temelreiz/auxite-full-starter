'use client';

import { usePriceFeed } from '@/lib/usePriceFeed';

export function PriceCards() {
  const { prices, error, connected } = usePriceFeed();

  // Eğer ciddi bir hata varsa ama hiç data yoksa: küçük uyarı kutusu
  if (error && !prices.length) {
    return (
      <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">
        Price feed temporarily unavailable. Your funds are safe; on-chain
        data is always the source of truth.
      </div>
    );
  }

  // Henüz data yok: skeleton
  if (!prices.length) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-neutral-900/80 border border-neutral-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Data var: kartları göster
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {prices.map((p) => (
        <div
          key={p.id}
          className="rounded-xl bg-neutral-950/80 border border-neutral-800 px-3 py-2.5 flex flex-col gap-1"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-neutral-100">
                {p.symbol}
              </span>
              {p.chain && (
                <span className="text-[9px] text-neutral-500">
                  {p.chain}
                </span>
              )}
            </div>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected ? 'bg-emerald-400' : 'bg-yellow-400'
              }`}
            />
          </div>
          <div className="text-sm font-mono tabular-nums text-neutral-100">
            {p.price.toFixed(6)}
          </div>
          <div className="text-[9px] text-neutral-500">
            {p.updatedAt
              ? `Updated ${new Date(p.updatedAt).toLocaleTimeString()}`
              : 'Live from Auxite watcher'}
          </div>
        </div>
      ))}
    </div>
  );
}
