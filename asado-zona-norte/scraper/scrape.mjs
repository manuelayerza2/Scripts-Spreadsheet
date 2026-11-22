// Scraper de precios de cortes para asado en supermercados VTEX.
// Uso: node scraper/scrape.mjs   (Node 18+, sin dependencias)
// Escribe site/data/precios.json y actualiza site/data/historial.json.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORES, CUTS } from './config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'site', 'data');
const PRECIOS = join(DATA_DIR, 'precios.json');
const HISTORIAL = join(DATA_DIR, 'historial.json');
const HISTORY_DAYS = 180;
const UA = 'Mozilla/5.0 (compatible; comparador-asado/1.0)';
const CARNE_CATEGORY = /carn|cerdo|porcin|vacun|embutid|achur|parrill/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normalize = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const rx = (src) => (src ? new RegExp(normalize(src)) : null);

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

async function search(store, term) {
  const params = new URLSearchParams({ ft: term, _from: '0', _to: '49' });
  if (store.sc) params.set('sc', String(store.sc));
  const url = `${store.base}/api/catalog_system/pub/products/search?${params}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.json();
}

// Precio por kg: primero por unidad de medida VTEX, después leyendo el peso del nombre.
export function pricePerKg(name, item, price) {
  const unit = normalize(item.measurementUnit);
  const mult = Number(item.unitMultiplier) || 1;
  if (unit === 'kg') return price / mult;
  if (unit === 'g' || unit === 'gr') return price / (mult / 1000);
  const n = normalize(name);
  let m = n.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kgs|kilo|kilos)\b/);
  if (m) return price / parseFloat(m[1].replace(',', '.'));
  m = n.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|grs|gramos)\b/);
  if (m) return price / (parseFloat(m[1].replace(',', '.')) / 1000);
  if (/\b(x|por|el)\s*kg\b/.test(n)) return price;
  return null;
}

export function toItems(store, cut, products) {
  const match = rx(cut.match);
  const exclude = rx(cut.exclude);
  const noCarne = rx(cut.noCarne);
  const out = [];
  for (const p of products || []) {
    const name = p.productName || '';
    const n = normalize(name);
    if (!match.test(n) || (exclude && exclude.test(n)) || noCarne.test(n)) continue;
    const cats = normalize((p.categories || []).join(' '));
    if (cats && !CARNE_CATEGORY.test(cats)) continue;
    for (const item of p.items || []) {
      const seller = (item.sellers || []).find((s) => s.sellerDefault) || item.sellers?.[0];
      const offer = seller?.commertialOffer;
      if (!offer || !(offer.Price > 0)) continue;
      const ppk = pricePerKg(name, item, offer.Price);
      if (ppk !== null && (ppk < 500 || ppk > 1_000_000)) continue; // valores absurdos
      out.push({
        store: store.id,
        cut: cut.id,
        id: item.itemId,
        name,
        price: Math.round(offer.Price),
        listPrice: offer.ListPrice > offer.Price ? Math.round(offer.ListPrice) : null,
        pricePerKg: ppk === null ? null : Math.round(ppk),
        available: offer.AvailableQuantity > 0 || offer.IsAvailable === true,
        url: p.link || `${store.base}/${p.linkText}/p`,
        image: item.images?.[0]?.imageUrl || null,
      });
    }
  }
  return out;
}

async function scrapeStore(store) {
  const items = new Map();
  let ok = 0;
  let lastError = null;
  for (const cut of CUTS) {
    for (const term of cut.search) {
      try {
        const products = await search(store, term);
        ok++;
        for (const it of toItems(store, cut, products)) items.set(`${it.cut}:${it.id}`, it);
      } catch (err) {
        lastError = err.message;
        console.warn(`[${store.id}] "${term}": ${err.message}`);
      }
      await sleep(400);
    }
  }
  return { items: [...items.values()], ok, lastError };
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  const previous = await readJson(PRECIOS, { items: [] });
  const now = new Date().toISOString();
  const items = [];
  const stores = [];

  for (const store of STORES) {
    const { items: found, ok, lastError } = await scrapeStore(store);
    if (ok === 0) {
      // Falló todo: conservar lo último que teníamos de ese súper, marcado como desactualizado.
      const old = (previous.items || []).filter((i) => i.store === store.id && !previous.demo);
      items.push(...old.map((i) => ({ ...i, stale: true })));
      stores.push({ id: store.id, name: store.name, base: store.base, ok: false, count: old.length, error: lastError });
    } else {
      items.push(...found);
      stores.push({ id: store.id, name: store.name, base: store.base, ok: true, count: found.length, updatedAt: now });
    }
    console.log(`${store.name}: ${ok ? found.length + ' productos' : 'ERROR ' + lastError}`);
  }

  const cuts = CUTS.map(({ id, name, group }) => ({ id, name, group }));
  await writeFile(PRECIOS, JSON.stringify({ demo: false, updatedAt: now, stores, cuts, items }, null, 1));

  // Historial: mínimo $/kg por corte y súper, un registro por día.
  const hist = await readJson(HISTORIAL, {});
  const day = now.slice(0, 10);
  const today = {};
  for (const it of items) {
    if (it.stale || it.pricePerKg === null || !it.available) continue;
    today[it.cut] ??= {};
    const cur = today[it.cut][it.store];
    if (cur === undefined || it.pricePerKg < cur) today[it.cut][it.store] = it.pricePerKg;
  }
  hist[day] = today;
  const days = Object.keys(hist).sort().slice(-HISTORY_DAYS);
  await writeFile(HISTORIAL, JSON.stringify(Object.fromEntries(days.map((d) => [d, hist[d]]))));

  if (stores.every((s) => !s.ok)) {
    console.error('Ningún supermercado respondió.');
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
