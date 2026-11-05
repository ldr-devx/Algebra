'use strict';
/* ---------- reiniciar todo ---------- */
$('#reset-ask').addEventListener('click', () => { $('#reset-box').hidden = false; $('#reset-msg').textContent = ''; });
$('#reset-no').addEventListener('click', () => { $('#reset-box').hidden = true; });
$('#reset-yes').addEventListener('click', () => {
  try { localStorage.removeItem(PROG_KEY); localStorage.removeItem(XP_KEY); } catch (e) {}
  const m = $('#reset-msg'); m.textContent = 'Avances borrados. Empezando de cero…'; m.className = 'msg ok';
  try { location.hash = 'inicio'; } catch (e) {}
  setTimeout(() => { try { location.reload(); } catch (e) {} }, 350);
  setTimeout(() => { m.textContent = 'Avances borrados. Si no ves todo en cero, recarga la página.'; }, 2500);
});
renderMenu();
