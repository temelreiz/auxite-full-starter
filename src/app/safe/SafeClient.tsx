// src/app/safe/SafeClient.tsx
"use client";

import { useState } from "react";
import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { useAccount } from "wagmi";

import ProtocolKit from "@safe-global/protocol-kit";
import type { SafeAccountConfig } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";

const RPC = process.env.NEXT_PUBLIC_RPC_BASE!;
const CHAIN = base;
const SAFE_TX_SERVICE_URL =
  process.env.NEXT_PUBLIC_SAFE_TX_SERVICE_URL ??
  "https://safe-transaction-base.safe.global";

export default function SafeClient() {
  const { address } = useAccount();
  const [status, setStatus] = useState<string>("");

  async function handlePredict() {
    try {
      setStatus("Hazırlanıyor…");

      createPublicClient({ chain: CHAIN, transport: http(RPC) });

      if (!address) {
        setStatus("Lütfen cüzdan bağlayın.");
        return;
      }

      const safeAccountConfig: SafeAccountConfig = {
        owners: [address as Address],
        threshold: 1,
      };

      const pk = await ProtocolKit.init({
        provider: (globalThis as any).ethereum ?? RPC,
        signer: address as Address,
        predictedSafe: {
          safeAccountConfig,
          // saltNonce kaldırıldı — tipler bu alanı kabul etmiyor
        },
      });

      const safeAddr = await pk.getAddress();
      const alreadyDeployed = await pk.isSafeDeployed();

      let msg = `Tahmin edilen Safe adresi: ${safeAddr}\n`;
      msg += alreadyDeployed
        ? "ℹ️ Bu Safe zaten deploy edilmiş."
        : "🟡 Bu Safe henüz deploy edilmemiş.";

      try {
        const api = new SafeApiKit({
          chainId: BigInt(CHAIN.id),
          txServiceUrl: SAFE_TX_SERVICE_URL,
        });
        const info = await api.getSafeInfo(safeAddr as Address);
        msg += `\nSTS: threshold=${info.threshold}, owners=${info.owners.length}`;
      } catch {
        msg += `\nSTS yok veya ağ desteklenmiyor.`;
      }

      setStatus(msg);
    } catch (err: any) {
      setStatus(`Hata: ${err?.message ?? String(err)}`);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Safe (Gnosis Safe) – Predict & Inspect</h1>
      {!address && (
        <div className="rounded-lg border p-3 text-sm">
          Cüzdan bağlı değil. Lütfen üst menüden cüzdanınızı bağlayın.
        </div>
      )}

      <button
        onClick={handlePredict}
        className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50"
        disabled={!address}
      >
        {address ? "Predict Safe & Inspect" : "Cüzdan gerekli"}
      </button>

      {status && (
        <pre className="whitespace-pre-wrap rounded-lg border p-3 text-sm">{status}</pre>
      )}
    </div>
  );
}
