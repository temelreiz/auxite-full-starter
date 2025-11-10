"use client";

import { useEffect, useState, useRef } from "react";

export interface PriceEntry {
  symbol: string;
  price: number;
  timestamp?: string;
}

interface FeedMessage {
  type: string;
  data?: any;
}

export function usePriceFeed() {
  const [prices, setPrices] = useState<Record<string, PriceEntry>>({});
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket("wss://api.auxite.io/ws/prices");
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as FeedMessage;

          if (msg.type === "prices" && Array.isArray(msg.data)) {
            const next: Record<string, PriceEntry> = {};
            let maxTs = 0;

            for (const item of msg.data) {
              if (!item.symbol || item.price == null) continue;

              const tsRaw = item.timestamp || item.ts || item.time;
              let ts: Date | null = null;

              if (tsRaw && !Number.isNaN(Date.parse(tsRaw))) {
                ts = new Date(tsRaw);
                if (ts.getTime() > maxTs) {
                  maxTs = ts.getTime();
                }
              }

              next[item.symbol] = {
                symbol: item.symbol,
                price: Number(item.price),
                timestamp: ts ? ts.toISOString() : undefined,
              };
            }

            setPrices(next);

            // Eğer mesajda timestamp yoksa bile, en azından "şu an"ı lastUpdate yap.
            if (maxTs > 0) {
              setLastUpdate(new Date(maxTs));
            } else {
              setLastUpdate(new Date());
            }
          }
        } catch (err) {
          console.error("[Auxite] price feed parse error", err);
        }
      };

      ws.onerror = (err) => {
        console.error("[Auxite] ws error", err);
      };

      ws.onclose = () => {
        setConnected(false);
        // basit reconnect
        setTimeout(() => {
          if (wsRef.current === ws) {
            connect();
          }
        }, 3000);
      };
    }

    connect();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const entries = Object.values(prices).sort((a, b) =>
    a.symbol.localeCompare(b.symbol)
  );

  return { prices, entries, connected, lastUpdate };
}
