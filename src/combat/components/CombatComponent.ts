import type Phaser from 'phaser';
import { gameStore } from '@/core/store/gameStore';
import { EventBus } from '@/core/EventBus';
import { ATTACK_STEP_MULTIPLIERS, MAX_COMBO_STEP } from '@/combat/state/PlayerStateMachine';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import type { Player } from '@/combat/entities/Player';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import { recordSkillInsight } from '@/progression/InsightSystem';
import { getSkillDefinition, resolveEffectiveSkillId } from '@/progression/SkillLoader';
import type { SkillDefinition } from '@/progression/SkillDefinition';
import type { SkillSlot } from '@/core/input/InputState';
import {
  createEmptyCooldowns,
  getSkillCooldownMs,
  tickCooldowns,
  type SkillSlotCooldowns,
} from '@/progression/SkillCooldown';
import { burstAncientSkill, getAncientSkillAmp } from '@/combat/vfx/AncientSkillVfx';

export interface SkillCooldownSnapshot {
  remainingMs: number;
  totalMs: number;
}

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

/** Attack combo + three equipped skill slots (arc / bolt / heal). */
export class CombatComponent {
  /** Multiplier of the attack in progress — consumed by hit resolution. */
  currentMultiplier = 0;
  private bolts: SkillBolt[] = [];
  private readonly cooldowns: SkillSlotCooldowns = createEmptyCooldowns();
  private readonly cooldownTotals: SkillSlotCooldowns = createEmptyCooldowns();

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

  /** Equipped skill by slot — arc, bolt, or heal depending on skill data. */
  trySkill(slot: SkillSlot): boolean {
    if (!this.player.sm.canAct) return false;
    if (this.cooldowns[slot] > 0) return false;

    const save = gameStore.getState().save;
    if (!save) return false;

    const skillId = resolveEffectiveSkillId(save.equippedSkills[slot], save.insights);
    const skill = getSkillDefinition(skillId);
    const manaCost = skill.manaCost;

    if (!this.player.stats.spendMana(manaCost)) return false;

    const cdMs = getSkillCooldownMs(skill, this.player.stats.isGodMode);
    this.cooldowns[slot] = cdMs;
    this.cooldownTotals[slot] = cdMs;

    this.player.emitStatsChanged();
    this.executeSkill(skill);

    const { patch, emitReady } = recordSkillInsight(save, skillId);
    gameStore.getState().patch(patch);
    if (emitReady) {
      EventBus.emit('insight:ready-to-awaken', { intentId: skill.intent });
    }

    return true;
  }

  getCooldownSnapshot(): Record<SkillSlot, SkillCooldownSnapshot> {
    return {
      primary: { remainingMs: this.cooldowns.primary, totalMs: this.cooldownTotals.primary },
      secondary: { remainingMs: this.cooldowns.secondary, totalMs: this.cooldownTotals.secondary },
      ultimate: { remainingMs: this.cooldowns.ultimate, totalMs: this.cooldownTotals.ultimate },
    };
  }

  isSkillOnCooldown(slot: SkillSlot): boolean {
    return this.cooldowns[slot] > 0;
  }

  update(dtMs: number): void {
    tickCooldowns(this.cooldowns, dtMs);

    const amp = getAncientSkillAmp(this.player.stats.isGodMode);
    const hitRadius = BOLT_HIT_RADIUS * amp;

    this.bolts = this.bolts.filter((bolt) => {
      bolt.ttlMs -= dtMs;
      if (bolt.ttlMs <= 0 || !bolt.img.active) {
        bolt.img.destroy();
        return false;
      }
      this.hitboxes.setHitboxShape(bolt.hitboxId, {
        kind: 'circle',
        radius: hitRadius,
        x: bolt.img.x,
        y: bolt.img.y,
      });
      return true;
    });
  }

  private executeSkill(skill: SkillDefinition): void {
    if (this.player.stats.isGodMode) {
      burstAncientSkill(this.player.scene, this.player.x, this.player.y, skill.intent, skill.kind);
    }

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

  private skillAmp(): number {
    return getAncientSkillAmp(this.player.stats.isGodMode);
  }

  private spawnSkillArc(skill: SkillDefinition): void {
    const amp = this.skillAmp();
    const overrides = skill.awakenedOverrides;
    const halfArc = (overrides?.arcHalfAngle ?? SLASH_HALF_ARC) * (amp > 1 ? 1.35 : 1);
    const reach = (SKILL_ARC_REACH + (overrides?.arcReachBonus ?? 0)) * amp;

    this.spawnSlashVisual(reach, amp);
    this.spawnArcHitbox(reach, halfArc, skill.skillMultiplier * amp, skill.intent, amp);
  }

  private spawnArcHitbox(
    reach: number,
    halfArc: number,
    multiplier: number,
    intent: SkillDefinition['intent'],
    amp: number,
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
      knockback: COMBO_FINISHER_KNOCKBACK * amp,
      pierce: Math.floor(8 * amp),
      insightIntent: intent,
    });
  }

  private spawnSlashVisual(reach: number, amp = 1): void {
    const { scene, sprite, facing } = this.player;
    const scale = (reach / SLASH_TEXTURE_SIZE) * 1.1;

    const slash = scene.add
      .image(sprite.x + facing * SLASH_OFFSET_PX, sprite.y - sprite.displayHeight * 0.45, TEXTURE_KEYS.slash)
      .setFlipX(facing < 0)
      .setScale(scale)
      .setDepth(sprite.depth + 1)
      .setAlpha(amp > 1 ? 1 : 0.92);

    if (amp > 1) {
      slash.setTint(0xffe8a0);
    }

    scene.time.delayedCall(SLASH_VISIBLE_MS * (amp > 1 ? 1.4 : 1), () => slash.destroy());
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
    const amp = this.skillAmp();
    const { scene, sprite, facing } = this.player;
    const pullForce = skill.awakenedOverrides?.pullForce;

    const bolt = scene.physics.add
      .image(sprite.x + facing * 20, sprite.y - sprite.displayHeight * 0.55, TEXTURE_KEYS.bolt)
      .setFlipX(facing < 0)
      .setScale(amp > 1 ? 1.6 * amp * 0.45 : 1)
      .setDepth(sprite.depth + 1);
    if (amp > 1) bolt.setTint(0xffc060);
    bolt.setVelocity(facing * BOLT_SPEED_PX_PER_SEC * amp, 0);

    const lifetimeMs = (BOLT_RANGE_PX * amp) / (BOLT_SPEED_PX_PER_SEC * amp) * 1000;
    const hitbox = this.hitboxes.spawn({
      ownerId: this.player.id,
      team: 'player',
      shape: { kind: 'circle', radius: BOLT_HIT_RADIUS * amp, x: bolt.x, y: bolt.y },
      damage: {
        attacker: this.player.stats.resolved,
        skillMultiplier: skill.skillMultiplier * amp,
        damageType: 'spirit',
        attackerRealmOrder: this.player.attackerRealmOrder,
        defenderRecommendedRealmOrder: this.player.mapRecommendedRealmOrder,
      },
      lifetimeMs,
      pierce: Math.floor(6 * amp),
      pullForce: pullForce ? pullForce * amp : undefined,
      insightIntent: skill.intent,
    });

    this.bolts.push({ img: bolt, hitboxId: hitbox.id, ttlMs: lifetimeMs });
  }

  private castHeal(skill: SkillDefinition): void {
    const amp = this.skillAmp();
    const pct = (skill.awakenedOverrides?.healPct ?? 0.1) * amp;
    const amount = Math.floor(this.player.stats.runtime.hpMax * Math.min(pct, 1));
    this.player.heal(amount);

    if (amp > 1) {
      const { scene, sprite } = this.player;
      const ring = scene.add.circle(sprite.x, sprite.y - 20, 12, 0x80ffb0, 0.5);
      ring.setDepth(sprite.depth + 2);
      scene.tweens.add({
        targets: ring,
        scaleX: 4,
        scaleY: 4,
        alpha: 0,
        duration: 400,
        onComplete: () => ring.destroy(),
      });
    }
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
