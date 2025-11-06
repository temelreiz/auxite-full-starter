"use client";
import { useState } from "react";
import { Address, Hex, createPublicClient, getAddress, http, zeroAddress } from "viem";
import { base, sepolia } from "viem/chains";

const SIMPLE_ABI = [
  { inputs: [], name: "latestPrice", outputs: [{ internalType: "int256", name: "", type: "int256" }], stateMutability: "view", type: "function" },
] as const;

const AGG_V3_ABI = [
  { inputs: [], name: "decimals", outputs: [{ internalType:"uint8", name:"", type:"uint8" }], stateMutability:"view", type:"function" },
  {
    inputs: [], name: "latestRoundData", outputs: [
      { internalType:"uint80", name:"roundId", type:"uint80" },
      { internalType:"int256", name:"answer", type:"int256" },
      { internalType:"uint256", name:"startedAt", type:"uint256" },
      { internalType:"uint256", name:"updatedAt", type:"uint256" },
      { internalType:"uint80", name:"answeredInRound", type:"uint80" },
    ], stateMutability:"view", type:"function"
  },
] as const;

// EIP-1967 implementation slot = keccak256("eip1967.proxy.implementation") - 1
const EIP1967_IMPL_SLOT: Hex = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

const chainName = (process.env.NEXT_PUBLIC_CHAIN || "base").toLowerCase();
const chain = chainName === "sepolia" ? sepolia : base;
const rpc = chain === base ? process.env.NEXT_PUBLIC_RPC_BASE! : process.env.NEXT_PUBLIC_RPC_SEPOLIA!;
const client = createPublicClient({ chain, transport: http(rpc) });

export default function OracleTester() {
  const [addr, setAddr] = useState<string>("");
  const [value, setValue] = useState<string>("—");
  const [status, setStatus] = useState<string>("");

  async function resolveImplementation(a: Address): Promise<Address> {
    // EIP-1967 implementation?
    try {
      const implRaw = await client.getStorageAt({ address: a, slot: EIP1967_IMPL_SLOT });
      if (implRaw && implRaw !== "0x") {
        const impl = ("0x" + implRaw.slice(26)) as Address; // last 20 bytes
        if (impl.toLowerCase() !== zeroAddress) return impl;
      }
    } catch {}
    return a;
  }

  async function readNow() {
    setStatus("Detecting…");
    setValue("—");
    try {
      const address = getAddress(addr) as Address;

      // 0) Adres kontrat mı?
      const code = await client.getBytecode({ address });
      if (!code) {
        setStatus("Not a contract on this chain");
        setValue("Adres EOA olabilir ya da yanlış ağdasın.");
        return;
      }

      // 1) Proxy ise implementation’a bak
      const target = await resolveImplementation(address);

      // 2) Chainlink AggregatorV3 dene
      try {
        const [dec] = (await client.readContract({
          address: target, abi: AGG_V3_ABI, functionName: "decimals",
        })) as unknown as [number];
        const [, answer] = (await client.readContract({
          address: target, abi: AGG_V3_ABI, functionName: "latestRoundData",
        })) as unknown as [bigint, bigint, bigint, bigint, bigint];
        const v = Number(answer) / 10 ** dec;
        setStatus("OK (AggregatorV3)");
        setValue(`${v} (decimals: ${dec})`);
        return;
      } catch {/* fallthrough */}

      // 3) Basit latestPrice() dene
      try {
        const raw = (await client.readContract({
          address: target, abi: SIMPLE_ABI, functionName: "latestPrice",
        })) as bigint;
        // Varsayılan ölçek tahmini (gerekirse çarpanı değiştir)
        const guess = Math.abs(Number(raw)) > 1e10 ? 1e8 : 1e2;
        const v = Number(raw) / guess;
        setStatus("OK (latestPrice)");
        setValue(`${v} (scale guess: 1e${Math.log10(guess)})`);
        return;
      } catch {/* fallthrough */}

      setStatus("Unsupported ABI");
      setValue("latestRoundData/decimals veya latestPrice bulunamadı.");
    } catch (e: any) {
      setStatus("Error");
      setValue(String(e?.message || e));
    }
  }

  return (
    <div className="grid gap-6 max-w-2xl mx-auto">
      <h2 className="h2">Oracle Tester ({chain.name})</h2>

      <div className="a-card p-4 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm opacity-70">Oracle Address</span>
          <input
            className="bg-transparent border border-neutral-700 rounded px-2 py-2"
            placeholder="0xF694...CA89"
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
          />
        </label>

        <div className="flex gap-2">
          <button className="a-btn" onClick={readNow}>Read (Auto-detect)</button>
          <span className="self-center text-sm opacity-70">{status}</span>
        </div>

        <div className="text-sm">
          <div className="opacity-70">Value</div>
          <pre className="mt-1 p-2 bg-black/40 rounded border border-neutral-800 overflow-auto">
            {value}
          </pre>
        </div>
      </div>
    </div>
  );
}
