# Renders the launcher icons and splash logo from the brand mark: white "PG" in
# Urbanist Bold on the brand purple tile (as in src/components/AuthShell.js).
# Run from the app folder after changing the brand colour: python3 scripts/make-icons.py
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BRAND = '#9d00ff'  # colors.primary in src/components/tokens.js
FONT = 'node_modules/@expo-google-fonts/urbanist/700Bold/Urbanist_700Bold.ttf'
RES = Path('android/app/src/main/res')
DENSITIES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
SS = 4  # draw large, then downsample for smooth edges


def text(draw, size, center, height):
    font = ImageFont.truetype(FONT, round(height))
    draw.text(center, 'PG', font=font, fill='white', anchor='mm')


def tile(px, shape='rounded', inset=0.0):
    """The mark at px x px. inset is the transparent margin as a fraction of px."""
    s = px * SS
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    m = round(s * inset)
    box = (m, m, s - m, s - m)
    if shape == 'round':
        d.ellipse(box, fill=BRAND)
    elif shape == 'rounded':
        d.rounded_rectangle(box, radius=(s - 2 * m) / 3.2, fill=BRAND)
    else:
        d.rectangle(box, fill=BRAND)
    text(d, s, (s / 2, s / 2), (s - 2 * m) * 15 / 36)
    return im.resize((px, px), Image.LANCZOS)


def foreground(px):
    """Adaptive-icon foreground: 108dp canvas, glyph sized to the 66dp safe zone."""
    s = px * SS
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    text(ImageDraw.Draw(im), s, (s / 2, s / 2), s * 66 / 108 * 15 / 36 * 1.35)
    return im.resize((px, px), Image.LANCZOS)


def splash(px):
    """Splash logo canvas (white background comes from colors.xml); tile is ~40% of it."""
    im = Image.new('RGBA', (px, px), (0, 0, 0, 0))
    t = tile(round(px * 0.4))
    im.paste(t, ((px - t.width) // 2, (px - t.height) // 2), t)
    return im


for name, k in DENSITIES.items():
    folder = RES / f'mipmap-{name}'
    tile(round(48 * k), 'rounded', inset=4 / 48).save(folder / 'ic_launcher.webp', lossless=True)
    tile(round(48 * k), 'round', inset=2 / 48).save(folder / 'ic_launcher_round.webp', lossless=True)
    foreground(round(108 * k)).save(folder / 'ic_launcher_foreground.webp', lossless=True)
    splash(round(288 * k)).save(RES / f'drawable-{name}' / 'splashscreen_logo.png', optimize=True)

Path('assets').mkdir(exist_ok=True)
tile(1024, 'square').save('assets/icon.png', optimize=True)
foreground(1024).save('assets/adaptive-icon.png', optimize=True)
print('icons written')
