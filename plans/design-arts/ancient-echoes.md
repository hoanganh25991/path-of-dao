# DA-06 — Ancient Echo Visuals

> Parent: [index.md](./index.md) · Echoes: plan `27` · Sheets: [handbook/character-sheets/ancients.md](../../handbook/character-sheets/ancients.md)

---

## Objective

Per-ancient **visualTheme** variants — palette swaps + weapon/aura on hero rig (not unique rigs per ancient).

## Per ancient (`content/demo/ancients.json`)

| Theme | Palette direction | Weapon read |
|-------|-------------------|-------------|
| `void` | Purple-black, silver edge | Void blade |
| `sword` | Cyan-white | Long ancient blade |
| `flame` | Ember orange core | Flame wisp off-hand |
| `fortune` | Gold-green | Talisman fan |
| `jade` | Teal jade | Spirit orb |
| `insight` | Silver-blue | Meditation beads |
| `heaven` | White-gold overexpose | Crown glyph |

**Path:** `assets/sprites/ancients/{visualTheme}_hero.png` or palette tables in `ancientHeroVisuals.ts` fed by DA-08 manifest.

## Acceptance

- [ ] Each of 7 ancients distinct at Echoes card thumbnail + combat banner
- [ ] Showcase tier VFX readable (plan 29 §3.2) — aura ring + sword rebuild, not full-body tint wash
- [ ] No overlap with journey hero after `exit()` (plan 27 §5.1)
