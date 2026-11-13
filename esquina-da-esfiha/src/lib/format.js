const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Intl usa espaço não separável entre "R$" e o valor; trocamos por espaço comum
// para a mensagem do WhatsApp não ficar com caractere estranho.
export const formatBRL = (value) => brl.format(value).replace(/\u00a0/g, " ");

export const normalize = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
