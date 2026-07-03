import type Phaser from 'phaser';
import { gameStore } from '@/core/store/gameStore';
import { EventBus } from '@/core/EventBus';
import { ATTACK_STEP_MULTIPLIERS, MAX_COMBO_STEP } from '@/combat/state/PlayerStateMachine';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import type { Player } from '@/combat/entities/Player';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import {
  recordSkillInsight,
} from '@/progression/InsightSystem';
import { getSkillDefinition, resolveEffectiveSkillId } from '@/progression/SkillLoader';
import type { SkillDefinition } from '@/progression/SkillDefinition';

export const SKILL_MANA_COST = 20;
const SLASH_VISIBLE_MS = 100;
const SLASH_OFFSET_PX = 26;
/** Arc reach per combo step (sub-plan 07 §5). */
const SLASH_REACH_PX = [40, 45, 60] as const;
const SLASH_TEXTURE_SIZE = 64;
const SLASH_HIT_MS = 80;
const SLASH_HALF_ARC = Math.PI / 3;
const COMBO_FINISHER_KNOCKBACK = 180;

const BOLT_SPEED_PX_PER_SEC = 420;
const BOLT_RANGE_PX = 400;
const BOLT_HIT_RADIUS = 12;
const SKILL_ARC_REACH = 52;

interface SkillBolt {
  img: Phaser.Physics.Arcade.Image;
  hitboxId: string;
  ttlMs: number;
}

/** Attack combo + primary equipped skill (arc / bolt / heal). */
export class CombatComponent {
  /** Multiplier of the attack in progress — consumed by hit resolution. */
  currentMultiplier = 0;
  private bolts: SkillBolt[] = [];

  constructor(
    private readonly player: Player,
    private readonly hitboxes: HitboxManager,
  ) {}

  tryAttack(): boolean {
    const step = this.player.sm.tryAttack();
    if (step === null) return false;

    this.currentMultiplier = ATTACK_STEP_MULTIPLIERS[step - 1] ?? 1;
    this.player.body.setVelocity(0, 0);
    this.spawnSlash(step);
    this.spawnSlashHitbox(step);
    return true;
  }

  /** Primary equipped skill — arc, bolt, or heal depending on skill data. */
  trySkill(): boolean {
    if (!this.player.sm.canAct) return false;

    const save = gameStore.getState().save;
    if (!save) return false;

    const skillId = resolveEffectiveSkillId(save.equippedSkills.primary, save.insights);
    const skill = getSkillDefinition(skillId);
    const manaCost = skill.manaCost;

    if (!this.player.stats.spendMana(manaCost)) return false;

    this.player.emitStatsChanged();
    this.executeSkill(skill);

    const { patch, emitReady } = recordSkillInsight(save, skillId);
    gameStore.getState().patch(patch);
    if (emitReady) {
      EventBus.emit('insight:ready-to-awaken', { intentId: skill.intent });
    }

    return true;
  }

  update(dtMs: number): void {
    this.bolts = this.bolts.filter((bolt) => {
      bolt.ttlMs -= dtMs;
      if (bolt.ttlMs <= 0 || !bolt.img.active) {
        bolt.img.destroy();
        return false;
      }
      this.hitboxes.setHitboxShape(bolt.hitboxId, {
        kind: 'circle',
        radius: BOLT_HIT_RADIUS,
        x: bolt.img.x,
        y: bolt.img.y,
      });
      return true;
    });
  }

  private executeSkill(skill: SkillDefinition): void {
    switch (skill.kind) {
      case 'arc':
        this.spawnSkillArc(skill);
        break;
      case 'bolt':
        this.spawnBolt(skill);
        break;
      case 'heal':
        this.castHeal(skill);
        break;
    }
  }

  private spawnSkillArc(skill: SkillDefinition): void {
    const overrides = skill.awakenedOverrides;
    const halfArc = overrides?.arcHalfAngle ?? SLASH_HALF_ARC;
    const reach = SKILL_ARC_REACH + (overrides?.arcReachBonus ?? 0);

    this.spawnSlashVisual(reach);
    this.spawnArcHitbox(reach, halfArc, skill.skillMultiplier, skill.intent);
  }

  private spawnArcHitbox(
    reach: number,
    halfArc: number,
    multiplier: number,
    intent: SkillDefinition['intent'],
  ): void {
    const { facing } = this.player;
    const cx = this.player.x + facing * SLASH_OFFSET_PX;
    const cy = this.player.y;
    const startAngle = facing > 0 ? -halfArc : Math.PI - halfArc;
    const endAngle = facing > 0 ? halfArc : Math.PI + halfArc;

    this.hitboxes.spawn({
      ownerId: this.player.id,
      team: 'player',
      shape: { kind: 'arc', radius: reach + 12, startAngle, endAngle, x: cx, y: cy },
      damage: {
        attacker: this.player.stats.resolved,
        skillMultiplier: multiplier,
        damageType: 'physical',
        attackerRealmOrder: this.player.attackerRealmOrder,
        defenderRecommendedRealmOrder: this.player.mapRecommendedRealmOrder,
      },
      lifetimeMs: SLASH_HIT_MS,
      knockback: COMBO_FINISHER_KNOCKBACK,
      pierce: 8,
      insightIntent: intent,
    });
  }

  private spawnSlashVisual(reach: number): void {
    const { scene, sprite, facing } = this.player;
    const scale = reach / SLASH_TEXTURE_SIZE;

    const slash = scene.add
      .image(sprite.x + facing * SLASH_OFFSET_PX, sprite.y - sprite.displayHeight * 0.45, TEXTURE_KEYS.slash)
      .setFlipX(facing < 0)
      .setScale(scale * 1.1)
      .setDepth(sprite.depth + 1);

    scene.time.delayedCall(SLASH_VISIBLE_MS, () => slash.destroy());
  }

  private spawnSlashHitbox(step: number): void {
    const { facing } = this.player;
    const reach = SLASH_REACH_PX[step - 1] ?? 40;
    const cx = this.player.x + facing * SLASH_OFFSET_PX;
    const cy = this.player.y;
    const startAngle = facing > 0 ? -SLASH_HALF_ARC : Math.PI - SLASH_HALF_ARC;
    const endAngle = facing > 0 ? SLASH_HALF_ARC : Math.PI + SLASH_HALF_ARC;

    this.hitboxes.spawn({
      ownerId: this.player.id,
      team: 'player',
      shape: { kind: 'arc', radius: reach + 12, startAngle, endAngle, x: cx, y: cy },
      damage: {
        attacker: this.player.stats.resolved,
        skillMultiplier: this.currentMultiplier,
        damageType: 'physical',
        attackerRealmOrder: this.player.attackerRealmOrder,
        defenderRecommendedRealmOrder: this.player.mapRecommendedRealmOrder,
      },
      lifetimeMs: SLASH_HIT_MS,
      knockback: step === MAX_COMBO_STEP ? COMBO_FINISHER_KNOCKBACK : undefined,
      pierce: 8,
    });
  }

  private spawnSlash(step: number): void {
    const { scene, sprite, facing } = this.player;
    const scale = (SLASH_REACH_PX[step - 1] ?? 40) / SLASH_TEXTURE_SIZE;

    const slash = scene.add
      .image(sprite.x + facing * SLASH_OFFSET_PX, sprite.y - sprite.displayHeight * 0.45, TEXTURE_KEYS.slash)
      .setFlipX(facing < 0)
      .setScale(scale)
      .setDepth(sprite.depth + 1);

    scene.time.delayedCall(SLASH_VISIBLE_MS, () => slash.destroy());
  }

  private spawnBolt(skill: SkillDefinition): void {
    const { scene, sprite, facing } = this.player;
    const pullForce = skill.awakenedOverrides?.pullForce;

    const bolt = scene.physics.add
      .image(sprite.x + facing * 20, sprite.y - sprite.displayHeight * 0.55, TEXTURE_KEYS.bolt)
      .setFlipX(facing < 0)
      .setDepth(sprite.depth + 1);
    bolt.setVelocity(facing * BOLT_SPEED_PX_PER_SEC, 0);

    const lifetimeMs = (BOLT_RANGE_PX / BOLT_SPEED_PX_PER_SEC) * 1000;
    const hitbox = this.hitboxes.spawn({
      ownerId: this.player.id,
      team: 'player',
      shape: { kind: 'circle', radius: BOLT_HIT_RADIUS, x: bolt.x, y: bolt.y },
      damage: {
        attacker: this.player.stats.resolved,
        skillMultiplier: skill.skillMultiplier,
        damageType: 'spirit',
        attackerRealmOrder: this.player.attackerRealmOrder,
        defenderRecommendedRealmOrder: this.player.mapRecommendedRealmOrder,
      },
      lifetimeMs,
      pierce: 6,
      pullForce,
      insightIntent: skill.intent,
    });

    this.bolts.push({ img: bolt, hitboxId: hitbox.id, ttlMs: lifetimeMs });
  }

  private castHeal(skill: SkillDefinition): void {
    const pct = skill.awakenedOverrides?.healPct ?? 0.1;
    const amount = Math.floor(this.player.stats.runtime.hpMax * pct);
    this.player.heal(amount);
  }
}

/** @internal Dev helper — max insight XP + uses for awakening tests. */
export function devPrepareAwakening(intentId: string): void {
  const store = gameStore.getState();
  const save = store.save;
  if (!save) return;

  store.patch({
    insights: {
      ...save.insights,
      [intentId]: { xp: 200, awakened: false, totalUses: 50 },
    },
    realm: { id: 'foundation_establishment', tier: 'early', breakthroughReady: false },
    stats: { ...save.stats, level: 12 },
  });
}
