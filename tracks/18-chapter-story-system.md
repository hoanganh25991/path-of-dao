# 18 — Chapter flow & story scenes

**Status:** `[~]` Runtime done · content expanded · art + Dao Scroll hook pending  
**Plan:** [plans/18-chapter-story-system.md](../plans/18-chapter-story-system.md)  
**Last updated:** 2026-07-10

## Summary

End-of-chapter narrated scenes (10 finales) + Path tab replay. **Wang Lin alignment:** all chapters now **6 slides** each — cultivation diary matching [renegade-immortal-reference.md](../handbook/renegade-immortal-reference.md) §Story phases (not novel paste).

---

## Done

- [x] Ten chapter story scenes + `StoryReader` (typewriter, skip, tap advance)
- [x] `ChapterManager` — clear on `.02` exit, rewards once, next chapter unlock
- [x] Path tab replay without duplicate rewards
- [x] **Chapters 1–10 × 6 slides** — en+vi `content/locales/{en,vi}/story.json`
- [x] `content/story/story.ch*.json` — 6 slides wired per scene
- [x] Named ordeal cultivators in prose (Tu Sen, Liu Mei, Hong Die, Vermillion Bird Heir, …)
- [x] E2E: full road ch1–10 story finales + replay

---

## What needs to do

| # | Task | Owner | Blocks |
|---|------|-------|--------|
| 1 | **Chapter illustrations** — `assets/story/ch01-*.webp` … ch10 (painterly; null OK for MVP) | 32 / encounter-art | Polish only |
| 2 | **Dao Scroll integration** — on `.01`/`.02` map clear, offer shard read before/after combat exit | **31** | In-game novel tracker |
| 3 | Optional: expand ch1–2 to 8–10 slides if playtest wants more Heng Yue / sword-cave beats | content | — |
| 4 | Validator: assert every `story.chNN.slideMM` key exists for wired slides | **20** | CI |

**Do not:** duplicate chapter rewards on timeline shard read (shards are read-only per plan 31).

---

## Remaining (short)

- Illustrations null
- Plan 31 map-clear modal + Dao Scroll (see [31](./31-wang-lin-story-timeline.md))

---

## Verification

- `pnpm i18n:lint` — story keys en/vi parity
- Clear `.02` → story scene → 6 slides advance
- Path → Replay → no extra spirit/gold
- E2E: `journey-flow.spec.ts` full road ch1–10
