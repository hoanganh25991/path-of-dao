# Sub-Plan 31: Wang Lin Story Timeline (Dao Scroll)

**Phase:** Cross-cutting — Story + Home + World map + Progression  
**Estimated effort:** 12–16 hours (spec + content + UI)  
**Depends on:** `18-chapter-story-system`, `17-world-map-travel`, `28-path-journey-system`, `14-insight-system`  
**Blocks:** Full narrative readability on all 20 MVP maps; Intent teaching layer

> **Master plan:** [index.md](./index.md) §7.11 · **North star:** [handbook/renegade-immortal-reference.md](../handbook/renegade-immortal-reference.md)  
> **Related:** Chapter finales → [18](./18-chapter-story-system.md) · Journey spine → [28](./28-path-journey-system.md)

---

## 1. Problem — what is missing today

| Layer | Exists today | Gap |
|-------|--------------|-----|
| **Chapter story** (plan 18) | 10 scenes × **6 slides**; Wang Lin road prose en+vi | Illustrations still null |
| **Timeline locale** | **20 maps** in `content/locales/{en,vi}/timeline.json` | Not readable in-game yet |
| **My Path** (plan 28) | Journey scroll with strength snapshots | Lists *what happened* — not the **Dao Scroll** read-through |
| **Map enter** | CP/realm intro toast | No illustrated beat, no punch-line |
| **Wang Lin parallel** | Handbook + **timeline locale** | **UI + unlock flow** not wired |

**Player expectation (from *Renegade Immortal* alignment):** the road is Wang Lin's road — mortal
outcast → obsession → thunder hall. Every map stop should teach **why Intent matters** (Wang Lin's
signature strength: cold resolve, dao cost, choosing what to become). The game must let players
**read through** that road — with **images** and a **punch-line quote** per map — not only at
chapter endings.

---

## 2. Objective

Deliver a **Story Timeline** (Dao Scroll) that covers **all 20 MVP maps** and **all paths**
(player free travel, My Path, ancient follow-walk):

1. **Per-map story shard** — short illustrated read (2–4 slides) unlocks on first map clear.
2. **Wang Lin parallel beat** — each shard includes what Wang Lin faced at the same road phase
   (structure from handbook §Story phases — original prose, not novel paste).
3. **Intent punch-line** — one memorable quote per map teaching a life/dao lesson tied to a
   **Master Intent** (Ý Cảnh); Wang Lin is the exemplar of Intent discipline.
4. **Timeline UI** — Home **Path** tab (or dedicated **Dao Scroll** sub-tab): vertical timeline
   with thumbnails, read/unread state, tap to replay any unlocked shard.
5. **Read-through UX** — reuse `StoryReader` patterns: image top, typewriter body, punch-line
   card with gold accent + Intent hue rim.

---

## 3. Design principles

| Principle | Rule |
|-----------|------|
| **Every map, one beat** | 20 maps → 20 `timeline.*` shards minimum |
| **Chapter ≠ timeline** | Chapter scene (plan 18) = finale cinematic; timeline shard = diary entry for *this* map |
| **Wang Lin = mirror** | Parallel text is third-person reference ("On this road, Wang Lin…") — player is their own cultivator |
| **Intent pedagogy** | Each map assigns one **primary Intent lesson** (rotate six Intents; ch10 synthesizes all) |
| **Image required** | Every shard has ≥1 `illustration` (painterly card art — `encounter-art` skill / `assets/story/timeline/`) |
| **Punch-line = takeaway** | Single sentence the player remembers; locale key `*.punchline` — displayed in distinct typography |
| **Read without spoiling** | Shards unlock only after `map_clear`; timeline shows locked nodes as silhouette |
| **All paths** | Free travel, My Path replay, ancient walk — same shard IDs; follow-walk auto-opens shard between maps |

---

## 4. Content model

### 4.1 `TimelineShard` schema

`content/story-timeline/timeline.{mapId}.json`:

```json
{
  "id": "timeline.map.fallen_village.01",
  "mapId": "map.fallen_village.01",
  "chapterId": "chapter.01.fallen_village",
  "wangLinPhase": "mortal_outcast",
  "intentLesson": "life_death",
  "illustration": "assets/story/timeline/ch01-fallen-village-01.webp",
  "slides": [
    {
      "illustration": "assets/story/timeline/ch01-fallen-village-01.webp",
      "textKey": "timeline.ch01.map01.body",
      "durationMs": 0
    },
    {
      "illustration": null,
      "textKey": "timeline.ch01.map01.wang_lin",
      "durationMs": 0
    }
  ],
  "punchlineKey": "timeline.ch01.map01.punchline",
  "punchlineAttributionKey": "timeline.attribution.wang_lin"
}
```

| Field | Purpose |
|-------|---------|
| `wangLinPhase` | Handbook phase slug — links to `renegade-immortal-reference.md` table |
| `intentLesson` | `sword` \| `truth_falsehood` \| `flame` \| `lightning` \| `cause_effect` \| `life_death` |
| `slides` | Player diary + Wang Lin parallel (min 2 slides) |
| `punchlineKey` | Gold callout — life lesson / dao maxim |
| `punchlineAttributionKey` | Usually "— Wang Lin's road" / locale variant |

### 4.2 Map config hook

Extend `content/maps/*.json` (plan 20 validator):

```json
{
  "id": "map.fallen_village.01",
  "timelineShardId": "timeline.map.fallen_village.01"
}
```

### 4.3 Save progress

```ts
progress.timelineSeen: string[];  // timeline shard ids (like storySeen)
progress.journey: JourneyEntry[]; // add kind: 'timeline_shard' (plan 28)
```

On first map clear → push `timelineSeen` → record journey entry → offer **Read now** / **Later**.

### 4.4 Locale layout

`content/locales/{en,vi}/timeline.json` — **shipped 2026-07-10** (single bundle per locale; keys below). Optional split into `timeline/ch01.json` … later if files grow too large.

```json
{
  "timeline.ch01.map01.body": "The fallen village does not mourn loudly. …",
  "timeline.ch01.map01.wang_lin": "On this road, Wang Lin was turned away for poor talent …",
  "timeline.ch01.map01.punchline": "Life is not given to the worthy. It is kept by the stubborn.",
  "timeline.attribution.wang_lin": "— from Wang Lin's road",
  "timeline.map.fallen_village.01.title": "Wang Family Ruins"
}
```

Punch-line uses **Intent color** from [plan 29 §8](../plans/29-pixel-art-combat-canon.md) (`life_death` → teal rim).

---

## 5. Wang Lin × Intent lesson map (all 20 maps)

Wang Lin's arc is the **Intent curriculum**: each map teaches one facet of Master Intent he
embodied (perseverance, void, flame of obsession, tribulation, time's cost, life's price).

| Map | Region beat | Wang Lin phase | Intent lesson | Punch-line theme |
|-----|-------------|----------------|---------------|------------------|
| `map.fallen_village.01` | Village ruins | mortal_outcast | **Life** | Stubborn survival |
| `map.fallen_village.02` | Tu Sen ordeal | mortal_outcast | **Life** | Cost of protecting what remains |
| `map.mist_forest.01` | Exile wilderness | wilderness_exile | **Void** | Walking into uncertainty |
| `map.mist_forest.02` | Liu Mei | wilderness_exile | **Void** | Fortune hides in refusal to quit |
| `map.stone_canyon.01` | Zhao roads | fortuitous_inheritance | **Sword** | First cut — humble blade |
| `map.stone_canyon.02` | Hong Die | fortuitous_inheritance | **Sword** | Ruthlessness has a shape |
| `map.moon_lake.01` | Seal approach | sword_destiny | **Sword** | Destiny is seized, not granted |
| `map.moon_lake.02` | Vermillion Heir | sword_destiny | **Flame** | Seal cracks — obsession ignites |
| `map.burning_desert.01` | Scorched road | tempered_road | **Flame** | Endurance in heat |
| `map.burning_desert.02` | Flame Thunder Lord | tempered_road | **Lightning** | Two elements, one will |
| `map.thunder_peaks.01` | Tribulation sky | heavenly_tribulation | **Lightning** | Heaven tests the stubborn |
| `map.thunder_peaks.02` | Heaven Fate (I) | heavenly_tribulation | **Lightning** | Loss is also a teacher |
| `map.frozen_palace.01` | Memory halls | memory_inner_demon | **Time** | Past power has a price |
| `map.frozen_palace.02` | Wang Yue | memory_inner_demon | **Time** | Memory traded for dao |
| `map.abyss_rift.01` | Rift walk | heart_rift | **Void** | Obsession deepens |
| `map.abyss_rift.02` | Heart demon | heart_rift | **Void** | The self is the last enemy |
| `map.heavenly_gate.01` | Gate approach | threshold | **Flame** | Guardians judge intent |
| `map.heavenly_gate.02` | Gate trial | threshold | **Sword** | Heart before blade |
| `map.void_throne.01` | Thunder approach | obsession_seal | **Time** | Decades compress to steps |
| `map.void_throne.02` | Epilogue hall | obsession_seal | **All six** | What remains after obsession |

Chapter finale scenes (plan 18) **summarize** the chapter; timeline shards **cover every step**.

---

## 6. UI / UX

### 6.1 Dao Scroll (Home → Path tab)

Extend `PathPanel` (plan 28):

```
┌─────────────────────────────────────┐
│  My Path  |  Dao Scroll  |  Ancients │
├─────────────────────────────────────┤
│  ○ ch1 .01  [thumb]  Life — punch…  │  ← read
│  ○ ch1 .02  [thumb]  Life — punch…  │
│  ● ch2 .01  [lock]   Mist Forest    │  ← locked
│  …                                  │
└─────────────────────────────────────┘
```

- **Vertical timeline** — top = earliest map; connector line uses region accent (plan 29 §5.2).
- **Node states:** locked · unread (pulse) · read.
- **Tap node** → `TimelineShardReader.open(shardId)` (fork of `StoryReader`).
- **Punch-line slide** — final slide: full-width quote card, Intent-colored left border, attribution.

### 6.2 Map clear flow (updated)

```
1. Map wave cleared
2. Journey snapshot (map_clear)
3. If timelineShardId unseen → modal: "A page of the road opens" [Read] [Later]
4. If chapter final (.02) → existing chapter story (plan 18) after shard offer
5. timelineSeen push; journey kind 'timeline_shard'
```

### 6.3 Ancient path follow (plan 28)

Between maps in `PathWalkManager`: auto-play timeline shard for that `mapId` (skippable) before
combat — player **reads Wang Lin's road** while walking an ancient's road.

### 6.4 World map (plan 17)

Star portal pin tooltip: show punch-line **one-liner** if shard read; `"?"` if locked.

---

## 7. Deliverables

| File | Purpose | Status (2026-07-10) |
|------|---------|---------------------|
| `content/locales/{en,vi}/timeline.json` | body, wang_lin, punchline, map titles | `[x]` all 20 maps |
| `content/story-timeline/timeline.{mapId}.json` | 20 timeline shard scripts | `[ ]` not created |
| `assets/story/timeline/*.webp` | Painterly illustrations (≤500KB mobile) | `[ ]` placeholders |
| `src/progression/TimelineLoader.ts` | Load + validate shards | `[ ]` |
| `src/ui/story/TimelineShardReader.ts` | Reader with punch-line slide | `[ ]` |
| `src/ui/home/panels/StoryPanel.ts` or `PathPanel.ts` | Dao Scroll sub-tab + timeline list | `[ ]` extend Path tab |
| `src/progression/ChapterManager.ts` | Offer shard on map clear | `[ ]` |
| `src/core/save/SaveSchema.ts` | `timelineSeen: string[]` | `[ ]` |
| `content/maps/*.json` | `timelineShardId` per map | `[ ]` |
| `tests/unit/timeline-loader.test.ts` | Schema + 20-map coverage | `[ ]` |

---

## 8. Art direction

| Asset | Spec |
|-------|------|
| Illustration | Painterly xianxia card — teal `#2dd4a8` + gold `#c9a227` (house style) |
| Aspect | 16:9 or 4:3 top crop in reader |
| Wang Lin depictions | Silhouette / back-turn / partial — **never** full licensed portrait copy |
| Punch-line card | Dark panel, Intent rim 4px, serif quote, attribution in muted gold |

Pixel combat stays separate (plan 29). Timeline is **HTML story layer** only.

---

## 9. Acceptance criteria

**Content (Wang Lin road prose):**

- [x] All **20** MVP maps have en+vi locale keys (`timeline.chNN.mapMM.body|wang_lin|punchline`)
- [x] Map title keys for scroll UI (`timeline.map.*.title`)
- [ ] Every shard has ≥1 illustration path (SVG/WEBP placeholders for MVP)
- [ ] `content/story-timeline/timeline.{mapId}.json` — 20 shard files referencing locale keys

**Runtime (in-game read-through):**

- [ ] Every shard has `punchlineKey` + `intentLesson` in JSON schema
- [ ] Dao Scroll lists all maps in road order; locked until cleared
- [ ] Read-through: image + body + Wang Lin parallel + punch-line slide
- [ ] Replay from Dao Scroll without re-granting rewards
- [ ] Ancient follow-walk plays shard between maps (plan 28)
- [ ] `timelineSeen` persists; journey records `timeline_shard` entries
- [ ] World map pin shows punch-line when shard read (plan 17 §6.4)
- [x] Chapter stories (plan 18) still fire on `.02` — **complemented**, not replaced

---

## 9.1 Implementation status (2026-07-10)

| Phase | Status | Owner track |
|-------|--------|-------------|
| **A — Locale prose** | `[x]` Done | [tracks/31](../tracks/31-wang-lin-story-timeline.md) |
| **B — Shard JSON + maps hook** | `[ ]` Next | 31 + 20 |
| **C — Save + unlock on map clear** | `[ ]` | 31 + 05 |
| **D — Dao Scroll UI (Path sub-tab)** | `[ ]` | 31 + 12 |
| **E — Illustrations** | `[ ]` parallel | 32 / encounter-art |

**Suggested implement order:** B → C → D → E (art can land anytime after D accepts null illus).

**Track:** [tracks/31-wang-lin-story-timeline.md](../tracks/31-wang-lin-story-timeline.md)

---

## 10. Handoff & dependencies

| Consumer plan | Uses this for |
|---------------|----------------|
| [12](./12-home-ui-panels.md) | Path tab → Dao Scroll UI |
| [17](./17-world-map-travel.md) | Portal pin punch-line tooltip |
| [18](./18-chapter-story-system.md) | Shard before chapter finale on `.02` |
| [20](./20-content-pipeline.md) | `timelineShardId` + shard schema validation |
| [21](./21-mvp-maps-chapters-1-5.md) | `timelineShardId` on map JSON; prose in `timeline.json` **done** |
| [22](./22-mvp-maps-chapters-6-10.md) | Same for ch6–10; illustrations parallel |
| [24](./24-localization-en-vi.md) | Full en/vi timeline bundles |
| [28](./28-path-journey-system.md) | Journey kind `timeline_shard`; scroll UI |
| [27](./27-ancient-echo-demo.md) | Optional shard auto-play in demo walk |

**Skills:** `renegade-immortal`, `npc-dialogue`, `quest-writer`, `encounter-art` (illustrations).

---

## 11. Content authoring checklist (per map)

1. Pick `intentLesson` from §5 table.
2. Write **body** — player diary, 2–3 sentences, cold perseverance tone.
3. Write **wang_lin** parallel — handbook phase, third person, no novel quotes.
4. Write **punchline** — one sentence life lesson; must stand alone on the quote card.
5. Commission / generate illustration matching region accent.
6. Wire `timelineShardId` on map JSON; add rewards only on chapter scenes (not shards).

**Bulk prose shipped 2026-07-10** in `timeline.json` (steps 2–4 for all 20 maps). Remaining per map: steps 1 (formalize in shard JSON), 5–6.
