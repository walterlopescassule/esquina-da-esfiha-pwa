import { useEffect, useState } from "react";
import { fetchMenu } from "../lib/menu.js";
import { demoMenu } from "../data/demoMenu.js";

const CSV_URL = import.meta.env.VITE_MENU_CSV_URL;
const CACHE_KEY = "esquina:menu:v1";

const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) ?? null; } catch { return null; }
};

/**
 * Mostra o cardápio guardado na hora (se existir) e atualiza em segundo plano.
 * status: "loading" | "ready" | "error"
 */
export function useMenu() {
  const cached = readCache();
  const [products, setProducts] = useState(cached ?? []);
  const [status, setStatus] = useState(cached ? "ready" : "loading");
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!CSV_URL) {
      setProducts(demoMenu); setIsDemo(true); setStatus("ready");
      return;
    }
    const ctrl = new AbortController();
    fetchMenu(CSV_URL, ctrl.signal)
      .then((list) => {
        setProducts(list); setStatus("ready");
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch { /* storage cheio: ignora */ }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setStatus((s) => (readCache() ? "ready" : "error"));
      });
    return () => ctrl.abort();
  }, []);

  return { products, status, isDemo };
}
