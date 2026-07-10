# VFX & Juice Tiers — Combat Feel Canon

> **Master plan:** [index.md](./index.md) §3.6 · **Integration:** [29-pixel-art-combat-canon.md](./29-pixel-art-combat-canon.md) §3 · **Audio/juice:** [25-audio-vfx-polish.md](./25-audio-vfx-polish.md) · **Echoes consumer:** [27-ancient-echo-demo.md](./27-ancient-echo-demo.md)

The **Echoes of the Ancients** pillar sets the "beautiful effects" bar; the whole game benefits.
Build in tiers so common combat stays cheap and the showcase moment is spectacular.

---

## 1. Free juice kit (build first)

Near-zero cost, highest felt impact — implement **before** any shaders:

| Effect | Spec |
|--------|------|
| **Hit-stop** | Heavy hits: freeze 40–120 ms (`time.timeScale` / pause tweens) |
| **Screen shake** | Small amplitude, fast decay — tier table in plan `29` §2.6.4 |
| **Flash frames** | Struck sprite solid white 2–3 frames |
| **Telegraphs** | Sprite-based AOE danger zones **before** the hit — one flat ground sprite |

Full integration: plan `25` §5 · plan `29` §3.1.

---

## 2. VFX engine tiers

| Tier | Used by | Budget |
|------|---------|--------|
| **Common** | Most Divine Arts (v1–v2, basics) | Spritesheet anim + 1 pooled particle burst + flash. **No shaders.** |
| **Signature** | v3–v4, awakened signatures, boss phase skills | + one object-level Phaser FX (Glow / Displacement) + telegraph ring |
| **Showcase** | Echoes god-mode, v5 arts, finale boss ults | **One** camera-level postFX pass (Bloom + ColorMatrix + Vignette) + large AOE sprite + hit-stop + strong shake |

Per-art mapping (L/M/S UI ladder + tier): plan `29` §3.2–§3.3.

**Quality gate:** plan `26` — Showcase postFX off on `low` tier; Signature capped on mid Android.

---

## 3. Cultivation-flavored effects (not MMO spells)

Map Phaser 3.60+ FX to xianxia fantasy:

| Intent / read | VFX recipe |
|---------------|------------|
| **Sword qi** | Additive slash sprite + Displacement along cut + edge Bloom |
| **Void pull** | Barrel-pinch distortion + shatter overlay + desaturate |
| **Thunder** | Vignette + 1–2 frame white flash + darken-then-punch + Bloom on bolt |
| **Domain / ult** | Whole-screen postFX — reality reads as altered |

Intent hues: plan `29` §8. Pixel sheets: `design-arts/vfx-spritesheets.md` (DA-07).

---

## 4. Overdraw budget (mobile constraint)

Fill-rate, not particle count, kills mobile.

| Rule | Detail |
|------|--------|
| Screen-fill effects | **Few, large, cheap** — one animated sprite or one shader pass |
| Translucent quads | Never hundreds overlapping |
| Additive blending | ≤ **~3 layers** deep over any pixel |
| Echoes showcase | May briefly spend entire frame budget — 1–2 dropped frames read as *weight*, not lag |

Ship disciplines: plan `26` §6.2 · plan `index.md` §3.2 (Mobile Pipeline).

---

## 5. Consumers

| System | Tier usage |
|--------|------------|
| Divine Arts (`19`) | Per-skill `visual.tier` in content JSON |
| Echoes demo (`27`) | Primary **Showcase** consumer |
| Boss phases (`08`, `23`) | Signature → Showcase on phase ult |
| Combat camera (`29` §2.6) | Shake coupled to tier; Engage zoom on cast |

---

## 6. Acceptance

- [~] Common-tier arts never enable camera postFX (enforced on `low`; Showcase exempt in Echoes)
- [~] Showcase tier used ≤ 3 art ids + Echoes mode (perf budget plan `29` §3.2) — manual
- [ ] Additive stack ≤ 3 deep on mid Android profile test
- [x] Hit-stop + shake fire before any Signature shader on same frame
