'use strict';
/* ---------- 5-3 varios pasos ---------- */
makeMulti($('#mp-root'), 'mp', [
  { v: 'x', tag: 'Distribuir y combinar · Examen 9.º', orig: '7x + 2(x + 6) = 39', pre: [{ label: 'Distribuir el 2', html: '7x + 2x + 12 = 39', why: 'Hay un paréntesis. Multiplica el 2 por cada término de adentro.' }, { label: 'Combinar términos semejantes', html: '9x + 12 = 39', why: 'Junta primero los términos con x que están del mismo lado.' }], a1: 9, b1: 12, a2: 0, b2: 39 },
  { v: 'x', tag: 'Fracción fuera del paréntesis · Examen 9.º', orig: fr(2, 5) + '(3x + 4) = 10', pre: [{ label: 'Distribuir ' + fr(2, 5), html: fr('6x', 5) + ' + ' + fr(8, 5) + ' = 10', why: 'Hay un paréntesis. Multiplica 2/5 por 3x y por 4.' }], a1: [6, 5], b1: [8, 5], a2: 0, b2: 10 },
  { v: 'y', tag: 'Letras en los dos lados · Examen 9.º', orig: '8y − 6 = ' + fr(2, 3) + '(6y + 15)', pre: [{ label: 'Distribuir ' + fr(2, 3), html: '8y − 6 = 4y + 10', why: 'Antes de mover letras, elimina el paréntesis.' }], a1: 8, b1: -6, a2: 4, b2: 10 },
  { v: 'x', tag: 'Letras en los dos lados · Examen 9.º', orig: '5x − 2 = 2(3x − 4)', pre: [{ label: 'Distribuir el 2', html: '5x − 2 = 6x − 8', why: 'Elimina el paréntesis primero.' }], a1: 5, b1: -2, a2: 6, b2: -8 },
  { v: 'x', tag: 'Fracción en el numerador · Examen 10.º', orig: fr('4x + 12', 2) + ' = 3x − 5', pre: [{ label: 'Dividir cada término entre 2', html: '2x + 6 = 3x − 5', why: 'La fracción divide a todo el numerador. Divide cada término entre 2.' }], a1: 2, b1: 6, a2: 3, b2: -5 },
  { v: 'x', tag: 'Desigualdad con letras en los dos lados · 5-3', orig: '3x + 2 ≤ 5x − 6', rel: '≤', pre: [], a1: 3, b1: 2, a2: 5, b2: -6 },
  { v: 'x', tag: 'Desigualdad con paréntesis · 5-3', orig: '4(x − 1) > 2x + 6', rel: '>', pre: [{ label: 'Distribuir el 4', html: '4x − 4 > 2x + 6', why: 'Elimina el paréntesis antes de juntar las letras.' }], a1: 4, b1: -4, a2: 2, b2: 6 }
]);
