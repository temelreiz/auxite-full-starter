// src/lib/prices.ts
export type Metal = "AUXG" | "AUXS" | "AUXPT" | "AUXPD";

export type PriceItem = {
  symbol: Metal;
  price: number;
  ts?: string | number | null;
};

export type Tick = { t: number; v: number };
export type History = Record<Metal, Tick[]>;

export const ALL_METALS: Metal[] = ["AUXG", "AUXS", "AUXPT", "AUXPD"];

export const fmt2 = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
