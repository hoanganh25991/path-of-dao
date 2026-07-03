# Sub-Plan 19: Skill Executor & Cultivation VFX

**Phase:** 5 — World & Content  
**Estimated effort:** 12–16 hours  
**Depends on:** `07-player-controller-combat`, `09-hitbox-damage-combat-math`, `14-insight-system`  
**Blocks:** `23`

---

## 1. Objective

Data-driven skill execution system with cultivation-themed VFX primitives. Supports 6 signature skills + awakened variants; extensible to 40 skills via JSON.

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
| `src/combat/skills/SkillExecutor.ts` | Cast pipeline |
| `src/combat/skills/SkillRegistry.ts` | Load all skills |
| `src/combat/skills/effects/*.ts` | Effect handlers |
| `src/combat/skills/VFXLibrary.ts` | Particle/sprite presets |
| `src/combat/skills/CooldownManager.ts` | Per-slot cooldowns |
| `content/skills/_schema.json` | Zod validation |

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

## 5. SkillExecutor Cast Pipeline

```typescript
class SkillExecutor {
  tryCast(skillId: string, caster: Player, scene: MapScene): boolean;
}
```

Steps:

1. Load skill def (awakened if insight awakened for intent)
2. Check cooldown + mana via CooldownManager
3. Play cast anim + VFX cast
4. Wait castTimeMs (player rooted or sliding per skill)
5. Execute effects array sequentially or parallel per `parallel: true`
6. Spend mana, start cooldown
7. InsightSystem.onSkillUse(intent)
8. Emit combat events

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

Track primary + secondary + ultimate separately.

HUD skill button shows radial cooldown overlay.

---

## 9. Integration with Player

Replace sub-plan 07 skill stub:

- Skill button casts `equippedSkills.primary`
- Secondary on long-press skill button (optional MVP skip)

---

## 10. Tests

| Test | Assert |
|------|--------|
| insufficient mana | cast fails |
| cooldown | blocks recast |
| awakened override | pull_field runs |
| insight hook | XP incremented |

Integration: load skill JSON, mock scene, verify effect count.

---

## 11. Acceptance Criteria

- [ ] All 6 signature skills castable in combat
- [ ] Awakened void slash pulls enemies (visible)
- [ ] Cooldown + mana enforced
- [ ] VFX presets reused across skills
- [ ] Skill JSON validates via Zod
- [ ] Insight XP on cast
- [ ] Unit/integration tests pass

---

## 12. Performance

- Max 30 active projectiles — pool in VFXLibrary
- Screen_darken single shared overlay sprite

---

## 13. Handoff

Sub-plan 23 adds 34 variant skill JSON files using same effect types with tuned numbers.
