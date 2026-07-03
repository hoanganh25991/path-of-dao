# Sub-Plan 18: Chapter Flow & Story Scenes

**Phase:** 5 — World & Content  
**Estimated effort:** 10–12 hours  
**Depends on:** `12-home-ui-panels`, `17-world-map-travel`, `05-save-system-foundation`  
**Blocks:** `21`, `22`

---

## 1. Objective

Deliver end-of-chapter narrated story scenes (not just rewards), chapter completion flow, Story Archive replay, and integration with map clear events.

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
4. If chapter final → ChapterManager.onChapterComplete(chapterId)
5. SceneRouter.switchTo('story', { chapterId, sceneId })
6. StoryReader plays slides
7. Apply rewards + unlock next chapter
8. storySeen push
9. autosave
10. Continue → Home (or next chapter prompt)
```

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

All slide text via keys in `content/locales/{en,vi}/story/ch01.json` etc.

Example en slide:

> "When the jade pulse faded, you understood — the village did not fall by accident."

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

- [ ] Clearing test chapter final map triggers story scene
- [ ] Slides advance with typewriter + tap
- [ ] Rewards granted once
- [ ] Next chapter appears on world map
- [ ] Story Archive replays without rewards
- [ ] Skip works with confirmation
- [ ] Works in both en and vi (keys present for ch01 minimum)
- [ ] Unit tests pass

---

## 12. Content Authoring Note

Write 4–6 slides per chapter, 2–3 sentences each. End with hook to next region per GDD narrative beats.

---

## 13. Handoff

Sub-plans 21–22 implement maps that fire chapter completion. Sub-plan 24 completes all story strings.
