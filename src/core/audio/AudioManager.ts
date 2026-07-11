import manifestJson from '../../../content/audio/manifest.json';
import { AudioBus } from '@/core/audio/AudioBus';
import { playProceduralTone, startProceduralBgm } from '@/core/audio/proceduralSfx';
import type { AudioBusId, AudioManifest, BgmEntry, FileAudio, ProceduralBgm, ProceduralTone, SfxEntry } from '@/core/audio/types';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';

const MAX_SIMULTANEOUS_SFX = 8;
const UNLOCK_STORAGE_KEY = 'pod.audio.unlocked';
/** Fallback UI bus volume before a save is loaded (matches SaveSchema default). */
const UI_VOLUME_DEFAULT = 0.82;
const manifest = manifestJson as AudioManifest;

type ActiveVoice = { stop: () => void; fadeOut?: (sec: number) => void };

/** Web Audio facade — file BGM + procedural SFX placeholders (sub-plan 25). */
export class AudioManager {
  private static ctx: AudioContext | null = null;
  private static master: GainNode | null = null;
  private static buses: Record<AudioBusId, AudioBus> | null = null;
  private static unlocked = false;
  private static activeSfx: ActiveVoice[] = [];
  private static currentBgm: ActiveVoice | null = null;
  private static currentBgmKey: string | null = null;
  private static bgmGeneration = 0;
  private static bufferCache = new Map<string, AudioBuffer>();
  private static saveVolumes = { music: 1, sfx: 1, ui: UI_VOLUME_DEFAULT };

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
      ui: save.settings.uiVolume,
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
    else if (bus === 'ui') this.saveVolumes.ui = v;
    else this.saveVolumes.sfx = v;
    this.applyBusVolumes();
  }

  static playBgm(key: string, crossfadeMs = 800): void {
    if (!this.unlocked) return;
    if (this.currentBgmKey === key) return;

    const entry = manifest.bgm[key];
    if (!entry) return;

    const fadeSec = crossfadeMs / 1000;
    const outgoing = this.currentBgm;
    this.currentBgm = null;
    this.currentBgmKey = key;
    const generation = ++this.bgmGeneration;

    if (outgoing) {
      if (outgoing.fadeOut) outgoing.fadeOut(fadeSec);
      else outgoing.stop();
    }

    const ctx = this.ensureContext();
    const bus = this.ensureBuses().music;

    if (entry.type === 'procedural') {
      this.currentBgm = startProceduralBgm(ctx, bus.input, entry as ProceduralBgm, fadeSec);
      return;
    }

    void this.startFileBgm(key, entry as FileAudio, fadeSec, generation);
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

    void this.playFileSfx(entry as FileAudio, destination);
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
    this.bufferCache.clear();
    this.bgmGeneration = 0;
    if (this.ctx) {
      void this.ctx.close();
    }
    this.ctx = null;
    this.master = null;
    this.unlocked = false;
    this.currentBgmKey = null;
    this.saveVolumes = { music: 1, sfx: 1, ui: UI_VOLUME_DEFAULT };
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
        ui: new AudioBus(this.ctx, this.master, this.saveVolumes.ui),
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
    this.buses.ui.setVolume(this.saveVolumes.ui);
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

  /** Prefer MP3 for Safari Web Audio decode; OGG/Opus for Chromium size. */
  private static resolveFileUrl(entry: FileAudio): string | null {
    const paths = entry.paths;
    const relative = paths.mp3 ?? paths.ogg;
    if (!relative) return null;
    const base = import.meta.env.BASE_URL ?? '/';
    const clean = relative.replace(/^\//, '');
    return `${base}${clean}`;
  }

  private static async loadBuffer(entry: FileAudio): Promise<AudioBuffer | null> {
    const url = this.resolveFileUrl(entry);
    if (!url) return null;

    const cached = this.bufferCache.get(url);
    if (cached) return cached;

    const ctx = this.ensureContext();
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const raw = await res.arrayBuffer();
      const buffer = await ctx.decodeAudioData(raw.slice(0));
      this.bufferCache.set(url, buffer);
      return buffer;
    } catch {
      return null;
    }
  }

  private static async startFileBgm(
    key: string,
    entry: FileAudio,
    fadeSec: number,
    generation: number,
  ): Promise<void> {
    const buffer = await this.loadBuffer(entry);
    if (!buffer) return;
    if (this.bgmGeneration !== generation || this.currentBgmKey !== key) return;

    const ctx = this.ensureContext();
    const bus = this.ensureBuses().music;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const peak = entry.gain ?? 0.45;
    const loop = entry.loop ?? true;

    source.buffer = buffer;
    source.loop = loop;
    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + Math.max(0.05, fadeSec));
    source.connect(gain);
    gain.connect(bus.input);
    source.start();

    let stopped = false;
    const stopAll = (): void => {
      if (stopped) return;
      stopped = true;
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
      source.disconnect();
      gain.disconnect();
      if (this.currentBgmKey === key) {
        this.currentBgm = null;
        this.currentBgmKey = null;
      }
    };

    if (!loop) {
      source.onended = () => {
        if (!stopped && this.currentBgmKey === key) stopAll();
      };
    }

    this.currentBgm = {
      stop: stopAll,
      fadeOut: (sec: number) => {
        const fadeT = ctx.currentTime;
        gain.gain.cancelScheduledValues(fadeT);
        gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), fadeT);
        gain.gain.linearRampToValueAtTime(0.0001, fadeT + sec);
        setTimeout(stopAll, sec * 1000 + 60);
      },
    };
  }

  private static async playFileSfx(entry: FileAudio, destination: AudioNode): Promise<void> {
    const buffer = await this.loadBuffer(entry);
    if (!buffer) return;

    const ctx = this.ensureContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = entry.gain ?? 0.5;
    source.connect(gain);
    gain.connect(destination);
    source.start();

    const voice: ActiveVoice = {
      stop: () => {
        try {
          source.stop();
        } catch {
          /* noop */
        }
        source.disconnect();
        gain.disconnect();
      },
    };
    this.activeSfx.push(voice);
    source.onended = () => {
      const idx = this.activeSfx.indexOf(voice);
      if (idx >= 0) this.activeSfx.splice(idx, 1);
      source.disconnect();
      gain.disconnect();
    };
  }

  /** Test hook — read a bus's current save-scaled volume without touching Web Audio. */
  static getBusVolume(bus: AudioBusId): number {
    if (bus === 'music') return this.saveVolumes.music;
    if (bus === 'ui') return this.saveVolumes.ui;
    return this.saveVolumes.sfx;
  }

  /** Test hook — resolve manifest entry without playing. */
  static getSfxEntry(key: string): SfxEntry | undefined {
    return manifest.sfx[key];
  }

  static getBgmEntry(key: string): BgmEntry | undefined {
    return manifest.bgm[key];
  }
}
