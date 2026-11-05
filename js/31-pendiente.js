'use strict';
/* ---------- pendiente e intercepto ---------- */
const PT = { lv: [{ m: Q(2), b: Q(1) }, { m: Q(-1), b: Q(3) }, { m: Q(1, 2), b: Q(-2) }, { m: Q(0), b: Q(4) }, { m: Q(-3), b: Q(0) }, { m: Q(-1, 2), b: Q(5) }], i: 0, done: regSet('pt'), ok: false };
const fl = q => q.n / q.d;
function ptDraw() {
  const m = Q(+$('#pt-m').value, 2), b = Q(+$('#pt-b').value), t = PT.lv[PT.i], free = $('#pt-free').checked;
  const x1 = Math.max(-5, Math.min(5, parseInt($('#pt-x1').value, 10) || 0)), y1 = m.mul(Q(x1)).add(b);
  const lines = []; if (!free) lines.push({ m: fl(t.m), b: fl(t.b), cls: 'gh' });
  lines.push({ m: fl(m), b: fl(b), cls: 'l2' });
  const mf = fl(m), bf = fl(b);
  $('#pt-svg').innerHTML = planeSVG({
    lines, pts: [{ x: 0, y: bf, cls: 'pt2', label: 'inicio' }, { x: x1, y: fl(y1), cls: 'pt' }],
    extra: (sx, sy) => `<polyline class="tri" points="${sx(0)},${sy(bf)} ${sx(2)},${sy(bf)} ${sx(2)},${sy(bf + 2 * mf)}"/><text x="${sx(1)}" y="${sy(bf) + (mf >= 0 ? 15 : -7)}" text-anchor="middle">avanzas 2</text><text x="${sx(2) + 5}" y="${sy(bf + mf) + 4}">sube ${qs(Q(2).mul(m))}</text>`
  });
  $('#pt-eq').innerHTML = lineEq(m, b);
  $('#pt-info').textContent = `Aparece en y = ${qs(b)}. Con pendiente ${qs(m)}, por cada 2 pasos a la derecha ${m.n > 0 ? 'sube' : m.n < 0 ? 'baja' : 'no cambia:'} ${qs(absQ(Q(2).mul(m)))}.`;
  $('#pt-ps').innerHTML = `Punto (${x1}, ${qs(y1)}). Punto-pendiente: y ${y1.n < 0 ? '+' : MIN} ${qs(absQ(y1))} = ${m.isInt() ? qs(m) : '(' + qs(m) + ')'}(x ${x1 < 0 ? '+' : MIN} ${Math.abs(x1)})`;
}
function ptLevels() {
  $('#pt-levels').innerHTML = PT.lv.map((l, i) => `<button class="lv${PT.done.has(i) ? ' done' : ''}" data-i="${i}" aria-current="${i === PT.i}" aria-label="Reto ${i + 1}">${i + 1}</button>`).join('');
  $$('#pt-levels .lv').forEach(b => b.addEventListener('click', () => { PT.i = +b.dataset.i; $('#pt-msg').textContent = ''; ptLevels(); ptDraw(); }));
}
['#pt-m', '#pt-b', '#pt-x1', '#pt-free'].forEach(s => $(s).addEventListener('input', ptDraw));
$('#pt-check').addEventListener('click', () => {
  const m = Q(+$('#pt-m').value, 2), b = Q(+$('#pt-b').value), t = PT.lv[PT.i];
  if ($('#pt-free').checked) { tick($('#pt-msg'), false, 'Quita el modo libre para comprobar con la punteada.'); return; }
  if (m.eq(t.m) && b.eq(t.b)) {
    tick($('#pt-msg'), true, 'Encajó. La recta es ' + lineText(t.m, t.b) + '.');
    if (!PT.done.has(PT.i)) { PT.done.add(PT.i); addXP(8); ptLevels(); }
  } else if (b.eq(t.b)) tick($('#pt-msg'), false, 'El punto de aparición coincide. Falta ajustar qué tan empinada es.');
  else if (m.eq(t.m)) tick($('#pt-msg'), false, 'La pendiente coincide. Falta subir o bajar la recta: mira dónde cruza el eje y.');
  else tick($('#pt-msg'), false, 'Primero ubica el punto de aparición (b) y luego ajusta la pendiente.');
});
ptLevels(); ptDraw();
