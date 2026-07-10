# Sub-Plan 19: Divine Art Executor & Cultivation VFX

**Phase:** 5 — World & Content  
**Estimated effort:** 12–16 hours  
**Depends on:** `07-player-controller-combat`, `09-hitbox-damage-combat-math`, `14-insight-system`  
**Blocks:** `23`

---

## 1. Objective

Data-driven **Divine Art** execution system (content IDs stay `skill.*` internally, per
`plans/index.md` §1.2) with cultivation-themed VFX primitives, gated by **Master Intent** rules
(sub-plan 14), cast from the **6-slot combat wheel** (sub-plan 03/12). Supports 6 signature
Divine Arts + awakened variants; extensible to 40 arts via JSON (sub-plan 23). VFX tiers and
juice kit follow `plans/index.md` §3.6 and [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §3–§9; Intent colors follow `handbook/pixel-art-style.md`
§3.1.

---

## 2. Skill JSON Schema

`content/skills/skill.void.slash.json`:

```json
{
  "id": "skill.void.slash",
  "displayNameKey": "skill.void.slash.name",
  "intent": "void",
  "manaCost": 25,
  "cooldownMs": 4000,
  "castTimeMs": 200,
  "effects": [
    {
      "type": "projectile",
      "sprite": "vfx_void_arc",
      "speed": 420,
      "lifetimeMs": 600,
      "hitbox": { "kind": "arc", "radius": 64, "angle": 90 },
      "damage": { "skillMultiplier": 1.8, "damageType": "spirit" }
    }
  ],
  "awakenedOverrides": {
    "id": "skill.void.slash.awakened",
    "effects": [
      {
        "type": "pull_field",
        "radius": 120,
        "durationMs": 400,
        "pullStrength": 180
      },
      {
        "type": "projectile",
        "damage": { "skillMultiplier": 2.2, "damageType": "spirit" }
      }
    ]
  },
  "vfx": {
    "cast": "vfx_void_cast",
    "impact": "vfx_void_impact"
  }
}
```

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/combat/skills/ArtExecutor.ts` | Cast pipeline (was `SkillExecutor`) |
| `src/combat/skills/ArtRegistry.ts` | Load all Divine Arts (was `SkillRegistry`) |
| `src/combat/skills/effects/*.ts` | Effect handlers |
| `src/combat/skills/VFXLibrary.ts` | Particle/sprite presets, tiered per §4.2 |
| `src/combat/skills/JuiceKit.ts` | Hit-stop, screen shake tiers, flash frames (§4.1 — build first) |
| `src/combat/skills/CooldownManager.ts` | Per-**wheel-slot** cooldowns (all 6, not just 3) |
| `content/skills/_schema.json` | Zod validation (already authored) |

---

## 4. Effect Types (Composable)

| Type | Behavior |
|------|----------|
| `projectile` | Moving hitbox |
| `melee_arc` | Instant arc hitbox at cast point |
| `dash` | Teleport/dodge forward, damage path |
| `aoe_circle` | Expanding circle at target |
| `pull_field` | Apply velocity toward center |
| `freeze` | Enemy AI pause (time intent) |
| `heal` | Restore player HP |
| `buff` | Temp stat modifier |
| `screen_darken` | Camera overlay for thunder/heavenly |

Register handlers in map:

```typescript
const handlers: Record<string, EffectHandler> = {
  projectile: runProjectile,
  pull_field: runPullField,
  // ...
};
```

---

## 5. ArtExecutor Cast Pipeline

```typescript
class ArtExecutor {
  tryCast(slot: DivineArtSlot, caster: Player, scene: MapScene): boolean;
}
```

Steps:

1. Resolve the Divine Art id equipped at `slot` from `save.divineArts` (sub-plan 14 §10)
2. **Sword Intent gate check:** if the resolved art's `intent === 'sword'` and
   `save.progress.weaponMilestone !== 'ancient_sword'`, **fail the cast immediately** — this is
   the actual enforcement point for the gate designed in sub-plan 14; the wheel-picker UI
   (sub-plan 12) should already prevent equipping such an art, so this is a defense-in-depth
   check, not the primary gate.
3. Load art def (awakened variant if that Intent is awakened — sub-plan 14)
4. Check cooldown + mana via CooldownManager (per-slot, all 6 tracked independently)
5. Play cast anim + VFX cast (tier per §4.2: common = spritesheet + pooled burst; signature =
   + object FX + telegraph; the Divine Art executor itself doesn't special-case Echoes' Showcase
   tier — that's god-mode-only, sub-plan 27)
5b. **Combat camera:** emit `combat:camera` — `powerUi: 'L'|'M'|'S'` from skill content maps to
   Engage / Engage / Dramatic; on each damaging effect impact emit `shake` tier per plan 29 §2.6.4
   (L→micro/light, M→light/medium, S→heavy; Showcase→boss).
6. Wait castTimeMs (player rooted or sliding per art)
7. Execute effects array sequentially or parallel per `parallel: true`
8. Spend mana, start cooldown for that slot
9. `MasterIntentSystem.onArtUse(intent)` (sub-plan 14)
10. Emit combat events

---

## 6. Signature Skills Implementation Notes

### Sword Flash

- melee_arc 120°, multiplier 1.5, quick 150ms cast
- Awakened: wider 180°, env leaf particles (decorative)

### Spirit Dash / Thunder Step

- dash 140px, i-frames 200ms, trail VFX
- Awakened Thunder: damage arc at end

### Flame Lotus

- aoe_circle blooms at player feet, 2 ticks
- Awakened: second bloom delayed 300ms

### Void Slash

- projectile arc + spirit damage
- Awakened: pull_field before projectile

### Heavenly Domain (ultimate)

- screen_darken 1s + freeze enemies 2s + player moves
- Long cooldown 30s, high mana

### Life Intent support

- heal 15% + cleanse debuff stub

---

## 7. VFXLibrary Presets

Reuse particles:

- `cultivation_gather` — energy converge
- `slash_arc` — white crescent sprite
- `void_crack` — purple mesh distortion lite
- `thunder_bolt` — vertical beam sprite + flash
- `flame_petal` — orange particles spiral

Each preset params: color, scale, duration — no one-off code per skill.

---

## 8. CooldownManager

Track all **6 wheel slots** (`primary, secondary, ultimate, skill3, skill4, skill5`) separately —
not just primary/secondary/ultimate. Empty vs filled display: [`plans/30-divine-arts-wheel-loadout.md`](./30-divine-arts-wheel-loadout.md).

Each wheel-slot button (sub-plan 03) shows its own radial cooldown overlay + mana-lock dim.

---

## 9. Integration with Player

Replace sub-plan 07's single-slot stub:

- Each wheel slot casts its own equipped Divine Art via `ArtExecutor.tryCast(slot, ...)`
- Dash and Gather Qi are **not** part of this executor — they're dedicated controls handled
  directly by `DashComponent`/`GatherQiComponent` (sub-plan 07), never routed through
  `ArtExecutor` or the cooldown/mana system here.

---

## 10. Tests

| Test | Assert |
|------|--------|
| insufficient mana | cast fails |
| cooldown | blocks recast |
| awakened override | pull_field runs |
| intent XP hook | XP incremented |
| sword gate | casting a sword-intent art with `weaponMilestone: 'none'` fails, even if equipped |

Integration: load skill JSON, mock scene, verify effect count.

---

## 11. Acceptance Criteria

- [x] All 6 signature Divine Arts castable in combat, one per wheel slot
- [x] Awakened void slash pulls enemies (visible)
- [x] Cooldown + mana enforced per wheel slot independently
- [x] Sword-intent arts uncastable until `weaponMilestone === 'ancient_sword'`
- [x] VFX presets reused across arts; tiered per §4.2 (common/signature — Showcase is sub-plan 27)
- [x] Divine Art JSON validates via Zod
- [x] Master Intent XP on cast
- [x] Unit/integration tests pass

---

## 12. Performance

- Max 30 active projectiles — pool in VFXLibrary
- Screen_darken single shared overlay sprite

---

## 13. Handoff

Sub-plan 23 adds 34 variant skill JSON files using same effect types with tuned numbers.
