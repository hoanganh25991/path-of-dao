# Faction Families — Map Minions

> One sheet per **family**, not per enemy JSON — variants swap palette + overlay on the shared rig.  
> **Regional colors:** [plan 29 §5.2](../../plans/29-pixel-art-combat-canon.md#52-regional-cultivator-palette-map-accent) · **Rig:** [pixel-art-style.md](../pixel-art-style.md)

---

## Shared rules

- Humanoids: **same 32×56 sticky-man rig** as hero — differentiate by overlay prop + palette, never scale.
- Beasts: blob/quadruped overlay on same feet anchor — no robe.
- Telegraphs: ranged = 2-frame wind-up + brief red tint; melee = forward lean only ([plan 29 §5.3](../../plans/29-pixel-art-combat-canon.md#53-minion-telegraph)).

---

## Beast

**Fantasy:** Wild qi-corrupted fauna — fodder, not characters with dialogue.

**Silhouette:** Low wide (slime) or tall ears (wolf, hawk). No humanoid torso block.

**Overlay:** Jelly disc on hips/shoulders (slime); fur fill swap (wolf). Region tint on beast accent column in plan 29 §5.2.

**Must-not:** Human robe, sect sash, or weapons.

---

## Disciple

**Fantasy:** Sect cultivators — Heng Yue, cultists, low-rank rivals. ch1–4 pressure.

**Silhouette:** Same rig as hero; **sect headband or sash** as the 1× read.

**Palette:** Jade or crimson accent on regional fill — see chapter table §5.2.

**Must-not:** Confuse with hero (no gold wanderer sash + grey-blue default combo).

---

## Bandit

**Fantasy:** Canyon thugs, Hong Die's adds — messy violence, not sect discipline.

**Silhouette:** **Mask or bandana** over lower face; rust accent `#a05828`.

**Role:** melee_chaser and archer variants; ch3 Stone Canyon.

**Must-not:** Sect headband symmetry; ornate boss props.

---

## Spirit

**Fantasy:** Wisp, moth, fox — spectral fauna, slightly uncanny.

**Silhouette:** Floating **−2 px** vertical bob; pale spectral fill; max alpha 0.9.

**Must-not:** Heavy outline mass; fully opaque "solid" human read.

---

## Guard / patrol

**Fantasy:** Zhao household guards, gate sentinels — armored discipline.

**Silhouette:** **2 px shoulder pauldron** on one side — the guard read.

**Palette:** Steel `#8899aa` accent; ch3 and ch9 maps.

**Must-not:** Full plate — pauldron hint only at 32×56.

---

## Elemental

**Fantasy:** Sand spirit, lightning sprite — region element as body core.

**Silhouette:** **Core gem** in chest block; element hue from ch5–6 accents.

**Must-not:** Generic human face detail; read as elemental vessel.

---

## Corrupted

**Fantasy:** Rift spawn, void shade — late-game wrongness.

**Silhouette:** **Crack overlay** on torso; void purple-black base.

**Palette:** Abyss / Void Throne rows in §5.2; corruption red beast accent.

**Must-not:** Clean sect disciple look; must feel broken.

---

## MVP procedural enemies (reference)

| Sprite key | Family | Distinct read |
|------------|--------|---------------|
| `enemy_slime` | Beast | Green jelly overlay |
| `enemy_archer` | Bandit/disciple hybrid | Purple robe + bow prop |
| `enemy_totem` | Boss placeholder | Crown + aura (see [bosses.md](./bosses.md)) |

Implementation: `stickyManDraw.ts` overlays · regional tints: `regionCultivatorPalette.ts`.
