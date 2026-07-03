import { describe, expect, it } from 'vitest';
import { realmToAuraTier } from '@/home/realmAura';

describe('realmToAuraTier', () => {
  it('maps low realms to no aura', () => {
    expect(realmToAuraTier('mortal_body')).toBe('none');
    expect(realmToAuraTier('qi_condensation')).toBe('none');
  });

  it('maps mid realms to faint aura', () => {
    expect(realmToAuraTier('foundation_establishment')).toBe('faint');
    expect(realmToAuraTier('core_formation')).toBe('faint');
  });

  it('maps high realms to escalating tiers', () => {
    expect(realmToAuraTier('nascent_soul')).toBe('swirling');
    expect(realmToAuraTier('void_spirit')).toBe('void');
    expect(realmToAuraTier('true_dao')).toBe('true_dao');
  });

  it('falls back to none for unknown realm ids', () => {
    expect(realmToAuraTier('unknown_realm')).toBe('none');
    expect(realmToAuraTier('')).toBe('none');
  });
});
