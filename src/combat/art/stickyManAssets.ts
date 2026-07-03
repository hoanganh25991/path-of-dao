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
  POSES_SLIME_IDLE,
  POSES_SLIME_WALK,
  POSES_TOTEM_ATTACK,
  POSES_TOTEM_IDLE,
  type HeroCombatStyle,
} from '@/combat/art/stickyManDraw';
import type { AttackStyle } from '@/progression/WeaponProgression';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';

export const ANIM = {
  heroIdle: 'hero_sticky_idle',
  heroWalk: 'hero_sticky_walk',
  heroAttack1: 'hero_sticky_attack_1',
  heroAttack2: 'hero_sticky_attack_2',
  heroAttack3: 'hero_sticky_attack_3',
  heroPalmAttack1: 'hero_sticky_palm_1',
  heroPalmAttack2: 'hero_sticky_palm_2',
  heroPalmAttack3: 'hero_sticky_palm_3',
  heroHit: 'hero_sticky_hit',
  slimeIdle: 'enemy_slime_idle',
  slimeWalk: 'enemy_slime_walk',
  archerIdle: 'enemy_archer_idle',
  archerWalk: 'enemy_archer_walk',
  archerAttack: 'enemy_archer_attack',
  totemIdle: 'enemy_totem_idle',
  totemAttack: 'enemy_totem_attack',
} as const;

const HERO_ANIM_KEYS = [
  ANIM.heroIdle,
  ANIM.heroWalk,
  ANIM.heroAttack1,
  ANIM.heroAttack2,
  ANIM.heroAttack3,
  ANIM.heroPalmAttack1,
  ANIM.heroPalmAttack2,
  ANIM.heroPalmAttack3,
  ANIM.heroHit,
] as const;

function toHeroCombatStyle(style: AttackStyle): HeroCombatStyle {
  return style;
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
  /** Extra hold time (ms) per frame index — sells impact weight (timing > frames). */
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
  createAnim(scene, ANIM.heroHit, heroKey, heroFrameOffset(combatStyle, 'hit'), 2, 10, 0, { 0: 70 });

  if (combatStyle === 'unarmed') {
    createAnim(scene, ANIM.heroPalmAttack1, heroKey, heroFrameOffset(combatStyle, 'palm1'), 3, 14, 0, {
      1: 90,
    });
    createAnim(scene, ANIM.heroPalmAttack2, heroKey, heroFrameOffset(combatStyle, 'palm2'), 3, 14, 0, {
      1: 85,
    });
    createAnim(scene, ANIM.heroPalmAttack3, heroKey, heroFrameOffset(combatStyle, 'palm3'), 4, 14, 0, {
      2: 120,
    });
    return;
  }

  createAnim(scene, ANIM.heroAttack1, heroKey, heroFrameOffset(combatStyle, 'attack1'), 4, 16, 0, {
    2: 120,
  });
  createAnim(scene, ANIM.heroAttack2, heroKey, heroFrameOffset(combatStyle, 'attack2'), 3, 16, 0, {
    1: 110,
  });
  createAnim(scene, ANIM.heroAttack3, heroKey, heroFrameOffset(combatStyle, 'attack3'), 4, 14, 0, {
    2: 150,
  });
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
    { idle: ANIM.slimeIdle, walk: ANIM.slimeWalk },
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
  animKeys: { idle: string; walk: string; attack?: string },
  variant: 'slime' | 'archer',
  attackHolds?: Record<number, number>,
): void {
  const frames = attack ? [...idle, ...walk, ...attack] : [...idle, ...walk];
  const canvas = buildSheetCanvas(frames, FRAME_W, FRAME_H, palette, NORMAL, variant);
  addSheetFromCanvas(scene, key, canvas, FRAME_W, FRAME_H);

  let offset = 0;
  createAnim(scene, animKeys.idle, key, offset, idle.length, variant === 'slime' ? 5 : 5);
  offset += idle.length;
  createAnim(scene, animKeys.walk, key, offset, walk.length, 10);
  offset += walk.length;
  if (attack && animKeys.attack) {
    createAnim(scene, animKeys.attack, key, offset, attack.length, 10, 0, attackHolds);
  }
}

function registerBossSheet(scene: Phaser.Scene): void {
  const key = 'enemy_totem';
  const frames = [...POSES_TOTEM_IDLE, ...POSES_TOTEM_ATTACK];
  const canvas = buildSheetCanvas(frames, FRAME_W, FRAME_H, PALETTE_TOTEM, NORMAL, 'boss');
  addSheetFromCanvas(scene, key, canvas, FRAME_W, FRAME_H);

  createAnim(scene, ANIM.totemIdle, key, 0, POSES_TOTEM_IDLE.length, 4);
  createAnim(scene, ANIM.totemAttack, key, POSES_TOTEM_IDLE.length, POSES_TOTEM_ATTACK.length, 9, 0, {
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

export function enemyAnimKeys(spriteKey: string): {
  idle: string;
  walk: string;
  attack?: string;
} {
  switch (spriteKey) {
    case 'enemy_slime':
      return { idle: ANIM.slimeIdle, walk: ANIM.slimeWalk };
    case 'enemy_archer':
      return { idle: ANIM.archerIdle, walk: ANIM.archerWalk, attack: ANIM.archerAttack };
    case 'enemy_totem':
      return { idle: ANIM.totemIdle, walk: ANIM.totemIdle, attack: ANIM.totemAttack };
    default:
      return { idle: ANIM.slimeIdle, walk: ANIM.slimeWalk };
  }
}

export function isBossSpriteKey(spriteKey: string): boolean {
  return spriteKey === 'enemy_totem';
}
