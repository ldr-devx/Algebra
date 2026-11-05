'use strict';
/* ---------- misión 3: recta numérica ---------- */
const IQ_LEVELS = [
  { v: 'h', a: 1, b: 4, rel: '<', c: 10, tag: 'Suma · Examen 8.º · 5-1' },
  { v: 'y', a: 1, b: -9, rel: '≥', c: 2, tag: 'Resta · Examen 8.º · 5-1' },
  { v: 'x', a: 3, b: 0, rel: '<', c: 12, tag: 'Dividir por positivo · 5-2' },
  { v: 'x', a: -2, b: 0, rel: '<', c: 6, tag: 'Dividir por negativo · 5-2' },
  { v: 'x', a: 3, b: -5, rel: '≥', c: 10, tag: 'Dos pasos · 5-3' },
  { v: 'x', a: -3, b: 2, rel: '≥', c: 11, tag: 'Dos pasos con espejo · 5-3' },
  { v: 'n', a: [-1, 4], b: 0, rel: '≤', c: 3, tag: 'Fracción negativa · 5-2' }
];
const NL = { lo: 0, hi: 12, tests: [], token: null, zone: null, ans: { bound: null, closed: false, dir: 'right' }, mode: 'probe', expected: null, solvedOK: false, lvl: null, W: 584, PAD: 28, SP: 44 };
let iqSolver;
function relHolds(rel, c) { const k = c.cmp(Q(0)); return rel === '<' ? k < 0 : rel === '>' ? k > 0 : rel === '≤' ? k <= 0 : rel === '≥' ? k >= 0 : k === 0; }
function evalText(l, t) {
  const val = l.a.mul(Q(t)).add(l.b), diff = val.sub(l.c);
  const ok = relHolds(l.rel, diff);
  const left = (l.a.eq(ONE) ? `(${qs(Q(t))})` : `${qs(l.a)}·(${qs(Q(t))})`) + (l.b.isZero() ? '' : ` ${l.b.n < 0 ? MIN : '+'} ${qs(absQ(l.b))}`);
  return { ok, text: `${l.v} = ${qs(Q(t))}: ${left} = ${qs(val)}. ¿${qs(val)} ${l.rel} ${qs(l.c)}? ${ok ? 'Sí ✓' : 'No ✗'}` };
}
function drawNL() {
  const svg = $('#nl-svg'), { lo, hi, W, PAD, SP } = NL;
  const X = v => PAD + (v - lo) * SP, Y = 56;
  let g = `<line class="base" x1="6" y1="${Y}" x2="${W - 6}" y2="${Y}"/>
    <path d="M6 ${Y} l10 -7 v14 z M${W - 6} ${Y} l-10 -7 v14 z" style="fill:var(--muted)"/>`;
  if (NL.zone) {
    const z = NL.zone, x1 = z.dir === 'right' ? X(z.bound) : 8, x2 = z.dir === 'right' ? W - 8 : X(z.bound);
    g += `<rect class="zone" x="${x1}" y="30" width="${x2 - x1}" height="52"/>`;
  }
  for (let v = lo; v <= hi; v++) g += `<line class="tick" x1="${X(v)}" y1="${Y - 9}" x2="${X(v)}" y2="${Y + 9}"/><text class="${v === 0 ? 'z' : ''}" x="${X(v)}" y="${Y + 34}">${v < 0 ? MIN + Math.abs(v) : v}</text>`;
  const ray = (a, cls) => {
    const x1 = a.dir === 'right' ? X(a.bound) : 8, x2 = a.dir === 'right' ? W - 12 : X(a.bound);
    const arrow = a.dir === 'right' ? `<path d="M${W - 8} ${Y} l-14 -9 v18 z" style="fill:${cls === 'ar' ? 'var(--cyan)' : 'var(--lime)'}"/>` : `<path d="M8 ${Y} l14 -9 v18 z" style="fill:${cls === 'ar' ? 'var(--cyan)' : 'var(--lime)'}"/>`;
    const col = cls === 'ar' ? 'var(--cyan)' : 'var(--lime)';
    return `<line class="${cls}" x1="${Math.min(x1, x2)}" y1="${Y}" x2="${Math.max(x1, x2)}" y2="${Y}"/>${arrow}` +
      (a.closed ? `<circle class="closed" cx="${X(a.bound)}" cy="${Y}" r="10" style="fill:${col}"/>` : `<circle class="open" cx="${X(a.bound)}" cy="${Y}" r="9" style="stroke:${col}"/>`);
  };
  if (NL.zone) g += ray(NL.zone, 'zr');
  if (NL.ans.bound != null) g += ray(NL.ans, 'ar');
  NL.tests.forEach(t => { g += `<circle class="${t.ok ? 'ok' : 'no'}" cx="${X(t.v)}" cy="16" r="8"/>`; });
  if (NL.token != null) g += `<circle class="tok" cx="${X(NL.token)}" cy="16" r="13"/>`;
  svg.innerHTML = g;
}
function nlSetLevel(l) {
  const sol = l.c.sub(l.b).div(l.a), s = sol.n / sol.d;
  NL.lo = s - 6; NL.hi = s + 6; NL.tests = []; NL.token = null; NL.zone = null; NL.expected = null; NL.solvedOK = false;
  NL.ans = { bound: null, closed: false, dir: 'right' }; NL.lvl = l; NL.mode = 'probe';
  $('input[name="nl-mode"][value="probe"]').checked = true;
  $('input[name="nl-c"][value="open"]').checked = true; $('input[name="nl-d"][value="right"]').checked = true;
  $('#nl-read').textContent = 'Toca la recta para probar un valor. Los verdes cumplen la desigualdad, los rosas no.';
  $('#nl-msg').textContent = ''; $('#nl-msg').className = 'msg';
  $('#nl-check').disabled = true; $$('#nl-draw input').forEach(i => { i.disabled = true; });
  $('#nl-orig').innerHTML = `Desigualdad original: <b>${expr(l.a, l.b, l.v)} ${l.rel} ${qh(l.c)}</b>`;
  drawNL();
}
function nlSolved(s, l) {
  NL.expected = { bound: s.c.n / s.c.d, closed: s.rel === '≤' || s.rel === '≥', dir: (s.rel === '<' || s.rel === '≤') ? 'left' : 'right', rel: s.rel };
  $('#nl-check').disabled = false; $$('#nl-draw input').forEach(i => { i.disabled = false; });
  $('#nl-msg').textContent = 'Resuelta. Cambia a "Dibujar respuesta", toca la frontera y elige círculo y dirección.'; $('#nl-msg').className = 'msg info';
}
function nlPointer(e) {
  const svg = $('#nl-svg'), r = svg.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * NL.W;
  return Math.max(NL.lo, Math.min(NL.hi, Math.round((x - NL.PAD) / NL.SP) + NL.lo));
}
function nlAct(v) {
  if (NL.mode === 'probe') {
    NL.token = v; const r = evalText(NL.lvl, v);
    if (!NL.tests.find(t => t.v === v)) NL.tests.push({ v, ok: r.ok });
    $('#nl-read').textContent = r.text;
  } else {
    if (!NL.expected) { $('#nl-msg').textContent = 'Primero resuelve la desigualdad con las operaciones.'; $('#nl-msg').className = 'msg info'; return; }
    NL.ans.bound = v;
  }
  drawNL();
}
function nlCheck() {
  const e = NL.expected, a = NL.ans, m = $('#nl-msg'); if (!e) return;
  const bad = [];
  if (a.bound == null) { m.textContent = 'Dibuja primero: en "Dibujar respuesta" toca la frontera en la recta.'; m.className = 'msg info'; return; }
  if (a.bound !== e.bound) bad.push('La frontera no está en el valor al que llegaste con el álgebra.');
  if (a.closed !== e.closed) bad.push(`El signo final es ${e.rel}: ${e.closed ? 'incluye el valor, así que el círculo va lleno' : 'no incluye el valor, así que el círculo va vacío'}.`);
  if (a.dir !== e.dir) bad.push('La dirección está al revés. Prueba un valor a cada lado de la frontera.');
  if (bad.length) { m.textContent = bad.join(' '); m.className = 'msg bad'; return; }
  m.textContent = '¡Zona segura marcada! Coincide con los valores que probaste.'; m.className = 'msg ok';
  NL.zone = { bound: e.bound, closed: e.closed, dir: e.dir };
  if (!NL.solvedOK) { NL.solvedOK = true; addXP(8); }
  drawNL();
}

$('#iq-root').innerHTML = '<div id="iq-solver"></div>';
const nlWrap = document.createElement('div');
nlWrap.innerHTML = `
  <h3 style="margin-top:22px;font-size:14px;color:var(--amber);text-transform:uppercase;letter-spacing:.08em">La recta · explora y dibuja</h3>
  <p class="sub" id="nl-orig" style="margin-top:8px"></p>
  <svg class="nl" id="nl-svg" viewBox="0 0 584 118" role="img" aria-label="Recta numérica interactiva"></svg>
  <p class="readout" id="nl-read" aria-live="polite"></p>
  <div class="row" style="margin-top:6px">
    <fieldset class="seg txt" style="border:0;padding:0"><legend class="vh">Modo</legend>
      <label><input type="radio" name="nl-mode" value="probe" checked><span>Probar valores</span></label>
      <label><input type="radio" name="nl-mode" value="draw"><span>Dibujar respuesta</span></label>
    </fieldset>
  </div>
  <div class="row" id="nl-draw" style="margin-top:10px">
    <fieldset class="seg txt" style="border:0;padding:0"><legend class="vh">Círculo</legend>
      <label><input type="radio" name="nl-c" value="open" checked disabled><span>Círculo vacío</span></label>
      <label><input type="radio" name="nl-c" value="closed" disabled><span>Círculo lleno</span></label>
    </fieldset>
    <fieldset class="seg txt" style="border:0;padding:0"><legend class="vh">Dirección</legend>
      <label><input type="radio" name="nl-d" value="left" disabled><span>Hacia la izquierda</span></label>
      <label><input type="radio" name="nl-d" value="right" checked disabled><span>Hacia la derecha</span></label>
    </fieldset>
    <button class="btn primary" type="button" id="nl-check" disabled>Comprobar dibujo</button>
  </div>
  <p class="msg" id="nl-msg" aria-live="polite" style="margin-top:10px"></p>`;
$('#iq-root').appendChild(nlWrap);
$$('input[name="nl-mode"]').forEach(i => i.addEventListener('change', () => { NL.mode = i.value; }));
$$('input[name="nl-c"]').forEach(i => i.addEventListener('change', () => { NL.ans.closed = i.value === 'closed'; drawNL(); }));
$$('input[name="nl-d"]').forEach(i => i.addEventListener('change', () => { NL.ans.dir = i.value; drawNL(); }));
$('#nl-check').addEventListener('click', nlCheck);
let nlDown = false;
$('#nl-svg').addEventListener('pointerdown', e => { nlDown = true; nlAct(nlPointer(e)); });
$('#nl-svg').addEventListener('pointermove', e => { if (nlDown && NL.mode === 'probe') nlAct(nlPointer(e)); });
addEventListener('pointerup', () => { nlDown = false; });

iqSolver = makeSolver($('#iq-solver'), 'iq', IQ_LEVELS, {
  kind: 'iq',
  renderView(slot) { slot.innerHTML = ''; },
  onLevel(l) { nlSetLevel(l); },
  onSolved(s, l) { nlSolved(s, l); }
});

/* espejo */
function drawMirror() {
  const clamp = (v, d) => { v = parseInt(v, 10); return isNaN(v) ? d : Math.max(-5, Math.min(5, v)); };
  const a = clamp($('#mr-a').value, -3), b = clamp($('#mr-b').value, 2), m = +$('#mr-m').value;
  const lo = -15, hi = 15, W = 640, P = 20, SPm = (W - 2 * P) / (hi - lo), X = v => P + (v - lo) * SPm;
  const rows = [{ y: 56, a, b }, { y: 146, a: a * m, b: b * m }];
  let g = '';
  rows.forEach((r, ri) => {
    g += `<line class="ln" x1="${P - 6}" y1="${r.y}" x2="${W - P + 6}" y2="${r.y}"/>`;
    for (let v = lo; v <= hi; v++) g += `<line class="tk" x1="${X(v)}" y1="${r.y - (v % 5 === 0 ? 8 : 4)}" x2="${X(v)}" y2="${r.y + (v % 5 === 0 ? 8 : 4)}"/>` + (v % 5 === 0 ? `<text x="${X(v)}" y="${r.y + 26}">${v < 0 ? MIN + Math.abs(v) : v}</text>` : '');
    g += `<text x="${P}" y="${r.y - 26}" style="text-anchor:start;font-weight:700">${ri ? 'Después' : 'Antes'}</text>`;
  });
  g += `<line class="lk" x1="${X(a)}" y1="${rows[0].y + 12}" x2="${X(a * m)}" y2="${rows[1].y - 12}"/><line class="lk" x1="${X(b)}" y1="${rows[0].y + 12}" x2="${X(b * m)}" y2="${rows[1].y - 12}"/>`;
  rows.forEach(r => {
    g += `<circle class="ca" cx="${X(r.a)}" cy="${r.y}" r="11"/><text class="mk" x="${X(r.a)}" y="${r.y + 4}">a</text><circle class="cb" cx="${X(r.b)}" cy="${r.y}" r="11" ${r.a === r.b ? 'transform="translate(0,-24)"' : ''}/><text class="mk" x="${X(r.b)}" y="${r.y + 4 + (r.a === r.b ? -24 : 0)}">b</text>`;
  });
  $('#mr-svg').innerHTML = g;
  const cmp = (p, q) => p < q ? '<' : p > q ? '>' : '=', f = v => v < 0 ? MIN + Math.abs(v) : String(v);
  const before = cmp(a, b), after = cmp(a * m, b * m);
  const out = $('#mr-out');
  out.textContent = `Antes: ${f(a)} ${before} ${f(b)}.  Después de × ${f(m)}: ${f(a * m)} ${after} ${f(b * m)}.` +
    (a === b ? ' Son iguales, no hay orden que voltear.' : m < 0 ? '  El espejo cambió el orden: el signo se voltea.' : '  El orden se mantiene.');
  out.style.color = (a !== b && m < 0) ? 'var(--amber)' : 'var(--fg)';
}
['#mr-a', '#mr-b', '#mr-m'].forEach(s => $(s).addEventListener('input', drawMirror));
drawMirror();
