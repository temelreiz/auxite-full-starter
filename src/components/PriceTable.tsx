'use client';

import { usePriceFeed } from '@/lib/usePriceFeed';

export function PriceTable() {
  const { prices, connected, lastMessageAt } = usePriceFeed();

  return (
    <div className="mt-6 w-full rounded-2xl border border-neutral-800 bg-neutral-950/80 backdrop-blur p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">
            Live Markets
          </h2>
          <p className="text-[10px] text-neutral-500">
            Powered by Auxite watcher on Base Sepolia
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] ${
              connected
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-yellow-500/10 text-yellow-400'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {connected ? 'Live WebSocket' : 'Reconnecting…'}
          </span>
          {lastMessageAt && (
            <span className="text-[8px] text-neutral-500">
              Last update: {new Date(lastMessageAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {prices.length === 0 ? (
        <div className="py-6 text-center text-[11px] text-neutral-500">
          Waiting for first price update…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[11px] text-neutral-300">
            <thead className="border-b border-neutral-800 text-[9px] uppercase text-neutral-500">
              <tr>
                <th className="py-2 pr-3">Token</th>
                <th className="py-2 pr-3">Chain</th>
                <th className="py-2 pr-3">Price</th>
                <th className="py-2 pr-3">24h</th>
                <th className="py-2 pr-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => {
                const changePct =
                  typeof p.change24h === 'number'
                    ? (p.change24h * 100).toFixed(2)
                    : null;
                const positive = (p.change24h ?? 0) >= 0;

                return (
                  <tr
                    key={p.id}
                    className="border-b border-neutral-900/60 last:border-b-0 hover:bg-neutral-900/40 transition-colors"
                  >
                    <td className="py-1.5 pr-3 font-semibold text-neutral-100">
                      {p.symbol}
                    </td>
                    <td className="py-1.5 pr-3 text-neutral-500">
                      {p.chain || '—'}
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums">
                      {p.price.toFixed(6)}
                    </td>
                    <td className="py-1.5 pr-3">
                      {changePct !== null ? (
                        <span
                          className={`tabular-nums ${
                            positive
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {positive ? '▲' : '▼'} {changePct}%
                        </span>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 text-neutral-500">
                      {p.updatedAt
                        ? new Date(p.updatedAt).toLocaleTimeString()
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
