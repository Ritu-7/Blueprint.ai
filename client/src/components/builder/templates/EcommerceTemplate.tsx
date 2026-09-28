'use client';

import { useState, useMemo } from 'react';
import { ShoppingBag, Star, Plus, Check, ShoppingCart, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

export function EcommerceTemplate({ title }: { title: string }) {
  const [products] = useState<Product[]>([
    { id: 'p1', name: 'Aero Mechanical Keyboard', category: 'Hardware', price: 149.99, rating: 4.9, image: '⌨️', description: 'Wireless mechanical keyboard with custom cyan switches.' },
    { id: 'p2', name: 'Glass Studio Dock', category: 'Accessories', price: 199.50, rating: 4.8, image: '🖥️', description: 'Thunderbolt 4 workstation hub with dual 4K display output.' },
    { id: 'p3', name: 'Neon Wireless Headset', category: 'Audio', price: 129.00, rating: 4.7, image: '🎧', description: 'Active noise cancelling studio headset with zero latency.' },
    { id: 'p4', name: 'Cyber Desk Mat XL', category: 'Accessories', price: 39.99, rating: 4.9, image: '⌨️', description: 'Micro-weave cloth surface with RGB perimeter lighting.' },
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`Added ${product.name} to cart`);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalCartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white font-sans relative">
      <section className="mx-auto max-w-6xl space-y-6">
        {/* Storefront Header */}
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.28em] text-cyan-300 mb-3">
                Commerce Grid Engine
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl text-white">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/55">
                High-converting storefront with interactive merchandising, cart state management, and instant checkout.
              </p>
            </div>

            <button
              onClick={() => setIsCartOpen((v) => !v)}
              className="relative inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-[#05070a] hover:bg-cyan-300 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,243,255,0.3)]"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Cart ({totalCartCount})</span>
              {totalCartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-lg">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search store catalog…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['All', 'Hardware', 'Accessories', 'Audio'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-400 text-[#05070a]'
                    : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition-all hover:border-cyan-400/40 hover:-translate-y-1"
            >
              <div>
                <div className="mb-4 flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/10 text-4xl shadow-inner">
                  {product.image}
                </div>
                <div className="flex items-center justify-between text-xs text-cyan-200">
                  <span className="flex items-center gap-1 font-bold">
                    <Star className="h-3.5 w-3.5 fill-cyan-400 text-cyan-400" />
                    {product.rating}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-white/40">{product.category}</span>
                </div>
                <h2 className="mt-3 text-lg font-black text-white">{product.name}</h2>
                <p className="mt-1 text-xs text-white/50 line-clamp-2 leading-relaxed">{product.description}</p>
              </div>

              <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-xl font-black text-white">${product.price.toFixed(2)}</span>
                <button
                  onClick={() => addToCart(product)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/30 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-400 hover:text-black transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border-l border-white/10 p-6 flex flex-col justify-between h-full shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-lg font-black text-white">Your Shopping Cart</h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-center text-xs text-white/30 py-12">Your cart is empty. Add products to get started.</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-cyan-300 font-mono mt-0.5">${item.price.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="font-black text-white">${cartSubtotal.toFixed(2)}</span>
              </div>
              <button
                onClick={() => {
                  if (cart.length === 0) return;
                  toast.success('Checkout initialized! Mock payment processed.');
                  setCart([]);
                  setIsCartOpen(false);
                }}
                disabled={cart.length === 0}
                className="w-full rounded-xl bg-cyan-400 py-3 text-xs font-black uppercase tracking-wider text-[#05070a] hover:bg-cyan-300 disabled:opacity-30 transition-all"
              >
                Complete Order (${cartSubtotal.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

