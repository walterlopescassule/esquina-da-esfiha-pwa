import { ShoppingBag } from "lucide-react";
import { formatBRL } from "../lib/format.js";

export default function FloatingCartBar({ count, total, onOpen }) {
  if (count === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-safe">
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto mx-auto flex h-14 w-full max-w-2xl items-center justify-between rounded-2xl bg-bordo px-5 text-white shadow-xl shadow-bordo-900/40 transition active:scale-[0.98]"
      >
        <span className="flex items-center gap-2 font-bold">
          <ShoppingBag size={20} strokeWidth={2.6} />
          Ver carrinho ({count})
        </span>
        <span className="font-display text-lg font-extrabold text-sol">{formatBRL(total)}</span>
      </button>
    </div>
  );
}
