import { playerSaveV1Schema, SAVE_VERSION, type PlayerSaveV1 } from '@/core/save/SaveSchema';

export class SaveMigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaveMigrationError';
  }
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

  const version = (raw as { version?: unknown }).version;
  if (version !== SAVE_VERSION) {
    throw new SaveMigrationError(`Unsupported save version: ${String(version)}`);
  }

  const result = playerSaveV1Schema.safeParse(raw);
  if (!result.success) {
    throw new SaveMigrationError(`Save schema invalid: ${result.error.message}`);
  }

  return result.data;
}
