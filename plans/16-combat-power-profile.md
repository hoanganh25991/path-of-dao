# Sub-Plan 16: Combat Power & Character Profile

**Phase:** 4 — Progression  
**Estimated effort:** 6–8 hours  
**Depends on:** `04-stat-sheet-rpg-core`, `11-equipment-3d-preview`, `13-cultivation-realm-system`, `14-insight-system`  
**Blocks:** `17`, `21`

---

## 1. Objective

Implement Combat Power (CP) calculation, profile screen stats, "Years Cultivated" flavor stat, and map difficulty hints based on CP/realm. Profile portrait may reuse sticky-man thumbnail style from [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §4 (future).

---

## 2. Combat Power Formula (Canonical)

**⚠️ Corrected 2026-07:** this file previously had `stats.speed * 1.2`, a 100x discrepancy
against the canonical formula in `plans/index.md` §7.1 (`Speed×120`). Fixed below — §7.1 is the
source of truth if these ever drift again.

```typescript
function computeCombatPower(
  stats: BaseStats,
  realmOrder: number,
  masterIntents: Record<string, MasterIntentState>  // save field stays `insights` internally (§1.2)
): number {
  const base =
    stats.hpMax * 0.15 +
    stats.manaMax * 0.08 +
    stats.atk * 2.5 +
    stats.def * 2.0 +
    stats.crit * 800 +
    stats.critDmg * 400 +
    stats.speed * 120 +
    stats.spirit * 1.5;

  const realmBonus = realmOrder * 50000;
  const insightBonus = Object.values(masterIntents)
    .filter(i => i.awakened)
    .length * 25000;

  return Math.floor(base + realmBonus + insightBonus);
}
```

Display with locale thousands separator.

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/progression/CombatPower.ts` | Calculator |
| `src/ui/home/ProfilePanel.ts` | Full stat breakdown |
| `src/ui/components/DifficultyBadge.ts` | easy/normal/hard/deadly |
| `tools/cp-calculator-cli.ts` | Dev CLI for content balancing |

---

## 4. Profile Panel Stats

From void-ascension concept — show in expandable Profile tab or header long-press:

| Field | Source |
|-------|--------|
| Level | stats.level |
| Cultivation Realm | save.realm |
| Combat Power | computed |
| HP / Mana | runtime/max |
| ATK / DEF | resolved stats |
| Crit / Crit Dmg | resolved |
| Movement Speed | resolved |
| Spirit Energy | stats.spirit |
| Total Play Time | format hh:mm |
| Maps Cleared | progress.clearedMaps.length |
| Bosses Defeated | progress.clearedBosses.length |
| Years Cultivated | flavor formula below |

---

## 5. Years Cultivated (Flavor)

> **⚠️ Revised 2026-07-06** (user request): the original formula was play-time-based (120 played
> seconds = 1 year), which could rack up absurd numbers within a single sitting and didn't match
> the novel's decades-long cultivation timescale. Now based on **real calendar time** — one real
> day since the save was created equals one cultivated year, so years accumulate whether or not
> the player is actively playing (an idle-game-style clock, not a play-time counter). Implemented
> in `src/progression/YearsCultivated.ts` (previously duplicated inline in both `ProfileHeader.ts`
> and `ProfilePanel.ts` — now a single shared function).

```typescript
function yearsCultivated(createdAt: string, realmOrder: number): number {
  const daysElapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
  return daysElapsed + realmOrder * 17;
}
```

Display example: **143 years** — matches concept doc tone.

---

## 6. Difficulty Badge

Compare player CP to map `recommendedCp`:

| Ratio CP_player / CP_map | Badge |
|--------------------------|-------|
| >= 1.5 | trivial (green) |
| 1.0 – 1.5 | balanced (white) |
| 0.7 – 1.0 | challenging (yellow) |
| 0.5 – 0.7 | hard (orange) |
| < 0.5 | deadly (red) |

Used on world map detail sheet (sub-plan 17).

### 6.1 Travel confidence (Story Gate — 3 levels)

Portal **Story Gate** modal and enter warnings use a simpler **low / medium / high** copy tier
(plan 17 §6.2) — derived from the same CP ratio:

| Ratio | Confidence | Player message tone |
|-------|------------|---------------------|
| < 0.7 | **low** | Cultivators here far exceed you — likely swift death |
| 0.7 – 1.0 | **medium** | You may struggle; retreat is wisdom |
| ≥ 1.0 | **high** | Your power matches this road — proceed with confidence |

```typescript
function travelConfidence(playerCp: number, mapRecommendedCp: number): 'low' | 'medium' | 'high';
```

Locale: `world.travel.confidence.low|medium|high`. **Never blocks travel** — warn only.

## 7. Power Fantasy on Revisit

When player CP > map CP × 1.5:

```typescript
function applyOverlevelBonus(playerRealmOrder, mapRealmOrder): DamageMultiplier;
// +10% per realm order diff, max +50%
```

Already specified in sub-plan 13 — wire DamageCalculator param here with helper.

---

## 8. EventBus

```typescript
EventBus.emit('cp:changed', { cp: number });
```

ProfileHeader subscribes to update display on equip/breakthrough/awaken.

---

## 9. CLI Tool

```bash
pnpm cp:calc --level 35 --realm void_spirit --gear loadout/endgame.json
```

Outputs CP for content authors tuning map recommendedCp.

---

## 10. Tests

`tests/unit/combat-power.test.ts`:

| Case | Assert |
|------|--------|
| Starter hero | CP range **must be recomputed** against `speed*120` (was authored against the buggy `speed*1.2`; the old "~500–2000" range is stale and will be much higher now that speed contributes 100x more — verify against `content/progression/base-stats.json` and document the real number here once computed) |
| +1 awakened intent | +25000 |
| Realm order 6 vs 1 | +250000 realm diff |

`tests/unit/difficulty-badge.test.ts` — ratio thresholds.

---

## 11. Acceptance Criteria

- [x] CP displays in Home header and updates on equip
- [x] Profile panel shows all concept doc fields
- [x] Difficulty badge helper returns correct tier
- [x] Overlevel damage bonus applied in combat vs low maps
- [x] CLI tool runs and prints CP
- [x] Unit tests pass

---

## 12. Handoff

Sub-plan 17 shows difficulty badge on map nodes. Content sub-plans 21–22 set `recommendedCp` per map using CLI.
