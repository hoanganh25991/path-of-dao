import manifestJson from '../../../content/audio/manifest.json';
import { AudioBus } from '@/core/audio/AudioBus';
import { playProceduralTone, startProceduralBgm } from '@/core/audio/proceduralSfx';
import type { AudioBusId, AudioManifest, BgmEntry, ProceduralBgm, ProceduralTone, SfxEntry } from '@/core/audio/types';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';

const MAX_SIMULTANEOUS_SFX = 8;
const UNLOCK_STORAGE_KEY = 'pod.audio.unlocked';
const manifest = manifestJson as AudioManifest;

type ActiveVoice = { stop: () => void };

/** Web Audio facade — procedural placeholders until OGG assets land (sub-plan 25). */
export class AudioManager {
  private static ctx: AudioContext | null = null;
  private static master: GainNode | null = null;
  private static buses: Record<AudioBusId, AudioBus> | null = null;
  private static unlocked = false;
  private static activeSfx: ActiveVoice[] = [];
  private static currentBgm: ActiveVoice | null = null;
  private static currentBgmKey: string | null = null;
  private static saveVolumes = { music: 1, sfx: 1 };

  static get manifest(): AudioManifest {
    return manifest;
  }

  static isUnlocked(): boolean {
    return this.unlocked;
  }

  /** Device remembered unlock — overlay only on first visit. */
  static hasPersistedUnlock(): boolean {
    try {
      return localStorage.getItem(UNLOCK_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  static init(save: PlayerSaveV1): void {
    this.saveVolumes = {
      music: save.settings.musicVolume,
      sfx: save.settings.sfxVolume,
    };
    this.applyBusVolumes();
  }

  static async unlock(): Promise<void> {
    if (this.unlocked) return;
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    this.unlocked = true;
    try {
      localStorage.setItem(UNLOCK_STORAGE_KEY, '1');
    } catch {
      /* private browsing — unlock still works this session */
    }
  }

  static setVolume(bus: AudioBusId, v: number): void {
    if (bus === 'music') this.saveVolumes.music = v;
    else this.saveVolumes.sfx = v;
    this.applyBusVolumes();
  }

  static playBgm(key: string, _crossfadeMs = 600): void {
    if (!this.unlocked) return;
    if (this.currentBgmKey === key) return;

    const entry = manifest.bgm[key];
    if (!entry) return;

    this.stopBgm();
    this.currentBgmKey = key;

    const ctx = this.ensureContext();
    const bus = this.ensureBuses().music;

    if (entry.type === 'procedural') {
      this.currentBgm = startProceduralBgm(ctx, bus.input, entry as ProceduralBgm);
      return;
    }

    // File-based BGM — deferred until assets/audio ships.
  }

  static playSfx(key: string, bus: AudioBusId = 'sfx'): void {
    if (!this.unlocked) return;

    const entry = manifest.sfx[key];
    if (!entry) return;

    this.trimSfxPool();
    const ctx = this.ensureContext();
    const destination = this.ensureBuses()[bus].input;

    if (entry.type === 'procedural') {
      const voice = playProceduralTone(ctx, destination, entry as ProceduralTone);
      this.activeSfx.push(voice);
      return;
    }

    // File-based SFX — deferred until assets/audio ships.
  }

  static duckMusic(factor: number, ms: number): void {
    if (!this.unlocked) return;
    this.ensureBuses().music.duck(factor, ms);
  }

  static pause(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    void ctx.suspend();
  }

  static resume(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'suspended') return;
    void ctx.resume();
  }

  static resetForTests(): void {
    this.stopBgm();
    for (const voice of this.activeSfx) voice.stop();
    this.activeSfx = [];
    this.buses = null;
    if (this.ctx) {
      void this.ctx.close();
    }
    this.ctx = null;
    this.master = null;
    this.unlocked = false;
    this.currentBgmKey = null;
    this.saveVolumes = { music: 1, sfx: 1 };
    try {
      localStorage.removeItem(UNLOCK_STORAGE_KEY);
    } catch {
      /* noop */
    }
  }

  private static ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        throw new Error('AudioManager: Web Audio API unavailable');
      }
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.buses = {
        music: new AudioBus(this.ctx, this.master, this.saveVolumes.music),
        sfx: new AudioBus(this.ctx, this.master, this.saveVolumes.sfx),
        ui: new AudioBus(this.ctx, this.master, this.saveVolumes.sfx),
      };
    }
    return this.ctx;
  }

  private static ensureBuses(): Record<AudioBusId, AudioBus> {
    this.ensureContext();
    if (!this.buses) {
      throw new Error('AudioManager: buses not initialized');
    }
    return this.buses;
  }

  private static applyBusVolumes(): void {
    if (!this.buses) return;
    this.buses.music.setVolume(this.saveVolumes.music);
    this.buses.sfx.setVolume(this.saveVolumes.sfx);
    this.buses.ui.setVolume(this.saveVolumes.sfx);
  }

  private static stopBgm(): void {
    this.currentBgm?.stop();
    this.currentBgm = null;
    this.currentBgmKey = null;
  }

  private static trimSfxPool(): void {
    while (this.activeSfx.length >= MAX_SIMULTANEOUS_SFX) {
      const oldest = this.activeSfx.shift();
      oldest?.stop();
    }
  }

  /** Test hook — resolve manifest entry without playing. */
  static getSfxEntry(key: string): SfxEntry | undefined {
    return manifest.sfx[key];
  }

  static getBgmEntry(key: string): BgmEntry | undefined {
    return manifest.bgm[key];
  }
}
