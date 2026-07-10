/** Deterministic pseudo-random — same inputs always yield the same float in [0, 1). */

export function hashStringToSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function mixSeed(seed: number, salt: number): number {
  let h = (seed ^ Math.imul(salt, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

export function seededFloat(seed: number, salt: number): number {
  return mixSeed(seed, salt) / 0x1_0000_0000;
}

export function seededInt(seed: number, salt: number, min: number, maxInclusive: number): number {
  const t = seededFloat(seed, salt);
  const span = maxInclusive - min + 1;
  return min + Math.floor(t * span);
}

export function cellSeed(worldSeed: number, cellX: number, cellY: number, salt = 0): number {
  return mixSeed(worldSeed, mixSeed(cellX * 374761 + cellY * 668265, salt));
}

export function pickFrom<T>(seed: number, salt: number, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pickFrom: empty items');
  const idx = seededInt(seed, salt, 0, items.length - 1);
  return items[idx]!;
}
