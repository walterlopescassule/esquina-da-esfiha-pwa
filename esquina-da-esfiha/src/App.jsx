import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import { useMenu } from "./hooks/useMenu.js";
import { useCart } from "./hooks/useCart.js";
import { orderCategories } from "./lib/menu.js";
import Header from "./components/Header.jsx";
import CategoryBar from "./components/CategoryBar.jsx";
import ProductCard from "./components/ProductCard.jsx";
import FloatingCartBar from "./components/FloatingCartBar.jsx";
import CartDrawer from "./components/CartDrawer.jsx";

/* ------------------------------------------------------------------ */
/* Dados da loja — edite aqui.                                         */
/* Para fechar à meia-noite, troque close para "00:00".                */
/* ------------------------------------------------------------------ */
const STORE = {
  address: "Rua Antônio Celestino de Deus, 268 - Jardim Saint Moritz - Taboão da Serra/SP",
  open: "18:00",
  close: "23:45",
  timeZone: "America/Sao_Paulo",
};

const NOTICE =
  "⚠️ ATENÇÃO AO REALIZAR SEU PEDIDO! CONFIRA OS ITENS, SABORES E QUANTIDADES ANTES DE FINALIZAR. NOSSOS PRODUTOS SÃO PREPARADOS NA HORA E CANCELAMENTOS APÓS O PREPARO PODEM GERAR TAXA DE CANCELAMENTO!!! ATT, ESQUINA DA ESFIHA.";

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Minutos desde 00:00 no fuso da loja (não depende do fuso do celular). */
function minutesNow(timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return get("hour") * 60 + get("minute");
}

/** true se a loja está aberta agora. Funciona também com fechamento após a meia-noite. */
function isOpenNow({ open, close, timeZone }) {
  const now = minutesNow(timeZone);
  const start = toMinutes(open);
  const end = toMinutes(close);
  return end > start ? now >= start && now < end : now >= start || now < end;
}

/** Reavalia a cada 30 s para o indicador não ficar desatualizado com o app aberto. */
function useIsOpen() {
  const [isOpen, setIsOpen] = useState(() => isOpenNow(STORE));
  useEffect(() => {
    const tick = () => setIsOpen(isOpenNow(STORE));
    const id = setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, []);
  return isOpen;
}

function StoreInfo() {
  const isOpen = useIsOpen();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.address)}`;

  return (
    <section aria-label="Informações da loja" className="mb-4 rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 font-bold">
          <Clock size={18} className="shrink-0 text-bordo" aria-hidden="true" />
          <span>Hoje: {STORE.open} às {STORE.close}</span>
        </div>
        <span
          role="status"
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-extrabold ${
            isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${isOpen ? "bg-green-600" : "bg-red-600"}`} />
          {isOpen ? "Aberto" : "Fechado"}
        </span>
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-start gap-2 text-sm leading-snug text-ink/80 underline-offset-2 hover:underline"
      >
        <MapPin size={18} className="mt-0.5 shrink-0 text-bordo" aria-hidden="true" />
        <span>{STORE.address}</span>
      </a>
    </section>
  );
}

function NoticeBanner() {
  return (
    <aside
      aria-label="Aviso importante"
      className="mb-5 rounded-2xl border-2 border-bordo bg-sol px-4 py-3 text-[13px] font-extrabold leading-snug text-bordo-900"
    >
      <p>{NOTICE}</p>
    </aside>
  );
}

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
        <StoreInfo />
        <NoticeBanner />

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