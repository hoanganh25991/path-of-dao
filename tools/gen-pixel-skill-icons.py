#!/usr/bin/env python3
"""Generate pixel-art icons for the Path of Dao pixel-art skills.

Drawn at the game's native 32x32 frame with hard-edged primitives (mirroring
src/combat/art/stickyManDraw.ts), then nearest-neighbor upscaled to 256x256 so
the output is genuine pixel art. Uses the project's hero/enemy palettes.

Run:  python3 tools/gen-pixel-skill-icons.py
Writes icon.png into each target skill folder under .cursor/skills/.
"""
import math
import os
from PIL import Image

N = 32          # native pixel-art canvas (matches FRAME_W)
SCALE = 8       # -> 256x256 output

# --- Path of Dao palette (from src/combat/art/stickyManPalette.ts) ---
T = (0, 0, 0, 0)
def rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)

OUTLINE  = rgb('0c0c14')
SKIN     = rgb('ffd5a8')
FILL     = rgb('2a8a6a')   # hero teal
SHADOW   = rgb('1a5a48')
GOLD     = rgb('e8b830')
WHITE    = rgb('fff8e8')
RED      = rgb('ff5038')
CYAN     = rgb('3fd6e0')
GREEN    = rgb('52c452')
GREY     = rgb('9898a8')
PANEL    = rgb('22202e')


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
                    if outline and dist >= r - 0.7:
                        self.px(cx + dx, cy + dy, outline)
                    else:
                        self.px(cx + dx, cy + dy, fill)

    def rect(self, x0, y0, x1, y1, fill, outline=None):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                edge = x in (x0, x1) or y in (y0, y1)
                self.px(x, y, outline if (outline and edge) else fill)

    def save(self, path):
        img = Image.new('RGBA', (self.n, self.n), T)
        for y in range(self.n):
            for x in range(self.n):
                img.putpixel((x, y), self.d[y][x])
        img = img.resize((self.n * SCALE, self.n * SCALE), Image.NEAREST)
        img.save(path)


def limb_end(ox, oy, angle_deg, length):
    r = math.radians(angle_deg)
    return ox + math.sin(r) * length, oy + math.cos(r) * length


def sticky_man(g, cx=16, top=4, palette=None, sword=True, motion=False):
    """Draw a mini sticky-man (right-facing) reusing the game's rig logic."""
    p = palette or dict(out=OUTLINE, skin=SKIN, fill=FILL, sh=SHADOW, acc=GOLD, hi=WHITE)
    head_r = 3
    head_y = top + head_r
    shoulder_y = head_y + head_r + 2
    hip_y = shoulder_y + 8
    foot_y = 29

    if motion:  # speed streaks behind
        for i, x in enumerate((cx - 8, cx - 10, cx - 12)):
            g.line(x, shoulder_y + 1 + i * 3, x + 3, shoulder_y + 1 + i * 3, p['sh'], 1)

    # legs (2-segment)
    for sign, fill in ((-1, p['sh']), (1, p['fill'])):
        hx = cx + sign * 2
        knee = limb_end(hx, hip_y, sign * (18 if motion else 8), (foot_y - hip_y) * 0.5)
        foot = limb_end(knee[0], knee[1], sign * (10 if motion else 4), (foot_y - hip_y) * 0.5)
        g.line(hx, hip_y, knee[0], knee[1], p['out'], 3); g.line(hx, hip_y, knee[0], knee[1], fill, 1)
        g.line(knee[0], knee[1], foot[0], foot[1], p['out'], 3); g.line(knee[0], knee[1], foot[0], foot[1], fill, 1)

    # back arm
    bk = limb_end(cx - 3, shoulder_y, -35 if motion else -18, 5)
    g.line(cx - 3, shoulder_y, bk[0], bk[1], p['out'], 3); g.line(cx - 3, shoulder_y, bk[0], bk[1], p['skin'], 1)

    # torso + sash
    g.rect(cx - 2, shoulder_y, cx + 2, hip_y, p['fill'], p['out'])
    g.line(cx - 2, hip_y - 1, cx + 2, hip_y - 1, p['acc'])

    # front arm (holds sword)
    fr = limb_end(cx + 3, shoulder_y, 40 if motion else 30, 6)
    g.line(cx + 3, shoulder_y, fr[0], fr[1], p['out'], 3); g.line(cx + 3, shoulder_y, fr[0], fr[1], p['skin'], 1)
    if sword:
        tip = limb_end(fr[0], fr[1], 30, 9)
        g.line(fr[0], fr[1], tip[0], tip[1], p['acc'], 2)
        g.px(tip[0], tip[1], p['hi'])

    # head + eye
    g.disc(cx, head_y, head_r, p['skin'], p['out'])
    g.px(cx + 2, head_y - 1, p['out'])
    g.px(cx + 1, head_y - 1, p['hi'])


def icon_character():
    g = Grid()
    sticky_man(g, sword=True)
    return g


def icon_animation():
    g = Grid()
    # film strip band with sprocket holes
    g.rect(2, 6, 29, 25, PANEL, OUTLINE)
    for x in range(4, 29, 4):
        g.rect(x, 7, x + 1, 8, GREY)
        g.rect(x, 23, x + 1, 24, GREY)
    # running sticky-man in the frame
    p = dict(out=OUTLINE, skin=SKIN, fill=FILL, sh=SHADOW, acc=GOLD, hi=WHITE)
    sticky_man(g, cx=14, top=9, palette=p, sword=False, motion=True)
    # play triangle badge (bottom-right)
    for dy in range(-3, 4):
        w = 3 - abs(dy)
        for dx in range(w + 1):
            g.px(24 + dx, 27 + dy, GOLD)
    return g


def icon_vfx():
    g = Grid()
    # diagonal slash crescent: quarter-arc from top-right sweeping to bottom-left,
    # thick in the middle, tapered ends -> reads as a sword swing.
    cx, cy, r = 6, 6, 22   # arc centered off top-left corner
    for i in range(0, 60):
        a = math.radians(8 + i * (74 / 60))   # 8deg..82deg
        x = cx + math.cos(a) * r
        y = cy + math.sin(a) * r
        taper = math.sin(i / 59 * math.pi)     # 0..1..0
        th = 1 + int(round(taper * 2))
        g.line(x, y, x, y, CYAN, th + 1)
        g.px(x, y, WHITE)
        if taper > 0.4:
            g.px(x - 1, y - 1, WHITE)
    # sparks flying off the leading (bottom-left) tip
    for (sx, sy, c) in [(4, 24, GOLD), (7, 27, WHITE), (10, 26, CYAN), (26, 6, WHITE), (23, 4, GOLD)]:
        g.px(sx, sy, c); g.px(sx + 1, sy, c); g.px(sx, sy + 1, c)
    # 4-point starburst at the impact point (mid-arc)
    ix, iy = 18, 18
    g.line(ix - 4, iy, ix + 4, iy, WHITE); g.line(ix, iy - 4, ix, iy + 4, WHITE)
    g.line(ix - 2, iy - 2, ix + 2, iy + 2, GOLD); g.line(ix - 2, iy + 2, ix + 2, iy - 2, GOLD)
    return g


def icon_director():
    g = Grid()
    # palette ramp of swatches (the shading ramp) in a frame
    g.rect(4, 5, 27, 26, PANEL, OUTLINE)
    ramp = [SHADOW, FILL, GREEN, WHITE]
    for i, c in enumerate(ramp):
        y0 = 7 + i * 5
        g.rect(6, y0, 15, y0 + 3, c, OUTLINE)
    # accent chips
    g.rect(18, 7, 25, 12, GOLD, OUTLINE)
    g.rect(18, 14, 25, 19, RED, OUTLINE)
    g.rect(18, 21, 25, 24, CYAN, OUTLINE)
    return g


def icon_review():
    g = Grid()
    # pixel grid being inspected
    for gy in range(0, 4):
        for gx in range(0, 4):
            c = [SHADOW, FILL, SKIN, GOLD][(gx + gy) % 4]
            g.rect(4 + gx * 4, 4 + gy * 4, 4 + gx * 4 + 3, 4 + gy * 4 + 3, c)
    # magnifying glass
    g.disc(20, 18, 6, T, OUTLINE)
    g.disc(20, 18, 5, T, GREY)
    g.disc(20, 18, 4, (63, 214, 224, 90))  # faint cyan lens tint
    g.line(24, 22, 29, 27, OUTLINE, 3)
    g.line(24, 22, 29, 27, GREY, 1)
    # green check
    g.line(8, 26, 11, 29, GREEN, 2)
    g.line(11, 29, 16, 22, GREEN, 2)
    return g


ICONS = {
    'pixel-character': icon_character,
    'sprite-animation': icon_animation,
    'vfx-particles': icon_vfx,
    'pixel-art-director': icon_director,
    'pixel-art-review': icon_review,
}


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.dirname(here)
    skills = os.path.join(root, '.cursor', 'skills')
    for name, fn in ICONS.items():
        out = os.path.join(skills, name, 'icon.png')
        fn().save(out)
        print('wrote', os.path.relpath(out, root))


if __name__ == '__main__':
    main()
