# 13 — Cultivation realm & breakthrough

**Status:** `[x]` Done  
**Plan:** [plans/13-cultivation-realm-system.md](../plans/13-cultivation-realm-system.md)  
**Last updated:** 2026-07-04

## Summary

Seven-realm cultivation ladder with breakthrough ceremony when gates are met. Passive qi recovery scales with realm order.

## Done

- Realm ladder from Mortal Body through True Dao
- Sub-tier auto-advance every 3 player levels within a realm
- Breakthrough gates: level threshold, spirit resource, boss clear, **Tiên Ngọc (Immortal Jade)** inventory cost from qi→foundation onward
- Combat HUD third bar shows **cultivation XP** (fills on enemy kills), not insight meter
- Level-up combat toast with realm sub-tier messaging (*Đột phá — Ngưng Khí · Trung Kỳ*)
- Map intro modal on first portal entry (lore + `recommendedRealmOrder` ceiling copy)
- Full-screen breakthrough modal ceremony
- Cultivate button appears when breakthrough gates are met
- Toast nudge when breakthrough first becomes ready on Home
- Listens to `realm:breakthrough-ready` for live refresh after boss kills
- Realm stat scaling on level-curve stats
- Combat damage bonus per realm tier (+10% per tier, max +50%)
- Home aura updates after breakthrough
- **Health regen formula** uses `realmOrder` + level — shared by player meditate and cultivator sit recovery

## Remaining

None for this sub-plan.

## Verification

- Breakthrough flow testable via dev cheat (level 5 + spirit 100)
- Realm damage bonus covered by unit tests
- Health regen scales with realm order (`tests/unit/health-regen.test.ts`)
- `progression:xp-gained` refreshes combat HUD meter on every kill (`tests/unit/player-status-bar.test.ts`)
- Level-up toast uses sub-tier at new level via `CultivationRealm.updateTierFromLevel` (`tests/unit/kill-progression-events.test.ts`)
- Home toast when only Tiên Ngọc blocks breakthrough (`ProfileHeader` + `getBreakthroughBlockers`)
- Map intro first-entry: `tests/unit/cultivation-display.test.ts` (MapIntroManager)
