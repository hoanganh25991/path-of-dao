import type Phaser from 'phaser';
import type { Player } from '@/combat/entities/Player';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import type { SkillDefinition, SkillEffect } from '@/progression/SkillDefinition';
import { resolveSkillEffects } from '@/combat/skills/resolveSkillEffects';
import { VFXLibrary, playSkillCastVfx, playSkillImpactVfx, spawnProjectileTrail } from '@/combat/skills/VFXLibrary';
import { skillVfxPower } from '@/combat/skills/skillVfxPower';
import { buildMeleeArcShape } from '@/combat/combat/geometry';
import { scaledMeleeHalfArc } from '@/combat/combat/AoeScaling';

const SLASH_OFFSET_PX = 26;
const SLASH_HIT_MS = 80;
const COMBO_FINISHER_KNOCKBACK = 180;

export interface SkillBolt {
  img: Phaser.Physics.Arcade.Image;
  hitboxId: string;
  ttlMs: number;
  hitRadius: number;
  intent: SkillDefinition['intent'];
  power: number;
  trailMs: number;
  impacted: boolean;
}

export interface EffectRunnerContext {
  player: Player;
  hitboxes: HitboxManager;
  skill: SkillDefinition;
  amp: number;
  aoeScale: number;
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
  const { player, hitboxes, skill, amp, aoeScale } = ctx;
  const power = skillVfxPower(skill.id, amp);
  const baseHalfArc = (effect.halfAngleDeg * Math.PI) / 180 / 2;
  const halfArc = scaledMeleeHalfArc(baseHalfArc, aoeScale) * (amp > 1 ? 1.15 : 1);
  const reach = (effect.reach + effect.reachBonus) * amp * aoeScale;
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
    power,
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
  const { player, hitboxes, skill, amp, aoeScale, bolts } = ctx;
  const power = skillVfxPower(skill.id, amp);
  const { scene, sprite, facing } = player;
  const speed = effect.speed * (0.95 + power * 0.08);
  const rangePx = effect.rangePx * amp * aoeScale;
  const hitRadius = effect.hitRadius * amp * aoeScale;

  const bolt = VFXLibrary.intentProjectile(
    scene,
    sprite.x,
    sprite.y - sprite.displayHeight * 0.55,
    facing,
    skill.intent,
    power,
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

  bolts.push({
    img: bolt,
    hitboxId: hitbox.id,
    ttlMs: lifetimeMs,
    hitRadius,
    intent: skill.intent,
    power,
    trailMs: 0,
    impacted: false,
  });
}

export function runHeal(effect: Extract<SkillEffect, { type: 'heal' }>, ctx: EffectRunnerContext): void {
  const { player, skill, amp } = ctx;
  const power = skillVfxPower(skill.id, amp);
  const amount = Math.floor(player.stats.runtime.hpMax * Math.min(effect.healPct * amp, 1));
  player.heal(amount);
  VFXLibrary.healBloom(player.scene, player.sprite.x, player.sprite.y, skill.intent, power);
}

export function runPullField(effect: Extract<SkillEffect, { type: 'pull_field' }>, ctx: EffectRunnerContext): void {
  const { player, hitboxes, skill, amp, aoeScale } = ctx;
  VFXLibrary.voidCrack(player.scene, player.x, player.y, effect.radius * amp * aoeScale);

  hitboxes.spawn({
    ownerId: player.id,
    team: 'player',
    shape: {
      kind: 'circle',
      radius: effect.radius * amp * aoeScale,
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
  const { player, hitboxes, skill, amp, aoeScale } = ctx;
  const radius = effect.radius * amp * aoeScale;

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
    bolt.trailMs += dtMs;
    if (bolt.trailMs >= 45) {
      bolt.trailMs = 0;
      if (bolt.img.active) {
        spawnProjectileTrail(bolt.img.scene, bolt.img.x, bolt.img.y, bolt.intent, bolt.power);
      }
    }

    const hitbox = hitboxes.getHitbox(bolt.hitboxId);
    if (hitbox && hitbox.alreadyHit.size > 0 && !bolt.impacted) {
      bolt.impacted = true;
      playSkillImpactVfx(bolt.img.scene, bolt.img.x, bolt.img.y, bolt.intent, bolt.power);
    }

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
