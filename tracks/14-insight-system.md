# 14 — Master Intent progression & awakenings

**Status:** `[x]` Done — plan 14 redesign migrated to code
**Plan:** [plans/14-insight-system.md](../plans/14-insight-system.md)
**Last updated:** 2026-07-10

## Summary

**Shipped (2026-07-10):** **Master Intent** — 3 **main-flow** (`life_death` → `cause_effect` →
`truth_falsehood`, sequential, next locked until previous **awakened**) + 3 **gate-flow**
(`sword` = `weaponMilestone === 'ancient_sword'`, `flame` = `boss.desert_sovereign` cleared,
`lightning` = `boss.thunder_avatar` cleared) via `MasterIntentSystem.isIntentUnlocked()`.
`InsightSystem` keeps the XP/awakening mechanics and the `insights` save field name (internal,
per `plans/index.md` §1.2 canon) — `MasterIntentSystem` only answers "is this Intent usable now".

**Superseded:** legacy parallel six-intent meter (`sword`, `void`, `flame`, `lightning`, `time`, `life`)
— all six always unlocked, no curriculum. Old saves migrate automatically (see below).

## Done

- `MasterIntentSystem.ts` — `isIntentUnlocked(intentId, save)` (main-flow order + gate rules) and
  `filterSkillsForIntentGates()`; wired into `CombatComponent` cast guard and `SkillLoadout`
  equip/assignable pool
- `content/progression/insights.json` rewritten to the 6-id roster with `flow`/`order`/`gate` per
  intent; `src/shared/schemas/insights.ts` extended with `insightGateSchema`
- `content/skills/*.json` `intent` fields remapped (old `void`→`truth_falsehood` family,
  `life`→`life_death`, `time`→`cause_effect`); skill **ids** unchanged (`skill.void.slash` still
  has that id, just a new `intent` tag) — `SkillDefinition.intent` enum updated to match
- Save migration — `SaveMigration.migrateLegacyInsightKeys()` renames `insights.void`/`life`/`time`
  keys into the new roster (xp/awakened/totalUses carried over) before schema parse; fresh saves
  use new keys only. Covered by `tests/unit/save-manager.test.ts`
- Dao Scroll alignment — `content/story-timeline/*.json` `intentLesson` fields migrated to the new
  ids; `INTENT_LESSON_IDS` enum + `INTENT_RIM_COLORS` (`src/shared/intentColors.ts`) updated
- VFX/audio/icon/HUD literal-intent switches updated: `VFXLibrary.ts`, `AwakeningModal.ts` (+ css),
  `ProfilePanel.ts`, `SkillsPanel.ts`, `AudioDirector.ts`, `App.ts` dev hook, `player-status.css`
- Locales — `intent.life_death` / `intent.cause_effect` / `intent.truth_falsehood` (en+vi) added;
  old `intent.void`/`life`/`time` keys removed (no remaining refs); `glossary.md` updated
  (Insight → **Master Intent** / Ý Cảnh, + the 3 new main-flow intent names); player-facing
  "Insight" copy (`awakening.title`, `home.profile.awakenings`, demo focus/highlight labels)
  renamed to Master Intent phrasing
- `ancients.json` `awakenedIntents`/`insightReadyIntents` remapped to new ids
- `tests/unit/master-intent.test.ts` — sequential unlock, gate milestones (weapon + 2 bosses),
  filterSkillsForIntentGates, awakening still swaps loadout (11 tests)
- Six intents, Earned-only skills, XP from skill use/crit/boss hit, HUD meter, awakening ceremony
  modal, Home nudge toast, equipped skill slots — all pre-existing mechanics unchanged in structure

## Remaining

- Content-pacing gap (not a system bug): `content/progression/skill-unlocks.json` may grant a
  `truth_falsehood`/`cause_effect` skill before its main-flow prerequisite is awakened — the skill
  sits in `unlockedSkills` but stays uncastable/unassignable until the chain catches up. Fine for
  MVP; revisit unlock ordering if it reads as a bug in playtesting.
- `WeaponProgression.filterSkillsForWeaponGate`/`canUseSwordIntent` still exist (used by
  `tests/unit/weapon-progression.test.ts` and as the sword-gate implementation detail inside
  `isIntentUnlocked`) — not dead code, just no longer the call site for equip/cast gating.

## What needs to do

All plan-14-redesign tasks above are done. No open implementation tasks.

## Verification

- `pnpm test` — 543/543 passing (incl. `master-intent.test.ts`, `save-manager.test.ts` migration
  case, `insight-system.test.ts`, `ancient-demo.test.ts`, `skill-loadout.test.ts`, `timeline-loader.test.ts`)
- `tsc --noEmit` — clean
- `node tools/content/validate-all.mjs` and `node tools/content/lint-i18n.mjs` — clean
- XP accumulates and caps correctly; realm gate enforced; dev cheat (`__devPrepareAwakening`)
  prepares instant awakening for QA
