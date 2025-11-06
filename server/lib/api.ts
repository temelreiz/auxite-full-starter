// auxite-full-starter/src/lib/api.ts
import type { PricesResponse } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export async function fetchPrices(chain?: number): Promise<PricesResponse> {
  const url = new URL("/api/prices", BASE);
  if (chain) url.searchParams.set("chain", String(chain));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`prices fetch failed: ${res.status}`);
  return res.json();
}
