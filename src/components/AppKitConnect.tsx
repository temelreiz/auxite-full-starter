"use client";
import { useEffect } from "react";
import { createAppKit } from "@reown/appkit/react";

export default function AppKitConnect() {
  const open = () => {
    const anyWin = window as any;
    const kit = anyWin?.appKit || (createAppKit as any).getInstance?.();
    kit?.open?.();
  };

  useEffect(() => {
    (window as any).appKit = (createAppKit as any).getInstance?.();
  }, []);

  return (
    <button
      onClick={open}
      className="px-3 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800"
    >
      Connect Wallets
    </button>
  );
}
