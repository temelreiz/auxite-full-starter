'use client';

import { usePriceFeed } from '@/lib/usePriceFeed';

export function PriceTicker() {
  const { prices, connected, error } = usePriceFeed();

  if (error && !prices.length) {
    return (
      <div className="w-full bg-red-50 text-red-600 px-4 py-2 text-xs">
        Price feed temporarily unavailable
      </div>
    );
  }

  if (!prices.length) {
    return (
      <div className="w-full bg-neutral-950 text-neutral-500 px-4 py-2 text-xs">
        Connecting to Auxite price feed…
      </div>
    );
  }

  return (
    <div className="w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur px-4 py-2 text-xs text-neutral-300 flex items-center gap-4 overflow-x-auto whitespace-nowrap">
      <span
        className={`flex items-center gap-1 text-[10px] uppercase tracking-wide ${
          connected ? 'text-emerald-400' : 'text-yellow-400'
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-current" />
        {connected ? 'Live' : 'Reconnecting'}
      </span>

      {prices.map((p) => (
        <div key={p.id} className="flex items-baseline gap-1 text-[11px]">
          <span className="font-semibold text-neutral-100">{p.symbol}</span>
          {p.chain && (
            <span className="text-[9px] text-neutral-500">
              {p.chain}
            </span>
          )}
          <span className="text-neutral-200">
            {p.price.toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
}
