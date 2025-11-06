// auxite-full-starter/src/lib/types.ts
export type OracleRow = {
  address_hex: string;       // "4544...CCDA"
  current_e6: string;        // "133000000"
  round_id: string;          // "0"
  updated_at_ts: string;     // unix sec as string
};

export type PricesResponse = {
  ok: boolean;
  chainId: number;
  rows: OracleRow[];
  asOf: number;
};
