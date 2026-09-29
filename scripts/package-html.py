"""Inline the Vite production bundle into a network-free, portable game file."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
html = (root / 'dist/index.html').read_text()
script = re.search(r'<script[^>]+src="([^"]+)"[^>]*></script>', html)
js = (root / 'dist' / script.group(1).lstrip('/')).read_text()
html = html[:script.start()] + html[script.end():]
styles = []
for link in re.findall(r'<link[^>]+href="[^"]+\.css"[^>]*>', html):
    path = re.search(r'href="([^"]+)"', link).group(1)
    css = (root / 'dist' / path.lstrip('/')).read_text()
    # URLs can contain semicolons (Google Fonts weights), so match quoted URLs.
    css = re.sub(r'''@import\s*(?:url\([^)]*\)|"[^"]*"|'[^']*')\s*;''', '', css)
    styles.append(css)
    html = html.replace(link, '')
html = html.replace('</head>', '<style>' + ''.join(styles) + '</style></head>')
html = html.replace('</body>', '<script type="module">' + js.replace('</script', '<\\/script') + '</script></body>')
(root / 'HELLBOUND.html').write_text(html)
print(f'Self-contained game: HELLBOUND.html ({len(html.encode()):,} bytes)')
