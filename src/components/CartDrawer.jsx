import { useEffect, useRef, useState } from "react";
import { Banknote, CreditCard, MapPin, Minus, Plus, QrCode, User, X } from "lucide-react";
import { formatBRL } from "../lib/format.js";
import { parsePrice } from "../lib/menu.js";
import { PAYMENT_METHODS, buildWhatsAppMessage, buildWhatsAppUrl } from "../lib/whatsapp.js";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

const PAYMENT_ICONS = { Pix: QrCode, Dinheiro: Banknote, "Cartão na Entrega": CreditCard };

const saved = (key) => {
  try { return localStorage.getItem(key) ?? ""; } catch { return ""; }
};

const inputClass = (invalid) =>
  `h-14 w-full rounded-xl border-2 bg-white px-4 text-base outline-none focus:border-bordo ${
    invalid ? "border-red-600" : "border-bordo/20"
  }`;

function FieldError({ id, children }) {
  return children ? (
    <p id={id} role="alert" className="mt-1.5 text-sm font-semibold text-red-700">{children}</p>
  ) : null;
}

export default function CartDrawer({ open, onClose, lines, total, onAdd, onRemove }) {
  const [name, setName] = useState(() => saved("esquina:name"));
  const [address, setAddress] = useState(() => saved("esquina:address"));
  const [payment, setPayment] = useState("");
  const [change, setChange] = useState("");
  const [errors, setErrors] = useState({});

  const nameRef = useRef(null);
  const addressRef = useRef(null);
  const paymentRef = useRef(null);
  const changeRef = useRef(null);

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

  const clearError = (key) => setErrors((e) => ({ ...e, [key]: undefined }));

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Informe seu nome.";
    if (!address.trim()) next.address = "Informe rua, número e bairro para a entrega.";
    if (!payment) next.payment = "Escolha a forma de pagamento.";
    if (payment === "Dinheiro" && change.trim()) {
      const n = parsePrice(change);
      if (!Number.isFinite(n)) next.change = "Digite só o valor, por exemplo 50.";
      else if (n < total) next.change = `O valor precisa ser maior ou igual ao total (${formatBRL(total)}).`;
    }
    return next;
  };

  const finish = () => {
    const next = validate();
    setErrors(next);

    const first = ["name", "address", "payment", "change"].find((k) => next[k]);
    if (first) {
      const target = { name: nameRef, address: addressRef, payment: paymentRef, change: changeRef }[first].current;
      target?.focus?.();
      target?.scrollIntoView?.({ block: "center", behavior: "smooth" });
      return;
    }
    if (!WHATSAPP_NUMBER) {
      setErrors({ general: "Número de WhatsApp não configurado (VITE_WHATSAPP_NUMBER)." });
      return;
    }

    try {
      localStorage.setItem("esquina:name", name);
      localStorage.setItem("esquina:address", address);
    } catch { /* ignora */ }

    const message = buildWhatsAppMessage({ lines, total, name, address, payment, change });
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

              <div className="mt-4 space-y-4 pb-4">
                {/* Nome */}
                <div>
                  <label htmlFor="cliente-nome" className="mb-1.5 flex items-center gap-1.5 text-sm font-bold">
                    <User size={16} /> Nome
                  </label>
                  <input
                    id="cliente-nome"
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearError("name"); }}
                    placeholder="Seu nome"
                    autoComplete="name"
                    required
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "erro-nome" : undefined}
                    className={inputClass(errors.name)}
                  />
                  <FieldError id="erro-nome">{errors.name}</FieldError>
                </div>

                {/* Endereço */}
                <div>
                  <label htmlFor="cliente-endereco" className="mb-1.5 flex items-center gap-1.5 text-sm font-bold">
                    <MapPin size={16} /> Endereço de entrega
                  </label>
                  <input
                    id="cliente-endereco"
                    ref={addressRef}
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); clearError("address"); }}
                    placeholder="Rua, Número, Bairro"
                    autoComplete="street-address"
                    required
                    aria-invalid={Boolean(errors.address)}
                    aria-describedby={errors.address ? "erro-endereco" : undefined}
                    className={inputClass(errors.address)}
                  />
                  <FieldError id="erro-endereco">{errors.address}</FieldError>
                </div>

                {/* Pagamento */}
                <div>
                  <p id="pagamento-label" className="mb-1.5 text-sm font-bold">Forma de pagamento</p>
                  <div
                    ref={paymentRef}
                    role="radiogroup"
                    aria-labelledby="pagamento-label"
                    aria-describedby={errors.payment ? "erro-pagamento" : undefined}
                    tabIndex={-1}
                    className="grid grid-cols-3 gap-2"
                  >
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = PAYMENT_ICONS[method];
                      const on = payment === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => {
                            setPayment(method);
                            clearError("payment");
                            if (method !== "Dinheiro") { setChange(""); clearError("change"); }
                          }}
                          className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-1 py-2 text-center text-sm font-bold leading-tight transition active:scale-95 ${
                            on
                              ? "border-bordo bg-bordo text-white"
                              : errors.payment
                                ? "border-red-600 bg-white text-ink"
                                : "border-bordo/20 bg-white text-ink"
                          }`}
                        >
                          <Icon size={22} strokeWidth={2.4} aria-hidden="true" />
                          {method}
                        </button>
                      );
                    })}
                  </div>
                  <FieldError id="erro-pagamento">{errors.payment}</FieldError>
                </div>

                {/* Troco (só para dinheiro) */}
                {payment === "Dinheiro" && (
                  <div>
                    <label htmlFor="cliente-troco" className="mb-1.5 block text-sm font-bold">
                      Precisa de troco para quanto? (opcional)
                    </label>
                    <input
                      id="cliente-troco"
                      ref={changeRef}
                      type="text"
                      inputMode="decimal"
                      value={change}
                      onChange={(e) => { setChange(e.target.value); clearError("change"); }}
                      placeholder="Ex.: 50"
                      aria-invalid={Boolean(errors.change)}
                      aria-describedby={errors.change ? "erro-troco" : undefined}
                      className={`${inputClass(errors.change)} h-12`}
                    />
                    <FieldError id="erro-troco">{errors.change}</FieldError>
                  </div>
                )}

                <FieldError>{errors.general}</FieldError>
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