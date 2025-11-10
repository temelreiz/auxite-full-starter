// src/components/LivePrices.tsx

import React from "react";
import { usePriceFeed } from "../hooks/usePriceFeed";

export const LivePrices: React.FC = () => {
  const { prices, connected, lastUpdate } = usePriceFeed();

  // prices: { [symbol]: { symbol, price, ts? } }
  const entries = React.useMemo(
    () =>
      Object.values(prices || {}).sort((a, b) =>
        a.symbol.localeCompare(b.symbol)
      ),
    [prices]
  );

  const formattedLastUpdate = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  return (
    <div className="w-full rounded-3xl border border-zinc-800/80 bg-zinc-900/90 px-6 py-4 shadow-xl backdrop-blur">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Auxite Oracle
          </span>
          <span className="text-sm font-semibold text-zinc-100">
            Live Oracle Prices
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-[10px]">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
              connected
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            {connected ? "Connected" : "Disconnected"}
          </span>
          <span className="text-[9px] text-zinc-500">
            Last update: {formattedLastUpdate}
          </span>
        </div>
      </div>

      {/* Content */}
      {entries.length === 0 ? (
        <div className="mt-1 text-[11px] text-zinc-500">
          Henüz canlı fiyat verisi alınmadı.
        </div>
      ) : (
        <table className="mt-1 w-full border-separate border-spacing-y-1 text-[11px]">
          <thead>
            <tr className="text-zinc-500">
              <th className="py-1 text-left font-normal">Asset</th>
              <th className="py-1 text-right font-normal">Price</th>
              <th className="py-1 text-right font-normal pr-1">Age</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((p) => {
              const ts =
                typeof p.ts === "number"
                  ? p.ts
                  : typeof p.ts === "string"
                  ? Number(p.ts)
                  : null;

              let ageLabel = "—";
              if (ts && !Number.isNaN(ts)) {
                const diffSec = Math.max(
                  0,
                  Math.floor((Date.now() - ts) / 1000)
                );
                if (diffSec < 5) ageLabel = "now";
                else if (diffSec < 60) ageLabel = diffSec + "s";
                else {
                  const m = Math.floor(diffSec / 60);
                  ageLabel = m + "m";
                }
              }

              return (
                <tr
                  key={p.symbol}
                  className="rounded-xl bg-zinc-900/40 text-zinc-100"
                >
                  <td className="rounded-l-xl py-1 pl-2 align-middle">
                    {p.symbol}
                  </td>
                  <td className="py-1 pr-2 text-right align-middle">
                    {Number(p.price).toLocaleString("en-US", {
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="rounded-r-xl py-1 pr-2 text-right align-middle text-[10px] text-zinc-500">
                    {ageLabel}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};
