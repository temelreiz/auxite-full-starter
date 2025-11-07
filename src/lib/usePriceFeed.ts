'use client';

import { useEffect, useRef, useState } from 'react';

export type Price = {
  id: string;       // unique: symbol+chain
  symbol: string;
  chain?: string;
  price: number;
  updatedAt?: string;
};

type RawMsg = any;

const WS_URL =
  process.env.NEXT_PUBLIC_PRICE_FEED_WS ||
  'wss://api.auxite.io/ws/prices';

/**
 * Gelen raw WebSocket mesajını standart Price[] listesine çevirir.
 * Burayı gerçek payload formatına göre kolayca uyarlayabiliriz.
 */
function normalize(msg: RawMsg): Price[] | null {
  if (!msg) return null;

  // Örnek 1:
  // { "type": "price", "symbol": "AUXG", "chain": "base-sepolia", "price": 78.12, "updatedAt": "..." }
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

  // Örnek 2:
  // { "prices": [ { "symbol": "AUXG", "chain": "base", "price": 78.12 }, ... ] }
  if (Array.isArray(msg.prices)) {
    return msg.prices
      .filter(
        (p: any) => p && p.symbol && typeof p.price === 'number',
      )
      .map((p: any) => ({
        id: `${p.symbol}-${p.chain || 'main'}`,
        symbol: p.symbol,
        chain: p.chain,
        price: p.price,
        updatedAt: p.updatedAt,
      }));
  }

  // Başka format geliyorsa şimdilik yok sayıyoruz
  return null;
}

/**
 * usePriceFeed
 * - WebSocket'e bağlanır
 * - gelen mesajları normalize edip state'e yazar
 * - otomatik reconnect yapar
 */
export function usePriceFeed() {
  const [prices, setPrices] = useState<Record<string, Price>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    let alive = true;

    function cleanup() {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    function scheduleReconnect() {
      if (!alive) return;
      if (reconnectTimer.current) return;

      reconnectTimer.current = setTimeout(() => {
        reconnectTimer.current = null;
        connect();
      }, 3000);
    }

    function connect() {
      if (!alive) return;

      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!alive) return;
          setConnected(true);
          setError(null);
          // console.debug('[Auxite] price feed connected:', WS_URL);
        };

        ws.onclose = () => {
          if (!alive) return;
          setConnected(false);
          scheduleReconnect();
        };

        ws.onerror = () => {
          if (!alive) return;
          setError('Price feed connection failed');
          scheduleReconnect();
        };

        ws.onmessage = (event: MessageEvent) => {
          if (!alive) return;

          try {
            const data = JSON.parse(event.data as string);
            // Debug: gerçek payload'u görmek için
            // Prod’da rahatsız ederse yorum satırı yaparız.
            // eslint-disable-next-line no-console
            console.debug('[Auxite] price feed message:', data);

            const list = normalize(data);
            if (!list || list.length === 0) return;

            setPrices((prev) => {
              const next = { ...prev };
              for (const p of list) {
                next[p.id] = p;
              }
              return next;
            });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.debug(
              '[Auxite] non-JSON price feed message:',
              event.data,
            );
          }
        };
      } catch (e) {
        if (!alive) return;
        setError('Price feed init error');
        scheduleReconnect();
      }
    }

    connect();

    return () => {
      alive = false;
      cleanup();
    };
  }, []);

  return {
    prices: Object.values(prices),
    connected,
    error,
  };
}
