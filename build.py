#!/usr/bin/env python3
"""Une css/ y js/ en un solo archivo: dist/taller-algebra.html (funciona sin carpetas)."""
import re, pathlib
root = pathlib.Path(__file__).parent
html = (root / 'index.html').read_text(encoding='utf8')
css = (root / 'css/styles.css').read_text(encoding='utf8')
html = re.sub(r'<link rel="stylesheet" href="css/styles.css">', lambda m: '<style>\n' + css + '\n</style>', html)
def inline(m):
    return '<script>\n' + (root / m.group(1)).read_text(encoding='utf8') + '\n</script>'
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline, html)
out = root / 'dist'; out.mkdir(exist_ok=True)
(out / 'taller-algebra.html').write_text(html, encoding='utf8')
print('Listo:', out / 'taller-algebra.html', len(html) // 1024, 'KB')
