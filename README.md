# Taller de Álgebra

Misiones interactivas de álgebra (11 temas) con práctica de 36 ejercicios por misión, más un repaso general ("Repaso 1") que mezcla los temas 1 a 6.

## Cómo usarlo
Abre `index.html` con doble clic en cualquier navegador. No necesita internet (salvo las fuentes de Google, que son opcionales) ni instalar nada.
El avance y los XP se guardan en el navegador (localStorage). El botón "Reiniciar todo" del menú los borra.

## Estructura
- `index.html`: todo el contenido (textos y estructura) de las 11 misiones.
- `css/styles.css`: estilos.
- `js/`: lógica. Son scripts clásicos que comparten variables; **el orden de carga en `index.html` importa**.
  - `00-core.js` utilidades, fracciones exactas, XP, menú, pestañas
  - `10`–`43`: una misión por archivo (funciones, ecuaciones, desigualdades, varios pasos, pendiente, estándar, rectas, orden, exponentes, conjuntos, racionales)
  - `60-practice-banks.js`: generadores de los 36 ejercicios de cada misión (semilla fija: salen siempre los mismos)
  - `61-practice-ui.js`: pantalla de práctica
  - `50-reset.js`: botón de reiniciar
- `build.py`: `python3 build.py` crea `dist/taller-algebra.html`, un solo archivo para compartir.

## Para modificar
- Cambiar cantidad o tipo de ejercicios: edita la función `bankXxx` en `60-practice-banks.js` (la lista `prBuild(r, [[cantidad, generador], ...])`).
- Cambiar semilla (otros números): los `prRng(1101)` al final de ese archivo.
- Una misión nueva: añade su `<section>` en `index.html`, su pestaña, su entrada en `MENU` y `TABS` (`00-core.js`) y un banco en `BANKS`.
