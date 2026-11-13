import { normalize } from "./format.js";

export const CATEGORY_ORDER = ["Esfihas Salgadas", "Esfihas Doces", "Combos", "Bebidas"];

/** Parser de CSV (aspas, vírgulas dentro de aspas, quebras de linha CRLF). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

/** Aceita "5,98", "5.98", "R$ 5,98" e "1.234,56". */
export function parsePrice(raw) {
  let s = String(raw ?? "").replace(/[^\d.,-]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

/** CSV (texto) -> lista de produtos válidos. Linhas sem nome/preço são ignoradas. */
export function csvToProducts(text) {
  const [header, ...body] = parseCsv(text);
  if (!header) return [];
  const cols = header.map(normalize);
  const idx = (name) => cols.indexOf(name);
  const i = {
    id: idx("id"), categoria: idx("categoria"), nome: idx("nome"),
    descricao: idx("descricao"), preco: idx("preco"), imagem: idx("imagem_url"),
  };
  if (i.nome < 0 || i.preco < 0) throw new Error("CSV sem as colunas 'nome' e 'preco'.");

  return body
    .map((r, n) => ({
      id: String(r[i.id] ?? "").trim() || `item-${n}`,
      categoria: String(r[i.categoria] ?? "").trim() || "Outros",
      nome: String(r[i.nome] ?? "").trim(),
      descricao: String(r[i.descricao] ?? "").trim(),
      preco: parsePrice(r[i.preco]),
      imagem_url: String(r[i.imagem] ?? "").trim(),
    }))
    .filter((p) => p.nome && Number.isFinite(p.preco));
}

/** Busca o CSV publicado do Google Sheets e devolve os produtos. */
export async function fetchMenu(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Falha ao carregar o cardápio (${res.status}).`);
  return csvToProducts(await res.text());
}

/** Categorias na ordem da marca; categorias novas da planilha vão para o fim. */
export function orderCategories(products) {
  const found = [...new Set(products.map((p) => p.categoria))];
  const rank = (c) => {
    const k = CATEGORY_ORDER.findIndex((o) => normalize(o) === normalize(c));
    return k === -1 ? CATEGORY_ORDER.length : k;
  };
  return found.sort((a, b) => rank(a) - rank(b));
}
