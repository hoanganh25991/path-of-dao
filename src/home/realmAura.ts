/** Aura visual tier derived from cultivation realm (sub-plan 10 / master-plan §7.2). */
export type AuraTier = 'none' | 'faint' | 'swirling' | 'void' | 'true_dao';

const REALM_AURA: Record<string, AuraTier> = {
  mortal_body: 'none',
  qi_condensation: 'none',
  foundation_establishment: 'faint',
  core_formation: 'faint',
  nascent_soul: 'swirling',
  void_spirit: 'void',
  true_dao: 'true_dao',
};

/** Map a save `realm.id` to the aura VFX tier shown in the 3D Home viewer. */
export function realmToAuraTier(realmId: string): AuraTier {
  return REALM_AURA[realmId] ?? 'none';
}
