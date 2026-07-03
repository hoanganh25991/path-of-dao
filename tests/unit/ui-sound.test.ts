/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { AudioDirector } from '@/core/audio/AudioDirector';
import { AudioManager } from '@/core/audio/AudioManager';
import { mountUiSounds } from '@/core/audio/UiSound';
import { SaveManager } from '@/core/save/SaveManager';

describe('UiSound', () => {
  beforeEach(() => {
    AudioManager.resetForTests();
    document.body.innerHTML = '<div id="app"><button type="button">Tap</button></div>';
  });

  afterEach(() => {
    AudioManager.resetForTests();
  });

  it('fires ui tap on interactive click after unlock', async () => {
    vi.stubGlobal('AudioContext', createMockAudioContext());
    AudioManager.init(SaveManager.createNew());
    await AudioManager.unlock();
    const playSpy = vi.spyOn(AudioDirector, 'playUiTap');

    const root = document.getElementById('app')!;
    const unmount = mountUiSounds(root);
    root.querySelector('button')!.click();
    expect(playSpy).toHaveBeenCalledTimes(1);

    unmount();
    playSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('skips the audio unlock overlay button', async () => {
    vi.stubGlobal('AudioContext', createMockAudioContext());
    AudioManager.init(SaveManager.createNew());
    await AudioManager.unlock();
    const playSpy = vi.spyOn(AudioDirector, 'playUiTap');

    const root = document.getElementById('app')!;
    const overlay = document.createElement('button');
    overlay.id = 'audio-unlock-overlay';
    overlay.textContent = 'Enable sound';
    root.appendChild(overlay);

    const unmount = mountUiSounds(root);
    overlay.click();
    expect(playSpy).not.toHaveBeenCalled();

    unmount();
    playSpy.mockRestore();
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
      return {
        connect: vi.fn(),
        disconnect: vi.fn(),
        gain: {
          setValueAtTime: vi.fn(),
          value: 1,
          cancelScheduledValues: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
      };
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
      return { buffer: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn() };
    }
    resume = vi.fn().mockResolvedValue(undefined);
    close = vi.fn().mockResolvedValue(undefined);
  } as unknown as typeof AudioContext;
}
