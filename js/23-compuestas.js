'use strict';
/* ======================================================
   MOTOR COMPARTIDO: DESIGUALDADES COMPUESTAS (Y / O)
   Lo reutiliza también la misión 14 (valor absoluto).
   ====================================================== */
const cpIsClosed = rel => rel === '≤' || rel === '≥';
function cpApply(s, op, n) {
  let { a, b, lo, hi, relLo, relHi, type } = s;
  if (op === 'add') { b = b.add(n); lo = lo.add(n); hi = hi.add(n); }
  else if (op === 'sub') { b = b.sub(n); lo = lo.sub(n); hi = hi.sub(n); }
  else {
    const f = op === 'mul' ? n : ONE.div(n);
    a = a.mul(f); b = b.mul(f);
    if (type === 'and') {
      if (f.n < 0) { const nl = hi.mul(f), nh = lo.mul(f); lo = nl; hi = nh; const t = relLo; relLo = relHi; relHi = t; }
      else { lo = lo.mul(f); hi = hi.mul(f); }
    } else {
      lo = lo.mul(f); hi = hi.mul(f);
      if (f.n < 0) { relLo = FLIP[relLo]; relHi = FLIP[relHi]; }
    }
  }
  return { ...s, a, b, lo, hi, relLo, relHi, steps: s.steps + 1 };
}
const cpSolved = s => s.a.eq(ONE) && s.b.isZero();
function cpText(s, v) {
  const L = expr(s.a, s.b, v), lo = `<span class="rel">${s.relLo}</span>`, hi = `<span class="rel">${s.relHi}</span>`;
  return s.type === 'and' ? `${qh(s.lo)} ${lo} ${L} ${hi} ${qh(s.hi)}` : `${L} ${lo} ${qh(s.lo)} &nbsp;&nbsp;<b>o</b>&nbsp;&nbsp; ${L} ${hi} ${qh(s.hi)}`;
}
function cpHolds(l, t) {
  const val = l.a.mul(Q(t)).add(l.b);
  return l.type === 'and' ? relHolds(l.relLo, l.lo.sub(val)) && relHolds(l.relHi, val.sub(l.hi))
    : relHolds(l.relLo, val.sub(l.lo)) || relHolds(l.relHi, val.sub(l.hi));
}
function cpDir(rel) { return (rel === '<' || rel === '≤') ? 'left' : 'right'; }

function cpDrawLine(svg, V) {
  const { lo, hi, W, PAD, SP } = V, X = v => PAD + (v - lo) * SP, Y = 56;
  let g = `<line class="base" x1="6" y1="${Y}" x2="${W - 6}" y2="${Y}"/>
    <path d="M6 ${Y} l10 -7 v14 z M${W - 6} ${Y} l-10 -7 v14 z" style="fill:var(--muted)"/>`;
  const zoneRect = (x1, x2, cls) => `<rect class="${cls}" x="${x1}" y="30" width="${Math.max(0, x2 - x1)}" height="52"/>`;
  const circle = (val, closed, colorVar) => closed
    ? `<circle class="closed" cx="${X(val)}" cy="${Y}" r="10" style="fill:var(--${colorVar})"/>`
    : `<circle class="open" cx="${X(val)}" cy="${Y}" r="9" style="stroke:var(--${colorVar})"/>`;
  if (V.zone) {
    const z = V.zone;
    if (z.type === 'and') { g += zoneRect(X(z.loVal), X(z.hiVal), 'zone'); g += circle(z.loVal, z.loClosed, 'lime'); g += circle(z.hiVal, z.hiClosed, 'lime'); }
    else {
      const rectFor = (val, rel, cls) => cpDir(rel) === 'left' ? zoneRect(6, X(val), cls) : zoneRect(X(val), W - 6, cls);
      g += rectFor(z.loVal, z.loRel, 'zone') + rectFor(z.hiVal, z.hiRel, 'zone2');
      g += circle(z.loVal, z.loClosed, 'lime'); g += circle(z.hiVal, z.hiClosed, 'pink');
    }
  }
  for (let v = lo; v <= hi; v++) g += `<line class="tick" x1="${X(v)}" y1="${Y - 9}" x2="${X(v)}" y2="${Y + 9}"/><text class="${v === 0 ? 'z' : ''}" x="${X(v)}" y="${Y + 34}">${v < 0 ? MIN + Math.abs(v) : v}</text>`;
  (V.tests || []).forEach(t => { g += `<circle class="${t.ok ? 'ok' : 'no'}" cx="${X(t.v)}" cy="16" r="8"/>`; });
  if (V.token != null) g += `<circle class="tok" cx="${X(V.token)}" cy="16" r="13"/>`;
  svg.innerHTML = g;
}

function makeCompound(root, key, rawLevels, cfg = {}) {
  const lv = rawLevels.map(l => ({ ...l, a: Q(l.a), b: Q(l.b), lo: Q(l.lo), hi: Q(l.hi) }));
  root.innerHTML = `
    <div class="levels" role="group" aria-label="Niveles"></div>
    <div class="eqcard"><div class="tag"></div><div class="eqn" aria-live="polite"></div></div>
    <svg class="nl" viewBox="0 0 584 118" role="img" aria-label="Recta numérica con dos fronteras"></svg>
    <p class="readout" aria-live="polite"></p>
    <div class="row" style="margin-top:6px">
      <fieldset class="seg txt" style="border:0;padding:0"><legend class="vh">Modo</legend>
        <label><input type="radio" name="cp-mode-${key}" value="probe" checked><span>Probar valores</span></label>
        <label><input type="radio" name="cp-mode-${key}" value="draw"><span>Dibujar respuesta</span></label>
      </fieldset>
    </div>
    <div class="row cp-draw" style="margin-top:10px" hidden>
      <fieldset class="seg txt" style="border:0;padding:0"><legend class="vh">Cerca a colocar</legend>
        <label><input type="radio" name="cp-cerca-${key}" value="lo" checked><span>Cerca izquierda</span></label>
        <label><input type="radio" name="cp-cerca-${key}" value="hi"><span>Cerca derecha</span></label>
      </fieldset>
      <fieldset class="seg txt" style="border:0;padding:0"><legend class="vh">Círculo izquierda</legend>
        <label><input type="radio" name="cp-clo-${key}" value="open" checked><span>Izq. vacío</span></label>
        <label><input type="radio" name="cp-clo-${key}" value="closed"><span>Izq. lleno</span></label>
      </fieldset>
      <fieldset class="seg txt" style="border:0;padding:0"><legend class="vh">Círculo derecha</legend>
        <label><input type="radio" name="cp-chi-${key}" value="open" checked><span>Der. vacío</span></label>
        <label><input type="radio" name="cp-chi-${key}" value="closed"><span>Der. lleno</span></label>
      </fieldset>
      <button class="btn primary" type="button" data-check>Comprobar dibujo</button>
    </div>
    <form class="ops" autocomplete="off">
      <div class="grp"><span>Operación</span>
        <fieldset class="seg" style="border:0"><legend class="vh">Operación</legend>
          ${['add', 'sub', 'mul', 'div'].map((o, i) => `<label><input type="radio" name="cp-op-${key}" value="${o}"${i === 1 ? ' checked' : ''}><span aria-label="${WORD[o]}">${SYM[o]}</span></label>`).join('')}
        </fieldset></div>
      <label class="fld">Número<input type="text" class="num" inputmode="text" placeholder="ej. 4 ó 2/3"></label>
      <button class="btn primary" type="submit">Aplicar a toda la desigualdad</button>
      <button class="btn" type="button" data-hint>Pista</button>
      <button class="btn ghost" type="button" data-reset>Reiniciar nivel</button>
    </form>
    <p class="msg" aria-live="polite" style="margin-top:10px"></p>
    <div class="win" hidden></div>
    <ol class="log" aria-label="Registro de pasos"></ol>`;
  const E = {
    levels: $('.levels', root), tag: $('.tag', root), eq: $('.eqn', root), svg: $('svg', root), read: $('.readout', root),
    drawRow: $('.cp-draw', root), form: $('.ops', root), num: $('.num', root), msg: $('.msg', root), win: $('.win', root), log: $('.log', root)
  };
  let idx = 0, st = null, busy = false, mode = 'probe'; const done = regSet(key);
  const V = { lo: 0, hi: 10, W: 584, PAD: 28, SP: 44, tests: [], token: null, zone: null };
  const ans = { cerca: 'lo', loVal: null, loClosed: false, hiVal: null, hiClosed: false };
  const lvl = () => lv[idx];
  const say = (t, c = '') => { E.msg.textContent = t; E.msg.className = 'msg ' + c; };
  function renderLevels() {
    E.levels.innerHTML = lv.map((l, i) => `<button class="lv${done.has(i) ? ' done' : ''}" data-i="${i}" aria-current="${i === idx}" aria-label="Nivel ${i + 1}">${i + 1}</button>`).join('');
    $$('.lv', E.levels).forEach(b => b.addEventListener('click', () => init(+b.dataset.i)));
  }
  function renderEq() { E.eq.innerHTML = cpText(st, lvl().v); draw(); }
  function draw() { cpDrawLine(E.svg, { ...V, tests: V.tests, token: V.token, zone: V.zone }); }
  function init(i) {
    idx = i; const l = lvl(), [dlo, dhi] = l.disp;
    st = { a: l.a, b: l.b, lo: l.lo, hi: l.hi, relLo: l.relLo, relHi: l.relHi, type: l.type, steps: 0, hints: 0 };
    V.lo = dlo; V.hi = dhi; V.tests = []; V.token = null; V.zone = null;
    ans.cerca = 'lo'; ans.loVal = null; ans.loClosed = false; ans.hiVal = null; ans.hiClosed = false;
    mode = 'probe'; $(`input[name="cp-mode-${key}"][value="probe"]`, root).checked = true; E.drawRow.hidden = true;
    $(`input[name="cp-cerca-${key}"][value="lo"]`, root).checked = true;
    $(`input[name="cp-clo-${key}"][value="open"]`, root).checked = true;
    $(`input[name="cp-chi-${key}"][value="open"]`, root).checked = true;
    E.log.innerHTML = ''; E.win.hidden = true; E.num.value = '';
    E.tag.textContent = `Nivel ${i + 1} de ${lv.length} · ${l.tag}`;
    E.read.textContent = 'Toca la recta para probar un valor. Verde cumple la desigualdad compuesta, rosa no.';
    say('Aplica operaciones a toda la desigualdad hasta dejar la letra sola.');
    renderLevels(); renderEq(); cfg.onLevel && cfg.onLevel(l);
  }
  function logLine(old, op, n, next, flipped) {
    const l = lvl(), nt = n.n < 0 ? `(${qh(n)})` : qh(n);
    const li = document.createElement('li');
    li.innerHTML = `<span class="ot">${WORD[op]} ${qh(n)} a toda la desigualdad</span><span class="res">${cpText(next, l.v)}</span>` + (flipped ? '<span class="mirror">Espejo: el signo se voltea</span>' : '');
    E.log.prepend(li); void old; void nt;
  }
  async function commit(op, n) {
    busy = true;
    const old = st, next = cpApply(old, op, n), flipped = next.relLo !== old.relLo || next.relHi !== old.relHi;
    logLine(old, op, n, next, flipped); st = next; renderEq();
    if (cpSolved(st)) win();
    else say(flipped ? 'El espejo se activó: multiplicar o dividir por un negativo voltea el signo.' : 'Bien. Sigue.', flipped ? 'info' : '');
    busy = false;
  }
  function win() {
    const first = !done.has(idx); done.add(idx); renderLevels();
    E.drawRow.hidden = false;
    E.read.textContent = 'Resuelta. Elige "Dibujar respuesta", toca la recta para poner cada cerca y marca los círculos.';
    if (first) addXP(8);
    E.win.hidden = false;
    E.win.innerHTML = `<b class="big">Álgebra lista</b><p>Quedó ${cpText(st, lvl().v)}. Ahora dibuja la respuesta en la recta.</p>` +
      (idx < lv.length - 1 ? '<button class="btn primary" type="button" data-next style="margin-top:10px">Siguiente nivel</button>' : '<p style="margin-top:8px">Último nivel completado.</p>');
    const nb = $('[data-next]', E.win); if (nb) nb.addEventListener('click', () => init(idx + 1));
    cfg.onSolved && cfg.onSolved(st, lvl());
  }
  function pointer(e) {
    const r = E.svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * V.W;
    return Math.max(V.lo, Math.min(V.hi, Math.round((x - V.PAD) / V.SP) + V.lo));
  }
  function act(v) {
    if (mode === 'probe') {
      V.token = v; const ok = cpHolds(lvl(), v);
      if (!V.tests.find(t => t.v === v)) V.tests.push({ v, ok });
      E.read.textContent = `${lvl().v} = ${v < 0 ? MIN + Math.abs(v) : v}: ${ok ? 'cumple la desigualdad compuesta ✓' : 'no cumple ✗'}.`;
    } else {
      if (!cpSolved(st)) { say('Primero resuelve la desigualdad con las operaciones.', 'info'); return; }
      if (ans.cerca === 'lo') ans.loVal = v; else ans.hiVal = v;
    }
    draw();
  }
  function checkDraw() {
    if (!cpSolved(st)) return;
    if (ans.loVal == null || ans.hiVal == null) { say('Coloca las dos cercas primero (toca la recta con cada "cerca" seleccionada).', 'info'); return; }
    const eLo = st.lo.n / st.lo.d, eHi = st.hi.n / st.hi.d, eLoC = cpIsClosed(st.relLo), eHiC = cpIsClosed(st.relHi);
    const bad = [];
    if (ans.loVal !== eLo || ans.hiVal !== eHi) bad.push('Las cercas no están en los valores a los que llegaste con el álgebra.');
    if (ans.loClosed !== eLoC || ans.hiClosed !== eHiC) bad.push('Revisa qué círculos van llenos (incluye el valor) y cuáles vacíos.');
    if (bad.length) { say(bad.join(' '), 'bad'); return; }
    say('¡Zona correcta! Coincide con los valores que probaste.', 'ok');
    V.zone = { type: st.type, loVal: eLo, loClosed: eLoC, hiVal: eHi, hiClosed: eHiC, loRel: st.relLo, hiRel: st.relHi };
    draw();
  }
  $$(`input[name="cp-mode-${key}"]`).forEach(i => i.addEventListener('change', () => { mode = i.value; E.drawRow.hidden = mode !== 'draw'; }));
  $$(`input[name="cp-cerca-${key}"]`).forEach(i => i.addEventListener('change', () => { ans.cerca = i.value; }));
  $$(`input[name="cp-clo-${key}"]`).forEach(i => i.addEventListener('change', () => { ans.loClosed = i.value === 'closed'; }));
  $$(`input[name="cp-chi-${key}"]`).forEach(i => i.addEventListener('change', () => { ans.hiClosed = i.value === 'closed'; }));
  $('[data-check]', root).addEventListener('click', checkDraw);
  let down = false;
  E.svg.addEventListener('pointerdown', e => { down = true; act(pointer(e)); });
  E.svg.addEventListener('pointermove', e => { if (down && mode === 'probe') act(pointer(e)); });
  addEventListener('pointerup', () => { down = false; });
  E.form.addEventListener('submit', e => {
    e.preventDefault();
    if (busy || cpSolved(st)) return;
    const op = $(`input[name="cp-op-${key}"]:checked`, root).value, n = parseQ(E.num.value);
    if (!n) { say('Escribe un número entero o una fracción, por ejemplo 4 ó 2/3.', 'bad'); return; }
    if (n.isZero() && op === 'div') { say('No se puede dividir entre 0.', 'bad'); return; }
    if (n.isZero() && op === 'mul') { say('Multiplicar por 0 borra toda la información.', 'bad'); return; }
    commit(op, n);
  });
  $('[data-reset]', root).addEventListener('click', () => init(idx));
  $('[data-hint]', root).addEventListener('click', () => {
    if (cpSolved(st)) return; st.hints++;
    let t;
    if (!st.b.isZero()) t = `Deshaz primero el ${st.b.n > 0 ? '+' : MIN} ${qs(absQ(st.b))}: ${st.b.n > 0 ? 'resta' : 'suma'} ${qs(absQ(st.b))} a toda la desigualdad.`;
    else t = `La letra está multiplicada por ${qs(st.a)}. Divide entre ${qs(st.a)} a toda la desigualdad${st.a.n < 0 ? ' (es negativo: cuidado con el espejo)' : ''}.`;
    say(t, 'info');
  });
  init(0);
  return { get idx() { return idx; }, get lvl() { return lvl(); } };
}

const CP_LEVELS = [
  { v: 'x', a: 1, b: 4, lo: 2, hi: 10, relLo: '<', relHi: '≤', type: 'and', tag: 'Suma · compuesta Y', disp: [-8, 12] },
  { v: 'y', a: 1, b: -3, lo: -5, hi: 9, relLo: '≤', relHi: '<', type: 'and', tag: 'Resta · compuesta Y', disp: [-6, 14] },
  { v: 'n', a: 3, b: 0, lo: -6, hi: 18, relLo: '<', relHi: '≤', type: 'and', tag: 'Dividir por positivo · Y', disp: [-8, 20] },
  { v: 'x', a: -2, b: 0, lo: -8, hi: 10, relLo: '<', relHi: '<', type: 'and', tag: 'Dividir por negativo · Y (el espejo cruza)', disp: [-10, 10] },
  { v: 'x', a: 2, b: 5, lo: -1, hi: 15, relLo: '≤', relHi: '<', type: 'and', tag: 'Dos pasos · Y', disp: [-5, 16] },
  { v: 'x', a: 1, b: 3, lo: -2, hi: 4, relLo: '<', relHi: '>', type: 'or', tag: 'Resta · compuesta O', disp: [-9, 8] },
  { v: 'k', a: -3, b: 0, lo: -9, hi: 9, relLo: '<', relHi: '>', type: 'or', tag: 'Dividir por negativo · O', disp: [-10, 10] },
  { v: 'x', a: 2, b: -1, lo: -9, hi: 7, relLo: '≤', relHi: '>', type: 'or', tag: 'Dos pasos · O', disp: [-8, 8] }
];
makeCompound($('#cp-root'), 'cp', CP_LEVELS);
