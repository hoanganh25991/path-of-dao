import type Phaser from 'phaser';
import type { Player } from '@/combat/entities/Player';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import type { SkillDefinition, SkillEffect } from '@/progression/SkillDefinition';
import { resolveSkillEffects } from '@/combat/skills/resolveSkillEffects';
import { VFXLibrary, playSkillCastVfx } from '@/combat/skills/VFXLibrary';
import { buildMeleeArcShape } from '@/combat/combat/geometry';

const SLASH_OFFSET_PX = 26;
const SLASH_HIT_MS = 80;
const COMBO_FINISHER_KNOCKBACK = 180;

export interface SkillBolt {
  img: Phaser.Physics.Arcade.Image;
  hitboxId: string;
  ttlMs: number;
  hitRadius: number;
}

export interface EffectRunnerContext {
  player: Player;
  hitboxes: HitboxManager;
  skill: SkillDefinition;
  amp: number;
  bolts: SkillBolt[];
}

function damagePayload(ctx: EffectRunnerContext, multiplier: number, damageType: 'physical' | 'spirit') {
  const { player } = ctx;
  return {
    attacker: player.stats.resolved,
    skillMultiplier: multiplier * ctx.amp,
    damageType,
    attackerRealmOrder: player.attackerRealmOrder,
    defenderRecommendedRealmOrder: player.mapRecommendedRealmOrder,
  };
}

export function runMeleeArc(effect: Extract<SkillEffect, { type: 'melee_arc' }>, ctx: EffectRunnerContext): void {
  const { player, hitboxes, skill, amp } = ctx;
  const halfArc = ((effect.halfAngleDeg * Math.PI) / 180 / 2) * (amp > 1 ? 1.35 : 1);
  const reach = (effect.reach + effect.reachBonus) * amp;
  const { facing } = player;
  const vfxCx = player.x + facing * SLASH_OFFSET_PX;
  const vfxCy = player.y;

  VFXLibrary.slashArc(
    player.scene,
    vfxCx,
    vfxCy - player.sprite.displayHeight * 0.45,
    facing,
    reach,
    skill.intent,
    amp,
  );

  hitboxes.spawn({
    ownerId: player.id,
    team: 'player',
    shape: buildMeleeArcShape(player.x, player.y, facing, reach, halfArc, SLASH_OFFSET_PX),
    damage: damagePayload(ctx, effect.damage.skillMultiplier, effect.damage.damageType),
    lifetimeMs: SLASH_HIT_MS,
    knockback: COMBO_FINISHER_KNOCKBACK * amp,
    pierce: Math.floor(8 * amp),
    insightIntent: skill.intent,
  });
}

export function runProjectile(effect: Extract<SkillEffect, { type: 'projectile' }>, ctx: EffectRunnerContext): void {
  const { player, hitboxes, skill, amp, bolts } = ctx;
  const { scene, sprite, facing } = player;
  const speed = effect.speed * amp;
  const rangePx = effect.rangePx * amp;
  const hitRadius = effect.hitRadius * amp;

  const bolt = VFXLibrary.spiritBolt(
    scene,
    sprite.x,
    sprite.y - sprite.displayHeight * 0.55,
    facing,
    skill.intent,
    amp,
  );
  bolt.setVelocity(facing * speed, 0);

  const lifetimeMs = (rangePx / speed) * 1000;
  const pullForce = effect.pullForce ?? skill.awakenedOverrides?.pullForce;

  const hitbox = hitboxes.spawn({
    ownerId: player.id,
    team: 'player',
    shape: { kind: 'circle', radius: hitRadius, x: bolt.x, y: bolt.y },
    damage: damagePayload(ctx, effect.damage.skillMultiplier, effect.damage.damageType),
    lifetimeMs,
    pierce: Math.floor(6 * amp),
    pullForce: pullForce ? pullForce * amp : undefined,
    insightIntent: skill.intent,
  });

  bolts.push({ img: bolt, hitboxId: hitbox.id, ttlMs: lifetimeMs, hitRadius });
}

export function runHeal(effect: Extract<SkillEffect, { type: 'heal' }>, ctx: EffectRunnerContext): void {
  const { player, skill, amp } = ctx;
  const amount = Math.floor(player.stats.runtime.hpMax * Math.min(effect.healPct * amp, 1));
  player.heal(amount);
  VFXLibrary.healBloom(player.scene, player.sprite.x, player.sprite.y, skill.intent);
}

export function runPullField(effect: Extract<SkillEffect, { type: 'pull_field' }>, ctx: EffectRunnerContext): void {
  const { player, hitboxes, skill, amp } = ctx;
  VFXLibrary.voidCrack(player.scene, player.x, player.y, effect.radius * amp);

  hitboxes.spawn({
    ownerId: player.id,
    team: 'player',
    shape: {
      kind: 'circle',
      radius: effect.radius * amp,
      x: player.x,
      y: player.y,
    },
    damage: damagePayload(ctx, 0.01, 'spirit'),
    lifetimeMs: effect.durationMs,
    pullForce: effect.pullStrength * amp,
    pierce: Math.floor(12 * amp),
    insightIntent: skill.intent,
  });
}

export function runAoeCircle(effect: Extract<SkillEffect, { type: 'aoe_circle' }>, ctx: EffectRunnerContext): void {
  const { player, hitboxes, skill, amp } = ctx;
  const radius = effect.radius * amp;

  const spawnTick = (delayMs: number): void => {
    player.scene.time.delayedCall(delayMs, () => {
      VFXLibrary.flamePetal(player.scene, player.x, player.y, radius);
      hitboxes.spawn({
        ownerId: player.id,
        team: 'player',
        shape: { kind: 'circle', radius, x: player.x, y: player.y },
        damage: damagePayload(ctx, effect.damage.skillMultiplier, effect.damage.damageType),
        lifetimeMs: 120,
        pierce: Math.floor(10 * amp),
        insightIntent: skill.intent,
      });
    });
  };

  for (let tick = 0; tick < effect.ticks; tick += 1) {
    spawnTick(tick * effect.tickIntervalMs);
  }
}

export function runSkillEffect(effect: SkillEffect, ctx: EffectRunnerContext): void {
  switch (effect.type) {
    case 'melee_arc':
      runMeleeArc(effect, ctx);
      break;
    case 'projectile':
      runProjectile(effect, ctx);
      break;
    case 'heal':
      runHeal(effect, ctx);
      break;
    case 'pull_field':
      runPullField(effect, ctx);
      break;
    case 'aoe_circle':
      runAoeCircle(effect, ctx);
      break;
  }
}

export function tickSkillBolts(bolts: SkillBolt[], hitboxes: HitboxManager, dtMs: number): SkillBolt[] {
  return bolts.filter((bolt) => {
    bolt.ttlMs -= dtMs;
    if (bolt.ttlMs <= 0 || !bolt.img.active) {
      bolt.img.destroy();
      return false;
    }
    hitboxes.setHitboxShape(bolt.hitboxId, {
      kind: 'circle',
      radius: bolt.hitRadius,
      x: bolt.img.x,
      y: bolt.img.y,
    });
    return true;
  });
}

export function executeSkillEffects(ctx: EffectRunnerContext): void {
  const { player, skill, amp } = ctx;
  playSkillCastVfx(player.scene, skill, player.x, player.y - 16, amp);
  for (const effect of resolveSkillEffects(skill)) {
    runSkillEffect(effect, ctx);
  }
}
