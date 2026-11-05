'use strict';
/* ======================================================
   MOTOR COMÚN DE ECUACIONES Y DESIGUALDADES
   ====================================================== */
const FLIP = { '<': '>', '>': '<', '≤': '≥', '≥': '≤', '=': '=' };
function termA(a, v) {
  if (a.isInt()) { if (a.n === 1) return v; if (a.n === -1) return MIN + v; return sg(a) + Math.abs(a.n) + v; }
  return sg(a) + fr((Math.abs(a.n) === 1 ? '' : Math.abs(a.n)) + v, a.d);
}
function expr(a, b, v) { let s = termA(a, v); if (!b.isZero()) s += ` ${b.n < 0 ? MIN : '+'} ${qh(absQ(b))}`; return s; }
const WORD = { add: 'Sumar', sub: 'Restar', mul: 'Multiplicar por', div: 'Dividir entre' };
const SYM = { add: '+', sub: '−', mul: '×', div: '÷' };

function makeSolver(root, key, rawLevels, cfg) {
  const iq = cfg.kind === 'iq';
  const lv = rawLevels.map(l => ({ v: l.v, a: Array.isArray(l.a) ? Q(l.a[0], l.a[1]) : Q(l.a), b: Q(l.b), c: Q(l.c), rel: l.rel || '=', flip: !!l.flip, tag: l.tag }));
  root.innerHTML = `
    <div class="levels" role="group" aria-label="Niveles"></div>
    <div class="eqcard"><div class="tag"></div><div class="eqn" aria-live="polite"></div></div>
    <div class="view"></div>
    <form class="ops" autocomplete="off">
      <div class="grp"><span>Operación</span>
        <fieldset class="seg" style="border:0">
          <legend class="vh">Operación</legend>
          ${['add', 'sub', 'mul', 'div'].map((o, i) => `<label><input type="radio" name="op-${key}" value="${o}"${i === 1 ? ' checked' : ''}><span aria-label="${WORD[o]}">${SYM[o]}</span></label>`).join('')}
        </fieldset>
      </div>
      <label class="fld">Número<input type="text" class="num" inputmode="text" placeholder="ej. 7 ó 6/5"></label>
      <button class="btn primary" type="submit">Aplicar a los dos lados</button>
      <button class="btn" type="button" data-hint>Pista</button>
      <button class="btn ghost" type="button" data-reset>Reiniciar nivel</button>
    </form>
    <p class="msg" aria-live="polite" style="margin-top:10px"></p>
    <div class="ask" hidden></div>
    <div class="win" hidden></div>
    <ol class="log" aria-label="Registro de pasos"></ol>`;
  const E = { levels: $('.levels', root), tag: $('.eqcard .tag', root), eq: $('.eqn', root), view: $('.view', root), form: $('.ops', root), num: $('.num', root), msg: $('.msg', root), ask: $('.ask', root), win: $('.win', root), log: $('.log', root) };
  let idx = 0, st = null, busy = false;
  const done = regSet('s-' + key);
  const lvl = () => lv[idx];
  const solved = s => s.a.eq(ONE) && s.b.isZero();
  const say = (t, c = '') => { E.msg.textContent = t; E.msg.className = 'msg ' + c; };
  const eqHTML = (s, l = lvl()) => {
    const L = expr(s.a, s.b, l.v), R = qh(s.c), rel = `<span class="rel">${s.rel}</span>`;
    return l.flip ? `${R} ${rel} ${L}` : `${L} ${rel} ${R}`;
  };
  function renderLevels() {
    E.levels.innerHTML = lv.map((l, i) => `<button class="lv${done.has(i) ? ' done' : ''}" data-i="${i}" aria-current="${i === idx}" aria-label="Nivel ${i + 1}">${i + 1}</button>`).join('');
    $$('.lv', E.levels).forEach(b => b.addEventListener('click', () => init(+b.dataset.i)));
  }
  function renderEq() { E.eq.innerHTML = eqHTML(st); cfg.renderView(E.view, st, lvl()); }
  function init(i) {
    idx = i; const l = lvl();
    st = { a: l.a, b: l.b, c: l.c, rel: l.rel, steps: 0, hints: 0 };
    E.log.innerHTML = ''; E.win.hidden = true; E.ask.hidden = true; busy = false;
    E.tag.textContent = `Nivel ${i + 1} de ${lv.length} · ${l.tag}`;
    E.num.value = ''; say(iq ? 'Aplica operaciones a los dos lados hasta dejar la letra sola.' : 'Elige una operación y un número. Se aplica en los dos platos.');
    renderLevels(); renderEq(); cfg.onLevel && cfg.onLevel(l, st);
  }
  function apply(s, op, n) {
    let { a, b, c, rel } = s;
    if (op === 'add') { b = b.add(n); c = c.add(n); }
    else if (op === 'sub') { b = b.sub(n); c = c.sub(n); }
    else { const f = op === 'mul' ? n : ONE.div(n); a = a.mul(f); b = b.mul(f); c = c.mul(f); if (f.n < 0) rel = FLIP[rel]; }
    return { ...s, a, b, c, rel, steps: s.steps + 1 };
  }
  function logLine(old, op, n, next, flipped) {
    const l = lvl(), nt = n.n < 0 ? `(${qh(n)})` : qh(n);
    let L = expr(old.a, old.b, l.v), R = qh(old.c);
    if (op === 'mul' || op === 'div') { if (!old.b.isZero()) L = `(${L})`; if (old.c.n < 0 || !old.c.isInt()) R = `(${R})`; }
    const s = SYM[op], line = l.flip ? `${R} ${s} ${nt} ${old.rel} ${L} ${s} ${nt}` : `${L} ${s} ${nt} ${old.rel} ${R} ${s} ${nt}`;
    const li = document.createElement('li');
    li.innerHTML = `<span class="ot">${WORD[op]} ${qh(n)} a los dos lados</span>${line}<span class="res">${eqHTML(next, l)}</span>` + (flipped ? '<span class="mirror">Espejo: el signo se voltea</span>' : '');
    E.log.prepend(li);
  }
  async function commit(op, n) {
    busy = true;
    const old = st, next = apply(old, op, n), flipped = next.rel !== old.rel;
    logLine(old, op, n, next, flipped);
    st = next;
    if (cfg.onStep) await cfg.onStep(op, n, flipped);
    renderEq();
    if (solved(st)) win();
    else say(flipped ? 'El espejo se activó: multiplicar o dividir por un negativo voltea el signo.' : 'Bien. Sigue.', flipped ? 'info' : '');
    busy = false;
  }
  function win() {
    const l = lvl(), sol = st.c;
    const par = (l.b.isZero() ? 0 : 1) + (l.a.eq(ONE) ? 0 : 1);
    const first = !done.has(idx); done.add(idx); renderLevels();
    let chk = '';
    if (!iq) {
      const val = l.a.mul(sol).add(l.b);
      const left = (l.a.eq(ONE) ? `(${qs(sol)})` : `${qs(l.a)}·(${qs(sol)})`) + (l.b.isZero() ? '' : ` ${l.b.n < 0 ? MIN : '+'} ${qs(absQ(l.b))}`);
      chk = `<p>Comprobación: ${left} = ${qs(val)}. ${val.eq(l.c) ? '✓ Coincide con ' + qs(l.c) + '.' : ''}</p>`;
    }
    const bonus = st.steps <= par && st.hints === 0;
    if (first) addXP(iq ? 6 : 10 + (bonus ? 5 : 0));
    E.win.hidden = false;
    E.win.innerHTML = `<b class="big">${iq ? 'Álgebra lista' : 'Caja liberada'}</b><p>Quedó ${eqHTML(st)}. ${st.steps} paso${st.steps === 1 ? '' : 's'} (lo mínimo son ${par}).${bonus && first && !iq ? ' Bonus por ir directo.' : ''}</p>${chk}
      ${iq ? '<p>Ahora dibuja la respuesta en la recta de abajo.</p>' : ''}
      ${idx < lv.length - 1 ? '<button class="btn primary" type="button" data-next style="margin-top:10px">Siguiente nivel</button>' : '<p style="margin-top:8px">Último nivel completado.</p>'}`;
    const nb = $('[data-next]', E.win); if (nb) nb.addEventListener('click', () => init(idx + 1));
    cfg.onSolved && cfg.onSolved(st, l);
  }
  function askFlip(op, n) {
    busy = true; E.ask.hidden = false;
    E.ask.innerHTML = `<b>Vas a ${op === 'mul' ? 'multiplicar' : 'dividir'} por ${qh(n)}, que es negativo.</b>
      <p>Antes de aplicarlo, predice: ¿qué le pasa al signo de la desigualdad?</p>
      <div class="row" style="margin-top:10px"><button class="btn" type="button" data-p="same">Se queda igual</button><button class="btn" type="button" data-p="flip">Se voltea</button></div>
      <p class="fbk" style="margin-top:8px" aria-live="polite"></p>`;
    $$('[data-p]', E.ask).forEach(b => b.addEventListener('click', async () => {
      const ok = b.dataset.p === 'flip';
      if (ok) { addXP(3); E.ask.hidden = true; busy = false; commit(op, n); }
      else {
        $('.fbk', E.ask).innerHTML = 'Prueba con 2 &lt; 5. Multiplica ambos por −1 y quedan −2 y −5. ¿Es −2 &lt; −5? No: −2 está a la derecha, así que −2 &gt; −5. Se voltea. Lo aplico por ti.';
        $$('[data-p]', E.ask).forEach(x => x.disabled = true);
        await sleep(2600); E.ask.hidden = true; busy = false; commit(op, n);
      }
    }));
  }
  function readOp() { return { op: $(`input[name="op-${key}"]:checked`, root).value, n: parseQ(E.num.value) }; }
  E.form.addEventListener('submit', e => {
    e.preventDefault();
    if (busy || solved(st)) return;
    const { op, n } = readOp();
    if (!n) { say('Escribe un número entero o una fracción, por ejemplo 7 ó 6/5.', 'bad'); return; }
    if (n.isZero() && op === 'div') { say('No se puede dividir entre 0.', 'bad'); return; }
    if (n.isZero() && op === 'mul') { say('Multiplicar por 0 borra toda la información de la ecuación.', 'bad'); return; }
    if (iq && (op === 'mul' || op === 'div') && n.n < 0) { askFlip(op, n); return; }
    commit(op, n);
  });
  $('[data-reset]', root).addEventListener('click', () => init(idx));
  $('[data-hint]', root).addEventListener('click', () => {
    if (solved(st)) return; st.hints++;
    let t;
    if (!st.b.isZero()) t = `Deshaz primero el ${st.b.n > 0 ? '+' : MIN} ${qs(absQ(st.b))}: ${st.b.n > 0 ? 'resta' : 'suma'} ${qs(absQ(st.b))} a los dos lados.`;
    else if (st.a.isInt()) t = `La ${lvl().v} está multiplicada por ${qs(st.a)}. Deshazlo: divide entre ${qs(st.a)} a los dos lados.`;
    else { const inv = ONE.div(st.a); t = `Multiplica los dos lados por ${qs(inv)} para dejar la ${lvl().v} sola.`; }
    say(t, 'info');
  });
  init(0);
  return { readOp, say, get st() { return st; }, get lvl() { return lvl(); }, E, busy: () => busy };
}
