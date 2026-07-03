/**
 * Pure player state machine (sub-plan 07 §3) — no Phaser imports so it is
 * unit-testable. Components drive it and read state each frame.
 *
 *   idle ←→ move
 *     ↓ attack pressed        → attack (combo 1→2→3, window 600ms)
 *     ↓ dodge pressed         → dodge (350ms, i-frames 250ms, cd 800ms)
 *     ↓ damage (no i-frames)  → hitstun (150ms)
 *     ↓ hp <= 0               → dead
 */

export type PlayerStateId = 'idle' | 'move' | 'attack' | 'dodge' | 'hitstun' | 'dead';

/** 8 / 10 / 18 frames at 60fps — step 3 is a held heavy finisher. */
export const ATTACK_STEP_DURATIONS_MS = [133, 167, 300] as const;
export const ATTACK_STEP_MULTIPLIERS = [1.0, 1.1, 1.65] as const;
export const MAX_COMBO_STEP = 3;
export const COMBO_WINDOW_MS = 600;
export const HEAVY_FINISHER_VARIANTS = 3;

export const DODGE_DURATION_MS = 350;
export const DODGE_IFRAMES_MS = 250;
export const DODGE_COOLDOWN_MS = 800;
/** 96px total over the dodge duration. */
export const DODGE_SPEED_PX_PER_SEC = 96 / (DODGE_DURATION_MS / 1000);

export const HITSTUN_MS = 150;

export class PlayerStateMachine {
  private current: PlayerStateId = 'idle';
  private stateElapsedMs = 0;
  /** Last executed combo step (1..3); 0 when the chain is broken. */
  private comboStep = 0;
  private comboWindowMs = 0;
  private dodgeCooldownMs = 0;
  /** Cycles haymaker → uppercut → body blow on each step-3 finisher. */
  private heavyFinisherCycle = 0;
  private activeHeavyVariant = 0;

  get state(): PlayerStateId {
    return this.current;
  }

  /** 1-based step of the attack in progress; 0 when not attacking. */
  get attackStep(): number {
    return this.current === 'attack' ? this.comboStep : 0;
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

  /** 0..2 heavy punch style used for the current step-3 attack. */
  get heavyFinisherVariant(): number {
    return this.activeHeavyVariant;
  }

  update(dtMs: number, moving: boolean): void {
    this.dodgeCooldownMs = Math.max(0, this.dodgeCooldownMs - dtMs);
    this.stateElapsedMs += dtMs;

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
      this.activeHeavyVariant = this.heavyFinisherCycle;
      this.heavyFinisherCycle = (this.heavyFinisherCycle + 1) % HEAVY_FINISHER_VARIANTS;
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

  /** Damage received. Returns true when it caused hitstun. */
  applyHit(): boolean {
    if (this.current === 'dead' || this.isInvulnerable) return false;
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
    this.activeHeavyVariant = 0;
    this.setState('idle');
  }

  private setState(next: PlayerStateId): void {
    if (this.current === next) return;
    this.current = next;
    this.stateElapsedMs = 0;
  }
}
