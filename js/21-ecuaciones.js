'use strict';
/* ---------- misión 2: balanza ---------- */
const EQ_LEVELS = [
  { v: 'x', a: 1, b: 7, c: 17, tag: 'Suma y resta · Examen 8.º' },
  { v: 'k', a: 1, b: -5, c: 11, tag: 'Suma y resta · Examen 8.º' },
  { v: 'x', a: 1, b: 13, c: 25, flip: true, tag: 'La incógnita a la derecha' },
  { v: 'x', a: 2, b: 0, c: 16, tag: 'Multiplicación' },
  { v: 'y', a: [1, 8], b: 0, c: 20, tag: 'División · Examen 8.º' },
  { v: 'y', a: -7, b: 0, c: 35, tag: 'Con negativos · Examen 8.º' },
  { v: 'x', a: 6, b: -5, c: 7, tag: 'Dos pasos · Examen 8.º' },
  { v: 'h', a: [1, 7], b: 2, c: 12, tag: 'Dos pasos · Examen 8.º' },
  { v: 'x', a: [5, 6], b: -8, c: 7, flip: true, tag: 'Dos pasos con fracción · Examen 9.º' }
];
function constGoods(q) {
  if (q.isZero()) return '<span class="nchip">0</span>';
  if (q.isInt() && Math.abs(q.n) <= 12) return `<span class="tiles${q.n < 0 ? ' neg' : ''}">${'<i class="tile"></i>'.repeat(Math.abs(q.n))}</span>`;
  return `<span class="nchip${q.n < 0 ? ' neg' : ''}">${qh(q)}</span>`;
}
function xGoods(a, v) {
  if (a.isInt() && Math.abs(a.n) <= 4) return Array.from({ length: Math.abs(a.n) }, () => `<span class="crate${a.n < 0 ? ' neg' : ''}">${v}</span>`).join('');
  return `<span class="crate">${termA(a, v)}</span>`;
}
let eqSolver;
let tiltNow = 0;
function setTilt(deg) {
  tiltNow = deg;
  const sc = $('#eq-root .scale'); if (!sc) return;
  const dist = sc.offsetWidth * 0.26, dy = Math.sin(deg * Math.PI / 180) * dist;
  $('.beam', sc).style.transform = `rotate(${deg}deg)`;
  $('.pan.l', sc).style.transform = `translateY(${-dy}px)`;
  $('.pan.r', sc).style.transform = `translateY(${dy}px)`;
}
eqSolver = makeSolver($('#eq-root'), 'eq', EQ_LEVELS, {
  kind: 'eq',
  renderView(slot, s, l) {
    if (!$('.scale', slot)) {
      slot.innerHTML = `<div class="scale" role="img" aria-label="Balanza en equilibrio">
        <div class="stand"></div><div class="sbase"></div><div class="beam"></div><div class="pivot"></div>
        <div class="pan l"><div class="string"></div><div class="tray"></div><div class="lab"></div></div>
        <div class="pan r"><div class="string"></div><div class="tray"></div><div class="lab"></div></div>
      </div>
      <div class="row" style="justify-content:center"><button class="btn" type="button" id="eq-cheat">Probar trampa: tocar solo el plato izquierdo</button></div>`;
      $('#eq-cheat').addEventListener('click', cheat);
    }
    const sc = $('.scale', slot);
    $('.pan.l .tray', sc).innerHTML = xGoods(s.a, l.v) + (s.b.isZero() ? '' : constGoods(s.b));
    $('.pan.r .tray', sc).innerHTML = constGoods(s.c);
    $('.pan.l .lab', sc).innerHTML = expr(s.a, s.b, l.v);
    $('.pan.r .lab', sc).innerHTML = qh(s.c);
    if (l.flip) { /* los platos no se intercambian: la ecuación se lee igual */ }
    setTilt(0);
  },
  async onStep() { for (const d of [5, -4, 2, 0]) { setTilt(d); await sleep(140); } }
});
async function cheat() {
  const { op, n } = eqSolver.readOp();
  if (eqSolver.busy()) return;
  if (op !== 'add' && op !== 'sub') { eqSolver.say('Para la trampa usa + o −. Ponlo en la operación y prueba.', 'info'); return; }
  const k = n && !n.isZero() ? Math.abs(Math.round(n.n / n.d)) : 5, sign = op === 'add' ? 1 : -1;
  setTilt(-sign * Math.min(18, 6 + k));
  eqSolver.say(`¡Trampa! ${op === 'add' ? 'Sumaste' : 'Restaste'} ${k} solo en el plato izquierdo y la balanza se inclinó. Ya no es la misma ecuación. Por eso se hace en los dos lados.`, 'bad');
  await sleep(2400); setTilt(0);
}
