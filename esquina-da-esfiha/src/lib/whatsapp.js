import { formatBRL } from "./format.js";
import { parsePrice } from "./menu.js";

export const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão na Entrega"];

/** "50" -> "R$ 50,00". Se o cliente digitou algo que não é número, mantém o texto. */
export function formatChange(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  const n = parsePrice(text);
  return Number.isFinite(n) ? formatBRL(n) : text;
}

/**
 * lines: [{ nome, qty, subtotal }]
 */
export function buildWhatsAppMessage({ lines, total, name, address, payment, change }) {
  const items = lines.map((l) => `${l.qty}x ${l.nome} (${formatBRL(l.subtotal)})`).join("\n");

  let paymentLine = `Pagamento: ${payment}`;
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
    `Endereço: ${address.trim()}`,
    paymentLine,
  ].join("\n");
}

export function buildWhatsAppUrl(phone, message) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}