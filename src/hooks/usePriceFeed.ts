"use client";

import { useEffect, useRef, useState } from "react";

type RawPrice = {
  symbol: string;
  price: number;
  ts?: number;
};

type Envelope =
  | { type: "prices"; data: RawPrice[] }
  | RawPrice[]
  | RawPrice;

type PriceEntry = {
  symbol: string;
  price: number;
  ts: number;
};

type PriceMap = Record<string, PriceEntry>;

const WS_URL =
  process.env.NEXT_PUBLIC_AUXITE_WS_URL ||
  "wss://api.auxite.io/ws/prices";

export function usePriceFeed() {
  const [prices, setPrices] = useState<PriceMap>({});
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const applyPrices = (list: RawPrice[]) => {
      if (!list || list.length === 0) return;

      setPrices((prev) => {
        const next: PriceMap = { ...prev };
        let maxTs = lastUpdate ?? 0;

        for (const p of list) {
          if (!p || !p.symbol) continue;
          const ts = p.ts ?? Date.now();
          next[p.symbol] = {
            symbol: p.symbol,
            price: Number(p.price),
            ts,
          };
          if (ts > maxTs) maxTs = ts;
        }

        setLastUpdate(maxTs || Date.now());
        return next;
      });
    };

    const handleMessage = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data as string) as Envelope;
        console.log("[Auxite] price feed message:", msg);

        if (Array.isArray(msg)) {
          applyPrices(msg);
        } else if ("type" in msg && msg.type === "prices" && Array.isArray(msg.data)) {
          applyPrices(msg.data);
        } else if ("symbol" in msg) {
          applyPrices([msg as RawPrice]);
        }
      } catch (err) {
        console.error("[Auxite] failed to parse price message", err);
      }
    };

    const connect = () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = handleMessage;

      ws.onerror = () => {
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        if (!reconnectRef.current) {
          reconnectRef.current = setTimeout(() => {
            reconnectRef.current = null;
            connect();
          }, 3000);
        }
      };
    };

    connect();

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { prices, connected, lastUpdate };
}
