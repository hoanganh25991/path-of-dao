# Pixel Art Fundamentals — Path of Dao

> Engine-agnostic technique cheat-sheet shared by the pixel-art skills in
> `.cursor/skills/` (pixel-character, sprite-animation, vfx-particles,
> pixel-art-director, pixel-art-review).
> Project-specific rules live in [pixel-art-style.md](./pixel-art-style.md).
> This game draws sprites **procedurally on canvas** (`src/combat/art/`) — the
> techniques below apply whether pixels are placed in code or in an editor.

---

## 1. Priority order (when in doubt)

1. **Silhouette** — readable shape at 1× before any color. Squint test: still identifiable?
2. **Value (contrast)** — light/dark structure carries form more than hue.
3. **Color / hue** — mood and material, applied on top of solid values.
4. **Detail** — only after 1–3 read cleanly. Detail cannot rescue a bad silhouette.

At 32×56 (this project's frame), every pixel counts — spend them on shape, not noise.

## 2. Palette & color ramps

- Keep a **tight palette** (≤16 colors total; 3–5 shades per material ramp).
- A ramp = `outline → shadow → fill → highlight`. This project's palette tokens map
  directly: `outline`, `shadow`, `fill`/`skin`, `accent`, `highlight`
  (see `src/combat/art/stickyManPalette.ts`).
- **Hue shift** while shading — do **not** just darken/lighten one hue:
  - Shadows shift toward **cool** (blue/purple) + lower saturation.
  - Highlights shift toward **warm** (yellow/orange).
  - Ramps that rotate hue read richer than pure lightness ramps.
- Reuse shades across materials to keep the palette cohesive.
- **Enemy variants from one rig — palette-swap-as-remap.** Since sprites are already generated
  by drawing to canvas at boot, the cheapest way to make many enemy variants from the single
  sticky-man rig is to **parameterize the ramp colors the draw routine already outputs**
  (outline/shadow/fill/accent/highlight) rather than hand-authoring a new palette per enemy or
  standing up a separate recolor system. Only reach for a true runtime palette-swap (canvas
  `ImageData` remap, or a GPU palette-lookup shader) if you need to switch an *already-generated*
  spritesheet's colors without regenerating frames (e.g. an "elite/corrupted" recolor at
  runtime) — for MVP, draw-time parameterization is simpler and cheaper. (Validated 2026-07: no
  current library does articulated-rig procedural generation better than this bespoke pipeline —
  don't add one. An OKLCH-based ramp generator is a reasonable spike if hand-picked hue-shifts
  ever feel inconsistent across many enemies, but isn't a gap today.)

## 3. Outlines — selective outline ("sel-out")

- Outline color = a **darker tint of the body's darkest tone**, never pure `#000`
  (this project uses near-black tints like `#0c0c14`).
- **Hard dark outline** where the sprite meets the background, especially the
  shadow side (bottom/right with an upper-left light).
- On the **lit side** (top/left), replace the outline with a **lighter body color**
  so the form feels open, not caged.
- Keep the dark line wherever it protects the silhouette against the background.

## 4. Light source

- **Upper-left, single source, consistent** across every sprite, frame, and enemy.
- Highlights top-left, core shadow bottom-right, tiny bounce/rim optional.

## 5. Dithering

- Alternating 2-color pixels to fake a 3rd shade or texture (gradients, grit, metal, dirt).
- Use **sparingly** and mostly on **large single-color areas**.
- Avoid on sprites **≤32 px** — it reads as noise at actual size and breaks between frames.

## 6. Anti-aliasing (AA)

- **Avoid AA on small sprites (≤32 px)** and on outer silhouette edges — crisp aliased
  edges read better and scale predictably with pixel-perfect (`imageSmoothingEnabled = false`).
- Use AA **selectively** on larger interior curves/long diagonals only; 1px mid-tone,
  applied **last**, never breaking the silhouette outward.

## 7. Animation — timing beats frame count

- **Timing > number of frames.** Vary per-frame duration:
  - Anticipation / wind-up: quick (~80–100 ms).
  - Impact / key pose: **hold longer** (~150–200 ms) to sell weight.
  - Recovery: medium, ease back to neutral.
- Frame budgets: **idle 2–4**, **walk 4–8**, **attack 3–6**, **hit 2**, **death 8–12**.
- Work **key poses first** (contact, passing, extension), in-betweens only if needed.
- **Smear frames** (one blurred/elongated limb-or-weapon frame) sell fast swings cheaply.
- Idle = subtle life: 1–2 px vertical breathing bob; head height stays near-constant in walk.

## 8. 12 principles that matter most for game sprites

Anticipation · Squash & stretch · Follow-through / overlap · Ease in/out ·
Exaggeration · Staging (readable silhouette per pose). Skip full realism; sell the *idea* of the motion.

## 9. VFX / juice

- Effects must **read instantly** and never bury the character — short, bright, gone.
- Pair hits with **hit-stop** (freeze 30–80 ms), **flash**, **knockback**, screen shake (small).
- Sparks/dust/slash use the **attacker's or element's accent color** + white core; fade fast.
- Keep VFX palette-consistent with the scene; additive/white core for energy, colored edge for identity.

---

## Optional external tooling (not currently installed)

If the project later moves to authored PNGs, the Aseprite-based
[`willibrandon/pixel-plugin`](https://github.com/willibrandon/pixel-plugin)
(+ `pixel-mcp`) automates canvas/palette/dither/animation/export via natural language.
Requires Aseprite ≥1.3. See [pixel-art-style.md](./pixel-art-style.md) §9 for the export plan.

## Sources

Derek Yu pixel art tutorial · Pixnote sel-out guide · Sprite-AI fundamentals ·
Spritesheets.ai animation guide · generalistprogrammer Aseprite guide.
