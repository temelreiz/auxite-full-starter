// src/lib/wsPrices.ts
type PriceRow = { symbol: string; price: number; ts: number };
type PricesMsg = { type: 'prices'; data: PriceRow[] };

export function connectPriceWS(onData: (rows: PriceRow[]) => void) {
  const WS_URL = process.env.NEXT_PUBLIC_PRICE_WS!;
  let ws: WebSocket | null = null;
  let retry = 1000; // 1s -> max 10s
  let ping: any;

  const open = () => {
    ws = new WebSocket(WS_URL);
    ws.onopen = () => {
      retry = 1000;
      ping = setInterval(() => ws?.send?.('ping'), 30_000); // keepalive
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as PricesMsg;
        if (msg?.type === 'prices' && Array.isArray(msg.data)) onData(msg.data);
      } catch {}
    };
    ws.onclose = () => {
      clearInterval(ping);
      setTimeout(open, Math.min((retry *= 2), 10_000));
    };
    ws.onerror = () => ws?.close();
  };

  open();
  return () => {
    clearInterval(ping);
    ws?.close();
  };
}
