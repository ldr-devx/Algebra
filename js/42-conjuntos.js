'use strict';
/* ---------- conjuntos ---------- */
const isPrime = n => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every(d => n % d);
const CJP = [
  { A: 'múltiplos de 2', B: 'múltiplos de 3', fa: n => n % 2 === 0, fb: n => n % 3 === 0 },
  { A: 'números primos', B: 'números impares', fa: isPrime, fb: n => n % 2 === 1 },
  { A: 'menores que 7', B: 'números pares', fa: n => n < 7, fb: n => n % 2 === 0 }
];
const CJ = { i: 0, sel: null, placed: new Map(), op: 'A∩B', done: regSet('cj') };
const CJU = Array.from({ length: 12 }, (_, i) => i + 1);
const cjReg = (p, n) => p.fa(n) && p.fb(n) ? 'AB' : p.fa(n) ? 'A' : p.fb(n) ? 'B' : 'N';
const CJ_OPS = { 'A∪B': (a, b) => a || b, 'A∩B': (a, b) => a && b, 'A−B': (a, b) => a && !b, 'B−A': (a, b) => b && !a, 'A′': (a) => !a };
function cjDraw() {
  const p = CJP[CJ.i];
  $('#cj-pairs').innerHTML = CJP.map((x, i) => `<button class="lv" data-i="${i}" aria-current="${i === CJ.i}" style="min-width:60px">Par ${i + 1}</button>`).join('');
  $$('#cj-pairs .lv').forEach(b => b.addEventListener('click', () => { CJ.i = +b.dataset.i; CJ.sel = null; CJ.placed = new Map(); $('#cj-msg').textContent = ''; cjDraw(); }));
  $('#cj-rules').innerHTML = `<b style="color:var(--cyan)">A</b> = ${p.A} · <b style="color:var(--amber)">B</b> = ${p.B} · Universo U = {1, 2, …, 12}`;
  $('#cj-tray').innerHTML = CJU.filter(n => !CJ.placed.has(n)).map(n => `<button class="lv" data-n="${n}" aria-current="${CJ.sel === n}">${n}</button>`).join('') || '<span class="sub">Todas colocadas.</span>';
  $$('#cj-tray .lv').forEach(b => b.addEventListener('click', () => { CJ.sel = +b.dataset.n; cjDraw(); }));
  // diagrama
  const cA = [200, 130, 108], cB = [360, 130, 108], regs = { A: [135, 120], AB: [280, 120], B: [425, 120] };
  const holes = (...c) => c.map(x => `<circle cx="${x[0]}" cy="${x[1]}" r="${x[2]}" fill="black"/>`).join('');
  let g = `<defs><clipPath id="cjA"><circle cx="${cA[0]}" cy="${cA[1]}" r="${cA[2]}"/></clipPath>
    <mask id="mAB"><rect width="560" height="270" fill="white"/>${holes(cB)}</mask><mask id="mBA"><rect width="560" height="270" fill="white"/>${holes(cA)}</mask></defs>
    <rect class="u" x="8" y="8" width="544" height="254"/><circle class="c" cx="${cA[0]}" cy="${cA[1]}" r="${cA[2]}"/><circle class="c" cx="${cB[0]}" cy="${cB[1]}" r="${cB[2]}"/>`;
  const o = CJ.op;
  if (o === 'A∪B') g += `<circle class="hl" cx="${cA[0]}" cy="${cA[1]}" r="${cA[2]}"/><circle class="hl" cx="${cB[0]}" cy="${cB[1]}" r="${cB[2]}"/>`;
  if (o === 'A∩B') g += `<circle class="hl" clip-path="url(#cjA)" cx="${cB[0]}" cy="${cB[1]}" r="${cB[2]}"/>`;
  if (o === 'A−B') g += `<circle class="hl" mask="url(#mAB)" cx="${cA[0]}" cy="${cA[1]}" r="${cA[2]}"/>`;
  if (o === 'B−A') g += `<circle class="hl" mask="url(#mBA)" cx="${cB[0]}" cy="${cB[1]}" r="${cB[2]}"/>`;
  if (o === 'A′') g += `<mask id="mC"><rect width="560" height="270" fill="white"/>${holes(cA)}</mask><rect class="hl" mask="url(#mC)" x="8" y="8" width="544" height="254"/>`;
  g += `<text class="tt" x="${cA[0] - 60}" y="34" style="fill:var(--cyan)">A</text><text class="tt" x="${cB[0] + 60}" y="34" style="fill:var(--amber)">B</text>`;
  const by = { A: [], AB: [], B: [], N: [] }; CJ.placed.forEach((r, n) => by[r].push(n));
  ['A', 'AB', 'B'].forEach(r => by[r].sort((a, b) => a - b).forEach((n, i) => { const x = regs[r][0] + ((i % 3) - 1) * 36, y = regs[r][1] + (Math.floor(i / 3) - 1) * 32; g += `<rect class="chipbg" x="${x - 15}" y="${y - 13}" width="30" height="26"/><text x="${x}" y="${y + 6}">${n}</text>`; }));
  by.N.sort((a, b) => a - b).forEach((n, i) => { const x = 34 + i * 36, y = 244; g += `<rect class="chipbg" x="${x - 15}" y="${y - 13}" width="30" height="26"/><text x="${x}" y="${y + 6}">${n}</text>`; });
  $('#cj-svg').innerHTML = g;
  // operaciones
  $('#cj-ops').innerHTML = Object.keys(CJ_OPS).map(k => `<button class="lv" data-o="${k}" aria-current="${k === CJ.op}" style="min-width:64px">${k}</button>`).join('');
  $$('#cj-ops .lv').forEach(b => b.addEventListener('click', () => { CJ.op = b.dataset.o; cjDraw(); }));
  const els = CJU.filter(n => CJ_OPS[CJ.op](p.fa(n), p.fb(n)));
  $('#cj-out').textContent = `${CJ.op} = {${els.join(', ')}}   cantidad: ${els.length}`;
}
$$('[data-reg]').forEach(b => b.addEventListener('click', () => {
  const p = CJP[CJ.i], n = CJ.sel, m = $('#cj-msg');
  if (n == null) { tick(m, false, 'Primero toca una tarjeta de la bandeja.'); return; }
  const r = cjReg(p, n);
  if (b.dataset.reg === r) {
    CJ.placed.set(n, r); CJ.sel = null; cjDraw();
    if (CJ.placed.size === 12) { tick(m, true, '¡Todas colocadas! Ahora prueba las operaciones de abajo.'); if (!CJ.done.has(CJ.i)) { CJ.done.add(CJ.i); addXP(10); } }
    else tick(m, true, `${n} va ahí.`);
  } else tick(m, false, `${n} ${p.fa(n) ? 'sí' : 'no'} es de A (${p.A}) y ${p.fb(n) ? 'sí' : 'no'} es de B (${p.B}). Revisa las dos reglas.`);
}));
cjDraw();
