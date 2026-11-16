import { Minus, Plus } from "lucide-react";

const round = "grid h-11 w-11 place-items-center rounded-full transition active:scale-90";

export default function QtyControl({ nome, qty, onAdd, onRemove }) {
  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Adicionar ${nome}`}
        className={`${round} h-12 w-12 bg-bordo text-white shadow-md shadow-bordo/30`}
      >
        <Plus size={24} strokeWidth={3} />
      </button>
    );
  }
  return (
    <div className="flex items-center rounded-full bg-sol-100 p-0.5">
      <button type="button" onClick={onRemove} aria-label={`Remover um ${nome}`} className={`${round} bg-white text-bordo`}>
        <Minus size={20} strokeWidth={3} />
      </button>
      <span className="min-w-8 text-center text-base font-extrabold tabular-nums" aria-live="polite">{qty}</span>
      <button type="button" onClick={onAdd} aria-label={`Adicionar mais um ${nome}`} className={`${round} bg-bordo text-white`}>
        <Plus size={20} strokeWidth={3} />
      </button>
    </div>
  );
}
