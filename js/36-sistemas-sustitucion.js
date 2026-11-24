'use strict';
/* ======================================================
   MISIÓN 16: SISTEMAS LINEALES POR SUSTITUCIÓN
   "La pieza que entra en la otra máquina" — reutiliza sysTerm/sysEqText/planeSVG
   ====================================================== */
function subExpr(m, b) { return sysTerm(m, 'x') + (b === 0 ? '' : (b < 0 ? ` ${MIN} ${Math.abs(b)}` : ` + ${b}`)); }

const SS_LEVELS = [
  { m: 2, b: -1, A: 1, B: 1, C: 11, tag: 'Sustitución directa' },
  { m: 1, b: 3, A: 3, B: -1, C: 5, tag: 'Con resta en la otra ecuación' },
  { m: -2, b: 9, A: 1, B: 1, C: 1, tag: 'Con pendiente negativa' },
  { m: 3, b: -4, A: 2, B: 3, C: 10, tag: 'Distribuir un coeficiente' },
  { m: 4, b: 1, A: -3, B: 2, C: 17, tag: 'Coeficiente negativo en la otra ecuación' },
  { m: -1, b: 6, A: 5, B: -2, C: 16, tag: 'Dos pasos al combinar' },
  { m: 2, b: 0, A: 3, B: -4, C: 15, tag: 'Sin constante (y = mx)' }
];

function makeSub(root, key, raw) {
  root.innerHTML = `
    <div class="levels" role="group" aria-label="Niveles"></div>
    <div class="eqcard"><div class="tag"></div><p>Ecuación 1: <span class="plugchip" id="${key}-chip"></span></p><p style="margin-top:4px" id="${key}-e2"></p></div>
    <div class="row" style="margin-top:12px">
      <button class="btn primary" type="button" id="${key}-plug">Enchufar la ecuación 1 en la ecuación 2</button>
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
  const E = {}; ['chip', 'e2', 'plug', 'hint', 'reset', 'msg', 'step2', 'step3', 'final', 'win', 'svg', 'log'].forEach(k => E[k] = $(`#${key}-${k}`, root));
  const levels = $('.levels', root), tagEl = $('.tag', root);
  let idx = 0, l = null, x0 = 0, y0 = 0, plugged = false;
  const done = regSet(key);
  const say = (t, c = '') => { E.msg.textContent = t; E.msg.className = 'msg ' + c; };
  function renderLevels() {
    levels.innerHTML = raw.map((lv, i) => `<button class="lv${done.has(i) ? ' done' : ''}" data-i="${i}" aria-current="${i === idx}" aria-label="Nivel ${i + 1}">${i + 1}</button>`).join('');
    $$('.lv', levels).forEach(b => b.addEventListener('click', () => init(+b.dataset.i)));
  }
  function init(i) {
    idx = i; l = raw[i]; plugged = false;
    x0 = (l.C - l.B * l.b) / (l.A + l.B * l.m); y0 = l.m * x0 + l.b;
    E.log.innerHTML = ''; E.step2.hidden = true; E.step3.hidden = true; E.final.hidden = true; E.plug.disabled = false;
    tagEl.textContent = `Nivel ${i + 1} de ${raw.length} · ${l.tag}`;
    E.chip.textContent = `y = ${subExpr(l.m, l.b)}`;
    E.e2.innerHTML = 'Ecuación 2: ' + sysEqText(l.A, l.B, l.C);
    say('Toma la pieza "y" de la ecuación 1 y enchúfala en el lugar de la y en la ecuación 2.');
    renderLevels();
  }
  E.plug.addEventListener('click', () => {
    if (plugged) return; plugged = true; E.plug.disabled = true;
    const K = l.A + l.B * l.m, L = l.B * l.b;
    const raw1 = `${sysTerm(l.A, 'x')} ${l.B < 0 ? MIN : '+'} ${Math.abs(l.B) === 1 ? '' : Math.abs(l.B)}(${subExpr(l.m, l.b)}) = ${l.C}`;
    const li1 = document.createElement('li'); li1.innerHTML = `<span class="ot">Enchufar y = ${subExpr(l.m, l.b)} en la ecuación 2</span><span class="res">${raw1}</span>`;
    E.log.prepend(li1);
    const li2 = document.createElement('li'); li2.innerHTML = `<span class="ot">Distribuir y combinar términos con x</span><span class="res">${sysTerm(K, 'x')}${L === 0 ? '' : (L < 0 ? ` ${MIN} ${Math.abs(L)}` : ` + ${L}`)} = ${l.C}</span>`;
    E.log.prepend(li2);
    E.step2.hidden = false;
    E.step2.innerHTML = `<h3>Resuelve la ecuación de una letra</h3><p class="eqn">${sysTerm(K, 'x')}${L === 0 ? '' : (L < 0 ? ` ${MIN} ${Math.abs(L)}` : ` + ${L}`)} = ${l.C}</p>
      <div class="row" style="margin-top:10px"><label class="fld">x =<input type="text" id="${key}-v1" inputmode="text" placeholder="valor"></label><button class="btn primary" type="button" id="${key}-check1">Comprobar</button></div>
      <p class="msg" id="${key}-m1" aria-live="polite" style="margin-top:8px"></p>`;
    $(`#${key}-check1`, E.step2).addEventListener('click', () => {
      const v = parseQ($(`#${key}-v1`, E.step2).value), m = $(`#${key}-m1`, E.step2);
      if (!v) { m.textContent = 'Escribe un número.'; m.className = 'msg bad'; return; }
      if (v.n / v.d !== x0) { m.textContent = 'No coincide. Revisa el despeje.'; m.className = 'msg bad'; return; }
      m.textContent = `Correcto: x = ${x0}.`; m.className = 'msg ok';
      $$('input,button', E.step2).forEach(x => x.disabled = true); step3();
    });
    say('Ya tienes una sola letra. Resuélvela.', 'ok');
  });
  function step3() {
    E.step3.hidden = false;
    E.step3.innerHTML = `<h3>Sustituye hacia atrás</h3><p>Usa la ecuación 1: <b>y = ${subExpr(l.m, l.b)}</b> con x = ${x0}.</p>
      <div class="row" style="margin-top:10px"><label class="fld">y =<input type="text" id="${key}-v2" inputmode="text" placeholder="valor"></label><button class="btn primary" type="button" id="${key}-check2">Comprobar</button></div>
      <p class="msg" id="${key}-m2" aria-live="polite" style="margin-top:8px"></p>`;
    $(`#${key}-check2`, E.step3).addEventListener('click', () => {
      const v = parseQ($(`#${key}-v2`, E.step3).value), m = $(`#${key}-m2`, E.step3);
      if (!v) { m.textContent = 'Escribe un número.'; m.className = 'msg bad'; return; }
      if (v.n / v.d !== y0) { m.textContent = 'No coincide. Sustituye x con cuidado.'; m.className = 'msg bad'; return; }
      m.textContent = `Correcto: y = ${y0}.`; m.className = 'msg ok';
      $$('input,button', E.step3).forEach(x => x.disabled = true); win();
    });
  }
  function win() {
    const first = !done.has(idx); done.add(idx); renderLevels();
    if (first) addXP(12);
    E.final.hidden = false;
    E.svg.innerHTML = planeSVG({ lines: [{ m: l.m, b: l.b, cls: 'l1' }, { m: -l.A / l.B, b: l.C / l.B, cls: 'l2' }], pts: [{ x: x0, y: y0, cls: 'pt', label: `(${x0}, ${y0})` }] });
    E.win.innerHTML = `<b class="big">Sistema resuelto</b><p>La solución es x = ${x0}, y = ${y0}. Las dos rectas se cruzan justo ahí.</p>` +
      (idx < raw.length - 1 ? '<button class="btn primary" type="button" data-next style="margin-top:10px">Siguiente nivel</button>' : '<p style="margin-top:8px">Último nivel completado.</p>');
    const nb = $('[data-next]', E.win); if (nb) nb.addEventListener('click', () => init(idx + 1));
  }
  E.reset.addEventListener('click', () => init(idx));
  E.hint.addEventListener('click', () => {
    if (!plugged) say('En la ecuación 2, donde dice "y", escribe la expresión completa de la ecuación 1 entre paréntesis.', 'info');
    else if (!E.step2.hidden && !$(`#${key}-v1`, E.step2).disabled) say('Despeja x: pasa la constante al otro lado y divide entre su coeficiente.', 'info');
    else say('Sustituye x en y = ' + subExpr(l.m, l.b) + ' y calcula.', 'info');
  });
  init(0);
}
makeSub($('#ss-root'), 'ss', SS_LEVELS);
