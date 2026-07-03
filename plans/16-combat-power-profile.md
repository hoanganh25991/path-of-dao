# Sub-Plan 16: Combat Power & Character Profile

**Phase:** 4 — Progression  
**Estimated effort:** 6–8 hours  
**Depends on:** `04-stat-sheet-rpg-core`, `11-equipment-3d-preview`, `13-cultivation-realm-system`, `14-insight-system`  
**Blocks:** `17`, `21`

---

## 1. Objective

Implement Combat Power (CP) calculation, profile screen stats, "Years Cultivated" flavor stat, and map difficulty hints based on CP/realm.

---

## 2. Combat Power Formula (Canonical)

```typescript
function computeCombatPower(
  stats: BaseStats,
  realmOrder: number,
  insights: Record<string, InsightState>
): number {
  const base =
    stats.hpMax * 0.15 +
    stats.manaMax * 0.08 +
    stats.atk * 2.5 +
    stats.def * 2.0 +
    stats.crit * 800 +
    stats.critDmg * 400 +
    stats.speed * 1.2 +
    stats.spirit * 1.5;

  const realmBonus = realmOrder * 50000;
  const insightBonus = Object.values(insights)
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

```typescript
function yearsCultivated(totalPlaySeconds: number, realmOrder: number): number {
  return Math.floor(totalPlaySeconds / 120) + realmOrder * 17;
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

Used on world map nodes (sub-plan 17).

---

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
| Starter hero | CP ~ 500–2000 range (document exact) |
| +1 awakened insight | +25000 |
| Realm order 6 vs 1 | +250000 realm diff |

`tests/unit/difficulty-badge.test.ts` — ratio thresholds.

---

## 11. Acceptance Criteria

- [ ] CP displays in Home header and updates on equip
- [ ] Profile panel shows all concept doc fields
- [ ] Difficulty badge helper returns correct tier
- [ ] Overlevel damage bonus applied in combat vs low maps
- [ ] CLI tool runs and prints CP
- [ ] Unit tests pass

---

## 12. Handoff

Sub-plan 17 shows difficulty badge on map nodes. Content sub-plans 21–22 set `recommendedCp` per map using CLI.
