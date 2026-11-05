'use strict';
/* ---------- forma estándar 4-4 ---------- */
const SH = [{ A: 3, B: 2, C: 12 }, { A: 2, B: 3, C: 12 }, { A: 2, B: 1, C: 10 }];
const ST = { i: 0, x: 0, y: 0, found: [], ext: false, full: regSet('st') };
function stSols(s) { let n = 0; for (let x = 0; x * s.A <= s.C; x++) if ((s.C - x * s.A) % s.B === 0) n++; return n; }
function stDraw() {
  const s = SH[ST.i], mx = Math.ceil(Math.max(s.C / s.A, s.C / s.B)) + 1, tot = s.A * ST.x + s.B * ST.y;
  $('#st-rule').innerHTML = `Espada ${s.A} monedas · Poción ${s.B} monedas · Presupuesto ${s.C}. Ecuación: <b>${s.A}x + ${s.B}y = ${s.C}</b>`;
  $('#st-xv').textContent = ST.x; $('#st-yv').textContent = ST.y;
  $('#st-spend').textContent = `${s.A}·${ST.x} + ${s.B}·${ST.y} = ${tot}  ${tot === s.C ? '→ presupuesto exacto ✓' : tot > s.C ? '→ te pasaste en ' + (tot - s.C) : '→ te sobran ' + (s.C - tot)}`;
  const pts = ST.found.map(([x, y]) => ({ x, y, label: `(${x}, ${y})` }));
  const lines = (ST.ext || ST.found.length >= 2) ? [{ m: -s.A / s.B, b: s.C / s.B, cls: 'gh' }] : [];
  if (ST.ext) { pts.push({ x: s.C / s.A, y: 0, cls: 'pt2', label: `(${s.C / s.A}, 0)` }, { x: 0, y: s.C / s.B, cls: 'pt2', label: `(0, ${s.C / s.B})` }); }
  $('#st-svg').innerHTML = planeSVG({ min: 0, max: mx, lab: Math.max(1, Math.ceil(mx / 6)), lines, pts });
}
function stShops() {
  $('#st-shops').innerHTML = SH.map((s, i) => `<button class="lv" data-i="${i}" aria-current="${i === ST.i}" style="min-width:90px">${s.A}x+${s.B}y=${s.C}</button>`).join('');
  $$('#st-shops .lv').forEach(b => b.addEventListener('click', () => { ST.i = +b.dataset.i; ST.x = 0; ST.y = 0; ST.found = []; ST.ext = false; $('#st-msg').textContent = ''; stShops(); stDraw(); }));
}
$$('[data-st]').forEach(b => b.addEventListener('click', () => {
  const k = b.dataset.st; if (k === 'x+') ST.x++; if (k === 'x-') ST.x = Math.max(0, ST.x - 1); if (k === 'y+') ST.y++; if (k === 'y-') ST.y = Math.max(0, ST.y - 1); stDraw();
}));
$('#st-buy').addEventListener('click', () => {
  const s = SH[ST.i], tot = s.A * ST.x + s.B * ST.y, m = $('#st-msg');
  if (tot !== s.C) { tick(m, false, tot > s.C ? 'Te pasaste del presupuesto.' : 'Todavía sobra dinero. Ajusta hasta gastar justo ' + s.C + '.'); return; }
  if (ST.found.some(([x, y]) => x === ST.x && y === ST.y)) { tick(m, false, 'Esa compra ya está guardada.'); return; }
  ST.found.push([ST.x, ST.y]); stDraw();
  if (ST.found.length === stSols(s)) { tick(m, true, '¡Las encontraste todas! Mira: caen sobre una misma recta.'); if (!ST.full.has(ST.i)) { ST.full.add(ST.i); addXP(10); } }
  else tick(m, true, `Compra guardada (${ST.x}, ${ST.y}). Hay ${stSols(s) - ST.found.length} más.`);
});
$('#st-ext').addEventListener('click', () => { const s = SH[ST.i]; ST.ext = true; stDraw(); tick($('#st-msg'), true, `Extremos: solo espadas (${s.C / s.A}, 0) y solo pociones (0, ${s.C / s.B}). Con esos dos puntos ya se dibuja la recta.`); });
stShops(); stDraw();

const SF = [
  { html: 'y = 2x − 3', m: Q(2), b: Q(-3) },
  { html: 'y = −3x + 6', m: Q(-3), b: Q(6) },
  { html: 'y = ' + fr('2x', 3) + ' + 1', m: Q(2, 3), b: Q(1) },
  { html: 'y = −' + fr('3x', 4) + ' + 2', m: Q(-3, 4), b: Q(2) },
  { html: 'y − 4 = −2(x − 1)', m: Q(-2), b: Q(6) }
];
const SFS = { i: 0, done: regSet('sf'), hint: 0 };
const SF_HINTS = ['Pasa el término con x al lado izquierdo y deja la y sola a la derecha, o al revés. Si pasas la x, cambia su signo.', 'Si hay fracciones, multiplica toda la ecuación por el denominador para que desaparezcan.', 'A debe ser positivo. Si te quedó negativo, multiplica toda la ecuación por −1.', 'Revisa que A, B y C no tengan un factor común. Si lo tienen, divide.'];
function sfLevels() {
  $('#sf-levels').innerHTML = SF.map((l, i) => `<button class="lv${SFS.done.has(i) ? ' done' : ''}" data-i="${i}" aria-current="${i === SFS.i}" aria-label="Ejercicio ${i + 1}">${i + 1}</button>`).join('');
  $$('#sf-levels .lv').forEach(b => b.addEventListener('click', () => { SFS.i = +b.dataset.i; SFS.hint = 0; ['#sf-a', '#sf-b', '#sf-c'].forEach(s => { $(s).value = ''; }); $('#sf-msg').textContent = ''; sfLevels(); $('#sf-given').innerHTML = SF[SFS.i].html; }));
}
$('#sf-check').addEventListener('click', () => {
  const l = SF[SFS.i], A = parseQ($('#sf-a').value), B = parseQ($('#sf-b').value), C = parseQ($('#sf-c').value), m = $('#sf-msg');
  if (!A || !B || !C) { tick(m, false, 'Escribe A, B y C como números.'); return; }
  if (![A, B, C].every(q => q.isInt())) { tick(m, false, 'En la forma estándar A, B y C son enteros, sin fracciones.'); return; }
  const on0 = B.mul(l.b).eq(C), on1 = A.add(B.mul(l.m.add(l.b))).eq(C);
  if (!(on0 && on1)) { tick(m, false, 'Esa ecuación no es la misma recta. Comprueba: el punto (0, ' + qs(l.b) + ') debe cumplirla.'); return; }
  if (A.n < 0 || (A.n === 0 && B.n < 0)) { tick(m, false, 'La recta es correcta, pero A debe ser positivo. Multiplica todo por −1.'); return; }
  if (gcd(gcd(Math.abs(A.n), Math.abs(B.n)), Math.abs(C.n)) !== 1) { tick(m, false, 'Casi. Se puede simplificar: divide A, B y C entre su factor común.'); return; }
  tick(m, true, `¡Forma estándar: ${A.n === 1 ? '' : A.n}x ${B.n < 0 ? MIN : '+'} ${Math.abs(B.n) === 1 ? '' : Math.abs(B.n)}y = ${qs(C)}! Interceptos: (${qs(C.div(A))}, 0) y (0, ${qs(C.div(B))}).`);
  if (!SFS.done.has(SFS.i)) { SFS.done.add(SFS.i); addXP(8); sfLevels(); }
});
$('#sf-hint').addEventListener('click', () => { tick($('#sf-msg'), true, SF_HINTS[Math.min(SFS.hint++, SF_HINTS.length - 1)]); $('#sf-msg').className = 'msg info'; });
sfLevels(); $('#sf-given').innerHTML = SF[0].html;
