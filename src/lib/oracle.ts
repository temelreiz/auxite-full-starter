import { createPublicClient, http, Address } from "viem";
import { base, sepolia } from "viem/chains";

const chainName = (process.env.NEXT_PUBLIC_CHAIN || "base").toLowerCase();
const chain = chainName === "sepolia" ? sepolia : base;
const rpc = chain === base ? process.env.NEXT_PUBLIC_RPC_BASE! : process.env.NEXT_PUBLIC_RPC_SEPOLIA!;

export const client = createPublicClient({ chain, transport: http(rpc) });

export const ORACLES: Record<string, Address | undefined> = {
  AUXG: process.env.NEXT_PUBLIC_ORACLE_AUXG as Address | undefined,
  AUXS: process.env.NEXT_PUBLIC_ORACLE_AUXS as Address | undefined,
  AUXPT: process.env.NEXT_PUBLIC_ORACLE_AUXPT as Address | undefined,
  AUXPD: process.env.NEXT_PUBLIC_ORACLE_AUXPD as Address | undefined,
};

export const ORACLE_ABI = [
  // minimal: function latestPrice() view returns (int256)
  { "inputs": [], "name": "latestPrice", "outputs": [{"internalType":"int256","name":"","type":"int256"}], "stateMutability":"view", "type":"function" }
] as const;
