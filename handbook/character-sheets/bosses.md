# Ordeal Bosses — Named Cultivators

> Bosses are **people**, not monsters — impress via props, aura, and telegraphs on the **same 32×56 frame**.  
> **Phase rules & acceptance:** [plan 29 §6](../../plans/29-pixel-art-combat-canon.md#6-bosses--ordeal-cultivators-impressive) · **Intent hues:** [plan 29 §8](../../plans/29-pixel-art-combat-canon.md#8-master-intent-visual-canon)

---

## Shared boss read

| Rule | Spec |
|------|------|
| Frame | 32×56, 2× display — never upscale the rig |
| Impress | Crown/halo/wing **props** up to 8 px above head box |
| Shadow | 36×12 ellipse; phase 2 alpha 0.45 |
| Phase 2 | Prop swap + intent tint + faster telegraphs — `BossPhaseController` |

---

## `boss.jade_guardian` — Tu Sen

**Fantasy:** Life-path guardian — stone discipline, jade seal authority.

**Silhouette:** Broad stone **shoulder pads** + **jade seal** on chest block.

**Costume:** Grey-green stone fill; Life jade accent on seal and telegraphs.

**Phase 2:** Seal cracks; green pulse ring at feet.

**Pose personality:** Slow, immovable idle — attacks feel like verdicts, not flailing.

---

## `boss.mist_stalker` — Liu Mei

**Fantasy:** Mist forest hunter — void ice, long-range menace.

**Silhouette:** **Long sash trails** behind hips; **ice shard** in lead hand.

**Intent:** Void + ice — telegraphs cool violet, shard white highlight.

**Phase 2:** Sash freezes stiff; void crack sprite under feet.

---

## `boss.bandit_lord` — Hong Die

**Fantasy:** Butterfly spirit bandit lord — cruel grace, not brute force.

**Silhouette:** **Butterfly wing cape** 6×8 px — widest horizontal read in roster.

**Intent:** Sword + spirit — rust body, spirit accent on wings.

**Phase 2:** Wings spread; dash afterimages multiply.

---

## `boss.seal_warden` — Vermillion Bird Heir

**Fantasy:** Moon Lake seal shrine — flame birthright restrained.

**Silhouette:** **Bird crest headpiece** — flame Intent accent.

**Phase 2:** Crest ignites; floor fire telegraph discs.

---

## `boss.desert_sovereign` — Flame Thunder Lord

**Fantasy:** Desert tyrant — dual element dominance.

**Silhouette:** **Twin orb props** (fire + lightning) floating at shoulders.

**Phase 2:** Orbs merge; heat shimmer on displacement pass.

---

## `boss.thunder_avatar` — Heaven Fate (I)

**Fantasy:** First face of Heaven's will — lightning judgment.

**Silhouette:** **Fate rune halo** 12×12 behind head — largest halo prop.

**Phase 2:** Halo spins; bolt telegraphs chain to adjacent tiles.

---

## `boss.frost_queen` — Wang Yue

**Fantasy:** Frozen memory — void pale, not cheerful ice princess.

**Silhouette:** **Moon tiara** + deliberately **pale robe** (low saturation).

**Phase 2:** Tiara glow; freeze zones with amber Time rim (memory, not pure ice).

---

## `boss.rift_horror` — Heaven Fate (heart demon)

**Fantasy:** Mirror of the self — wrong, familiar.

**Silhouette:** **Mirror shard mask** over face — hero-adjacent proportions, corrupted.

**Phase 2:** Spawns add silhouettes at 50% alpha (echoes of player rig).

---

## `boss.celestial_guardian` — Vermillion Bird (gate)

**Fantasy:** Gate sentinel — spear and flame, celestial duty.

**Silhouette:** **Gate spear** prop at 2× normal weapon height.

**Phase 2:** Spear flame trail on thrust attacks.

---

## `boss.void_sovereign` — Heaven Fate (throne)

**Fantasy:** Final ordeal — throne void, Showcase tier.

**Silhouette:** **Throne cape** mass + **void crown** — tallest vertical read.

**Phase 2:** Showcase postFX + screen vignette; only boss allowed full vignette.

**Must-not:** Reuse void_walker ancient palette 1:1 — boss reads darker, more oppressive.

---

## Implementation handoff

| Layer | Owner |
|-------|--------|
| Phase props | `bossPhaseProps.ts`, `BossPhaseController.ts` |
| Content IDs | `content/enemies/boss.*.json` |
| Map gates | [handbook/world-road-bosses.md](../world-road-bosses.md) |
