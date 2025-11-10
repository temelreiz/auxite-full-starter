import React from "react";
import { usePriceFeed } from "../hooks/usePriceFeed";

export const LivePrices: React.FC = () => {
  const { prices, connected, lastUpdate } = usePriceFeed();

  const entries = Object.values(prices || {}).sort((a, b) =>
    a.symbol.localeCompare(b.symbol)
  );

  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900/90 px-6 py-4 shadow-xl">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Live Markets
            </span>
            <span className="text-[10px] text-zinc-500">
              Real-time prices from Auxite watcher
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end text-[10px] text-zinc-500">
          <div
            className={`flex items-center gap-1 ${
              connected ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            <span className="text-[9px]">●</span>
            <span>{connected ? "Live" : "Waiting for feed..."}</span>
          </div>
          <div className="mt-0.5">
            Last update:{" "}
            {lastUpdate ? fmtTime(lastUpdate) : "—"}
          </div>
        </div>
      </div>

      {/* Table */}
      {entries.length === 0 ? (
        <div className="text-[11px] text-zinc-500">
          Henüz fiyat verisi yok. Watcher bağlantısı bekleniyor.
        </div>
      ) : (
        <table className="mt-1 w-full border-separate border-spacing-y-1 text-[11px] text-zinc-200">
          <thead className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <tr>
              <th className="pb-1 text-left font-normal">Token</th>
              <th className="pb-1 text-right font-normal">Price (USD)</th>
              <th className="pb-1 text-right font-normal">Time</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((p) => (
              <tr key={p.symbol}>
                <td className="py-0.5 text-left font-medium text-zinc-100">
                  {p.symbol}
                </td>
                <td className="py-0.5 text-right tabular-nums text-zinc-50">
                  {Number(p.price).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </td>
                <td className="py-0.5 text-right text-[10px] text-zinc-500">
                  {p.ts ? fmtTime(p.ts) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
