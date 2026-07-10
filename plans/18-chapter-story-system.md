# Sub-Plan 18: Chapter Flow & Story Scenes

**Phase:** 5 — World & Content  
**Estimated effort:** 10–12 hours  
**Depends on:** `12-home-ui-panels`, `17-world-map-travel`, `05-save-system-foundation`  
**Blocks:** `21`, `22`

---

## 1. Objective

Deliver end-of-chapter narrated story scenes (not just rewards), chapter completion flow, Story Archive replay, and integration with map clear events. Story cards use painterly house style; combat cultivators on cleared maps follow regional palette §5.2 in [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md).

> **Per-map story:** plan 18 covers **chapter finales** only (10 scenes). **Every map** also gets a
> shorter **timeline shard** (image + Wang Lin parallel + Intent punch-line) per
> [`plans/31-wang-lin-story-timeline.md`](./31-wang-lin-story-timeline.md). Shard plays on map
> clear; chapter scene plays after on `.02`.

---

## 2. Chapter Story Table

| Ch | Title Key | Trigger Map | Story Scene ID |
|----|-----------|-------------|----------------|
| 1 | chapter.01.title | map.fallen_village.02 | story.ch01.awakening_jade |
| 2 | chapter.02.title | map.mist_forest.02 | story.ch02.spirit_fox |
| 3 | chapter.03.title | map.stone_canyon.02 | story.ch03.bandit_end |
| 4 | chapter.04.title | map.moon_lake.02 | story.ch04.ancient_seal |
| 5 | chapter.05.title | map.burning_desert.02 | story.ch05.survival |
| 6 | chapter.06.title | map.thunder_peaks.02 | story.ch06.lightning_step |
| 7 | chapter.07.title | map.frozen_palace.02 | story.ch07.forgotten_queen |
| 8 | chapter.08.title | map.abyss_rift.02 | story.ch08.corruption |
| 9 | chapter.09.title | map.heavenly_gate.02 | story.ch09.guardians |
| 10 | chapter.10.title | map.void_throne.02 | story.ch10.epilogue |

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/ui/story/StorySceneHost.ts` | SceneRouter story mode |
| `src/ui/story/StoryReader.ts` | Typewriter text + illustration |
| `src/progression/ChapterManager.ts` | Clear detection + rewards |
| `content/chapters/*.json` | Chapter metadata |
| `content/story/*.json` | Scene scripts |
| `assets/story/*.webp` | Illustrations placeholder |

---

## 4. Story Scene Schema

`content/story/story.ch01.awakening_jade.json`:

```json
{
  "id": "story.ch01.awakening_jade",
  "chapterId": "chapter.01.fallen_village",
  "slides": [
    {
      "illustration": "assets/story/ch01-jade.webp",
      "textKey": "story.ch01.slide01",
      "durationMs": 0
    },
    {
      "illustration": null,
      "textKey": "story.ch01.slide02",
      "durationMs": 0
    }
  ],
  "rewards": [
    { "type": "item", "id": "item.spirit.jade", "qty": 1 },
    { "type": "spirit", "amount": 30 }
  ],
  "unlockChapter": "chapter.02.mist_forest"
}
```

---

## 5. Chapter Completion Flow

On map clear event for final stage map:

```
1. Combat victory overlay (2s)
2. Save: clearedMaps push
3. If boss map → clearedBosses push
4. Record JourneyLog entry, kind 'map_clear' (sub-plan 28) — snapshot current Realm/Lv/CP now,
   before any story rewards below can change them
5. If chapter final → ChapterManager.onChapterComplete(chapterId)
6. SceneRouter.switchTo('story', { chapterId, sceneId })
7. StoryReader plays slides
8. Apply rewards + unlock next chapter
9. storySeen push; record a second JourneyLog entry, kind 'story', for the chapter finale beat
10. autosave
11. Continue → Home (or next chapter prompt)
```

Both journey entries are **snapshot-once** — see sub-plan 28's snapshot rule: never recompute
Realm/Lv/CP for a past entry, even if the player's stats change later.

---

## 6. StoryReader UX

- Full screen HTML over black
- Illustration top 45%, text bottom 55%
- Typewriter 35 chars/sec, tap to complete line
- Tap right half → next slide; left half → prev (if allowed)
- Skip button after slide 2 — confirms dialog
- BGM duck 50% during story

SceneRouter `story` mode: hide canvases, show reader only.

---

## 7. Story Archive (Home)

Story panel lists chapters where `storySeen` includes scene id:

- Thumbnail from first slide illustration
- Tap → replay story (no rewards second time)

---

## 8. SceneRouter Extension

Add `StorySceneHost` implementing SceneHost:

- mount → StoryReader.open(sceneId)
- unmount → cleanup

Update sub-plan 02 enum if not already including `story`.

---

## 9. Localization

All slide text via keys in `content/locales/{en,vi}/story.json` (single bundle per locale; keys `story.chNN.slideMM`).

**Wang Lin alignment (2026-07-10):** all 10 chapters expanded to **6 slides** each — first-person cultivation diary mirroring [handbook/renegade-immortal-reference.md](../handbook/renegade-immortal-reference.md) §Story phases (Heng Yue rejection → Lôi Tiên Điện). Ordeal cultivators named per [world-road-bosses.md](../handbook/world-road-bosses.md). Original prose only — no novel paste.

Example en slide:

> "The Heng Yue Sect elders measured my roots and laughed. Poor talent, they said — unworthy of discipleship."

---

## 10. Tests

| Test | Assert |
|------|--------|
| onChapterComplete | unlocks next chapter |
| replay | no duplicate rewards |
| storySeen | appended once |
| final map detection | only stage .02 triggers |

---

## 11. Acceptance Criteria

**Runtime (shipped):**

- [x] Clearing test chapter final map triggers story scene
- [x] Slides advance with typewriter + tap
- [x] Rewards granted once
- [x] Next chapter appears on world map
- [x] Story Archive replays without rewards (Path tab → Replay)
- [x] Skip works with confirmation
- [x] Works in both en and vi
- [x] Unit tests pass

**Content — Wang Lin road (2026-07-10):**

- [x] **10 chapters × 6 slides** — en+vi in `content/locales/{en,vi}/story.json`
- [x] `content/story/story.ch*.json` wired to 6 slides each
- [x] Story beats match handbook phase table (Tu Sen, Liu Mei, Hong Die, …)
- [ ] Chapter illustrations (`assets/story/*.webp`) — null placeholders
- [ ] Optional: 8–10 slides for ch1–2 if playtest wants more depth

**Integration with plan 31:**

- [ ] Map-clear offers Dao Scroll shard read (`.01` and `.02`) — owned by plan 31
- [ ] Chapter finale + timeline shard on same `.02` clear — complementary, not duplicate rewards

---

## 12. Implementation status (2026-07-10)

| Layer | Status | Notes |
|-------|--------|-------|
| StoryReader + SceneRouter | `[x]` | Typewriter, skip, replay |
| Chapter flow + rewards | `[x]` | `ChapterManager` |
| **Prose content** | `[x]` | 60 slides total (10×6), Wang Lin aligned |
| Illustrations | `[ ]` | `encounter-art` / painterly pipeline |
| Dao Scroll hook | `[ ]` | See [31](./31-wang-lin-story-timeline.md) |

**Track:** [tracks/18-chapter-story-system.md](../tracks/18-chapter-story-system.md)

---

## 13. Content Authoring Note

Target **4–6 slides** per chapter, **2–4 sentences** each. End with hook to next region per GDD narrative beats. **Shipped 2026-07-10** at 6 slides/chapter — expand individual chapters if playtest asks for more beats (e.g. Heng Yue examination, sword cave).

---

## 14. Handoff

Sub-plans 21–22 implement maps that fire chapter completion. Sub-plan 24 completes all story strings.
