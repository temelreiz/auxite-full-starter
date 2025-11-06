// src/hooks/usePrices.ts
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_METALS, type History, type Metal, type PriceItem } from "@/lib/prices";

type WsStatus = "idle" | "open" | "closed" | "error";

export function usePrices() {
  const [data, setData] = useState<PriceItem[] | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setErr] = useState<unknown>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>("idle");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // History başlangıç
  const historyRef = useRef<History>({
    AUXG: [],
    AUXS: [],
    AUXPT: [],
    AUXPD: [],
  });

  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_PRICE_WS!;
    const HTTP_URL = process.env.NEXT_PUBLIC_PRICE_URL!;

    let ws: WebSocket | null = null;
    let httpTimer: any = null;

    const upsert = (items: PriceItem[]) => {
      // state
      setData(items);
      setLoading(false);
      setErr(null);
      setLastUpdated(new Date().toISOString());

      // history
      const h = historyRef.current;
      for (const it of items) {
        const sym = it.symbol as Metal;
        const t = typeof it.ts === "number" ? it.ts : Date.parse(String(it.ts ?? Date.now()));
        const v = it.price;
        h[sym].push({ t, v });
        if (h[sym].length > 500) h[sym] = h[sym].slice(-500);
      }
    };

    const startWS = () => {
      try {
        ws = new WebSocket(WS_URL);
        ws.onopen = () => setWsStatus("open");
        ws.onclose = () => setWsStatus("closed");
        ws.onerror = () => setWsStatus("error");
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data as string);
            if (msg?.type === "prices" && Array.isArray(msg.data)) {
              upsert(msg.data as PriceItem[]);
            }
          } catch {}
        };
      } catch (e) {
        setWsStatus("error");
      }
    };

    const pollHTTP = async () => {
      try {
        const r = await fetch(HTTP_URL, { cache: "no-store" });
        const json = await r.json();
        const items: PriceItem[] = ALL_METALS.map((m) => ({
          symbol: m,
          price: Number(json[m].usd),
          ts: json[m].ts,
        }));
        upsert(items);
      } catch (e) {
        setErr(e);
      }
    };

    // Başlat
    startWS();
    httpTimer = setInterval(pollHTTP, 60_000);
    pollHTTP();

    return () => {
      if (ws && ws.readyState === 1) ws.close();
      clearInterval(httpTimer);
    };
  }, []);

  const history = historyRef.current;
  return { data, isLoading, error, wsStatus, lastUpdated, history };
}
