import { playerSaveV1Schema, SAVE_VERSION, type PlayerSaveV1 } from '@/core/save/SaveSchema';

export class SaveMigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaveMigrationError';
  }
}

/**
 * Master Intent migration (plan 14 redesign) — legacy parallel six-intent ids
 * rename 1:1 into the new roster. `sword` / `flame` / `lightning` (gate-flow)
 * keep their id; `life` / `void` / `time` (now main-flow) rename in place,
 * carrying over xp/awakened/totalUses untouched.
 */
const LEGACY_INSIGHT_KEY_RENAMES: Record<string, string> = {
  life: 'life_death',
  void: 'truth_falsehood',
  time: 'cause_effect',
};

/** Pre-schema fixup — old saves may still key `insights` by the retired ids. */
function migrateLegacyInsightKeys(raw: Record<string, unknown>): void {
  const insights = raw.insights;
  if (insights === null || typeof insights !== 'object') return;

  const record = insights as Record<string, unknown>;
  for (const [oldKey, newKey] of Object.entries(LEGACY_INSIGHT_KEY_RENAMES)) {
    if (oldKey in record && !(newKey in record)) {
      record[newKey] = record[oldKey];
    }
    delete record[oldKey];
  }
}

/**
 * Divine Arts rename (track 30, user decision C3) — old saves persisted the
 * loadout under `equippedSkills`. Alias it onto `divineArts` before schema
 * parsing; shape (indexed `[0..5]` tuple + `''` empty) is unchanged.
 */
function migrateLegacyEquippedSkillsKey(record: Record<string, unknown>): void {
  if ('equippedSkills' in record && !('divineArts' in record)) {
    record.divineArts = record.equippedSkills;
  }
  delete record.equippedSkills;
}

/**
 * Migrate raw persisted data to the current save version.
 * v1 is current — parse and return. When v2 lands, chain:
 *   if (version === 1) data = migrateV1toV2(data);
 */
export function migrate(raw: unknown): PlayerSaveV1 {
  if (raw === null || typeof raw !== 'object') {
    throw new SaveMigrationError('Save data is not an object');
  }

  const record = raw as Record<string, unknown>;
  const version = record.version;
  if (version !== SAVE_VERSION) {
    throw new SaveMigrationError(`Unsupported save version: ${String(version)}`);
  }

  migrateLegacyInsightKeys(record);
  migrateLegacyEquippedSkillsKey(record);

  const result = playerSaveV1Schema.safeParse(record);
  if (!result.success) {
    throw new SaveMigrationError(`Save schema invalid: ${result.error.message}`);
  }

  return result.data;
}
