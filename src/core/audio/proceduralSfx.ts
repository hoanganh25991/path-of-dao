import type { ProceduralBgm, ProceduralTone } from '@/core/audio/types';

const DEFAULT_ATTACK_MS = 6;
const DEFAULT_DECAY_MS = 48;

/** Soft clipper — tames harsh square/saw waves without audible distortion. */
function createSoftClipper(ctx: AudioContext): WaveShaperNode {
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1;
    curve[i] = Math.tanh(x * 1.8) * 0.85;
  }
  const node = ctx.createWaveShaper();
  node.curve = curve;
  node.oversample = '2x';
  return node;
}

function createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function connectTone(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): { stop: () => void } {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const clipper = createSoftClipper(ctx);
  const wave = tone.wave ?? 'sine';
  const peak = tone.gain ?? 0.12;
  const attack = (tone.attackMs ?? DEFAULT_ATTACK_MS) / 1000;
  const decay = (tone.decayMs ?? DEFAULT_DECAY_MS) / 1000;
  const duration = tone.durationMs / 1000;
  const end = when + duration + decay;

  osc.type = wave as OscillatorType;
  osc.frequency.setValueAtTime(tone.frequency, when);
  if (tone.sweepTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(tone.sweepTo, 1), when + duration);
  }

  // Warm up harsh waves with a lowpass; keep sines bright.
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  if (wave === 'sine') {
    filter.frequency.value = 6000;
    filter.Q.value = 0.5;
  } else if (wave === 'triangle') {
    filter.frequency.value = 3200;
    filter.Q.value = 0.7;
  } else {
    filter.frequency.setValueAtTime(Math.min(tone.frequency * 4, 2400), when);
    filter.frequency.exponentialRampToValueAtTime(400, end);
    filter.Q.value = 1.2;
  }

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(peak, when + attack);
  gain.gain.setValueAtTime(peak * 0.65, when + duration * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(clipper);
  clipper.connect(destination);
  osc.start(when);
  osc.stop(end + 0.05);

  const nodes: AudioNode[] = [osc, filter, gain, clipper];

  // Short transient noise layer for impacts — adds body without buzz.
  if (duration <= 0.22 && wave !== 'sine') {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, duration + decay);
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = Math.min(tone.frequency * 2.5, 1800);
    noiseFilter.Q.value = 0.9;
    const noisePeak = peak * 0.35;
    noiseGain.gain.setValueAtTime(0.0001, when);
    noiseGain.gain.linearRampToValueAtTime(noisePeak, when + attack * 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, end);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(clipper);
    noise.start(when);
    noise.stop(end + 0.05);
    nodes.push(noise, noiseFilter, noiseGain);
  }

  return {
    stop: () => {
      for (const node of nodes) {
        try {
          if ('stop' in node && typeof node.stop === 'function') node.stop();
        } catch {
          /* already stopped */
        }
        node.disconnect();
      }
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
  const master = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1400;
  filter.Q.value = 0.6;

  const peak = entry.gain ?? 0.05;
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.8);
  master.connect(filter);
  filter.connect(destination);

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = peak * 0.12;
  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  lfo.start();

  const oscillators: OscillatorNode[] = [];
  const detuneSpread = [-7, 0, 7, -4, 4];
  entry.frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = i === 0 ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    osc.detune.value = detuneSpread[i % detuneSpread.length] ?? 0;
    osc.connect(master);
    osc.start();
    oscillators.push(osc);
  });

  let timeout: ReturnType<typeof setTimeout> | null = null;
  if (!entry.loop && entry.durationMs) {
    timeout = setTimeout(() => {
      const fadeOut = ctx.currentTime;
      master.gain.cancelScheduledValues(fadeOut);
      master.gain.setValueAtTime(master.gain.value, fadeOut);
      master.gain.linearRampToValueAtTime(0.0001, fadeOut + 0.4);
      setTimeout(() => stopAll(), 450);
    }, entry.durationMs);
  }

  const stopAll = (): void => {
    if (timeout) clearTimeout(timeout);
    try {
      lfo.stop();
    } catch {
      /* noop */
    }
    lfo.disconnect();
    lfoGain.disconnect();
    for (const osc of oscillators) {
      try {
        osc.stop();
      } catch {
        /* noop */
      }
      osc.disconnect();
    }
    filter.disconnect();
    master.disconnect();
  };

  return { stop: stopAll };
}
