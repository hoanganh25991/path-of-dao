import { STRIKE_POSES } from '@/combat/art/stickyManStrikes';
import {
  applyWeaponProp,
  drawStickyFrame,
  NORMAL,
  POSES_ARCHER_ATTACK,
  POSES_ARCHER_IDLE,
  POSES_ATTACK_1_SMOOTH,
  POSES_ATTACK_3_SMOOTH,
  POSES_IDLE,
  POSES_SIT,
  POSES_SLIME_IDLE,
  POSES_TOTEM_IDLE,
  POSES_WALK,
} from '@/combat/art/stickyManDraw';
import {
  FRAME_H,
  FRAME_W,
  PALETTE_ARCHER,
  PALETTE_HERO,
  PALETTE_SLIME,
  PALETTE_TOTEM,
} from '@/combat/art/stickyManPalette';

const SCALE = 3;
const PAD = 12;
const LABEL_H = 14;

import type { StickPalette, StickPose } from '@/combat/art/stickyManPalette';

interface ReviewRow {
  label: string;
  frames: StickPose[];
  palette: StickPalette;
  variant: 'hero' | 'slime' | 'archer' | 'boss';
}

const ROWS: ReviewRow[] = [
  { label: 'Hero idle', frames: POSES_IDLE, palette: PALETTE_HERO, variant: 'hero' },
  { label: 'Hero walk', frames: POSES_WALK, palette: PALETTE_HERO, variant: 'hero' },
  { label: 'Hero sit (meditate)', frames: POSES_SIT, palette: PALETTE_HERO, variant: 'hero' },
  { label: 'Jab (smooth)', frames: STRIKE_POSES.jab, palette: PALETTE_HERO, variant: 'hero' },
  { label: 'Front kick (smooth)', frames: STRIKE_POSES.frontKick, palette: PALETTE_HERO, variant: 'hero' },
  { label: 'Heavy haymaker', frames: STRIKE_POSES.heavyHaymaker, palette: PALETTE_HERO, variant: 'hero' },
  { label: 'Heavy kick', frames: STRIKE_POSES.heavyKick, palette: PALETTE_HERO, variant: 'hero' },
  { label: 'Sword attack (smooth)', frames: applyWeaponProp(POSES_ATTACK_1_SMOOTH, 'sword'), palette: PALETTE_HERO, variant: 'hero' },
  { label: 'Sword finisher', frames: applyWeaponProp(POSES_ATTACK_3_SMOOTH, 'sword'), palette: PALETTE_HERO, variant: 'hero' },
  { label: 'Slime idle', frames: POSES_SLIME_IDLE, palette: PALETTE_SLIME, variant: 'slime' },
  { label: 'Archer idle', frames: POSES_ARCHER_IDLE, palette: PALETTE_ARCHER, variant: 'archer' },
  { label: 'Archer attack', frames: POSES_ARCHER_ATTACK, palette: PALETTE_ARCHER, variant: 'archer' },
  { label: 'Totem boss idle', frames: POSES_TOTEM_IDLE, palette: PALETTE_TOTEM, variant: 'boss' },
];

function renderReview(): void {
  const maxFrames = Math.max(...ROWS.map((r) => r.frames.length));
  const rowW = maxFrames * FRAME_W * SCALE + PAD * 2;
  const rowH = FRAME_H * SCALE + LABEL_H + PAD * 2;
  const out = document.getElementById('review') as HTMLCanvasElement;
  out.width = rowW;
  out.height = rowH * ROWS.length;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, out.width, out.height);

  ROWS.forEach((row, ri) => {
    const y0 = ri * rowH + PAD;
    ctx.fillStyle = '#8ecae6';
    ctx.font = '11px monospace';
    ctx.fillText(row.label, PAD, y0 - 4);

    row.frames.forEach((pose, fi) => {
      const cell = document.createElement('canvas');
      cell.width = FRAME_W;
      cell.height = FRAME_H;
      drawStickyFrame(cell.getContext('2d')!, FRAME_W, FRAME_H, row.palette, pose, NORMAL, row.variant);
      const x = PAD + fi * FRAME_W * SCALE;
      ctx.drawImage(cell, x, y0, FRAME_W * SCALE, FRAME_H * SCALE);
    });
  });
}

renderReview();
