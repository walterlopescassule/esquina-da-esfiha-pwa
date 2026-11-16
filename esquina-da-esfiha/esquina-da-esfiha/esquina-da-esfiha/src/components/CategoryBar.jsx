export default function CategoryBar({ categories, active, onChange }) {
  const all = ["Todos", ...categories];
  return (
    <nav aria-label="Categorias" className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
      {all.map((c) => {
        const on = c === active;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-pressed={on}
            className={`h-11 shrink-0 rounded-full px-5 text-[15px] font-bold transition active:scale-95 ${
              on ? "bg-sol text-bordo-900" : "bg-white/10 text-white"
            }`}
          >
            {c}
          </button>
        );
      })}
    </nav>
  );
}
