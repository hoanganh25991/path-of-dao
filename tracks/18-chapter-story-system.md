# 18 — Chapter flow & story scenes

**Status:** `[~]` In progress  
**Plan:** [plans/18-chapter-story-system.md](../plans/18-chapter-story-system.md)  
**Last updated:** 2026-07-03

## Summary

Clearing a chapter finale triggers a full-screen story scene; archive replays unlocked chapters.

## Done

- Ten chapter stubs with story scene data
- Map clear on exit (all waves done) advances chapter progress
- **Depart portal** appears only after waves cleared; pause menu for early retreat
- Chapter finale routes to dedicated story scene host
- Story reader: typewriter text, tap to advance, skip with confirm
- Rewards applied once per chapter; next chapter unlocks
- **Chapter unlock toast** on story finish → Journey tab (`chapter:unlocked` → Home nudge)
- Story finish advances `currentMapId` to next journey map; Home backdrop skips cleared stops
- **Chapter 1 loop integration test** — explore clear → boss → story → ch2 skill unlock
- Story archive in Home replays without duplicate rewards
- Chapter 1 full English and Vietnamese copy
- Chapters 2–10 use stub slide keys pending literary pass

## Remaining

- **Tiên Nghịch gap:** story tone pass for perseverance / diary style across all chapters (T6)
- Sword destiny beat in chapters 1–2 slides
- Expand chapter 1 rewards narrative to tease the ancient blade

## Verification

- Clear test map → story scene on chapter finale
- Archive replay does not double-grant rewards
- Unit: ch1 `.01` → `.02` → story → `map.mist_forest.01` next stop + `skill.life.pulse.v2`
- E2E: ch1 story finish → Continue Journey targets Foggy Trail
- E2E: ch2 boss → story → Continue Journey targets Canyon Mouth
- E2E: ch5–ch9 explore clears unlock Time Slow through Void Tear (save `unlockedSkills`)
- E2E: ch2–ch9 boss → story → Continue Journey targets next explore map
- E2E: ch10 boss → story → journey complete (no Continue CTA)
- E2E: **fresh save** ch1 loop — Begin Journey → Void Slash → boss story → Life Pulse v2 → Foggy Trail + My Path rows
- E2E: **fresh save** full road ch1–10 — all explore + chapter skills, epilogue story, journey complete (no dev seeds)
- E2E: Path tab story replay without duplicate spirit rewards
