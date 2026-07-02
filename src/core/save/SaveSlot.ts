export const DB_NAME = 'path-of-dao';
export const STORE_NAME = 'saves';
export const DB_VERSION = 1;

/** MVP uses slot 0 only; layout supports 3 slots. */
export const DEFAULT_SLOT = 0;
export const MAX_SLOTS = 3;

export function slotKey(slot: number): string {
  if (!Number.isInteger(slot) || slot < 0 || slot >= MAX_SLOTS) {
    throw new Error(`Invalid save slot: ${slot}`);
  }
  return `slot_${slot}`;
}
