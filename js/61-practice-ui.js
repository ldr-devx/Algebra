'use strict';
/* ======================================================
   INTERFAZ DE PRÁCTICA
   Una tarjeta por misión (<div class="card practice" id="pr-KEY">).
   Los ejercicios resueltos se guardan con regSet('pr-KEY').
   ====================================================== */
const PR = {};
function initPractice(key) {
  const root = $('#pr-' + key), bank = BANKS[key];
  if (!root || !bank) return;
  const solved = regSet('pr-' + key);
  let cur = 0, shown = false;
  root.innerHTML = `
    <h3>Práctica · ${bank.length} ejercicios</h3>
    <p class="muted" style="margin-bottom:10px">Resueltos: <b class="pr-count"></b>. Cada uno vale +2 XP la primera vez.</p>
    <div class="pr-chips" role="tablist"></div>
    <div class="pr-body">
      <div class="pr-q"></div>
      <div class="pr-in"></div>
      <div class="row pr-act">
        <button class="btn pr-check">Comprobar</button>
        <button class="btn ghost pr-sol">Ver solución</button>
        <button class="btn ghost pr-prev" aria-label="Anterior">←</button>
        <button class="btn ghost pr-next" aria-label="Siguiente">→</button>
      </div>
      <p class="msg pr-msg" aria-live="polite"></p>
    </div>`;
  const chips = $('.pr-chips', root), qEl = $('.pr-q', root), inEl = $('.pr-in', root), msg = $('.pr-msg', root), cnt = $('.pr-count', root);
  chips.innerHTML = bank.map((_, i) => `<button class="pr-chip" data-i="${i}">${i + 1}</button>`).join('');
  const setMsg = (t, c) => { msg.textContent = t; msg.className = 'msg pr-msg ' + (c || ''); };
  function paintChips() {
    $$('.pr-chip', root).forEach((b, i) => { b.classList.toggle('done', solved.has(i)); b.classList.toggle('cur', i === cur); });
    cnt.textContent = solved.size + ' de ' + bank.length;
  }
  function show(i) {
    cur = Math.max(0, Math.min(bank.length - 1, i)); shown = false;
    const ex = bank[cur];
    qEl.innerHTML = `<span class="pr-n">${cur + 1}.</span> ${ex.q}`;
    if (ex.choices) {
      inEl.innerHTML = '<div class="pr-choices">' + ex.choices.map((c, k) => `<button class="btn ghost pr-opt" data-k="${k}">${c}</button>`).join('') + '</div>';
      $$('.pr-opt', inEl).forEach(b => b.addEventListener('click', () => { $$('.pr-opt', inEl).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); inEl.dataset.sel = b.dataset.k; }));
      inEl.dataset.sel = '';
    } else {
      inEl.innerHTML = '<div class="row">' + ex.fields.map((f, k) => `<label class="pr-f">${f.label ? `<span>${f.label}</span>` : ''}<input type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${f.ph || ''}" data-k="${k}"></label>`).join('') + '</div>';
      $$('input', inEl).forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') check(); }));
    }
    setMsg(solved.has(cur) ? 'Ya lo resolviste. Puedes repetirlo o pasar al siguiente.' : '', solved.has(cur) ? 'ok' : '');
    paintChips();
  }
  function values() { const ex = bank[cur]; return ex.choices ? [inEl.dataset.sel] : $$('input', inEl).map(i => i.value); }
  function check() {
    const ex = bank[cur], v = values();
    if (ex.choices ? v[0] === '' : v.every(x => !String(x).trim())) { setMsg('Escribe o elige una respuesta primero.', 'bad'); return; }
    const res = ex.check(v);
    if (res.ok) {
      const first = !solved.has(cur);
      solved.add(cur);
      setMsg((shown ? 'Correcto, pero ya viste la solución. ' : '') + res.msg + (first && !shown ? ' +2 XP' : ''), 'ok');
      if (first && !shown) addXP(2);
      paintChips();
    } else setMsg(res.msg, 'bad');
  }
  $('.pr-check', root).addEventListener('click', check);
  $('.pr-sol', root).addEventListener('click', () => {
    const ex = bank[cur]; shown = true;
    setMsg('Respuesta: ' + ex.canon + '. ' + ex.expl.replace(/<[^>]+>/g, ''), '');
  });
  $('.pr-prev', root).addEventListener('click', () => show(cur - 1));
  $('.pr-next', root).addEventListener('click', () => show(cur + 1));
  chips.addEventListener('click', e => { const b = e.target.closest('.pr-chip'); if (b) show(+b.dataset.i); });
  const first = bank.findIndex((_, i) => !solved.has(i));
  show(first < 0 ? 0 : first);
  PR[key] = { bank, solved, show, check, values: () => values() };
}
Object.keys(BANKS).forEach(initPractice);

/* sumar la práctica al avance del menú */
MENU.forEach(m => {
  const g = m.get, n = BANKS[m.tab].length;
  m.tot += n; m.get = () => g() + psz('pr-' + m.tab);
});
renderMenu();
