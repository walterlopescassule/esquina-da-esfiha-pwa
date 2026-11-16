import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bike,
  Coffee,
  Clock,
  Flame,
  Home,
  Info,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";

/* ==========================================================================
   1. CONFIGURAÇÕES DA LOJA
   ========================================================================== */

const STORE = {
  name: "Samuka Lanches & Cia",
  address:
    "Rua Maria Teresa de Calcutá, 215 - Jardim Saint Moritz - Taboão da Serra/SP",
  whatsapp: import.meta.env.VITE_WHATSAPP || "5511965380941",
  timezone: "America/Sao_Paulo",
  openMinutes: 6 * 60, // abre às 06:00
  closeMinutes: 23 * 60 + 45, // fecha às 23:45
  hoursLabel: "Todos os dias, 06h às 23h45",
  logo: "/logo.png",
};

const NOTICE = {
  title: "⚠️ ATENÇÃO AO REALIZAR SEU PEDIDO!",
  text: "CONFIRA OS ITENS, SABORES E QUANTIDADES ANTES DE FINALIZAR. NOSSOS PRODUTOS SÃO PREPARADOS NA HORA E CANCELAMENTOS APÓS O PREPARO PODEM GERAR TAXA DE CANCELAMENTO!!!",
  signature: "ATT, SAMUKA LANCHES & CIA.",
};

const HERO_ITEM = {
  id: "hero-frango-assado-completo",
  name: "Frango Assado Completo",
  desc: "com batata, farofa e molho verde",
  price: 49.9,
  category: "Destaques",
};

const MENU_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQerNL0p6FsD6-uGC9WVi4R4guseiJDUHo48yhcEAf2c3xg9ohI1Eo8gMnwsH55hQ/pub?output=csv";
const CART_KEY = "samuka_cart_v1";
const BREAKFAST_NOTE = "Servido das 06h às 11h";

/* ==========================================================================
   2. UTILITÁRIOS
   ========================================================================== */

const brl = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const plain = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isBreakfast = (cat) => /cafe|manha/.test(plain(cat));

function isOpenNow() {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: STORE.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parseInt(parts.find((p) => p.type === t)?.value || "0", 10);
    const minutes = (get("hour") % 24) * 60 + get("minute");
    return minutes >= STORE.openMinutes && minutes < STORE.closeMinutes;
  } catch {
    return true;
  }
}

function parsePrice(v) {
  let s = String(v || "").replace(/[^\d,.-]/g, "");
  if (!s) return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function cleanSection(title) {
  const parts = title.split(/\s[-–—]\s/);
  return (parts.length > 1 ? parts.slice(1).join(" - ") : title).trim();
}

function parseMenu(text) {
  const rows = parseCSV(text);
  let cols = null;
  let section = "";
  const items = [];

  rows.forEach((raw, idx) => {
    const cells = raw.map((c) => c.trim());
    if (cells.every((c) => !c)) return;
    const norm = cells.map(plain);

    const nameIdx = norm.findIndex((c) => ["item", "nome", "produto"].includes(c));
    const priceIdx = norm.findIndex((c) => ["preco", "valor"].includes(c));
    if (nameIdx >= 0 && priceIdx >= 0) {
      cols = {
        name: nameIdx,
        price: priceIdx,
        desc: norm.findIndex((c) => c.startsWith("descricao") || c === "detalhes"),
        cat: norm.indexOf("categoria"),
        img: norm.findIndex((c) => c.startsWith("imagem") || c === "foto"),
        id: norm.indexOf("id"),
      };
      return;
    }

    if (cells.filter(Boolean).length === 1 && cells[0]) {
      section = cleanSection(cells[0]);
      return;
    }
    if (!cols) return;

    const name = cells[cols.name];
    const price = parsePrice(cells[cols.price]);
    if (!name || price <= 0) return;

    const img = cols.img >= 0 ? cells[cols.img] : "";
    items.push({
      id: (cols.id >= 0 && cells[cols.id]) || `item-${idx}`,
      name,
      desc: cols.desc >= 0 ? cells[cols.desc] : "",
      price,
      category: (cols.cat >= 0 && cells[cols.cat]) || section || "Cardápio",
      img: /^https?:\/\//i.test(img) ? img : "",
    });
  });

  return items;
}

/* ==========================================================================
   3. HOOKS
   ========================================================================== */

function useOpenStatus() {
  const [open, setOpen] = useState(isOpenNow);
  useEffect(() => {
    const t = setInterval(() => setOpen(isOpenNow()), 30000);
    return () => clearInterval(t);
  }, []);
  return open;
}

function useMenu() {
  const [state, setState] = useState({ status: "loading", items: [] });

  const load = useCallback(async () => {
    if (!MENU_CSV_URL) {
      setState({ status: "error", items: [], message: "MENU_CSV_URL não configurada." });
      return;
    }
    setState((s) => ({ ...s, status: "loading" }));
    try {
      const res = await fetch(MENU_CSV_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = parseMenu(await res.text());
      setState({ status: "ready", items });
    } catch (e) {
      setState({ status: "error", items: [], message: "Não foi possível carregar o cardápio." });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

function useCart() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* armazenamento indisponível */
    }
  }, [cart]);

  const add = (item) =>
    setCart((c) => ({
      ...c,
      [item.id]: { item, qty: (c[item.id]?.qty || 0) + 1 },
    }));

  const dec = (id) =>
    setCart((c) => {
      const cur = c[id];
      if (!cur) return c;
      if (cur.qty <= 1) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: { ...cur, qty: cur.qty - 1 } };
    });

  const remove = (id) =>
    setCart((c) => {
      const { [id]: _, ...rest } = c;
      return rest;
    });

  const clear = () => setCart({});

  const lines = Object.values(cart);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.qty * l.item.price, 0);

  return { lines, count, total, add, dec, remove, clear };
}

/* ==========================================================================
   4. COMPONENTES
   ========================================================================== */

function Logo({ className = "" }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div className={`grid place-items-center rounded-2xl bg-[#F8F0E0] text-[#0B2545] ${className}`}>
        <UtensilsCrossed size={26} />
      </div>
    );
  return (
    <img
      src={STORE.logo}
      alt={`Logomarca ${STORE.name}`}
      onError={() => setFailed(true)}
      width={512}
      height={512}
      className={`rounded-2xl bg-[#F8F0E0] object-cover ${className}`}
    />
  );
}

function Header({ open }) {
  return (
    <header className="bg-[#0B2545] text-white">
      <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 pb-4 pt-5">
        <Logo className="h-24 w-24 shrink-0 shadow-lg ring-2 ring-[#F5B400]" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight">
            {STORE.name}
          </h1>
          <p className="mt-0.5 flex items-start gap-1 text-xs text-white/70">
            <MapPin size={13} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">{STORE.address}</span>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 bg-[#081A33]">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
              open ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"
            }`}
            role="status"
          >
            <span className={`h-2 w-2 rounded-full ${open ? "bg-emerald-400" : "bg-red-400"}`} />
            {open ? "Aberto agora" : "Fechado agora"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-white/70">
            <Clock size={13} /> {STORE.hoursLabel}
          </span>
        </div>
      </div>
    </header>
  );
}

function HeroBanner({ onAdd }) {
  return (
    <section className="px-4 pt-4">
      <div className="relative overflow-hidden rounded-3xl bg-[#0B2545] p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#F5B400]/20" />
        <div className="pointer-events-none absolute -bottom-12 right-10 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative flex items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F5B400] px-2.5 py-1 text-xs font-bold text-[#0B2545]">
              <Flame size={13} /> Destaque da casa
            </span>
            <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight">
              {HERO_ITEM.name}
            </h2>
            <p className="mt-1 text-sm text-white/75">{HERO_ITEM.desc}</p>
            <p className="font-display mt-3 text-3xl font-extrabold text-[#F5B400]">
              {brl(HERO_ITEM.price)}
            </p>
          </div>
          <button
            onClick={() => onAdd(HERO_ITEM)}
            className="shrink-0 rounded-full bg-[#F5B400] px-4 py-3 text-sm font-bold text-[#0B2545] shadow transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label={`Adicionar ${HERO_ITEM.name} à sacola`}
          >
            <span className="flex items-center gap-1.5">
              <Plus size={16} strokeWidth={3} /> Pedir
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

function Notice() {
  return (
    <section className="px-4 pt-4">
      <div className="flex gap-3 rounded-2xl border border-[#0B2545]/15 bg-white p-4">
        <Info size={20} className="mt-0.5 shrink-0 text-[#0B2545]" />
        <div className="text-sm text-[#0B2545]">
          <p className="font-bold">{NOTICE.title}</p>
          <p className="mt-1 text-[#0B2545]/75">{NOTICE.text}</p>
          <p className="mt-2 text-xs font-bold">{NOTICE.signature}</p>
        </div>
      </div>
    </section>
  );
}

function CategoryTabs({ categories, active, onChange }) {
  return (
    <nav
      aria-label="Categorias do cardápio"
      className="sticky top-0 z-20 border-b border-[#0B2545]/10 bg-[#FBF5E6]/95 backdrop-blur"
    >
      <div className="mx-auto max-w-2xl overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2">
          {["Todos", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => onChange(c)}
              aria-pressed={active === c}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                active === c
                  ? "bg-[#0B2545] text-white"
                  : "bg-white text-[#0B2545] ring-1 ring-[#0B2545]/15"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Thumb({ src, name }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return (
      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-[#F4E9D2] text-[#0B2545]/60">
        <UtensilsCrossed size={26} />
      </div>
    );
  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-20 w-20 shrink-0 rounded-2xl object-cover"
    />
  );
}

function ProductCard({ item, qty, onAdd }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#0B2545]/5">
      <Thumb src={item.img} name={item.name} />
      <div className="min-w-0 flex-1">
        <h3 className="font-bold leading-snug text-[#0B2545]">{item.name}</h3>
        {item.desc && (
          <p className="mt-0.5 line-clamp-2 text-xs text-[#0B2545]/65">{item.desc}</p>
        )}
        <p className="font-display mt-1.5 text-base font-extrabold text-[#0B2545]">
          {brl(item.price)}
        </p>
      </div>
      <button
        onClick={() => onAdd(item)}
        aria-label={`Adicionar ${item.name}`}
        className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0B2545] text-white shadow transition active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B400]"
      >
        <Plus size={22} strokeWidth={2.5} />
        {qty > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#F5B400] px-1 text-[11px] font-extrabold text-[#0B2545]">
            {qty}
          </span>
        )}
      </button>
    </li>
  );
}

function MenuSection({ title, items, cart, onAdd }) {
  return (
    <section className="px-4 pt-5">
      <h2 className="font-display flex items-center gap-2 text-lg font-extrabold text-[#0B2545]">
        {isBreakfast(title) && <Coffee size={18} />}
        {title}
      </h2>
      {isBreakfast(title) && (
        <p className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-[#F5B400]/20 px-2.5 py-1 text-xs font-semibold text-[#0B2545]">
          <Clock size={12} /> {BREAKFAST_NOTE}
        </p>
      )}
      <ul className="mt-3 space-y-3">
        {items.map((it) => (
          <ProductCard key={it.id} item={it} qty={cart[it.id]?.qty || 0} onAdd={onAdd} />
        ))}
      </ul>
    </section>
  );
}

function MenuSkeleton() {
  return (
    <div className="space-y-3 px-4 pt-5" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl bg-white p-3">
          <div className="h-20 w-20 rounded-2xl bg-[#F4E9D2]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-[#F4E9D2]" />
            <div className="h-3 w-full rounded bg-[#F4E9D2]" />
            <div className="h-4 w-1/4 rounded bg-[#F4E9D2]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MenuError({ message, onRetry }) {
  return (
    <div className="mx-4 mt-5 rounded-2xl bg-white p-5 text-center ring-1 ring-red-200">
      <AlertTriangle className="mx-auto text-red-500" />
      <p className="mt-2 font-semibold text-[#0B2545]">{message}</p>
      <p className="mt-1 text-sm text-[#0B2545]/65">Verifique sua conexão e tente de novo.</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0B2545] px-4 py-2 text-sm font-bold text-white"
      >
        <RefreshCw size={15} /> Tentar novamente
      </button>
    </div>
  );
}

function SearchView({ items, cart, onAdd }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const t = plain(q);
    if (!t) return [];
    return items.filter((i) => plain(`${i.name} ${i.desc}`).includes(t));
  }, [q, items]);

  return (
    <div className="px-4 pt-5">
      <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-[#0B2545]/15 focus-within:ring-2 focus-within:ring-[#0B2545]">
        <Search size={18} className="text-[#0B2545]/60" />
        <input
          autoFocus
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar lanche, porção ou bebida"
          className="w-full bg-transparent text-[#0B2545] outline-none placeholder:text-[#0B2545]/40"
        />
      </label>
      {!q.trim() ? (
        <p className="mt-6 text-center text-sm text-[#0B2545]/60">
          Digite o nome do que você quer pedir.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-6 text-center text-sm text-[#0B2545]/60">
          Nenhum item encontrado para “{q.trim()}”.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {results.map((it) => (
            <ProductCard key={it.id} item={it} qty={cart[it.id]?.qty || 0} onAdd={onAdd} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FloatingCartBar({ count, total, onOpen }) {
  if (!count) return null;
  return (
    <div className="fixed inset-x-0 bottom-[68px] z-30 px-4 pb-2">
      <button
        onClick={onOpen}
        className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-2xl bg-[#F5B400] px-5 py-3.5 text-[#0B2545] shadow-xl transition active:scale-[0.98]"
      >
        <span className="flex items-center gap-2 font-bold">
          <ShoppingBag size={20} />
          {count} {count === 1 ? "item" : "itens"}
        </span>
        <span className="flex items-center gap-3">
          <span className="font-display text-lg font-extrabold">{brl(total)}</span>
          <span className="rounded-full bg-[#0B2545] px-3 py-1 text-xs font-bold text-white">
            Ver sacola
          </span>
        </span>
      </button>
    </div>
  );
}

function BottomNav({ tab, onChange, count }) {
  const btn = (id, label, Icon) => {
    const active = tab === id;
    return (
      <button
        key={id}
        onClick={() => onChange(id)}
        aria-current={active ? "page" : undefined}
        className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition ${
          active ? "text-[#0B2545]" : "text-[#0B2545]/45"
        }`}
      >
        <span className={`relative rounded-full px-5 py-1 ${active ? "bg-[#F5B400]/30" : ""}`}>
          <Icon size={22} strokeWidth={active ? 2.5 : 2} />
          {id === "cart" && count > 0 && (
            <span className="absolute -right-0.5 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#0B2545] px-1 text-[11px] font-extrabold text-white">
              {count}
            </span>
          )}
        </span>
        {label}
      </button>
    );
  };
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#0B2545]/10 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-2xl">
        {btn("home", "Início", Home)}
        {btn("search", "Buscar", Search)}
        {btn("cart", "Sacola", ShoppingBag)}
      </div>
    </nav>
  );
}

/* ---------- Carrinho + Checkout ---------- */

function buildWhatsAppMessage({ lines, total, mode, name, address, payment, change, notes }) {
  const clean = (s) => s.replace(/\u00a0/g, " ");
  const items = lines
    .map((l) => `• ${l.qty}x ${l.item.name} (${clean(brl(l.item.price * l.qty))})`)
    .join("\n");
  const payLabel =
    payment === "Cartão"
      ? mode === "entrega"
        ? "Cartão na Entrega"
        : "Cartão no Balcão"
      : payment;

  const out = [
    `Olá, ${STORE.name}! Quero fazer um pedido:`,
    "",
    "*Itens*",
    items,
    "",
    `*Total:* ${clean(brl(total))}`,
    "",
    `*Modalidade:* ${mode === "entrega" ? "Entrega" : "Retirar no balcão"}`,
    `*Nome:* ${name.trim()}`,
  ];
  if (mode === "entrega") out.push(`*Endereço:* ${address.trim()}`);
  out.push(`*Pagamento:* ${payLabel}`);
  if (payment === "Dinheiro" && change.trim()) out.push(`*Troco para:* ${change.trim()}`);
  if (notes.trim()) out.push(`*Observações:* ${notes.trim()}`);
  return out.join("\n");
}

function OptionButton({ selected, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition ${
        selected
          ? "border-[#0B2545] bg-[#0B2545] text-white"
          : "border-[#0B2545]/15 bg-white text-[#0B2545]"
      }`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-[#0B2545]">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-[#0B2545]/20 bg-white px-3.5 py-3 text-[#0B2545] outline-none placeholder:text-[#0B2545]/35 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/20";

function CartDrawer({ cart, open, onClose, storeOpen }) {
  const [mode, setMode] = useState("entrega");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("");
  const [change, setChange] = useState("");
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const errors = {
    name: name.trim() ? "" : "Informe seu nome.",
    address: mode === "entrega" && !address.trim() ? "Informe o endereço de entrega." : "",
    payment: payment ? "" : "Escolha a forma de pagamento.",
  };
  const valid = !errors.name && !errors.address && !errors.payment;

  const finish = async () => {
    setTried(true);
    if (!name.trim() || !address.trim() || !payment) {
      return;
    }

    // Se for pagamento online (Pix Online ou Cartão Online)
    if (payment.includes("Online")) {
      try {
        // Mostra um feedback visual de carregamento se desejar
        const response = await fetch('/api/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.items.map(item => ({
              title: item.name,
              unit_price: item.price,
              quantity: item.quantity
            }))
          })
        });

        const data = await response.json();

        if (data.init_point) {
          // Redireciona o cliente para o Checkout Pro oficial do Mercado Pago
          window.location.href = data.init_point;
          return;
        } else {
          alert("Erro ao gerar link de pagamento. Tente novamente.");
        }
      } catch (error) {
        console.error("Erro no pagamento:", error.message);
        alert("Erro de conexão com o sistema de pagamento.");
      }
      return;
    }

    // Fluxo normal para pagamento na entrega / balcão (WhatsApp)
    const text = encodeURIComponent(
      `*Novo Pedido - Samuka Lanches & Cia*\n\n` +
      `*Cliente:* ${name}\n` +
      `*Modo:* ${mode === "entrega" ? "Entrega" : "Retirada no Balcão"}\n` +
      `*Endereço:* ${address}\n` +
      `*Pagamento:* ${payment}${payment === "Dinheiro" && change ? ` (Troco para: ${change})` : ""}\n\n` +
      `*Itens:*\n` +
      cart.items.map(i => `- ${i.quantity}x ${i.name} (${brl(i.price * i.quantity)})`).join("\n") +
      `\n\n*Total:* ${brl(cart.total)}` +
      (notes ? `\n*Observações:* ${notes}` : "")
    );

    window.open(`https://wa.me/5511999999999?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Sacola">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fechar sacola" />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-3xl bg-[#FBF5E6] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#0B2545]/10 px-5 py-4">
          <h2 className="font-display text-xl font-extrabold text-[#0B2545]">Sua sacola</h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#0B2545] ring-1 ring-[#0B2545]/15"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {cart.lines.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <ShoppingBag size={36} className="mx-auto text-[#0B2545]/40" />
            <p className="mt-3 font-bold text-[#0B2545]">Sua sacola está vazia</p>
            <p className="mt-1 text-sm text-[#0B2545]/60">Toque no + de um produto para começar.</p>
            <button
              onClick={onClose}
              className="mt-5 rounded-full bg-[#0B2545] px-5 py-2.5 text-sm font-bold text-white"
            >
              Ver cardápio
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
              <ul className="space-y-2.5">
                {cart.lines.map(({ item, qty }) => (
                  <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-[#0B2545]/5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-[#0B2545]">{item.name}</p>
                      <p className="text-sm text-[#0B2545]/65">{brl(item.price * qty)}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-[#FBF5E6] p-1">
                      <button
                        onClick={() => cart.dec(item.id)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#0B2545] ring-1 ring-[#0B2545]/15"
                        aria-label={`Diminuir ${item.name}`}
                      >
                        {qty === 1 ? <Trash2 size={15} /> : <Minus size={15} />}
                      </button>
                      <span className="w-6 text-center text-sm font-extrabold text-[#0B2545]">{qty}</span>
                      <button
                        onClick={() => cart.add(item)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#0B2545] text-white"
                        aria-label={`Aumentar ${item.name}`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {!storeOpen && (
                <p className="flex gap-2 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">
                  <Clock size={16} className="mt-0.5 shrink-0" />
                  Estamos fechados agora. Você pode enviar o pedido e ele será atendido quando abrirmos ({STORE.hoursLabel.replace("Todos os dias, ", "")}).
                </p>
              )}

              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-[#0B2545]">Como você quer receber?</legend>
                <div className="flex gap-2">
                  <OptionButton selected={mode === "entrega"} onClick={() => setMode("entrega")} icon={Bike}>
                    Entrega
                  </OptionButton>
                  <OptionButton selected={mode === "retirada"} onClick={() => setMode("retirada")} icon={Store}>
                    Retirar no balcão
                  </OptionButton>
                </div>
              </fieldset>

              <div className="space-y-3">
                <Field label="Seu nome" error={tried && errors.name}>
                  <input
                    className={inputCls}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como podemos te chamar?"
                    autoComplete="name"
                  />
                </Field>
                {mode === "entrega" && (
                  <Field label="Endereço de entrega" error={tried && errors.address}>
                    <input
                      className={inputCls}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, número e bairro"
                      autoComplete="street-address"
                    />
                  </Field>
                )}
                <Field label="Observações (opcional)">
                  <input
                    className={inputCls}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex.: sem cebola, molho à parte"
                  />
                </Field>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-[#0B2545]">Forma de pagamento</legend>
                <div className="grid grid-cols-2 gap-2">
                  <OptionButton selected={payment === "Pix Online"} onClick={() => setPayment("Pix Online")}>
                    Pix Online
                  </OptionButton>
                  <OptionButton selected={payment === "Cartão Online"} onClick={() => setPayment("Cartão Online")}>
                    Cartão Online
                  </OptionButton>
                  <OptionButton selected={payment === "Dinheiro"} onClick={() => setPayment("Dinheiro")}>
                    Dinheiro
                  </OptionButton>
                  <OptionButton selected={payment === "Cartão na Entrega"} onClick={() => setPayment("Cartão na Entrega")}>
                    {mode === "entrega" ? "Cartão na Entrega" : "Cartão no Balcão"}
                  </OptionButton>
                </div>
                {tried && errors.payment && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.payment}</p>
                )}
                {payment === "Dinheiro" && (
                  <div className="mt-3">
                    <Field label="Precisa de troco para quanto? (opcional)">
                      <input
                        className={inputCls}
                        value={change}
                        onChange={(e) => setChange(e.target.value)}
                        placeholder="Ex.: R$ 100,00"
                        inputMode="decimal"
                      />
                    </Field>
                  </div>
                )}
              </fieldset>
            </div>

          <div className="border-t border-[#0B2545]/10 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#0B2545]/70">Total</span>
                <span className="font-display text-2xl font-extrabold text-[#0B2545]">{brl(cart.total)}</span>
              </div>
              
              {/* <--- SUBSTITUA O BOTÃO ANTIGO AQUI POR ESTE NOVO: ---> */}
              <button
                onClick={finish}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-extrabold text-white shadow-lg transition active:scale-[0.98] ${
                  payment.includes("Online") 
                    ? "bg-[#1E40AF] hover:bg-[#1D4ED8]" 
                    : "bg-[#16A34A] hover:bg-[#15803D]"
                }`}
              >
                {payment.includes("Online") ? (
                  <>Pagar com Mercado Pago</>
                ) : (
                  <><MessageCircle size={22} /> Finalizar Pedido no WhatsApp</>
                )}
              </button>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   5. APP
   ========================================================================== */

export default function App() {
  const open = useOpenStatus();
  const menu = useMenu();
  const cart = useCart();
  const [tab, setTab] = useState("home");
  const [lastTab, setLastTab] = useState("home");
  const [category, setCategory] = useState("Todos");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  const categories = useMemo(() => [...new Set(menu.items.map((i) => i.category))], [menu.items]);

  const grouped = useMemo(() => {
    const list = category === "Todos" ? categories : [category];
    return list.map((c) => ({ title: c, items: menu.items.filter((i) => i.category === c) }));
  }, [menu.items, categories, category]);

  const cartMap = useMemo(
    () => Object.fromEntries(cart.lines.map((l) => [l.item.id, l])),
    [cart.lines]
  );

  const openCart = () => {
    if (tab !== "cart") setLastTab(tab);
    setTab("cart");
  };
  const closeCart = () => setTab(lastTab);
  const changeTab = (t) => (t === "cart" ? openCart() : setTab(t));

  return (
    <div
      className="min-h-screen bg-[#FBF5E6] pb-36 text-[#0B2545]"
      style={{ fontFamily: "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif" }}
    >
      <style>{`.font-display{font-family:'Bricolage Grotesque','DM Sans',system-ui,sans-serif}`}</style>

      <Header open={open} />

      <main className="mx-auto max-w-2xl">
        {tab === "search" ? (
          <SearchView items={menu.items} cart={cartMap} onAdd={cart.add} />
        ) : (
          <>
            <HeroBanner onAdd={cart.add} />
            <Notice />

            <div className="mt-5">
              {menu.status === "ready" && categories.length > 0 && (
                <CategoryTabs categories={categories} active={category} onChange={setCategory} />
              )}
            </div>

            {menu.status === "loading" && <MenuSkeleton />}
            {menu.status === "error" && <MenuError message={menu.message} onRetry={menu.reload} />}
            {menu.status === "ready" && menu.items.length === 0 && (
              <p className="px-4 pt-8 text-center text-sm text-[#0B2545]/60">
                Nenhum item disponível no cardápio por enquanto.
              </p>
            )}
            {menu.status === "ready" &&
              grouped.map((g) => (
                <MenuSection key={g.title} title={g.title} items={g.items} cart={cartMap} onAdd={cart.add} />
              ))}
          </>
        )}
      </main>

      <FloatingCartBar count={cart.count} total={cart.total} onOpen={openCart} />
      <BottomNav tab={tab} onChange={changeTab} count={cart.count} />
      <CartDrawer cart={cart} open={tab === "cart"} onClose={closeCart} storeOpen={open} />
    </div>
  );
}