// örn: src/components/PricesLive.tsx
"use client";
import { useLivePrices } from "@/hooks/useLivePrices";

export default function PricesLive() {
  const { data, status } = useLivePrices();

  return (
    <div className="p-4 rounded-2xl shadow bg-white">
      <div className="text-sm text-gray-500 mb-2">
        Feed: <b>{status.toUpperCase()}</b>
      </div>
      {!data && <div>Loading…</div>}
      {data && (
        <ul className="grid grid-cols-2 gap-2">
          {data.map(r => (
            <li key={r.symbol} className="flex items-baseline gap-2">
              <span className="font-semibold w-14">{r.symbol}</span>
              <span>{r.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
