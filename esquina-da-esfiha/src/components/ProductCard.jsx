import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { formatBRL } from "../lib/format.js";
import QtyControl from "./QtyControl.jsx";

export default function ProductCard({ product, qty, onAdd, onRemove }) {
  const [broken, setBroken] = useState(false);
  const showImage = product.imagem_url && !broken;

  return (
    <article className="flex gap-3 rounded-2xl bg-white p-3 shadow-card">
      <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-sol-100 text-bordo/40">
        {showImage ? (
          <img
            src={product.imagem_url}
            alt={product.nome}
            loading="lazy"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <UtensilsCrossed size={32} aria-hidden="true" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-display text-[17px] font-extrabold leading-tight">{product.nome}</h3>
        {product.descricao && <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink/70">{product.descricao}</p>}
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="font-display text-xl font-extrabold text-bordo">{formatBRL(product.preco)}</span>
          <QtyControl nome={product.nome} qty={qty} onAdd={onAdd} onRemove={onRemove} />
        </div>
      </div>
    </article>
  );
}
