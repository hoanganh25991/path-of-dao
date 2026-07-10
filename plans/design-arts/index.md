# Design Arts — Master Index (Plan 32)

**Phase:** Cross-cutting — **first parallel art track** (starts when `src/` layout exists)  
**Gate:** [`02-scene-router-app-shell.md`](../02-scene-router-app-shell.md) done — `src/`, `assets/`, combat boot, Home shell paths are real  
**Blocks:** Polished MVP look — does **not** block gameplay code tracks  
**Combat integration consumer:** [`29-pixel-art-combat-canon.md`](../29-pixel-art-combat-canon.md) (hooks, anim playback, hitboxes, collision)

> **Master plan:** [index.md](../index.md) §5.1 Track **DA** · §5.3 Band 2  
> **Rig & palette tokens:** [handbook/pixel-art-style.md](../../handbook/pixel-art-style.md)  
> **Silhouette prose:** [handbook/character-sheets/](../../handbook/character-sheets/README.md)

---

## 1. Why this exists (split from plan 29)

| Layer | Owner | When |
|-------|-------|------|
| **Design** — *what* sprites/icons look like | **`plans/design-arts/`** (this tree) | **Immediately after `02`** — parallel with `03`–`12` |
| **Integration** — *how* art plays in combat | **Plan 29** | When `06`–`09`, `19` wire hooks |

**Do not wait until plan 29 or Band 6** to design the hero, bosses, wheel icons, or treasure
icons. Code ships with procedural sticky-man placeholders; **finished PNG/Aseprite drops replace
them automatically** when files land in canonical paths ([`08-auto-wire-pipeline.md`](./08-auto-wire-pipeline.md)).

Plan 29 is **not** the art brief — it is the **combat contract**: animation keys, hit frame
alignment, **Fake 2.5D** feet anchor + **layered prop** exports ([`fake-2.5d.md`](../fake-2.5d.md), DA-09), hitbox sync, collision layers, juice tiers.

---

## 2. Sub-task index

Each file is one focused art workstream (~4–16h design + export per slice). All can run **in
parallel** once handbook tokens are agreed.

| ID | File | Delivers | Canonical output path |
|----|------|----------|------------------------|
| DA-01 | [hero.md](./hero.md) | Wanderer cultivator — unarmed + sword stages | `assets/sprites/hero/` |
| DA-02 | [enemies-minions.md](./enemies-minions.md) | Beasts + disciple/bandit families (25 types) | `assets/sprites/enemies/` |
| DA-03 | [bosses-cultivators.md](./bosses-cultivators.md) | Named ordeal bosses + cultivator silhouettes | `assets/sprites/bosses/` |
| DA-04 | [wheel-icons.md](./wheel-icons.md) | 24×24 Divine Art wheel icons (Intent-colored) | `assets/sprites/skills/` |
| DA-05 | **[items/](./items/index.md)** | 24×24 Dharma Treasure icons (DI-01…03) | `assets/sprites/items/` |
| DA-05 (legacy) | [treasure-icons.md](./treasure-icons.md) | → redirect to [items/index.md](./items/index.md) | — |
| DA-06 | [ancient-echoes.md](./ancient-echoes.md) | Echo ancient palette variants + aura | `assets/sprites/ancients/` |
| DA-07 | [vfx-spritesheets.md](./vfx-spritesheets.md) | Art impact sheets, telegraphs, bursts | `assets/sprites/vfx/` |
| DA-08 | [auto-wire-pipeline.md](./08-auto-wire-pipeline.md) | Drop-in loading, manifest, validator hooks | `src/combat/art/` |
| DA-09 | [map-props.md](./map-props.md) | Structures, villages, 20 signature trees | `assets/sprites/props/` |

**Priority order for solo artist** (if not fully parallel): **DA-01 → DA-04 → DA-05 items/ → DA-02 → DA-03 → DA-06 → DA-07**.

**Item logic** (drops, random, equip) runs in parallel via [`item-system/`](../item-system/index.md) (plan 33) — does not wait for DA-05 PNGs.

---

## 3. Shared design rules (all sub-tasks)

| Rule | Source |
|------|--------|
| Frame grid **32×56**, feet origin `(0.5, 1)` | `handbook/pixel-art-style.md` §4 |
| ≤ **6 colors** per sprite (sticky-man canon) | `handbook/pixel-art-style.md` §2 |
| Teal `#2dd4a8` + gold `#c9a227` for UI-adjacent icons | `plans/index.md` §3.x house style |
| Intent hues for wheel + VFX rim | `handbook/pixel-art-style.md` §3.1 |
| No `fillRect` placeholders in **ship** builds | plan 29 §0 ship gate |
| en + vi **not** painted into pixels — icons are glyph/silhouette only | plan 24 |

---

## 4. Parallel execution

```
Gate: 02 (src layout) ✓
├── Track DA — Design Arts  ← START HERE (this directory)
│     DA-01 hero ∥ DA-04 wheel ∥ DA-05 treasures ∥ DA-02 enemies …
├── Track A — Combat code   06 → 07 → 08 → 09
├── Track B — Home code     10 → 11 → 12
└── Track C — Validators    20
```

- **Design never blocks code** — procedural fallbacks until PNG exists.
- **Code never blocks design** — artists use handbook + character sheets; no need for `07` shipped.
- **Integration PR** — when a DA sub-task lands assets, run `pnpm content:validate` + visual QA
  against plan 29 §0.2 checklist.

---

## 5. Acceptance (directory-level)

- [ ] Each sub-task has exported assets OR an explicit "procedural OK for MVP" note in track
- [ ] `08-auto-wire-pipeline.md` manifest lists every `textureKey` / `animKey` pair
- [ ] Hero DA-01 replaces procedural body at 2× zoom (plan 29 §0.2 #1)
- [ ] Wheel + treasure icons visible in Home panels (plan 12 §18)
- [ ] No duplicate art specs — roster tables live here or handbook; plan 29 references only integration

---

## 6. Handoff map

| Consumer plan | Needs from design-arts |
|---------------|------------------------|
| `07` player controller | DA-01 anim keys, hit frame indices |
| `08` enemies | DA-02 texture keys per `enemy.*` id |
| `09` hitboxes | DA-01/02/03 strike frame alignment doc |
| `11` / `12` Home | DA-05 `items/` icons; item logic plan `33` |
| `19` skill executor | DA-04 icons + DA-07 impact sheets |
| `23` enemy data | DA-02/03 `visual.textureKey` in JSON |
| `27` Echoes | DA-06 ancient themes |
| `21`–`22` maps | DA-09 structures + signature trees — [`map-design-canon.md`](../map-design-canon.md) |
| `29` combat integration | All character/VFX — consumes, does not author |
