// src/lib/api.ts
// 🔗 Auxite API & WebSocket helpers

export type PriceRow = {
  address: string;
  price: number;
  round_id: string;
  updated_at_ts: string; // unix seconds
  dir?: "up" | "down" | "flat";
};

// Base URL’leri ortamdan oku
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export const WS_BASE =
  process.env.NEXT_PUBLIC_WS_BASE || "ws://localhost:3001";

/**
 * REST üzerinden fiyatları çeker (fallback olarak kullanılır)
 */
export async function fetchPrices(chainId: number): Promise<PriceRow[]> {
  const url = `${API_BASE}/api/prices?chain=${chainId}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`prices fetch failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) throw new Error("prices payload is not array");

    // Normalize et
    return data.map((r: any) => ({
      address: String(r.address).toUpperCase(),
      price: Number(r.price),
      round_id: String(r.round_id ?? "0"),
      updated_at_ts: String(r.updated_at_ts ?? "0"),
      dir: (r.dir as "up" | "down" | "flat") ?? "flat",
    }));
  } catch (err) {
    console.error("fetchPrices error:", err);
    throw err;
  }
}

/**
 * WebSocket bağlantısı kurar, fiyat güncellemelerini canlı dinler
 */
export function createPriceSocket(
  onMessage: (payload: any) => void,
  onError?: (err: any) => void
): WebSocket {
  const wsUrl = `${WS_BASE}/ws/prices`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("[WS] Connected →", wsUrl);
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg?.type === "price_update") onMessage(msg);
    } catch (e) {
      console.error("[WS] parse error", e);
    }
  };

  ws.onerror = (e) => {
    console.error("[WS] error", e);
    onError?.(e);
  };

  ws.onclose = () => {
    console.warn("[WS] closed");
    // basit auto-reconnect (isteğe bağlı)
    setTimeout(() => createPriceSocket(onMessage, onError), 3000);
  };

  return ws;
}
