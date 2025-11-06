// src/app/safe/page.tsx
import dynamic from "next/dynamic";

// Wagmi/useAccount kullanan içerik client-side çalışmalı, SSR devre dışı
const SafeClient = dynamic(() => import("./SafeClient"), { ssr: false });

export default function SafePage() {
  return <SafeClient />;
}
