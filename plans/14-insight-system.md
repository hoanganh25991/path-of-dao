# Sub-Plan 14: Master Intent (Ý Cảnh) & Divine Art Awakenings

**Phase:** 4 — Progression  
**Estimated effort:** 12–14 hours  
**Depends on:** `13-cultivation-realm-system`, `07-player-controller-combat`  
**Blocks:** `19`, `23`

> **⚠️ Redesigned 2026-07-06** (mid-loop, ad-hoc — see `tracks/14-insight-system.md`): the original
> 6 intents below (Sword/Void/Flame/Lightning/Time/Life) were a generic elemental spread with no
> basis in the source novel, all progressing simultaneously. Real *Renegade Immortal* sources name
> only **3** core Concepts for Wang Lin, cultivated **sequentially** (master one fully before the
> next reveals itself) — not six in parallel. The roster is now **3 main-flow intents**
> (`life_death` → `cause_effect` → `truth_falsehood`, each requiring the previous awakened) **+ 3
> gate-flow intents** (`sword`, `flame`, `lightning` — each independently unlocked, not part of
> the sequential chain). §2 below is kept for history; see
> `handbook/renegade-immortal-reference.md` §Master Intent for the current, authoritative roster,
> and `src/progression/MasterIntentSystem.isIntentUnlocked` for the gating logic. Everything else
> in this plan (XP mechanics §5, awakening requirements shape §6, HUD §8, modal §9, wheel §10)
> is unchanged in *structure* — only the intent roster and the addition of an unlock check changed.
>
> **Migrated 2026-07-10:** `MasterIntentSystem.ts` (`isIntentUnlocked` + `filterSkillsForIntentGates`)
> is implemented and wired into cast (`CombatComponent`) and the equip pool (`SkillLoadout`).
> `content/progression/insights.json` carries the 6-id `life_death`/`cause_effect`/`truth_falsehood`
> + `sword`/`flame`/`lightning` roster with `flow`/`order`/`gate`. Old saves migrate via
> `SaveMigration.migrateLegacyInsightKeys` (`void`→`truth_falsehood`, `life`→`life_death`,
> `time`→`cause_effect`); Dao Scroll `intentLesson` ids migrated in the same change. Tests:
> `tests/unit/master-intent.test.ts` (sequential + gate unlock, awakening swap) and
> `tests/unit/save-manager.test.ts` (legacy key migration) — not the `master-intent-system.test.ts` /
> `art-executor.test.ts` / `awakening-modal.test.ts` names referenced in §12 below (those predate the
> redesign and don't exist as separate files; coverage lives in `master-intent.test.ts`,
> `insight-system.test.ts`, and `skill-executor.test.ts`).

## 1. Objective

Implement the six **Master Intents** (Sword, Void, Flame, Lightning, Time, Life) —
`plans/index.md` §1.2/§7.3. **Master Intent is emergent, not chosen:** casting a Divine Art of
an Intent grants that Intent comprehension ("insight XP" internally); at 100% + realm/uses
requirements, the Intent's Divine Arts **awaken** — new behavior/VFX, not just +damage. The
Intent with the highest comprehension is the player's dominant Intent, surfaced in Home as
identity flavor only (no mechanical class lock). **Sword Intent is additionally gated**: its
Divine Arts stay locked and uncastable until `progress.weaponMilestone === 'ancient_sword'`,
regardless of XP — this is the one Intent with a hard requirement on top of comprehension.
Intent VFX hues and awakened **power UI +1** rule: [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §8.

*(2026-07-06: this "one hard-gated intent" idea is now the general case — see the redesign note
above. `isIntentUnlocked()` generalizes the sword-specific check that used to be the only gate.)*

---

## 2. Master Intents (superseded — kept for history)

| Intent ID | Theme | Signature Divine Art | VFX base/glow (handbook §3.1) |
|-----------|-------|-----------------------|-------------------------------|
| sword | Sword Intent — **gated until Ancient Spirit Sword** | Sword Flash | `#6fd6e8` / `#eafcff` |
| void | Void Intent | Void Slash | `#2a1a4a` / `#9a7cff` |
| flame | Flame Intent | Flame Lotus | `#ff7a2e` / `#ffe066` |
| lightning | Lightning Intent | Thunder Step | `#f0e64a` / `#ffffff` |
| time | Time Intent | Time Domain (ultimate lite) | `#c9a227` / `#fff3c2` |
| life | Life Intent | Spirit mend / support | `#2dd4a8` / `#eafff5` |

**Current roster** (see handbook for full detail):

| Flow | Intent ID | VI | Unlock |
|------|-----------|-----|--------|
| main (order 1) | `life_death` | Sinh Tử Ý Cảnh | Always unlocked |
| main (order 2) | `cause_effect` | Nhân Quả Ý Cảnh | `life_death` awakened |
| main (order 3) | `truth_falsehood` | Chân Giả Ý Cảnh | `cause_effect` awakened |
| gate | `sword` | Kiếm Ý | `weaponMilestone === 'ancient_sword'` |
| gate | `flame` | Hỏa Đạo | `boss.desert_sovereign` cleared |
| gate | `lightning` | Lôi Pháp | `boss.thunder_avatar` cleared |

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/progression/MasterIntentSystem.ts` | XP tracking, awakening, sword gate (was `InsightSystem`) |
| `src/progression/MasterIntentDefinitions.ts` | Load intent config (was `InsightDefinitions`) |
| `content/progression/insights.json` | XP curves, awakening reqs (file name kept internal — see §1.2 canon) |
| `content/skills/skill.*.json` | Base + awakened variants (Divine Art content IDs stay `skill.*`) |
| `src/ui/hud/MasterIntentMeter.ts` | Combat HUD intent bar (was `InsightMeter`) |
| `src/ui/modals/AwakeningModal.ts` | Awakening ceremony |

---

## 4. Master Intent State

```typescript
interface MasterIntentState {
  xp: number;           // 0–100 display scale
  awakened: boolean;
  totalUses: number;
}

// save.insights['sword'] = { xp: 45, awakened: false, totalUses: 120 }
// Field name `insights` kept internal per plans/index.md §1.2 canon.
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

When xp >= 100 AND requirements met → `intent:ready-to-awaken` event.

**Sword Intent additional gate:** even at 100 xp + realm/uses met, `sword`'s
`ready-to-awaken` (and its Divine Arts' castability at all) stays **false** until
`save.progress.weaponMilestone === 'ancient_sword'`. XP still accrues normally once the player
somehow uses a sword-tagged art (should not be reachable pre-milestone since the wheel can't
equip sword arts yet — belt-and-suspenders check, not the primary gate).

Awakening at Home Divine Arts panel (sub-plan 12 §18.5) or auto-prompt after map clear.

**Home UI — Master Intent section** (bottom of Divine Arts tab, not a separate nav tab):

| State | Row | Tap |
|-------|-----|-----|
| Locked | Muted + lock reason | **Review** sheet — unlock conditions |
| In progress | Name + comprehension `%` bar | **Review** — tagged Divine Arts + sources |
| Ready | Gold pulse + Awaken CTA | `AwakeningModal` (§9) |
| Awakened | Jade badge | **Review** — awakened flavor + affected arts |

Intent review lists arts as links → skill review (plan 12 §18.4.3). Gate Intents (Sword / Flame /
Lightning) show road-milestone copy instead of main-flow chain.

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

## 8. MasterIntentMeter (Combat HUD)

Below mana bar: thin bar showing current equipped Divine Art's intent fill + icon, tinted with
that Intent's base/glow hex (handbook §3.1).

When ready to awaken: pulse gold border (combat continues — awaken at Home only MVP). Locked
Sword Intent (pre-milestone) never shows this meter since no sword arts are equippable yet.

---

## 9. AwakeningModal

Similar to breakthrough but intent-themed color:

- Sword: silver slash animation
- Void: screen crack shader 1s

On confirm: swap skill id in save loadout, set awakened true.

---

## 10. Divine Arts Wheel Loadout

Save extension — full **6-slot wheel** (`plans/index.md` §1.2/§2.1; already the shape used by
`content/demo/ancients.json`'s `equippedSkills`, and the `divineArts` field added to
`PlayerSaveV1` in sub-plan 05):

```typescript
divineArts: {
  primary: 'skill.sword.flash',
  secondary: 'skill.void.slash',
  ultimate: 'skill.time.domain',
  skill3: null,
  skill4: null,
  skill5: null,
}
```

No duplicates across slots. Divine Arts panel (sub-plan 12) edits all 6; combat reads all 6 via
the wheel input (sub-plan 03) and casts via the executor (sub-plan 19) — not just `primary`.
**Assignment & combat display rules:** [`plans/30-divine-arts-wheel-loadout.md`](./30-divine-arts-wheel-loadout.md).

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

- [x] Casting a Divine Art increases its Intent's comprehension XP
- [x] HUD shows Intent progress for the currently-cast wheel slot — `MasterIntentMeter` unit-tested
- [x] At 100% + requirements, awakening available in Divine Arts panel
- [x] Awakened Divine Art visibly different in combat (Void pull_field in `art-executor.test.ts`)
- [x] Sword Intent stays locked until `weaponMilestone === 'ancient_sword'` (`master-intent-system.test.ts`)
- [x] Save persists Master Intent state
- [x] All 6 intents defined in data (Divine Arts can be stubs for non-MVP intents)
- [x] `AwakeningModal` unit-tested (`awakening-modal.test.ts`)
- [x] Unit tests pass

---

## 13. Scope Control for 40 Skills

Base 6 signature + awakened 6 = 12 fully implemented. Remaining 28 skills in sub-plan 23 are variants sharing executor primitives with different numbers/VFX tint.

---

## 14. Handoff

Sub-plan 19 implements SkillExecutor reading base vs awakened configs. Sub-plan 23 authors skill JSON data.
