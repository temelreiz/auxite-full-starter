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
        // console.log("[Auxite] ws connected");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as FeedMessage;

          if (msg.type === "prices" && Array.isArray(msg.data)) {
            const next: Record<string, PriceEntry> = {};
            let maxTs = lastUpdate ? lastUpdate.getTime() : 0;

            for (const item of msg.data) {
              if (!item.symbol || item.price == null) continue;

              const tsRaw = item.timestamp || item.ts || item.time;
              const ts =
                tsRaw && !Number.isNaN(Date.parse(tsRaw))
                  ? new Date(tsRaw)
                  : null;

              if (ts && ts.getTime() > maxTs) {
                maxTs = ts.getTime();
              }

              next[item.symbol] = {
                symbol: item.symbol,
                price: Number(item.price),
                timestamp: ts ? ts.toISOString() : undefined,
              };
            }

            setPrices(next);
            if (maxTs > 0) setLastUpdate(new Date(maxTs));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entries = Object.values(prices).sort((a, b) =>
    a.symbol.localeCompare(b.symbol)
  );

  return { prices, entries, connected, lastUpdate };
}
