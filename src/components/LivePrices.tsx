"use client";

import React from "react";
import { usePriceFeed } from "@/hooks/usePriceFeed";

export const LivePrices: React.FC = () => {
  const { prices, connected, lastUpdate } = usePriceFeed();

  const entries = Object.values(prices || {}).sort((a, b) =>
    a.symbol.localeCompare(b.symbol)
  );

  console.log("[Auxite] entries", entries);

  return (
    <div className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/90 px-6 py-5 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-white">
            Live Markets 💹
          </div>
          <div className="text-[11px] text-zinc-400">
            Real-time prices from Auxite watcher
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-emerald-400" : "bg-red-500"
              }`}
            />
            <span
              className={connected ? "text-emerald-400" : "text-red-400"}
            >
              {connected ? "Live" : "Disconnected"}
            </span>
          </div>
          <div className="text-[10px] text-zinc-500">
            {lastUpdate
              ? `Last update: ${new Date(lastUpdate).toLocaleTimeString()}`
              : "Waiting for prices..."}
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-[12px] text-zinc-400">
          Henüz fiyat verisi yok.
        </div>
      ) : (
        <table className="w-full text-[13px] text-zinc-200">
          <thead>
            <tr className="text-zinc-400">
              <th className="text-left pb-2">Token</th>
              <th className="text-right pb-2">Price (USD)</th>
              <th className="text-right pb-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((p) => (
              <tr key={p.symbol} className="border-t border-zinc-800">
                <td className="py-1 font-medium">{p.symbol}</td>
                <td className="py-1 text-right">
                  {Number(p.price).toLocaleString("en-US", {
                    maximumFractionDigits: 3,
                  })}
                </td>
                <td className="py-1 text-right text-zinc-500">
                  {new Date(p.ts).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
