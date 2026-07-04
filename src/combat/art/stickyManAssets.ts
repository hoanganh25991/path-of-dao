import type Phaser from 'phaser';
import {
  DISPLAY_SCALE,
  FRAME_H,
  FRAME_W,
  PALETTE_ARCHER,
  PALETTE_HERO,
  PALETTE_SLIME,
  PALETTE_TOTEM,
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

  registerBossSheet(scene);
}

function registerEnemySheet(
  scene: Phaser.Scene,
  key: string,
  palette: typeof PALETTE_SLIME,
  idle: typeof POSES_SLIME_IDLE,
  walk: typeof POSES_SLIME_WALK,
  attack: typeof POSES_ARCHER_ATTACK | null,
  animKeys: { idle: string; walk: string; attack?: string; sit?: string },
  variant: 'slime' | 'archer',
  attackHolds?: Record<number, number>,
): void {
  const frames = attack
    ? [...idle, ...walk, ...POSES_SIT, ...attack]
    : [...idle, ...walk, ...POSES_SIT];
  const canvas = buildSheetCanvas(frames, FRAME_W, FRAME_H, palette, NORMAL, variant);
  addSheetFromCanvas(scene, key, canvas, FRAME_W, FRAME_H);

  let offset = 0;
  createAnim(scene, animKeys.idle, key, offset, idle.length, variant === 'slime' ? 5 : 5);
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

function registerBossSheet(scene: Phaser.Scene): void {
  const key = 'enemy_totem';
  const frames = [...POSES_TOTEM_IDLE, ...POSES_SIT, ...POSES_TOTEM_ATTACK];
  const canvas = buildSheetCanvas(frames, FRAME_W, FRAME_H, PALETTE_TOTEM, NORMAL, 'boss');
  addSheetFromCanvas(scene, key, canvas, FRAME_W, FRAME_H);

  let offset = 0;
  createAnim(scene, ANIM.totemIdle, key, offset, POSES_TOTEM_IDLE.length, 4);
  offset += POSES_TOTEM_IDLE.length;
  createAnim(scene, ANIM.totemSit, key, offset, POSES_SIT.length, 3);
  offset += POSES_SIT.length;
  createAnim(scene, ANIM.totemAttack, key, offset, POSES_TOTEM_ATTACK.length, 9, 0, {
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
        idle: ANIM.totemIdle,
        walk: ANIM.totemIdle,
        attack: ANIM.totemAttack,
        sit: ANIM.totemSit,
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
