// src/lib/PriceClient.ts
// HTTP polling ile fiyat çekme yardımcıları

// ---- Tipler (ui/price.ts ile uyumlu) ----
export type AuxSymbol = 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD';

export type PriceItem = {
  symbol: AuxSymbol;
  price: number;
  ts: number; // epoch ms
};

export type PricesResponse = {
  ok: boolean;
  data: PriceItem[];
  updatedAt: string;
};

// Base URL — Next.js'te NEXT_PUBLIC_* değişkeni derleme anında gömülür
const API_BASE = process.env.NEXT_PUBLIC_PRICE_API_BASE!;
if (!API_BASE) {
  // Dev sırasında gözden kaçarsa konsola net uyarı verelim
  // (Prod build'de tree-shake edilmez ama zararsız)
  // eslint-disable-next-line no-console
  console.warn('NEXT_PUBLIC_PRICE_API_BASE is empty! Set it in your .env');
}

// ---- Tek seferlik çekim ----
export async function fetchPricesHTTP(opts?: { signal?: AbortSignal }): Promise<PriceItem[]> {
  const url = `${API_BASE}/api/prices`;
  const res = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    signal: opts?.signal,
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${text || 'unable to fetch /api/prices'}`);
  }

  const json = (await res.json()) as PricesResponse;
  if (!json?.ok || !Array.isArray(json.data)) {
    throw new Error('Malformed price payload');
  }
  return json.data;
}

// ---- Tek sembol çekme (opsiyonel) ----
export async function fetchPriceHTTP(symbol: AuxSymbol, opts?: { signal?: AbortSignal }): Promise<PriceItem> {
  const url = `${API_BASE}/api/prices/${symbol}`;
  const res = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    signal: opts?.signal,
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${text || `unable to fetch ${symbol}`}`);
  }

  const json = (await res.json()) as { ok: boolean; data: PriceItem };
  if (!json?.ok || !json.data) {
    throw new Error('Malformed price payload');
  }
  return json.data;
}

// ---- Polling başlat/bitir yardımcıları ----
export type PollerHandle = { stop: () => void };

export function startPricePolling(args: {
  intervalMs?: number;                 // varsayılan 5000
  onData: (rows: PriceItem[]) => void; // her başarılı çekimde çalışır
  onError?: (err: unknown) => void;    // hata olursa bilgilendirme
}): PollerHandle {
  const { onData, onError } = args;
  const baseInterval = Math.max(1000, args.intervalMs ?? 5000);

  let aborter: AbortController | null = null;
  let stopped = false;
  let backoffMs = 0; // hata olunca artacak
  let timer: ReturnType<typeof setTimeout> | null = null;

  const loop = async () => {
    if (stopped) return;

    aborter = new AbortController();
    try {
      const data = await fetchPricesHTTP({ signal: aborter.signal });
      onData(data);
      backoffMs = 0; // başarıyla sıfırla
    } catch (err) {
      backoffMs = Math.min(15000, backoffMs ? backoffMs * 2 : 2000);
      onError?.(err);
    } finally {
      aborter = null;
      if (!stopped) {
        const jitter = Math.floor(Math.random() * 400); // ±200ms civarı
        const wait = baseInterval + backoffMs + jitter;
        timer = setTimeout(loop, wait);
      }
    }
  };

  // hemen ilk çekimi yap
  void loop();

  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      if (aborter) aborter.abort();
    },
  };
}
