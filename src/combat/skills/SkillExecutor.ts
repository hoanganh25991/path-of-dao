import { EventBus } from '@/core/EventBus';
import type { Player } from '@/combat/entities/Player';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import type { SkillDefinition } from '@/progression/SkillDefinition';
import { getAncientSkillAmp, burstAncientSkill } from '@/combat/vfx/AncientSkillVfx';
import { computeAoeScale } from '@/combat/combat/AoeScaling';
import {
  executeSkillEffects,
  tickSkillBolts,
  type EffectRunnerContext,
  type SkillBolt,
} from '@/combat/skills/effects/runEffects';
import { canAffordCast, getCastBlockReason } from '@/combat/skills/castGuards';
import { resolveSkillEffects } from '@/combat/skills/resolveSkillEffects';

export type { CastBlockReason } from '@/combat/skills/castGuards';

/** Data-driven skill cast pipeline (sub-plan 19 §5). */
export class SkillExecutor {
  private readonly bolts: SkillBolt[] = [];

  constructor(
    private readonly player: Player,
    private readonly hitboxes: HitboxManager,
  ) {}

  canCast(skill: SkillDefinition, cooldownRemainingMs: number): boolean {
    return canAffordCast(
      skill,
      this.player.sm.canAct,
      this.player.stats.runtime.mana,
      cooldownRemainingMs,
    );
  }

  getCastBlockReason(skill: SkillDefinition, cooldownRemainingMs: number) {
    return getCastBlockReason(
      skill,
      this.player.sm.canAct,
      this.player.stats.runtime.mana,
      cooldownRemainingMs,
    );
  }

  /** Run resolved effects after mana/cooldown checks (caller spends mana + starts CD). */
  cast(skill: SkillDefinition): void {
    const amp = getAncientSkillAmp(this.player.stats.isGodMode);
    const aoeScale = computeAoeScale(this.player.attackerRealmOrder, this.player.stats.resolved.level);
    if (this.player.stats.isGodMode) {
      burstAncientSkill(this.player.scene, this.player.x, this.player.y, skill.intent, skill.kind);
    }

    EventBus.emit('skill:cast', { intent: skill.intent });

    const ctx: EffectRunnerContext = {
      player: this.player,
      hitboxes: this.hitboxes,
      skill,
      amp,
      aoeScale,
      bolts: this.bolts,
    };
    executeSkillEffects(ctx);
  }

  update(dtMs: number): void {
    const alive = tickSkillBolts(this.bolts, this.hitboxes, dtMs);
    this.bolts.length = 0;
    this.bolts.push(...alive);
  }

  /** @internal For tests — effect list that would run for a skill definition. */
  static resolveEffects(skill: SkillDefinition) {
    return resolveSkillEffects(skill);
  }
}
