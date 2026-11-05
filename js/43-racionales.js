'use strict';
/* ---------- racionales y proporciones ---------- */
const RF = [[-16, 24], [17, 51], [25, 65], [18, 42]];
const RFS = { i: 0, a: -16, d: 24, done: regSet('rf') };
function rfDraw() {
  const { a, d } = RFS;
  $('#rf-frac').innerHTML = (a < 0 ? MIN : '') + fr(Math.abs(a), d);
  $('#rf-cells').innerHTML = Array.from({ length: d }, (_, i) => `<i class="${i < Math.abs(a) ? 's' + (a < 0 ? ' neg' : '') : ''}"></i>`).join('');
  $('#rf-levels').innerHTML = RF.map((x, i) => `<button class="lv${RFS.done.has(i) ? ' done' : ''}" data-i="${i}" aria-current="${i === RFS.i}" aria-label="Fracción ${i + 1}">${i + 1}</button>`).join('');
  $$('#rf-levels .lv').forEach(b => b.addEventListener('click', () => rfInit(+b.dataset.i)));
}
function rfInit(i) { RFS.i = i; RFS.a = RF[i][0]; RFS.d = RF[i][1]; $('#rf-g').value = ''; $('#rf-msg').textContent = ''; rfDraw(); }
$('#rf-go').addEventListener('click', () => {
  const g = parseInt($('#rf-g').value, 10), m = $('#rf-msg');
  if (!g || g < 2) { tick(m, false, 'Escribe un número mayor que 1 para agrupar.'); return; }
  if (RFS.a % g || RFS.d % g) { tick(m, false, `${g} no divide a los dos números. Para agrupar de ${g} en ${g} debe dividir exacto al numerador y al denominador.`); return; }
  const was = `${qs(Q(RFS.a))}/${RFS.d}`; RFS.a /= g; RFS.d /= g; rfDraw();
  if (gcd(Math.abs(RFS.a), RFS.d) === 1) { tick(m, true, `${was} = ${qs(Q(RFS.a))}/${RFS.d}. Ya no se puede agrupar más: es irreducible.`); if (!RFS.done.has(RFS.i)) { RFS.done.add(RFS.i); addXP(5); rfDraw(); } }
  else tick(m, true, `${was} = ${qs(Q(RFS.a))}/${RFS.d}. Todavía se puede agrupar más.`);
});
$('#rf-g').addEventListener('keydown', e => { if (e.key === 'Enter') $('#rf-go').click(); });
$('#rf-reset').addEventListener('click', () => rfInit(RFS.i));
rfInit(0);

function fracQuiz(sel, items, mk) {
  $(sel).innerHTML = items.map((q, i) => `<div class="q" data-i="${i}"><p>${q.t}</p><div class="row" style="margin-top:6px"><label class="fld">Respuesta<input type="text" inputmode="text" autocomplete="off" placeholder="${q.ph || 'a/b'}"></label><button class="btn">Comprobar</button></div><p class="fb" aria-live="polite"></p></div>`).join('');
  $$(sel + ' .q').forEach(box => {
    const q = items[+box.dataset.i]; let got = false;
    const go = () => {
      const s = $('input', box).value.trim(), fb = $('.fb', box), r = q.check(s);
      fb.textContent = r.msg; fb.style.color = r.ok ? 'var(--lime)' : 'var(--pink)'; if (r.ok && !got) { got = true; addXP(3); }
    };
    $('button', box).addEventListener('click', go); $('input', box).addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  });
}
const redFrac = (s, want) => {
  const v = parseQ(s); if (!v) return { ok: false, msg: 'Escribe una fracción como 3/4.' };
  if (!v.eq(want)) return { ok: false, msg: 'Ese valor no coincide. Revisa el cálculo.' };
  const m = s.replace(/[−–]/g, '-').match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (m && gcd(Math.abs(+m[1]), Math.abs(+m[2])) !== 1) return { ok: false, msg: 'Bien, pero falta simplificar: agrupa hasta que no se pueda más.' };
  return { ok: true, msg: '¡Correcto!' };
};
const decOk = (s, want, tol) => { const v = parseFloat(s.replace(',', '.')); return isNaN(v) ? { ok: false, msg: 'Escribe un número decimal.' } : Math.abs(v - want) <= tol ? { ok: true, msg: '¡Correcto!' } : { ok: false, msg: 'No coincide. Divide el numerador entre el denominador.' }; };
fracQuiz('#rd-quiz', [
  { t: 'Escribe 0.75 como fracción reducida', check: s => redFrac(s, Q(3, 4)) },
  { t: 'Escribe 3.35 como fracción reducida', check: s => redFrac(s, Q(67, 20)) },
  { t: 'Escribe <b>5/4</b> como decimal', ph: '0.00', check: s => decOk(s, 1.25, 0.001) },
  { t: 'Escribe <b>25/65</b> como decimal con 2 cifras', ph: '0.00', check: s => decOk(s, 25 / 65, 0.006) }
]);
fracQuiz('#rs-quiz', [
  { t: '−3/10 − 9/10 = ?', check: s => redFrac(s, Q(-6, 5)) },
  { t: '9/25 + (−4/25) = ?', check: s => redFrac(s, Q(1, 5)) },
  { t: '9/17 + 16/17 = ?', check: s => redFrac(s, Q(25, 17)) }
]);
const RCQ = [
  { la: '−1/6', lb: '−1/5', a: -1 / 6, b: -1 / 5, lo: -1, hi: 0, ans: '>', why: '−1/6 está más cerca de 0 que −1/5, así que está a la derecha: es mayor.' },
  { la: '4.2', lb: '4 1/5', a: 4.2, b: 4.2, lo: 4, hi: 5, ans: '=', why: '4 1/5 = 4 + 0.2 = 4.2. Caen en el mismo punto.' }
];
function rcLine(q) {
  const x = v => 30 + (v - q.lo) / (q.hi - q.lo) * 420; let g = `<line x1="14" y1="48" x2="466" y2="48" stroke="var(--muted)" stroke-width="3"/>`;
  for (let i = 0; i <= 10; i++) { const v = q.lo + i / 10 * (q.hi - q.lo); g += `<line x1="${x(v)}" y1="40" x2="${x(v)}" y2="56" stroke="var(--muted)" stroke-width="2"/>`; if (i % 5 === 0) g += `<text x="${x(v)}" y="78" text-anchor="middle" style="fill:var(--muted);font:600 13px var(--f-mono)">${v < 0 ? MIN + Math.abs(v) : v}</text>`; }
  g += `<circle cx="${x(q.a)}" cy="48" r="9" style="fill:var(--cyan)"/><text x="${x(q.a)}" y="26" text-anchor="middle" style="fill:var(--cyan);font:700 13px var(--f-mono)">${q.la}</text>`;
  g += `<circle cx="${x(q.b)}" cy="${q.a === q.b ? 48 : 48}" r="${q.a === q.b ? 5 : 9}" style="fill:var(--amber)"/><text x="${x(q.b)}" y="${q.a === q.b ? 12 : 26}" text-anchor="middle" style="fill:var(--amber);font:700 13px var(--f-mono)">${q.lb}</text>`;
  return `<svg viewBox="0 0 480 90" style="width:100%;height:auto;display:block" role="img" aria-label="${q.la} y ${q.lb} en la recta">${g}</svg>`;
}
$('#rc-quiz').innerHTML = RCQ.map((q, i) => `<div class="q" data-i="${i}">${rcLine(q)}<p style="margin-top:6px">Compara <b style="color:var(--cyan)">${q.la}</b> con <b style="color:var(--amber)">${q.lb}</b></p><div class="row" style="margin-top:6px"><button class="btn" data-a="<">&lt;</button><button class="btn" data-a="=">=</button><button class="btn" data-a=">">&gt;</button></div><p class="fb" aria-live="polite"></p></div>`).join('');
$$('#rc-quiz .q').forEach(box => {
  const q = RCQ[+box.dataset.i]; let got = false;
  $$('button', box).forEach(b => b.addEventListener('click', () => { const ok = b.dataset.a === q.ans, fb = $('.fb', box); fb.textContent = (ok ? '¡Correcto! ' : 'Casi. ') + q.why; fb.style.color = ok ? 'var(--lime)' : 'var(--pink)'; if (ok && !got) { got = true; addXP(3); } }));
});
const xy = fr; // alias para legibilidad
makeMulti($('#rp-root'), 'rp', [
  { v: 'x', tag: 'Proporción · Examen 9.º', orig: xy('x', 4) + ' = ' + xy(9, 12), pre: [{ label: 'Multiplicar en cruz', html: '12x = 4 · 9', why: 'En una proporción se multiplica en cruz: numerador de un lado por denominador del otro.' }, { label: 'Calcular el producto', html: '12x = 36', why: 'Resuelve primero la multiplicación 4 · 9.' }], a1: 12, b1: 0, a2: 0, b2: 36 },
  { v: 'y', tag: 'Proporción · Examen 9.º', orig: xy(5, 8) + ' = ' + xy('y', 24), pre: [{ label: 'Multiplicar en cruz', html: '5 · 24 = 8y', why: 'Multiplica en cruz: 5 por 24 y 8 por y.' }, { label: 'Calcular el producto', html: '120 = 8y', why: 'Resuelve primero la multiplicación 5 · 24.' }], a1: 0, b1: 120, a2: 8, b2: 0 },
  { v: 'x', tag: 'Proporción con coeficiente · Examen 9.º', orig: xy('6x', 10) + ' = ' + xy(36, 15), pre: [{ label: 'Multiplicar en cruz', html: '6x · 15 = 10 · 36', why: 'Multiplica en cruz antes de despejar.' }, { label: 'Calcular los productos', html: '90x = 360', why: 'Resuelve 6 · 15 y 10 · 36.' }], a1: 90, b1: 0, a2: 0, b2: 360 },
  { v: 'c', tag: 'Proporción con suma · Examen 9.º', orig: xy('c + 2', 45) + ' = ' + xy(8, 5), pre: [{ label: 'Multiplicar en cruz', html: '5(c + 2) = 45 · 8', why: 'Multiplica en cruz: 5 por (c + 2) y 45 por 8.' }, { label: 'Distribuir y multiplicar', html: '5c + 10 = 360', why: 'Distribuye el 5 en el paréntesis y calcula 45 · 8.' }], a1: 5, b1: 10, a2: 0, b2: 360 }
]);
