/** Rolling FPS readout driven by requestAnimationFrame (display refresh up to 120 Hz). */
export class FpsCounter {
  private static mounted = false;
  private static el: HTMLElement | null = null;
  private static rafId: number | null = null;
  private static frames = 0;
  private static lastSampleMs = 0;

  static mount(el: HTMLElement): void {
    if (FpsCounter.mounted) return;
    FpsCounter.el = el;
    FpsCounter.mounted = true;
    FpsCounter.lastSampleMs = performance.now();
    FpsCounter.frames = 0;
    FpsCounter.tick(performance.now());
  }

  static destroy(): void {
    if (FpsCounter.rafId !== null) {
      cancelAnimationFrame(FpsCounter.rafId);
      FpsCounter.rafId = null;
    }
    FpsCounter.el = null;
    FpsCounter.mounted = false;
  }

  /** @internal Exposed for unit tests. */
  static resetForTests(): void {
    FpsCounter.destroy();
  }

  private static tick(now: number): void {
    if (!FpsCounter.mounted || !FpsCounter.el) return;

    FpsCounter.frames += 1;
    const elapsed = now - FpsCounter.lastSampleMs;
    if (elapsed >= 500) {
      const fps = Math.round((FpsCounter.frames * 1000) / elapsed);
      FpsCounter.el.textContent = String(fps);
      FpsCounter.el.dataset.tier = fps >= 60 ? 'good' : fps >= 45 ? 'mid' : 'low';
      FpsCounter.frames = 0;
      FpsCounter.lastSampleMs = now;
    }

    FpsCounter.rafId = requestAnimationFrame(FpsCounter.tick);
  }
}
