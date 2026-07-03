/** Gain-node channel for music, sfx, or ui (sub-plan 25). */
export class AudioBus {
  readonly input: GainNode;
  private volume = 1;

  constructor(
    private readonly ctx: AudioContext,
    master: GainNode,
    initialVolume = 1,
  ) {
    this.input = ctx.createGain();
    this.input.connect(master);
    this.setVolume(initialVolume);
  }

  getVolume(): number {
    return this.volume;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    this.input.gain.setValueAtTime(this.volume, this.ctx.currentTime);
  }

  /** Temporary duck for dialogue / stings. */
  duck(factor: number, ms: number): void {
    const now = this.ctx.currentTime;
    const target = this.volume * Math.max(0, Math.min(1, factor));
    this.input.gain.cancelScheduledValues(now);
    this.input.gain.setValueAtTime(this.input.gain.value, now);
    this.input.gain.linearRampToValueAtTime(target, now + ms / 1000);
    this.input.gain.linearRampToValueAtTime(this.volume, now + (ms * 2) / 1000);
  }
}
