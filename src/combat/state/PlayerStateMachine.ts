/**
 * Pure player state machine (sub-plan 07 §3) — no Phaser imports so it is
 * unit-testable. Components drive it and read state each frame.
 *
 *   idle ←→ move
 *     ↓ attack pressed        → attack (combo 1→2→3, window 600ms)
 *     ↓ dodge pressed         → dodge (350ms, i-frames 250ms, cd 800ms)
 *     ↓ meditate toggled      → meditate (held until move/attack/dodge/hit)
 *     ↓ damage (no i-frames)  → hitstun (150ms)
 *     ↓ hp <= 0               → dead
 */

import {
  pickHeavyStrike,
  pickLightStrike,
  type UnarmedStrikeKind,
} from '@/combat/art/stickyManStrikes';

export type PlayerStateId =
  | 'idle'
  | 'move'
  | 'attack'
  | 'dodge'
  | 'hitstun'
  | 'dead'
  | 'meditate';

/** 8 / 10 / 18 frames at 60fps — step 3 is a held heavy finisher. */
export const ATTACK_STEP_DURATIONS_MS = [140, 175, 320] as const;
export const ATTACK_STEP_MULTIPLIERS = [1.0, 1.1, 1.65] as const;
export const MAX_COMBO_STEP = 3;
export const COMBO_WINDOW_MS = 600;
export const HEAVY_FINISHER_VARIANTS = 4;

export const DODGE_DURATION_MS = 350;
/** Full dash — i-frames last the entire burst so the roll cannot be interrupted. */
export const DODGE_IFRAMES_MS = DODGE_DURATION_MS;
export const DODGE_COOLDOWN_MS = 800;
/** 288px total over the dodge duration (3× base dash). */
export const DODGE_DISTANCE_PX = 288;
export const DODGE_SPEED_PX_PER_SEC = DODGE_DISTANCE_PX / (DODGE_DURATION_MS / 1000);

export const HITSTUN_MS = 150;

export class PlayerStateMachine {
  private current: PlayerStateId = 'idle';
  private stateElapsedMs = 0;
  /** Last executed combo step (1..3); 0 when the chain is broken. */
  private comboStep = 0;
  private comboWindowMs = 0;
  private dodgeCooldownMs = 0;
  private heavyFinisherCycle = 0;
  private strikeCycle = 0;
  private activeStrike: UnarmedStrikeKind = 'jab';

  get state(): PlayerStateId {
    return this.current;
  }

  /** 1-based step of the attack in progress; 0 when not attacking. */
  get attackStep(): number {
    return this.current === 'attack' ? this.comboStep : 0;
  }

  /** Current unarmed strike animation (jab, kick, heavy, etc.). */
  get strikeKind(): UnarmedStrikeKind {
    return this.activeStrike;
  }

  /** @deprecated use strikeKind — kept for combat juice branching */
  get heavyFinisherVariant(): number {
    if (this.activeStrike === 'heavyUppercut') return 1;
    if (this.activeStrike === 'heavyBody' || this.activeStrike === 'heavyKick') return 2;
    return 0;
  }

  get isInvulnerable(): boolean {
    return this.current === 'dodge' && this.stateElapsedMs < DODGE_IFRAMES_MS;
  }

  /** True in idle/move — the only states that accept new actions. */
  get canAct(): boolean {
    return this.current === 'idle' || this.current === 'move';
  }

  get dodgeCooldownRemainingMs(): number {
    return this.dodgeCooldownMs;
  }

  update(dtMs: number, moving: boolean): void {
    this.dodgeCooldownMs = Math.max(0, this.dodgeCooldownMs - dtMs);
    this.stateElapsedMs += dtMs;

    if (this.current === 'meditate') {
      return;
    }

    if (this.canAct) {
      this.comboWindowMs = Math.max(0, this.comboWindowMs - dtMs);
      if (this.comboWindowMs === 0) this.comboStep = 0;
      this.setState(moving ? 'move' : 'idle');
      return;
    }

    switch (this.current) {
      case 'attack': {
        const duration = ATTACK_STEP_DURATIONS_MS[this.comboStep - 1] ?? 0;
        if (this.stateElapsedMs >= duration) {
          this.comboWindowMs = COMBO_WINDOW_MS;
          this.setState(moving ? 'move' : 'idle');
        }
        break;
      }
      case 'dodge':
        if (this.stateElapsedMs >= DODGE_DURATION_MS) {
          this.setState(moving ? 'move' : 'idle');
        }
        break;
      case 'hitstun':
        if (this.stateElapsedMs >= HITSTUN_MS) {
          this.setState(moving ? 'move' : 'idle');
        }
        break;
      case 'dead':
        break;
    }
  }

  /** Starts an attack (or the next combo step). Returns the step or null. */
  tryAttack(): number | null {
    if (!this.canAct) return null;

    const continuing =
      this.comboStep >= 1 && this.comboStep < MAX_COMBO_STEP && this.comboWindowMs > 0;
    this.comboStep = continuing ? this.comboStep + 1 : 1;

    if (this.comboStep === MAX_COMBO_STEP) {
      this.activeStrike = pickHeavyStrike(this.heavyFinisherCycle);
      this.heavyFinisherCycle = (this.heavyFinisherCycle + 1) % HEAVY_FINISHER_VARIANTS;
    } else {
      this.activeStrike = pickLightStrike(this.strikeCycle);
      this.strikeCycle += 1;
    }

    this.comboWindowMs = 0;
    this.setState('attack');
    return this.comboStep;
  }

  tryDodge(): boolean {
    if (!this.canAct || this.dodgeCooldownMs > 0) return false;
    this.dodgeCooldownMs = DODGE_COOLDOWN_MS;
    this.setState('dodge');
    return true;
  }

  /** Enter seated meditation — fastest HP regen; cancel on move/attack/dodge/hit. */
  tryMeditate(): boolean {
    if (!this.canAct) return false;
    this.setState('meditate');
    return true;
  }

  cancelMeditate(): void {
    if (this.current !== 'meditate') return;
    this.setState('idle');
  }

  /** Damage received. Returns true when it caused hitstun. */
  applyHit(): boolean {
    if (this.current === 'dead' || this.isInvulnerable) return false;
    if (this.current === 'meditate') {
      this.setState('hitstun');
      return true;
    }
    this.setState('hitstun');
    return true;
  }

  kill(): void {
    this.setState('dead');
  }

  revive(): void {
    this.comboStep = 0;
    this.comboWindowMs = 0;
    this.dodgeCooldownMs = 0;
    this.heavyFinisherCycle = 0;
    this.strikeCycle = 0;
    this.activeStrike = 'jab';
    this.setState('idle');
  }

  private setState(next: PlayerStateId): void {
    if (this.current === next) return;
    this.current = next;
    this.stateElapsedMs = 0;
  }
}
