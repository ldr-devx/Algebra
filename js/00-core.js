'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, REDUCED ? 0 : ms));
const MIN = '−';

/* ---------- números racionales exactos ---------- */
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };
class Rat {
  constructor(n, d = 1) { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); this.n = n / g; this.d = d / g; }
  add(o) { return new Rat(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return this.add(o.neg()); }
  mul(o) { return new Rat(this.n * o.n, this.d * o.d); }
  div(o) { return new Rat(this.n * o.d, this.d * o.n); }
  neg() { return new Rat(-this.n, this.d); }
  isInt() { return this.d === 1; }
  isZero() { return this.n === 0; }
  eq(o) { return this.n === o.n && this.d === o.d; }
  cmp(o) { return this.n * o.d - o.n * this.d; }
}
const Q = (n, d = 1) => new Rat(n, d);
const ONE = Q(1);
const sg = q => q.n < 0 ? MIN : '';
const qs = q => q.d === 1 ? sg(q) + Math.abs(q.n) : sg(q) + Math.abs(q.n) + '/' + q.d;
const fr = (n, d) => `<span class="fr"><i>${n}</i><i>${d}</i></span>`;
const qh = q => q.d === 1 ? sg(q) + Math.abs(q.n) : sg(q) + fr(Math.abs(q.n), q.d);
const absQ = q => q.n < 0 ? q.neg() : q;
function parseQ(s) {
  if (s == null) return null;
  s = String(s).trim().replace(/[−–]/g, '-').replace(',', '.');
  let m = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (m) { const d = +m[2]; return d ? Q(+m[1], d) : null; }
  if (/^-?\d+$/.test(s)) return Q(+s);
  if (/^-?\d*\.\d+$/.test(s)) { const k = s.split('.')[1].length; return Q(Math.round(parseFloat(s) * 10 ** k), 10 ** k); }
  return null;
}

/* ---------- XP ---------- */
let xp = 0;
try { xp = +localStorage.getItem('taller-algebra-xp') || 0; } catch (e) {}
let toastT;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1800); }
function renderXP() {
  $('#lvl').textContent = 'Nivel ' + (Math.floor(xp / 50) + 1);
  $('#xpn').textContent = xp + ' XP';
  $('#xpbar').style.width = ((xp % 50) / 50 * 100) + '%';
}
function addXP(n) { xp += n; try { localStorage.setItem('taller-algebra-xp', xp); } catch (e) {} renderXP(); toast('+' + n + ' XP'); }
renderXP();

/* ---------- avance guardado ---------- */
const PROG_KEY = 'taller-algebra-prog', XP_KEY = 'taller-algebra-xp';
let stored = {};
try { stored = JSON.parse(localStorage.getItem(PROG_KEY) || '{}') || {}; } catch (e) {}
const PROG = {};
function saveProg() {
  try { localStorage.setItem(PROG_KEY, JSON.stringify(Object.fromEntries(Object.entries(PROG).map(([k, v]) => [k, [...v]])))); } catch (e) {}
  renderMenu();
}
function regSet(k) {
  const st = new Set(Array.isArray(stored[k]) ? stored[k] : []), add = st.add.bind(st);
  st.add = v => { add(v); saveProg(); return st; };
  PROG[k] = st; return st;
}
const psz = k => PROG[k] ? PROG[k].size : 0;
const MENU = [
  { tab: 'desigualdades', n: 1, t: 'Desigualdades', s: 'Temas 5-1 y 5-2', tot: 7, get: () => psz('s-iq') },
  { tab: 'ecuaciones', n: 2, t: 'Ecuaciones', s: 'Uno y dos pasos', tot: 9, get: () => psz('s-eq') },
  { tab: 'funciones', n: 3, t: 'Funciones', s: 'La mesa de crafteo', tot: 5, get: () => psz('fn-full') },
  { tab: 'varios', n: 4, t: 'Varios pasos', s: 'Tema 5-3', tot: 7, get: () => psz('m-mp') },
  { tab: 'pendiente', n: 5, t: 'Pendiente e intercepto', s: 'Libro 3.4 y 3.5', tot: 6, get: () => psz('pt') },
  { tab: 'estandar', n: 6, t: 'Forma estándar', s: 'Tema 4-4', tot: 8, get: () => psz('sf') + psz('st') },
  { tab: 'rectas', n: 7, t: 'Paralelas y perpendiculares', s: 'Tema 4-5', tot: 5, get: () => psz('pp') },
  { tab: 'orden', n: 8, t: 'Orden de operaciones', s: 'Libro 1.4', tot: 8, get: () => psz('or') },
  { tab: 'exponentes', n: 9, t: 'Exponentes y notación científica', s: 'Libro 1.5 y 1.6', tot: 6, get: () => psz('nc') },
  { tab: 'conjuntos', n: 10, t: 'Conjuntos', s: 'Libro 1.2', tot: 3, get: () => psz('cj') },
  { tab: 'racionales', n: 11, t: 'Racionales y proporciones', s: 'Exámenes 8.º y 9.º', tot: 8, get: () => psz('rf') + psz('m-rp') }
];
function renderMenu() {
  const grid = $('#menu-grid'); if (!grid) return;
  let c = 0, t = 0;
  grid.innerHTML = MENU.map(m => {
    const g = Math.min(m.get(), m.tot); c += g; t += m.tot;
    return `<button class="mcard${g >= m.tot ? ' full' : ''}" data-go="${m.tab}"><span class="num">${m.n}</span><span class="tt">${m.t}</span><span class="st">${m.s}</span><span class="bar"><i style="width:${g / m.tot * 100}%"></i></span><span class="cnt">${g} de ${m.tot} actividades</span></button>`;
  }).join('');
  $$('#menu-grid .mcard').forEach(b => b.addEventListener('click', () => { location.hash = b.dataset.go; showTab(b.dataset.go); window.scrollTo(0, 0); }));
  const pct = Math.round(c / t * 100);
  $('#menu-pct').textContent = pct + '%'; $('#menu-bar').style.width = pct + '%';
}

/* ---------- pestañas ---------- */
const TABS = ['inicio', 'desigualdades', 'ecuaciones', 'funciones', 'varios', 'pendiente', 'estandar', 'rectas', 'orden', 'exponentes', 'conjuntos', 'racionales'];
function showTab(id) {
  if (!TABS.includes(id)) id = 'inicio';
  if (id === 'inicio') renderMenu();
  $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
  $$('.mission').forEach(m => { m.hidden = m.dataset.tab !== id; });
}
$$('.tab').forEach(t => t.addEventListener('click', () => { location.hash = t.dataset.tab; showTab(t.dataset.tab); }));
addEventListener('hashchange', () => showTab(location.hash.slice(1)));
showTab(location.hash.slice(1));
