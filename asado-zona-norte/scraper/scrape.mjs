// Scraper de precios de cortes para asado: supermercados VTEX y carnicerías con tienda online.
// Uso: node scraper/scrape.mjs   (Node 18+, sin dependencias)
// Escribe site/data/precios.json y actualiza site/data/historial.json.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORES, CUTS, CARNICERIAS_ONLINE } from './config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'site', 'data');
const PRECIOS = join(DATA_DIR, 'precios.json');
const HISTORIAL = join(DATA_DIR, 'historial.json');
const HISTORY_DAYS = 180;
const UA = 'Mozilla/5.0 (compatible; comparador-asado/1.0)';
const CARNE_CATEGORY = /carn|cerdo|porcin|vacun|embutid|achur|parrill/;
const MAX_PAGES_PER_SHOP = 120;

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
  if (/\b(x|por|el)\s*(kg|kilo)\b|\(\s*kg\s*\)/.test(n)) return price;
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

// ---------- Carnicerías online (sitemap + JSON-LD) ----------

async function getText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.text();
}

const decodeHtml = (s) =>
  String(s ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

// Clasifica un nombre de producto en un corte. Los boutique van primero porque son más específicos.
const CLASSIFY_ORDER = [...CUTS.filter((c) => c.group === 'Boutique'), ...CUTS.filter((c) => c.group !== 'Boutique')];
export function classify(name) {
  const n = normalize(name);
  return CLASSIFY_ORDER.find((c) => rx(c.match).test(n) && !(c.exclude && rx(c.exclude).test(n)) && !rx(c.noCarne).test(n)) || null;
}

async function sitemapProductUrls(url, depth = 0) {
  const xml = await getText(url);
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => decodeHtml(m[1]));
  if (/<sitemapindex/i.test(xml) && depth < 2) {
    const productMaps = locs.filter((u) => /product/i.test(u));
    const out = [];
    for (const sm of productMaps.length ? productMaps : locs.slice(0, 10)) {
      try {
        out.push(...(await sitemapProductUrls(sm, depth + 1)));
      } catch (err) {
        console.warn(`  sitemap ${sm}: ${err.message}`);
      }
    }
    return out;
  }
  return locs.filter((u) => /\/(productos?|products?)\//i.test(u));
}

function* ldNodes(x) {
  if (Array.isArray(x)) for (const y of x) yield* ldNodes(y);
  else if (x && typeof x === 'object') {
    yield x;
    if (x['@graph']) yield* ldNodes(x['@graph']);
  }
}

const toNumber = (v) => {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').trim();
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return Number(s.replace(/\./g, '').replace(',', '.')); // 24.500,00
  return Number(s.replace(',', '.'));
};

export function parseProductPage(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let json;
    try {
      json = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    for (const node of ldNodes(json)) {
      if (![].concat(node['@type'] || []).includes('Product')) continue;
      const offers = [].concat(node.offers || []).map((o) => (o['@type'] === 'AggregateOffer' ? { ...o, price: o.lowPrice ?? o.price } : o));
      const offer = offers.find((o) => toNumber(o.price) > 0);
      if (!offer) continue;
      const img = [].concat(node.image || [])[0];
      return {
        name: decodeHtml(node.name),
        price: toNumber(offer.price),
        available: !/OutOfStock|SoldOut/i.test(offer.availability || ''),
        image: typeof img === 'string' ? img : img?.url || null,
      };
    }
  }
  return null;
}

export async function scrapeShop(shop) {
  const sitemap = shop.sitemap || `${shop.base}/sitemap.xml`;
  const urls = await sitemapProductUrls(sitemap);
  // Pre-filtro por la URL para no bajar todo el catálogo.
  const candidates = [...new Set(urls)].filter((u) => classify(decodeURIComponent(u).replace(/[-_/]+/g, ' '))).slice(0, MAX_PAGES_PER_SHOP);
  const items = [];
  for (const url of candidates) {
    try {
      const p = parseProductPage(await getText(url));
      const cut = p && classify(p.name);
      if (cut) {
        let ppk = pricePerKg(p.name, {}, p.price);
        if (ppk === null && shop.porKg) ppk = p.price;
        if (ppk === null || (ppk >= 500 && ppk <= 1_000_000)) {
          items.push({
            store: shop.id, cut: cut.id, id: url, name: p.name, price: Math.round(p.price), listPrice: null,
            pricePerKg: ppk === null ? null : Math.round(ppk), available: p.available, url, image: p.image,
          });
        }
      }
    } catch (err) {
      console.warn(`  [${shop.id}] ${url}: ${err.message}`);
    }
    await sleep(300);
  }
  return { items, candidates: candidates.length };
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

  for (const shop of CARNICERIAS_ONLINE) {
    const meta = { id: shop.id, name: shop.name, base: shop.base, kind: 'carniceria', zona: shop.zona };
    try {
      const { items: found, candidates } = await scrapeShop(shop);
      if (candidates > 0 && found.length === 0) throw new Error(`${candidates} productos candidatos pero ninguno con JSON-LD válido`);
      if (candidates === 0) throw new Error('no se encontraron productos en el sitemap');
      items.push(...found);
      stores.push({ ...meta, ok: true, count: found.length, updatedAt: now });
      console.log(`${shop.name}: ${found.length} productos`);
    } catch (err) {
      const old = (previous.items || []).filter((i) => i.store === shop.id && !previous.demo);
      items.push(...old.map((i) => ({ ...i, stale: true })));
      stores.push({ ...meta, ok: false, count: old.length, error: err.message });
      console.log(`${shop.name}: ERROR ${err.message}`);
    }
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
