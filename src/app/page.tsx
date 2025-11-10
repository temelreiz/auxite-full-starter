"use client";

import React from "react";
import { LivePrices } from "@/components/LivePrices";

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Top header */}
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Auxite Markets & Tools
          </h1>
          <p className="text-sm text-zinc-400">
            Live oracle prices, allocation tools and upcoming Auxite Yield.
          </p>
        </header>

        {/* 1) Live Prices */}
        <section>
          <LivePrices />
        </section>

        {/* 2) Charts area */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price / Market chart placeholder */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Market Overview</h2>
              <span className="text-[10px] text-zinc-500">
                Charts / TV integration
              </span>
            </div>
            <div className="h-40 flex items-center justify-center text-xs text-zinc-500">
              {/* buraya daha sonra gerçek chart gelecek */}
              Chart placeholder (AUXG / AUXS / AUXPT / AUXPD)
            </div>
          </div>

          {/* Second chart / correlation / volatility */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Risk & Correlation</h2>
              <span className="text-[10px] text-zinc-500">
                Advanced metrics (soon)
              </span>
            </div>
            <div className="h-40 flex items-center justify-center text-xs text-zinc-500">
              {/* buraya risk / correlation grafikleri gelecek */}
              Metrics placeholder (volatility, correlation, etc.)
            </div>
          </div>
        </section>

        {/* 3) Allocation Finder */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Allocation Finder</h2>
            <span className="text-[10px] text-zinc-500">
              Build optimal AUX portfolios
            </span>
          </div>
          <p className="text-xs text-zinc-400 mb-3">
            Hedef risk & getiri seviyene göre AUXG / AUXS / AUXPT / AUXPD
            dağılımını hesaplayacağımız araç burada olacak.
          </p>
          <div className="h-24 flex items-center justify-center text-xs text-zinc-500 border border-dashed border-zinc-700 rounded-xl">
            Allocation Finder UI coming soon.
          </div>
        </section>

        {/* 4) Auxite Yield */}
        <section className="rounded-2xl border border-emerald-700/60 bg-emerald-900/10 p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Auxite Yield</h2>
            <span className="text-[10px] text-emerald-400">
              Upcoming yield products
            </span>
          </div>
          <p className="text-xs text-zinc-400 mb-3">
            Auxite ekosistemindeki faiz, gelir paylaşımı ve strateji ürünlerini
            burada tek ekranda göstereceğiz.
          </p>
          <div className="h-24 flex items-center justify-center text-xs text-zinc-500 border border-dashed border-emerald-700/50 rounded-xl">
            Auxite Yield module will be plugged in here.
          </div>
        </section>
      </div>
    </main>
  );
}
