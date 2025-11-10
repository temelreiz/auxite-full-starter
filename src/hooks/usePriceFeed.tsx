"use client";

import { useEffect, useState } from "react";

export type PriceEntry = {
  symbol: string;
  price: number;
  ts: number;
};

type PricesMap = Record<string, PriceEntry>;

export function usePriceFeed() {
  const [prices, setPrices] = useState<PricesMap>({});
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
    const WS_URL =
      process.env.NEXT_PUBLIC_PRICES_WS_URL ||
      "wss://api.auxite.io/ws/prices";

    console.log("[Auxite] connecting to", WS_URL);
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("[Auxite] ws connected");
      setConnected(true);
    };

    ws.onclose = () => {
      console.log("[Auxite] ws disconnected");
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error("[Auxite] ws error", err);
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        // Beklenen format: { type: "prices", data: [ { symbol, price, ts? }, ... ] }
        if (msg?.type === "prices" && Array.isArray(msg.data)) {
          const next: PricesMap = { ...prices };

          msg.data.forEach((p: any) => {
            if (!p?.symbol || p.price == null) return;
            next[p.symbol] = {
              symbol: p.symbol,
              price: Number(p.price),
              ts: p.ts || Date.now(),
            };
          });

          setPrices((prev) => {
            const merged = { ...prev };
            msg.data.forEach((p: any) => {
              if (!p?.symbol || p.price == null) return;
              merged[p.symbol] = {
                symbol: p.symbol,
                price: Number(p.price),
                ts: p.ts || Date.now(),
              };
            });
            return merged;
          });

          setLastUpdate(Date.now());
          console.log("[Auxite] entries ", msg.data);
        }
      } catch (e) {
        console.error("[Auxite] ws parse error", e);
      }
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { prices, connected, lastUpdate };
}
