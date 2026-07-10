# Ancients — Echoes Showcase

> Echoes mode: hero skin replaced by ancient identity — **tier above** normal cultivator.  
> **Theme table & heaven rule:** [plan 29 §7](../../plans/29-pixel-art-combat-canon.md#7-ancients--echoes-showcase) · **Demo content:** `content/demo/ancients.json`

All ancients use **S** power UI on every equipped art in Echoes. Showcase postFX allowed for `heaven` and finale interactions.

---

## Shared ancient read

- Themed hero sheet rebuild: palette + weapon + aura per `visualTheme` — not a separate rig.
- Aura ring brighter and larger than hero stage 4.
- `AncientEchoBanner` + gold ∞ status bar (sub-plan 27).

---

## `jade` — breakthrough_sage

**Fantasy:** First breakthrough guide — living jade patience.

**Body:** `#3ecf8e` tint · aura `#1f7a4f` · **wooden staff** prop.

**Must-not:** Confuse with Life heal green on wheel icons — sage reads darker, more forest jade.

---

## `insight` — insight_seeker

**Fantasy:** Seeker of Intent — open channel, not closed fist fighter.

**Body:** `#7ec8ff` · aura `#3a7ab8` · **open palm** + small intent orbs.

---

## `sword` — sword_ancestor (Wang Lin echo)

**Fantasy:** Sword path perfected — cyan cold steel qi.

**Body:** `#c9d4ff` · aura `#8899cc` · **long cyan blade** (longer than hero ancient sword).

**Lore note:** Demo name "Wang Lin" — reads as future-self sword intent, not current hero costume.

---

## `flame` — flame_sovereign

**Fantasy:** Sovereign flame — aggressive forward lean in idle.

**Body:** `#ff6b35` · aura `#cc3300` · **flame-wrapped blade** edge pixels.

---

## `fortune` — fortune_emissary

**Fantasy:** Cơ duyên emissary — fox spirit fortune.

**Body:** `#2dd4a8` · aura `#1a6b55` · **spirit fox pet** sprite at flank.

**Must-not:** Card-art teal is intentional reuse — combat and story share fortune hue.

---

## `void` — void_walker

**Fantasy:** Walker between fractures — blade like broken space.

**Body:** `#9b6bff` · aura `#5a2d9e` · **void fracture blade** (jagged edge read).

---

## `heaven` — heaven_trampler

**Fantasy:** Past the ceiling — overexposed divinity.

**Body:** `#fff4d6` · aura `#ffe08a` · **white-gold blade + halo**.

**Special rules:** 1-frame white flash on idle every 4 s; particle count ×1.5 vs void_walker; Showcase postFX allowed.

**Must-not:** Reuse void purple — heaven reads warm gold-white only ([plan 29 §7.2](../../plans/29-pixel-art-combat-canon.md#72-heaven-trampler-rule)).

---

## Implementation handoff

| Layer | Owner |
|-------|--------|
| Theme palettes | `registerHeroCombatAssets(scene, visualTheme)` |
| Content | `content/demo/ancients.json` |
| Echoes flow | [plans/27-ancient-echo-demo.md](../../plans/27-ancient-echo-demo.md) |
