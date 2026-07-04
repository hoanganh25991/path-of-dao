import { EventBus } from '@/core/EventBus';
import { MEDITATE_SKILL_ID } from '@/progression/BuiltinSkills';
import { getSkillDefinition } from '@/progression/SkillLoader';
import { getSkillCooldownMs } from '@/progression/SkillCooldown';
import type { Player } from '@/combat/entities/Player';
import { MeditationVfx } from '@/combat/vfx/MeditationVfx';

export interface MeditateCooldownSnapshot {
  remainingMs: number;
  totalMs: number;
}

/** Toggle meditation via the dedicated health button; spirit wisps + sit pose. */
export class MeditationComponent {
  private readonly vfx: MeditationVfx;
  private cooldownRemainingMs = 0;
  private cooldownTotalMs = 0;
  private wasMeditating = false;

  constructor(private readonly player: Player) {
    this.vfx = new MeditationVfx(player.scene, player.sprite.depth);
  }

  /** Press edge on the health button — toggles seated recovery. */
  tryToggle(): boolean {
    if (this.player.sm.state === 'meditate') {
      this.cancel();
      return true;
    }

    if (this.cooldownRemainingMs > 0) return false;
    if (!this.player.sm.tryMeditate()) return false;

    const skill = getSkillDefinition(MEDITATE_SKILL_ID);
    const ms = getSkillCooldownMs(skill, this.player.stats.isGodMode);
    this.cooldownRemainingMs = ms;
    this.cooldownTotalMs = ms;

    this.player.body.setVelocity(0, 0);
    this.vfx.start(this.player.x, this.player.y);
    EventBus.emit('player:meditate-started', undefined);
    return true;
  }

  /** Interrupt meditation — move, attack, dodge, or damage. */
  cancel(): void {
    if (this.player.sm.state !== 'meditate') return;
    this.player.sm.cancelMeditate();
    this.vfx.stop();
    if (this.wasMeditating) {
      EventBus.emit('player:meditate-ended', undefined);
    }
  }

  update(dtMs: number): void {
    if (this.cooldownRemainingMs > 0) {
      this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - dtMs);
    }

    const meditating = this.player.sm.state === 'meditate';

    if (meditating) {
      this.player.body.setVelocity(0, 0);
      this.vfx.update(dtMs, this.player.x, this.player.y);
    } else if (this.wasMeditating) {
      this.vfx.stop();
      EventBus.emit('player:meditate-ended', undefined);
    }

    this.wasMeditating = meditating;
  }

  getCooldownSnapshot(): MeditateCooldownSnapshot {
    return {
      remainingMs: this.cooldownRemainingMs,
      totalMs: this.cooldownTotalMs,
    };
  }

  destroy(): void {
    this.vfx.destroy();
  }
}
