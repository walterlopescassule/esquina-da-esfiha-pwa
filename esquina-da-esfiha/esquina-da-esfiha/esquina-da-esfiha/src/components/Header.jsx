import { ShoppingBag } from "lucide-react";

function Logo() {
  // Placa de rua: a "esquina" do nome.
  return (
    <div className="rounded-lg border-2 border-white bg-bordo-900 px-3 py-1.5 leading-none shadow-[inset_0_0_0_2px_#6B0F1A]">
      <span className="block text-[11px] font-semibold text-sol">Esquina da</span>
      <span className="block font-display text-2xl font-extrabold tracking-tight text-white">Esfiha</span>
    </div>
  );
}

export default function Header({ count, onOpenCart, children }) {
  return (
    <header className="sticky top-0 z-30 bg-bordo pt-safe text-white shadow-lg shadow-bordo-900/30">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Logo />
        <button
          type="button"
          onClick={onOpenCart}
          aria-label={`Abrir carrinho, ${count} ${count === 1 ? "item" : "itens"}`}
          className="relative grid h-12 w-12 place-items-center rounded-full bg-sol text-bordo-900 transition active:scale-95"
        >
          <ShoppingBag size={24} strokeWidth={2.4} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-white px-1 text-xs font-extrabold text-bordo">
              {count}
            </span>
          )}
        </button>
      </div>
      {children}
    </header>
  );
}
