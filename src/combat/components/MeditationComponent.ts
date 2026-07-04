import { gameStore } from '@/core/store/gameStore';
import { EventBus } from '@/core/EventBus';
import { isMeditateSkillId } from '@/progression/BuiltinSkills';
import { canCastEquippedSkill } from '@/progression/SkillLoadout';
import { getSkillDefinition } from '@/progression/SkillLoader';
import type { SkillSlot } from '@/core/input/InputState';
import type { Player } from '@/combat/entities/Player';
import { MeditationVfx } from '@/combat/vfx/MeditationVfx';
import { CooldownManager } from '@/combat/skills/CooldownManager';

const SKILL_SLOTS: SkillSlot[] = ['primary', 'secondary', 'ultimate'];

/** Toggle meditation via equipped {@link MEDITATE_SKILL_ID} slot; spirit wisps + sit pose. */
export class MeditationComponent {
  private readonly vfx: MeditationVfx;
  private readonly cooldowns = new CooldownManager();
  private wasMeditating = false;

  constructor(private readonly player: Player) {
    this.vfx = new MeditationVfx(player.scene, player.sprite.depth);
  }

  /** Press edge on a skill slot — toggles meditate when that slot holds the skill. */
  tryToggleSlot(slot: SkillSlot): boolean {
    const save = gameStore.getState().save;
    if (!save || !canCastEquippedSkill(save, slot)) return false;

    const skillId = save.equippedSkills[slot];
    if (!isMeditateSkillId(skillId)) return false;

    if (this.player.sm.state === 'meditate') {
      this.cancel();
      return true;
    }

    const skill = getSkillDefinition(skillId);
    if (!this.cooldowns.isReady(slot)) return false;
    if (!this.player.sm.tryMeditate()) return false;

    this.cooldowns.start(slot, skill, this.player.stats.isGodMode);
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
    this.cooldowns.tick(dtMs);
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

  /** Slot holding meditate skill, if any. */
  findMeditateSlot(): SkillSlot | null {
    const save = gameStore.getState().save;
    if (!save) return null;
    for (const slot of SKILL_SLOTS) {
      if (canCastEquippedSkill(save, slot) && isMeditateSkillId(save.equippedSkills[slot])) {
        return slot;
      }
    }
    return null;
  }

  getCooldownSnapshot(): Record<SkillSlot, { remainingMs: number; totalMs: number }> {
    return this.cooldowns.snapshot();
  }

  destroy(): void {
    this.vfx.destroy();
  }
}
