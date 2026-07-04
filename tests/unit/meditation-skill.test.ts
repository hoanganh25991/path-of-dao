import { describe, expect, it } from 'vitest';
import { PlayerStateMachine } from '@/combat/state/PlayerStateMachine';

describe('Meditation skill interrupts', () => {
  it('enters meditate from idle and cancels on move intent', () => {
    const sm = new PlayerStateMachine();
    expect(sm.tryMeditate()).toBe(true);
    expect(sm.state).toBe('meditate');

    sm.cancelMeditate();
    expect(sm.state).toBe('idle');
  });

  it('cannot meditate during attack or dodge', () => {
    const sm = new PlayerStateMachine();
    sm.tryAttack();
    expect(sm.tryMeditate()).toBe(false);

    const sm2 = new PlayerStateMachine();
    sm2.tryDodge();
    expect(sm2.tryMeditate()).toBe(false);
  });

  it('damage during meditate causes hitstun', () => {
    const sm = new PlayerStateMachine();
    sm.tryMeditate();
    expect(sm.applyHit()).toBe(true);
    expect(sm.state).toBe('hitstun');
  });

  it('attack and dodge require canAct — meditate blocks them until cancelled', () => {
    const sm = new PlayerStateMachine();
    sm.tryMeditate();
    expect(sm.canAct).toBe(false);
    expect(sm.tryAttack()).toBeNull();
    expect(sm.tryDodge()).toBe(false);
  });

  it('stays in meditate while update runs without movement', () => {
    const sm = new PlayerStateMachine();
    sm.tryMeditate();
    sm.update(16, false);
    expect(sm.state).toBe('meditate');
  });
});
