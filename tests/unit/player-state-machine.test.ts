import { beforeEach, describe, expect, it } from 'vitest';
import {
  ATTACK_STEP_DURATIONS_MS,
  DODGE_COOLDOWN_MS,
  DODGE_DURATION_MS,
  DODGE_IFRAMES_MS,
  HITSTUN_MS,
  PlayerStateMachine,
} from '@/combat/state/PlayerStateMachine';

let sm: PlayerStateMachine;

/** Advance the machine in small steps (mimics frame updates). */
function advance(ms: number, moving = false): void {
  const step = 16;
  let remaining = ms;
  while (remaining > 0) {
    sm.update(Math.min(step, remaining), moving);
    remaining -= step;
  }
}

beforeEach(() => {
  sm = new PlayerStateMachine();
});

describe('PlayerStateMachine', () => {
  it('starts idle and toggles to move with input', () => {
    expect(sm.state).toBe('idle');
    sm.update(16, true);
    expect(sm.state).toBe('move');
    sm.update(16, false);
    expect(sm.state).toBe('idle');
  });

  it('attacks from idle and returns to idle after the step duration', () => {
    expect(sm.tryAttack()).toBe(1);
    expect(sm.state).toBe('attack');
    advance(ATTACK_STEP_DURATIONS_MS[0] + 20);
    expect(sm.state).toBe('idle');
  });

  it('chains combo steps 1 → 2 → 3 within the window', () => {
    expect(sm.tryAttack()).toBe(1);
    advance(ATTACK_STEP_DURATIONS_MS[0] + 20);
    expect(sm.tryAttack()).toBe(2);
    advance(ATTACK_STEP_DURATIONS_MS[1] + 20);
    expect(sm.tryAttack()).toBe(3);
    advance(ATTACK_STEP_DURATIONS_MS[2] + 20);
    expect(sm.tryAttack()).toBe(1);
  });

  it('cycles heavy finisher strike on each step-3 attack', () => {
    expect(sm.tryAttack()).toBe(1);
    advance(ATTACK_STEP_DURATIONS_MS[0] + 20);
    expect(sm.tryAttack()).toBe(2);
    advance(ATTACK_STEP_DURATIONS_MS[1] + 20);
    expect(sm.tryAttack()).toBe(3);
    expect(sm.strikeKind).toBe('heavyHaymaker');
    advance(ATTACK_STEP_DURATIONS_MS[2] + 20);
    expect(sm.tryAttack()).toBe(1);
    advance(ATTACK_STEP_DURATIONS_MS[0] + 20);
    expect(sm.tryAttack()).toBe(2);
    advance(ATTACK_STEP_DURATIONS_MS[1] + 20);
    expect(sm.tryAttack()).toBe(3);
    expect(sm.strikeKind).toBe('heavyUppercut');
  });

  it('rotates light strikes between punch and kick', () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 8; i++) {
      sm.tryAttack();
      kinds.add(sm.strikeKind);
      advance(ATTACK_STEP_DURATIONS_MS[0] + 20);
    }
    expect(kinds.size).toBeGreaterThan(1);
  });

  it('resets the combo after 700ms of no attack', () => {
    expect(sm.tryAttack()).toBe(1);
    advance(ATTACK_STEP_DURATIONS_MS[0] + 20);
    advance(700);
    expect(sm.tryAttack()).toBe(1);
  });

  it('ignores attack input while already attacking', () => {
    sm.tryAttack();
    expect(sm.tryAttack()).toBeNull();
  });

  it('dodges from move, applies i-frames, and enforces cooldown', () => {
    sm.update(16, true);
    expect(sm.tryDodge()).toBe(true);
    expect(sm.state).toBe('dodge');
    expect(sm.isInvulnerable).toBe(true);

    advance(DODGE_IFRAMES_MS + 20);
    expect(sm.isInvulnerable).toBe(false);

    advance(DODGE_DURATION_MS);
    expect(sm.canAct).toBe(true);
    expect(sm.tryDodge()).toBe(false); // still on cooldown

    advance(DODGE_COOLDOWN_MS);
    expect(sm.tryDodge()).toBe(true);
  });

  it('cannot dodge mid-attack (no dodge cancel in MVP)', () => {
    sm.tryAttack();
    expect(sm.tryDodge()).toBe(false);
  });

  it('enters hitstun on hit and recovers', () => {
    expect(sm.applyHit()).toBe(true);
    expect(sm.state).toBe('hitstun');
    advance(HITSTUN_MS + 20);
    expect(sm.state).toBe('idle');
  });

  it('ignores hits during dodge i-frames', () => {
    sm.tryDodge();
    expect(sm.applyHit()).toBe(false);
    expect(sm.state).toBe('dodge');
  });

  it('dead blocks all input until revive', () => {
    sm.kill();
    expect(sm.state).toBe('dead');
    expect(sm.tryAttack()).toBeNull();
    expect(sm.tryDodge()).toBe(false);
    expect(sm.applyHit()).toBe(false);
    advance(2000);
    expect(sm.state).toBe('dead');

    sm.revive();
    expect(sm.state).toBe('idle');
    expect(sm.tryAttack()).toBe(1);
  });
});
