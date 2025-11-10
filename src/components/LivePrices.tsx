"use client";

import React from "react";
import { usePriceFeed } from "@/hooks/usePriceFeed";

export const LivePrices: React.FC = () => {
  const { prices, connected, lastUpdate } = usePriceFeed();

  const entries = Object.values(prices || {}).sort((a, b) =>
    a.symbol.localeCompare(b.symbol)
  );

  // Debug için: tarayıcı konsolunda gerçek datayı gör
  console.log("[Auxite] entries", entries);

  return (
    <div className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/80 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-zinc-50">
            Live Markets
          </div>
          <div className="text-[10px] text-zinc-500">
            Powered by Auxite watcher
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-[10px]">
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
          <div className="text-[9px] text-zinc-500">
            {lastUpdate
              ? `Last update: ${new Date(lastUpdate).toLocaleTimeString()}`
              : "Waiting for prices..."}
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-[11px] text-zinc-500">
          Henüz fiyat verisi yok.
        </div>
      ) : (
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-zinc-500">
              <th className="text-left font-normal pb-2">Token</th>
              <th className="text-left font-normal pb-2">Chain</th>
              <th className="text-right font-normal pb-2">Price</th>
              <th className="text-right font-normal pb-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((p) => (
              <tr key={p.symbol} className="text-zinc-100">
                <td className="py-1">{p.symbol}</td>
                <td className="py-1 text-zinc-500">—</td>
                <td className="py-1 text-right">
                  {Number(p.price).toLocaleString("en-US", {
                    maximumFractionDigits: 6,
                  })}
                </td>
                <td className="py-1 text-right text-emerald-400">
                  Live
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
