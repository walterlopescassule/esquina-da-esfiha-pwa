import { formatBRL } from "./format.js";
import { parsePrice } from "./menu.js";

export const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão"];

export const DELIVERY = "Entrega";
export const PICKUP = "Retirar no Balcão";
export const MODES = [DELIVERY, PICKUP];

/** Texto mostrado ao cliente e enviado no WhatsApp. */
export function paymentLabel(payment, mode = DELIVERY) {
  if (payment === "Cartão") return mode === PICKUP ? "Cartão no Balcão" : "Cartão na Entrega";
  return payment;
}

/** "50" -> "R$ 50,00". Se o cliente digitou algo que não é número, mantém o texto. */
export function formatChange(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  const n = parsePrice(text);
  return Number.isFinite(n) ? formatBRL(n) : text;
}

/**
 * Constrói a mensagem final do WhatsApp.
 */
export function buildWhatsAppMessage({ lines, total, mode = DELIVERY, name, address, payment, change }) {
  const items = lines.map((l) => `${l.qty}x ${l.nome} (${formatBRL(l.subtotal)})`).join("\n");

  const placeLine = mode === PICKUP ? "Modalidade: Retirar no balcão" : `Endereço: ${address.trim()}`;

  let paymentLine = `Pagamento: ${paymentLabel(payment, mode)}`;
  if (payment === "Dinheiro" && String(change ?? "").trim()) {
    paymentLine += ` (Troco para ${formatChange(change)})`;
  }

  return [
    "Olá, quero pedir:",
    "",
    items,
    "",
    `Total: ${formatBRL(total)}`,
    `Nome: ${name.trim()}`,
    placeLine,
    paymentLine,
  ].join("\n");
}

export function buildWhatsAppUrl(phone, message) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}