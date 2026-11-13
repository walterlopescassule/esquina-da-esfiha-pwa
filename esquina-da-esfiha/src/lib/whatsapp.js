import { formatBRL } from "./format.js";

/**
 * lines: [{ nome, qty, subtotal }]
 * Exemplo de saída:
 *   Olá, quero pedir:
 *
 *   2x Esfiha de Carne (R$ 5,98)
 *   1x Guaraná 2L (R$ 12,00)
 *
 *   Total: R$ 17,98
 *   Endereço: Rua X, 10, Bairro Y
 */
export function buildWhatsAppMessage({ lines, total, address, notes }) {
  const items = lines.map((l) => `${l.qty}x ${l.nome} (${formatBRL(l.subtotal)})`).join("\n");
  const parts = [
    "Olá, quero pedir:",
    "",
    items,
    "",
    `Total: ${formatBRL(total)}`,
    `Endereço: ${address.trim()}`,
  ];
  if (notes?.trim()) parts.push(`Obs: ${notes.trim()}`);
  return parts.join("\n");
}

export function buildWhatsAppUrl(phone, message) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
