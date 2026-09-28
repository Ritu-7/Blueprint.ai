'use client';

import { useState, useMemo } from 'react';
import { ShoppingBag, Search, Plus, Trash2, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { toast } from 'sonner';

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
}

export interface CartEntry {
  product: ProductItem;
  quantity: number;
}

export function EcommerceTemplate({ title }: { title: string }) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // New product inputs
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Electronics');
  const [newPrice, setNewPrice] = useState('99.99');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`Added ${product.name} to cart`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartEntry[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    toast.info('Item removed from cart');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const priceNum = parseFloat(newPrice) || 49.99;
    const newProduct: ProductItem = {
      id: `p-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      price: priceNum,
      rating: 5.0,
    };

    setProducts((prev) => [newProduct, ...prev]);
    setNewName('');
    setIsAddingProduct(false);
    toast.success('Added product to catalog');
  };

  const totalCartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const totalCartPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white font-sans">
      <section className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.28em] text-cyan-300 mb-3">
                Storefront OS
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl text-white">{title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
                Dynamic inventory catalog with live cart drawer, product creation, and instant total calculations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddingProduct((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-xs font-bold text-white hover:bg-white/[0.08] transition-all"
              >
                <Plus className="h-4 w-4 text-cyan-300" />
                {isAddingProduct ? 'Cancel' : 'Add Inventory Product'}
              </button>

              <button
                onClick={() => setIsCartOpen((v) => !v)}
                className="relative inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#05070a] hover:bg-cyan-300 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,243,255,0.3)]"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Cart</span>
                {totalCartCount > 0 && (
                  <span className="ml-1 rounded-full bg-[#05070a] px-2 py-0.5 text-[10px] font-black text-cyan-300">
                    {totalCartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Add Product Form */}
          {isAddingProduct && (
            <form onSubmit={handleCreateProduct} className="mt-6 border-t border-white/10 pt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Product name (e.g. Wireless Ergonomic Mouse)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Electronics" className="bg-[#0f131c]">Electronics</option>
                  <option value="Peripherals" className="bg-[#0f131c]">Peripherals</option>
                  <option value="Accessories" className="bg-[#0f131c]">Accessories</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price ($)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                  className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all"
                >
                  Save Product
                </button>
              </div>
            </form>
          )}
        </header>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Electronics', 'Peripherals', 'Accessories'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-cyan-400 text-[#05070a]'
                    : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-xs text-white/30 space-y-3">
              <Tag className="h-8 w-8 mx-auto opacity-30 text-cyan-400" />
              <p>No products in store catalog yet. Click &quot;Add Inventory Product&quot; to populate items.</p>
            </div>
          ) : (
            filteredProducts.map((p) => (
              <article
                key={p.id}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition-all hover:border-cyan-400/40 hover:bg-white/[0.05]"
              >
                <div className="mb-4 aspect-video rounded-xl bg-cyan-400/10 border border-white/5 flex items-center justify-center text-cyan-300 font-mono text-xs">
                  {p.category}
                </div>
                <h3 className="text-base font-bold text-white">{p.name}</h3>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-black text-cyan-300 font-mono">${p.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(p)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-400 hover:text-[#05070a] transition-all"
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Slide-out Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0d14] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-cyan-400" /> Shopping Cart ({totalCartCount})
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="text-xs text-white/40 hover:text-white">
                  Close
                </button>
              </div>

              <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-xs text-white/30 py-8">Your cart is empty.</p>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs"
                    >
                      <div>
                        <h4 className="font-bold text-white">{product.name}</h4>
                        <p className="text-cyan-300 font-mono">${(product.price * quantity).toFixed(2)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="h-6 w-6 rounded bg-white/10 text-white font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono text-white font-bold">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="h-6 w-6 rounded bg-white/10 text-white font-bold"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="ml-2 text-white/30 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Total:</span>
                <span className="text-2xl font-black text-cyan-300 font-mono">${totalCartPrice.toFixed(2)}</span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={() => {
                  toast.success('Checkout simulated successfully!');
                  setCart([]);
                  setIsCartOpen(false);
                }}
                className="w-full rounded-xl bg-cyan-400 py-3 text-xs font-black uppercase tracking-wider text-[#05070a] hover:bg-cyan-300 disabled:opacity-30 transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)]"
              >
                Checkout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
