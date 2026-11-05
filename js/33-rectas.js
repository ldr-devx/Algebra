'use strict';
/* ---------- rectas paralelas y perpendiculares 4-5 ---------- */
const PP = [
  { t: 'par', m1: Q(2), b1: Q(1), pt: [0, -3] }, { t: 'par', m1: Q(-1), b1: Q(4), pt: [2, 1] },
  { t: 'perp', m1: Q(2), b1: Q(1), pt: [0, 3] }, { t: 'perp', m1: Q(1, 3), b1: Q(2), pt: [1, 2] }, { t: 'perp', m1: Q(-2, 3), b1: Q(1), pt: [2, 1] }
];
const PPS = { i: 0, done: regSet('pp') };
function ppDraw() {
  const l = PP[PPS.i], m2 = Q(+$('#pp-m').value, 2), b2 = Q(+$('#pp-b').value), prod = l.m1.mul(m2);
  const [x0, y0] = l.pt, perp = prod.eq(Q(-1));
  $('#pp-svg').innerHTML = planeSVG({
    lines: [{ m: fl(l.m1), b: fl(l.b1), cls: 'l1' }, { m: fl(m2), b: fl(b2), cls: 'l2' }], pts: [{ x: x0, y: y0, cls: 'pt2', label: `(${x0}, ${y0})` }],
    extra: (sx, sy) => {
      if (!perp) return '';
      const ix = (fl(b2) - fl(l.b1)) / (fl(l.m1) - fl(m2)), iy = fl(l.m1) * ix + fl(l.b1), n1 = Math.hypot(1, fl(l.m1)), n2 = Math.hypot(1, fl(m2)), s = 1;
      const u1 = [1 / n1, fl(l.m1) / n1], u2 = [1 / n2, fl(m2) / n2];
      const p = [[ix + s * u1[0], iy + s * u1[1]], [ix + s * (u1[0] + u2[0]), iy + s * (u1[1] + u2[1])], [ix + s * u2[0], iy + s * u2[1]]];
      return `<polyline class="ra" points="${p.map(q => sx(q[0]) + ',' + sy(q[1])).join(' ')}"/>`;
    }
  });
  $('#pp-eq').innerHTML = `<span style="color:var(--cyan)">${lineEq(l.m1, l.b1)}</span><br>${lineEq(m2, b2)}`;
  $('#pp-rel').textContent = `m₁ = ${qs(l.m1)}   m₂ = ${qs(m2)}   m₁·m₂ = ${qs(prod)}\n` + (l.m1.eq(m2) ? (l.b1.eq(b2) ? 'Es la misma recta.' : 'Paralelas: misma pendiente, distinto intercepto.') : perp ? 'Perpendiculares: m₁·m₂ = −1.' : 'Se cruzan, pero no en ángulo recto.');
  $('#pp-rel').style.whiteSpace = 'pre-line';
}
function ppLevels() {
  $('#pp-levels').innerHTML = PP.map((l, i) => `<button class="lv${PPS.done.has(i) ? ' done' : ''}" data-i="${i}" aria-current="${i === PPS.i}" aria-label="Reto ${i + 1}">${i + 1}</button>`).join('');
  $$('#pp-levels .lv').forEach(b => b.addEventListener('click', () => { PPS.i = +b.dataset.i; ppTask(); ppLevels(); ppDraw(); $('#pp-msg').textContent = ''; }));
}
function ppTask() { const l = PP[PPS.i]; $('#pp-task').innerHTML = `Dibuja la recta <b>${l.t === 'par' ? 'paralela' : 'perpendicular'}</b> a <span style="color:var(--cyan)">${lineEq(l.m1, l.b1)}</span> que pase por (${l.pt[0]}, ${l.pt[1]}).`; }
['#pp-m', '#pp-b'].forEach(s => $(s).addEventListener('input', ppDraw));
$('#pp-check').addEventListener('click', () => {
  const l = PP[PPS.i], m2 = Q(+$('#pp-m').value, 2), b2 = Q(+$('#pp-b').value), m = $('#pp-msg');
  const through = m2.mul(Q(l.pt[0])).add(b2).eq(Q(l.pt[1]));
  const rel = l.t === 'par' ? (m2.eq(l.m1) && !b2.eq(l.b1)) : l.m1.mul(m2).eq(Q(-1));
  if (rel && through) { tick(m, true, `Correcto: ${lineText(m2, b2)}.`); if (!PPS.done.has(PPS.i)) { PPS.done.add(PPS.i); addXP(8); ppLevels(); } }
  else if (!rel) tick(m, false, l.t === 'par' ? 'Las paralelas tienen la misma pendiente que la recta azul.' : 'Para perpendicular: la pendiente es el recíproco con el signo contrario.');
  else tick(m, false, 'La relación está bien, pero no pasa por el punto rosa. Ajusta el intercepto.');
});
const PQ = [[Q(3), Q(3), 'par', 'Misma pendiente: paralelas.'], [Q(2), Q(-1, 2), 'perp', '2 · (−1/2) = −1: perpendiculares.'], [Q(1, 2), Q(2), 'none', 'Son recíprocas pero falta el signo contrario: 1/2 · 2 = 1, no −1.']];
$('#pp-quiz').innerHTML = PQ.map((q, i) => `<div class="q" data-i="${i}"><p>Pendientes <b>${qs(q[0])}</b> y <b>${qs(q[1])}</b></p><div class="row" style="margin-top:8px"><button class="btn" data-a="par">Paralelas</button><button class="btn" data-a="perp">Perpendiculares</button><button class="btn" data-a="none">Ninguna</button></div><p class="fb" aria-live="polite"></p></div>`).join('');
$$('#pp-quiz .q').forEach(box => {
  const q = PQ[+box.dataset.i]; let got = false;
  $$('button', box).forEach(b => b.addEventListener('click', () => { const ok = b.dataset.a === q[2], fb = $('.fb', box); fb.textContent = (ok ? '¡Correcto! ' : 'Casi. ') + q[3]; fb.style.color = ok ? 'var(--lime)' : 'var(--pink)'; if (ok && !got) { got = true; addXP(3); } }));
});
ppTask(); ppLevels(); ppDraw();
