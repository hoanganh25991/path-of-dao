import { getEncounterDefinition, listEncounterIds } from '@/progression/EncounterLoader';

export interface LoreDisplay {
  loreId: string;
  titleKey: string;
  bodyKey: string;
  encounterId: string | null;
}

/** Locale key for lore body text (`lore.*` → `demo.lore.*`). */
export function loreBodyKey(loreId: string): string {
  return loreId.replace(/^lore\./, 'demo.lore.');
}

/** Find the fortuitous encounter that unlocks this lore entry, if any. */
export function findEncounterForLore(loreId: string): string | null {
  for (const id of listEncounterIds()) {
    const def = getEncounterDefinition(id);
    if (def.reward.type === 'lore' && def.reward.loreId === loreId) {
      return id;
    }
  }
  return null;
}

export function describeLoreEntry(loreId: string): LoreDisplay {
  const encounterId = findEncounterForLore(loreId);
  const titleKey = encounterId
    ? getEncounterDefinition(encounterId).displayNameKey
    : loreBodyKey(loreId);

  return {
    loreId,
    titleKey,
    bodyKey: loreBodyKey(loreId),
    encounterId,
  };
}

/** Lore snippet for a claimed encounter row on My Path (null if not lore or not unlocked). */
export function loreBodyForEncounter(
  encounterId: string,
  loreUnlocked: string[],
): string | null {
  try {
    const def = getEncounterDefinition(encounterId);
    if (def.reward.type !== 'lore') return null;
    if (!loreUnlocked.includes(def.reward.loreId)) return null;
    return def.reward.loreId;
  } catch {
    return null;
  }
}
