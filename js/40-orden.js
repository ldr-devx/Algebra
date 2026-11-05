'use strict';
/* ---------- orden de operaciones ---------- */
const OR_EXPR = ['15 - 6 + 9', '25 - 4 * (30 / 6)', '3^2 + 4 * 3 - 5', '7 + (15 - 2^3) - 20 / 4', '4^3 / 8 + 5 * 4 - 6', '2^4 * 3 - 24 / 6', '5^2 - (-2)^3', '20 - 4 * [8 / (10 - 2^3)]'];
const OR_TAGS = ['Izquierda a derecha · Examen 6.º', 'Paréntesis primero · Examen 6.º', 'Potencias · Examen 6.º', 'Paréntesis con potencia · Examen 6.º', 'Todo junto · Examen 7.º', 'Todo junto · Examen 9.º', 'Potencias con negativos · Examen 10.º', 'Paréntesis anidados · Examen 10.º'];
const PREC = { '^': 3, '*': 2, '/': 2, '+': 1, '-': 1 };
const GL = { '*': '×', '/': '÷', '-': '−', '+': '+' };
const isOpen = t => t.k === 'p' && '(['.includes(t.v), isClose = t => t.k === 'p' && ')]'.includes(t.v);
function orTok(s) {
  const re = /\(-(\d+)\)|(\d+)|([()\[\]+\-*\/^])/g, t = []; let m;
  while ((m = re.exec(s))) { if (m[1] !== undefined) t.push({ k: 'n', v: -+m[1] }); else if (m[2] !== undefined) t.push({ k: 'n', v: +m[2] }); else if ('()[]'.includes(m[3])) t.push({ k: 'p', v: m[3] }); else t.push({ k: 'o', v: m[3] }); }
  return t;
}
function orCands(T) {
  const groups = [], stack = [];
  T.forEach((t, i) => { if (isOpen(t)) stack.push(i); else if (isClose(t)) { const o = stack.pop(); if (!T.slice(o + 1, i).some(isOpen)) groups.push([o + 1, i - 1]); } });
  if (!groups.length) groups.push([0, T.length - 1]);
  const out = [];
  groups.forEach(([a, b]) => { let best = -1, bi = -1; for (let k = a; k <= b; k++) if (T[k].k === 'o' && PREC[T[k].v] > best) { best = PREC[T[k].v]; bi = k; } if (bi >= 0) out.push(bi); });
  return out;
}
function orStep(T, k) {
  const a = T[k - 1].v, b = T[k + 1].v, o = T[k].v;
  const r = o === '+' ? a + b : o === '-' ? a - b : o === '*' ? a * b : o === '/' ? a / b : a ** b;
  T.splice(k - 1, 3, { k: 'n', v: r });
  for (let i = 0; i < T.length - 2;) { if (isOpen(T[i]) && T[i + 1].k === 'n' && isClose(T[i + 2])) { T.splice(i, 3, T[i + 1]); i = 0; } else i++; }
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const supN = n => String(n).split('').map(c => SUP[+c]).join('');
function orText(T) {
  let s = '';
  for (let i = 0; i < T.length; i++) {
    const t = T[i];
    if (t.k === 'n') { const prev = T[i - 1], wrap = t.v < 0 && prev && !isOpen(prev); s += (wrap ? '(' : '') + (t.v < 0 ? MIN + Math.abs(t.v) : t.v) + (wrap ? ')' : ''); }
    else if (t.k === 'p') s += t.v;
    else if (t.v === '^') { s += supN(T[i + 1].v); i++; }
    else s += ' ' + GL[t.v] + ' ';
  }
  return s;
}
const OR = { i: 0, T: [], mist: 0, hints: 0, done: regSet('or'), total: 0, hintSet: new Set() };
function orCat(T, c) { if (T.some(t => t.k === 'p')) return 0; const p = PREC[T[c[0]].v]; return p === 3 ? 1 : p === 2 ? 2 : 3; }
function orRender() {
  const T = OR.T; let h = '';
  for (let i = 0; i < T.length; i++) {
    const t = T[i], hint = OR.hintSet.has(i) ? ' hint' : '';
    if (t.k === 'n') { const prev = T[i - 1], wrap = t.v < 0 && prev && !isOpen(prev); h += `<span class="n">${wrap ? '(' : ''}${t.v < 0 ? MIN + Math.abs(t.v) : t.v}${wrap ? ')' : ''}</span>`; }
    else if (t.k === 'p') h += `<span class="gl">${t.v}</span>`;
    else if (t.v === '^') { h += `<button class="optk${hint}" data-i="${i}" aria-label="elevar a ${T[i + 1].v}"><sup>${T[i + 1].v}</sup></button>`; i++; }
    else h += `<button class="optk${hint}" data-i="${i}" aria-label="operación ${GL[t.v]}">${GL[t.v]}</button>`;
  }
  $('#or-expr').innerHTML = h;
  const done = T.length === 1;
  const cat = done ? -1 : orCat(T, orCands(T));
  $('#or-ladder').innerHTML = ['Paréntesis', 'Potencias', '× y ÷', '+ y −'].map((n, i) => `<span class="${i === cat ? 'on' : ''}">${n}</span>`).join('');
  $('#or-count').textContent = `Errores: ${OR.mist}`;
}
function orLevels() {
  $('#or-levels').innerHTML = OR_EXPR.map((e, i) => `<button class="lv${OR.done.has(i) ? ' done' : ''}" data-i="${i}" aria-current="${i === OR.i}" aria-label="Jefe ${i + 1}">${i + 1}</button>`).join('');
  $$('#or-levels .lv').forEach(b => b.addEventListener('click', () => orInit(+b.dataset.i)));
}
function orInit(i) {
  clearTimeout(OR.ht); OR.i = i; OR.T = orTok(OR_EXPR[i]); OR.mist = 0; OR.hints = 0; OR.hintSet = new Set();
  $('#or-tag').textContent = `Jefe ${i + 1} de ${OR_EXPR.length} · ${OR_TAGS[i]}`;
  $('#or-log').innerHTML = `<li><span class="ot">Inicio</span>${orText(OR.T)}</li>`;
  const m = $('#or-msg'); m.textContent = 'Toca la operación que va primero.'; m.className = 'msg';
  orLevels(); orRender();
}
$('#or-expr').addEventListener('click', e => {
  const b = e.target.closest('.optk'); if (!b || OR.T.length === 1) return;
  const k = +b.dataset.i, c = orCands(OR.T), m = $('#or-msg');
  clearTimeout(OR.ht); OR.hintSet = new Set();
  if (c.includes(k)) {
    orStep(OR.T, k);
    const li = document.createElement('li'); li.innerHTML = `<span class="ot">Golpe correcto</span>${orText(OR.T)}`; $('#or-log').prepend(li);
    if (OR.T.length === 1) {
      const first = !OR.done.has(OR.i); OR.done.add(OR.i);
      tick(m, true, `¡Jefe vencido! Resultado: ${OR.T[0].v < 0 ? MIN + Math.abs(OR.T[0].v) : OR.T[0].v}.` + (OR.mist === 0 ? ' Sin errores.' : ''));
      if (first) addXP(OR.mist <= 1 ? 8 : 4);
      orLevels();
    } else { m.textContent = 'Bien. Sigue.'; m.className = 'msg'; }
    orRender();
  } else {
    OR.mist++;
    const cat = orCat(OR.T, c), p = PREC[OR.T[k].v];
    const msgs = ['Hay paréntesis: resuelve primero lo que está dentro, empezando por el más interno.', 'No hay paréntesis, así que van primero las potencias.', 'Ya no hay potencias: ahora × y ÷, siempre de izquierda a derecha.', 'Solo quedan + y −, de izquierda a derecha.'];
    const sameLevel = (cat === 2 && p === 2) || (cat === 3 && p === 1);
    tick(m, false, 'Todavía no. ' + (sameLevel ? 'Esas operaciones van al mismo nivel, y se hacen de izquierda a derecha.' : msgs[cat]));
    orRender(); const nb = $(`#or-expr .optk[data-i="${k}"]`); if (nb) nb.classList.add('bad');
  }
});
$('#or-hint').addEventListener('click', () => {
  if (OR.T.length === 1) return; OR.hints++; OR.hintSet = new Set(orCands(OR.T)); orRender();
  const m = $('#or-msg'); m.textContent = 'Las operaciones resaltadas son las que van ahora.'; m.className = 'msg info';
  clearTimeout(OR.ht); OR.ht = setTimeout(() => { OR.hintSet = new Set(); orRender(); }, 1800);
});
$('#or-reset').addEventListener('click', () => orInit(OR.i));
orInit(0);
