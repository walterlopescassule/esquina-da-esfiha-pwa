import { useEffect, useRef, useState } from "react";
import { MapPin, Minus, Plus, X } from "lucide-react";
import { formatBRL } from "../lib/format.js";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "../lib/whatsapp.js";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

export default function CartDrawer({ open, onClose, lines, total, onAdd, onRemove }) {
  const [address, setAddress] = useState(() => localStorage.getItem("esquina:address") ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const addressRef = useRef(null);

  // Fecha com Esc e trava a rolagem da página atrás.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const finish = () => {
    if (!address.trim()) {
      setError("Informe rua, número e bairro para a entrega.");
      addressRef.current?.focus();
      return;
    }
    if (!WHATSAPP_NUMBER) {
      setError("Número de WhatsApp não configurado (VITE_WHATSAPP_NUMBER).");
      return;
    }
    try { localStorage.setItem("esquina:address", address); } catch { /* ignora */ }
    const message = buildWhatsAppMessage({ lines, total, address, notes });
    window.open(buildWhatsAppUrl(WHATSAPP_NUMBER, message), "_blank", "noopener");
  };

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-bordo-900/60 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Seu pedido"
        inert={open ? undefined : ""}
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-2xl flex-col rounded-t-3xl bg-papel shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="font-display text-2xl font-extrabold text-bordo">Seu pedido</h2>
          <button type="button" onClick={onClose} aria-label="Fechar carrinho" className="grid h-11 w-11 place-items-center rounded-full bg-sol-100 text-bordo">
            <X size={22} strokeWidth={2.8} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {lines.length === 0 ? (
            <p className="py-10 text-center text-ink/70">Seu carrinho está vazio. Toque no + para adicionar esfihas.</p>
          ) : (
            <>
              <ul className="divide-y divide-bordo/10">
                {lines.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{l.nome}</p>
                      <p className="text-sm text-ink/70">{formatBRL(l.preco)} cada</p>
                    </div>
                    <div className="flex items-center rounded-full bg-sol-100 p-0.5">
                      <button type="button" onClick={() => onRemove(l.id)} aria-label={`Remover um ${l.nome}`} className="grid h-11 w-11 place-items-center rounded-full bg-white text-bordo active:scale-90">
                        <Minus size={18} strokeWidth={3} />
                      </button>
                      <span className="min-w-8 text-center font-extrabold tabular-nums">{l.qty}</span>
                      <button type="button" onClick={() => onAdd(l.id)} aria-label={`Adicionar mais um ${l.nome}`} className="grid h-11 w-11 place-items-center rounded-full bg-bordo text-white active:scale-90">
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                    <span className="w-20 text-right font-extrabold tabular-nums">{formatBRL(l.subtotal)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-3 pb-4">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-sm font-bold">
                    <MapPin size={16} /> Endereço de entrega
                  </span>
                  <input
                    ref={addressRef}
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setError(""); }}
                    placeholder="Rua, Número, Bairro"
                    autoComplete="street-address"
                    aria-invalid={Boolean(error)}
                    className="h-14 w-full rounded-xl border-2 border-bordo/20 bg-white px-4 text-base outline-none focus:border-bordo"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">Observações (opcional)</span>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Troco para R$ 50, sem cebola…"
                    className="h-12 w-full rounded-xl border-2 border-bordo/20 bg-white px-4 text-base outline-none focus:border-bordo"
                  />
                </label>
                {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
              </div>
            </>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-bordo/10 bg-white px-5 pb-safe pt-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-extrabold text-bordo">{formatBRL(total)}</span>
            </div>
            <button
              type="button"
              onClick={finish}
              className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-zap text-lg font-extrabold text-white shadow-lg shadow-zap/30 transition active:scale-[0.98] active:bg-zap-dark"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.1L2 22l5.05-1.6A9.9 9.9 0 1 0 12.04 2Zm5.8 14.07c-.25.7-1.45 1.34-2 1.4-.52.06-1.17.09-1.89-.12a17 17 0 0 1-1.7-.63c-3-1.3-4.95-4.34-5.1-4.54-.15-.2-1.22-1.62-1.22-3.1s.77-2.2 1.05-2.5c.27-.3.6-.37.8-.37h.58c.19 0 .44-.07.68.52.25.6.85 2.07.92 2.22.08.15.13.32.03.52-.1.2-.15.32-.3.5-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.18.3.77 1.27 1.65 2.05 1.13 1 2.08 1.31 2.38 1.46.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.28.1 1.75.83 2.05.98.3.15.5.22.57.35.08.12.08.72-.17 1.42Z" />
              </svg>
              Finalizar Pedido no WhatsApp
            </button>
          </div>
        )}
      </section>
    </>
  );
}
