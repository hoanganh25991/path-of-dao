/**
 * Object pool registry stub — implemented in sub-plan 08 (enemy system).
 * Registered now so later work does not refactor scene wiring.
 */
export class PoolManager {
  private static pools = new Map<string, unknown>();

  static register(key: string, pool: unknown): void {
    PoolManager.pools.set(key, pool);
  }

  static get<T>(key: string): T | undefined {
    return PoolManager.pools.get(key) as T | undefined;
  }

  static clear(): void {
    PoolManager.pools.clear();
  }
}
