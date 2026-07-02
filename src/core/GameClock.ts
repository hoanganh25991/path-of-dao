/** Shared delta-time clock; hosts call tick() from their render loops. */
export class GameClock {
  static deltaMs = 0;
  static elapsedMs = 0;
  static paused = false;

  private static lastTickMs = 0;

  static tick(now: number): void {
    if (this.paused) {
      this.deltaMs = 0;
      return;
    }

    if (this.lastTickMs === 0) {
      this.lastTickMs = now;
      this.deltaMs = 0;
      return;
    }

    this.deltaMs = now - this.lastTickMs;
    this.lastTickMs = now;
    this.elapsedMs += this.deltaMs;
  }

  static pause(): void {
    this.paused = true;
  }

  static resume(): void {
    this.paused = false;
    this.lastTickMs = 0;
  }

  static reset(): void {
    this.deltaMs = 0;
    this.elapsedMs = 0;
    this.lastTickMs = 0;
    this.paused = false;
  }
}
