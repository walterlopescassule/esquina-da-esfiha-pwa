import { useCallback, useEffect, useMemo, useState } from "react";

const KEY = "esquina:cart:v1";

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; }
};

/** Carrinho = { [idDoProduto]: quantidade }, guardado no aparelho. */
export function useCart(products) {
  const [qtyById, setQtyById] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(qtyById)); } catch { /* ignora */ }
  }, [qtyById]);

  const add = useCallback((id) => setQtyById((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 })), []);
  const remove = useCallback(
    (id) =>
      setQtyById((c) => {
        const { [id]: current = 0, ...rest } = c;
        return current > 1 ? { ...rest, [id]: current - 1 } : rest;
      }),
    [],
  );
  const clear = useCallback(() => setQtyById({}), []);

  // Só conta itens que ainda existem no cardápio (a planilha pode mudar).
  const lines = useMemo(
    () =>
      products
        .filter((p) => qtyById[p.id] > 0)
        .map((p) => ({ ...p, qty: qtyById[p.id], subtotal: qtyById[p.id] * p.preco })),
    [products, qtyById],
  );
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.subtotal, 0);

  return { qtyById, lines, count, total, add, remove, clear };
}
