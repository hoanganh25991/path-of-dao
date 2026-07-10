# Map Design Canon — World Scale, Settlements & Signature Trees

> **Master plan:** [index.md](./index.md) §2 MVP Maps · §7.8 World Road  
> **Runtime:** [06-phaser-map-scene-base.md](./06-phaser-map-scene-base.md) · **Fake 2.5D:** [fake-2.5d.md](./fake-2.5d.md)  
> **Content:** [21-mvp-maps-chapters-1-5.md](./21-mvp-maps-chapters-1-5.md) · [22-mvp-maps-chapters-6-10.md](./22-mvp-maps-chapters-6-10.md) · schema: [20-content-pipeline.md](./20-content-pipeline.md) §3

---

## 1. Scale — 100× play area (all 20 maps)

Early prototypes used a **small stub** (~40×38 tiles, ~1600×1216 px). **MVP ship** uses **100×
that play area** (10× linear on each axis):

| Metric | Prototype stub | **MVP canon (every map)** |
|--------|----------------|---------------------------|
| Tiles (32 px) | 50×38 | **500×380** |
| World bounds (px) | 1600×1216 | **16,000×12,160** |
| Area vs stub | 1× | **100×** |

**Rule:** every `content/maps/*.json` sets `bounds.width: 16000`, `bounds.height: 12160` unless a
post-MVP side region explicitly documents an exception.

**Playtime target:** 12–20 min per map (explore + clear waves + optional POI) — cultivation **road**,
not a tiny arena. Player uses joystick + camera follow across homesteads, tree landmarks, and ordeal
approaches.

**Perf:** cull off-screen enemies/AI; chunk encounter tables by **settlement zones** (§3); preload
only active region tileset + signature tree atlas (plan `26`).

---

## 2. Settlements — structure, house, village

Every combat map is a **place people lived or still live** — not an empty grass rectangle.

### 2.1 Required layers (Tiled + runtime)

| Layer / object | Purpose |
|----------------|---------|
| `ground` / `decoration` / `collision` / `foreground` | Standard tiles (plan `06`) |
| **`structures`** (object layer) | Houses, walls, wells, gates — collision where needed |
| **`settlements`** (object layer) | Named clusters: village, hamlet, ruin, outpost |
| **`pois`** | Gameplay interactables (cave, sword, shrine) |
| **`signature_tree`** | Exactly **one** big tree object per map (§4) |

### 2.2 Structure prop types (`prop.structure.*`)

| Type | Read | Collision |
|------|------|-----------|
| `house_ruin` | Collapsed roof, burned timber | Partial wall tiles |
| `house_intact` | 1–2 room cultivator home | Full building footprint |
| `hut` | Small straw/mud hut | Small box |
| `well` | Stone well + bucket | Circle interact radius |
| `wall_segment` | Village palisade or stone wall | Tile collision |
| `watchtower` | Elevated guard post | Base collision |
| `pavilion` | Open qi-training pavilion | Pillars only |
| `shrine` | Small ancestor shrine | Interact for lore |
| `sect_gate` | Formal gate arch (`.02` maps) | Gate passage gap |

### 2.3 Settlement clusters (`settlement.*`)

Each map has **≥1 settlement zone** in `content/maps/*.json`:

```json
"settlements": [
  {
    "id": "settlement.fallen_village.ruins",
    "type": "ruin_village",
    "center": { "x": 4200, "y": 3800 },
    "radius": 1200,
    "structures": ["house_ruin", "house_ruin", "hut", "well", "shrine"],
    "encounterZone": "zone.fallen_village.homestead"
  }
]
```

| `type` | Use on | Story read |
|--------|--------|------------|
| `ruin_village` | ch1, war-torn regions | Wang Lin's road — loss |
| `hamlet` | ch2–4 | Survivors, traders |
| `outpost` | patrol roads | Guards, bandits |
| `sect_courtyard` | trials, gates | Cultivation sect space |
| `shrine_cluster` | lakes, seals | Fortuitous tone |
| `nomad_camp` | desert, wilds | Scattered tents |
| `palace_ruin` | ch7+ | Memory, ice, void |

**`.01` maps:** at least one **explorable village/hamlet** (structures + ambient spawns).  
**`.02` maps:** settlement **approach** → ordeal **arena** near `sect_gate` or boss court.

---

## 3. Environment uniqueness (per map)

Each of the **20 maps** must be instantly recognizable — not a reskin of the same grove.

### 3.1 Uniqueness contract (every `map.*.json`)

```json
"environment": {
  "regionId": "fallen_village",
  "palette": "fallen_village_ash",
  "weather": "ash_drift",
  "ambientSfx": "amb.fallen_village.wind",
  "parallaxTint": { "far": "#2a3040", "mid": "#3d4555", "near": "#4a5568" },
  "groundAccent": "scorched_earth",
  "uniqueness": ["collapsed_homesteads", "qi_rift_pools", "broken_wall_ring"]
}
```

| Field | Rule |
|-------|------|
| `palette` | Tileset + prop color family — **one per map** |
| `weather` | Light particle overlay (ash, fog, embers, snow, void motes) |
| `parallaxTint` | Fake 2.5D far/mid/near (plan `29` §2.5) |
| `uniqueness` | 2–4 tags — **must differ** from sibling map in same chapter |
| `groundAccent` | Decal tiles: cracks, snow, sand ripples, lightning scorch |

**Sibling rule:** `map.fallen_village.01` vs `.02` share region but **different** `uniqueness[]`,
`weather`, and **different** `signatureTree` species (§4).

### 3.2 Authoring checklist (per map)

- [ ] Unique `palette` + `parallaxTint` triplet
- [ ] ≥1 settlement with ≥3 structure types
- [ ] ≥1 signature big tree (§4)
- [ ] Encounter zones tied to settlement/landmark names (not random scatter)
- [ ] POI placed relative to tree or shrine when possible
- [ ] Locale keys: map name + signature tree name

---

## 4. Signature big tree (one per map)

Every map has **exactly one** navigational landmark tree — tall enough to see from across the
500×380 tile expanse, referenced in travel copy and **Locate** on the world map (plan `17`).

### 4.1 JSON shape

```json
"signatureTree": {
  "propId": "prop.tree.ancient_willow",
  "position": { "x": 11200, "y": 6400 },
  "displayNameKey": "map.fallen_village.01.signature_tree",
  "loreKey": "map.fallen_village.01.signature_tree.lore",
  "minHeightPx": 128,
  "canopyRadius": 96
}
```

### 4.2 Fake 2.5D rules

> Full spec: [`fake-2.5d.md`](./fake-2.5d.md) §5–§7

- **`LayeredProp`** — trunk at `baseY`, canopy at `baseY + 1`; shadow blob at `baseY - 8`
- Sprite **96–160 px** tall source (2–4× hero height)
- Canopy occludes player when walking south of trunk
- Optional interact: read lore shard / timeline hint (no combat reward required)
- **World map Locate** can pan to `signatureTree.position` when player is lost
- Art: 3-layer export per DA-09 (shadow, trunk, canopy)

### 4.3 Roster — all 20 maps

| Map | Signature tree | Species read |
|-----|----------------|--------------|
| `map.fallen_village.01` | `prop.tree.scorched_elm` | Burnt village guardian — split trunk |
| `map.fallen_village.02` | `prop.tree.jade_pine` | Trial gate pine — jade-tipped needles |
| `map.mist_forest.01` | `prop.tree.mist_birch` | White bark lost in fog |
| `map.mist_forest.02` | `prop.tree.fox_ginkgo` | Golden fan — fox spirit marker |
| `map.stone_canyon.01` | `prop.tree.cliff_juniper` | Grows horizontal from rock |
| `map.stone_canyon.02` | `prop.tree.bandit_camphor` | Broad canopy over bandit camp |
| `map.moon_lake.01` | `prop.tree.lake_willow` | Branches trail in water |
| `map.moon_lake.02` | `prop.tree.seal_oak` | Rune-scarred bark at shrine |
| `map.burning_desert.01` | `prop.tree.desert_ghaf` | Lone deep-root survivor |
| `map.burning_desert.02` | `prop.tree.thunder_acacia` | Blackened by tribulation |
| `map.thunder_peaks.01` | `prop.tree.storm_pine` | Lightning-split crown |
| `map.thunder_peaks.02` | `prop.tree.altar_cedar` | Twin trunks at storm altar |
| `map.frozen_palace.01` | `prop.tree.frost_paulownia` | Ice-crystal blossoms |
| `map.frozen_palace.02` | `prop.tree.memory_sakura` | Pale pink — Wang Yue echo |
| `map.abyss_rift.01` | `prop.tree.void_bristle` | Purple-black needles |
| `map.abyss_rift.02` | `prop.tree.heart_demon_wisteria` | Drooping corrupted blooms |
| `map.heavenly_gate.01` | `prop.tree.gate_cypress` | Columnar — path to ascension |
| `map.heavenly_gate.02` | `prop.tree.trial_bodhi` | Massive roots over steps |
| `map.void_throne.01` | `prop.tree.thunder_halberd` | Metallic bark forks |
| `map.void_throne.02` | `prop.tree.dao_world_tree` | Fractured world-tree remnant — finale landmark |

Pixel specs: [`design-arts/map-props.md`](./design-arts/map-props.md) (parallel art track).

---

## 5. Integration map

| System | How maps use this canon |
|--------|-------------------------|
| `MapScene` | Load bounds 16k×12k; spawn structures + signature tree from JSON |
| `EncounterTrigger` | Roll spawns inside `encounterZone` near settlements |
| `WorldMap` / Locate | Pin at `signatureTree.position` optional |
| `FortuitousEncounter` | POIs adjacent to shrine/well/tree |
| `content:validate` | Assert bounds, one tree, ≥1 settlement |
| `design-arts` | Structure + tree sprites |

---

## 6. Acceptance (MVP maps)

- [x] All 20 maps: `bounds` 16,000×12,160 (100× stub area)
- [x] All 20 maps: `signatureTree` + unique `environment.uniqueness`
- [x] All 20 maps: ≥1 `settlements[]` with houses/structures
- [x] `.01` / `.02` pairs differ in environment tags and tree species
- [~] Player can navigate stub → tree → ordeal without empty wilderness >30s walk
- [~] Fake 2.5D: tree trunk occludes; parallax tints per map
