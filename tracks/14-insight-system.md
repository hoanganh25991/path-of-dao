# 14 — Insight progression & awakenings

**Status:** `[~]` In progress — **plan redesigned, code not migrated**  
**Plan:** [plans/14-insight-system.md](../plans/14-insight-system.md)  
**Last updated:** 2026-07-10

## Summary

**Shipped:** legacy six-intent meter (`sword`, `void`, `flame`, `lightning`, `time`, `life`) via `InsightSystem` + `content/progression/insights.json`.  
**Plan (2026-07-06):** **Master Intent** — 3 **main-flow** (`life_death` → `cause_effect` → `truth_falsehood`, sequential) + 3 **gate** (`sword`, `flame`, `lightning`); `MasterIntentSystem.isIntentUnlocked()` — **not implemented in code yet**.

## Done

- Six intents: Sword, Void, Flame, Lightning, Time, Life
- **Earned-only skills** — new game starts with zero unlocks; level/boss/chapter/**map clear**/cơ duyên grant skills; Skills panel lists discovered intents only
- First technique: **Void Slash** on clearing `map.fallen_village.01`; toast on Home → Skills tab
- Insight XP from skill use, crit kills, and boss hits
- Meter in combat HUD (0–100% display)
- Awakening ceremony modal from Skills panel
- **Home nudge:** toast when intent ready (tap opens Skills tab)
- Sword Intent gated until ancient sword milestone (T7)
- Twelve skill configs (six base + six awakened)
- Equipped skill slots: primary, secondary, ultimate

## Remaining

- **Active work (user decision):** migrate to plan 14 redesign — `MasterIntentSystem`, main-flow sequential + gate milestones
- Update `content/progression/insights.json` roster (`life_death`, `cause_effect`, `truth_falsehood` + gate)
- Rename player-facing copy Insight → **Master Intent (Ý Cảnh)** in remaining UI
- Dao Scroll Intent lessons (plan 31) depend on this curriculum

## What needs to do

| # | Task | Files / notes |
|---|------|----------------|
| 1 | Add `MasterIntentSystem` with `isIntentUnlocked(intentId, save)` | `src/progression/MasterIntentSystem.ts` |
| 2 | Rewrite `insights.json` — 3 main-flow + 3 gate intents; map old skills → new tags | `content/progression/insights.json` |
| 3 | Main-flow: next intent locked until previous **awakened** | gate: sword=ancient sword, flame=ch5 boss, lightning=ch6 boss |
| 4 | Wire unlock check into cast (`CombatComponent`), equip (`SkillUnlockManager`), Home Divine Arts rows | replace ad-hoc sword-only gate where duplicated |
| 5 | Migrate `InsightSystem` XP sources to new intent ids; keep meter HUD | combat HUD + awakening modal |
| 6 | Locale: `intent.life_death` etc. in glossary | `content/locales/glossary.md` |
| 7 | Unit tests: sequential unlock, gate milestones, awakening swap on loadout | `tests/unit/master-intent.test.ts` |

**Depends on:** plan 31 Dao Scroll uses same Intent lesson ids — align §5 table before authoring shard `intentLesson` fields.

## Verification

- XP accumulates and caps correctly; realm gate enforced
- Dev cheat prepares instant awakening for QA
