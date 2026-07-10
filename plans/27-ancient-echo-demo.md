# Sub-Plan 27: Echoes of the Ancients (Guided Demo Mode)

**Phase:** Cross-cutting — Home + Combat onboarding  
**Estimated effort:** 8–10 hours (+ 4h combat power fantasy enhancement)  
**Depends on:** `12-home-ui-panels`, `13-cultivation-realm-system`, `14-insight-system`, `15-fortuitous-encounters`  
**Blocks:** — (enhances onboarding; optional ancients added in `21`–`23`)

> **Master plan:** [index.md](./index.md) · §2 MVP Scope · §6 Sub-Plan Index · §7.6 Ancient Echo Demo

---

## 1. Objective

Ship a **first-class player feature** (not dev-only) that lets newcomers walk in the footsteps of legendary cultivators — inspired by *Renegade Immortal*-style ancients who already succeeded. Each echo is a curated save snapshot that demonstrates one game system end-to-end.

**Player promise:** *"Feel what late cultivation feels like before you earn it yourself."*

**Combat promise:** Every walk drops the player into combat as that ancient — themed hero, their
equipped Divine Arts, unlimited HP/mana (HUD shows **∞** only). This is the game's **recurring
showcase + Divine Arts catalog** pillar (`plans/index.md` §7.6), not merely an onboarding demo —
players return to it later to preview arts they haven't earned yet.

> **⚠️ Status correction (2026-07):** this sub-plan previously read as unimplemented. **Echoes MVP shipped 2026-07-07** — see `tracks/27-ancient-echo-demo.md`. Optional polish (confirm modal, showcase VFX tier) remains open.

> **⚠️ Gap flagged 2026-07-06 (user request):** the roster below tops out at `void_spirit`
> (`ancient.void_walker`) — one realm below this game's own highest realm (`true_dao`), and
> *nowhere near* what the source novel actually means by an "ancient." In *Renegade Immortal*,
> the cultivation ladder is Nine Realms → Second Step (Ascendant/Illusory Yin/Corporeal Yang) →
> **Third Step (Heaven-Trampling)** — described as the single most supreme realm in the entire
> universe of the novel, where the cultivator "can walk on the heavens, establish their own
> rules, and become truly immortal." Wang Lin himself only reaches it at the very end of the
> ~2,088-chapter novel and is told he is only the *second* being ever to do so. None of the
> current 6 ancients come close to conveying that scale — see §3a below for the fix.

---

## 2. Design Principles

| Principle | Rule |
|-----------|------|
| Not a cheat | Real UI flows — Cultivate, Awaken, combat, Story archive |
| Safe | Player journey paused in session backup; demo never writes to IndexedDB |
| Combat-first | Confirm → combat map immediately; showcase skills and power fantasy |
| God mode | No damage, infinite mana in combat; internal inflated pools; HUD shows **∞** only |
| Focused | One ancient ≈ one teaching goal (breakthrough, awakening, combat, fortune, endgame) |
| Shippable | Dedicated **Echoes** bottom-nav tab + Play travel button; en + vi strings |
| Expandable | Add ancients per chapter in sub-plans `21`–`23` without code changes |

---

## 3. Ancient Roster (MVP)

| ID | Focus | Map | Teaches |
|----|-------|-----|---------|
| `ancient.breakthrough_sage` | Breakthrough | `map.test.grove` | Realm-ready stats; exit to Home → Cultivate + breakthrough ceremony |
| `ancient.insight_seeker` | Awakening | `map.test.grove` | Master-Intent-ready intents; exit to Home → Awaken in Divine Arts panel |
| `ancient.sword_ancestor` | Combat | `map.test.grove` | Awakened sword/lightning, combo flow |
| `ancient.flame_sovereign` | Combat | `map.test.grove` | Nascent Soul, multi-element awakened skills |
| `ancient.fortune_emissary` | Fortune | `map.test.grove` | All encounter types, lore archive, spirit pet (via Home) |
| `ancient.void_walker` | Endgame | `map.test.grove` | Void Spirit, full power fantasy |
| `ancient.heaven_trampler` | **Third Step** (see §3a) | `map.test.grove` | True Dao pinned mechanically, but framed as a being beyond even that — the actual scale of "ancient" the novel means |

Each ancient has a `visualTheme` (`void`, `sword`, `flame`, `fortune`, `jade`, `insight`, **`heaven`** for the new entry) driving combat sprite palette, weapon silhouette, clothes, and aura color. Full palette + impress rules: [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §7.

> **Note:** `startScene` in JSON is legacy metadata; `EchoesPanel` always routes to `startMapId` combat.

### 3a. `ancient.heaven_trampler` — conveying Third Step scale within a 7-realm ladder

This game's own realm ladder (`content/progression/realms.json`) tops out at `true_dao` — it has
no realm above that, and adding one would be a much larger, riskier change (touches
`CombatPower`, breakthrough gating, every `recommendedRealmOrder` comparison on every map). So
this ancient is **mechanically** pinned to `realmId: 'true_dao'` like any other save — the scale
comes from everything *around* that, not a new realm enum value:

- **Stat multiplier**: an order of magnitude above `ancient.void_walker`'s already-inflated pool
  (god mode already bypasses damage/mana, so the raw numbers shown are pure spectacle — HP/ATK/
  SPD stats large enough that the HUD's `∞`-style display and damage numbers read as obviously
  "off the chart" compared to every other ancient, not just "a bit stronger").
- **Lore framing does the real work**: `demo.ancient.heaven_trampler.lore` should explicitly
  narrate this as a being who *left* the Nine Realms and Second Step behind entirely — not
  "the strongest cultivator in the story," but "one of only two beings ever confirmed to reach
  this height," directly translating the novel's actual claim about Wang Lin's own ending.
  `epithetKey` should carry the "Heaven-Trampling" / "Đạp Thiên" name directly, not a generic
  title like the other 6 ancients use.
- **Visual theme `heaven`**: reserve a distinct palette (not reusing `void`'s purple-black —
  something that reads as *beyond* void, e.g. a searing white/gold that overexposes the screen)
  so this entry is instantly recognizable as a tier apart in the Echoes list, not just another
  card.
- **Unlocked skills**: reuse the highest-tier variants already authored across every intent
  (`.v5`/`.awakened` suffixes) rather than inventing new content — the point is showing *existing*
  Divine Arts at their absolute ceiling, all six wheel slots filled with top-tier arts
  simultaneously (something no normal playthrough save could ever legitimately have, since the
  redesigned Master Intent system — see `handbook/renegade-immortal-reference.md` §Master Intent —
  only lets a real player have 1–2 main-flow intents awakened at once at this point in the MVP).

---

## 4. Deliverables

| File | Purpose |
|------|---------|
| `content/demo/ancients.json` | Ancient profiles + save templates + `visualTheme` |
| `src/shared/schemas/ancient-demo.ts` | Zod validation (`visualTheme` enum) |
| `src/progression/AncientDemoManager.ts` | Build save, enter/exit session |
| `src/progression/AncientCombatMode.ts` | God-mode pool amplification + `isAncientCombatActive()` |
| `src/progression/StatSheet.ts` | `enableGodMode()` — bypass damage/mana/death |
| `src/combat/art/ancientHeroVisuals.ts` | Themed textures, aura, name/epithet tags |
| `src/combat/entities/Player.ts` | `applyAncientEcho()`, anim remap |
| `src/combat/scenes/MapScene.ts` | God mode on spawn; skip runtime persist during demo |
| `src/combat/systems/EncounterTrigger.ts` | Skip fortuitous rolls during demo |
| `src/ui/home/panels/EchoesPanel.ts` | Dedicated bottom-nav panel; always → combat |
| `src/ui/home/panels/PlayPanel.ts` | Travel button → Echoes tab |
| `src/ui/modals/AncientDemoModal.ts` | Lore + confirm before enter |
| `src/ui/hud/AncientEchoBanner.ts` | Top combat banner (name, epithet, tag) |
| `src/ui/hud/PlayerStatusBar.ts` | Ancient mode — full bars, **∞** label, gold styling |
| `src/ui/hud/CombatHUD.ts` | Wires banner + ancient status bar mode |
| `content/locales/{en,vi}/demo.json` | All strings incl. `demo.combat.tag` |

---

## 5. Session Flow

```
Player taps ancient card
  → AncientDemoModal (lore, highlights, confirm if real progress exists)
  → backup journey to sessionStorage (if meaningful progress)
  → load buildAncientSave(ancientId) into gameStore
  → SceneRouter.switchTo('combat', { mapId: profile.startMapId })
  → MapScene: applyAncientGodMode(statSheet) + player.applyAncientEcho(profile)
  → CombatHUD: AncientEchoBanner + PlayerStatusBar ancient mode
  → ProfileHeader shows ancient name + "Ancient Echo" badge (Home)
  → gameStore.persist() no-ops while demo active
  → MapScene.persistRuntime() skipped during demo
Player taps "Return to Your Path"
  → restore backup → persist to IndexedDB → clear session
```

### 5.1 Hero vs Ancient identity (no overlap)

> **Rule:** The player has **one** active identity. Ancient visuals, god-mode, and demo save must
> **never** stack on top of the journey hero. Exiting ancient mode fully restores the hero everywhere.

| Mode | When active | Save in `gameStore` | Combat sprite | Home 3D + profile |
|------|-------------|---------------------|---------------|-------------------|
| **Hero (journey)** | Default; all normal play | Player journey (IndexedDB) | Player sticky-man + loadout | Player name, gear, CP |
| **Ancient (echo)** | Only during echo combat chain | Demo template (memory) | Ancient theme + god-mode | **Still hero** — profile/3D use journey backup display, not ancient name on shrine |

**Combat entry — who you are:**

| Entry | Identity | Required pre-step |
|-------|----------|-------------------|
| Echoes modal → **Walk** / **Follow path** / **Walk here** → combat | **Ancient** | `AncientDemoManager.enter(ancientId)` |
| Path-walk chain: map → story → next map (while `PathWalkManager` active) | **Ancient** | Session already entered |
| **Continue Journey** (Story Gate) | **Hero** | `AncientDemoManager.exit()` if echo active |
| **Map Portal** free jump / Enter map | **Hero** | `exit()` if echo active |
| Combat menu → **Back to Home** | **Hero** (on Home) | `exit()` + restore journey |
| Echoes → **Return to Your Path** | **Hero** | `exit()` (existing) |
| Path-walk **done** | **Hero** | `exit()` (existing) |

**Continue Journey = hero.** Any "back to my road" affordance exits the echo first, then uses the
**journey** save for Story Gate and combat — never the demo template.

**Implementation contract (`combatEntrySource` or equivalent):**

```typescript
async function enterCombatAsHero(mapId: string): Promise<void> {
  await AncientDemoManager.exit(); // idempotent when not in echo
  PathWalkManager.clear();
  // gameStore = journey save; MapScene spawns player hero only
  await SceneRouter.switchTo('combat', { mapId, identity: 'hero' });
}

async function enterCombatAsAncient(mapId: string): Promise<void> {
  // enter() already called from Echoes modal; do NOT exit here
  if (!AncientCombatMode.isActive()) throw new Error('echo-not-entered');
  await SceneRouter.switchTo('combat', { mapId, identity: 'ancient' });
}
```

**MapScene spawn:**

- `identity === 'ancient'` (or `AncientCombatMode.isActive()` at spawn only if source was echo):
  `applyAncientGodMode` + `player.applyAncientEcho(profile)` + `AncientEchoBanner`.
- Otherwise: `player.clearAncientEcho()` if previously applied; normal `StatSheet` from journey save;
  no ancient banner, no god-mode.

**No overlap on exit:** `AncientDemoManager.exit()` must clear `AncientCombatMode`, restore backup
to `gameStore`, persist IndexedDB, and `HeroViewer` / `ProfileHeader` re-render **journey** identity
— ancient palette, aura, name tag, and badge must not linger one frame.

**Deprecated:** browsing Home tabs (Cultivate, Treasures, Awaken) **while demo save is loaded** —
echo is a **combat showcase corridor**, not an alternate Home profile. Home panels always edit the
journey save; only Echoes tab shows "Return to Your Path" while a session flag is set mid-walk.

Cross-refs: Journey **Continue** — plan 12 §10 · plan 17 §7.3 · Combat **Back Home** — plan 03 §6.2.

---

## 6. Save Template Fields

```typescript
// content/demo/ancients.json → save block
{
  level, realmId, realmTier, spirit?, gold,
  awakenedIntents[], insightReadyIntents[],
  equippedSkills, equipped, inventoryItemIds,
  pet, yearsCultivated,
  encountersFound[], loreUnlocked[], storySeen[],
  clearedBosses[], clearedMaps[], bestiary[]
}
```

Profile metadata: `focusKey`, `startMapId`, `visualTheme`, `nameKey`, `epithetKey`, `loreKey`, `highlightKeys[]`.

Realm `breakthroughReady` is derived via `syncRealmProgress()` — do not hardcode unless template stats meet gates.

---

## 7. UI Spec

### Echoes tab (`EchoesPanel`)

- Bottom nav tab: **Echoes** / **Tiên Cổ** (between Play and Inventory)
- Play panel has **Echoes of the Ancients** travel button → opens Echoes tab via `home:open-tab` event
- Groups by `focusKey`: Breakthrough · Awakening · Combat · Fortune · Endgame
- Active ancient card highlighted; **Return to Your Path** when in demo
- **Walk in Their Footsteps** → always combat (no home-only branch)

### Combat HUD (ancient demo active)

- **AncientEchoBanner** — ancient name, epithet, `demo.combat.tag` subtitle
- **PlayerStatusBar** — gold `player-status--ancient` styling; HP/Mana bars full, text **∞** only
- **Divine Arts wheel** — full **6 slots** (`primary, secondary, ultimate, skill3, skill4,
  skill5`, matching the redesigned combat control model, `plans/index.md` §1.2/§2.1), each an
  Intent-tinted icon (colors per `handbook/pixel-art-style.md` §3.1) + **Dash** ⚔ + **Gather Qi**
  button — no keyboard letters on mobile. (Was: "three intent-icon skill buttons + attack + dodge".)
- **Divine Arts loadout** — Echoes modal: tap a slot → pick from the ancient's `unlockedSkills`
  pool before walk (field name kept from existing authored content; conceptually the ancient's
  earned Divine Arts). Spec: [`plans/30-divine-arts-wheel-loadout.md`](./30-divine-arts-wheel-loadout.md) §4.2.
- **Combat wheel** — always 6 visible slots; empty = disabled dashed; filled = intent icon + cast.
  Same widget for hero and ancient (`§5`).
- Themed hero sprite replaces default sticky-man (palette + weapon + aura per `visualTheme`)
- **Ancient Divine Art VFX** — this is the primary consumer of the **Showcase** VFX tier
  (`plans/index.md` §3.6; detail [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §3.2): one camera-level postFX pass (Bloom/ColorMatrix/Vignette) + hero AOE
  sprite + hit-stop + strong screen shake + radial burst + amplified reach/scale — the game
  "shows off" here more than anywhere else
- Dev state label hidden; ancient anims mapped via `Player.resolveAnim()`

### Profile header (Home)

- **Journey hero only** — `hero.wanderer` name; no ancient name on shrine (plan 27 §5.1).
- While echo session in progress (mid path-walk): optional subtle **"Echo in progress"** hint on
  Echoes tab only — not on profile card.
- Cultivate button uses **journey** save only (never demo realm).

---

## 8. Combat God Mode

| Rule | Implementation |
|------|----------------|
| Display HP/Mana (internal) | `max(50_000, hpMax×10)` / `max(25_000, manaMax×10)` via `applyAncientGodMode()` |
| Actual combat | `StatSheet.enableGodMode()` — `applyDamage` returns 0, `spendMana` always succeeds, `isDead` false |
| HUD | **∞** on both bars; fill always 100% (no numeric display) |
| Persist | `MapScene.persistRuntime()` no-ops when `isAncientCombatActive()` |
| Encounters | `EncounterTrigger` constructor returns early — no map-enter rolls or POI during demo |

---

## 9. Tests

| Test | Assert |
|------|--------|
| `buildAncientSave` breakthrough sage | `realm.breakthroughReady === true` |
| `buildAncientSave` insight seeker | void/sword `checkAwakeningReady` |
| enter → exit | journey restored unchanged |
| persist during demo | IndexedDB unchanged |
| `StatSheet` god mode | no damage, infinite mana spend, not dead |

No test suite exists yet — build these alongside the implementation, not after.

---

## 10. Acceptance Criteria

- [x] Six ancients, each with distinct focus
- [x] Grouped Echoes panel UI with en + vi
- [x] All walks enter combat on `startMapId`
- [x] Themed ancient hero visuals (palette, weapon, aura, name tag)
- [x] All 6 Divine Arts wheel slots usable in combat demo (not just primary/secondary/ultimate)
- [x] God-mode HP/Mana — internal pools; HUD **∞** only
- [x] Fortuitous encounters skipped during demo
- [x] Journey backup + restore works; combat runtime not persisted; demo never writes to My Path
- [x] **Hero vs ancient identity** (§5.1): Continue Journey / Map Portal / Back Home always hero;
  only Echoes→combat acts as ancient; no visual overlap after `exit()`
- [x] Documented in plans/index.md §7.6
- [x] Unit tests pass

---

## 11. Future (Content Phases)

- Sub-plans `21`–`23`: chapter-themed ancients (`ancient.fallen_village_hero`, etc.)
- Sub-plan `18`: link `storySeen` to full story replay from demo
- Sub-plan `24`: audit Vietnamese string length in ancient cards
- Optional: dedicated showcase maps per ancient (beyond shared `map.test.grove`)
- Optional: remove deprecated `startScene` field from JSON schema

---

## 12. Handoff

Players discover combat power and systems before world map (`17`) ships. Fortune emissary pairs with sub-plan `15` POIs on test map (when not in demo); chapter ancients reuse the same JSON pipeline.
