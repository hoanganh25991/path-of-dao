# Sub-Plan 22: MVP Maps — Chapters 6–10

**Phase:** 6 — MVP Content  
**Estimated effort:** 16–20 hours  
**Depends on:** `21-mvp-maps-chapters-1-5`  
**Blocks:** MVP ship

---

## 1. Objective

Complete remaining 10 maps (chapters 6–10), 3 final bosses, endgame epilogue story, and Void Throne finale map.

---

## 2. Map Roster

| Map ID | Chapter | Theme | Boss |
|--------|---------|-------|------|
| map.thunder_peaks.01 | 6 | Cliffs, lightning | — |
| map.thunder_peaks.02 | 6 | Storm altar | boss.thunder_avatar |
| map.frozen_palace.01 | 7 | Ice halls | — |
| map.frozen_palace.02 | 7 | Throne room | boss.frost_queen |
| map.abyss_rift.01 | 8 | Corrupted rift | — |
| map.abyss_rift.02 | 8 | Void pit | boss.rift_horror |
| map.heavenly_gate.01 | 9 | Celestial stairs | — |
| map.heavenly_gate.02 | 9 | Gate trial | boss.celestial_guardian |
| map.void_throne.01 | 10 | Void approach | — |
| map.void_throne.02 | 10 | Final throne | boss.void_sovereign |

---

## 3. recommendedCp Bands

| Chapter | Map .01 | Map .02 |
|---------|---------|---------|
| 6 | 45,000 | 60,000 |
| 7 | 75,000 | 95,000 |
| 8 | 120,000 | 150,000 |
| 9 | 180,000 | 220,000 |
| 10 | 260,000 | 320,000 |

Player with full awakenings + realm 6–7 should feel challenged on 9–10, overpowered on 1–3.

---

## 4. New Enemies (13 types — completes 25)

| ID | Archetype | Chapter |
|----|-----------|---------|
| enemy.storm.hawk | ranged_kiter | 6 |
| enemy.lightning.sprite | melee_chaser | 6 |
| enemy.ice.golem | melee_chaser | 7 |
| enemy.frost.shade | ranged_kiter | 7 |
| enemy.rift.spawn | melee_chaser | 8 |
| enemy.corrupted.cultist | ranged_kiter | 8 |
| enemy.celestial.archer | ranged_kiter | 9 |
| enemy.gate.sentinel | patrol | 9 |
| enemy.void.shade | melee_chaser | 10 |
| enemy.void.weaver | stationary | 10 |
| enemy.elite.* (3 variants) | mixed | 6–9 reuse |

---

## 5. Final Bosses

### boss.thunder_avatar

- Phase 1: lightning strikes telegraphed on ground
- Phase 2: Thunder Step mimic dashes

### boss.frost_queen

- Phase 1: ice shards cone
- Phase 2: arena freeze zones (slow, not full freeze)

### boss.rift_horror

- Phase 1: void pulls
- Phase 2: adds spawn continuously (cap 4)

### boss.celestial_guardian

- Phase 1: alternating sword/beam
- Phase 2: Heavenly Domain mini (1s slow)

### boss.void_sovereign (FINAL)

- Phase 1: void slash variants
- Phase 2: realm suppression (player -20% atk unless awakened void)
- Phase 3: enrage timer 3 min — soft DPS check

Defeat triggers **epilogue story** + credits scroll.

---

## 6. Chapter 10 Epilogue

`story.ch10.epilogue.json`:

- 6 slides resolving cultivation arc
- Reward: cosmetic aura `aura.true_dao.crown` (visual only)
- No new chapter unlock — mark game complete flag `save.progress.gameComplete = true`

Show **Continue** → Home with special banner.

---

## 7. Mechanical Intro per Chapter

| Ch | Teach |
|----|-------|
| 6 | Lightning telegraph dodge |
| 7 | Slow zones positioning |
| 8 | Add priority / pull counterplay |
| 9 | Burst damage windows |
| 10 | All mechanics combined |

---

## 8. Fortuitous Encounters

- ch6: secret manual roll on thunder boss
- ch7: forgotten memory kill streak event enabled
- ch8: ancient inheritance higher weight (lore peak)
- ch9–10: unique one-time encounters only

---

## 9. World Map Integration

- Regions 6–10 unlock via chapter gates from sub-plan 17
- Void Throne region visually distinct (purple void border)

---

## 10. Credits

Simple HTML scroll after epilogue:

- Project title Path of Dao / Void Ascension
- "Thank you for walking the path"

Skip allowed.

---

## 11. Validation

```bash
pnpm content:validate --strict-i18n
```

Playthrough checklist document `handbook/qa/full-playthrough.md`:

- [ ] Ch6→10 sequential
- [ ] Game complete flag set
- [ ] Return to ch1 feels trivial

---

## 12. Acceptance Criteria

- [ ] 10 maps complete (20 total with plan 21)
- [ ] 8 bosses total functional
- [ ] Epilogue story + credits play
- [ ] gameComplete persisted
- [ ] recommendedCp curve smooth on spreadsheet
- [ ] Validator clean
- [ ] Performance: void throne < 8 enemies on screen avg

---

## 13. Handoff

Sub-plan 23 fills remaining skill variants. Sub-plan 24–26 polish for ship.
