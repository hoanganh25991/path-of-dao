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
BLUE     = rgb('3a7bd5')   # mana
WATER    = rgb('2a4d8a')
BROWN    = rgb('8a5a2a')   # dirt / path
PARCH    = rgb('e8d8a8')   # parchment
GEM      = rgb('b060e0')   # loot gem
SILVER   = rgb('c4c4d4')   # sword / metal
STONE    = rgb('686878')   # totem boss
EMBER    = rgb('ffb060')


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


def chibi_head(g, cx, cy, r, skin, eye=True):
    g.disc(cx, cy, r, skin, OUTLINE)
    if eye:
        g.px(cx + r - 1, cy - 1, OUTLINE)
        g.px(cx + r - 2, cy - 1, WHITE)


def icon_character_designer():
    g = Grid()
    # two heads = the cast/roster (hero + enemy)
    chibi_head(g, 12, 14, 5, SKIN)
    chibi_head(g, 21, 18, 5, GREEN)
    # tiny shoulders under each
    g.rect(9, 20, 15, 24, FILL, OUTLINE)
    g.rect(18, 24, 24, 27, SHADOW, OUTLINE)
    return g


def icon_vfx_artist():
    g = Grid()
    cx, cy = 16, 16
    for k in range(8):
        a = math.radians(k * 45)
        x2 = cx + math.cos(a) * 12
        y2 = cy + math.sin(a) * 12
        col = GOLD if k % 2 else RED
        g.line(cx, cy, x2, y2, col, 2)
    g.disc(cx, cy, 4, GOLD, RED)
    g.disc(cx, cy, 2, WHITE)
    for (sx, sy) in [(6, 6), (26, 7), (7, 25), (25, 26)]:
        g.px(sx, sy, WHITE); g.px(sx + 1, sy, GOLD)
    return g


def icon_hud_ui():
    g = Grid()
    g.rect(3, 5, 28, 26, PANEL, OUTLINE)
    # HP bar (full red) + MP bar (~60% blue)
    g.rect(6, 8, 25, 11, OUTLINE)
    g.rect(7, 9, 24, 10, RED)
    g.rect(6, 13, 25, 16, OUTLINE)
    g.rect(7, 14, 17, 15, BLUE)
    # round action button
    g.disc(11, 22, 4, FILL, OUTLINE); g.px(11, 22, WHITE)
    g.disc(22, 22, 4, GOLD, OUTLINE)
    return g


def icon_asset_pipeline():
    g = Grid()
    # crate
    g.rect(3, 11, 13, 22, BROWN, OUTLINE)
    g.line(3, 11, 13, 22, OUTLINE, 1); g.line(13, 11, 3, 22, OUTLINE, 1)
    # arrow
    g.rect(14, 15, 22, 17, GOLD)
    for dy in range(-3, 4):
        w = 3 - abs(dy)
        for dx in range(w + 1):
            g.px(22 + dx, 16 + dy, GOLD)
    # output layer stack
    for i, c in enumerate((SHADOW, FILL, WHITE)):
        g.rect(25, 10 + i * 4, 30, 12 + i * 4, c, OUTLINE)
    return g


def icon_audio_director():
    g = Grid()
    # eighth note
    g.disc(11, 23, 4, PANEL, OUTLINE)
    g.rect(14, 8, 15, 23, OUTLINE)
    g.rect(15, 8, 16, 9, OUTLINE)
    g.line(16, 8, 21, 12, OUTLINE, 2)  # flag
    # sound waves
    for r in (5, 8, 11):
        for k in range(-3, 4):
            a = math.radians(k * 12)
            g.px(21 + math.cos(a) * r, 16 + math.sin(a) * r, CYAN if r < 9 else GREY)
    return g


def icon_boss_designer():
    g = Grid()
    # totem head (stone) + crown + ember eyes
    g.rect(8, 12, 23, 27, STONE, OUTLINE)
    g.rect(8, 24, 23, 27, SHADOW)
    # eyes
    g.rect(11, 16, 13, 18, RED); g.rect(18, 16, 20, 18, RED)
    g.px(11, 16, EMBER); g.px(18, 16, EMBER)
    # mouth
    g.line(12, 22, 19, 22, OUTLINE, 1)
    # crown
    for cxp in (9, 15, 22):
        for dy in range(4):
            w = 3 - dy
            for dx in range(-w // 1, 1):
                g.px(cxp + dx, 11 - dy, GOLD)
            g.px(cxp, 11 - dy, GOLD)
    g.rect(8, 10, 23, 11, GOLD)
    return g


def icon_camera_director():
    g = Grid()
    # viewfinder corner brackets
    for (cxp, cyp, sx, sy) in [(5, 5, 1, 1), (26, 5, -1, 1), (5, 26, 1, -1), (26, 26, -1, -1)]:
        g.line(cxp, cyp, cxp + sx * 6, cyp, WHITE, 2)
        g.line(cxp, cyp, cxp, cyp + sy * 6, WHITE, 2)
    # reticle
    g.disc(16, 16, 4, T, GOLD)
    g.line(16, 9, 16, 23, GOLD, 1); g.line(9, 16, 23, 16, GOLD, 1)
    g.px(16, 16, RED)
    return g


def icon_combat_designer():
    g = Grid()
    # crossed swords
    for (x0, y0, x1, y1) in [(6, 26, 24, 6), (26, 26, 8, 6)]:
        g.line(x0, y0, x1, y1, OUTLINE, 3)
        g.line(x0, y0, x1, y1, SILVER, 1)
        g.px(x1, y1, WHITE)
    # guards + hilts
    g.line(4, 24, 9, 28, GOLD, 2)
    g.line(28, 24, 23, 28, GOLD, 2)
    return g


def icon_ecs():
    g = Grid()
    nodes = [(8, 9), (24, 12), (15, 25)]
    cols = [FILL, GOLD, CYAN]
    for (a, b) in [(0, 1), (1, 2), (0, 2)]:
        g.line(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], GREY, 1)
    for (n, c) in zip(nodes, cols):
        g.rect(n[0] - 3, n[1] - 3, n[0] + 3, n[1] + 3, c, OUTLINE)
    return g


def icon_enemy_designer():
    g = Grid()
    # slime blob
    for dy in range(-8, 9):
        for dx in range(-11, 12):
            if (dx * dx) / 130 + (dy * dy) / 70 <= 1:
                edge = (dx * dx) / 150 + (dy * dy) / 82 > 0.8
                g.px(16 + dx, 20 + dy, OUTLINE if edge else (SHADOW if dx < -2 else GREEN))
    g.disc(12, 18, 2, WHITE, OUTLINE); g.px(12, 18, OUTLINE)
    g.disc(20, 18, 2, WHITE, OUTLINE); g.px(20, 18, OUTLINE)
    g.px(14, 13, rgb('c8ff90'))
    return g


def icon_game_balance():
    g = Grid()
    g.rect(15, 6, 17, 26, BROWN, OUTLINE)      # post
    g.rect(9, 25, 23, 28, BROWN, OUTLINE)      # base
    g.line(6, 10, 26, 10, GOLD, 2)             # beam
    g.px(16, 8, GOLD)
    for px_ in (6, 26):                          # pans
        g.line(px_, 10, px_ - 3, 16, GREY, 1)
        g.line(px_, 10, px_ + 3, 16, GREY, 1)
        g.rect(px_ - 4, 16, px_ + 4, 18, SILVER, OUTLINE)
    return g


def icon_game_designer():
    g = Grid()
    # gamepad
    g.rect(4, 12, 27, 24, PANEL, OUTLINE)
    g.disc(6, 24, 3, PANEL, OUTLINE)
    g.disc(25, 24, 3, PANEL, OUTLINE)
    # dpad
    g.rect(8, 17, 13, 19, GREY); g.rect(9, 15, 11, 21, GREY)
    # buttons
    g.disc(21, 16, 1, RED); g.disc(24, 19, 1, GOLD)
    g.disc(21, 19, 1, GREEN); g.disc(18, 19, 1, CYAN)
    return g


def icon_level_designer():
    g = Grid()
    tiles = [
        "gggg",
        "gbbg",
        "ggbg",
        "gggg",
    ]
    cmap = {'g': FILL, 'b': BROWN}
    for ty, row in enumerate(tiles):
        for tx, ch in enumerate(row):
            x0, y0 = 4 + tx * 6, 4 + ty * 6
            g.rect(x0, y0, x0 + 5, y0 + 5, cmap[ch], SHADOW)
    return g


def icon_loot_economy():
    g = Grid()
    # coin
    g.disc(11, 20, 6, GOLD, rgb('a87a10'))
    g.disc(11, 20, 3, EMBER)
    g.px(11, 17, WHITE)
    # gem
    for dy in range(-4, 5):
        w = 4 - abs(dy)
        for dx in range(-w, w + 1):
            g.px(22 + dx, 13 + dy, GEM)
    g.line(18, 13, 22, 9, OUTLINE, 1); g.line(26, 13, 22, 9, OUTLINE, 1)
    g.px(21, 11, WHITE)
    return g


def icon_npc_dialogue():
    g = Grid()
    g.rect(4, 6, 27, 20, PARCH, OUTLINE)
    # tail
    g.line(9, 20, 7, 26, OUTLINE, 1); g.line(14, 20, 9, 26, OUTLINE, 1)
    g.rect(9, 21, 13, 24, PARCH)
    # text dots
    for dx in (0, 6, 12):
        g.rect(9 + dx, 12, 12 + dx, 14, FILL)
    return g


def icon_procedural_world():
    g = Grid()
    g.rect(2, 2, 29, 29, WATER)                # sky/water bg
    g.disc(25, 8, 3, GOLD)                      # sun
    for y in range(18, 30):                     # ground
        for x in range(2, 30):
            g.px(x, y, FILL if (x + y) % 5 else SHADOW)
    # tree
    g.rect(9, 20, 10, 26, BROWN)
    for dy in range(-4, 2):
        w = 4 + dy // 2
        for dx in range(-4, 5):
            if abs(dx) <= 4 - abs(dy):
                g.px(10 + dx, 18 + dy, GREEN)
    g.px(11, 15, rgb('c8ff90'))
    return g


def icon_quest_writer():
    g = Grid()
    g.rect(7, 5, 24, 27, PARCH, rgb('b89a5a'))
    # rolled ends
    g.rect(5, 5, 8, 27, BROWN, OUTLINE)
    g.rect(23, 5, 26, 27, BROWN, OUTLINE)
    # gold "!" quest marker
    g.rect(14, 9, 16, 18, GOLD)
    g.rect(14, 20, 16, 22, GOLD)
    return g


def icon_shader_expert():
    g = Grid()
    bands = [rgb('6a48a0'), rgb('3a7bd5'), CYAN, GREEN, GOLD, RED]
    bh = 32 // len(bands)
    for i, c in enumerate(bands):
        g.rect(2, 2 + i * bh, 29, 2 + i * bh + bh - 1, c)
    # sine wave overlay
    for x in range(2, 30):
        y = 16 + math.sin((x - 2) / 4) * 7
        g.px(x, y, WHITE); g.px(x, y + 1, OUTLINE)
    return g


def icon_threejs_game():
    g = Grid()
    # isometric cube
    top = [(16, 5), (27, 11), (16, 17), (5, 11)]
    # fill faces
    for y in range(5, 28):
        for x in range(2, 30):
            pass
    # top face (light)
    _fill_quad(g, [(16, 5), (27, 11), (16, 17), (5, 11)], FILL)
    # left face (shadow)
    _fill_quad(g, [(5, 11), (16, 17), (16, 28), (5, 22)], SHADOW)
    # right face (mid)
    _fill_quad(g, [(16, 17), (27, 11), (27, 22), (16, 28)], rgb('228066'))
    # edges
    for a, b in [((16, 5), (27, 11)), ((27, 11), (16, 17)), ((16, 17), (5, 11)), ((5, 11), (16, 5)),
                 ((5, 11), (5, 22)), ((5, 22), (16, 28)), ((16, 28), (27, 22)), ((27, 22), (27, 11)),
                 ((16, 17), (16, 28))]:
        g.line(a[0], a[1], b[0], b[1], OUTLINE, 1)
    return g


def _fill_quad(g, pts, color):
    ys = [p[1] for p in pts]
    for y in range(min(ys), max(ys) + 1):
        xs = []
        for i in range(len(pts)):
            x0, y0 = pts[i]
            x1, y1 = pts[(i + 1) % len(pts)]
            if (y0 <= y < y1) or (y1 <= y < y0):
                xs.append(x0 + (x1 - x0) * (y - y0) / (y1 - y0))
        if len(xs) >= 2:
            xs.sort()
            for x in range(int(round(xs[0])), int(round(xs[-1])) + 1):
                g.px(x, y, color)


def icon_threejs_performance():
    g = icon_threejs_game()
    # lightning bolt overlay (gold) = speed/perf
    bolt = [(20, 3), (13, 16), (18, 16), (11, 29)]
    for i in range(len(bolt) - 1):
        g.line(bolt[i][0], bolt[i][1], bolt[i + 1][0], bolt[i + 1][1], OUTLINE, 3)
    for i in range(len(bolt) - 1):
        g.line(bolt[i][0], bolt[i][1], bolt[i + 1][0], bolt[i + 1][1], GOLD, 1)
    return g


ICONS = {
    'pixel-character': icon_character,
    'sprite-animation': icon_animation,
    'vfx-particles': icon_vfx,
    'pixel-art-director': icon_director,
    'pixel-art-review': icon_review,
    'character-designer': icon_character_designer,
    'vfx-artist': icon_vfx_artist,
    'hud-ui': icon_hud_ui,
    'asset-pipeline': icon_asset_pipeline,
    'audio-director': icon_audio_director,
    'boss-designer': icon_boss_designer,
    'camera-director': icon_camera_director,
    'combat-designer': icon_combat_designer,
    'ecs-architecture': icon_ecs,
    'enemy-designer': icon_enemy_designer,
    'game-balance': icon_game_balance,
    'game-designer': icon_game_designer,
    'level-designer': icon_level_designer,
    'loot-economy': icon_loot_economy,
    'npc-dialogue': icon_npc_dialogue,
    'procedural-world': icon_procedural_world,
    'quest-writer': icon_quest_writer,
    'shader-expert': icon_shader_expert,
    'threejs-game': icon_threejs_game,
    'threejs-performance': icon_threejs_performance,
}


def contact_sheet(path):
    cols = 5
    cell = N * 4
    pad = 6
    rows = (len(ICONS) + cols - 1) // cols
    W = cols * cell + (cols + 1) * pad
    H = rows * cell + (rows + 1) * pad
    sheet = Image.new('RGBA', (W, H), (40, 40, 52, 255))
    for i, (name, fn) in enumerate(ICONS.items()):
        img = Image.new('RGBA', (N, N), T)
        gd = fn()
        for y in range(N):
            for x in range(N):
                img.putpixel((x, y), gd.d[y][x])
        img = img.resize((cell, cell), Image.NEAREST)
        cx = pad + (i % cols) * (cell + pad)
        cy = pad + (i // cols) * (cell + pad)
        sheet.alpha_composite(img, (cx, cy))
    sheet.save(path)
    print('wrote contact sheet', path)


def main():
    import sys
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.dirname(here)
    skills = os.path.join(root, '.cursor', 'skills')
    for name, fn in ICONS.items():
        out = os.path.join(skills, name, 'icon.png')
        fn().save(out)
        print('wrote', os.path.relpath(out, root))
    if '--sheet' in sys.argv:
        contact_sheet(os.path.join(root, 'docs', 'screenshots', 'skill-icons-sheet.png'))


if __name__ == '__main__':
    main()
