import type Phaser from 'phaser';
import {
  DISPLAY_SCALE,
  FRAME_H,
  FRAME_W,
  PALETTE_ANCIENT_GUARDIAN,
  PALETTE_ARCHER,
  PALETTE_BANDIT,
  PALETTE_CELESTIAL,
  PALETTE_CORRUPTED,
  PALETTE_DESERT_SPIRIT,
  PALETTE_DISCIPLE,
  PALETTE_FROST_SHADE,
  PALETTE_GUARD,
  PALETTE_HERO,
  PALETTE_ICE,
  PALETTE_LIGHTNING,
  PALETTE_MIST_SPIRIT,
  PALETTE_MOON_SPIRIT,
  PALETTE_RIFT_SPAWN,
  PALETTE_SAND_DEMON,
  PALETTE_SCORPION,
  PALETTE_SLIME,
  PALETTE_SPIRIT_FOX,
  PALETTE_STORM_HAWK,
  PALETTE_TOTEM,
  PALETTE_TRIBULATION,
  PALETTE_VILLAGER,
  PALETTE_VOID_SHADE,
  PALETTE_VOID_WEAVER,
  PALETTE_WISP,
  PALETTE_WOLF,
} from '@/combat/art/stickyManPalette';
import {
  buildHeroFrames,
  buildSheetCanvas,
  heroFrameOffset,
  NORMAL,
  POSES_ARCHER_ATTACK,
  POSES_ARCHER_IDLE,
  POSES_ARCHER_WALK,
  POSES_HIT,
  POSES_IDLE,
  POSES_SIT,
  POSES_SLIME_IDLE,
  POSES_SLIME_WALK,
  POSES_TOTEM_ATTACK,
  POSES_TOTEM_IDLE,
  POSES_WALK,
  type HeroCombatStyle,
} from '@/combat/art/stickyManDraw';
import {
  STRIKE_ANIM,
  STRIKE_POSES,
  UNARMED_STRIKE_KINDS,
  type UnarmedStrikeKind,
  WEAPON_STRIKE_ANIM,
  WEAPON_STRIKE_KINDS,
  WEAPON_STRIKE_POSES,
  type WeaponStrikeKind,
} from '@/combat/art/stickyManStrikes';
import type { AttackStyle } from '@/progression/WeaponProgression';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';

export const ANIM = {
  heroIdle: 'hero_sticky_idle',
  heroWalk: 'hero_sticky_walk',
  heroHit: 'hero_sticky_hit',
  heroSit: 'hero_sticky_sit',
  slimeIdle: 'enemy_slime_idle',
  slimeWalk: 'enemy_slime_walk',
  slimeSit: 'enemy_slime_sit',
  archerIdle: 'enemy_archer_idle',
  archerWalk: 'enemy_archer_walk',
  archerAttack: 'enemy_archer_attack',
  archerSit: 'enemy_archer_sit',
  totemIdle: 'enemy_totem_idle',
  totemAttack: 'enemy_totem_attack',
  totemSit: 'enemy_totem_sit',
  // New variant animation keys
  warriorIdle: 'enemy_warrior_idle',
  warriorWalk: 'enemy_warrior_walk',
  warriorAttack: 'enemy_warrior_attack',
  warriorSit: 'enemy_warrior_sit',
  monkIdle: 'enemy_monk_idle',
  monkWalk: 'enemy_monk_walk',
  monkAttack: 'enemy_monk_attack',
  monkSit: 'enemy_monk_sit',
  ghostIdle: 'enemy_ghost_idle',
  ghostWalk: 'enemy_ghost_walk',
  ghostAttack: 'enemy_ghost_attack',
  ghostSit: 'enemy_ghost_sit',
  demonIdle: 'enemy_demon_idle',
  demonWalk: 'enemy_demon_walk',
  demonAttack: 'enemy_demon_attack',
  demonSit: 'enemy_demon_sit',
  beastIdle: 'enemy_beast_idle',
  beastWalk: 'enemy_beast_walk',
  beastAttack: 'enemy_beast_attack',
  beastSit: 'enemy_beast_sit',
} as const;

const HERO_ANIM_KEYS = [
  ANIM.heroIdle,
  ANIM.heroWalk,
  ANIM.heroHit,
  ANIM.heroSit,
  ...UNARMED_STRIKE_KINDS.map((k) => STRIKE_ANIM[k]),
  ...WEAPON_STRIKE_KINDS.map((k) => WEAPON_STRIKE_ANIM[k]),
] as const;

function toHeroCombatStyle(style: AttackStyle): HeroCombatStyle {
  return style;
}

function strikeImpactHold(kind: UnarmedStrikeKind): Record<number, number> | undefined {
  if (kind.startsWith('heavy')) {
    return { 2: 150, 3: kind === 'heavyHaymaker' ? 170 : 140 };
  }
  if (kind.includes('Kick')) {
    return { 2: 120 };
  }
  return { 1: 85 };
}

function addSheetFromCanvas(
  scene: Phaser.Scene,
  key: string,
  canvas: HTMLCanvasElement,
  fw: number,
  fh: number,
): void {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }
  scene.textures.addCanvas(key, canvas);
  const texture = scene.textures.get(key);
  const count = Math.floor(canvas.width / fw);
  for (let i = 0; i < count; i++) {
    texture.add(i, 0, i * fw, 0, fw, fh);
  }
}

function createAnim(
  scene: Phaser.Scene,
  key: string,
  texture: string,
  start: number,
  count: number,
  frameRate: number,
  repeat = -1,
  holds?: Record<number, number>,
): void {
  if (scene.anims.exists(key)) {
    scene.anims.remove(key);
  }
  const frames = scene.anims.generateFrameNumbers(texture, { start, end: start + count - 1 });
  if (holds) {
    for (const [idx, dur] of Object.entries(holds)) {
      const frame = frames[Number(idx)];
      if (frame) frame.duration = dur;
    }
  }
  scene.anims.create({ key, frames, frameRate, repeat });
}

function removeHeroAnims(scene: Phaser.Scene): void {
  for (const key of HERO_ANIM_KEYS) {
    if (scene.anims.exists(key)) {
      scene.anims.remove(key);
    }
  }
}

function registerUnarmedStrikes(scene: Phaser.Scene, heroKey: string): void {
  let offset = heroFrameOffset('unarmed', 'hit') + POSES_HIT.length;
  for (const kind of UNARMED_STRIKE_KINDS) {
    const poses = STRIKE_POSES[kind];
    createAnim(
      scene,
      STRIKE_ANIM[kind],
      heroKey,
      offset,
      poses.length,
      14,
      0,
      strikeImpactHold(kind),
    );
    offset += poses.length;
  }
}

function weaponStrikeHold(kind: WeaponStrikeKind): Record<number, number> | undefined {
  if (kind.endsWith('3')) {
    return { 3: kind === 'wepSlam3' ? 140 : 130, 4: kind === 'wepSlam3' ? 130 : 110 };
  }
  if (kind.endsWith('2')) {
    return { 2: kind === 'wepSlash2' ? 110 : 0 };
  }
  return { 2: kind === 'wepChop1' ? 120 : 0, 3: kind === 'wepSlash1' ? 100 : 0 };
}

function registerWeaponStrikes(
  scene: Phaser.Scene,
  heroKey: string,
  style: Exclude<HeroCombatStyle, 'unarmed'>,
): void {
  let offset = heroFrameOffset(style, 'idle') + POSES_IDLE.length + POSES_WALK.length;
  for (const kind of WEAPON_STRIKE_KINDS) {
    const poses = WEAPON_STRIKE_POSES[kind];
    createAnim(
      scene,
      WEAPON_STRIKE_ANIM[kind],
      heroKey,
      offset,
      poses.length,
      kind.endsWith('3') ? 13 : 14,
      0,
      weaponStrikeHold(kind),
    );
    offset += poses.length;
  }
}

/** Rebuild hero spritesheet + anims for hand strikes (unarmed) or equipped weapon type. */
export function registerHeroCombatAssets(scene: Phaser.Scene, style: AttackStyle = 'unarmed'): void {
  const combatStyle = toHeroCombatStyle(style);
  const heroKey = TEXTURE_KEYS.player;
  const heroCanvas = buildSheetCanvas(
    buildHeroFrames(combatStyle),
    FRAME_W,
    FRAME_H,
    PALETTE_HERO,
    NORMAL,
    'hero',
  );
  addSheetFromCanvas(scene, heroKey, heroCanvas, FRAME_W, FRAME_H);
  removeHeroAnims(scene);

  createAnim(scene, ANIM.heroIdle, heroKey, heroFrameOffset(combatStyle, 'idle'), 4, 6);
  createAnim(scene, ANIM.heroWalk, heroKey, heroFrameOffset(combatStyle, 'walk'), 6, 10);
  createAnim(scene, ANIM.heroHit, heroKey, heroFrameOffset(combatStyle, 'hit'), POSES_HIT.length, 10, 0, {
    0: 70,
  });
  createAnim(scene, ANIM.heroSit, heroKey, heroFrameOffset(combatStyle, 'sit'), POSES_SIT.length, 3);

  if (combatStyle === 'unarmed') {
    registerUnarmedStrikes(scene, heroKey);
    return;
  }

  registerWeaponStrikes(scene, heroKey, combatStyle);
}

/** Register sticky-man spritesheets + Phaser animations (BootScene). */
export function registerStickyManAssets(scene: Phaser.Scene): void {
  registerHeroCombatAssets(scene, 'unarmed');

  registerEnemySheet(
    scene,
    'enemy_slime',
    PALETTE_SLIME,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    null,
    { idle: ANIM.slimeIdle, walk: ANIM.slimeWalk, sit: ANIM.slimeSit },
    'slime',
  );

  registerEnemySheet(
    scene,
    'enemy_archer',
    PALETTE_ARCHER,
    POSES_ARCHER_IDLE,
    POSES_ARCHER_WALK,
    POSES_ARCHER_ATTACK,
    {
      idle: ANIM.archerIdle,
      walk: ANIM.archerWalk,
      attack: ANIM.archerAttack,
      sit: ANIM.archerSit,
    },
    'archer',
    { 2: 100 },
  );

  registerBossSheet(scene, 'enemy_totem', PALETTE_TOTEM);

  // ── Unique boss sheets ──
  registerBossSheet(scene, 'boss_bandit_lord', PALETTE_BANDIT);
  registerBossSheet(scene, 'boss_mist_stalker', PALETTE_MIST_SPIRIT);
  registerBossSheet(scene, 'boss_seal_warden', PALETTE_ANCIENT_GUARDIAN);
  registerBossSheet(scene, 'boss_desert_sovereign', PALETTE_SAND_DEMON);
  registerBossSheet(scene, 'boss_thunder_avatar', PALETTE_TRIBULATION);
  registerBossSheet(scene, 'boss_frost_queen', PALETTE_ICE);
  registerBossSheet(scene, 'boss_rift_horror', PALETTE_RIFT_SPAWN);
  registerBossSheet(scene, 'boss_celestial_guardian', PALETTE_CELESTIAL);
  registerBossSheet(scene, 'boss_void_sovereign', PALETTE_VOID_SHADE);

  // ── New map-specific variants ──

  // Ch1 — Villager (monk variant, brown rags)
  registerEnemySheet(
    scene,
    'enemy_villager',
    PALETTE_VILLAGER,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.monkIdle, walk: ANIM.monkWalk, attack: ANIM.monkAttack, sit: ANIM.monkSit },
    'monk',
    { 2: 80 },
  );

  // Ch1 — Wolf (beast variant, grey)
  registerEnemySheet(
    scene,
    'enemy_wolf_beast',
    PALETTE_WOLF,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    null,
    { idle: ANIM.beastIdle, walk: ANIM.beastWalk, sit: ANIM.beastSit },
    'beast',
  );

  // Ch1 — Heng Yue disciple (monk variant, blue-white)
  registerEnemySheet(
    scene,
    'enemy_disciple',
    PALETTE_DISCIPLE,
    POSES_ARCHER_IDLE,
    POSES_ARCHER_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.monkIdle, walk: ANIM.monkWalk, attack: ANIM.monkAttack, sit: ANIM.monkSit },
    'monk',
    { 2: 100 },
  );

  // Ch2 — Spirit moth (ghost variant, pale green)
  registerEnemySheet(
    scene,
    'enemy_spirit_moth',
    PALETTE_MIST_SPIRIT,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    null,
    { idle: ANIM.ghostIdle, walk: ANIM.ghostWalk, sit: ANIM.ghostSit },
    'ghost',
  );

  // Ch2 — Mist wisp (ghost variant, pale blue)
  registerEnemySheet(
    scene,
    'enemy_mist_wisp',
    PALETTE_WISP,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.ghostIdle, walk: ANIM.ghostWalk, attack: ANIM.ghostAttack, sit: ANIM.ghostSit },
    'ghost',
    { 2: 90 },
  );

  // Ch2 — Spirit fox (beast variant, white)
  registerEnemySheet(
    scene,
    'enemy_spirit_fox',
    PALETTE_SPIRIT_FOX,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    null,
    { idle: ANIM.beastIdle, walk: ANIM.beastWalk, sit: ANIM.beastSit },
    'beast',
  );

  // Ch3 — Bandit thug (warrior variant, brown leather)
  registerEnemySheet(
    scene,
    'enemy_bandit_thug',
    PALETTE_BANDIT,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.warriorIdle, walk: ANIM.warriorWalk, attack: ANIM.warriorAttack, sit: ANIM.warriorSit },
    'warrior',
    { 2: 90 },
  );

  // Ch3 — Zhao guard (warrior variant, steel + red)
  registerEnemySheet(
    scene,
    'enemy_zhao_guard',
    PALETTE_GUARD,
    POSES_ARCHER_IDLE,
    POSES_ARCHER_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.warriorIdle, walk: ANIM.warriorWalk, attack: ANIM.warriorAttack, sit: ANIM.warriorSit },
    'warrior',
    { 2: 100 },
  );

  // Ch4 — Water spirit (ghost variant, blue-green)
  registerEnemySheet(
    scene,
    'enemy_water_sprite',
    PALETTE_MOON_SPIRIT,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    null,
    { idle: ANIM.ghostIdle, walk: ANIM.ghostWalk, sit: ANIM.ghostSit },
    'ghost',
  );
  // Ch4 — Ancient guardian (warrior variant, deep blue-green)
  registerEnemySheet(
    scene,
    'enemy_ancient_guardian',
    PALETTE_ANCIENT_GUARDIAN,
    POSES_TOTEM_IDLE,
    POSES_SLIME_WALK,
    POSES_TOTEM_ATTACK,
    { idle: ANIM.warriorIdle, walk: ANIM.warriorWalk, attack: ANIM.warriorAttack, sit: ANIM.warriorSit },
    'warrior',
    { 2: 120 },
  );

  // Ch5 — Fire scorpion (beast variant, red-orange)
  registerEnemySheet(
    scene,
    'enemy_scorpion',
    PALETTE_SCORPION,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    null,
    { idle: ANIM.beastIdle, walk: ANIM.beastWalk, sit: ANIM.beastSit },
    'beast',
  );
  // Ch5 — Sand demon (demon variant, fiery)
  registerEnemySheet(
    scene,
    'enemy_sand_demon',
    PALETTE_SAND_DEMON,
    POSES_TOTEM_IDLE,
    POSES_SLIME_WALK,
    POSES_TOTEM_ATTACK,
    { idle: ANIM.demonIdle, walk: ANIM.demonWalk, attack: ANIM.demonAttack, sit: ANIM.demonSit },
    'demon',
    { 2: 110 },
  );

  // Ch5 — Desert spirit (ghost variant, orange-gold)
  registerEnemySheet(
    scene,
    'enemy_desert_spirit',
    PALETTE_DESERT_SPIRIT,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.ghostIdle, walk: ANIM.ghostWalk, attack: ANIM.ghostAttack, sit: ANIM.ghostSit },
    'ghost',
    { 2: 90 },
  );

  // Ch6 — Storm hawk (beast variant, grey-blue)
  registerEnemySheet(
    scene,
    'enemy_storm_hawk',
    PALETTE_STORM_HAWK,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    null,
    { idle: ANIM.beastIdle, walk: ANIM.beastWalk, sit: ANIM.beastSit },
    'beast',
  );

  // Ch6 — Lightning spirit (ghost variant, yellow-white)
  registerEnemySheet(
    scene,
    'enemy_lightning_spirit',
    PALETTE_LIGHTNING,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.ghostIdle, walk: ANIM.ghostWalk, attack: ANIM.ghostAttack, sit: ANIM.ghostSit },
    'ghost',
    { 2: 100 },
  );

  // Ch6 — Tribulation elite (demon variant, storm grey + gold)
  registerEnemySheet(
    scene,
    'enemy_tribulation_elite',
    PALETTE_TRIBULATION,
    POSES_TOTEM_IDLE,
    POSES_SLIME_WALK,
    POSES_TOTEM_ATTACK,
    { idle: ANIM.demonIdle, walk: ANIM.demonWalk, attack: ANIM.demonAttack, sit: ANIM.demonSit },
    'demon',
    { 2: 120 },
  );

  // Ch7 — Ice golem (warrior variant, ice blue)
  registerEnemySheet(
    scene,
    'enemy_ice_golem',
    PALETTE_ICE,
    POSES_TOTEM_IDLE,
    POSES_SLIME_WALK,
    POSES_TOTEM_ATTACK,
    { idle: ANIM.warriorIdle, walk: ANIM.warriorWalk, attack: ANIM.warriorAttack, sit: ANIM.warriorSit },
    'warrior',
    { 2: 110 },
  );

  // Ch7 — Frost shade (ghost variant, pale blue)
  registerEnemySheet(
    scene,
    'enemy_frost_shade',
    PALETTE_FROST_SHADE,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.ghostIdle, walk: ANIM.ghostWalk, attack: ANIM.ghostAttack, sit: ANIM.ghostSit },
    'ghost',
    { 2: 90 },
  );

  // Ch8 — Rift spawn (demon variant, dark purple)
  registerEnemySheet(
    scene,
    'enemy_rift_spawn',
    PALETTE_RIFT_SPAWN,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.demonIdle, walk: ANIM.demonWalk, attack: ANIM.demonAttack, sit: ANIM.demonSit },
    'demon',
    { 2: 100 },
  );

  // Ch8 — Corrupted cultist (demon variant, dark red)
  registerEnemySheet(
    scene,
    'enemy_corrupted_cultist',
    PALETTE_CORRUPTED,
    POSES_ARCHER_IDLE,
    POSES_ARCHER_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.demonIdle, walk: ANIM.demonWalk, attack: ANIM.demonAttack, sit: ANIM.demonSit },
    'demon',
    { 2: 100 },
  );

  // Ch9 — Gate sentinel (warrior variant, gold-white)
  registerEnemySheet(
    scene,
    'enemy_gate_sentinel',
    PALETTE_CELESTIAL,
    POSES_ARCHER_IDLE,
    POSES_ARCHER_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.warriorIdle, walk: ANIM.warriorWalk, attack: ANIM.warriorAttack, sit: ANIM.warriorSit },
    'warrior',
    { 2: 120 },
  );

  // Ch9 — Celestial archer (warrior variant, silver-blue) — reuses enemy_gate_sentinel visual
  // Ch9 — Loi Tien elite (warrior variant, celestial look) — reuses enemy_gate_sentinel visual

  // Ch10 — Void shade (ghost variant, deep purple)
  registerEnemySheet(
    scene,
    'enemy_void_shade',
    PALETTE_VOID_SHADE,
    POSES_SLIME_IDLE,
    POSES_SLIME_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.ghostIdle, walk: ANIM.ghostWalk, attack: ANIM.ghostAttack, sit: ANIM.ghostSit },
    'ghost',
    { 2: 100 },
  );

  // Ch10 — Void weaver (demon variant, violet glow)
  registerEnemySheet(
    scene,
    'enemy_void_weaver',
    PALETTE_VOID_WEAVER,
    POSES_ARCHER_IDLE,
    POSES_ARCHER_WALK,
    POSES_ARCHER_ATTACK,
    { idle: ANIM.demonIdle, walk: ANIM.demonWalk, attack: ANIM.demonAttack, sit: ANIM.demonSit },
    'demon',
    { 2: 110 },
  );
}

function registerEnemySheet(
  scene: Phaser.Scene,
  key: string,
  palette: typeof PALETTE_SLIME,
  idle: typeof POSES_SLIME_IDLE,
  walk: typeof POSES_SLIME_WALK,
  attack: typeof POSES_ARCHER_ATTACK | null,
  animKeys: { idle: string; walk: string; attack?: string; sit?: string },
  variant: 'slime' | 'archer' | 'warrior' | 'monk' | 'ghost' | 'demon' | 'beast',
  attackHolds?: Record<number, number>,
): void {
  const frames = attack
    ? [...idle, ...walk, ...POSES_SIT, ...attack]
    : [...idle, ...walk, ...POSES_SIT];
  const canvas = buildSheetCanvas(frames, FRAME_W, FRAME_H, palette, NORMAL, variant);
  addSheetFromCanvas(scene, key, canvas, FRAME_W, FRAME_H);

  let offset = 0;
  createAnim(scene, animKeys.idle, key, offset, idle.length, 5);
  offset += idle.length;
  createAnim(scene, animKeys.walk, key, offset, walk.length, 10);
  offset += walk.length;
  if (animKeys.sit) {
    createAnim(scene, animKeys.sit, key, offset, POSES_SIT.length, 3);
    offset += POSES_SIT.length;
  }
  if (attack && animKeys.attack) {
    createAnim(scene, animKeys.attack, key, offset, attack.length, 10, 0, attackHolds);
  }
}

function registerBossSheet(scene: Phaser.Scene, key: string, palette: typeof PALETTE_TOTEM): void {
  const frames = [...POSES_TOTEM_IDLE, ...POSES_SIT, ...POSES_TOTEM_ATTACK];
  const canvas = buildSheetCanvas(frames, FRAME_W, FRAME_H, palette, NORMAL, 'boss');
  addSheetFromCanvas(scene, key, canvas, FRAME_W, FRAME_H);

  const idleKey = `${key}_idle`;
  const sitKey = `${key}_sit`;
  const atkKey = `${key}_attack`;

  let offset = 0;
  createAnim(scene, idleKey, key, offset, POSES_TOTEM_IDLE.length, 4);
  offset += POSES_TOTEM_IDLE.length;
  createAnim(scene, sitKey, key, offset, POSES_SIT.length, 3);
  offset += POSES_SIT.length;
  createAnim(scene, atkKey, key, offset, POSES_TOTEM_ATTACK.length, 9, 0, {
    2: 130,
  });
}

/** Arcade body at the feet — call after origin/scale changes. */
export function configureStickyManBody(sprite: Phaser.Physics.Arcade.Sprite): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setSize(16, 12);
  body.setOffset(8, FRAME_H - 12);
  sprite.refreshBody();
}

/** Scale + origin for sticky-man sprites (feet at bottom center). All characters share size. */
export function applyStickyManSprite(sprite: Phaser.Physics.Arcade.Sprite): void {
  sprite.setOrigin(0.5, 1);
  sprite.setScale(DISPLAY_SCALE);
  configureStickyManBody(sprite);
}

export function cultivatorAnimKeys(spriteKey: string): {
  idle: string;
  walk: string;
  attack?: string;
  sit?: string;
} {
  switch (spriteKey) {
    case 'enemy_slime':
      return { idle: ANIM.slimeIdle, walk: ANIM.slimeWalk, sit: ANIM.slimeSit };
    case 'enemy_archer':
      return {
        idle: ANIM.archerIdle,
        walk: ANIM.archerWalk,
        attack: ANIM.archerAttack,
        sit: ANIM.archerSit,
      };
    case 'enemy_totem':
      return {
        idle: 'enemy_totem_idle',
        walk: 'enemy_totem_idle',
        attack: 'enemy_totem_attack',
        sit: 'enemy_totem_sit',
      };
    case 'boss_bandit_lord':
      return {
        idle: 'boss_bandit_lord_idle',
        walk: 'boss_bandit_lord_idle',
        attack: 'boss_bandit_lord_attack',
        sit: 'boss_bandit_lord_sit',
      };
    case 'boss_mist_stalker':
      return {
        idle: 'boss_mist_stalker_idle',
        walk: 'boss_mist_stalker_idle',
        attack: 'boss_mist_stalker_attack',
        sit: 'boss_mist_stalker_sit',
      };
    case 'boss_seal_warden':
      return {
        idle: 'boss_seal_warden_idle',
        walk: 'boss_seal_warden_idle',
        attack: 'boss_seal_warden_attack',
        sit: 'boss_seal_warden_sit',
      };
    case 'boss_desert_sovereign':
      return {
        idle: 'boss_desert_sovereign_idle',
        walk: 'boss_desert_sovereign_idle',
        attack: 'boss_desert_sovereign_attack',
        sit: 'boss_desert_sovereign_sit',
      };
    case 'boss_thunder_avatar':
      return {
        idle: 'boss_thunder_avatar_idle',
        walk: 'boss_thunder_avatar_idle',
        attack: 'boss_thunder_avatar_attack',
        sit: 'boss_thunder_avatar_sit',
      };
    case 'boss_frost_queen':
      return {
        idle: 'boss_frost_queen_idle',
        walk: 'boss_frost_queen_idle',
        attack: 'boss_frost_queen_attack',
        sit: 'boss_frost_queen_sit',
      };
    case 'boss_rift_horror':
      return {
        idle: 'boss_rift_horror_idle',
        walk: 'boss_rift_horror_idle',
        attack: 'boss_rift_horror_attack',
        sit: 'boss_rift_horror_sit',
      };
    case 'boss_celestial_guardian':
      return {
        idle: 'boss_celestial_guardian_idle',
        walk: 'boss_celestial_guardian_idle',
        attack: 'boss_celestial_guardian_attack',
        sit: 'boss_celestial_guardian_sit',
      };
    case 'boss_void_sovereign':
      return {
        idle: 'boss_void_sovereign_idle',
        walk: 'boss_void_sovereign_idle',
        attack: 'boss_void_sovereign_attack',
        sit: 'boss_void_sovereign_sit',
      };
    case 'enemy_villager':
    case 'enemy_disciple':
      return {
        idle: ANIM.monkIdle,
        walk: ANIM.monkWalk,
        attack: ANIM.monkAttack,
        sit: ANIM.monkSit,
      };
    case 'enemy_wolf_beast':
    case 'enemy_storm_hawk':
    case 'enemy_spirit_fox':
    case 'enemy_scorpion':
      return {
        idle: ANIM.beastIdle,
        walk: ANIM.beastWalk,
        sit: ANIM.beastSit,
      };
    case 'enemy_spirit_moth':
    case 'enemy_mist_wisp':
    case 'enemy_desert_spirit':
    case 'enemy_lightning_spirit':
    case 'enemy_frost_shade':
    case 'enemy_void_shade':
    case 'enemy_water_sprite':
      return {
        idle: ANIM.ghostIdle,
        walk: ANIM.ghostWalk,
        attack: ANIM.ghostAttack,
        sit: ANIM.ghostSit,
      };
    case 'enemy_bandit_thug':
    case 'enemy_zhao_guard':
    case 'enemy_ancient_guardian':
    case 'enemy_ice_golem':
    case 'enemy_gate_sentinel':
      return {
        idle: ANIM.warriorIdle,
        walk: ANIM.warriorWalk,
        attack: ANIM.warriorAttack,
        sit: ANIM.warriorSit,
      };
    case 'enemy_sand_demon':
    case 'enemy_tribulation_elite':
    case 'enemy_rift_spawn':
    case 'enemy_corrupted_cultist':
    case 'enemy_void_weaver':
      return {
        idle: ANIM.demonIdle,
        walk: ANIM.demonWalk,
        attack: ANIM.demonAttack,
        sit: ANIM.demonSit,
      };
    default:
      return { idle: ANIM.slimeIdle, walk: ANIM.slimeWalk, sit: ANIM.slimeSit };
  }
}

/** @deprecated Use cultivatorAnimKeys */
export const enemyAnimKeys = cultivatorAnimKeys;

export function isBossSpriteKey(spriteKey: string): boolean {
  return spriteKey === 'enemy_totem';
}

export { STRIKE_ANIM } from '@/combat/art/stickyManStrikes';
