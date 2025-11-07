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
 * Gelen raw WebSocket mesajını standart Price[] listesine çevir.
 * Şu formatı destekliyoruz:
 *
 *  { type: "prices", data: [ { symbol, chain?, price, updatedAt? }, ... ] }
 */
function normalize(msg: RawMsg): Price[] | null {
  if (!msg) return null;

  // Yeni gerçek format: { type: "prices", data: [...] }
  if (msg.type === 'prices' && Array.isArray(msg.data)) {
    return msg.data
      .map((p: any) => {
        // Sembole esnek yaklaş: symbol / token / metal
        const symbol = p.symbol || p.token || p.metal;
        // Fiyat: price / usd / value tarzı alanlardan biri
        const price =
          typeof p.price === 'number'
            ? p.price
            : typeof p.usd === 'number'
            ? p.usd
            : typeof p.value === 'number'
            ? p.value
            : null;

        if (!symbol || price === null) return null;

        const chain = p.chain || p.network || p.net || undefined;
        const updatedAt =
          typeof p.updatedAt === 'string'
            ? p.updatedAt
            : p.ts
            ? new Date(p.ts).toISOString()
            : undefined;

        return {
          id: `${symbol}-${chain || 'main'}`,
          symbol,
          chain,
          price,
          updatedAt,
        } as Price;
      })
      .filter((x: Price | null) => !!x) as Price[];
  }

  // Eski olası formatları da yedekte tutalım:
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

  if (Array.isArray(msg.prices)) {
    return msg.prices
      .filter((p: any) => p && p.symbol && typeof p.price === 'number')
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
