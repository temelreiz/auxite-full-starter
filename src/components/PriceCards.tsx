// src/components/PriceCards.tsx
"use client";
import { fmt2, type PriceItem, type Metal } from "@/lib/prices";
import { usePrices } from "@/hooks/usePrices";

export default function PriceCards() {
  const { data, isLoading, error, wsStatus, lastUpdated, history } = usePrices();

  if (error) return <div className="p-4 rounded-xl bg-red-50 text-red-700">Price feed error</div>;
  if (isLoading || !data) return <div className="p-4">Loading prices…</div>;

  const badge =
    wsStatus === "open" ? (
      <span className="px-2 py-0.5 rounded text-xs bg-green-500/15 text-green-700">WS Live</span>
    ) : (
      <span className="px-2 py-0.5 rounded text-xs bg-amber-500/15 text-amber-700">HTTP Polling</span>
    );

  return (
    <section className="px-5 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Auxite Metal Prices</h2>
        {badge}
        <span className="text-xs text-neutral-500">
          {lastUpdated ? new Date(lastUpdated).toLocaleTimeString("tr-TR") : ""}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.map((p: PriceItem) => {
          const key = p.symbol as Metal;                 // <-- türü garanti et
          const series = (history[key] ?? []).slice(-80); // son 80 nokta
          return (
            <article key={p.symbol} className="rounded-xl border border-neutral-200 p-4">
              <div className="text-sm text-neutral-500">{p.symbol}</div>
              <div className="text-2xl font-semibold mt-1">{fmt2(p.price)}</div>
              <div className="text-[11px] text-neutral-400 mt-1">
                {p.ts ? new Date(p.ts as any).toLocaleTimeString("tr-TR") : ""}
              </div>
              {/* İstersen burada series ile küçük sparkline çizersin */}
            </article>
          );
        })}
      </div>
    </section>
  );
}
