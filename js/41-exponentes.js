'use strict';
/* ---------- exponentes y notación científica ---------- */
const commas = s => String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
function exDraw() {
  const b = Math.max(1, Math.min(12, parseInt($('#ex-b').value, 10) || 1)), e = +$('#ex-e').value;
  $('#ex-chips').innerHTML = Array.from({ length: e }, (_, i) => `<b>${b}</b>`).join('<span class="sub">×</span>');
  $('#ex-out').innerHTML = `${b}<sup>${e}</sup> = ${commas(b ** e)}`;
  const d = +$('#ex-d').value, n = 2 ** d;
  $('#ex-day').textContent = `Día ${d}: 2^${d} = ${commas(n)} ${n === 1 ? 'persona' : 'personas'} conocen el rumor.`;
  $('#ex-dots').innerHTML = '<i></i>'.repeat(Math.min(n, 512));
}
['#ex-b', '#ex-e', '#ex-d'].forEach(s => $(s).addEventListener('input', exDraw));
exDraw();
const EXQ = [
  { t: 'Escribe como potencia: 6 × 6 × 6 × 6 × 6', two: true, b: 6, e: 5 },
  { t: 'Escribe como potencia: 12 × 12 × 12', two: true, b: 12, e: 3 },
  { t: 'Escribe como potencia: 9 × 9 × 9 × 9 × 9 × 9 × 9', two: true, b: 9, e: 7 },
  { t: 'Escribe como potencia: 1 × 1 × 1 × 1 × 1', two: true, b: 1, e: 5 },
  { t: 'Calcula 2⁴', v: 16 }, { t: 'Calcula 5³', v: 125 }, { t: 'Calcula 6³', v: 216 }, { t: 'Calcula 42¹', v: 42 }
];
$('#ex-quiz').innerHTML = EXQ.map((q, i) => `<div class="q" data-i="${i}"><p>${q.t}</p><div class="row" style="margin-top:6px">
  ${q.two ? '<label class="fld">Base<input type="text" class="i1" inputmode="numeric"></label><label class="fld">Exponente<input type="text" class="i2" inputmode="numeric"></label>' : '<label class="fld">Valor<input type="text" class="i1" inputmode="numeric"></label>'}
  <button class="btn">Comprobar</button></div><p class="fb" aria-live="polite"></p></div>`).join('');
$$('#ex-quiz .q').forEach(box => {
  const q = EXQ[+box.dataset.i]; let got = false;
  $('button', box).addEventListener('click', () => {
    const fb = $('.fb', box), v1 = +($('.i1', box).value.trim() || NaN), v2 = q.two ? +($('.i2', box).value.trim() || NaN) : 0;
    const ok = q.two ? (v1 === q.b && v2 === q.e) : v1 === q.v;
    fb.textContent = ok ? '¡Correcto!' : (q.two ? 'La base es el número que se repite y el exponente cuenta cuántas veces aparece.' : 'Multiplica la base tantas veces como diga el exponente. No es base × exponente.');
    fb.style.color = ok ? 'var(--lime)' : 'var(--pink)'; if (ok && !got) { got = true; addXP(3); }
  });
});
const NCL = [
  { task: 'Escribe 4,700,000 en notación científica. Mueve el punto hasta que quede un solo dígito antes del punto.', digits: '47', p0: 7, target: 1, mode: 'sci' },
  { task: 'Escribe 382,000,000 en notación científica.', digits: '382', p0: 9, target: 1, mode: 'sci' },
  { task: 'Escribe 93,000 en notación científica.', digits: '93', p0: 5, target: 1, mode: 'sci' },
  { task: 'Escribe 5.46 × 10⁵ en forma estándar: mueve el punto 5 lugares a la derecha.', digits: '546', p0: 1, target: 6, mode: 'std' },
  { task: 'Escribe 2.712 × 10⁷ en forma estándar.', digits: '2712', p0: 1, target: 8, mode: 'std' },
  { task: 'Calcula 18 × 10³ moviendo el punto 3 lugares a la derecha.', digits: '18', p0: 2, target: 5, mode: 'std' }
];
const NC = { i: 0, p: 7, done: regSet('nc') };
function pointString(d, p) {
  let ip, fp;
  if (p <= 0) { ip = '0'; fp = '0'.repeat(-p) + d; } else if (p >= d.length) { ip = d + '0'.repeat(p - d.length); fp = ''; } else { ip = d.slice(0, p); fp = d.slice(p); }
  return commas(ip) + (fp ? '.' + fp : '');
}
function ncDraw() {
  const l = NCL[NC.i], k = l.mode === 'sci' ? l.p0 - NC.p : l.target - NC.p;
  $('#nc-task').textContent = l.task;
  $('#nc-num').innerHTML = `${pointString(l.digits, NC.p)} × 10<sup>${k}</sup>`;
  const moved = NC.p - l.p0;
  $('#nc-exp').textContent = moved === 0 ? 'El punto está en su lugar original.' : `Moviste el punto ${Math.abs(moved)} ${Math.abs(moved) === 1 ? 'lugar' : 'lugares'} a la ${moved < 0 ? 'izquierda' : 'derecha'}.`;
  $('#nc-levels').innerHTML = NCL.map((x, i) => `<button class="lv${NC.done.has(i) ? ' done' : ''}" data-i="${i}" aria-current="${i === NC.i}" aria-label="Reto ${i + 1}">${i + 1}</button>`).join('');
  $$('#nc-levels .lv').forEach(b => b.addEventListener('click', () => { NC.i = +b.dataset.i; NC.p = NCL[NC.i].p0; $('#nc-msg').textContent = ''; ncDraw(); }));
}
$('#nc-left').addEventListener('click', () => { NC.p = Math.max(0, NC.p - 1); ncDraw(); });
$('#nc-right').addEventListener('click', () => { NC.p = Math.min(14, NC.p + 1); ncDraw(); });
$('#nc-check').addEventListener('click', () => {
  const l = NCL[NC.i], m = $('#nc-msg');
  if (NC.p !== l.target) { tick(m, false, l.mode === 'sci' ? 'Todavía no: el número antes del punto debe ser mayor o igual que 1 y menor que 10, o sea un solo dígito.' : 'Cuenta los saltos: el exponente te dice cuántos lugares mover el punto a la derecha.'); return; }
  tick(m, true, l.mode === 'sci' ? `¡Notación científica! ${pointString(l.digits, 1)} × 10^${l.p0 - 1}.` : `¡Listo! Forma estándar: ${pointString(l.digits, l.target)}.`);
  if (!NC.done.has(NC.i)) { NC.done.add(NC.i); addXP(6); ncDraw(); }
});
NC.p = NCL[0].p0; ncDraw();
