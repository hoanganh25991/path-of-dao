# Sub-Plan 17: World Map & Free Travel

**Phase:** 5 — World & Content  
**Estimated effort:** 10–12 hours  
**Depends on:** `12-home-ui-panels`, `16-combat-power-profile`, `06-phaser-map-scene-base`  
**Blocks:** `18`, `21`, `22`

---

## 1. Objective

Implement world map UI with 10 regions / 20 map nodes, free travel, difficulty hints, lock/unlock rules, and seamless launch into combat.

---

## 2. World Structure

| Chapter | Region | Maps |
|---------|--------|------|
| 1 | Fallen Village | map.fallen_village.01, .02 |
| 2 | Mist Forest | map.mist_forest.01, .02 |
| 3 | Stone Canyon | map.stone_canyon.01, .02 |
| 4 | Moon Lake | map.moon_lake.01, .02 |
| 5 | Burning Desert | map.burning_desert.01, .02 |
| 6 | Thunder Peaks | map.thunder_peaks.01, .02 |
| 7 | Frozen Palace | map.frozen_palace.01, .02 |
| 8 | Abyss Rift | map.abyss_rift.01, .02 |
| 9 | Heavenly Gate | map.heavenly_gate.01, .02 |
| 10 | Void Throne | map.void_throne.01, .02 |

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/ui/world/WorldMap.ts` | Full-screen map overlay |
| `src/ui/world/RegionNode.ts` | Chapter cluster |
| `src/ui/world/MapNode.ts` | Individual map pin |
| `src/progression/WorldProgression.ts` | Unlock rules |
| `content/world/world-map.json` | Layout positions, links |
| `src/ui/world/world-map.css` | Scrollable/pinch map art |

---

## 4. world-map.json Schema

```json
{
  "regions": [
    {
      "chapterId": "chapter.01.fallen_village",
      "position": { "x": 120, "y": 400 },
      "maps": [
        {
          "mapId": "map.fallen_village.01",
          "position": { "x": 80, "y": 30 },
          "unlock": { "type": "default" }
        },
        {
          "mapId": "map.fallen_village.02",
          "position": { "x": 140, "y": 60 },
          "unlock": { "type": "clearMap", "required": "map.fallen_village.01" }
        }
      ]
    }
  ]
}
```

---

## 5. Unlock Rules

| Type | Behavior |
|------|----------|
| default | Available from start (chapter 1 map 1) |
| clearMap | Requires prior map cleared |
| clearBoss | Requires boss id defeated |
| chapterGate | Requires previous chapter final map cleared |

`WorldProgression.canEnter(mapId, save): { ok: boolean; reason?: string }`

**Free travel:** Any unlocked map enterable regardless of player level — difficulty badge warns (sub-plan 16).

---

## 6. WorldMap UI

- Open from Home Play panel
- Pan/zoom scrollable illustrated map (placeholder SVG regions OK)
- Tap map node → detail sheet:
  - Map name (localized)
  - Recommended CP
  - Difficulty badge
  - Cleared checkmark
  - **Enter** button
- Enter → `SceneRouter.switchTo('combat', { mapId })`
- Set `save.progress.currentMapId = mapId` before switch

---

## 7. Visual States

| State | Style |
|-------|-------|
| Locked | grayscale, lock icon |
| Unlocked | full color pulse |
| Cleared | jade check overlay |
| Current | gold ring |

---

## 8. Region Progress

Show chapter title + 2 dots for map clear status under region node.

---

## 9. Connection Lines

SVG paths between map nodes in same chapter; dashed line to next chapter when chapter gate cleared.

---

## 10. Tests

| Test | Assert |
|------|--------|
| ch1 map1 | always enterable |
| ch1 map2 | locked until map1 clear |
| ch2 | locked until ch1 complete |
| canEnter returns reason key | for UI toast |

---

## 11. Acceptance Criteria

- [ ] World map opens from Home Play button
- [ ] 10 region clusters visible (placeholder art OK)
- [ ] Enter launches correct Phaser map (test map stub until 21)
- [ ] Locked maps show reason, cannot enter
- [ ] Cleared maps show checkmark
- [ ] Difficulty badge on detail sheet
- [ ] currentMapId saved for Continue
- [ ] Unit tests pass

---

## 12. Mobile UX

- Pinch zoom 0.8–2.0×
- Double-tap region centers view
- Map larger than viewport — scroll exploration feel

---

## 13. Handoff

Sub-plans 21–22 replace combat stubs with real maps. Sub-plan 18 triggers chapter unlock on final map clear.
