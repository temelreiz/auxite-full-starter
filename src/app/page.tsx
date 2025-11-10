import { LivePrices } from "@/components/LivePrices";
// AllocationFinder ve AuxiteYield bileşenlerini sonra dolduracağız
// şimdilik placeholder:
const AllocationFinder = () => (
  <div className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/80 px-6 py-4 text-sm text-zinc-500">
    Allocation Finder (soon)
  </div>
);

const AuxiteYield = () => (
  <div className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/80 px-6 py-4 text-sm text-zinc-500">
    Auxite Yield (soon)
  </div>
);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-zinc-50">
      <section className="max-w-6xl mx-auto pt-10 px-6">
        <h1 className="text-3xl font-semibold mb-2">Auxite Wallet</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Non-custodial, on-chain, real-time powered by Auxite watcher.
        </p>

        <div className="space-y-6">
          <LivePrices />
          <AllocationFinder />
          <AuxiteYield />
        </div>
      </section>
    </main>
  );
}
