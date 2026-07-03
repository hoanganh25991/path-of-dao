/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager } from '@/core/audio/AudioManager';
import { SaveManager } from '@/core/save/SaveManager';

describe('AudioManager', () => {
  beforeEach(() => {
    AudioManager.resetForTests();
  });

  afterEach(() => {
    AudioManager.resetForTests();
  });

  it('loads manifest with minimum sfx keys', () => {
    const keys = Object.keys(AudioManager.manifest.sfx);
    expect(keys.length).toBeGreaterThanOrEqual(24);
    expect(AudioManager.getSfxEntry('enemy.death')).toBeDefined();
    expect(AudioManager.getBgmEntry('bgm.home')).toBeDefined();
  });

  it('respects save volume on init', () => {
    const save = SaveManager.createNew();
    AudioManager.init({
      ...save,
      settings: { ...save.settings, musicVolume: 0.4, sfxVolume: 0.25 },
    });
    expect(() => AudioManager.setVolume('music', 0.5)).not.toThrow();
    expect(() => AudioManager.setVolume('sfx', 0.3)).not.toThrow();
  });

  it('does not play before unlock', () => {
    AudioManager.init(SaveManager.createNew());
    expect(() => AudioManager.playSfx('ui.tap')).not.toThrow();
    expect(() => AudioManager.playBgm('bgm.home')).not.toThrow();
  });

  it('persists unlock state in localStorage', async () => {
    vi.stubGlobal('AudioContext', createMockAudioContext());
    AudioManager.init(SaveManager.createNew());
    await AudioManager.unlock();
    expect(AudioManager.isUnlocked()).toBe(true);
    expect(AudioManager.hasPersistedUnlock()).toBe(true);
    vi.unstubAllGlobals();
  });

  it('plays procedural sfx after unlock', async () => {
    vi.stubGlobal('AudioContext', createMockAudioContext());
    AudioManager.init(SaveManager.createNew());
    await AudioManager.unlock();
    expect(() => AudioManager.playSfx('enemy.hit')).not.toThrow();
    vi.unstubAllGlobals();
  });
});

function createMockAudioContext(): typeof AudioContext {
  return class MockAudioContext {
    state = 'running';
    currentTime = 0;
    sampleRate = 44100;
    destination = {};
    createGain() {
      const gainParam = {
        setValueAtTime: vi.fn(),
        value: 1,
        cancelScheduledValues: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      };
      return { connect: vi.fn(), disconnect: vi.fn(), gain: gainParam };
    }
    createOscillator() {
      return {
        type: 'sine',
        detune: { value: 0 },
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), value: 440 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
      };
    }
    createBiquadFilter() {
      return {
        type: 'lowpass',
        frequency: { value: 1000, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        Q: { value: 1 },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
    }
    createWaveShaper() {
      return { curve: null, oversample: 'none', connect: vi.fn(), disconnect: vi.fn() };
    }
    createBuffer(_channels: number, length: number) {
      return { length, getChannelData: () => new Float32Array(length) };
    }
    createBufferSource() {
      return {
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
      };
    }
    resume = vi.fn().mockResolvedValue(undefined);
    close = vi.fn().mockResolvedValue(undefined);
  } as unknown as typeof AudioContext;
}
