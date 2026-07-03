import type Phaser from 'phaser';
import {
  buildHeroFrames,
  buildSheetCanvas,
  heroFrameOffset,
  NORMAL,
} from '@/combat/art/stickyManDraw';
import {
  applyStickyManSprite,
  ANIM,
  configureStickyManBody,
} from '@/combat/art/stickyManAssets';
import type { StickPalette } from '@/combat/art/stickyManPalette';
import { FRAME_H, FRAME_W } from '@/combat/art/stickyManPalette';
import type { AncientProfile } from '@/shared/schemas/ancient-demo';

const ANCIENT_PALETTES: Record<string, StickPalette> = {
  void: {
    outline: '#080810',
    skin: '#d8c8ff',
    fill: '#2a1848',
    shadow: '#120820',
    accent: '#8040ff',
    highlight: '#c0a0ff',
  },
  sword: {
    outline: '#101828',
    skin: '#ffe8c8',
    fill: '#4a6088',
    shadow: '#283850',
    accent: '#c0d8ff',
    highlight: '#ffffff',
  },
  flame: {
    outline: '#200808',
    skin: '#ffd0a0',
    fill: '#a83018',
    shadow: '#601808',
    accent: '#ffb040',
    highlight: '#ffe880',
  },
  fortune: {
    outline: '#102018',
    skin: '#ffe8b8',
    fill: '#287850',
    shadow: '#184830',
    accent: '#e8c040',
    highlight: '#fff0c0',
  },
  jade: {
    outline: '#081818',
    skin: '#ffd5a8',
    fill: '#208868',
    shadow: '#105040',
    accent: '#90ffe0',
    highlight: '#e8fff8',
  },
  insight: {
    outline: '#180828',
    skin: '#f0d0ff',
    fill: '#5838a0',
    shadow: '#301860',
    accent: '#ffd060',
    highlight: '#ffffff',
  },
};

export interface AncientCombatFx {
  aura: Phaser.GameObjects.Arc;
  nameTag: Phaser.GameObjects.Text;
  titleTag: Phaser.GameObjects.Text;
}

function textureKeyForAncient(ancientId: string): string {
  return `player_ancient_${ancientId}`;
}

function paletteForProfile(profile: AncientProfile): StickPalette {
  return ANCIENT_PALETTES[profile.visualTheme] ?? ANCIENT_PALETTES.jade!;
}

function registerAncientHeroTexture(scene: Phaser.Scene, profile: AncientProfile): string {
  const key = textureKeyForAncient(profile.id);
  if (scene.textures.exists(key)) return key;

  const palette = paletteForProfile(profile);
  const canvas = buildSheetCanvas(
    buildHeroFrames(),
    FRAME_W,
    FRAME_H,
    palette,
    NORMAL,
    'hero',
  );
  scene.textures.addCanvas(key, canvas);
  const texture = scene.textures.get(key);
  const count = Math.floor(canvas.width / FRAME_W);
  for (let i = 0; i < count; i++) {
    texture.add(i, 0, i * FRAME_W, 0, FRAME_W, FRAME_H);
  }

  const heroKey = key;
  if (!scene.anims.exists(`${heroKey}_idle`)) {
    scene.anims.create({
      key: `${heroKey}_idle`,
      frames: scene.anims.generateFrameNumbers(heroKey, {
        start: heroFrameOffset('idle'),
        end: heroFrameOffset('idle') + 3,
      }),
      frameRate: 6,
      repeat: -1,
    });
    scene.anims.create({
      key: `${heroKey}_walk`,
      frames: scene.anims.generateFrameNumbers(heroKey, {
        start: heroFrameOffset('walk'),
        end: heroFrameOffset('walk') + 3,
      }),
      frameRate: 12,
      repeat: -1,
    });
    scene.anims.create({
      key: `${heroKey}_attack_1`,
      frames: scene.anims.generateFrameNumbers(heroKey, {
        start: heroFrameOffset('attack1'),
        end: heroFrameOffset('attack1') + 2,
      }),
      frameRate: 14,
      repeat: 0,
    });
    scene.anims.create({
      key: `${heroKey}_attack_2`,
      frames: scene.anims.generateFrameNumbers(heroKey, {
        start: heroFrameOffset('attack2'),
        end: heroFrameOffset('attack2') + 2,
      }),
      frameRate: 14,
      repeat: 0,
    });
    scene.anims.create({
      key: `${heroKey}_attack_3`,
      frames: scene.anims.generateFrameNumbers(heroKey, {
        start: heroFrameOffset('attack3'),
        end: heroFrameOffset('attack3') + 3,
      }),
      frameRate: 12,
      repeat: 0,
    });
    scene.anims.create({
      key: `${heroKey}_hit`,
      frames: scene.anims.generateFrameNumbers(heroKey, {
        start: heroFrameOffset('hit'),
        end: heroFrameOffset('hit') + 1,
      }),
      frameRate: 10,
      repeat: 0,
    });
  }

  return key;
}

export function ancientAnimKeys(ancientId: string): {
  idle: string;
  walk: string;
  attack1: string;
  attack2: string;
  attack3: string;
  hit: string;
} {
  const prefix = `player_ancient_${ancientId}`;
  return {
    idle: `${prefix}_idle`,
    walk: `${prefix}_walk`,
    attack1: `${prefix}_attack_1`,
    attack2: `${prefix}_attack_2`,
    attack3: `${prefix}_attack_3`,
    hit: `${prefix}_hit`,
  };
}

/** Swap hero sprite to ancient palette + aura ring + floating name. */
export function applyAncientHeroVisual(
  scene: Phaser.Scene,
  sprite: Phaser.Physics.Arcade.Sprite,
  profile: AncientProfile,
  name: string,
  epithet: string,
): AncientCombatFx {
  const textureKey = registerAncientHeroTexture(scene, profile);
  sprite.setTexture(textureKey);
  applyStickyManSprite(sprite);
  sprite.play(ancientAnimKeys(profile.id).idle);

  const accent = parseInt(paletteForProfile(profile).accent.replace('#', ''), 16);

  const aura = scene.add.circle(sprite.x, sprite.y, 28, accent, 0.22);
  aura.setDepth(sprite.depth - 1);
  scene.tweens.add({
    targets: aura,
    scale: { from: 0.92, to: 1.12 },
    alpha: { from: 0.14, to: 0.32 },
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  const nameTag = scene.add
    .text(sprite.x, sprite.y - 58, name, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f0e8d0',
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setOrigin(0.5, 1)
    .setDepth(sprite.depth + 2);

  const titleTag = scene.add
    .text(sprite.x, sprite.y - 44, epithet, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '9px',
      color: '#2dd4a8',
      stroke: '#000000',
      strokeThickness: 2,
    })
    .setOrigin(0.5, 1)
    .setDepth(sprite.depth + 2);

  return { aura, nameTag, titleTag };
}

export function tickAncientCombatFx(
  fx: AncientCombatFx,
  x: number,
  y: number,
): void {
  fx.aura.setPosition(x, y - 24);
  fx.nameTag.setPosition(x, y - 58);
  fx.titleTag.setPosition(x, y - 44);
}

/** Map ancient anim keys onto standard hero anim controller keys when needed. */
export function mapAncientToHeroAnim(ancientId: string, heroAnim: string): string {
  const keys = ancientAnimKeys(ancientId);
  switch (heroAnim) {
    case ANIM.heroIdle:
      return keys.idle;
    case ANIM.heroWalk:
      return keys.walk;
    case ANIM.heroAttack1:
      return keys.attack1;
    case ANIM.heroAttack2:
      return keys.attack2;
    case ANIM.heroAttack3:
      return keys.attack3;
    case ANIM.heroHit:
      return keys.hit;
    default:
      return keys.idle;
  }
}
