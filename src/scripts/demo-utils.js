/* Utilidades compartilhadas das demos do portfólio.
   Cada demo se registra aqui; o controller do portfolio.astro consulta lazy. */

export const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- registry ---- */
const demos = new Map();
export function registerDemo(slug, api) { demos.set(slug, api); }
export function getDemo(slug) { return demos.get(slug); }

/* ---- scheduler: timers que morrem juntos no unmount ---- */
export function mkScheduler() {
  const t = new Set();
  return {
    after(ms, fn) {
      const id = setTimeout(() => { t.delete(id); fn(); }, prefersReduced ? 0 : ms);
      t.add(id);
      return id;
    },
    every(ms, fn) {
      const id = setInterval(fn, ms);
      t.add(id);
      return id;
    },
    clear() { t.forEach((id) => { clearTimeout(id); clearInterval(id); }); t.clear(); },
  };
}

/* ---- contador animado (pt-BR) — independente do [data-count] do main.js ----
   Cada chamada assume a "posse" do elemento via token: um loop antigo que ainda
   esteja rodando (troca rápida de demo/período) percebe e se encerra sozinho. */
export function animateCount(el, target, decimals = 0, suffix = '') {
  const fmt = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  const token = (el.__acToken = (el.__acToken || 0) + 1);
  if (prefersReduced) { el.textContent = fmt(target); return; }
  const from = parseFloat((el.textContent || '0').replace(/\./g, '').replace(',', '.')) || 0;
  const t0 = performance.now();
  const DUR = 1100;
  const tick = (now) => {
    if (el.__acToken !== token) return; // outra chamada assumiu este elemento
    const p = Math.min((now - t0) / DUR, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (target - from) * eased);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(target);
  };
  requestAnimationFrame(tick);
}

/* ---- escape de HTML p/ conteúdo vindo do usuário ---- */
export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ---- typewriter ---- */
export function typewriter(el, text, scheduler, cps = 28, onDone) {
  el.textContent = '';
  if (prefersReduced) { el.textContent = text; if (onDone) onDone(); return; }
  let i = 0;
  const step = () => {
    el.textContent = text.slice(0, ++i);
    if (i < text.length) scheduler.after(1000 / cps, step);
    else if (onDone) onDone();
  };
  step();
}

/* ---- caminhos SVG suavizados (linha e área) ----
   pts: array de valores; w/h: dimensões úteis; pad: margem interna */
export function linePath(pts, w, h, pad = 8) {
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  const x = (i) => pad + (i * (w - pad * 2)) / (pts.length - 1);
  const y = (v) => h - pad - ((v - min) / range) * (h - pad * 2);
  let d = `M ${x(0)} ${y(pts[0])}`;
  for (let i = 1; i < pts.length; i++) {
    const xc = (x(i - 1) + x(i)) / 2;
    d += ` C ${xc} ${y(pts[i - 1])}, ${xc} ${y(pts[i])}, ${x(i)} ${y(pts[i])}`;
  }
  return d;
}
export function areaPath(pts, w, h, pad = 8) {
  return `${linePath(pts, w, h, pad)} L ${w - pad} ${h} L ${pad} ${h} Z`;
}

/* ---- re-trigger de animações CSS de uma subtree ---- */
export function replay(root) {
  root.classList.remove('play');
  void root.offsetWidth;
  root.classList.add('play');
}
