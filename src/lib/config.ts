// src/lib/config.ts

export type ChainInfo = {
  name: string;
  explorer: string;   // block explorer base URL
  wsUrl: string;      // websocket base URL
};

export const CHAINS: Record<number, ChainInfo> = {
  84532: {
    name: "Base Sepolia",
    explorer: "https://sepolia.basescan.org/address/",
    wsUrl: "wss://base-sepolia.g.alchemy.com/v2/demo",
  },
  8453: {
    name: "Base Mainnet",
    explorer: "https://basescan.org/address/",
    wsUrl: "wss://base-mainnet.g.alchemy.com/v2/demo",
  },
};

// API ve WS endpointleri (env ile override edilebilir)
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api.auxite.io";

export const PRICE_HTTP =
  process.env.NEXT_PUBLIC_PRICE_URL ?? `${API_BASE}/watcher/prices`;

export const PRICE_WS =
  process.env.NEXT_PUBLIC_PRICE_WS ?? `${API_BASE.replace("https", "wss")}/ws/prices`;

/** Explorer link oluşturur */
export function explorerUrl(chainId: number, address: string): string {
  const chain = CHAINS[chainId];
  return chain?.explorer ? `${chain.explorer}${address}` : address;
}

/** Zincir adı döndürür */
export function chainName(chainId: number): string {
  return CHAINS[chainId]?.name ?? `Chain ${chainId}`;
}

/** Zincir WS URL döndürür */
export function wsUrl(chainId: number): string | undefined {
  return CHAINS[chainId]?.wsUrl;
}

/** Auxite token sembolleri (UI genelinde ortak) */
export const METALS = ["AUXG", "AUXS", "AUXPT", "AUXPD"] as const;
export type Metal = (typeof METALS)[number];

/** Basit fiyat biçimlendirme */
export const fmt2 = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

