import { describe, expect, it } from 'vitest';
import { shouldDespawnOnDefeat, type DefeatRoutable } from '@/combat/systems/defeatRouting';

function makeOpponent(overrides: Partial<DefeatRoutable> = {}): DefeatRoutable {
  return { isBeast: false, isBoss: false, ...overrides };
}

describe('shouldDespawnOnDefeat (combat-defeat-canon.md §1)', () => {
  it('despawns beasts on defeat — no sit-recover', () => {
    const wolf = makeOpponent({ isBeast: true });
    expect(shouldDespawnOnDefeat(wolf)).toBe(true);
  });

  it('despawns bosses on defeat — ordeal stays down for the session', () => {
    const boss = makeOpponent({ isBoss: true });
    expect(shouldDespawnOnDefeat(boss)).toBe(true);
  });

  it('keeps the sit-recover flow for ordinary cultivators', () => {
    const disciple = makeOpponent();
    expect(shouldDespawnOnDefeat(disciple)).toBe(false);
  });

  it('despawns a boss beast (belt-and-suspenders — either flag routes to pool)', () => {
    const bossBeast = makeOpponent({ isBeast: true, isBoss: true });
    expect(shouldDespawnOnDefeat(bossBeast)).toBe(true);
  });
});
