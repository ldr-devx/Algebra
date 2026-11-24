'use strict';
/* ======================================================
   MISIÓN 14: DESIGUALDADES DE VALOR ABSOLUTO
   "La frontera con eco" — reutiliza el motor de compuestas (23-compuestas.js)
   ====================================================== */
function avToCompound(l) {
  const lo = -l.c, hi = l.c;
  if (l.rel === '<' || l.rel === '≤') return { v: l.v, a: l.a, b: l.b, lo, hi, relLo: l.rel, relHi: l.rel, type: 'and', tag: l.tag, disp: l.disp, origRel: l.rel, origC: l.c };
  const relLo = l.rel === '>' ? '<' : '≤';
  return { v: l.v, a: l.a, b: l.b, lo, hi, relLo, relHi: l.rel, type: 'or', tag: l.tag, disp: l.disp, origRel: l.rel, origC: l.c };
}
function showPredict(l) {
  const root = $('#ad-predict'); if (!root) return;
  const orig = `|${expr(l.a, l.b, l.v)}| ${l.origRel} ${qh(Q(l.origC))}`;
  const compound = cpText({ a: l.a, b: l.b, lo: l.lo, hi: l.hi, relLo: l.relLo, relHi: l.relHi, type: l.type }, l.v);
  root.innerHTML = `<div class="card">
    <h3>Primero: ¿Y o O?</h3>
    <p class="eqn" style="margin-top:6px">${orig}</p>
    <p class="sub" style="margin-top:8px">Antes de resolver con operaciones, predice cómo se parte esta desigualdad.</p>
    <div class="row" style="margin-top:10px"><button class="btn" type="button" data-g="and">Y · los dos a la vez</button><button class="btn" type="button" data-g="or">O · cualquiera de los dos</button></div>
    <p class="msg" id="ad-pmsg" aria-live="polite" style="margin-top:8px"></p>
    <p class="readout" id="ad-pcompound" style="display:none;margin-top:4px"></p>
  </div>`;
  const msg = $('#ad-pmsg', root);
  $$('[data-g]', root).forEach(b => b.addEventListener('click', () => {
    const ok = b.dataset.g === l.type;
    msg.textContent = ok ? '¡Correcto!' : (l.type === 'and' ? 'No: < y ≤ siempre son Y (intersección, el pasillo entre las dos cercas).' : 'No: > y ≥ siempre son O (unión, dos salidas).');
    msg.className = 'msg ' + (ok ? 'ok' : 'bad');
    const pc = $('#ad-pcompound', root); pc.style.display = 'block'; pc.innerHTML = 'Forma equivalente: <b>' + compound + '</b>';
  }));
}

const AD_LEVELS = [
  { v: 'x', a: 1, b: 0, c: 5, rel: '<', tag: 'La base: < es Y', disp: [-9, 9] },
  { v: 'y', a: 1, b: 2, c: 9, rel: '≤', tag: 'Un paso · ≤ es Y', disp: [-15, 11] },
  { v: 'n', a: 3, b: 0, c: 12, rel: '<', tag: 'Un paso · coeficiente', disp: [-14, 14] },
  { v: 'x', a: 1, b: -3, c: 6, rel: '>', tag: 'Un paso · > es O', disp: [-7, 13] },
  { v: 'k', a: 1, b: 4, c: 7, rel: '≥', tag: 'Un paso · ≥ es O', disp: [-15, 7] },
  { v: 'x', a: 2, b: 1, c: 9, rel: '≤', tag: 'Dos pasos · Y', disp: [-7, 6] },
  { v: 'x', a: -2, b: 3, c: 11, rel: '>', tag: 'Dos pasos con negativo · O', disp: [-8, 10] },
  { v: 'x', a: 3, b: 3, c: 9, rel: '<', tag: 'Dos pasos · Y (coeficiente)', disp: [-7, 5] }
];
makeCompound($('#ad-root'), 'ad', AD_LEVELS.map(avToCompound), { onLevel: showPredict });
