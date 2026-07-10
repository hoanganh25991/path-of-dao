import { gameStore } from '@/core/store/gameStore';
import { EventBus } from '@/core/EventBus';
import { ATTACK_STEP_MULTIPLIERS, MAX_COMBO_STEP } from '@/combat/state/PlayerStateMachine';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import { VFX_TEXTURE_KEYS } from '@/combat/art/pixelVfxDraw';
import type { Player } from '@/combat/entities/Player';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import { recordSkillInsight } from '@/progression/InsightSystem';
import { getSkillDefinition, resolveEffectiveSkillId } from '@/progression/SkillLoader';
import { canUseSwordIntent, isArmedAttackStyle } from '@/progression/WeaponProgression';
import { isKickStrike } from '@/combat/art/stickyManStrikes';
import { canCastEquippedSkill } from '@/progression/SkillLoadout';
import { coerceEquippedSkills } from '@/progression/SkillSlots';
import type { SkillSlot } from '@/core/input/InputState';
import { CooldownManager } from '@/combat/skills/CooldownManager';
import { SkillExecutor } from '@/combat/skills/SkillExecutor';
import { buildMeleeArcShape } from '@/combat/combat/geometry';
import {
  computeBasicAttackAoeScale,
  scaledMeleeHalfArc,
} from '@/combat/combat/AoeScaling';

export interface SkillCooldownSnapshot {
  remainingMs: number;
  totalMs: number;
}

const SLASH_VISIBLE_MS = 100;
const SLASH_OFFSET_PX = 26;
const SWORD_REACH_PX = [40, 45, 60] as const;
const PALM_REACH_PX = [28, 34, 48] as const;
const KICK_REACH_PX = [32, 40, 54] as const;
const SLASH_TEXTURE_SIZE = 64;
const SLASH_HIT_MS = 80;
const SLASH_HALF_ARC = Math.PI / 3;
const PALM_HALF_ARC = Math.PI / 5;
const COMBO_FINISHER_KNOCKBACK = 180;

/** Attack combo + equipped skill slots via SkillExecutor. */
export class CombatComponent {
  currentMultiplier = 0;
  private readonly cooldowns = new CooldownManager();
  private readonly skills: SkillExecutor;

  constructor(
    private readonly player: Player,
    private readonly hitboxes: HitboxManager,
  ) {
    this.skills = new SkillExecutor(player, hitboxes);
  }

  setEnemyTargetProvider(provider: () => HurtboxEntity[]): void {
    this.skills.setEnemyTargetProvider(provider);
  }

  tryAttack(): boolean {
    const step = this.player.sm.tryAttack();
    if (step === null) return false;

    this.currentMultiplier = ATTACK_STEP_MULTIPLIERS[step - 1] ?? 1;
    this.player.body.setVelocity(0, 0);
    if (this.player.attackStyle === 'sword') {
      this.spawnSlash(step);
    } else if (
      !isArmedAttackStyle(this.player.attackStyle) &&
      (step === MAX_COMBO_STEP || isKickStrike(this.player.sm.strikeKind))
    ) {
      this.spawnHeavyPalmImpact(step);
    }
    this.spawnAttackHitbox(step);
    EventBus.emit('player:attack-started', { step: step as 1 | 2 | 3 });
    return true;
  }

  trySkill(slot: SkillSlot): boolean {
    const save = gameStore.getState().save;
    if (!save || !canCastEquippedSkill(save, slot)) return false;

    const equippedId = coerceEquippedSkills(save.equippedSkills)[slot];

    this.player.meditate.cancel();

    const skillId = resolveEffectiveSkillId(equippedId, save.insights);
    const skill = getSkillDefinition(skillId);

    if (skill.intent === 'sword' && !canUseSwordIntent(save)) return false;

    if (!this.skills.canCast(skill, this.cooldowns.remainingMs(slot))) return false;
    if (!this.player.stats.spendMana(skill.manaCost)) return false;

    this.cooldowns.start(slot, skill, this.player.stats.isGodMode);
    this.player.emitStatsChanged();
    this.skills.cast(skill);

    const { patch, emitReady } = recordSkillInsight(save, skillId);
    gameStore.getState().patch(patch);
    if (emitReady) {
      EventBus.emit('insight:ready-to-awaken', { intentId: skill.intent });
    }

    return true;
  }

  /** Press-edge handler for skill slots — held cast falls through to trySkill. */
  trySkillPressed(slot: SkillSlot): boolean {
    return this.trySkill(slot);
  }

  getCooldownSnapshot(): Record<SkillSlot, SkillCooldownSnapshot> {
    return this.cooldowns.snapshot();
  }

  isSkillOnCooldown(slot: SkillSlot): boolean {
    return !this.cooldowns.isReady(slot);
  }

  update(dtMs: number): void {
    this.cooldowns.tick(dtMs);
    this.skills.update(dtMs);
  }

  private reachForStep(step: number): number {
    if (isArmedAttackStyle(this.player.attackStyle)) {
      return SWORD_REACH_PX[step - 1] ?? SWORD_REACH_PX[0];
    }
    const table = isKickStrike(this.player.sm.strikeKind) ? KICK_REACH_PX : PALM_REACH_PX;
    return table[step - 1] ?? table[0];
  }

  private spawnAttackHitbox(step: number): void {
    const { facing } = this.player;
    const realmOrder = this.player.attackerRealmOrder;
    const level = this.player.stats.resolved.level;
    const aoeScale = computeBasicAttackAoeScale(realmOrder, level);
    const reach = Math.round(this.reachForStep(step) * aoeScale);
    const baseHalfArc = isArmedAttackStyle(this.player.attackStyle) ? SLASH_HALF_ARC : PALM_HALF_ARC;
    const halfArc = scaledMeleeHalfArc(baseHalfArc, aoeScale);

    this.hitboxes.spawn({
      ownerId: this.player.id,
      team: 'player',
      shape: buildMeleeArcShape(this.player.x, this.player.y, facing, reach, halfArc, SLASH_OFFSET_PX),
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
    const scale = this.reachForStep(step) / SLASH_TEXTURE_SIZE;

    const slash = scene.add
      .image(
        Math.round(sprite.x + facing * SLASH_OFFSET_PX),
        Math.round(sprite.y - sprite.displayHeight * 0.45),
        TEXTURE_KEYS.slash,
      )
      .setFlipX(facing < 0)
      .setOrigin(0.08, 0.5)
      .setScale(scale)
      .setDepth(sprite.depth + 1);

    scene.time.delayedCall(SLASH_VISIBLE_MS, () => slash.destroy());
  }

  private spawnHeavyPalmImpact(step: number): void {
    const { scene, sprite, facing } = this.player;
    const reach = this.reachForStep(step);
    const variant = this.player.sm.heavyFinisherVariant;
    const yOffset =
      variant === 1 ? -sprite.displayHeight * 0.35 : variant === 2 ? -sprite.displayHeight * 0.2 : -sprite.displayHeight * 0.42;

    const burst = scene.add
      .image(
        Math.round(sprite.x + facing * (SLASH_OFFSET_PX + reach * 0.35)),
        Math.round(sprite.y + yOffset),
        VFX_TEXTURE_KEYS.spark,
      )
      .setFlipX(facing < 0)
      .setOrigin(0.5)
      .setScale(variant === 0 ? 1.1 : 0.95)
      .setAlpha(0.9)
      .setDepth(sprite.depth + 1);

    scene.time.delayedCall(SLASH_VISIBLE_MS + 40, () => burst.destroy());
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
