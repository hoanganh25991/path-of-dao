#!/usr/bin/env python3
"""Generate Path of Dao app icons (PWA + Google Play hi-res).

Pixel-art cultivator + ancient sword on a void background, matching
sticky-man palettes from src/combat/art/stickyManPalette.ts.

Run:  python3 tools/gen-app-icon.py
Writes: public/favicon.ico, public/icons/icon-192.png, public/icons/icon-512.png
"""
import math
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'public', 'icons')

N = 64
T = (0, 0, 0, 0)


def rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


VOID_DARK = rgb('0a0a12')
VOID_MID = rgb('12182a')
VOID_GLOW = rgb('1a2840')
OUTLINE = rgb('0c0c14')
SKIN = rgb('ffd5a8')
FILL = rgb('b8c4d4')
SHADOW = rgb('687888')
GOLD = rgb('d4a840')
GOLD_HI = rgb('ffe878')
WHITE = rgb('fff8e8')
CYAN = rgb('3fd6e0')
HAIR = rgb('f0f4f8')
HAIR_SH = rgb('a8b4c4')
HAIR_HI = rgb('ffffff')


class Grid:
    def __init__(self, n=N):
        self.n = n
        self.d = [[T for _ in range(n)] for _ in range(n)]

    def px(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.n and 0 <= y < self.n and c[3]:
            self.d[y][x] = c

    def line(self, x0, y0, x1, y1, c, thick=1):
        steps = int(math.ceil(max(abs(x1 - x0), abs(y1 - y0), 1)))
        for i in range(steps + 1):
            t = i / steps
            x = x0 + (x1 - x0) * t
            y = y0 + (y1 - y0) * t
            o = thick // 2
            for ox in range(thick):
                for oy in range(thick):
                    self.px(x + ox - o, y + oy - o, c)

    def disc(self, cx, cy, r, fill, outline=None):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                dist = math.hypot(dx, dy)
                if dist <= r:
                    if outline and dist >= r - 0.8:
                        self.px(cx + dx, cy + dy, outline)
                    else:
                        self.px(cx + dx, cy + dy, fill)

    def rect(self, x0, y0, x1, y1, fill, outline=None):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                edge = x in (x0, x1) or y in (y0, y1)
                self.px(x, y, outline if (outline and edge) else fill)

    def ring(self, cx, cy, r, c, thick=1):
        for a in range(360):
            rad = math.radians(a)
            x = cx + math.cos(rad) * r
            y = cy + math.sin(rad) * r
            self.line(x, y, x, y, c, thick)

    def to_image(self):
        img = Image.new('RGBA', (self.n, self.n), T)
        for y in range(self.n):
            for x in range(self.n):
                img.putpixel((x, y), self.d[y][x])
        return img


def limb_end(ox, oy, angle_deg, length):
    r = math.radians(angle_deg)
    return ox + math.sin(r) * length, oy + math.cos(r) * length


def draw_background(g):
    """Radial void gradient with subtle dao ring."""
    cx, cy = g.n // 2, g.n // 2
    max_r = g.n * 0.72
    for y in range(g.n):
        for x in range(g.n):
            dist = math.hypot(x - cx, y - cy) / max_r
            if dist > 1:
                g.px(x, y, VOID_DARK)
            elif dist > 0.85:
                g.px(x, y, VOID_MID)
            elif dist > 0.55:
                g.px(x, y, VOID_GLOW)
            else:
                g.px(x, y, VOID_MID)

    g.ring(cx, cy, 26, GOLD, 1)
    g.ring(cx, cy, 24, SHADOW, 1)
    for angle in (0, 90, 180, 270):
        rad = math.radians(angle)
        x0 = cx + math.sin(rad) * 22
        y0 = cy - math.cos(rad) * 22
        x1 = cx + math.sin(rad) * 27
        y1 = cy - math.cos(rad) * 27
        g.line(x0, y0, x1, y1, GOLD_HI, 2)

    for sx, sy in ((10, 14), (52, 18), (14, 50), (48, 46), (32, 8), (8, 32)):
        g.px(sx, sy, CYAN)
        g.px(sx + 1, sy, CYAN)


def draw_hero_top_hair(g, cx, head_y, head_r):
    """White crown puff on top of head — short volume, no long trail."""
    for dy in range(-head_r - 3, -head_r):
        layer = dy + head_r + 3
        half_w = head_r + 1 - layer
        for dx in range(-half_w, half_w + 1):
            edge = abs(dx) == half_w or dy == -head_r - 3
            if edge:
                g.px(cx + dx, head_y + dy, OUTLINE)
            elif dx <= -1:
                g.px(cx + dx, head_y + dy, HAIR_SH)
            elif dx >= 1:
                g.px(cx + dx, head_y + dy, HAIR_HI)
            else:
                g.px(cx + dx, head_y + dy, HAIR)
    g.px(cx, head_y - head_r - 4, HAIR_HI)
    for dy in range(-head_r, 1):
        for dx in range(-head_r, head_r + 1):
            if dx * dx + dy * dy > head_r * head_r:
                continue
            if dx >= 2 and dy >= -2:
                continue
            if dy > -1 and abs(dx) > 2:
                continue
            g.px(cx + dx, head_y + dy, HAIR if dx >= -1 else HAIR_SH)


def sticky_man(g, cx=32, top=14):
    """Hero cultivator facing right, holding ancient sword."""
    head_r = 5
    head_y = top + head_r
    shoulder_y = head_y + head_r + 2
    hip_y = shoulder_y + 12

    for sign, fill in ((-1, SHADOW), (1, FILL)):
        hx = cx + sign * 3
        knee = limb_end(hx, hip_y, sign * 10, 10)
        foot = limb_end(knee[0], knee[1], sign * 6, 12)
        g.line(hx, hip_y, knee[0], knee[1], OUTLINE, 4)
        g.line(hx, hip_y, knee[0], knee[1], fill, 2)
        g.line(knee[0], knee[1], foot[0], foot[1], OUTLINE, 4)
        g.line(knee[0], knee[1], foot[0], foot[1], fill, 2)

    bk = limb_end(cx - 4, shoulder_y, -22, 8)
    g.line(cx - 4, shoulder_y, bk[0], bk[1], OUTLINE, 4)
    g.line(cx - 4, shoulder_y, bk[0], bk[1], SKIN, 2)

    g.rect(cx - 4, shoulder_y, cx + 4, hip_y, FILL, OUTLINE)
    g.line(cx - 4, hip_y - 2, cx + 4, hip_y - 2, GOLD, 2)

    fr = limb_end(cx + 4, shoulder_y, 35, 10)
    g.line(cx + 4, shoulder_y, fr[0], fr[1], OUTLINE, 4)
    g.line(cx + 4, shoulder_y, fr[0], fr[1], SKIN, 2)
    tip = limb_end(fr[0], fr[1], 28, 18)
    g.line(fr[0], fr[1], tip[0], tip[1], GOLD, 3)
    g.line(fr[0], fr[1], tip[0], tip[1], GOLD_HI, 1)
    g.px(tip[0], tip[1], WHITE)

    for i in range(12):
        a = math.radians(20 + i * 4)
        sx = tip[0] + math.cos(a) * (3 + i * 0.4)
        sy = tip[1] - math.sin(a) * (3 + i * 0.4)
        g.px(sx, sy, CYAN if i % 3 else WHITE)

    g.disc(cx, head_y, head_r, SKIN, OUTLINE)
    band_y = head_y - 2
    for dx in range(-3, 4):
        g.px(cx + dx, band_y, GOLD if dx != 0 else GOLD_HI)
    draw_hero_top_hair(g, cx, head_y, head_r)
    g.px(cx + 2, head_y - 1, OUTLINE)
    g.px(cx + 1, head_y - 1, WHITE)


def build_icon():
    g = Grid()
    draw_background(g)
    sticky_man(g)
    return g.to_image()


def save_icons():
    os.makedirs(OUT_DIR, exist_ok=True)
    src = build_icon()
    src.resize((512, 512), Image.NEAREST).save(
        os.path.join(OUT_DIR, 'icon-512.png'), 'PNG', optimize=True)
    src.resize((192, 192), Image.NEAREST).save(
        os.path.join(OUT_DIR, 'icon-192.png'), 'PNG', optimize=True)
    src.resize((32, 32), Image.NEAREST).save(
        os.path.join(ROOT, 'public', 'favicon.ico'), format='ICO')
    print(f'Wrote {OUT_DIR}/icon-512.png (512×512)')
    print(f'Wrote {OUT_DIR}/icon-192.png (192×192)')
    print(f'Wrote {ROOT}/public/favicon.ico (32×32)')


if __name__ == '__main__':
    save_icons()
