'use client';

import { useEffect, useRef, useState } from 'react';

type RawMsg = any;

export type Price = {
  id: string;
  symbol: string;
  chain?: string;
  price: number;
  updatedAt?: string;
};

const WS_URL =
  process.env.NEXT_PUBLIC_PRICE_FEED_WS ||
  'wss://api.auxite.io/ws/prices';

function normalize(msg: RawMsg): Price[] | null {
  if (!msg) return null;

  // tek kayıt
  if (msg.type === 'price' && msg.symbol && typeof msg.price === 'number') {
    return [
      {
        id: `${msg.symbol}-${msg.chain || 'main'}`,
        symbol: msg.symbol,
        chain: msg.chain,
        price: msg.price,
        updatedAt: msg.updatedAt,
      },
    ];
  }

  // liste
  if (Array.isArray(msg.prices)) {
    return msg.prices
      .filter((p: any) => p.symbol && typeof p.price === 'number')
      .map((p: any) => ({
        id: `${p.symbol}-${p.chain || 'main'}`,
        symbol: p.symbol,
        chain: p.chain,
        price: p.price,
        updatedAt: p.updatedAt,
      }));
  }

  return null;
}

export function usePriceFeed() {
  const [prices, setPrices] = useState<Record<string, Price>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let alive = true;

    function connect() {
      if (!alive) return;

      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!alive) return;
          setConnected(true);
          setError(null);
        };

        ws.onclose = () => {
          if (!alive) return;
          setConnected(false);
          // hafif retry, agresif değil
          setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          if (!alive) return;
          setError('Price feed connection failed');
        };

        ws.onmessage = (ev) => {
          if (!alive) return;
          try {
            const data = JSON.parse(ev.data);
            const list = normalize(data);
            if (!list) return;
            setPrices((prev) => {
              const next = { ...prev };
              for (const p of list) next[p.id] = p;
              return next;
            });
          } catch {
            // ignore
          }
        };
      } catch (e) {
        if (!alive) return;
        setError('Price feed init error');
        setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      alive = false;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    prices: Object.values(prices),
    connected,
    error,
  };
}
