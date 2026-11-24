const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const money = (n) => (n == null ? '—' : fmt.format(n));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null);
const $ = (id) => document.getElementById(id);

const MIX = { asado: 0.4, vacio: 0.25, chorizo: 0.15, morcilla: 0.1, matambre: 0.1 };
const SERIES_COLORS = ['#b9410e', '#2a6fdb', '#1f7a3d', '#8a4fd0', '#c48a00', '#0f8a8a', '#d0457a', '#6b625b'];

const state = { data: null, hist: {}, cut: null, stores: new Set(), onlyAvailable: true, q: '' };

async function getJson(path, fallback) {
  try {
    const r = await fetch(path, { cache: 'no-cache' });
    return r.ok ? await r.json() : fallback;
  } catch {
    return fallback;
  }
}

// Las carnicerías cargadas a mano con precios se suman como comercios; las que no tienen precios van al directorio.
// Cada precio puede ser un número ($/kg) o { "porKg": n, "nombre": "...", "nota": "..." }.
function mergeCarnicerias(data, carnicerias) {
  const directory = [];
  carnicerias.forEach((c, i) => {
    const precios = Object.entries(c.precios || {});
    if (!precios.length) {
      directory.push(c);
      return;
    }
    const id = `carn_${i}`;
    data.stores.push({ id, name: c.nombre, localidad: c.localidad, kind: 'carniceria', ok: true, updatedAt: c.fecha });
    for (const [cut, v] of precios) {
      const p = typeof v === 'number' ? { porKg: v } : v || {};
      if (!(p.porKg > 0)) continue;
      data.items.push({
        store: id, cut, id: `${id}_${cut}`, name: p.nombre || data.cuts.find((x) => x.id === cut)?.name || cut,
        price: p.porKg, pricePerKg: p.porKg, available: true, url: safeUrl(c.url), image: null, fecha: c.fecha, nota: p.nota,
      });
    }
  });
  return directory;
}

const isCarniceria = (s) => s.kind === 'carniceria';
const storeSubtitle = (s) => s.localidad || s.zona || (isCarniceria(s) && s.base ? 'envío a confirmar' : '');

function visibleItems(cut) {
  return state.data.items.filter((i) =>
    (!cut || i.cut === cut) && state.stores.has(i.store) && (!state.onlyAvailable || i.available) && i.pricePerKg != null);
}

function minByStore(cut) {
  const out = {};
  for (const i of visibleItems(cut)) if (out[i.store] == null || i.pricePerKg < out[i.store]) out[i.store] = i.pricePerKg;
  return out;
}

function storeName(id) {
  return state.data.stores.find((s) => s.id === id)?.name || id;
}

function renderMeta() {
  const d = state.data;
  const when = new Date(d.updatedAt).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });
  const failed = d.stores.filter((s) => !s.ok).map((s) => s.name);
  $('meta').textContent = `Actualizado: ${when}` + (failed.length ? ` · Sin datos nuevos de: ${failed.join(', ')}` : '');
  $('demo-banner').hidden = !d.demo;
}

function renderChips() {
  const chips = [{ id: null, name: 'Todos' }, ...state.data.cuts];
  $('cut-chips').innerHTML = chips
    .map((c) => `<button class="chip" role="tab" data-cut="${c.id ?? ''}" aria-selected="${state.cut === c.id}">${esc(c.name)}</button>`)
    .join('');
}

function renderStoreFilter() {
  const box = (s) => `<label><input type="checkbox" value="${esc(s.id)}" ${state.stores.has(s.id) ? 'checked' : ''}> ${esc(s.name)}</label>`;
  const supers = state.data.stores.filter((s) => !isCarniceria(s));
  const carns = state.data.stores.filter(isCarniceria);
  $('store-filter').innerHTML =
    `<legend>Comercios</legend><div class="presets"><button type="button" data-preset="all">Todos</button><button type="button" data-preset="super">Solo súper</button><button type="button" data-preset="carn">Solo carnicerías</button></div>` +
    `<div class="store-group"><span>Súper</span>${supers.map(box).join('')}</div>` +
    (carns.length ? `<div class="store-group"><span>Carnicerías</span>${carns.map(box).join('')}</div>` : '');
}

function renderDirectory(list) {
  if (!list.length) return;
  $('directory').hidden = false;
  $('directory-list').innerHTML = list
    .map((c) => {
      const url = safeUrl(c.url);
      const name = url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(c.nombre)}</a>` : esc(c.nombre);
      return `<li><strong>${name}</strong>${c.localidad ? ` · ${esc(c.localidad)}` : ''}${c.direccion ? ` · ${esc(c.direccion)}` : ''}${c.nota ? `<div class="unit">${esc(c.nota)}</div>` : ''}</li>`;
    })
    .join('');
}

function renderSummary() {
  // Solo columnas de comercios que tengan algún precio con los filtros actuales.
  const withData = new Set(visibleItems(null).map((i) => i.store));
  const stores = state.data.stores.filter((s) => state.stores.has(s.id) && withData.has(s.id));
  const head = `<thead><tr><th>Corte</th>${stores
    .map((s) => `<th>${esc(s.name)}${storeSubtitle(s) ? `<small>${esc(storeSubtitle(s))}</small>` : ''}</th>`)
    .join('')}<th>Diferencia</th></tr></thead>`;
  let body = '';
  let group = null;
  for (const cut of state.data.cuts) {
    if (cut.group !== group) {
      group = cut.group;
      body += `<tr class="group"><td colspan="${stores.length + 2}">${esc(group)}</td></tr>`;
    }
    const mins = minByStore(cut.id);
    const vals = Object.values(mins);
    const lo = vals.length ? Math.min(...vals) : null;
    const hi = vals.length ? Math.max(...vals) : null;
    const cells = stores
      .map((s) => {
        const v = mins[s.id];
        if (v == null) return '<td class="na">—</td>';
        return `<td class="${v === lo && vals.length > 1 ? 'best' : ''}">${money(v)}</td>`;
      })
      .join('');
    const save = vals.length > 1 && hi > lo ? `${Math.round(((hi - lo) / hi) * 100)}%` : '—';
    body += `<tr class="cut" data-cut="${esc(cut.id)}" tabindex="0"><td>${esc(cut.name)}</td>${cells}<td class="save">${save}</td></tr>`;
  }
  $('summary-table').innerHTML = head + `<tbody>${body}</tbody>`;
}

function renderTrend(cutId) {
  const days = Object.keys(state.hist).sort();
  const box = $('trend');
  if (days.length < 2) {
    box.innerHTML = '';
    return;
  }
  const storeIds = state.data.stores.filter((s) => state.stores.has(s.id) && !s.id.startsWith('carn_')).map((s) => s.id);
  const series = storeIds
    .map((id, k) => ({ id, color: SERIES_COLORS[k % SERIES_COLORS.length], pts: days.map((d, x) => [x, state.hist[d]?.[cutId]?.[id]]).filter((p) => p[1] != null) }))
    .filter((s) => s.pts.length > 1);
  if (!series.length) {
    box.innerHTML = '';
    return;
  }
  const all = series.flatMap((s) => s.pts.map((p) => p[1]));
  const lo = Math.min(...all) * 0.97;
  const hi = Math.max(...all) * 1.03;
  const W = 600, H = 140, P = 4;
  const sx = (x) => P + (x / (days.length - 1)) * (W - 2 * P);
  const sy = (v) => H - P - ((v - lo) / (hi - lo || 1)) * (H - 2 * P);
  const lines = series
    .map((s) => `<polyline fill="none" stroke="${s.color}" stroke-width="2" vector-effect="non-scaling-stroke" points="${s.pts.map(([x, v]) => `${sx(x).toFixed(1)},${sy(v).toFixed(1)}`).join(' ')}"/>`)
    .join('');
  box.innerHTML = `<div class="legend"><span>Mínimo $/kg, ${esc(days[0])} → ${esc(days.at(-1))}:</span>${series
    .map((s) => `<span><i style="background:${s.color}"></i>${esc(storeName(s.id))}</span>`)
    .join('')}</div><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Evolución del precio mínimo por kilo">${lines}</svg>`;
}

function renderDetail() {
  const cut = state.data.cuts.find((c) => c.id === state.cut);
  $('detail-title').textContent = cut.name;
  const q = state.q.trim().toLowerCase();
  const items = state.data.items
    .filter((i) => i.cut === cut.id && state.stores.has(i.store) && (!state.onlyAvailable || i.available))
    .filter((i) => !q || i.name.toLowerCase().includes(q))
    .sort((a, b) => (a.pricePerKg ?? Infinity) - (b.pricePerKg ?? Infinity));
  renderTrend(cut.id);
  if (!items.length) {
    $('products').innerHTML = '<li class="empty">No hay productos para este corte con los filtros actuales.</li>';
    return;
  }
  $('products').innerHTML = items
    .map((i, k) => {
      const url = safeUrl(i.url);
      const name = url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(i.name)}</a>` : esc(i.name);
      const img = safeUrl(i.image) ? `<img src="${esc(i.image)}" alt="" loading="lazy">` : '<div class="ph"></div>';
      const badges = [
        i.listPrice ? `<span class="badge">Oferta −${Math.round((1 - i.price / i.listPrice) * 100)}%</span>` : '',
        !i.available ? '<span class="badge muted">Sin stock</span>' : '',
        i.stale ? '<span class="badge muted">Precio anterior</span>' : '',
        i.fecha ? `<span class="badge muted">Relevado ${esc(i.fecha)}</span>` : '',
        i.nota ? `<span class="badge muted">${esc(i.nota)}</span>` : '',
      ].join('');
      const ppk = i.pricePerKg != null ? `<div class="ppk">${money(i.pricePerKg)}<span class="unit"> /kg</span></div>` : '<div class="unit">Sin precio por kg</div>';
      const unit = i.price !== i.pricePerKg ? `<div class="unit">${money(i.price)} el producto</div>` : '';
      return `<li class="product ${k === 0 && i.pricePerKg != null ? 'top1' : ''}">${img}<div><div class="name">${name}${badges}</div><div class="store">${esc(storeName(i.store))}</div></div><div class="price">${ppk}${unit}</div></li>`;
    })
    .join('');
}

function renderCalc() {
  const people = Math.max(1, Number($('people').value) || 0);
  const grams = Math.max(100, Number($('grams').value) || 0);
  const kg = (people * grams) / 1000;
  $('calc-kg').textContent = `Total: ${kg.toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg de carne`;
  const mins = Object.fromEntries(Object.keys(MIX).map((c) => [c, minByStore(c)]));
  const rows = [];
  for (const s of state.data.stores.filter((x) => state.stores.has(x.id))) {
    let total = 0;
    const missing = [];
    for (const [cut, share] of Object.entries(MIX)) {
      const p = mins[cut][s.id];
      if (p == null) missing.push(cut);
      else total += p * kg * share;
    }
    if (missing.length < Object.keys(MIX).length) rows.push({ label: s.name, total, missing });
  }
  let best = 0;
  let complete = true;
  for (const [cut, share] of Object.entries(MIX)) {
    const vals = Object.values(mins[cut]);
    if (!vals.length) complete = false;
    else best += Math.min(...vals) * kg * share;
  }
  rows.sort((a, b) => a.missing.length - b.missing.length || a.total - b.total);
  const cutName = (id) => state.data.cuts.find((c) => c.id === id)?.name || id;
  $('calc-results').innerHTML =
    (complete ? `<li>Combinando comercios <strong>${money(best)}</strong> <span>(${money(best / people)} por persona)</span></li>` : '') +
    rows
      .map((r) => `<li>${esc(r.label)} <strong>${money(r.total)}</strong> ${r.missing.length ? `<span>(parcial: no tiene ${esc(r.missing.map(cutName).join(', '))})</span>` : `<span>(${money(r.total / people)} por persona)</span>`}</li>`)
      .join('');
}

function render() {
  renderChips();
  $('summary').hidden = state.cut !== null;
  $('detail').hidden = state.cut === null;
  if (state.cut === null) renderSummary();
  else renderDetail();
  renderCalc();
}

function openCut(id) {
  state.cut = id || null;
  state.q = '';
  $('q').value = '';
  try {
    history.replaceState(null, '', id ? `#${id}` : location.pathname);
  } catch {}
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bind() {
  $('cut-chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (b) openCut(b.dataset.cut);
  });
  $('summary-table').addEventListener('click', (e) => {
    const tr = e.target.closest('tr.cut');
    if (tr) openCut(tr.dataset.cut);
  });
  $('summary-table').addEventListener('keydown', (e) => {
    const tr = e.target.closest('tr.cut');
    if (tr && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openCut(tr.dataset.cut);
    }
  });
  $('back').addEventListener('click', () => openCut(null));
  $('store-filter').addEventListener('click', (e) => {
    const preset = e.target.closest('[data-preset]')?.dataset.preset;
    if (!preset) return;
    state.stores = new Set(state.data.stores
      .filter((s) => preset === 'all' || (preset === 'carn') === isCarniceria(s))
      .map((s) => s.id));
    renderStoreFilter();
    render();
  });
  $('store-filter').addEventListener('change', (e) => {
    if (e.target.checked) state.stores.add(e.target.value);
    else state.stores.delete(e.target.value);
    render();
  });
  $('only-available').addEventListener('change', (e) => {
    state.onlyAvailable = e.target.checked;
    render();
  });
  $('q').addEventListener('input', (e) => {
    state.q = e.target.value;
    renderDetail();
  });
  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    openCut(state.data.cuts.some((c) => c.id === id) ? id : null);
  });
  $('people').addEventListener('input', renderCalc);
  $('grams').addEventListener('input', renderCalc);
}

async function init() {
  const [data, hist, carnicerias] = await Promise.all([
    getJson('data/precios.json', null),
    getJson('data/historial.json', {}),
    getJson('data/carnicerias.json', []),
  ]);
  if (!data) {
    $('meta').textContent = 'No se pudieron cargar los precios.';
    return;
  }
  const directory = mergeCarnicerias(data, Array.isArray(carnicerias) ? carnicerias : []);
  const conPrecios = new Set(data.items.map((i) => i.store));
  for (const s of data.stores) {
    if (s.base && isCarniceria(s) && !conPrecios.has(s.id)) {
      directory.push({ nombre: s.name, localidad: s.zona, url: s.base, nota: 'Tiene tienda online, pero todavía no pudimos leer sus precios.' });
    }
  }
  renderDirectory(directory);
  state.data = data;
  state.hist = hist;
  state.stores = new Set(data.stores.map((s) => s.id));
  const fromHash = decodeURIComponent(location.hash.slice(1));
  state.cut = data.cuts.some((c) => c.id === fromHash) ? fromHash : null;
  renderMeta();
  renderStoreFilter();
  bind();
  render();
}

init();
