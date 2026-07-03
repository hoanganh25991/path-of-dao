# Tiên Nghịch — Story Reference (for Path of Dao)

> **Source work:** *Tiên Nghịch* (Vietnamese) = **仙逆** *Xiān Nì* (**Renegade Immortal**, Er Gen / 耳根).  
> **Legal:** Use **structure and feeling only** — not plot, character names, places, or verbatim text. Path of Dao is original IP.  
> **Implementation track:** [tracks/tien-nghich-alignment.md](../tracks/tien-nghich-alignment.md) (T1–T8) · **Master plan:** [plans/index.md](../plans/index.md) §1.1, §7.7, §7.8

---

## What it is (one paragraph)

*Tiên Nghịch* follows a mortal cultivator who begins with **no talent and no weapon**, is **mocked and discarded**, and survives through **stubborn will** rather than destiny. Power comes **late and painfully** — from hidden ruins, risky inheritances, and map-by-map hardship — not from a tutorial chest. A **legendary sword** tied to ancient will becomes a turning point mid-journey. The tone is **cold perseverance**: flee, endure, cultivate elsewhere, return stronger; loss, obsession with the Dao, and quiet resolve — not early power-fantasy quips.

---

## Story phases → game use

| Phase | In *Tiên Nghịch* (structure) | Path of Dao — **maps** | Path of Dao — **story** |
|-------|------------------------------|------------------------|-------------------------|
| **1 — Mortal outcast** | Ruined homeland; bare survival; ridicule | Ch1 `fallen_village` .01/.02 — unarmed strikes only, slimes/bandits | Fleeing ruins; jade spirit stirs; **no sword yet** |
| **2 — Wilderness exile** | Beasts, fog, hidden paths after leaving home | Ch2 `mist_forest` — explore then Mist Stalker | Fox spirit / hidden path; **ancient sword POI** if missed in ch1 |
| **3 — Fortuitous inheritance** | Power from caves, remnants, risk — not fair rewards | POIs: `hidden_cave`, `ancient_sword`, `secret_manual` (ch1–5) | Blade in stone; only your spirit awakens it — diary entry, not loot fanfare |
| **4 — Sword destiny** | Legendary blade transforms the cultivator | `item.sword.ancient` → sword combo + Sword Intent (T2–T3, T7) | Major milestone beat; CP jump; empty hands in Home until then (T8) |
| **5 — Tempered road** | Each region hardens will; bandits, seals, desert | Ch3–5 canyon, moon lake, desert — farm lower maps if CP low | Ruthless choices; seal cracks; survival prose |
| **6 — Heavenly tribulation** | Heaven tests the stubborn; lightning, loss | Ch6 `thunder_peaks` — Storm hawks, Thunder Avatar | Lightning intent; tribulation tone |
| **7 — Memory & inner demon** | Past power, corruption, rift of the heart | Ch7–8 frozen palace, abyss rift | Cold dao; void deepens — sparse, consequence-heavy scenes |
| **8 — Threshold & obsession** | Gate guardians; ultimate confrontation with the Dao | Ch9–10 heavenly gate, void throne | Ascension trial → epilogue: what remains after obsession |

**Core loop (maps):** World map → pick region → explore (.01) → ordeal boss (.02) → chapter story → next region. **Retreat anytime** if CP too low; farm earlier maps, then return — this *is* the cultivation road.

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
| Story tone | Perseverance, cost, quiet resolve — cultivation diary | Early quips, chosen-one swagger |

---

## Where agents should look

| Task | Read first |
|------|------------|
| Map / region / POI layout | This doc §Story phases → [plans/index.md §7.8](../plans/index.md) |
| Weapon & combat arc | [plans/index.md §7.7](../plans/index.md) · T1–T4, T7 in [tracks/tien-nghich-alignment.md](../tracks/tien-nghich-alignment.md) |
| Chapter story prose | §Story phases story column · [plans/18-chapter-story-system.md](../plans/18-chapter-story-system.md) · T6 |
| 3D Home empty hands | T8 · [plans/10-threejs-home-scene.md](../plans/10-threejs-home-scene.md) |
| Alignment status | [tracks/index.md](../tracks/index.md) T1–T8 table · detail track per sub-plan |

**Skill:** `.cursor/skills/tien-nghich/SKILL.md` — invoke for map, story, encounter, or combat work that should feel *Tiên Nghịch*-aligned.
