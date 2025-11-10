"use client";

import React from "react";
import { usePriceFeed } from "../hooks/usePriceFeed";

export const LivePrices: React.FC = () => {
  const { entries, connected, lastUpdate } = usePriceFeed();

  return (
    <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900/90 px-6 py-4 shadow-xl">
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Live Markets 🟢</h2>
            <span className="text-[10px] text-zinc-500">
              Real-time prices from Auxite watcher
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end text-[10px]">
          <span
            className={`flex items-center gap-1 ${
              connected ? "text-emerald-400" : "text-red-400"
            }`}
          >
            <span className="text-[9px]">●</span>
            {connected ? "Live" : "Disconnected"}
          </span>
          <span className="text-zinc-500">
            {lastUpdate
              ? `Last update: ${lastUpdate.toLocaleTimeString()}`
              : "Waiting for feed..."}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-xs md:text-[11px]">
          <thead className="text-zinc-500 border-b border-zinc-800/80">
            <tr>
              <th className="py-2 text-left font-normal">Token</th>
              <th className="py-2 text-left font-normal hidden md:table-cell">
                Chain
              </th>
              <th className="py-2 text-right font-normal">Price (USD)</th>
              <th className="py-2 text-right font-normal hidden md:table-cell">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-4 text-center text-[11px] text-zinc-500"
                >
                  Henüz fiyat verisi yok. Watcher'dan ilk mesaj bekleniyor.
                </td>
              </tr>
            ) : (
              entries.map((p) => (
                <tr
                  key={p.symbol}
                  className="border-b border-zinc-900/60 last:border-0"
                >
                  <td className="py-2 font-medium text-zinc-100">
                    {p.symbol}
                  </td>
                  <td className="py-2 text-zinc-500 hidden md:table-cell">
                    —
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {Number(p.price).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="py-2 text-right text-zinc-500 hidden md:table-cell tabular-nums">
                    {p.timestamp
                      ? new Date(p.timestamp).toLocaleTimeString()
                      : lastUpdate
                      ? lastUpdate.toLocaleTimeString()
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
