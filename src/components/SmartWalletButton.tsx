// src/components/SmartWalletButton.tsx
"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

function shorten(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export default function SmartWalletButton() {
  // SSR hydration sorunlarını önlemek için
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected, isConnecting } = useAccount();
  const { connectors, connect, status: connectStatus, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();

  if (!mounted) {
    return (
      <button
        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 opacity-60"
        disabled
      >
        Cüzdan…
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10">
          {shorten(address)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Bağlı değilse: ilk uygun connector ile bağla (örn. Injected / MetaMask)
  const primary = connectors?.[0];

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => primary && connect({ connector: primary })}
        disabled={!primary || isConnecting || connectStatus === "pending"}
        className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60"
      >
        {isConnecting || connectStatus === "pending" ? "Bağlanıyor…" : "Cüzdan Bağla"}
      </button>

      {/* Birden fazla connector varsa (örn. WalletConnect), listele */}
      {connectors.slice(1).map((c) => (
        <button
          key={c.uid}
          onClick={() => connect({ connector: c })}
          className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
        >
          {c.name}
        </button>
      ))}

      {connectError ? (
        <span className="text-xs text-red-600 ml-2">{connectError.message}</span>
      ) : null}
    </div>
  );
}
