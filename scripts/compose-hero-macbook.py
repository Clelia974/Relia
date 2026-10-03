"""
Compose public/mockups/hero-macbook.png : une VRAIE capture de SilkyPlace dans le cadre MacBook.
Usage : python3 scripts/compose-hero-macbook.py [capture.jpg]   (par défaut public/landing/moodboard.jpg)
L'écran est repéré automatiquement : c'est la zone transparente (alpha = 0) au centre du cadre macbook-pro-16.png.
"""
import sys
from collections import deque
import numpy as np
from PIL import Image

shot_path = sys.argv[1] if len(sys.argv) > 1 else 'public/landing/moodboard.jpg'
frame = Image.open('public/mockups/macbook-pro-16.png').convert('RGBA')
a = np.array(frame)
h, w = a.shape[:2]
hole = a[..., 3] == 0
seen = np.zeros_like(hole)
start = (w // 2, h // 2 - 40)
q = deque([start])
seen[start[1], start[0]] = True
while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and hole[ny, nx] and not seen[ny, nx]:
            seen[ny, nx] = True
            q.append((nx, ny))
ys, xs = np.where(seen)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
sw, sh = x1 - x0 + 1, y1 - y0 + 1

shot = Image.open(shot_path).convert('RGBA')
scale = sw / shot.width
shot = shot.resize((sw, round(shot.height * scale)), Image.LANCZOS).crop((0, 0, sw, sh))

screen = Image.new('RGBA', frame.size, (0, 0, 0, 0))
screen.paste(shot, (x0, y0))
sa = np.array(screen)
sa[..., 3] = np.where(seen, sa[..., 3], 0)  # on respecte les coins arrondis de l'écran
out = Image.alpha_composite(Image.fromarray(sa), frame)
out.save('public/mockups/hero-macbook.png', optimize=True)
print('écran', sw, 'x', sh, 'à', (x0, y0), '->', 'public/mockups/hero-macbook.png')
