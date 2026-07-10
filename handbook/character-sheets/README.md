# Character Sheets — Combat Cast

> **Who they look like** (identity, silhouette, costume, pose personality).  
> **Not** rig math or hex tokens — those live in [pixel-art-style.md](../pixel-art-style.md).  
> **Sprite authoring tasks** — [plans/design-arts/](../../plans/design-arts/index.md) (plan 32).  
> **Combat integration** (anim keys, hitboxes) — [plans/29-pixel-art-combat-canon.md](../../plans/29-pixel-art-combat-canon.md).

Live preview: `sticky-man-review.html` (Vite dev) · screenshot: [../screenshots/sticky-man-review.png](../screenshots/sticky-man-review.png)

---

## Sheets

| Sheet | Scope |
|-------|--------|
| [hero.md](./hero.md) | Player — Cultivator Wanderer (Wang Lin's road) |
| [faction-families.md](./faction-families.md) | Minion families (disciple, bandit, beast, …) |
| [bosses.md](./bosses.md) | Ordeal cultivator bosses (ch1–10 gates) |
| [ancients.md](./ancients.md) | Echoes ancients (`visualTheme` combat identity) |

---

## How docs link together

Plan 32 **design-arts** owns *what to draw* (export paths, sub-tasks). Plan 29 owns *how it plays*
in combat. Character sheets own *identity*. Link all three so agents land in the right doc.

```
plans/29-pixel-art-combat-canon.md     ← triggers, roster tables, acceptance criteria
         ↕
handbook/character-sheets/*.md         ← who they are / how they read (this folder)
         ↕
handbook/pixel-art-style.md            ← rig, frame grid, palette tokens, anim keys
         ↕
src/combat/art/                        ← implementation (stickyManDraw, palettes)
```

| If you need… | Read |
|--------------|------|
| When does hero get a sword? Stage 4 aura rules? | [plan 29 §4](../../plans/29-pixel-art-combat-canon.md#4-hero--cultivator-wanderer) |
| What does the hero *look and feel* like? | [hero.md](./hero.md) |
| Boss phase-2 prop swap rules | [plan 29 §6.1](../../plans/29-pixel-art-combat-canon.md#61-boss-visual-rules) |
| What does Tu Sen look like? | [bosses.md](./bosses.md#bossjade_guardian--tu-sen) |
| Limb lengths, `hero_sticky_walk` keys | [pixel-art-style.md §2–4](../pixel-art-style.md) |
| Story / Wang Lin tone | [renegade-immortal-reference.md](../renegade-immortal-reference.md) |
| New character concept workflow | `.cursor/skills/character-designer/SKILL.md` |

**When adding a new sheet:** link from the matching plan 29 section *and* add a row in the table above.
