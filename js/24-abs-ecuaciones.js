'use strict';
/* ======================================================
   MISIÓN 13: ECUACIONES DE VALOR ABSOLUTO
   "El espejo de las dos puertas"
   ====================================================== */
function aeApply(s, op, n) {
  let { a, b, c } = s;
  if (op === 'add') { b = b.add(n); c = c.add(n); }
  else if (op === 'sub') { b = b.sub(n); c = c.sub(n); }
  else { const f = op === 'mul' ? n : ONE.div(n); a = a.mul(f); b = b.mul(f); c = c.mul(f); }
  return { ...s, a, b, c, steps: s.steps + 1 };
}
const aeSolved = s => s.a.eq(ONE) && s.b.isZero();

function makeBranch(container, nameKey, v, st0, onSolved) {
  const E = document.createElement('div');
  E.innerHTML = `
    <div class="eqcard"><div class="tag"></div><div class="eqn" aria-live="polite"></div></div>
    <form class="ops" autocomplete="off">
      <div class="grp"><span>Operación</span>
        <fieldset class="seg" style="border:0"><legend class="vh">Operación</legend>
          ${['add', 'sub', 'mul', 'div'].map((o, i) => `<label><input type="radio" name="ae-op-${nameKey}" value="${o}"${i === 1 ? ' checked' : ''}><span aria-label="${WORD[o]}">${SYM[o]}</span></label>`).join('')}
        </fieldset></div>
      <label class="fld">Número<input type="text" class="num" inputmode="text" placeholder="ej. 3 ó 1/2"></label>
      <button class="btn primary" type="submit">Aplicar</button>
    </form>
    <p class="msg" aria-live="polite" style="margin-top:8px"></p>
    <ol class="log" aria-label="Registro de pasos"></ol>`;
  container.appendChild(E);
  const eq = $('.eqn', E), tag = $('.tag', E), form = $('.ops', E), num = $('.num', E), msg = $('.msg', E), log = $('.log', E);
  let st = st0;
  const render = () => { eq.innerHTML = `${expr(st.a, st.b, v)} <span class="rel">=</span> ${qh(st.c)}`; };
  tag.textContent = st0.label; render();
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (aeSolved(st)) return;
    const op = $(`input[name="ae-op-${nameKey}"]:checked`, E).value, n = parseQ(num.value);
    if (!n) { msg.textContent = 'Escribe un número entero o una fracción.'; msg.className = 'msg bad'; return; }
    if (n.isZero() && (op === 'div' || op === 'mul')) { msg.textContent = 'No se puede usar 0 aquí.'; msg.className = 'msg bad'; return; }
    const old = st; st = aeApply(st, op, n);
    const li = document.createElement('li');
    li.innerHTML = `<span class="ot">${WORD[op]} ${qh(n)} a los dos lados</span><span class="res">${expr(st.a, st.b, v)} = ${qh(st.c)}</span>`;
    log.prepend(li); void old; render();
    if (aeSolved(st)) { msg.textContent = `Resuelto: ${v} = ${qh(st.c)}.`; msg.className = 'msg ok'; $$('input,button', form).forEach(x => x.disabled = true); onSolved(st.c); }
    else { msg.textContent = 'Bien, sigue despejando.'; msg.className = ''; }
  });
  return { get solved() { return aeSolved(st); } };
}

function aeDrawLine(svg, lo, hi, c, pts) {
  const W = 584, PAD = 28, SP = (W - 2 * PAD) / (hi - lo), X = v => PAD + (v - lo) * SP, Y = 56;
  let g = `<line class="base" x1="6" y1="${Y}" x2="${W - 6}" y2="${Y}"/>`;
  for (let v = Math.ceil(lo); v <= hi; v++) g += `<line class="tick" x1="${X(v)}" y1="${Y - 9}" x2="${X(v)}" y2="${Y + 9}"/><text class="${v === 0 ? 'z' : ''}" x="${X(v)}" y="${Y + 34}">${v < 0 ? MIN + Math.abs(v) : v}</text>`;
  if (c > 0) {
    g += `<line x1="${X(0)}" y1="${Y - 26}" x2="${X(c)}" y2="${Y - 26}" style="stroke:var(--amber);stroke-width:2;stroke-dasharray:4 4"/><text x="${(X(0) + X(c)) / 2}" y="${Y - 32}" style="fill:var(--amber)">dist ${c}</text>`;
    g += `<line x1="${X(0)}" y1="${Y - 26}" x2="${X(-c)}" y2="${Y - 26}" style="stroke:var(--amber);stroke-width:2;stroke-dasharray:4 4"/>`;
  }
  (pts || []).forEach(p => { g += `<circle class="closed" cx="${X(p.x)}" cy="${Y}" r="10" style="fill:var(--${p.cls})"/><text x="${X(p.x)}" y="${Y - 14}" style="fill:var(--${p.cls})">${p.lab}</text>`; });
  svg.innerHTML = g;
}

const AE_LEVELS = [
  { v: 'x', a: 1, b: 0, c: 7, tag: 'La base: dos puertas espejo' },
  { v: 'y', a: 1, b: 3, c: 10, tag: 'Un paso · suma dentro' },
  { v: 'n', a: 1, b: -5, c: 4, tag: 'Un paso · resta dentro' },
  { v: 'x', a: 2, b: 0, c: 16, tag: 'Un paso · coeficiente' },
  { v: 'x', a: 3, b: 6, c: 9, tag: 'Dos pasos' },
  { v: 'x', a: -2, b: 5, c: 9, tag: 'Dos pasos con coeficiente negativo' },
  { v: 'k', a: 1, b: 6, c: 0, tag: 'c = 0 · una sola puerta' },
  { v: 'm', a: 2, b: 1, c: -5, tag: 'c negativo · sin solución' }
];

function makeAbsEq(root, key, rawLevels) {
  const lv = rawLevels;
  root.innerHTML = `
    <div class="levels" role="group" aria-label="Niveles"></div>
    <div class="eqcard"><div class="tag"></div><div class="eqn" aria-live="polite"></div></div>
    <p class="sub" id="ae-expl" style="margin-top:8px"></p>
    <svg class="nl" viewBox="0 0 584 118" role="img" aria-label="Recta con las dos puertas espejo"></svg>
    <div class="grid2" id="ae-branches" style="margin-top:14px"></div>
    <div class="win" hidden></div>`;
  const E = { levels: $('.levels', root), tag: $('.tag', root), eq: $('.eqn', root), expl: $('#ae-expl', root), svg: $('svg', root), branches: $('#ae-branches', root), win: $('.win', root) };
  let idx = 0; const done = regSet(key);
  let gotPos = null, gotNeg = null, n = 0;
  function renderLevels() {
    E.levels.innerHTML = lv.map((l, i) => `<button class="lv${done.has(i) ? ' done' : ''}" data-i="${i}" aria-current="${i === idx}" aria-label="Nivel ${i + 1}">${i + 1}</button>`).join('');
    $$('.lv', E.levels).forEach(b => b.addEventListener('click', () => init(+b.dataset.i)));
  }
  function win() {
    const first = !done.has(idx); done.add(idx); renderLevels();
    if (first) addXP(8);
    E.win.hidden = false;
    E.win.innerHTML = `<b class="big">Nivel superado</b><p>Encontraste las dos distancias iguales a 0.</p>` +
      (idx < lv.length - 1 ? '<button class="btn primary" type="button" data-next style="margin-top:10px">Siguiente nivel</button>' : '<p style="margin-top:8px">Último nivel completado.</p>');
    const nb = $('[data-next]', E.win); if (nb) nb.addEventListener('click', () => init(idx + 1));
  }
  function init(i) {
    idx = i; const l = lv[i], a = Q(l.a), b = Q(l.b), c = Q(l.c);
    gotPos = null; gotNeg = null; n++; E.win.hidden = true;
    E.tag.textContent = `Nivel ${i + 1} de ${lv.length} · ${l.tag}`;
    E.eq.innerHTML = `|${expr(a, b, l.v)}| <span class="rel">=</span> ${qh(c)}`;
    const cN = c.n / c.d, sol0 = -b.n / b.d / (a.n / a.d) || 0;
    const lo = Math.min(-Math.abs(cN) - 2, sol0 - 6), hi = Math.max(Math.abs(cN) + 2, sol0 + 6);
    E.branches.innerHTML = '';
    if (cN < 0) {
      E.expl.textContent = 'Una distancia nunca puede ser negativa: esta ecuación no tiene solución real.';
      aeDrawLine(E.svg, lo, hi, 0, []);
      E.branches.style.gridTemplateColumns = '1fr';
      E.branches.innerHTML = '<div class="card"><p>No hay ningún número que, al calcular su distancia desde 0 después de las operaciones, dé un resultado negativo. <b>Sin solución.</b></p><button class="btn primary" type="button" id="ae-ack" style="margin-top:10px">Entendido</button></div>';
      $('#ae-ack', E.branches).addEventListener('click', win);
    } else if (cN === 0) {
      E.expl.textContent = 'La distancia es 0: las dos puertas se juntan en una sola. Solo hay una solución.';
      aeDrawLine(E.svg, lo, hi, 0, []);
      const wrap = document.createElement('div'); wrap.className = 'card'; E.branches.appendChild(wrap); E.branches.style.gridTemplateColumns = '1fr';
      makeBranch(wrap, 'solo' + n, l.v, { a, b, c, label: 'Única puerta: expresión = 0', steps: 0 }, val => { aeDrawLine(E.svg, lo, hi, 0, [{ x: val.n / val.d, cls: 'lime', lab: l.v + ' = ' + qh(val) }]); win(); });
    } else {
      E.expl.textContent = 'Esto son dos caminos con la misma distancia a 0: resuelve cada caso por separado.';
      aeDrawLine(E.svg, lo, hi, cN, []);
      E.branches.style.gridTemplateColumns = '';
      const wPos = document.createElement('div'); wPos.className = 'card'; E.branches.appendChild(wPos);
      const wNeg = document.createElement('div'); wNeg.className = 'card'; E.branches.appendChild(wNeg);
      const check = () => { if (gotPos != null && gotNeg != null) win(); };
      makeBranch(wPos, 'pos' + n, l.v, { a, b, c, label: 'Caso + : expresión = ' + qh(c), steps: 0 }, val => {
        gotPos = val.n / val.d; aeDrawLine(E.svg, lo, hi, cN, [{ x: gotPos, cls: 'lime', lab: l.v + '=' + qh(val) }, ...(gotNeg != null ? [{ x: gotNeg, cls: 'pink', lab: l.v + '=' + pNgSafe(gotNeg) }] : [])]); check();
      });
      makeBranch(wNeg, 'neg' + n, l.v, { a, b, c: c.neg(), label: 'Caso − : expresión = ' + qh(c.neg()), steps: 0 }, val => {
        gotNeg = val.n / val.d; aeDrawLine(E.svg, lo, hi, cN, [...(gotPos != null ? [{ x: gotPos, cls: 'lime', lab: l.v + '=' + pNgSafe(gotPos) }] : []), { x: gotNeg, cls: 'pink', lab: l.v + '=' + pNgSafe(gotNeg) }]); check();
      });
    }
    renderLevels();
  }
  init(0);
}
function pNgSafe(n) { return n < 0 ? MIN + Math.abs(n) : String(n); }

makeAbsEq($('#ae-root'), 'ae', AE_LEVELS);
