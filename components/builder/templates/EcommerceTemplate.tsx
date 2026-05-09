import { ShoppingBag, Star } from 'lucide-react';

const products = ['Aero Keyboard', 'Glass Dock', 'Neon Headset'];

export function EcommerceTemplate({ title }: { title: string }) {
  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Commerce Studio</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/55">A high-converting storefront with merchandising cards, inventory-aware actions, and premium product storytelling.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product, index) => (
            <article key={product} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-400/40">
              <div className="mb-4 flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/10">
                <ShoppingBag className="h-10 w-10 text-cyan-200" />
              </div>
              <div className="flex items-center gap-1 text-xs text-cyan-200"><Star className="h-3 w-3 fill-current" /> 4.{index + 7}</div>
              <h2 className="mt-3 text-xl font-black">{product}</h2>
              <p className="mt-2 text-sm text-white/45">$ {(129 + index * 70).toFixed(2)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
