#!/usr/bin/env python3
"""Create a static GitHub Pages bundle (does not publish backend scripts)."""
from pathlib import Path
import shutil
root = Path(__file__).resolve().parents[1]
out = root / 'site'
if out.exists():
    shutil.rmtree(out)
(out / 'data').mkdir(parents=True)
for name in ('index.html', 'styles.css', 'app.js'):
    shutil.copy2(root/name, out/name)
shutil.copy2(root/'data'/'snapshot.json', out/'data'/'snapshot.json')
print('Built public SIMVERSE site:', out)
