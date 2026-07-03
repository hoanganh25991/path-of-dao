# Sub-Plan 14: Insight System & Skill Awakenings

**Phase:** 4 — Progression  
**Estimated effort:** 12–14 hours  
**Depends on:** `13-cultivation-realm-system`, `07-player-controller-combat`  
**Blocks:** `19`, `23`

---

## 1. Objective

Implement Insight intents (Sword, Void, Flame, Lightning, Time, Life). Skills grant insight XP on use. At 100%, player awakens skill — new behavior/VFX, not just damage +10%.

---

## 2. Insight Intents

| Intent ID | Theme | Signature Skill |
|-----------|-------|-----------------|
| sword | Sword Intent | Sword Flash |
| void | Void Intent | Void Slash |
| flame | Flame Intent | Flame Lotus |
| lightning | Lightning Intent | Thunder Step |
| time | Time Intent | Time Domain (ultimate lite) |
| life | Life Intent | Spirit mend / support |

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/progression/InsightSystem.ts` | XP tracking, awakening |
| `src/progression/InsightDefinitions.ts` | Load intent config |
| `content/progression/insights.json` | XP curves, awakening reqs |
| `content/skills/skill.*.json` | Base + awakened variants |
| `src/ui/hud/InsightMeter.ts` | Combat HUD intent bar |
| `src/ui/modals/AwakeningModal.ts` | Awakening ceremony |

---

## 4. Insight State

```typescript
interface InsightState {
  xp: number;           // 0–100 display scale
  awakened: boolean;
  totalUses: number;
}

// save.insights['sword'] = { xp: 45, awakened: false, totalUses: 120 }
```

---

## 5. XP Gain Rules

On skill cast:

```typescript
const gain = baseXp * (1 + bonusFromMapDiscovery) * (awakened ? 0 : 1);
```

| Source | XP |
|--------|-----|
| Skill use (tagged intent) | +2 |
| Critical kill with intent skill | +5 |
| Hidden shrine discovery | +15 one-time |
| Boss hit with intent skill | +8 |

XP required to 100: 200 points internal (display as percentage).

Cap: once awakened, XP frozen at 100.

---

## 6. Awakening Requirements

From `insights.json`:

```json
{
  "sword": {
    "awakenRequirement": {
      "minRealm": "foundation",
      "minUses": 50,
      "xp": 100
    },
    "awakenedSkillId": "skill.sword.flash.awakened"
  }
}
```

When xp >= 100 AND requirements met → `insight:ready-to-awaken` event.

Awakening at Home Skills panel or auto-prompt after map clear.

---

## 7. Awakened Skill Behavior Examples

| Base | Awakened Change |
|------|-----------------|
| Sword Flash | + wider arc, leaves cut VFX on env |
| Void Slash | pulls enemies to fracture point |
| Flame Lotus | blooms twice, second delayed 300ms |
| Thunder Step | dodge replacement — teleport strike |
| Time Domain | 1.5s enemy freeze, player moves |
| Life Intent | heal 15% HP on cast |

Define in skill JSON `awakenedOverrides` block — executor reads in sub-plan 19.

---

## 8. InsightMeter (Combat HUD)

Below mana bar: thin bar showing current equipped skill's intent fill + icon.

When ready to awaken: pulse gold border (combat continues — awaken at Home only MVP).

---

## 9. AwakeningModal

Similar to breakthrough but intent-themed color:

- Sword: silver slash animation
- Void: screen crack shader 1s

On confirm: swap skill id in save loadout, set awakened true.

---

## 10. Skill Loadout

Save extension:

```typescript
equippedSkills: {
  primary: 'skill.sword.flash',
  secondary: 'skill.void.slash',
  ultimate: 'skill.time.domain'
}
```

Skills panel + combat skill button read primary slot.

---

## 11. Tests

| Test | Assert |
|------|--------|
| XP accumulation | uses increase xp |
| Awakened cap | no xp after awaken |
| Requirements gate | low realm blocks |
| Awaken swap | skill id changes to awakened variant |

---

## 12. Acceptance Criteria

- [ ] Using skill increases corresponding insight XP
- [ ] HUD shows insight progress for primary skill intent
- [ ] At 100% + requirements, awakening available in Skills panel
- [ ] Awakened skill visibly different in combat (Void pull OR Sword wider arc minimum)
- [ ] Save persists insight state
- [ ] All 6 intents defined in data (skills can be stubs for non-MVP intents)
- [ ] Unit tests pass

---

## 13. Scope Control for 40 Skills

Base 6 signature + awakened 6 = 12 fully implemented. Remaining 28 skills in sub-plan 23 are variants sharing executor primitives with different numbers/VFX tint.

---

## 14. Handoff

Sub-plan 19 implements SkillExecutor reading base vs awakened configs. Sub-plan 23 authors skill JSON data.
