/**
 * FNV-1a 32-bit checksum over a stable (key-sorted) JSON encoding.
 * Detects accidental corruption/tampering — not a security measure (client-side save).
 */

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);

  return `{${entries.join(',')}}`;
}

export function fnv1a(input: string): string {
  let hash = 0x811c9dc5;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    // hash *= 16777619 using 32-bit shifts to stay in integer range
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
}

/** Checksum of an object, ignoring its own `checksum` field. */
export function checksumOf(data: Record<string, unknown>): string {
  const { checksum: _ignored, ...rest } = data;
  return fnv1a(stableStringify(rest));
}
