# Sub-Plan 04: Stat Sheet & RPG Core Formulas

**Phase:** 1 — Core Engine  
**Estimated effort:** 6–8 hours  
**Depends on:** `01-project-scaffold`  
**Blocks:** `05`, `07`, `09`, `13`, `16`

---

## 1. Objective

Define the canonical stat model, derived combat values, level progression, and damage formula used everywhere. Pure TypeScript module with no rendering dependencies.

---

## 2. Primary Stats (from GDD)

| Stat | Key | Description |
|------|-----|-------------|
| Level | `level` | 1–100 MVP cap |
| HP | `hp` / `hpMax` | Health pool |
| Mana | `mana` / `manaMax` | Skill resource |
| Attack | `atk` | Physical damage base |
| Defense | `def` | Damage reduction |
| Crit Chance | `crit` | 0.0–1.0 |
| Crit Damage | `critDmg` | Multiplier, default 1.5 |
| Speed | `speed` | Movement multiplier base 100 |
| Spirit | `spirit` | Cultivation resource for breakthroughs |
| Cultivation Realm | `realm` | Separate system (sub-plan 13), referenced here |

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/progression/StatSheet.ts` | Stat container + modifiers |
| `src/progression/StatModifier.ts` | Flat / percent additive modifiers |
| `src/progression/LevelCurve.ts` | XP table, level-up grants |
| `src/progression/DamageCalculator.ts` | Hit resolution |
| `src/progression/types.ts` | Shared types |
| `content/curves/level-xp.json` | XP thresholds |
| `content/curves/base-stats.json` | Hero base stats per level |
| `tests/unit/damage-calculator.test.ts` | Formula tests |

---

## 4. StatSheet Design

```typescript
interface BaseStats {
  level: number;
  hpMax: number;
  manaMax: number;
  atk: number;
  def: number;
  crit: number;
  critDmg: number;
  speed: number;
  spirit: number;
}

interface RuntimeStats extends BaseStats {
  hp: number;
  mana: number;
}

class StatSheet {
  constructor(base: BaseStats, modifiers: StatModifier[]);
  recalculate(): void;
  get resolved(): Readonly<BaseStats>;
  get runtime(): Readonly<RuntimeStats>;
  applyDamage(amount: number): number;  // returns actual HP lost
  heal(amount: number): void;
  spendMana(cost: number): boolean;
}
```

### 4.1 Modifier stacking order

1. Flat bonuses sum
2. Percent bonuses sum per stat, then multiply: `final = (base + flat) * (1 + pctSum)`
3. Clamp: crit ∈ [0, 0.75], critDmg ∈ [1.2, 3.0], speed ∈ [50, 200]

Document order in code comment — changing order is a breaking change.

---

## 5. Level Curve

`content/curves/level-xp.json`:

```json
{
  "maxLevel": 100,
  "xpToNext": [0, 100, 250, 450, "..."]
}
```

`LevelCurve.ts`:

```typescript
function xpForLevel(level: number): number;
function levelFromTotalXp(totalXp: number): { level: number; xpIntoLevel: number };
function statsForLevel(heroId: string, level: number): BaseStats;
```

MVP hero `hero.wanderer` base growth (example — tune in data):

| Level | HP | ATK | DEF |
|-------|-----|-----|-----|
| 1 | 100 | 10 | 5 |
| 10 | 280 | 35 | 18 |
| 50 | 1200 | 180 | 90 |

Load from `content/curves/base-stats.json` validated by Zod.

---

## 6. Damage Formula

```typescript
interface DamageInput {
  attacker: BaseStats;
  defender: BaseStats;
  skillMultiplier: number;      // 1.0 basic attack
  damageType: 'physical' | 'spirit';
  ignoreDefPct?: number;        // 0–0.5 boss skills
}

interface DamageResult {
  raw: number;
  final: number;
  isCrit: boolean;
  blocked: number;
}
```

**Formula:**

```
base = atk * skillMultiplier
defEffective = def * (1 - ignoreDefPct)
mitigation = defEffective / (defEffective + 100)
raw = base * (1 - mitigation)
if (random() < crit) raw *= critDmg
final = max(1, floor(raw))
```

Spirit damage uses `spirit * skillMultiplier` instead of atk, vs spirit resistance (MVP: `def * 0.5`).

---

## 7. Speed → Movement

```typescript
function moveSpeedPxPerSec(speed: number): number {
  return 180 * (speed / 100);
}
```

Used by player controller sub-plan 07.

---

## 8. Zod Schemas

`src/shared/schemas/curves.ts`:

- Validate level-xp and base-stats JSON on boot
- Fail fast with readable error in dev console

---

## 9. Tests (required)

`tests/unit/damage-calculator.test.ts`:

| Case | Assert |
|------|--------|
| atk 100 vs def 0 | final ≈ 100 |
| atk 100 vs def 100 | final ≈ 50 |
| crit 100%, critDmg 2.0 | final ≈ 2× non-crit |
| floor minimum | final >= 1 |
| ignoreDef 50% | higher damage than 0% |

`tests/unit/stat-sheet.test.ts`:

- Modifier flat + percent order
- HP cannot go below 0
- spendMana fails when insufficient

---

## 10. Acceptance Criteria

- [ ] StatSheet recalculates correctly with stacked equipment modifiers (mock)
- [ ] Damage calculator tests all pass with documented expected values
- [ ] Level curve loads from JSON; invalid JSON throws in dev
- [ ] No Phaser/Three imports in progression module
- [ ] Exported types used by later sub-plans documented in `types.ts`

---

## 11. Handoff

- Sub-plan 05 serializes `StatSheet` + runtime HP/mana into save
- Sub-plan 09 uses `DamageCalculator` for combat hits
- Sub-plan 16 uses resolved stats for Combat Power
