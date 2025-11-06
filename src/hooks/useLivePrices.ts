import { useEffect, useRef, useState } from "react";

// Tipler
export type AuxSymbol = 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD';
export type PriceItem = { symbol: AuxSymbol; price: number; ts: number };

type WSMsg =
  | { type: "prices"; data: PriceItem[] }
  | { type: "ping" }
  | { type: "error"; error: string };

// Yardımcı: HTTP tek sefer
async function fetchPricesHTTP(): Promise<PriceItem[]> {
  const base = process.env.NEXT_PUBLIC_PRICE_API_BASE!;
  const r = await fetch(`${base}/api/prices`, { cache: "no-store" });
  const j = await r.json();
  if (!j?.ok || !Array.isArray(j.data)) throw new Error("bad payload");
  return j.data as PriceItem[];
}

/**
 * Canlı fiyat hook'u:
 * 1) WebSocket'e bağlanır, veri geldikçe set eder
 * 2) WS düşerse otomatik HTTP polling'e (5s) geçer
 * 3) WS geri gelirse polling durur
 */
export function useLivePrices() {
  const [data, setData] = useState<PriceItem[] | null>(null);
  const [status, setStatus] = useState<"ws" | "http" | "idle">("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- HTTP polling başlat/durdur
  const startPoll = () => {
    stopPoll();
    setStatus("http");
    pollRef.current = setInterval(async () => {
      try {
        const rows = await fetchPricesHTTP();
        setData(rows);
      } catch (e) {
        // console.warn("poll err", e);
      }
    }, 5000);
  };
  const stopPoll = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  // --- WebSocket bağlan
  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_PRICE_WS || "";
    if (!WS_URL) {
      startPoll();
      return () => stopPoll();
    }

    let closedByUs = false;

    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL, []); // subprotocol yok
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus("ws");
          stopPoll(); // WS aktifse polling’i kapat
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data) as WSMsg;
            if (msg?.type === "prices" && Array.isArray(msg.data)) {
              setData(msg.data);
            }
          } catch {
            /* ignore */
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (!closedByUs) {
            // geri bağlanmayı beklerken HTTP’ye düş
            startPoll();
            // 2sn sonra tekrar bağlanmayı dene
            setTimeout(connect, 2000);
          }
        };

        ws.onerror = () => {
          // Bazı durumlarda onerror hemen ardından onclose gelmiyor; güvenli tarafta ol
          try { ws.close(); } catch {}
        };
      } catch {
        // WS açılamadıysa polling
        startPoll();
      }
    };

    connect();
    return () => {
      closedByUs = true;
      stopPoll();
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
    };
  }, []);

  return { data, status };
}
