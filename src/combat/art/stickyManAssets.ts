import type Phaser from 'phaser';
import {
  BOSS_FRAME_H,
  BOSS_FRAME_W,
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
  POSES_ARCHER_ATTACK,
  POSES_ARCHER_IDLE,
  POSES_ARCHER_WALK,
  POSES_SLIME_IDLE,
  POSES_SLIME_WALK,
  POSES_TOTEM_ATTACK,
  POSES_TOTEM_IDLE,
} from '@/combat/art/stickyManDraw';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';

export const ANIM = {
  heroIdle: 'hero_sticky_idle',
  heroWalk: 'hero_sticky_walk',
  heroAttack1: 'hero_sticky_attack_1',
  heroAttack2: 'hero_sticky_attack_2',
  heroAttack3: 'hero_sticky_attack_3',
  heroHit: 'hero_sticky_hit',
  slimeIdle: 'enemy_slime_idle',
  slimeWalk: 'enemy_slime_walk',
  archerIdle: 'enemy_archer_idle',
  archerWalk: 'enemy_archer_walk',
  archerAttack: 'enemy_archer_attack',
  totemIdle: 'enemy_totem_idle',
  totemAttack: 'enemy_totem_attack',
} as const;

function addSheetFromCanvas(
  scene: Phaser.Scene,
  key: string,
  canvas: HTMLCanvasElement,
  fw: number,
  fh: number,
): void {
  if (scene.textures.exists(key)) return;
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
): void {
  if (scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(texture, { start, end: start + count - 1 }),
    frameRate,
    repeat,
  });
}

/** Register sticky-man spritesheets + Phaser animations (BootScene). */
export function registerStickyManAssets(scene: Phaser.Scene): void {
  const heroKey = TEXTURE_KEYS.player;
  const heroCanvas = buildSheetCanvas(buildHeroFrames(), FRAME_W, FRAME_H, PALETTE_HERO);
  addSheetFromCanvas(scene, heroKey, heroCanvas, FRAME_W, FRAME_H);

  createAnim(scene, ANIM.heroIdle, heroKey, heroFrameOffset('idle'), 4, 6);
  createAnim(scene, ANIM.heroWalk, heroKey, heroFrameOffset('walk'), 6, 10);
  createAnim(scene, ANIM.heroAttack1, heroKey, heroFrameOffset('attack1'), 3, 14, 0);
  createAnim(scene, ANIM.heroAttack2, heroKey, heroFrameOffset('attack2'), 3, 14, 0);
  createAnim(scene, ANIM.heroAttack3, heroKey, heroFrameOffset('attack3'), 4, 12, 0);
  createAnim(scene, ANIM.heroHit, heroKey, heroFrameOffset('hit'), 2, 10, 0);

  registerEnemySheet(scene, 'enemy_slime', PALETTE_SLIME, POSES_SLIME_IDLE, POSES_SLIME_WALK, null, {
    idle: ANIM.slimeIdle,
    walk: ANIM.slimeWalk,
  });

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
): void {
  const frames = attack ? [...idle, ...walk, ...attack] : [...idle, ...walk];
  const canvas = buildSheetCanvas(frames, FRAME_W, FRAME_H, palette);
  addSheetFromCanvas(scene, key, canvas, FRAME_W, FRAME_H);

  let offset = 0;
  createAnim(scene, animKeys.idle, key, offset, idle.length, 5);
  offset += idle.length;
  createAnim(scene, animKeys.walk, key, offset, walk.length, 8);
  offset += walk.length;
  if (attack && animKeys.attack) {
    createAnim(scene, animKeys.attack, key, offset, attack.length, 10, 0);
  }
}

function registerBossSheet(scene: Phaser.Scene): void {
  const key = 'enemy_totem';
  const frames = [...POSES_TOTEM_IDLE, ...POSES_TOTEM_ATTACK];
  const canvas = buildSheetCanvas(frames, BOSS_FRAME_W, BOSS_FRAME_H, PALETTE_TOTEM);
  addSheetFromCanvas(scene, key, canvas, BOSS_FRAME_W, BOSS_FRAME_H);

  createAnim(scene, ANIM.totemIdle, key, 0, POSES_TOTEM_IDLE.length, 4);
  createAnim(scene, ANIM.totemAttack, key, POSES_TOTEM_IDLE.length, POSES_TOTEM_ATTACK.length, 8, 0);
}

/** Scale + origin for sticky-man sprites (feet at bottom center). */
export function applyStickyManSprite(sprite: Phaser.Physics.Arcade.Sprite, isBoss = false): void {
  sprite.setOrigin(0.5, 1);
  sprite.setScale(isBoss ? DISPLAY_SCALE * 1.15 : DISPLAY_SCALE);
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
