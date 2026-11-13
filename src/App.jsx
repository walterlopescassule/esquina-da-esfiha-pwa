import { useMemo, useState } from "react";
import { useMenu } from "./hooks/useMenu.js";
import { useCart } from "./hooks/useCart.js";
import { orderCategories } from "./lib/menu.js";
import Header from "./components/Header.jsx";
import CategoryBar from "./components/CategoryBar.jsx";
import ProductCard from "./components/ProductCard.jsx";
import FloatingCartBar from "./components/FloatingCartBar.jsx";
import CartDrawer from "./components/CartDrawer.jsx";

function Skeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse gap-3 rounded-2xl bg-white p-3">
          <div className="h-28 w-28 rounded-xl bg-sol-100" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-2/3 rounded bg-sol-100" />
            <div className="h-3 w-full rounded bg-sol-100" />
            <div className="h-3 w-1/2 rounded bg-sol-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { products, status, isDemo } = useMenu();
  const cart = useCart(products);
  const [category, setCategory] = useState("Todos");
  const [cartOpen, setCartOpen] = useState(false);

  const categories = useMemo(() => orderCategories(products), [products]);
  const sections = useMemo(
    () =>
      categories
        .filter((c) => category === "Todos" || c === category)
        .map((c) => ({ name: c, items: products.filter((p) => p.categoria === c) })),
    [categories, category, products],
  );

  return (
    <div className="min-h-dvh pb-32">
      <Header count={cart.count} onOpenCart={() => setCartOpen(true)}>
        <CategoryBar categories={categories} active={category} onChange={setCategory} />
      </Header>

      <main className="mx-auto max-w-2xl px-4 pt-5">
        {isDemo && import.meta.env.DEV && (
          <p className="mb-4 rounded-xl bg-sol-100 px-4 py-3 text-sm">
            Cardápio de demonstração. Defina <code>VITE_MENU_CSV_URL</code> no arquivo <code>.env</code> para usar sua planilha.
          </p>
        )}

        {status === "loading" && <Skeleton />}

        {status === "error" && (
          <div role="alert" className="rounded-2xl bg-white p-6 text-center shadow-card">
            <p className="font-bold">Não conseguimos carregar o cardápio.</p>
            <p className="mt-1 text-sm text-ink/70">Confira sua conexão e tente de novo.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-4 h-12 rounded-full bg-bordo px-6 font-bold text-white">
              Tentar novamente
            </button>
          </div>
        )}

        {status === "ready" &&
          sections.map((s) => (
            <section key={s.name} className="mb-7" aria-labelledby={`cat-${s.name}`}>
              <h2 id={`cat-${s.name}`} className="mb-3 font-display text-2xl font-extrabold text-bordo">
                {s.name}
              </h2>
              <div className="space-y-3">
                {s.items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    qty={cart.qtyById[p.id] ?? 0}
                    onAdd={() => cart.add(p.id)}
                    onRemove={() => cart.remove(p.id)}
                  />
                ))}
              </div>
            </section>
          ))}
      </main>

      {!cartOpen && <FloatingCartBar count={cart.count} total={cart.total} onOpen={() => setCartOpen(true)} />}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={cart.lines}
        total={cart.total}
        onAdd={cart.add}
        onRemove={cart.remove}
      />
    </div>
  );
}
