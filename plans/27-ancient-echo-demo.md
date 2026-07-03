# Sub-Plan 27: Echoes of the Ancients (Guided Demo Mode)

**Phase:** Cross-cutting — Home + Combat onboarding  
**Estimated effort:** 8–10 hours (+ 4h combat power fantasy enhancement)  
**Depends on:** `12-home-ui-panels`, `13-cultivation-realm-system`, `14-insight-system`, `15-fortuitous-encounters`  
**Blocks:** — (enhances onboarding; optional ancients added in `21`–`23`)

> **Master plan:** [index.md](./index.md) · §2 MVP Scope · §6 Sub-Plan Index · §7.6 Ancient Echo Demo

---

## 1. Objective

Ship a **first-class player feature** (not dev-only) that lets newcomers walk in the footsteps of legendary cultivators — inspired by *Tiên Nghịch*-style ancients who already succeeded. Each echo is a curated save snapshot that demonstrates one game system end-to-end.

**Player promise:** *"Feel what late cultivation feels like before you earn it yourself."*

**Combat promise (2026-07-03):** Every walk drops the player into combat as that ancient — themed hero, their equipped skills, unlimited HP/mana (HUD shows **∞** only).

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
| `ancient.insight_seeker` | Awakening | `map.test.grove` | Insight-ready intents; exit to Home → Awaken in Skills panel |
| `ancient.sword_ancestor` | Combat | `map.test.grove` | Awakened sword/lightning, combo flow |
| `ancient.flame_sovereign` | Combat | `map.test.grove` | Nascent Soul, multi-element awakened skills |
| `ancient.fortune_emissary` | Fortune | `map.test.grove` | All encounter types, lore archive, spirit pet (via Home) |
| `ancient.void_walker` | Endgame | `map.test.grove` | Void Spirit, full power fantasy |

Each ancient has a `visualTheme` (`void`, `sword`, `flame`, `fortune`, `jade`, `insight`) driving combat sprite palette, weapon silhouette, clothes, and aura color.

> **Note:** `startScene` in JSON is legacy metadata; `EchoesPanel` always routes to `startMapId` combat.

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
- **Skill action bar** — three intent-icon skill buttons (primary / secondary / ultimate) + attack ⚔ + dodge 💨 — no keyboard letters on mobile
- **Skill loadout** — Echoes modal: tap slot → pick from `unlockedSkills` pool before walk
- Themed hero sprite replaces default sticky-man (palette + weapon + aura per `visualTheme`)
- **Ancient skill VFX** — screen shake, radial burst, amplified reach/scale in god mode
- Dev state label hidden; ancient anims mapped via `Player.resolveAnim()`

### Profile header (Home)

- Ancient name + **Ancient Echo** badge
- Hide Cultivate during demo (optional — prevents breaking demo realm story)

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
| Full suite | 186 tests green (2026-07-03) |

---

## 10. Acceptance Criteria

- [x] Six ancients, each with distinct focus
- [x] Grouped Echoes panel UI with en + vi
- [x] All walks enter combat on `startMapId`
- [x] Themed ancient hero visuals (palette, weapon, aura, name tag)
- [x] Equipped skills usable in combat demo
- [x] God-mode HP/Mana — internal pools; HUD **∞** only
- [x] Fortuitous encounters skipped during demo
- [x] Journey backup + restore works; combat runtime not persisted
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
