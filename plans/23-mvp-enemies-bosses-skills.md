# Sub-Plan 23: MVP Enemies, Bosses & Divine Art Data

**Phase:** 6 — MVP Content  
**Estimated effort:** 12–16 hours  
**Depends on:** `08`, `19`, `20`, `21`  
**Blocks:** MVP ship

---

## 1. Objective

Complete content data for **25 enemy types**, **8 bosses**, and **40 Divine Arts** (content IDs
stay `skill.*`; 6 signature fully authored + 34 variants; player-facing noun is always "Divine
Art" per `plans/index.md` §1.2). No new code unless executor lacks effect — extend handlers only
if blocked.

---

## 2. Inventory Targets

| Category | Target | Status after 21–22 |
|----------|--------|---------------------|
| Enemies | 25 | 22 authored in 21–22 |
| Bosses | 8 | 8 authored |
| Divine Arts | 40 | 6 signature in 19 |

This plan adds: **3 enemy types**, **34 Divine Art JSON files**, balance pass loot tables.

---

## 3. Remaining Enemies (3)

| ID | Role |
|----|------|
| enemy.training.dummy | stationary, ch1 tutorial optional |
| enemy.elite.shadow | melee_chaser, generic elite drop source |
| enemy.spirit.fox | non-combat spawn for encounter POI |

---

## 4. Divine Art Set Structure (40 Total)

### 4.1 Signature (12 ids — base + awakened)

Already defined in sub-plans 14 + 19.

### 4.2 Variants (28 Divine Arts)

4 variants per intent × 7 intents = 28 (adjust Life to 4 variants, Time to 4 — total 28 + 12 = 40).

Pattern naming: `skill.{intent}.{name}.v{1-4}` (content ID stays internal per §1.2 canon).

Example sword variants — **all `skill.sword.*` variants inherit the Sword Intent gate**
(sub-plan 14/19): unlocked in `unlockedArts` per the progression below, but **uncastable and
unequippable** until `progress.weaponMilestone === 'ancient_sword'`, exactly like the signature
Sword Flash art. Don't special-case variants — the gate checks `intent`, not the specific id.

| ID | Multiplier | Cooldown | Notes |
|----|------------|----------|-------|
| skill.sword.crescent.v1 | 1.2 | 3s | narrow arc |
| skill.sword.crescent.v2 | 1.4 | 3.5s | wider |
| skill.sword.rain.v3 | 1.0×3 hits | 5s | multi-hit |
| skill.sword.burst.v4 | 2.0 | 8s | high mana |

Repeat pattern for void, flame, lightning, time, life with effect types from executor.

---

## 5. Divine Art Unlock Progression

| Source | Divine Arts unlocked |
|--------|-----------------------|
| Level milestones | 1 art every 4 levels |
| Chapter story rewards | 2 per chapter |
| Secret manual encounter | 1 variant |
| Boss first kill | 1 variant |

Track in save (`content/progression/skill-unlocks.json` already authors the source table):

```typescript
unlockedArts: string[];  // was `unlockedSkills`
```

Divine Arts panel (sub-plan 12) shows locked/unlocked; equip only unlocked **and** intent-gated
arts (sword variants stay greyed out pre-milestone even once "unlocked" by level/story).

---

## 6. Loot Tables

Author `content/loot/*.json` for all enemies:

- Gold range
- Weighted item drops (common 70%, uncommon 25%, rare 5%)
- Boss guaranteed drop table

Cross-validate item ids exist.

---

## 7. Boss Phase Scripts

Standardize boss JSON `phases[]`:

```json
{
  "phases": [
    {
      "hpThreshold": 1.0,
      "skills": ["skill.void.slash", "skill.enemy.slam"],
      "spawnAdds": []
    },
    {
      "hpThreshold": 0.5,
      "skills": ["skill.enemy.enrage"],
      "spawnAdds": [{ "id": "enemy.rift.spawn", "count": 2 }]
    }
  ]
}
```

Extend enemy AI boss archetype to read phase config — if missing from sub-plan 08, add minimal `BossPhaseAI.ts` here (document in acceptance).

### 7.1 Boss defeat (not kill)

All bosses: `"opponentKind": "cultivator"`, `"canReAggro": false`, `"defeatRecoverMs": 90000`–`120000`.
On HP = 0 → return to arena origin → **long gather-qi recovery** (visual) while `map:boss-defeated`
fires. [`combat-defeat-canon.md`](./combat-defeat-canon.md) §2.2.

---

## 8. Balance Pass

Spreadsheet or markdown `handbook/balance/enemy-hp-table.md`:

- TTK vs player DPS per chapter ~ 8–15 hits normal enemy
- Boss fight 90–180 seconds

Run automated sim stub:

```typescript
// tools/balance/sim-ttk.ts — optional Monte Carlo lite
```

---

## 9. Bestiary Data

Each enemy JSON add:

```json
{
  "bestiaryKey": "bestiary.slime.desc",
  "weakness": "spirit",
  "resistance": "physical"
}
```

Bestiary panel in Home (extend sub-plan 12) reads on kill.

---

## 10. Validation

```bash
pnpm content:validate --strict-i18n
```

Assert:

- Exactly 25 enemy files
- Exactly 40 Divine Art (`skill.*`) files
- 8 enemies with `"category": "boss"`

---

## 11. Acceptance Criteria

- [x] 25 enemy JSON files validate
- [x] 8 boss fights use phase scripts
- [x] 40 Divine Art JSON files validate
- [x] `unlockedArts` progression wired to story/level
- [x] Sword-intent variants stay uncastable pre-milestone even when "unlocked"
- [x] Loot tables reference valid Dharma Treasures (`item.*`)
- [x] Bestiary entries show for all enemies after kill
- [x] No duplicate Divine Art ids
- [x] Simulator or manual TTK doc completed

---

## 12. Scope Guard

Do NOT hand-author 40 unique VFX — reuse VFXLibrary presets with color/tint params in JSON
`vfx.tint`, drawing tints from the Intent VFX palette (`handbook/pixel-art-style.md` §3.1).
Per-art **power UI (L/M/S)**, AOE radius, and uniqueness hooks: [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §9.

---

## 13. Handoff

Sub-plan 25 adds audio cues per boss Divine Art telegraph. Sub-plan 24 localizes Divine Art/enemy names.
