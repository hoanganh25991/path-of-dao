# DA-09 — Map props (structures & signature trees)

> Parent: [index.md](./index.md) · Canon: [../map-design-canon.md](../map-design-canon.md) · **Fake 2.5D:** [../fake-2.5d.md](../fake-2.5d.md) §5–§8

---

## Objective

Pixel art for **settlement structures**, **terrain features**, and **20 signature big trees** —
authored as **multi-layer 2.5D sprites** (visible side faces, volume read). Parallel with map JSON
(plans `21`–`22`).

---

## Visual style (2.5D)

| Rule | Detail |
|------|--------|
| Angle | Top-down / slightly angled — **no perspective distortion** |
| Volume | Buildings, trees, cliffs read **thick** — draw front + side faces |
| Flat ban | No paper-thin single-tile houses in shipping art |
| Palette | ≤8 colors per prop family; region accent from `environment.palette` |
| Grid | 32 px tile alignment for footprints |

---

## Multi-layer export (required for structures + trees)

Each complex prop exports **separate layers** for runtime `LayeredProp` ([`fake-2.5d.md`](../fake-2.5d.md) §5):

### Structure example — `house_ruin`

| Layer file | Sort offset | Content |
|------------|-------------|---------|
| `house_ruin_shadow.png` | `baseY - 8` | Soft footprint blob |
| `house_ruin_walls.png` | `baseY` | Front + left/right walls, door |
| `house_ruin_roof.png` | `baseY + 1` | Roof overhang |

### Tree example — `prop.tree.scorched_elm`

| Layer file | Sort offset | Content |
|------------|-------------|---------|
| `scorched_elm_shadow.png` | `baseY - 8` | Wide trunk shadow |
| `scorched_elm_trunk.png` | `baseY` | Split burnt trunk, 16–24 px wide |
| `scorched_elm_canopy.png` | `baseY + 1` | 96–160 px crown |

Optional: **normal map** companion (`*_normal.png`) for Light2D — not required on `low` quality.

---

## Deliverables

| Category | Count | Path |
|----------|-------|------|
| Structures | `prop.structure.*` set (map canon §2.2) | `assets/sprites/props/structures/` |
| Signature trees | 20 unique `prop.tree.*` | `assets/sprites/props/trees/` |
| Terrain | cliffs, bridges, rocks (single or 2-layer) | `assets/sprites/props/terrain/` |
| Tile accents | roads, rivers, `groundAccent` decals | `assets/sprites/tilesets/{region}/` |
| Manifest | layer stacks per prop id | `assets/sprites/props/manifest.json` |

---

## Structure sprites

| Prop | Footprint | Layers |
|------|-----------|--------|
| `house_ruin` | 3×2 tiles min | shadow, walls, roof |
| `house_intact` | 4×3 tiles | shadow, walls, roof, optional chimney |
| `hut` | 2×2 | shadow, walls+roof (can merge) |
| `well` | 1×1 | shadow, stone ring |
| `shrine` | 2×2 | shadow, base, roof |
| `sect_gate` | 4×3 | shadow, pillars, arch top — **walk gap** in collision |
| `wall_segment` | 1×1 repeatable | side-face stone |
| `watchtower` | 2×3 | shadow, tower, roof |

---

## Environment props (Fake 2.5D §8)

| Category | Notes |
|----------|-------|
| Mountains / cliffs | Foreground cliff cap + side-face tile; player walks behind overhang |
| Bridges | Deck + side rail layers |
| Roads / rivers | Ground tiles + shore/edge decals |
| Rocks, barrels | Single-layer OK if low height |

---

## Signature trees

- **Height:** 96–160 px total canopy; trunk 16–24 px wide
- **≤8 colors** per tree
- **Canopy** readable at 2× zoom from across 16k map
- Roster: [`map-design-canon.md`](../map-design-canon.md) §4.3

---

## Acceptance

- [ ] All 20 `prop.tree.*` exported as **3-layer** stacks (shadow, trunk, canopy)
- [ ] Structure set covers all `settlement.type` props with multi-layer where footprint ≥ 2×2
- [ ] Side faces visible on houses, cliffs, gates — not flat top-down only
- [ ] `manifest.json` lists layers + `depthOffset` per prop (DA-08 auto-wire)
- [ ] Optional normal maps documented per atlas; game runs without them
