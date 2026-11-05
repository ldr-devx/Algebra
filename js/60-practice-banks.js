'use strict';
/* ======================================================
   BANCOS DE PRÁCTICA
   36 ejercicios por misión, generados con una semilla fija:
   siempre salen los mismos ejercicios en el mismo orden.
   Cada ejercicio es un objeto:
     q        enunciado (HTML)
     fields   [{label, ph}]  campos de texto, o
     choices  [texto, ...]   opciones; correct = índice correcto
     check(v) -> {ok, msg}
     canon    respuesta correcta como texto (para "Ver solución")
     expl     explicación breve (HTML)
   ====================================================== */

/* ---------- utilidades ---------- */
function prRng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const prInt = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const prPick = (r, arr) => arr[Math.floor(r() * arr.length)];
function prShuf(r, arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pNg = n => n < 0 ? MIN + Math.abs(n) : String(n);
const pSgn = n => n < 0 ? MIN : '+';
const pOk = (m = '¡Correcto!') => ({ ok: true, msg: m });
const pNo = m => ({ ok: false, msg: m });
const pLin = (a, b, v) => {
  let s = a === 1 ? v : a === -1 ? MIN + v : pNg(a) + v;
  if (b) s += (b < 0 ? ' − ' : ' + ') + Math.abs(b);
  return s;
};
const pStd = (A, B, C) => `${A === 1 ? '' : A === -1 ? MIN : pNg(A)}x ${B < 0 ? '−' : '+'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}y = ${pNg(C)}`;
const pFrac = (n, d) => (n < 0 ? MIN : '') + Math.abs(n) + '/' + d;
const pList = s => String(s).replace(/[{}\[\]()]/g, ' ').split(/[\s,;]+/).filter(Boolean);
const TOG = { '<': '≤', '≤': '<', '>': '≥', '≥': '>' };

/* ---------- tipos de ejercicio ---------- */
function exNum(q, ans, expl, opt = {}) {
  return {
    q, fields: [{ ph: opt.ph || 'respuesta' }], canon: qs(ans), expl,
    check: v => {
      const x = parseQ(v[0]);
      if (!x) return pNo('Escribe un número: entero, fracción como 3/4 o decimal.');
      if (!x.eq(ans)) return pNo('No coincide. Revisa los pasos e inténtalo otra vez.');
      if (opt.red && !x.isInt()) {
        const m = String(v[0]).replace(/[−–]/g, '-').match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
        if (m && gcd(Math.abs(+m[1]), Math.abs(+m[2])) !== 1) return pNo('Es correcto, pero falta simplificar la fracción.');
      }
      return pOk();
    }
  };
}
function exChoice(r, q, opts, expl, fixed = false) {
  const idx = opts.map((_, i) => i), order = fixed ? idx : prShuf(r, idx);
  const choices = order.map(i => opts[i]), correct = order.indexOf(0);
  return { q, choices, correct, canon: opts[0], expl, check: v => (+v[0] === correct ? pOk() : pNo('Esa no es. Mira la explicación si lo necesitas.')) };
}
function exTwo(q, labels, answers, expl) {
  return {
    q, fields: labels.map(l => ({ label: l })), canon: answers.map(qs).join('  y  '), expl,
    check: v => {
      const xs = v.map(parseQ);
      if (xs.some(x => !x)) return pNo('Escribe un número en cada campo.');
      const bad = xs.map((x, i) => !x.eq(answers[i]));
      if (!bad.some(Boolean)) return pOk();
      return pNo(bad.every(Boolean) ? 'Ninguno coincide. Revisa el procedimiento.' : `Revisa ${labels.filter((_, i) => bad[i]).join(' y ')}.`);
    }
  };
}
function exList(q, answers, expl, ordered = true) {
  return {
    q, fields: [{ ph: 'separados por comas' }], canon: answers.map(qs).join(', '), expl,
    check: v => {
      const xs = pList(v[0]).map(parseQ);
      if (!xs.length || xs.some(x => !x)) return pNo('Escribe números separados por comas.');
      if (ordered) return xs.length === answers.length && xs.every((x, i) => x.eq(answers[i])) ? pOk() : pNo('Revisa cada valor y el orden.');
      const key = a => [...new Set(a.map(x => qs(x)))].sort().join('|');
      return key(xs) === key(answers) ? pOk() : pNo('Revisa los elementos: no repitas ni olvides ninguno.');
    }
  };
}
function exSet(q, arr, expl) {
  return {
    q, fields: [{ ph: 'ej. 2, 5, 7  (o vacío)' }], canon: arr.length ? '{' + arr.join(', ') + '}' : '{ } (conjunto vacío)', expl,
    check: v => {
      const raw = String(v[0]).trim().toLowerCase();
      if (!arr.length) return /^(vac[ií]o|\{\s*\}|∅|ninguno|-|—)$/.test(raw) || raw === '' ? (raw === '' ? pNo('Escribe los elementos, o "vacío" si no hay ninguno.') : pOk()) : pNo('Ese conjunto no tiene elementos en común.');
      const got = pList(raw);
      if (got.some(x => !/^-?\d+$/.test(x))) return pNo('Escribe solo números separados por comas.');
      const a = [...new Set(got.map(Number))].sort((x, y) => x - y).join(','), b = [...arr].sort((x, y) => x - y).join(',');
      return a === b ? pOk() : pNo('Los elementos no coinciden. Revisa cuáles cumplen la operación.');
    }
  };
}
function exDigits(q, digits, expl) {
  return {
    q, fields: [{ ph: 'número' }], canon: commas(digits), expl,
    check: v => { const s = String(v[0]).replace(/[,\s.]/g, ''); return s === digits ? pOk() : pNo('No coincide. Cuenta bien los lugares que se mueve el punto.'); }
  };
}
function ineqChoice(r, q, v, rel, x0, w, expl) {
  const opts = [`${v} ${rel} ${pNg(x0)}`, `${v} ${FLIP[rel]} ${pNg(x0)}`, `${v} ${TOG[rel]} ${pNg(x0)}`, `${v} ${rel} ${pNg(w === x0 ? x0 + 2 : w)}`];
  const e = exChoice(r, q, opts, expl); e.kind = 'ineq'; e.sol = { v, rel, x0 }; return e;
}

/* ---------- generador con unicidad ---------- */
function prBuild(r, plan) {
  const out = [], seen = new Set();
  plan.forEach(([count, fn]) => {
    for (let i = 0; i < count; i++) {
      let ex = null;
      for (let t = 0; t < 60; t++) { ex = fn(r, i, t); if (!seen.has(ex.q)) break; }
      seen.add(ex.q); out.push(ex);
    }
  });
  return out;
}
const VARS = ['x', 'y', 'n', 'k', 'h', 'm', 't', 'p', 'w', 'z'];

/* ======================================================
   1 · DESIGUALDADES
   ====================================================== */
function bankDesigualdades(r) {
  const RELS = ['<', '>', '≤', '≥'];
  const oneStep = (r, i) => {
    const kind = ['add', 'sub', 'mul', 'neg', 'div', 'add', 'sub', 'mul', 'neg', 'div', 'add', 'neg'][i % 12];
    const v = prPick(r, VARS), rel = prPick(r, RELS); let q, x0, c, fin = rel, w, ex;
    if (kind === 'add') { const b = prInt(r, 2, 15); c = prInt(r, -3, 14); x0 = c - b; q = `${v} + ${b} ${rel} ${pNg(c)}`; w = c + b; ex = `Resta ${b} a los dos lados: ${v} ${rel} ${pNg(c)} − ${b} = ${pNg(x0)}.`; }
    if (kind === 'sub') { const b = prInt(r, 2, 15); c = prInt(r, -5, 12); x0 = c + b; q = `${v} − ${b} ${rel} ${pNg(c)}`; w = c - b; ex = `Suma ${b} a los dos lados: ${v} ${rel} ${pNg(c)} + ${b} = ${pNg(x0)}.`; }
    if (kind === 'mul') { const a = prInt(r, 2, 7); x0 = prInt(r, -6, 9); c = a * x0; q = `${a}${v} ${rel} ${pNg(c)}`; w = c - a; ex = `Divide entre ${a}. Es positivo, así que el signo no cambia: ${v} ${rel} ${pNg(x0)}.`; }
    if (kind === 'neg') { const a = prInt(r, 2, 7); x0 = prInt(r, -6, 9); c = -a * x0; fin = FLIP[rel]; q = `${MIN}${a}${v} ${rel} ${pNg(c)}`; w = -x0 || 1; ex = `Divide entre −${a}. Es negativo, así que el signo se voltea: ${v} ${fin} ${pNg(x0)}.`; }
    if (kind === 'div') { const d = prInt(r, 2, 6); x0 = d * prInt(r, -5, 6); c = x0 / d; q = `${v}/${d} ${rel} ${pNg(c)}`; w = c - d; ex = `Multiplica por ${d}. Es positivo, así que el signo no cambia: ${v} ${rel} ${pNg(x0)}.`; }
    return ineqChoice(r, `Resuelve: <b>${q}</b>`, v, fin, x0, w, ex);
  };
  const twoStep = (r, i) => {
    const v = prPick(r, VARS), rel = prPick(r, RELS), a = prInt(r, 2, 6) * (i % 2 ? -1 : 1), b = prInt(r, 1, 9) * (r() < .5 ? -1 : 1), x0 = prInt(r, -6, 8), c = a * x0 + b;
    const fin = a < 0 ? FLIP[rel] : rel;
    const ex = `Primero ${b > 0 ? 'resta' : 'suma'} ${Math.abs(b)}: ${pLin(a, 0, v)} ${rel} ${pNg(c - b)}. Luego divide entre ${pNg(a)}${a < 0 ? ' (negativo: el signo se voltea)' : ''}: ${v} ${fin} ${pNg(x0)}.`;
    return ineqChoice(r, `Resuelve: <b>${pLin(a, b, v)} ${rel} ${pNg(c)}</b>`, v, fin, x0, c - b, ex);
  };
  const isSol = (r, i) => {
    const v = prPick(r, VARS), rel = prPick(r, RELS), a = prInt(r, 2, 5) * (i % 3 === 2 ? -1 : 1), b = prInt(r, 1, 8) * (r() < .5 ? -1 : 1), x0 = prInt(r, -4, 7), c = a * x0 + b;
    const t = x0 + prPick(r, [-2, -1, 0, 0, 1, 2, 3]), val = a * t + b;
    const truth = rel === '<' ? val < c : rel === '>' ? val > c : rel === '≤' ? val <= c : val >= c;
    const e = exChoice(r, `¿Es ${v} = ${pNg(t)} una solución de <b>${pLin(a, b, v)} ${rel} ${pNg(c)}</b>?`, truth ? ['Sí es solución', 'No es solución'] : ['No es solución', 'Sí es solución'], `Sustituye: ${pLin(a, b, '(' + pNg(t) + ')').replace('(' + pNg(t) + ')', '(' + pNg(t) + ')')} = ${pNg(val)}. ¿${pNg(val)} ${rel} ${pNg(c)}? ${truth ? 'Sí' : 'No'}.`, true);
    e.kind = 'isSol'; e.test = { a, b, rel, c, t, truth }; return e;
  };
  const graph = (r, i) => {
    const v = prPick(r, VARS), rel = prPick(r, RELS), x0 = prInt(r, -5, 8);
    const closed = rel === '≤' || rel === '≥', left = rel === '<' || rel === '≤';
    const name = (cl, lf) => `Círculo ${cl ? 'lleno' : 'vacío'}, hacia la ${lf ? 'izquierda' : 'derecha'}`;
    const opts = [name(closed, left), name(!closed, left), name(closed, !left), name(!closed, !left)];
    return exChoice(r, `La solución es <b>${v} ${rel} ${pNg(x0)}</b>. ¿Cómo se dibuja en la recta numérica?`, opts, `${rel} ${closed ? 'incluye' : 'no incluye'} el ${pNg(x0)}: círculo ${closed ? 'lleno' : 'vacío'}. Los valores que cumplen están a la ${left ? 'izquierda' : 'derecha'}.`);
  };
  return prBuild(r, [[12, oneStep], [12, twoStep], [6, isSol], [6, graph]]);
}

/* ======================================================
   2 · ECUACIONES
   ====================================================== */
function bankEcuaciones(r) {
  const one = (r, i) => {
    const v = prPick(r, VARS), b = prInt(r, 2, 15), x0 = prInt(r, -9, 20), kind = i % 4;
    const c = kind === 0 || kind === 2 ? x0 + b : x0 - b;
    const q = kind === 0 ? `${v} + ${b} = ${pNg(c)}` : kind === 1 ? `${v} − ${b} = ${pNg(c)}` : kind === 2 ? `${pNg(c)} = ${v} + ${b}` : `${pNg(c)} = ${v} − ${b}`;
    const plus = kind === 0 || kind === 2;
    return exNum(`Resuelve: <b>${q}</b>`, Q(x0), `${plus ? 'Resta' : 'Suma'} ${b} a los dos lados: ${v} = ${pNg(x0)}.`);
  };
  const mul = (r, i) => {
    const v = prPick(r, VARS), kind = i % 4;
    let q, x0, ex;
    if (kind === 0) { const a = prInt(r, 2, 9); x0 = prInt(r, -8, 12); q = `${a}${v} = ${pNg(a * x0)}`; ex = `Divide entre ${a}: ${v} = ${pNg(x0)}.`; }
    if (kind === 1) { const d = prInt(r, 2, 9), c = prInt(r, -6, 9); x0 = d * c; q = `${v}/${d} = ${pNg(c)}`; ex = `Multiplica por ${d}: ${v} = ${pNg(x0)}.`; }
    if (kind === 2) { const a = prInt(r, 2, 9); x0 = prInt(r, -8, 9); q = `${MIN}${a}${v} = ${pNg(-a * x0)}`; ex = `Divide entre −${a}: ${v} = ${pNg(x0)}.`; }
    if (kind === 3) { const a = prInt(r, 2, 9); x0 = prInt(r, -8, 12); q = `${pNg(a * x0)} = ${a}${v}`; ex = `Divide entre ${a}: ${v} = ${pNg(x0)}.`; }
    return exNum(`Resuelve: <b>${q}</b>`, Q(x0), ex);
  };
  const two = (r, i) => {
    const v = prPick(r, VARS), kind = i % 6, x0 = prInt(r, -6, 12);
    let q, ex;
    if (kind === 0) { const a = prInt(r, 2, 7), b = prInt(r, 1, 12); q = `${a}${v} + ${b} = ${pNg(a * x0 + b)}`; ex = `Resta ${b}: ${a}${v} = ${pNg(a * x0)}. Divide entre ${a}: ${v} = ${pNg(x0)}.`; }
    if (kind === 1) { const a = prInt(r, 2, 7), b = prInt(r, 1, 12); q = `${a}${v} − ${b} = ${pNg(a * x0 - b)}`; ex = `Suma ${b}: ${a}${v} = ${pNg(a * x0)}. Divide entre ${a}: ${v} = ${pNg(x0)}.`; }
    if (kind === 2) { const d = prInt(r, 2, 7), b = prInt(r, 1, 10), xx = d * prInt(r, -4, 9); q = `${v}/${d} + ${b} = ${pNg(xx / d + b)}`; ex = `Resta ${b}: ${v}/${d} = ${pNg(xx / d)}. Multiplica por ${d}: ${v} = ${pNg(xx)}.`; return exNum(`Resuelve: <b>${q}</b>`, Q(xx), ex); }
    if (kind === 3) { const d = prInt(r, 2, 7), b = prInt(r, 1, 10), xx = d * prInt(r, -3, 9); q = `${v}/${d} − ${b} = ${pNg(xx / d - b)}`; ex = `Suma ${b}: ${v}/${d} = ${pNg(xx / d)}. Multiplica por ${d}: ${v} = ${pNg(xx)}.`; return exNum(`Resuelve: <b>${q}</b>`, Q(xx), ex); }
    if (kind === 4) { const [p, d] = prPick(r, [[2, 3], [3, 4], [5, 6], [2, 5], [3, 5], [3, 2]]), b = prInt(r, 1, 10), xx = d * prInt(r, -3, 6); q = `${pNg(p * xx / d - b)} = ${p}${v}/${d} − ${b}`; ex = `Suma ${b}: ${p}${v}/${d} = ${pNg(p * xx / d)}. Multiplica por ${d} y divide entre ${p}: ${v} = ${pNg(xx)}.`; return exNum(`Resuelve: <b>${q}</b>`, Q(xx), ex); }
    if (kind === 5) { const a = prInt(r, 2, 6), b = prInt(r, 1, 12); q = `${MIN}${a}${v} + ${b} = ${pNg(-a * x0 + b)}`; ex = `Resta ${b}: −${a}${v} = ${pNg(-a * x0)}. Divide entre −${a}: ${v} = ${pNg(x0)}.`; }
    return exNum(`Resuelve: <b>${q}</b>`, Q(x0), ex);
  };
  return prBuild(r, [[12, one], [12, mul], [12, two]]);
}

/* ======================================================
   3 · FUNCIONES
   ====================================================== */
function fnRule(r, type) {
  if (type === 'lin') { const a = prInt(r, 2, 5) * (r() < .35 ? -1 : 1), b = prInt(r, 1, 9) * (r() < .5 ? -1 : 1); return { txt: `y = ${pLin(a, b, 'x')}`, f: x => a * x + b, xs: [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8], a, b }; }
  if (type === 'sq') { const c = prInt(r, 1, 9), s = r() < .6 ? -1 : 1; return { txt: `y = x² ${s < 0 ? '−' : '+'} ${c}`, f: x => x * x + s * c, xs: [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6] }; }
  if (type === 'sub') { const k = prInt(r, 8, 30); return { txt: `y = ${k} − x`, f: x => k - x, xs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }; }
  if (type === 'half') { const d = prInt(r, 2, 5), b = prInt(r, 1, 9) * (r() < .5 ? -1 : 1); return { txt: `y = x/${d} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`, f: x => x / d + b, xs: [-3, -2, -1, 0, 1, 2, 3, 4, 5].map(m => m * d) }; }
  const [p, d] = prPick(r, [[2, 3], [3, 4], [5, 6], [3, 2], [4, 3]]), b = prInt(r, 1, 9) * (r() < .5 ? -1 : 1);
  return { txt: `y = ${p}x/${d} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`, f: x => p * x / d + b, xs: [-3, -2, -1, 0, 1, 2, 3, 4].map(m => m * d) };
}
function bankFunciones(r) {
  const types = ['lin', 'sq', 'sub', 'half', 'lin', 'sq', 'frac', 'lin', 'sub', 'sq', 'half', 'frac'];
  const evalEx = (r, i) => {
    const R = fnRule(r, types[i % 12]), x = prPick(r, R.xs), y = R.f(x);
    return exNum(`Una función tiene la regla <b>${R.txt}</b>. ¿Cuánto vale y cuando x = ${pNg(x)}?`, Q(y), `Sustituye x = ${pNg(x)} en la regla y calcula en orden: y = ${pNg(y)}.`);
  };
  const rev = (r, i) => {
    const R = fnRule(r, 'lin'), x0 = prInt(r, -4, 9), y = R.f(x0);
    return exNum(`La máquina <b>${R.txt}</b> escupió ${pNg(y)}. ¿Qué número entró?`, Q(x0), `Deshaz las estaciones en orden contrario. Entró x = ${pNg(x0)}, porque ${R.txt.replace('y', pNg(y))} cuando x = ${pNg(x0)}.`);
  };
  const table = (r, i) => {
    const R = fnRule(r, i % 2 ? 'sq' : 'lin'), xs = i % 3 === 0 ? [-1, 0, 1, 2] : [1, 2, 3, 4];
    return exList(`Completa la tabla de <b>${R.txt}</b> para x = ${xs.map(pNg).join(', ')}. Escribe las salidas en ese orden, separadas por comas.`, xs.map(x => Q(R.f(x))), `Calcula una salida por cada entrada: ${xs.map(x => `x = ${pNg(x)} → ${pNg(R.f(x))}`).join('; ')}.`);
  };
  const isFn = (r, i) => {
    const xs = prShuf(r, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4), ys = xs.map(() => prInt(r, 1, 9));
    const yes = i % 2 === 0; let pairs = xs.map((x, k) => [x, ys[k]]);
    if (yes && i % 4 === 0) pairs[1][1] = pairs[0][1];
    if (!yes) { pairs[2][0] = pairs[0][0]; if (pairs[2][1] === pairs[0][1]) pairs[2][1] = pairs[0][1] % 9 + 1; }
    const txt = pairs.map(p => `(${p[0]}, ${p[1]})`).join(', ');
    const why = yes ? 'Ninguna entrada se repite con salidas distintas.' : `La entrada ${pairs[0][0]} tiene dos salidas distintas.`;
    return exChoice(r, `¿Es función esta relación de pares (entrada, salida)? <b>${txt}</b>`, yes ? ['Sí es función', 'No es función'] : ['No es función', 'Sí es función'], why, true);
  };
  const range = (r, i) => {
    const R = fnRule(r, i % 2 ? 'sq' : 'lin'), xs = i % 2 ? [-2, -1, 0, 1, 2] : [1, 2, 3, 4, 5];
    return exList(`<b>${R.txt}</b> con dominio {${xs.map(pNg).join(', ')}}. ¿Cuál es el rango? Escribe los valores sin repetir.`, [...new Set(xs.map(x => R.f(x)))].map(x => Q(x)), `Calcula la salida de cada entrada y quita los repetidos.`, false);
  };
  return prBuild(r, [[12, evalEx], [6, rev], [6, table], [6, isFn], [6, range]]);
}

/* ======================================================
   4 · VARIOS PASOS
   ====================================================== */
function bankVarios(r) {
  const par = (r, i) => {
    const v = prPick(r, VARS), a = prInt(r, 2, 6) * (i % 5 === 4 ? -1 : 1), b = prInt(r, 1, 8) * (r() < .5 ? -1 : 1), x0 = prInt(r, -6, 9), c = a * (x0 + b);
    return exNum(`Resuelve: <b>${pNg(a)}(${v} ${b < 0 ? '−' : '+'} ${Math.abs(b)}) = ${pNg(c)}</b>`, Q(x0), `Distribuye: ${pLin(a, a * b, v)} = ${pNg(c)}. Luego despeja: ${v} = ${pNg(x0)}.`);
  };
  const both = (r, i) => {
    const v = prPick(r, VARS); let a, c; do { a = prInt(r, 2, 9); c = prInt(r, 2, 9); } while (a === c);
    const b = prInt(r, 1, 9) * (r() < .5 ? -1 : 1), x0 = prInt(r, -5, 9), d = a * x0 + b - c * x0;
    return exNum(`Resuelve: <b>${pLin(a, b, v)} = ${pLin(c, d, v)}</b>`, Q(x0), `Junta las letras restando ${Math.min(a, c)}${v} a los dos lados, luego despeja: ${v} = ${pNg(x0)}.`);
  };
  const comb = (r, i) => {
    const v = prPick(r, VARS), p = prInt(r, 2, 8), q = prInt(r, 2, 5), rr = prInt(r, 1, 8) * (r() < .5 ? -1 : 1), x0 = prInt(r, -4, 8), s = p * x0 + q * (x0 + rr);
    return exNum(`Resuelve: <b>${p}${v} + ${q}(${v} ${rr < 0 ? '−' : '+'} ${Math.abs(rr)}) = ${pNg(s)}</b>`, Q(x0), `Distribuye y combina: ${pLin(p + q, q * rr, v)} = ${pNg(s)}. Despeja: ${v} = ${pNg(x0)}.`);
  };
  const ineq = (r, i) => {
    const v = prPick(r, VARS), rel = prPick(r, ['<', '>', '≤', '≥']); let a, c; do { a = prInt(r, 2, 8); c = prInt(r, 2, 8); } while (a === c);
    const b = prInt(r, 1, 8) * (r() < .5 ? -1 : 1), x0 = prInt(r, -5, 8), d = a * x0 + b - c * x0, fin = a - c < 0 ? FLIP[rel] : rel;
    return ineqChoice(r, `Resuelve: <b>${pLin(a, b, v)} ${rel} ${pLin(c, d, v)}</b>`, v, fin, x0, -x0 || 1, `Junta las letras: (${a} − ${c})${v} ${rel} ${pNg(d - b)}. ${a - c < 0 ? 'Dividir entre un negativo voltea el signo. ' : ''}Resultado: ${v} ${fin} ${pNg(x0)}.`);
  };
  const frac = (r, i) => {
    const v = prPick(r, VARS), q = prPick(r, [2, 3, 4, 5]), p = prInt(r, 1, 5), a = prInt(r, 2, 5), x0 = prInt(r, -4, 7), k = prInt(r, -3, 5), b = q * k - a * x0;
    return exNum(`Resuelve: <b>(${p}/${q})(${pLin(a, b, v)}) = ${pNg(p * k)}</b>`, Q(x0), `Multiplica por ${q}/${p}: ${pLin(a, b, v)} = ${pNg(q * k)}. Despeja: ${v} = ${pNg(x0)}.`);
  };
  return prBuild(r, [[10, par], [10, both], [6, comb], [6, ineq], [4, frac]]);
}

/* ======================================================
   5 · PENDIENTE E INTERCEPTO
   ====================================================== */
function bankPendiente(r) {
  const two = (r, i) => {
    let x1, x2, y1, y2; do { x1 = prInt(r, -6, 6); x2 = prInt(r, -6, 6); y1 = prInt(r, -6, 8); y2 = prInt(r, -6, 8); } while (x1 === x2 || (i % 5 !== 0 && y1 === y2));
    const m = Q(y2 - y1, x2 - x1);
    return exNum(`¿Cuál es la pendiente de la recta que pasa por <b>(${pNg(x1)}, ${pNg(y1)})</b> y <b>(${pNg(x2)}, ${pNg(y2)})</b>?`, m, `m = (y₂ − y₁)/(x₂ − x₁) = (${pNg(y2)} − ${pNg(y1)})/(${pNg(x2)} − ${pNg(x1)}) = ${pNg(y2 - y1)}/${pNg(x2 - x1)} = ${qs(m)}.`, { red: true });
  };
  const read = (r, i) => {
    const m = r() < .5 ? Q(prInt(r, 1, 6) * (r() < .5 ? -1 : 1)) : Q(prInt(r, 1, 5) * (r() < .5 ? -1 : 1), prInt(r, 2, 5)), b = Q(prInt(r, -9, 9));
    const askB = i % 2 === 1, line = lineText(m, b);
    return exNum(`En la recta <b>${line}</b>, ¿cuál es ${askB ? 'el intercepto con el eje y (b)' : 'la pendiente (m)'}?`, askB ? b : m, askB ? `En y = mx + b, b es el término sin x: ${qs(b)}.` : `En y = mx + b, m es el número que multiplica a x: ${qs(m)}.`, { red: true });
  };
  const findB = (r, i) => {
    const q = i % 2 ? prPick(r, [2, 3, 4]) : 1, p = prInt(r, 1, 5) * (r() < .5 ? -1 : 1), m = Q(p, q), x1 = q * prInt(r, -3, 4), y1 = prInt(r, -7, 9), b = Q(y1).sub(m.mul(Q(x1)));
    return exNum(`Una recta tiene pendiente <b>${qs(m)}</b> y pasa por <b>(${pNg(x1)}, ${pNg(y1)})</b>. En y = mx + b, ¿cuánto vale b?`, b, `Sustituye en y = mx + b: ${pNg(y1)} = ${qs(m)}·(${pNg(x1)}) + b. Despeja b = ${qs(b)}.`);
  };
  const evalY = (r, i) => {
    const m = prInt(r, 2, 6) * (r() < .5 ? -1 : 1), b = prInt(r, -9, 9), x = prInt(r, -5, 7);
    return exNum(`Si la recta es <b>${lineText(Q(m), Q(b))}</b>, ¿cuánto vale y cuando x = ${pNg(x)}?`, Q(m * x + b), `y = ${pNg(m)}·(${pNg(x)}) + ${pNg(b)} = ${pNg(m * x + b)}.`);
  };
  const steep = (r, i) => {
    let m1, m2; do { m1 = prInt(r, 1, 7) * (r() < .5 ? -1 : 1); m2 = prInt(r, 1, 7) * (r() < .5 ? -1 : 1); } while (Math.abs(m1) === Math.abs(m2));
    const b1 = prInt(r, -5, 5), b2 = prInt(r, -5, 5), l1 = lineText(Q(m1), Q(b1)), l2 = lineText(Q(m2), Q(b2));
    const e = exChoice(r, `¿Cuál de estas rectas es más empinada: <b>${l1}</b> o <b>${l2}</b>?`, Math.abs(m1) > Math.abs(m2) ? [l1, l2] : [l2, l1], `La inclinación depende del valor absoluto de m: |${m1}| = ${Math.abs(m1)} y |${m2}| = ${Math.abs(m2)}.`);
    return e;
  };
  return prBuild(r, [[12, two], [8, read], [8, findB], [4, evalY], [4, steep]]);
}

/* ======================================================
   6 · FORMA ESTÁNDAR
   ====================================================== */
function stdCanon(m, b) {
  let A, B, C;
  if (m.isZero()) { A = 0; B = 1; C = b.n; }
  else if (m.n > 0) { A = m.n; B = -m.d; C = -m.d * b.n; }
  else { A = -m.n; B = m.d; C = m.d * b.n; }
  const g = gcd(gcd(Math.abs(A), Math.abs(B)), Math.abs(C)) || 1;
  return [A / g, B / g, C / g];
}
function bankEstandar(r) {
  const conv = (r, i) => {
    const bI = prInt(r, -8, 8);
    const m = i % 2 === 0 ? Q(prInt(r, 1, 6) * (r() < .5 ? -1 : 1)) : Q(prInt(r, 1, 5) * (r() < .5 ? -1 : 1), prPick(r, [2, 3, 4, 5]));
    const b = Q(bI), [A, B, C] = stdCanon(m, b), line = lineText(m, b);
    return {
      q: `Escribe <b>${line}</b> en forma estándar Ax + By = C, con A, B y C enteros y A positivo.`, fields: [{ label: 'A' }, { label: 'B' }, { label: 'C' }], canon: `${A}, ${B}, ${C}  →  ${pStd(A, B, C)}`, kind: 'std', line: { m, b },
      expl: `Pasa la x al lado izquierdo y elimina las fracciones multiplicando. Una forma correcta es ${pStd(A, B, C)}.`,
      check: v => {
        const a = parseQ(v[0]), bb = parseQ(v[1]), c = parseQ(v[2]);
        if (!a || !bb || !c) return pNo('Escribe A, B y C como números.');
        if (![a, bb, c].every(x => x.isInt())) return pNo('A, B y C deben ser enteros, sin fracciones.');
        if (!(bb.mul(b).eq(c) && a.add(bb.mul(m.add(b))).eq(c))) return pNo('Esa ecuación no representa la misma recta. Comprueba con el punto (0, b).');
        if (a.n < 0 || (a.n === 0 && bb.n < 0)) return pNo('La recta es correcta, pero A debe ser positivo. Multiplica todo por −1.');
        if (gcd(gcd(Math.abs(a.n), Math.abs(bb.n)), Math.abs(c.n)) !== 1) return pNo('Casi. Se puede simplificar: divide A, B y C entre su factor común.');
        return pOk();
      }
    };
  };
  const inter = (r, i) => {
    const A = prInt(r, 2, 9), B = prInt(r, 2, 9) * (r() < .4 ? -1 : 1), C = (i % 3 === 0 ? A * Math.abs(B) : prInt(r, 2, 36)) * (r() < .3 ? -1 : 1), askX = i < 4;
    const ans = askX ? Q(C, A) : Q(C, B);
    return exNum(`En la recta <b>${pStd(A, B, C)}</b>, ¿en qué valor corta el ${askX ? 'eje x (haz y = 0)' : 'eje y (haz x = 0)'}?`, ans, askX ? `Con y = 0: ${A}x = ${pNg(C)}, así que x = ${qs(ans)}.` : `Con x = 0: ${pNg(B)}y = ${pNg(C)}, así que y = ${qs(ans)}.`, { red: true });
  };
  const onLine = (r, i) => {
    const A = prInt(r, 2, 7), B = prInt(r, 2, 7) * (r() < .4 ? -1 : 1), x = prInt(r, -4, 6), yy = prInt(r, -4, 6), C = A * x + B * yy;
    const yes = i % 2 === 0, py = yes ? yy : yy + prPick(r, [-2, -1, 1, 2]), val = A * x + B * py;
    return exChoice(r, `¿Está el punto <b>(${pNg(x)}, ${pNg(py)})</b> en la recta <b>${pStd(A, B, C)}</b>?`, yes ? ['Sí está', 'No está'] : ['No está', 'Sí está'], `Sustituye: ${A}(${pNg(x)}) ${B < 0 ? '−' : '+'} ${Math.abs(B)}(${pNg(py)}) = ${pNg(val)}. ${val === C ? 'Es igual' : 'No es igual'} a ${pNg(C)}.`, true);
  };
  const word = (r, i) => {
    const A = prInt(r, 2, 6), B = prInt(r, 2, 6), k = prInt(r, 1, 5), j = prInt(r, 1, 6), C = A * k + B * j;
    return exNum(`Una espada cuesta ${A} monedas y una poción cuesta ${B}. Tienes ${C} monedas. Si compras ${k} espada${k > 1 ? 's' : ''} y gastas todo, ¿cuántas pociones compras? (La ecuación es ${A}x + ${B}y = ${C}).`, Q(j), `${A}·${k} + ${B}y = ${C}. Entonces ${B}y = ${C - A * k} y y = ${j}.`);
  };
  const slope = (r, i) => {
    const A = prInt(r, 2, 9), B = prInt(r, 2, 9) * (r() < .5 ? -1 : 1), C = prInt(r, 1, 20), m = Q(-A, B);
    return exNum(`¿Cuál es la pendiente de la recta <b>${pStd(A, B, C)}</b>?`, m, `Despeja y: ${pNg(B)}y = ${pNg(-A)}x + ${pNg(C)}. La pendiente es −${pNg(A)}/${pNg(B)} = ${qs(m)}.`, { red: true });
  };
  return prBuild(r, [[12, conv], [8, inter], [6, onLine], [6, word], [4, slope]]);
}

/* ======================================================
   7 · RECTAS PARALELAS Y PERPENDICULARES
   ====================================================== */
function ppLine(r, perpOK) {
  const kind = r();
  if (kind < .3) { const A = prInt(r, 2, 8), B = prInt(r, 2, 8) * (r() < .5 ? -1 : 1), C = prInt(r, 1, 20); return { txt: pStd(A, B, C), m: Q(-A, B), std: true }; }
  const m = r() < .5 ? Q(prInt(r, 1, 6) * (r() < .5 ? -1 : 1)) : Q(prInt(r, 1, 5) * (r() < .5 ? -1 : 1), prInt(r, 2, 5)), b = Q(prInt(r, -8, 8));
  return { txt: lineText(m, b), m, b };
}
function bankRectas(r) {
  const par = (r, i) => {
    const L = ppLine(r);
    return exNum(`¿Cuál es la pendiente de cualquier recta <b>paralela</b> a <b>${L.txt}</b>?`, L.m, `Las paralelas tienen la misma pendiente que la recta original: ${qs(L.m)}.`, { red: true });
  };
  const perp = (r, i) => {
    const L = ppLine(r), ans = Q(-1).div(L.m);
    return exNum(`¿Cuál es la pendiente de cualquier recta <b>perpendicular</b> a <b>${L.txt}</b>?`, ans, `La perpendicular tiene pendiente recíproca y de signo contrario: −1/(${qs(L.m)}) = ${qs(ans)}.`, { red: true });
  };
  const parPt = (r, i) => {
    const m = i % 2 ? Q(prInt(r, 1, 4) * (r() < .5 ? -1 : 1), prPick(r, [2, 3])) : Q(prInt(r, 1, 6) * (r() < .5 ? -1 : 1)), b1 = prInt(r, -6, 6);
    const x0 = m.d * prInt(r, -3, 3), y0 = prInt(r, -6, 8), b = Q(y0).sub(m.mul(Q(x0)));
    return exTwo(`Halla la recta paralela a <b>${lineText(m, Q(b1))}</b> que pasa por <b>(${pNg(x0)}, ${pNg(y0)})</b>. Escribe m y b de y = mx + b.`, ['m', 'b'], [m, b], `La pendiente es la misma: m = ${qs(m)}. Para b: ${pNg(y0)} = ${qs(m)}·(${pNg(x0)}) + b, entonces b = ${qs(b)}.`);
  };
  const perpPt = (r, i) => {
    const m1 = i % 2 ? Q(prInt(r, 1, 3) * (r() < .5 ? -1 : 1), prPick(r, [2, 3, 4])) : Q(prInt(r, 1, 5) * (r() < .5 ? -1 : 1)), b1 = prInt(r, -6, 6), m2 = Q(-1).div(m1);
    const x0 = m2.d * prInt(r, -3, 3), y0 = prInt(r, -6, 8), b = Q(y0).sub(m2.mul(Q(x0)));
    return exTwo(`Halla la recta perpendicular a <b>${lineText(m1, Q(b1))}</b> que pasa por <b>(${pNg(x0)}, ${pNg(y0)})</b>. Escribe m y b de y = mx + b.`, ['m', 'b'], [m2, b], `La pendiente es el recíproco opuesto: m = ${qs(m2)}. Para b: ${pNg(y0)} = ${qs(m2)}·(${pNg(x0)}) + b, entonces b = ${qs(b)}.`);
  };
  const cls = (r, i) => {
    const kind = i % 4; let a, b;
    if (kind === 0) { a = Q(prInt(r, 1, 6) * (r() < .5 ? -1 : 1)); b = a; }
    else if (kind === 1) { a = Q(prInt(r, 1, 5) * (r() < .5 ? -1 : 1), prInt(r, 2, 4)); b = Q(-1).div(a); }
    else if (kind === 2) { a = Q(prInt(r, 2, 5), prInt(r, 2, 4)); b = ONE.div(a); }
    else { a = Q(prInt(r, 2, 6)); b = Q(prInt(r, 1, 6) * (r() < .5 ? -1 : 1)); if (a.eq(b) || a.mul(b).eq(Q(-1))) b = a.add(Q(1)); }
    const prod = a.mul(b), ans = a.eq(b) ? 0 : prod.eq(Q(-1)) ? 1 : 2;
    const names = ['Paralelas', 'Perpendiculares', 'Ninguna de las dos'], why = ['Misma pendiente: paralelas.', `${qs(a)} · ${qs(b)} = −1: perpendiculares.`, `${qs(a)} · ${qs(b)} = ${qs(prod)}, no es −1, y las pendientes no son iguales.`];
    const e = exChoice(r, `Dos rectas tienen pendientes <b>${qs(a)}</b> y <b>${qs(b)}</b>. ¿Cómo son?`, [names[ans], ...names.filter((_, k) => k !== ans)], why[ans]);
    return e;
  };
  return prBuild(r, [[10, par], [10, perp], [6, parPt], [6, perpPt], [4, cls]]);
}

/* ======================================================
   8 · ORDEN DE OPERACIONES
   ====================================================== */
const ORD_T = [
  r => { const a = prInt(r, 2, 20), b = prInt(r, 2, 9), c = prInt(r, 2, 9); return [`${a} + ${b} * ${c}`, a + b * c, `Primero la multiplicación: ${b} × ${c} = ${b * c}. Luego la suma: ${a} + ${b * c} = ${a + b * c}.`]; },
  r => { const a = prInt(r, 10, 40), b = prInt(r, 2, 9), c = prInt(r, 2, 15); return [`${a} - ${b} + ${c}`, a - b + c, `Resta y suma van de izquierda a derecha: ${a} − ${b} = ${a - b}; luego + ${c} = ${a - b + c}.`]; },
  r => { const a = prInt(r, 2, 12), b = prInt(r, 2, 12), c = prInt(r, 2, 9); return [`(${a} + ${b}) * ${c}`, (a + b) * c, `Primero el paréntesis: ${a + b}. Luego × ${c} = ${(a + b) * c}.`]; },
  r => { const c = prInt(r, 2, 8), b = c + prInt(r, 2, 9), a = prInt(r, 2, 9); return [`${a} * (${b} - ${c})`, a * (b - c), `Primero el paréntesis: ${b} − ${c} = ${b - c}. Luego ${a} × ${b - c} = ${a * (b - c)}.`]; },
  r => { const a = prInt(r, 2, 9), b = prInt(r, 2, 9), c = prInt(r, 2, 9); return [`${a}^2 + ${b} * ${c}`, a * a + b * c, `Potencia: ${a}² = ${a * a}. Multiplicación: ${b} × ${c} = ${b * c}. Suma: ${a * a + b * c}.`]; },
  r => { const a = prInt(r, 2, 5), b = prInt(r, 2, 20); return [`${a}^3 - ${b}`, a ** 3 - b, `Potencia: ${a}³ = ${a ** 3}. Resta: ${a ** 3} − ${b} = ${a ** 3 - b}.`]; },
  r => { const b = prInt(r, 2, 9), k = prInt(r, 2, 9), c = prInt(r, 2, 20), a = b * k; return [`${a} / ${b} + ${c}`, k + c, `División primero: ${a} ÷ ${b} = ${k}. Luego suma: ${k} + ${c} = ${k + c}.`]; },
  r => { const c = prInt(r, 2, 6), k = prInt(r, 2, 6), d = prInt(r, 2, 6), a = prInt(r, 20, 60), b = c * k; return [`${a} - ${b} / ${c} * ${d}`, a - k * d, `Divide y multiplica de izquierda a derecha: ${b} ÷ ${c} = ${k}; ${k} × ${d} = ${k * d}. Resta: ${a} − ${k * d} = ${a - k * d}.`]; },
  r => { const a = prInt(r, 1, 6), b = prInt(r, 1, 9 - a), c = prInt(r, 2, 20); const s = a + b; return [`(${a} + ${b})^2 - ${c}`, s * s - c, `Paréntesis: ${s}. Potencia: ${s}² = ${s * s}. Resta: ${s * s} − ${c} = ${s * s - c}.`]; },
  r => { const c = prInt(r, 2, 6), b = c + prInt(r, 1, 4), d = prInt(r, 2, 6), a = prInt(r, 2, 20); const s = b - c; return [`${a} + (${b} - ${c})^2 * ${d}`, a + s * s * d, `Paréntesis: ${s}. Potencia: ${s}² = ${s * s}. Multiplicación: ${s * s} × ${d} = ${s * s * d}. Suma: ${a + s * s * d}.`]; },
  r => { let a, b, c; do { a = prInt(r, 2, 12); b = prInt(r, 2, 9); c = prInt(r, 2, 9); } while ((a * b) % c); return [`${a} * ${b} / ${c}`, a * b / c, `Multiplicación y división de izquierda a derecha: ${a} × ${b} = ${a * b}; ${a * b} ÷ ${c} = ${a * b / c}.`]; },
  r => { let a, b, c, d, e; do { a = prInt(r, 20, 60); b = prInt(r, 2, 8); c = prInt(r, 1, 6); d = prInt(r, 1, 6); e = prInt(r, 2, 6); } while ((b * (c + d)) % e); return [`${a} - ${b} * (${c} + ${d}) / ${e}`, a - b * (c + d) / e, `Paréntesis: ${c + d}. Luego × y ÷ de izquierda a derecha: ${b} × ${c + d} = ${b * (c + d)}; ÷ ${e} = ${b * (c + d) / e}. Resta: ${a - b * (c + d) / e}.`]; }
];
function ordDisplay(s) { return s.replace(/\*/g, '×').replace(/\//g, '÷').replace(/ - /g, ' − ').replace(/\^(\d+)/g, (m, d) => supN(d)); }
function bankOrden(r) {
  const gen = (r, i) => {
    const [ascii, val, ex] = ORD_T[i % ORD_T.length](r);
    const e = exNum(`Calcula respetando el orden de las operaciones: <b>${ordDisplay(ascii)}</b>`, Q(val), ex); e.ascii = ascii; e.val = val; return e;
  };
  const rr = prRng(0); void rr;
  return prBuild(r, [[36, (r, i) => gen(r, i)]]);
}

/* ======================================================
   9 · EXPONENTES Y NOTACIÓN CIENTÍFICA
   ====================================================== */
function bankExponentes(r) {
  const combos = prShuf(r, [[2, 5], [3, 3], [4, 3], [5, 3], [6, 2], [7, 2], [8, 2], [9, 3], [10, 4], [11, 2], [12, 2], [2, 8], [3, 4], [5, 4], [4, 4], [6, 3], [2, 6], [7, 3]]);
  const calc = (r, i) => { const [b, e] = combos[i]; return exNum(`Calcula <b>${b}<sup>${e}</sup></b>.`, Q(b ** e), `${Array(e).fill(b).join(' × ')} = ${commas(b ** e)}.`); };
  const asPow = (r, i) => { const b = prInt(r, 2, 9), e = prInt(r, 3, 7); return exTwo(`Escribe como potencia: <b>${Array(e).fill(b).join(' × ')}</b>. Indica la base y el exponente.`, ['Base', 'Exponente'], [Q(b), Q(e)], `El número que se repite es la base (${b}) y aparece ${e} veces: ${b}<sup>${e}</sup>.`); };
  const coefs = ['1.2', '3.5', '4.7', '5.46', '2.712', '9.3', '6.08', '8.25', '1.9', '7.4', '3.06', '2.5'];
  const mkStd = (c, n) => { const [ip, fp = ''] = c.split('.'); return (ip + fp + '0'.repeat(n - fp.length)).replace(/^0+/, ''); };
  const toSci = (r, i) => {
    const c = coefs[(i * 5 + 1) % coefs.length], n = prInt(r, 4, 9), std = mkStd(c, n);
    const e = exTwo(`Escribe <b>${commas(std)}</b> en notación científica a × 10<sup>n</sup>. Indica a (entre 1 y 10) y n.`, ['a', 'n'], [parseQ(c), Q(n)], `Mueve el punto ${n} lugares a la izquierda hasta dejar un solo dígito antes del punto: ${c} × 10<sup>${n}</sup>.`); e.canon = `${c}  y  ${n}`; return e;
  };
  const toStd = (r, i) => {
    const c = coefs[(i * 7 + 3) % coefs.length], n = prInt(r, 3, 9), std = mkStd(c, n);
    return exDigits(`Escribe <b>${c} × 10<sup>${n}</sup></b> en forma estándar (sin notación científica).`, std, `Mueve el punto ${n} lugares a la derecha, agregando ceros: ${commas(std)}.`);
  };
  return prBuild(r, [[12, calc], [6, asPow], [9, toSci], [9, toStd]]);
}

/* ======================================================
   10 · CONJUNTOS
   ====================================================== */
function bankConjuntos(r) {
  const sorted = a => [...a].sort((x, y) => x - y), fmt = a => '{' + sorted(a).join(', ') + '}';
  const mkSets = (r, max, disjoint = false) => {
    const pool = prShuf(r, Array.from({ length: max }, (_, i) => i + 1));
    const sh = disjoint ? 0 : prInt(r, 1, 3), na = prInt(r, 3, 5), nb = prInt(r, 3, 5);
    const shared = pool.slice(0, sh), restA = pool.slice(sh, sh + na), restB = pool.slice(sh + na, sh + na + nb);
    return [sorted([...shared, ...restA]), sorted([...shared, ...restB])];
  };
  const head = (A, B) => `A = ${fmt(A)}   B = ${fmt(B)}`;
  const uni = (r, i) => { const [A, B] = mkSets(r, 15); const U = [...new Set([...A, ...B])]; return exSet(`${head(A, B)}. Escribe <b>A ∪ B</b>.`, U, `La unión junta todos los elementos de A y de B, sin repetir: ${fmt(U)}.`); };
  const inter = (r, i) => { const [A, B] = mkSets(r, 15, i >= 6); const I = A.filter(x => B.includes(x)); return exSet(`${head(A, B)}. Escribe <b>A ∩ B</b>.`, I, I.length ? `La intersección son los elementos que están en los dos: ${fmt(I)}.` : 'No hay ningún elemento en común: la intersección es el conjunto vacío.'); };
  const diff = (r, i) => { const [A, B] = mkSets(r, 15); const rev = i % 2 === 1, D = rev ? B.filter(x => !A.includes(x)) : A.filter(x => !B.includes(x)); return exSet(`${head(A, B)}. Escribe <b>${rev ? 'B − A' : 'A − B'}</b>.`, D, `${rev ? 'B − A' : 'A − B'} son los elementos de ${rev ? 'B' : 'A'} que no están en ${rev ? 'A' : 'B'}: ${fmt(D)}.`); };
  const count = (r, i) => { const [A, B] = mkSets(r, 15); const n = new Set([...A, ...B]).size, k = A.filter(x => B.includes(x)).length; return exNum(`${head(A, B)}. ¿Cuántos elementos tiene <b>A ∪ B</b>?`, Q(n), `n(A) + n(B) − n(A ∩ B) = ${A.length} + ${B.length} − ${k} = ${n}.`); };
  const comp = (r, i) => { const [A] = mkSets(r, 10); const U = Array.from({ length: 10 }, (_, k) => k + 1), C = U.filter(x => !A.includes(x)); return exSet(`U = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}   A = ${fmt(A)}. Escribe el complemento <b>A′</b>.`, C, `El complemento son los elementos de U que no están en A: ${fmt(C)}.`); };
  const member = (r, i) => {
    const [A, B] = mkSets(r, 15), op = ['A ∩ B', 'A ∪ B', 'A − B', 'A ∩ B'][i % 4];
    const pool = [...new Set([...A, ...B])]; const x = r() < .75 ? prPick(r, pool) : prInt(r, 1, 15);
    const inA = A.includes(x), inB = B.includes(x), ok = op === 'A ∩ B' ? inA && inB : op === 'A ∪ B' ? inA || inB : inA && !inB;
    return exChoice(r, `${head(A, B)}. ¿El ${x} pertenece a <b>${op}</b>?`, ok ? ['Sí pertenece', 'No pertenece'] : ['No pertenece', 'Sí pertenece'], `${x} ${inA ? 'está' : 'no está'} en A y ${inB ? 'está' : 'no está'} en B.`, true);
  };
  return prBuild(r, [[8, uni], [8, inter], [6, diff], [6, count], [4, comp], [4, member]]);
}

/* ======================================================
   11 · RACIONALES Y PROPORCIONES
   ====================================================== */
function bankRacionales(r) {
  const coprime = (r, lo, hi) => { let p, q; do { p = prInt(r, lo, hi); q = prInt(r, 2, 12); } while (gcd(p, q) !== 1); return [p, q]; };
  const simp = (r, i) => { const [p, q] = coprime(r, 1, 9), g = prInt(r, 2, 9), s = r() < .35 ? -1 : 1; return exNum(`Simplifica la fracción <b>${pFrac(s * p * g, q * g)}</b>.`, Q(s * p, q), `Divide numerador y denominador entre ${g}: ${pFrac(s * p, q)}.`, { red: true }); };
  const decs = ['0.5', '0.25', '0.75', '0.6', '0.8', '0.125', '0.35', '1.5', '2.4', '3.35', '0.45', '4.2', '1.25', '0.04', '0.375', '2.75'];
  const d2f = (r, i) => { const d = decs[(i * 3 + 2) % decs.length], v = parseQ(d); return exNum(`Escribe <b>${d}</b> como fracción reducida.`, v, `${d} = ${d.replace('.', '')}/${10 ** (d.split('.')[1].length)} y se simplifica a ${qs(v)}.`, { red: true }); };
  const f2d = (r, i) => { const d = prPick(r, [2, 4, 5, 8, 10, 20, 25]), n = prInt(r, 1, d * 3 - 1); const v = Q(n, d); return exNum(`Escribe <b>${n}/${d}</b> como decimal.`, v, `Divide ${n} ÷ ${d} = ${(n / d).toString()}.`, { ph: 'decimal' }); };
  const addf = (r, i) => { const d = prInt(r, 5, 20), a = prInt(r, 1, d), b = prInt(r, 1, d), sub = i % 2 === 1, sa = r() < .4 ? -1 : 1, sb = r() < .4 ? -1 : 1, v = Q(sa * a + (sub ? -1 : 1) * sb * b, d);
    const t = `${pFrac(sa * a, d)} ${sub ? '−' : '+'} ${sb < 0 ? '(' + pFrac(sb * b, d) + ')' : pFrac(b, d)}`;
    return exNum(`Calcula y simplifica: <b>${t}</b>`, v, `Con el mismo denominador se operan solo los numeradores: ${sa * a} ${sub ? '−' : '+'} (${sb * b}) = ${sa * a + (sub ? -1 : 1) * sb * b}. Resultado ${qs(v)}.`, { red: true }); };
  const prop = (r, i) => {
    const [p, q] = coprime(r, 1, 7); let s = prInt(r, 2, 6), t; do { t = prInt(r, 2, 6); } while (t === s);
    const a = p * s, b = q * s, c = p * t, d = q * t, form = i % 4; let txt, ans;
    if (i >= 6) { const k = prInt(r, 1, 6), x0 = p * s - k; txt = `(x + ${k})/${b} = ${c}/${d === 0 ? 1 : d}`; ans = x0; const left = b, right = d; return exNum(`Resuelve la proporción: <b>(x + ${k})/${left * 1} = ${(p * t)}/${(q * t) * 1 * (left / b)}</b>`.replace(`${left}`, `${b}`), Q(p * s * (q * t) / (q * t) - k + 0), `Multiplica en cruz y despeja: primero halla x + ${k}, luego resta ${k}.`); }
    if (form === 0) { txt = `x/${b} = ${c}/${d}`; ans = a; } if (form === 1) { txt = `${a}/${b} = x/${d}`; ans = c; } if (form === 2) { txt = `${a}/${b} = ${c}/x`; ans = d; } if (form === 3) { txt = `${a}/x = ${c}/${d}`; ans = b; }
    return exNum(`Resuelve la proporción: <b>${txt}</b>`, Q(ans), `Multiplica en cruz y despeja: x = ${ans}.`);
  };
  return prBuild(r, [[8, simp], [6, d2f], [6, f2d], [8, addf], [8, prop]]);
}

/* ---------- registro ---------- */
const BANKS = {
  desigualdades: bankDesigualdades(prRng(1101)), ecuaciones: bankEcuaciones(prRng(1202)), funciones: bankFunciones(prRng(1303)),
  varios: bankVarios(prRng(1404)), pendiente: bankPendiente(prRng(1505)), estandar: bankEstandar(prRng(1606)),
  rectas: bankRectas(prRng(1707)), orden: bankOrden(prRng(1808)), exponentes: bankExponentes(prRng(1909)),
  conjuntos: bankConjuntos(prRng(2010)), racionales: bankRacionales(prRng(2111))
};
