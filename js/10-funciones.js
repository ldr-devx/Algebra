'use strict';
/* ======================================================
   MISIÓN 1 · FUNCIONES
   ====================================================== */
const runOps = (ops, x) => {
  let v = x; const steps = [];
  for (const o of ops) {
    let r;
    if (o.t === 'add') r = v.add(o.q);
    else if (o.t === 'mul') r = v.mul(o.q);
    else if (o.t === 'pow') r = v.mul(v);
    else r = o.q.sub(v);
    steps.push(r); v = r;
  }
  return { out: v, steps };
};
const opHTML = o => o.t === 'add' ? (o.q.n < 0 ? MIN : '+') + ' ' + qh(absQ(o.q))
  : o.t === 'mul' ? '× ' + (o.q.n < 0 ? '(' + qh(o.q) + ')' : qh(o.q))
  : o.t === 'pow' ? '□²' : qh(o.q) + ' − □';
const invHTML = o => o.t === 'add' ? (o.q.n < 0 ? '+' : MIN) + ' ' + qh(absQ(o.q))
  : o.t === 'mul' ? (o.q.isInt() ? '÷ ' + qh(o.q) : '× ' + qh(ONE.div(o.q)))
  : qh(o.q) + ' − □';
const invert = (o, y) => o.t === 'add' ? y.sub(o.q) : o.t === 'mul' ? y.div(o.q) : o.q.sub(y);

const RULES = [
  { id: 'a', v: 'x', html: 'y = x − 3', ops: [{ t: 'add', q: Q(-3) }], dom: [1, 2, 3, 4, 5], linear: true, inv: true },
  { id: 'b', v: 'm', html: 'y = 2m + 3', ops: [{ t: 'mul', q: Q(2) }, { t: 'add', q: Q(3) }], dom: [3, 5, 8], linear: true, inv: true },
  { id: 'c', v: 'x', html: 'y = ' + fr('2x', 3) + ' + 1', ops: [{ t: 'mul', q: Q(2, 3) }, { t: 'add', q: Q(1) }], dom: [3, 6, 9, 12, 15], linear: true, inv: true },
  { id: 'd', v: 'p', html: 'y = p² − 4', ops: [{ t: 'pow' }, { t: 'add', q: Q(-4) }], dom: [-2, -1, 0, 1, 2, 3, 4, 5], linear: false, inv: false },
  { id: 'e', v: 'r', html: 'y = 25 − r', ops: [{ t: 'rsub', q: Q(25) }], dom: [4, 10, 15], linear: true, inv: true }
];
const FN = { rule: RULES[0], sel: null, crafted: new Map(), busy: false, predicted: new Set(), full: regSet('fn-full'), last: null };

function fnMsg(t, cls = '') { const m = $('#fn-msg'); m.textContent = t; m.className = 'msg ' + cls; }

function machineHTML(rule, mode) {
  const ops = mode === 'rev' ? [...rule.ops].reverse() : rule.ops;
  const lab = o => mode === 'rev' ? invHTML(o) : opHTML(o);
  return `<div class="io" data-in><small>${mode === 'rev' ? 'sale' : 'entra'}</small><b>?</b></div>
    ${ops.map(o => `<span class="arrow"></span><div class="station"><div class="op">${lab(o)}</div><div class="val"></div></div>`).join('')}
    <span class="arrow"></span><div class="io out" data-out><small>${mode === 'rev' ? 'entró' : 'sale'}</small><b>?</b></div>`;
}

function renderRules() {
  const box = $('#fn-rules');
  box.innerHTML = RULES.map(r => `<button class="rule" data-id="${r.id}" aria-pressed="${r === FN.rule}">${r.html}</button>`).join('');
  $$('.rule', box).forEach(b => b.addEventListener('click', () => { FN.rule = RULES.find(r => r.id === b.dataset.id); resetFn(); }));
}
function renderHotbar() {
  const hb = $('#fn-hotbar');
  hb.innerHTML = FN.rule.dom.map(x => `<button class="slot${FN.sel === x ? ' sel' : ''}${FN.crafted.has(x) ? ' done' : ''}" data-x="${x}" aria-label="${FN.rule.v} igual a ${x}">${x < 0 ? MIN + Math.abs(x) : x}</button>`).join('')
    + `<button class="slot decoy" data-x="shoe" aria-label="un zapato">🥾</button>`;
  $$('.slot', hb).forEach(b => b.addEventListener('click', () => {
    if (b.dataset.x === 'shoe') {
      b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      fnMsg('La mesa no acepta zapatos. El dominio es el conjunto de entradas permitidas: aquí solo números de la lista.', 'info'); return;
    }
    if (FN.busy) return;
    FN.sel = +b.dataset.x; renderHotbar(); $('#fn-machine [data-in] b').textContent = FN.sel < 0 ? MIN + Math.abs(FN.sel) : FN.sel;
    fnMsg('Ingrediente listo. Predice la salida o craftea directo.', '');
  }));
}
function renderTable(nowX) {
  const r = FN.rule;
  $('#fn-table').innerHTML = `<tr><th>${r.v}</th><th>y</th></tr>` + r.dom.map(x => {
    const y = FN.crafted.get(x);
    return `<tr class="${x === nowX ? 'now' : ''}"><td>${x < 0 ? MIN + Math.abs(x) : x}</td><td class="${y ? '' : 'q'}">${y ? qh(y) : '?'}</td></tr>`;
  }).join('');
}
function renderPlot(nowX) {
  const r = FN.rule;
  const pts = r.dom.map(x => ({ x, y: runOps(r.ops, Q(x)).out }));
  const xs = r.dom, ys = pts.map(p => p.y.n / p.y.d);
  const x0 = Math.min(0, ...xs) - 1, x1 = Math.max(0, ...xs) + 1, y0 = Math.min(0, ...ys) - 1, y1 = Math.max(0, ...ys) + 1;
  const W = 360, H = 250, P = 28;
  const sx = v => P + (v - x0) / (x1 - x0) * (W - 2 * P), sy = v => H - P - (v - y0) / (y1 - y0) * (H - 2 * P);
  const stepF = rg => rg > 40 ? 10 : rg > 20 ? 5 : rg > 10 ? 2 : 1;
  const stx = stepF(x1 - x0), sty = stepF(y1 - y0);
  let g = '';
  for (let v = Math.ceil(x0 / stx) * stx; v <= x1; v += stx) { g += `<line class="g" x1="${sx(v)}" y1="${P / 2}" x2="${sx(v)}" y2="${H - P / 2}"/>`; if (v) g += `<text x="${sx(v)}" y="${sy(0) + 14}" text-anchor="middle">${v < 0 ? MIN + Math.abs(v) : v}</text>`; }
  for (let v = Math.ceil(y0 / sty) * sty; v <= y1; v += sty) { g += `<line class="g" x1="${P / 2}" y1="${sy(v)}" x2="${W - P / 2}" y2="${sy(v)}"/>`; if (v) g += `<text x="${sx(0) - 5}" y="${sy(v) + 4}" text-anchor="end">${v < 0 ? MIN + Math.abs(v) : v}</text>`; }
  g += `<line class="ax" x1="${P / 2}" y1="${sy(0)}" x2="${W - P / 2}" y2="${sy(0)}"/><line class="ax" x1="${sx(0)}" y1="${P / 2}" x2="${sx(0)}" y2="${H - P / 2}"/>`;
  const done = pts.filter(p => FN.crafted.has(p.x));
  if (done.length === pts.length) g += `<polyline class="ln" points="${pts.map(p => sx(p.x) + ',' + sy(p.y.n / p.y.d)).join(' ')}"/>`;
  done.forEach(p => { g += `<circle class="pt" cx="${sx(p.x)}" cy="${sy(p.y.n / p.y.d)}" r="6"/>`; });
  const last = done.find(p => p.x === nowX);
  if (last) g += `<text class="lb" x="${Math.min(sx(last.x) + 9, W - 60)}" y="${sy(last.y.n / last.y.d) - 9}">(${qs(Q(last.x))}, ${qs(last.y)})</text>`;
  $('#fn-plot').innerHTML = g;
}
function resetFn() {
  FN.sel = null; FN.crafted = new Map(); FN.busy = false;
  $('#fn-machine').innerHTML = machineHTML(FN.rule, 'fwd');
  $('#fn-guess').value = '';
  renderRules(); renderHotbar(); renderTable(); renderPlot();
  $('#fn-insight').textContent = '';
  fnMsg('Toca un ingrediente del inventario.', '');
}
async function craft() {
  if (FN.busy) return;
  const r = FN.rule;
  if (FN.sel == null) { fnMsg('Primero elige un ingrediente del inventario.', 'info'); return; }
  FN.busy = true; $('#fn-go').disabled = true;
  const x = FN.sel, { out, steps } = runOps(r.ops, Q(x));
  const st = $$('#fn-machine .station'), outB = $('#fn-machine [data-out] b'), outBox = $('#fn-machine [data-out]');
  st.forEach(s => { s.querySelector('.val').textContent = ''; s.classList.remove('on'); });
  outB.textContent = '?'; outBox.classList.remove('pop');
  for (let i = 0; i < st.length; i++) {
    st[i].classList.add('on'); await sleep(420);
    st[i].querySelector('.val').innerHTML = '= ' + qh(steps[i]); await sleep(220);
    st[i].classList.remove('on');
  }
  outB.innerHTML = qh(out); void outBox.offsetWidth; outBox.classList.add('pop');
  FN.crafted.set(x, out);
  const g = parseQ($('#fn-guess').value);
  const key = r.id + ':' + x;
  if ($('#fn-guess').value.trim() && g) {
    if (g.eq(out)) {
      if (!FN.predicted.has(key)) { FN.predicted.add(key); addXP(5); }
      fnMsg(`¡Predicho! ${r.v} = ${x} da ${qs(out)}.`, 'ok');
    } else fnMsg(`La máquina dio ${qs(out)}, tú pusiste ${qs(g)}. Mira lo que sale de cada estación y busca dónde cambió.`, 'bad');
  } else fnMsg(`${r.v} = ${x} da ${qs(out)}.`, 'info');
  $('#fn-guess').value = '';
  renderHotbar(); renderTable(x); renderPlot(x);
  if (FN.crafted.size === r.dom.length) {
    $('#fn-insight').textContent = r.linear
      ? 'Tabla completa. Mira la gráfica: los puntos quedan en línea recta. Por eso se llama función lineal.'
      : 'Tabla completa. Mira la gráfica: el 2 y el −2 dan la misma salida y los puntos no quedan en línea recta. No es lineal.';
    if (!FN.full.has(r.id)) { FN.full.add(r.id); addXP(15); }
  }
  FN.busy = false; $('#fn-go').disabled = false;
}
$('#fn-go').addEventListener('click', craft);
$('#fn-guess').addEventListener('keydown', e => { if (e.key === 'Enter') craft(); });
resetFn();

/* cápsula sorpresa */
const cap = { a: [], b: [] };
function renderCap() {
  ['a', 'b'].forEach(k => {
    $('#cap-' + k + '-log').innerHTML = cap[k].map(v => `<b>${v}</b>`).join('');
    const s = new Set(cap[k]), n = cap[k].length, el = $('#cap-' + k + '-v');
    if (n < 3) el.textContent = n ? 'Mete el 3 otra vez.' : '';
    else if (k === 'a') el.textContent = 'Siempre sale lo mismo con la misma entrada. Es función.';
    else el.textContent = s.size > 1 ? 'El mismo 3 dio salidas distintas. NO es función.' : 'Salió igual de casualidad. Sigue metiendo el 3: nada garantiza que se repita.';
  });
}
$('#cap-a').addEventListener('click', () => { if (cap.a.length < 8) cap.a.push(7); renderCap(); });
$('#cap-b').addEventListener('click', () => { if (cap.b.length < 8) cap.b.push(1 + Math.floor(Math.random() * 12)); renderCap(); if (cap.b.length === 3) addXP(3); });

/* quiz ¿es función? */
const QZ = [
  { pairs: [[1, 3], [2, 5], [3, 7]], fn: true, why: 'Cada entrada aparece una sola vez. Cumple.' },
  { pairs: [[1, 2], [1, 5], [2, 4]], fn: false, why: 'La entrada 1 da dos salidas: 2 y 5. Rompe la regla de oro.' },
  { pairs: [[1, 4], [2, 4], [3, 4]], fn: true, why: 'Todas las entradas dan 4, y eso está permitido. Lo prohibido es una entrada con dos salidas.' }
];
$('#fn-quiz').innerHTML = QZ.map((q, i) => `<div class="q" data-i="${i}"><div class="rel-set">${q.pairs.map(p => `<span>${p[0]} → ${p[1]}</span>`).join('')}</div>
  <div class="row"><button class="btn" data-a="1">Es función</button><button class="btn" data-a="0">No es función</button></div><p class="fb" aria-live="polite"></p></div>`).join('');
$$('#fn-quiz .q').forEach(box => {
  const q = QZ[+box.dataset.i]; let got = false;
  $$('button', box).forEach(b => b.addEventListener('click', () => {
    const ok = (b.dataset.a === '1') === q.fn, fb = $('.fb', box);
    fb.textContent = (ok ? '¡Correcto! ' : 'Casi. ') + q.why; fb.style.color = ok ? 'var(--lime)' : 'var(--pink)';
    if (ok && !got) { got = true; addXP(4); }
  }));
});

/* reversa */
const REV = { rule: null, x: null };
function newRev() {
  const pool = RULES.filter(r => r.inv);
  const r = pool[Math.floor(Math.random() * pool.length)];
  const x = r.dom[Math.floor(Math.random() * r.dom.length)];
  REV.rule = r; REV.x = x;
  const out = runOps(r.ops, Q(x)).out;
  $('#rev-machine').innerHTML = machineHTML(r, 'rev');
  $('#rev-machine [data-in] b').innerHTML = qh(out);
  $('#rev-in').value = '';
  const m = $('#rev-msg'); m.className = 'msg info'; m.innerHTML = 'Receta: ' + r.html;
}
function checkRev() {
  const g = parseQ($('#rev-in').value), m = $('#rev-msg');
  if (!g) { m.textContent = 'Escribe un número.'; m.className = 'msg bad'; return; }
  const r = REV.rule;
  if (g.eq(Q(REV.x))) {
    const sts = $$('#rev-machine .station'); let y = runOps(r.ops, Q(REV.x)).out;
    [...r.ops].reverse().forEach((o, i) => { y = invert(o, y); sts[i].querySelector('.val').innerHTML = '= ' + qh(y); });
    $('#rev-machine [data-out] b').innerHTML = qh(Q(REV.x));
    m.textContent = '¡Eso! Deshiciste las estaciones en orden contrario. Eso mismo es resolver una ecuación.'; m.className = 'msg ok'; addXP(8);
  } else { m.textContent = 'Todavía no. Prueba tu número en la máquina normal y compara.'; m.className = 'msg bad'; }
}
$('#rev-check').addEventListener('click', checkRev);
$('#rev-in').addEventListener('keydown', e => { if (e.key === 'Enter') checkRev(); });
$('#rev-new').addEventListener('click', newRev);
newRev();

/* ======================================================
   LA MÁQUINA EXPENDEDORA
   x = dinero que metes, y = producto que sale.
   El programa de la máquina (la regla) decide y a partir de x: eso es la función.
   ====================================================== */
const VM_PROGRAMS = [
  { id: 'galletas', label: '1 moneda → 1 galleta', emoji: '🍪', code: 'y = x', dom: [1, 2, 3, 4, 5, 6], f: x => x },
  { id: 'choco', label: 'cada moneda da 2 chocolates', emoji: '🍫', code: 'y = 2x', dom: [1, 2, 3, 4, 5], f: x => 2 * x },
  { id: 'refresco', label: '2 monedas → 1 refresco (solo monedas pares)', emoji: '🥤', code: 'y = x ÷ 2', dom: [2, 4, 6, 8], f: x => x / 2 },
  { id: 'regalo', label: '3 galletas de regalo + 1 por moneda', emoji: '🍪', code: 'y = x + 3', dom: [1, 2, 3, 4, 5, 6], f: x => x + 3 }
];
const VM = { program: VM_PROGRAMS[0], x: null, busy: false, broken: false, seen: new Map(), full: regSet('vm-full'), brokenSeen: false };

function vmMsg(t, cls = '') { const m = $('#vm-msg'); m.textContent = t; m.className = 'msg ' + cls; }
function renderVmSelect() {
  $('#vm-program').innerHTML = VM_PROGRAMS.map(p => `<option value="${p.id}">${p.emoji} ${p.label}</option>`).join('');
  $('#vm-program').value = VM.program.id;
}
function renderVmCoins() {
  const hb = $('#vm-coins');
  hb.innerHTML = VM.program.dom.map(x => `<button class="slot coin${VM.x === x ? ' sel' : ''}" data-x="${x}" aria-label="meter ${x} monedas">🪙${x}</button>`).join('');
  $$('.slot', hb).forEach(b => b.addEventListener('click', () => {
    if (VM.busy) return;
    VM.x = +b.dataset.x; renderVmCoins(); vmMsg('Dinero listo. Pulsa Insertar.', '');
  }));
}
function renderVmRule() {
  $('#vm-rule').textContent = VM.program.label;
  $('#vm-code').textContent = VM.broken ? 'programa dañado: y ya no sigue una regla fija' : 'programa: ' + VM.program.code;
}
function renderVmTable() {
  const dom = VM.program.dom;
  $('#vm-table').innerHTML = `<tr><th>x · monedas</th><th>y · ${VM.program.emoji}</th></tr>` + dom.map(x => {
    const ys = VM.seen.get(x);
    const txt = !ys || !ys.size ? '?' : [...ys].join(' / ');
    return `<tr class="${ys && ys.size > 1 ? 'now' : ''}"><td>${x}</td><td class="${ys && ys.size ? '' : 'q'}">${txt}</td></tr>`;
  }).join('');
}
function resetVm() {
  VM.x = null; VM.busy = false; VM.seen = new Map();
  $('#vm-tray').innerHTML = ''; $('#vm-display').textContent = '?';
  renderVmRule(); renderVmCoins(); renderVmTable();
  vmMsg('Elige cuánto dinero metes y pulsa Insertar.', '');
}
async function vmInsert() {
  if (VM.busy) return;
  if (VM.x == null) { vmMsg('Primero elige cuánto dinero metes.', 'info'); return; }
  VM.busy = true; $('#vm-insert').disabled = true;
  const x = VM.x;
  const coin = document.createElement('span'); coin.className = 'vm-coin'; coin.textContent = '🪙';
  $('#vm-slot').appendChild(coin);
  await sleep(380); coin.remove();
  $('#vm-display').textContent = '…';
  $('#vm-box').classList.add('working'); await sleep(480); $('#vm-box').classList.remove('working');
  const y = VM.broken ? 1 + Math.floor(Math.random() * 4) : VM.program.f(x);
  $('#vm-display').textContent = y;
  for (let k = 0; k < y; k++) {
    const it = document.createElement('span'); it.className = 'vm-item'; it.textContent = VM.program.emoji;
    $('#vm-tray').appendChild(it); await sleep(140);
  }
  if (!VM.seen.has(x)) VM.seen.set(x, new Set());
  VM.seen.get(x).add(y);
  renderVmTable();
  if (VM.broken) {
    if (VM.seen.get(x).size > 1) {
      vmMsg(`Metiste ${x} monedas y esta vez salieron ${y}. ¡Antes, con el mismo dinero, salió otra cantidad distinta! Por eso esta máquina NO es función: una misma entrada no puede dar dos salidas.`, 'bad');
      if (!VM.brokenSeen) { VM.brokenSeen = true; addXP(6); }
    } else vmMsg(`Salieron ${y} ${VM.program.emoji}. Vuelve a meter ${x} monedas y mira si se repite la cantidad.`, 'info');
  } else {
    vmMsg(`Metiste ${x} monedas y salieron ${y} ${VM.program.emoji}. Mete ${x} otra vez: siempre va a dar lo mismo, porque es una función.`, 'ok');
    if (VM.program.dom.every(xx => VM.seen.has(xx)) && !VM.full.has(VM.program.id)) { VM.full.add(VM.program.id); addXP(10); }
  }
  VM.busy = false; $('#vm-insert').disabled = false;
}
$('#vm-program').addEventListener('change', e => { VM.program = VM_PROGRAMS.find(p => p.id === e.target.value); resetVm(); });
$('#vm-insert').addEventListener('click', vmInsert);
$('#vm-broken').addEventListener('change', e => {
  VM.broken = e.target.checked; VM.seen = new Map(); $('#vm-tray').innerHTML = ''; $('#vm-display').textContent = '?';
  renderVmRule(); renderVmTable();
  vmMsg(VM.broken ? 'Modo descompuesto: ahora la cantidad sale al azar. Mete la misma cantidad de dinero varias veces y compara.' : 'Modo normal: la máquina vuelve a seguir su programa.', 'info');
});
renderVmSelect(); resetVm();
