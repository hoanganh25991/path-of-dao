import type Phaser from 'phaser';
import type { Player } from '@/combat/entities/Player';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import type { SkillDefinition, SkillEffect } from '@/progression/SkillDefinition';
import { resolveSkillEffects } from '@/combat/skills/resolveSkillEffects';
import {
  VFXLibrary,
  playSkillCastVfx,
  playSkillImpactVfx,
  playThunderChainLink,
  playVerticalThunderStrike,
  spawnProjectileTrail,
} from '@/combat/skills/VFXLibrary';
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
  getEnemyTargets?: () => HurtboxEntity[];
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

export function pickThunderChainTargets(
  player: Player,
  enemies: HurtboxEntity[],
  acquireRange: number,
  chainRadius: number,
  maxJumps: number,
): HurtboxEntity[] {
  const { facing, x: px, y: py } = player;
  const candidates = enemies.filter((enemy) => {
    const dx = enemy.x - px;
    const dy = enemy.y - py;
    if (Math.hypot(dx, dy) > acquireRange) return false;
    return dx * facing >= -24;
  });
  if (candidates.length === 0) return [];

  candidates.sort(
    (a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py),
  );

  const chain: HurtboxEntity[] = [candidates[0]!];
  const used = new Set([candidates[0]!.id]);

  while (chain.length < maxJumps) {
    const last = chain[chain.length - 1]!;
    let next: HurtboxEntity | null = null;
    let bestDist = Infinity;
    for (const enemy of candidates) {
      if (used.has(enemy.id)) continue;
      const dist = Math.hypot(enemy.x - last.x, enemy.y - last.y);
      if (dist <= chainRadius && dist < bestDist) {
        bestDist = dist;
        next = enemy;
      }
    }
    if (!next) break;
    chain.push(next);
    used.add(next.id);
  }

  return chain;
}

function pickThunderStrikePoint(
  player: Player,
  enemies: HurtboxEntity[],
  strikeRange: number,
): { x: number; y: number } {
  const { facing, x: px, y: py } = player;
  const inFront = enemies.filter((enemy) => {
    const dx = enemy.x - px;
    const dy = enemy.y - py;
    if (Math.hypot(dx, dy) > strikeRange) return false;
    return dx * facing >= -24;
  });
  if (inFront.length === 0) {
    return { x: px + facing * strikeRange, y: py };
  }
  inFront.sort(
    (a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py),
  );
  const target = inFront[0]!;
  return { x: target.x, y: target.y };
}

export function runThunderStrike(
  effect: Extract<SkillEffect, { type: 'thunder_strike' }>,
  ctx: EffectRunnerContext,
): void {
  const { player, hitboxes, skill, amp, aoeScale, getEnemyTargets } = ctx;
  const power = skillVfxPower(skill.id, amp);
  const range = effect.strikeRange * amp * aoeScale;
  const radius = effect.radius * amp * aoeScale;
  const enemies = getEnemyTargets?.() ?? [];
  const { x: strikeX, y: strikeY } = pickThunderStrikePoint(player, enemies, range);

  playVerticalThunderStrike(player.scene, strikeX, strikeY, effect.fallHeight, power);

  hitboxes.spawn({
    ownerId: player.id,
    team: 'player',
    shape: { kind: 'circle', radius, x: strikeX, y: strikeY },
    damage: damagePayload(ctx, effect.damage.skillMultiplier, effect.damage.damageType),
    lifetimeMs: 100,
    knockback: 120 * amp,
    pierce: Math.floor(4 * amp),
    insightIntent: skill.intent,
  });
}

export function runThunderChain(
  effect: Extract<SkillEffect, { type: 'thunder_chain' }>,
  ctx: EffectRunnerContext,
): void {
  const { player, hitboxes, skill, amp, aoeScale, getEnemyTargets } = ctx;
  const power = skillVfxPower(skill.id, amp);
  const enemies = getEnemyTargets?.() ?? [];
  const chain = pickThunderChainTargets(
    player,
    enemies,
    effect.acquireRange * amp * aoeScale,
    effect.chainRadius * amp * aoeScale,
    effect.maxJumps,
  );

  if (chain.length === 0) {
    runThunderStrike(
      {
        type: 'thunder_strike',
        strikeRange: effect.acquireRange * 0.65,
        fallHeight: 168,
        radius: 34,
        damage: effect.damage,
      },
      ctx,
    );
    return;
  }

  let fromX = player.x;
  let fromY = player.y - player.sprite.displayHeight * 0.45;
  let jumpMul = 1;

  for (const target of chain) {
    const toX = target.x;
    const toY = target.y - 12;
    playThunderChainLink(player.scene, fromX, fromY, toX, toY, power);
    playVerticalThunderStrike(player.scene, toX, toY, 120 + power * 12, power * 0.85);

    hitboxes.spawn({
      ownerId: player.id,
      team: 'player',
      shape: {
        kind: 'circle',
        radius: 28 * amp * aoeScale,
        x: toX,
        y: toY,
      },
      damage: damagePayload(
        ctx,
        effect.damage.skillMultiplier * jumpMul,
        effect.damage.damageType,
      ),
      lifetimeMs: 90,
      knockback: 100 * amp,
      pierce: 1,
      insightIntent: skill.intent,
    });

    fromX = toX;
    fromY = toY;
    jumpMul *= effect.jumpDamageFalloff;
  }

  player.scene.cameras.main.shake(100, 0.006 + power * 0.002);
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
    case 'thunder_strike':
      runThunderStrike(effect, ctx);
      break;
    case 'thunder_chain':
      runThunderChain(effect, ctx);
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
