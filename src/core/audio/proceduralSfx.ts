import type { ProceduralBgm, ProceduralTone } from '@/core/audio/types';

const DEFAULT_ATTACK_MS = 4;
const DEFAULT_DECAY_MS = 40;

function connectTone(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): { stop: () => void } {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const wave = tone.wave ?? 'sine';
  const peak = tone.gain ?? 0.12;
  const attack = (tone.attackMs ?? DEFAULT_ATTACK_MS) / 1000;
  const decay = (tone.decayMs ?? DEFAULT_DECAY_MS) / 1000;
  const duration = tone.durationMs / 1000;

  osc.type = wave as OscillatorType;
  osc.frequency.setValueAtTime(tone.frequency, when);
  if (tone.sweepTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(tone.sweepTo, 1), when + duration);
  }

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(peak, when + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration + decay);

  osc.connect(gain);
  gain.connect(destination);
  osc.start(when);
  osc.stop(when + duration + decay + 0.05);

  return {
    stop: () => {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
      osc.disconnect();
      gain.disconnect();
    },
  };
}

export function playProceduralTone(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
): { stop: () => void } {
  return connectTone(ctx, destination, tone, ctx.currentTime);
}

export function startProceduralBgm(
  ctx: AudioContext,
  destination: AudioNode,
  entry: ProceduralBgm,
): { stop: () => void } {
  const gain = ctx.createGain();
  const peak = entry.gain ?? 0.05;
  gain.gain.value = peak;
  gain.connect(destination);

  const oscillators: OscillatorNode[] = [];
  for (const freq of entry.frequencies) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start();
    oscillators.push(osc);
  }

  let timeout: ReturnType<typeof setTimeout> | null = null;
  if (!entry.loop && entry.durationMs) {
    timeout = setTimeout(() => {
      for (const osc of oscillators) {
        try {
          osc.stop();
        } catch {
          /* noop */
        }
        osc.disconnect();
      }
      gain.disconnect();
    }, entry.durationMs);
  }

  return {
    stop: () => {
      if (timeout) clearTimeout(timeout);
      for (const osc of oscillators) {
        try {
          osc.stop();
        } catch {
          /* noop */
        }
        osc.disconnect();
      }
      gain.disconnect();
    },
  };
}
