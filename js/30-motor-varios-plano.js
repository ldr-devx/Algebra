'use strict';
/* ======================================================
   MOTOR DE VARIOS PASOS (letras en los dos lados, paréntesis)
   ====================================================== */
const R_ = x => Array.isArray(x) ? Q(x[0], x[1]) : Q(x);
const expr2 = (a, b, v) => a.isZero() ? qh(b) : expr(a, b, v);
function makeMulti(root, key, raw) {
  const lv = raw.map(l => ({ ...l, rel: l.rel || '=', pre: l.pre || [], a1: R_(l.a1), b1: R_(l.b1), a2: R_(l.a2), b2: R_(l.b2) }));
  root.innerHTML = `
    <div class="levels" role="group" aria-label="Niveles"></div>
    <div class="eqcard"><div class="tag"></div><div class="eqn" aria-live="polite"></div></div>
    <div class="ask pre" hidden></div>
    <form class="ops" autocomplete="off">
      <div class="grp"><span>Operación</span>
        <fieldset class="seg" style="border:0"><legend class="vh">Operación</legend>
          ${['add', 'sub', 'mul', 'div'].map((o, i) => `<label><input type="radio" name="op-${key}" value="${o}"${i === 1 ? ' checked' : ''}><span aria-label="${WORD[o]}">${SYM[o]}</span></label>`).join('')}
        </fieldset></div>
      <label class="fld">Número<input type="text" class="num" inputmode="text" placeholder="ej. 5 ó 2/3"></label>
      <label class="fld" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" class="withx"> con la letra</label>
      <button class="btn primary" type="submit">Aplicar a los dos lados</button>
      <button class="btn" type="button" data-hint>Pista</button>
      <button class="btn ghost" type="button" data-reset>Reiniciar nivel</button>
    </form>
    <p class="msg" aria-live="polite" style="margin-top:10px"></p>
    <div class="win" hidden></div>
    <ol class="log" aria-label="Registro de pasos"></ol>`;
  const E = { levels: $('.levels', root), tag: $('.tag', root), eq: $('.eqn', root), pre: $('.pre', root), form: $('.ops', root), num: $('.num', root), wx: $('.withx', root), msg: $('.msg', root), win: $('.win', root), log: $('.log', root) };
  let idx = 0, st = null, busy = false; const done = regSet('m-' + key);
  const l0 = () => lv[idx];
  const say = (t, c = '') => { E.msg.textContent = t; E.msg.className = 'msg ' + c; };
  const solved = s => (s.a1.eq(ONE) && s.b1.isZero() && s.a2.isZero()) || (s.a2.eq(ONE) && s.b2.isZero() && s.a1.isZero());
  const numeric = () => st.stage >= l0().pre.length;
  const eqNum = (s, l = l0()) => `${expr2(s.a1, s.b1, l.v)} <span class="rel">${s.rel}</span> ${expr2(s.a2, s.b2, l.v)}`;
  function renderEq() {
    const l = l0();
    E.eq.innerHTML = numeric() ? eqNum(st) : (st.stage === 0 ? l.orig : l.pre[st.stage - 1].html);
    $$('input,button', E.form).forEach(x => { x.disabled = !numeric() || solved(st); });
    E.pre.hidden = numeric();
    if (!numeric()) {
      const p = l.pre[st.stage], dec = 'Pasar términos al otro lado';
      const order = idx % 2 ? [dec, p.label] : [p.label, dec];
      E.pre.innerHTML = `<b>Primero limpia cada lado. ¿Qué haces ahora?</b><div class="row" style="margin-top:10px">${order.map(t => `<button class="btn" type="button" data-c="${t === p.label ? 'ok' : 'no'}">${t}</button>`).join('')}</div>`;
      $$('[data-c]', E.pre).forEach(b => b.addEventListener('click', () => {
        if (b.dataset.c === 'no') { say('Todavía no. ' + p.why, 'bad'); return; }
        const li = document.createElement('li'); li.innerHTML = `<span class="ot">${p.label}</span><span class="res">${p.html}</span>`; E.log.prepend(li);
        st.stage++; renderEq();
        say(numeric() ? 'Lado limpio. Ahora junta las letras en un solo plato y despeja.' : 'Bien. Sigue limpiando.', 'ok');
      }));
    }
  }
  function renderLevels() {
    E.levels.innerHTML = lv.map((l, i) => `<button class="lv${done.has(i) ? ' done' : ''}" data-i="${i}" aria-current="${i === idx}" aria-label="Nivel ${i + 1}">${i + 1}</button>`).join('');
    $$('.lv', E.levels).forEach(b => b.addEventListener('click', () => init(+b.dataset.i)));
  }
  function init(i) {
    idx = i; const l = l0();
    st = { stage: 0, a1: l.a1, b1: l.b1, a2: l.a2, b2: l.b2, rel: l.rel, steps: 0, hints: 0 };
    E.log.innerHTML = ''; E.win.hidden = true; E.num.value = ''; E.wx.checked = false;
    E.tag.textContent = `Nivel ${i + 1} de ${lv.length} · ${l.tag}`;
    say(l.pre.length ? 'Primero hay que limpiar los lados.' : 'Junta las letras en un solo lado y despeja.');
    renderLevels(); renderEq();
  }
  function apply(s, op, n, withX) {
    let { a1, b1, a2, b2, rel } = s;
    if (op === 'add' || op === 'sub') { const k = op === 'add' ? n : n.neg(); if (withX) { a1 = a1.add(k); a2 = a2.add(k); } else { b1 = b1.add(k); b2 = b2.add(k); } }
    else { const f = op === 'mul' ? n : ONE.div(n); a1 = a1.mul(f); b1 = b1.mul(f); a2 = a2.mul(f); b2 = b2.mul(f); if (f.n < 0) rel = FLIP[rel]; }
    return { ...s, a1, b1, a2, b2, rel, steps: s.steps + 1 };
  }
  E.form.addEventListener('submit', e => {
    e.preventDefault();
    if (busy || !numeric() || solved(st)) return;
    const op = $(`input[name="op-${key}"]:checked`, root).value, n = parseQ(E.num.value), wx = E.wx.checked, l = l0();
    if (!n) { say('Escribe un número entero o una fracción, por ejemplo 5 ó 2/3.', 'bad'); return; }
    if ((op === 'mul' || op === 'div') && wx) { say('"Con la letra" solo sirve al sumar o restar. Para multiplicar o dividir usa un número solo.', 'bad'); return; }
    if (n.isZero() && (op === 'div' || op === 'mul')) { say('Con 0 no se puede multiplicar ni dividir.', 'bad'); return; }
    const old = st, next = apply(old, op, n, wx), flipped = next.rel !== old.rel;
    const nt0 = wx ? (n.eq(ONE) ? l.v : qh(n) + l.v) : qh(n), nt = n.n < 0 ? `(${nt0})` : nt0;
    let Ls = expr2(old.a1, old.b1, l.v), Rs = expr2(old.a2, old.b2, l.v);
    if (op === 'mul' || op === 'div') { if (!old.b1.isZero() && !old.a1.isZero()) Ls = `(${Ls})`; if (!old.b2.isZero() && !old.a2.isZero()) Rs = `(${Rs})`; }
    const li = document.createElement('li');
    li.innerHTML = `<span class="ot">${WORD[op]} ${nt0} a los dos lados</span>${Ls} ${SYM[op]} ${nt} ${old.rel} ${Rs} ${SYM[op]} ${nt}<span class="res">${eqNum(next)}</span>` + (flipped ? '<span class="mirror">Espejo: el signo se voltea</span>' : '');
    E.log.prepend(li); st = next; renderEq();
    if (solved(st)) win(); else say(flipped ? 'El espejo se activó: dividir o multiplicar por un negativo voltea el signo.' : 'Bien. Sigue.', flipped ? 'info' : '');
  });
  function win() {
    const l = l0(), first = !done.has(idx); done.add(idx); renderLevels();
    const sol = (st.a1.eq(ONE) && st.a2.isZero()) ? st.b2 : st.b1;
    const Lv = l.a1.mul(sol).add(l.b1), Rv = l.a2.mul(sol).add(l.b2);
    const ok = relHolds(l.rel, Lv.sub(Rv));
    if (first) addXP(12);
    E.win.hidden = false;
    E.win.innerHTML = `<b class="big">Nivel superado</b><p>Quedó ${eqNum(st)}.</p><p>Comprobación con ${l.v} = ${qs(sol)}: lado izquierdo ${qs(Lv)}, lado derecho ${qs(Rv)}. ${ok ? '✓ Se cumple.' : ''}</p>` +
      (idx < lv.length - 1 ? '<button class="btn primary" type="button" data-next style="margin-top:10px">Siguiente nivel</button>' : '<p style="margin-top:8px">Último nivel completado.</p>');
    const nb = $('[data-next]', E.win); if (nb) nb.addEventListener('click', () => init(idx + 1));
    renderEq();
  }
  $('[data-reset]', root).addEventListener('click', () => init(idx));
  $('[data-hint]', root).addEventListener('click', () => {
    if (!numeric() || solved(st)) return; st.hints++;
    const l = l0(), v = l.v; let t;
    if (!st.a1.isZero() && !st.a2.isZero()) {
      const k = st.a1.cmp(st.a2) < 0 ? st.a1 : st.a2;
      t = `Junta las letras en un solo plato: ${k.n > 0 ? 'resta' : 'suma'} ${qs(absQ(k))}${v} a los dos lados (marca "con la letra"). Conviene restar la letra con el menor coeficiente.`;
    } else {
      const varLeft = !st.a1.isZero(), a = varLeft ? st.a1 : st.a2, b = varLeft ? st.b1 : st.b2;
      if (!b.isZero()) t = `Deshaz el ${b.n > 0 ? '+' : MIN} ${qs(absQ(b))}: ${b.n > 0 ? 'resta' : 'suma'} ${qs(absQ(b))} a los dos lados.`;
      else t = a.isInt() ? `La ${v} está multiplicada por ${qs(a)}: divide entre ${qs(a)} a los dos lados.` : `Multiplica los dos lados por ${qs(ONE.div(a))} para dejar la ${v} sola.`;
    }
    say(t, 'info');
  });
  init(0);
}

/* ======================================================
   PLANO COORDENADO COMPARTIDO
   ====================================================== */
let planeN = 0;
function planeSVG(o) {
  const S = 360, P = 24, min = o.min ?? -10, max = o.max ?? 10, id = 'pc' + (++planeN);
  const sx = v => P + (v - min) / (max - min) * (S - 2 * P), sy = v => S - P - (v - min) / (max - min) * (S - 2 * P);
  const fv = v => v < 0 ? MIN + Math.abs(v) : String(v);
  let g = `<defs><clipPath id="${id}"><rect x="${P}" y="${P}" width="${S - 2 * P}" height="${S - 2 * P}"/></clipPath></defs>`;
  for (let v = Math.ceil(min); v <= max; v++) { const c = v % 5 === 0 ? ' g5' : ''; g += `<line class="g${c}" x1="${sx(v)}" y1="${P}" x2="${sx(v)}" y2="${S - P}"/><line class="g${c}" x1="${P}" y1="${sy(v)}" x2="${S - P}" y2="${sy(v)}"/>`; }
  const zero = min <= 0 && max >= 0, ay = zero ? sy(0) : sy(min), ax = zero ? sx(0) : sx(min);
  g += `<line class="ax" x1="${P}" y1="${ay}" x2="${S - P}" y2="${ay}"/><line class="ax" x1="${ax}" y1="${P}" x2="${ax}" y2="${S - P}"/>`;
  const step = o.lab || 5;
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) { if (v === 0) continue; g += `<text x="${sx(v)}" y="${ay + 14}" text-anchor="middle">${fv(v)}</text><text x="${ax - 5}" y="${sy(v) + 4}" text-anchor="end">${fv(v)}</text>`; }
  (o.lines || []).forEach(l => { g += `<line clip-path="url(#${id})" class="${l.cls}" x1="${sx(min)}" y1="${sy(l.m * min + l.b)}" x2="${sx(max)}" y2="${sy(l.m * max + l.b)}"/>`; });
  if (o.extra) g += o.extra(sx, sy);
  (o.pts || []).forEach(p => { g += `<circle class="${p.cls || 'pt'}" cx="${sx(p.x)}" cy="${sy(p.y)}" r="5.5"/>` + (p.label ? `<text class="lb" x="${Math.min(sx(p.x) + 8, S - 70)}" y="${sy(p.y) - 8}">${p.label}</text>` : ''); });
  return g;
}
function lineEq(m, b) {
  if (m.isZero()) return 'y = ' + qh(b);
  const mt = termA(m, 'x');
  return b.isZero() ? `y = ${mt}` : `y = ${mt} ${b.n < 0 ? MIN : '+'} ${qh(absQ(b))}`;
}
function lineText(m, b) {
  if (m.isZero()) return 'y = ' + qs(b);
  const mt = m.eq(ONE) ? 'x' : m.eq(ONE.neg()) ? MIN + 'x' : (m.isInt() ? qs(m) + 'x' : '(' + qs(m) + ')x');
  return b.isZero() ? `y = ${mt}` : `y = ${mt} ${b.n < 0 ? MIN : '+'} ${qs(absQ(b))}`;
}
const tick = (el, ok, text) => { el.textContent = text; el.className = 'msg ' + (ok ? 'ok' : 'bad'); };
