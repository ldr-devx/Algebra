'use strict';
/* ======================================================
   MISIÓN 15: SISTEMAS LINEALES POR ELIMINACIÓN
   "Cancelar el ingrediente" — usa planeSVG de 30-motor-varios-plano.js
   ====================================================== */
function sysTerm(a, v) { return a === 1 ? v : a === -1 ? MIN + v : (a < 0 ? MIN + Math.abs(a) : String(a)) + v; }
function sysEqText(A, B, C, highlight) {
  const t1 = highlight === 'A' ? `<span class="cancel">0x</span>` : sysTerm(A, 'x');
  const t2sign = B < 0 ? ` ${MIN} ` : ' + ';
  const t2 = highlight === 'B' ? `<span class="cancel">0y</span>` : (Math.abs(B) === 1 ? 'y' : Math.abs(B) + 'y');
  const cT = C < 0 ? MIN + Math.abs(C) : String(C);
  return `${t1}${highlight === 'B' ? ' + ' : t2sign}${t2} = ${cT}`;
}
function sysPlane(l, x0, y0) {
  const m1 = -l.A1 / l.B1, b1 = l.C1 / l.B1, m2 = -l.A2 / l.B2, b2 = l.C2 / l.B2;
  return planeSVG({ lines: [{ m: m1, b: b1, cls: 'l1' }, { m: m2, b: b2, cls: 'l2' }], pts: [{ x: x0, y: y0, cls: 'pt', label: `(${x0}, ${y0})` }] });
}

const SE_LEVELS = [
  { A1: 1, B1: 1, C1: 10, A2: 1, B2: -1, C2: 2, tag: 'Sumar cancela directo' },
  { A1: 2, B1: 1, C1: 11, A2: 1, B2: -1, C2: 1, tag: 'Sumar cancela directo (otros coeficientes)' },
  { A1: 1, B1: 2, C1: 12, A2: 1, B2: 5, C2: 27, tag: 'Restar cancela directo' },
  { A1: 3, B1: 2, C1: 16, A2: 1, B2: 2, C2: 8, tag: 'Restar cancela el término con y' },
  { A1: 2, B1: 3, C1: 13, A2: 1, B2: 1, C2: 5, tag: 'Un multiplicador' },
  { A1: 2, B1: 3, C1: 16, A2: 3, B2: 4, C2: 22, tag: 'Dos multiplicadores' },
  { A1: 4, B1: -3, C1: -1, A2: 2, B2: 3, C2: 13, tag: 'Con coeficientes negativos' }
];

function makeElim(root, key, raw) {
  root.innerHTML = `
    <div class="levels" role="group" aria-label="Niveles"></div>
    <div class="eqcard"><div class="tag"></div><div class="eqn" id="${key}-e1"></div><div class="eqn" id="${key}-e2" style="margin-top:4px"></div></div>
    <div class="row" style="margin-top:12px">
      <label class="fld">Multiplicar ecuación 1 por<input type="text" id="${key}-k1" inputmode="text" value="1"></label>
      <label class="fld">Multiplicar ecuación 2 por<input type="text" id="${key}-k2" inputmode="text" value="1"></label>
      <button class="btn" type="button" id="${key}-mul" style="align-self:flex-end">Multiplicar filas</button>
    </div>
    <div class="row" style="margin-top:8px">
      <button class="btn primary" type="button" id="${key}-add">Sumar las filas</button>
      <button class="btn primary" type="button" id="${key}-sub">Restar las filas (1 − 2)</button>
      <button class="btn" type="button" id="${key}-hint">Pista</button>
      <button class="btn ghost" type="button" id="${key}-reset">Reiniciar nivel</button>
    </div>
    <p class="msg" id="${key}-msg" aria-live="polite" style="margin-top:10px"></p>
    <div class="card" id="${key}-step2" hidden></div>
    <div class="card" id="${key}-step3" hidden style="margin-top:12px"></div>
    <div class="grid2" id="${key}-final" hidden style="margin-top:12px">
      <div class="win" id="${key}-win"></div>
      <div class="card"><h3>El plano</h3><svg class="pl" id="${key}-svg" viewBox="0 0 360 360" role="img" aria-label="Las dos rectas y su intersección"></svg></div>
    </div>
    <ol class="log" id="${key}-log" aria-label="Registro de pasos"></ol>`;
  const E = {}; ['e1', 'e2', 'k1', 'k2', 'mul', 'add', 'sub', 'hint', 'reset', 'msg', 'step2', 'step3', 'final', 'win', 'svg', 'log'].forEach(k => E[k] = $(`#${key}-${k}`, root));
  const levels = $('.levels', root), tagEl = $('.tag', root);
  let idx = 0, w = null, orig = null, phase = 'combine', elim = null, x0 = 0, y0 = 0, solveVar1 = null, val1 = null;
  const done = regSet(key);
  const say = (t, c = '') => { E.msg.textContent = t; E.msg.className = 'msg ' + c; };
  function renderLevels() {
    levels.innerHTML = raw.map((l, i) => `<button class="lv${done.has(i) ? ' done' : ''}" data-i="${i}" aria-current="${i === idx}" aria-label="Nivel ${i + 1}">${i + 1}</button>`).join('');
    $$('.lv', levels).forEach(b => b.addEventListener('click', () => init(+b.dataset.i)));
  }
  function init(i) {
    idx = i; const l = raw[i];
    orig = { A1: l.A1, B1: l.B1, C1: l.C1, A2: l.A2, B2: l.B2, C2: l.C2 };
    w = { ...orig }; phase = 'combine'; elim = null; solveVar1 = null; val1 = null;
    const det = l.A1 * l.B2 - l.A2 * l.B1;
    x0 = Math.round((l.C1 * l.B2 - l.C2 * l.B1) / det); y0 = Math.round((l.A1 * l.C2 - l.A2 * l.C1) / det);
    E.k1.value = '1'; E.k2.value = '1'; E.log.innerHTML = ''; E.step2.hidden = true; E.step3.hidden = true; E.final.hidden = true;
    tagEl.textContent = `Nivel ${i + 1} de ${raw.length} · ${l.tag}`;
    E.e1.innerHTML = 'Ecuación 1: ' + sysEqText(w.A1, w.B1, w.C1);
    E.e2.innerHTML = 'Ecuación 2: ' + sysEqText(w.A2, w.B2, w.C2);
    say('Multiplica una fila si lo necesitas, luego suma o resta para cancelar una letra.');
    renderLevels();
  }
  E.mul.addEventListener('click', () => {
    if (phase !== 'combine') return;
    const k1 = parseInt(E.k1.value, 10), k2 = parseInt(E.k2.value, 10);
    if (!k1 || !k2) { say('Escribe dos números enteros distintos de 0.', 'bad'); return; }
    w.A1 *= k1; w.B1 *= k1; w.C1 *= k1; w.A2 *= k2; w.B2 *= k2; w.C2 *= k2;
    E.e1.innerHTML = 'Ecuación 1: ' + sysEqText(w.A1, w.B1, w.C1);
    E.e2.innerHTML = 'Ecuación 2: ' + sysEqText(w.A2, w.B2, w.C2);
    const li = document.createElement('li'); li.innerHTML = `<span class="ot">Multiplicar ecuación 1 por ${k1} y ecuación 2 por ${k2}</span><span class="res">${sysEqText(w.A1, w.B1, w.C1)}  /  ${sysEqText(w.A2, w.B2, w.C2)}</span>`;
    E.log.prepend(li); E.k1.value = '1'; E.k2.value = '1';
    say('Filas escaladas. Ahora suma o resta para cancelar una letra.');
  });
  function combine(op) {
    if (phase !== 'combine') return;
    const sign = op === 'add' ? 1 : -1;
    const nA = w.A1 + sign * w.A2, nB = w.B1 + sign * w.B2, nC = w.C1 + sign * w.C2;
    if (nA !== 0 && nB !== 0) { say('Ningún término se cancela. Ajusta los multiplicadores y vuelve a intentar.', 'bad'); return; }
    if (nA === 0 && nB === 0) { say('Se cancelaron las dos letras: revisa los multiplicadores, hay un paso de más.', 'bad'); return; }
    elim = nA === 0 ? 'x' : 'y';
    const li = document.createElement('li');
    li.innerHTML = `<span class="ot">${op === 'add' ? 'Sumar' : 'Restar'} las dos filas</span><span class="res">${sysEqText(nA, nB, nC, nA === 0 ? 'A' : 'B')}</span><span class="mirror">Se cancela la ${elim}</span>`;
    E.log.prepend(li);
    solveVar1 = elim === 'x' ? 'y' : 'x';
    const coef = elim === 'x' ? nB : nA;
    phase = 'solve1';
    E.step2.hidden = false;
    E.step2.innerHTML = `<h3>Resuelve la ecuación de una letra</h3><p class="eqn">${sysTerm(coef, solveVar1)} = ${nC}</p>
      <div class="row" style="margin-top:10px"><label class="fld">${solveVar1} =<input type="text" id="${key}-v1" inputmode="text" placeholder="valor"></label><button class="btn primary" type="button" id="${key}-check1">Comprobar</button></div>
      <p class="msg" id="${key}-m1" aria-live="polite" style="margin-top:8px"></p>`;
    $(`#${key}-check1`, E.step2).addEventListener('click', () => {
      const v = parseQ($(`#${key}-v1`, E.step2).value), expected = solveVar1 === 'x' ? x0 : y0, m = $(`#${key}-m1`, E.step2);
      if (!v) { m.textContent = 'Escribe un número.'; m.className = 'msg bad'; return; }
      if (v.n / v.d !== expected) { m.textContent = 'No coincide. Divide la constante entre el coeficiente.'; m.className = 'msg bad'; return; }
      m.textContent = `Correcto: ${solveVar1} = ${expected}.`; m.className = 'msg ok';
      val1 = expected; $$('input,button', E.step2).forEach(x => x.disabled = true); step3();
    });
    say('Bien, el término se canceló. Ahora resuelve la ecuación que quedó.', 'ok');
  }
  function step3() {
    phase = 'solve2';
    const solveVar2 = solveVar1 === 'x' ? 'y' : 'x';
    E.step3.hidden = false;
    E.step3.innerHTML = `<h3>Sustituye hacia atrás</h3><p>Usa la ecuación 1 original: <b>${sysEqText(orig.A1, orig.B1, orig.C1)}</b> con ${solveVar1} = ${val1}.</p>
      <div class="row" style="margin-top:10px"><label class="fld">${solveVar2} =<input type="text" id="${key}-v2" inputmode="text" placeholder="valor"></label><button class="btn primary" type="button" id="${key}-check2">Comprobar</button></div>
      <p class="msg" id="${key}-m2" aria-live="polite" style="margin-top:8px"></p>`;
    $(`#${key}-check2`, E.step3).addEventListener('click', () => {
      const v = parseQ($(`#${key}-v2`, E.step3).value), expected = solveVar2 === 'x' ? x0 : y0, m = $(`#${key}-m2`, E.step3);
      if (!v) { m.textContent = 'Escribe un número.'; m.className = 'msg bad'; return; }
      if (v.n / v.d !== expected) { m.textContent = 'No coincide. Sustituye con cuidado y despeja.'; m.className = 'msg bad'; return; }
      m.textContent = `Correcto: ${solveVar2} = ${expected}.`; m.className = 'msg ok';
      $$('input,button', E.step3).forEach(x => x.disabled = true); win();
    });
  }
  function win() {
    const first = !done.has(idx); done.add(idx); renderLevels();
    if (first) addXP(12);
    E.final.hidden = false;
    E.svg.innerHTML = sysPlane(orig, x0, y0);
    E.win.innerHTML = `<b class="big">Sistema resuelto</b><p>La solución es x = ${x0}, y = ${y0}. Las dos rectas se cruzan justo ahí.</p>` +
      (idx < raw.length - 1 ? '<button class="btn primary" type="button" data-next style="margin-top:10px">Siguiente nivel</button>' : '<p style="margin-top:8px">Último nivel completado.</p>');
    const nb = $('[data-next]', E.win); if (nb) nb.addEventListener('click', () => init(idx + 1));
  }
  E.add.addEventListener('click', () => combine('add'));
  E.sub.addEventListener('click', () => combine('sub'));
  E.reset.addEventListener('click', () => init(idx));
  E.hint.addEventListener('click', () => {
    if (phase === 'combine') say('Si al sumar o restar directo nada se cancela, multiplica una fila (o las dos) para que un coeficiente quede opuesto al de la otra fila.', 'info');
    else if (phase === 'solve1') say('Divide la constante entre el coeficiente que quedó.', 'info');
    else say('Sustituye el valor que ya tienes en la ecuación 1 original y despeja la otra letra.', 'info');
  });
  init(0);
}
makeElim($('#se-root'), 'se', SE_LEVELS);
