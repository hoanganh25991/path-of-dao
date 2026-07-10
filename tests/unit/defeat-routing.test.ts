import { describe, expect, it } from 'vitest';
import {
  shouldDespawnOnDefeat,
  shouldStayDownOnDefeat,
  type DefeatRoutable,
} from '@/combat/systems/defeatRouting';

function makeOpponent(overrides: Partial<DefeatRoutable> = {}): DefeatRoutable {
  return { isBeast: false, isBoss: false, ...overrides };
}

describe('shouldDespawnOnDefeat (combat-defeat-canon.md §1)', () => {
  it('despawns beasts on defeat — no sit-recover', () => {
    const wolf = makeOpponent({ isBeast: true });
    expect(shouldDespawnOnDefeat(wolf)).toBe(true);
  });

  it('does not despawn bosses — they sit gather-qi and stay down', () => {
    const boss = makeOpponent({ isBoss: true });
    expect(shouldDespawnOnDefeat(boss)).toBe(false);
    expect(shouldStayDownOnDefeat(boss)).toBe(true);
  });

  it('keeps the sit-recover flow for ordinary cultivators', () => {
    const disciple = makeOpponent();
    expect(shouldDespawnOnDefeat(disciple)).toBe(false);
    expect(shouldStayDownOnDefeat(disciple)).toBe(false);
  });

  it('despawns a boss beast (beast flag wins for pool release)', () => {
    const bossBeast = makeOpponent({ isBeast: true, isBoss: true });
    expect(shouldDespawnOnDefeat(bossBeast)).toBe(true);
    expect(shouldStayDownOnDefeat(bossBeast)).toBe(false);
  });
});
