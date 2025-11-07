import { PriceTicker } from '@/components/PriceTicker';
import { PriceTable } from '@/components/PriceTable';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-neutral-100">
      <PriceTicker />

      <section className="mx-auto max-w-5xl px-4 pt-6">
        {/* Senin mevcut hero / content */}
        <h1 className="text-2xl font-semibold mb-2">
          Auxite Wallet
        </h1>
        <p className="text-sm text-neutral-400 mb-6">
          Non-custodial, on-chain, real-time powered by Auxite watcher.
        </p>

        <PriceTable />
      </section>
    </main>
  );
}
