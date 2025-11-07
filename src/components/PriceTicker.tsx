'use client';

import { usePriceFeed } from '@/lib/usePriceFeed';

export function PriceTicker() {
  const { prices, connected } = usePriceFeed();

  if (!prices.length) {
    return (
      <div className="w-full border-b border-neutral-800 bg-neutral-950/80 px-4 py-2 text-xs text-neutral-500 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-neutral-500 animate-pulse" />
        <span>Connecting to Auxite price feed…</span>
      </div>
    );
  }

  return (
    <div className="w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur px-4 py-2 text-xs text-neutral-300 flex items-center gap-4 overflow-x-auto whitespace-nowrap">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-neutral-500">
        <span
          className={`h-2 w-2 rounded-full ${
            connected ? 'bg-emerald-400' : 'bg-yellow-400'
          }`}
        />
        <span>{connected ? 'Live' : 'Reconnecting'}</span>
      </div>

      {prices.map((p) => {
        const change =
          typeof p.change24h === 'number'
            ? (p.change24h * 100).toFixed(2) + '%'
            : null;
        const positive = (p.change24h ?? 0) >= 0;

        return (
          <div
            key={p.id}
            className="flex items-baseline gap-1 text-[11px]"
          >
            <span className="font-semibold text-neutral-100">
              {p.symbol}
            </span>
            {p.chain && (
              <span className="text-[9px] text-neutral-500">
                {p.chain}
              </span>
            )}
            <span className="text-neutral-200">
              {p.price.toFixed(4)}
            </span>
            {change && (
              <span
                className={
                  positive
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }
              >
                {positive ? '▲' : '▼'} {change}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
