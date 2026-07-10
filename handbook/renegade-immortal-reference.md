# Renegade Immortal — Story Reference (for Path of Dao)

> **Source work:** *Renegade Immortal* (**仙逆** *Xiān Nì*; Vietnamese: *Tiên Nghịch*). Er Gen / 耳根.  
> **Legal:** Path of Dao uses *Renegade Immortal* cosmology, protagonist **Wang Lin**, and story beats for player clarity.  
> **Implementation track:** [tracks/renegade-immortal-alignment.md](../tracks/renegade-immortal-alignment.md) (T1–T8) · **Master plan:** [plans/index.md](../plans/index.md) §1.1, §7.7, §7.8

---

## What it is (one paragraph)

*Renegade Immortal* follows **Wang Lin**, who starts as an ordinary mortal with poor cultivation talent — mocked, pushed aside, surviving through stubborn will rather than destiny. Power comes **late and painfully** — from hidden ruins, risky inheritances, and map-by-map hardship — not from a tutorial chest. The **Heaven Reverse Sword** tied to ancient will becomes a turning point mid-journey. The tone is **cold perseverance**: flee, endure, cultivate elsewhere, return stronger; loss, obsession with the Dao, and quiet resolve — not early power-fantasy quips.

---

## Cosmology → world map portal

| Layer | *Renegade Immortal* | Path of Dao (MVP chapters) |
|-------|---------------------|----------------------------|
| **Inner realm** | Four Great Star Domains + Four Great Immortal Realms; shielded by the **Boundary Formation Grand Array** | **All 10 chapters** — through **Thunder Immortal Hall** |
| **True star → star domain** | Vermillion Bird Star, Reaching Heaven Star Domain, etc. | ch1–4 Vermillion Bird · ch5–7 Reaching Heaven · ch8–10 Thunder Immortal Realm |
| **Heaven Reverse Pearl** | Seals and protects the inner realm; tied to the **Master of the Boundary Realm** | Lore POI / story beat — not a separate MVP map |
| **Outer realm** | Ancient Immortal Domain / Primordial Star Spirit — **beyond** the Boundary Realm | **Not in MVP**; referenced in ch10 epilogue |

**MVP goal:** Wang Lin reaches **Thunder Immortal Hall** — the peak of the inner realm. The outer realm lies beyond the Boundary Realm — post-MVP.

---

## Story phases → game use

| Phase | In *Renegade Immortal* (structure) | Path of Dao — **maps** | Ordeal cultivator (VI · EN) | Path of Dao — **story** |
|-------|-------------------------------------|------------------------|----------------------------|-------------------------|
| **1 — Mortal outcast** | Heng Yue rejects Wang Lin; village falls | Ch1 Wang Family Village / Heng Yue — unarmed only | **Thác Sâm** · Tu Sen | Heng Yue rejection; **no sword yet** |
| **2 — Wilderness exile** | Ghost Spirit Mountain; fortune cave | Ch2 Ghost Spirit Mountain — **Heaven Reverse Sword POI** | **Liễu Mi** · Liu Mei | Little White; heaven-reverse sword |
| **3 — Fortuitous inheritance** | Hidden caves, remnants | Ch3 Zhao Kingdom — farm if CP low | **Hồng Điệp** · Hong Die | Ruthless choices; butterfly dao foreshadowed |
| **4 — Sword destiny** | Ancient seal / forbidden ruin | Ch4 Moon Lake — `item.sword.ancient` POI if missed | **Chu Tước Tử** · Vermillion Bird Heir | Seal cracks; Sword Intent if blade found |
| **5 — Tempered road** | Endurance, near breaking | Ch5 Fire Burn Country | **Viêm Lôi Tử** · Flame Thunder Lord | Survival prose — will tempered by sand |
| **6 — Heavenly tribulation** | Heaven tests the stubborn; lightning, loss | Ch6 `thunder_peaks` | **Thiên Vận Tử** (I) · Heaven Fate Lord (I) | Lightning intent; tribulation tone |
| **7 — Memory & inner demon** | Past power, corruption | Ch7 frozen palace | **Vọng Nguyệt** · Wang Yue | Cold dao; memory traded for cultivation |
| **8 — Heart rift** | Rift walk; obsession deepens | Ch8 abyss rift | **Thiên Vận Tử** (II · Tâm Ma) · Heaven Fate · Heart Demon | Corruption of heart; void deepens |
| **9 — Threshold** | Gate guardians | Ch9 Lôi Tiên Gate | **Chu Tước Tử** (II · Ải Môn) · Vermillion Bird Heir · Gate Trial | Guardians test heart before hall |
| **10 — Obsession & seal** | Thunder hall; boundary beyond | Ch10 Lôi Tiên Điện | **Thiên Vận Tử** (III · Lôi Điện) · Heaven Fate · Thunder Hall | Epilogue — what remains after obsession |

Full boss roster, side maps (Yêu Linh Chi Địa, Cổ Thần/Yêu/Ma, Liên Minh, Vũ Chi Tiên Giới):
[world-road-bosses.md](./world-road-bosses.md).

**Core loop (maps):** World map → pick region → explore (.01) → ordeal boss (.02) → **timeline shard** (plan 31) → chapter story (`.02` only) → next region. **Retreat anytime** if CP too low; farm earlier maps, then return — this *is* the cultivation road.

**Dao Scroll:** Read Wang Lin's parallel road + Intent punch-line on **every** map — [`plans/31-wang-lin-story-timeline.md`](../plans/31-wang-lin-story-timeline.md).

---

## Design pillars (quick checklist)

When authoring **maps**, **story JSON**, **encounters**, or **combat**:

| Pillar | Do | Don't |
|--------|-----|-------|
| Humble start | Palm/body attacks until ancient sword (T1, T4) | Starter wood sword in weapon slot |
| Map-by-map road | Each region = a stop on the road; labels match §7.8 table (T5) | Generic level-select menu feel |
| Fortuitous inheritance | POIs gate major rewards; sword is a **destiny** | Sword in tutorial chest |
| The sword | `item.sword.ancient` mid-journey; Sword Intent gated (T2–T3, T7) | Sword from minute one |
| Retreat & return | CP badges; rematch on lower maps | Hard gate with no fallback |
| Non-lethal duels | Tu Sĩ at 0 HP sit and meditate at spawn — recover, fight again | Permanent death / despawn on roaming maps |
| Horde fantasy | Over-leveled return visits spawn squads → hordes → mass (1v10/100/500) | Flat 1v1 everywhere |
| Story tone | Perseverance, cost, quiet resolve — cultivation diary | Early quips, chosen-one swagger |

---

## Cultivation system (game mechanics)

Path of Dao maps *Renegade Immortal* cultivation onto a **level + realm** ladder the player feels while playing — not a menu stat.

| Concept | *Renegade Immortal* feel | Path of Dao |
|---------|--------------------------|-------------|
| **Combat XP** | Defeating rivals and enduring ordeals slowly refines qi | Third HUD bar fills when cultivators lose the exchange; levels within the current realm |
| **Realm** | Mortal → Qi → Foundation → Core → Nascent → Void → True Dao | Seven realms in `content/progression/realms.json`; Home + combat toasts use vi keys (Phàm Thể, Ngưng Khí, Trúc Cơ…) |
| **Sub-tier** | Early / Mid / Late / Perfection within each realm | Auto every 3 levels; level-up toast: *Đột phá — Ngưng Khí · Trung Kỳ* |
| **Realm breakthrough** | Major gate — spirit full, sometimes precious jade | Home **Tu Luyện / Đột Phá** when level + spirit + boss + **Immortal Jade** met |
| **Immortal Jade** | Rare jade consumed at major breakthroughs | `item.consumable.immortal_jade` in inventory; boss loot + encounters; Home toast when level/spirit met but jade missing |
| **Map cultivation ceiling** | Each star/region caps how far you can refine before the road hardens | `recommendedRealmOrder` on maps; first-entry intro explains peak realm on that star |
| **Second Step / late realms** | Wang Lin's road spans decades — high realms come late | Maps ch1–2 cap at Mortal/Qi; True Dao only on final chapters — intro copy warns higher realms are far ahead |

**Story-as-you-play:** World map → enter portal → **map intro** (name, lore, realm cap) → combat. Chapter stories and My Path milestones still anchor the narrative.

---

## Master Intent (意 / Ý Cảnh) — Wang Lin's real Concepts

**Redesigned 2026-07-06.** The earlier design used 6 generic elemental intents
(sword/void/flame/lightning/time/life), all progressing simultaneously and independently — a
gameplay convenience with no basis in the source novel. Real *Renegade Immortal* sources (Baidu
Wiki, the Xian Ni Fandom wiki) name only **3** core Concepts (意) for Wang Lin, and he cultivates
them **one at a time**, in sequence — not six in parallel. Path of Dao now follows that structure:

### 3 main-flow intents (sequential — the actual story)

Each requires the previous one **awakened** before it can even be cast. This is Wang Lin's real
arc: he doesn't dabble in six schools of magic — he masters one Concept completely before the
next reveals itself.

| Order | Intent id | VI | EN | Basis |
|-------|-----------|-----|-----|-------|
| 1 | `life_death` | Sinh Tử Ý Cảnh | Concept of Life and Death | Wang Lin's **first** and most famous Dao — "one of the most ruthless Daos in existence" |
| 2 | `cause_effect` | Nhân Quả Ý Cảnh | Concept of Cause and Effect | Karma — every action returns |
| 3 | `truth_falsehood` | Chân Giả Ý Cảnh | Concept of Truth and Falsehood | Seeing past illusion |

Reincarnation ("luân hồi") is **not** a separate 4th Concept — in the novel it's a technique
(*Yellow Springs Ascension*) born from mastering Life-and-Death, so it isn't modeled as its own
intent here either.

### 3 gate-flow intents (independent — side techniques, not part of the main story)

Each unlocks on its own condition, unrelated to the main-flow chain — you can pursue one, all
three, or none, in any order, once its gate opens:

| Intent id | VI | Unlock condition |
|-----------|-----|-------------------|
| `sword` | Kiếm Ý | Own the Ancient Spirit Sword (`weaponMilestone === 'ancient_sword'`) — pre-existing gate, unchanged |
| `flame` | Hỏa Đạo | Clear `boss.desert_sovereign` (Flame Thunder Lord, ch5) |
| `lightning` | Lôi Pháp | Clear `boss.thunder_avatar` (Heaven Fate Lord, ch6) |

### Implementation

`content/progression/insights.json` tags each intent `flow: 'main'` (+ `order`) or `flow: 'gate'`
(+ `unlockBossId` where applicable). `MasterIntentSystem.isIntentUnlocked()` is the single source
of truth both `ArtGate.checkCast()` (actual casting) and `DivineArtsPanel` (Home UI, shows
"Not yet comprehended" for locked intents) read from — see `src/progression/MasterIntentSystem.ts`.
`skillIntentSchema` in `src/progression/SkillDefinition.ts` lists the 6 ids (+ `'basic'` for the
starter meditate/bolt skills, which have no Concept). Individual skill *files* keep their old ids
(e.g. `skill.void.slash` now has `"intent": "truth_falsehood"`) — only the categorization changed,
not skill identity.

---

## Where agents should look

| Task | Read first |
|------|------------|
| Map / region / POI layout | [world-road-bosses.md](./world-road-bosses.md) · this doc §Story phases → [plans/index.md §7.8](../plans/index.md) |
| Weapon & combat arc | [plans/index.md §7.7](../plans/index.md) · T1–T4, T7 in [tracks/renegade-immortal-alignment.md](../tracks/renegade-immortal-alignment.md) |
| Chapter story prose | §Story phases story column · [plans/18-chapter-story-system.md](../plans/18-chapter-story-system.md) · T6 |
| 3D Home empty hands | T8 · [plans/10-threejs-home-scene.md](../plans/10-threejs-home-scene.md) |
| Master Intent / skill `intent` field | §Master Intent above · `src/progression/MasterIntentSystem.ts` · `content/progression/insights.json` |
| Alignment status | [tracks/index.md](../tracks/index.md) T1–T8 table · detail track per sub-plan |

**Skill:** `.claude/skills/renegade-immortal/SKILL.md` — invoke for map, story, encounter, or combat work that should feel *Renegade Immortal*-aligned.
