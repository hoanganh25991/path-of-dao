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

/** Just-intonation pentatonic — reads as gentle cultivation ambience. */
const PENTATONIC_RATIOS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];

type BgmVoice = { stop: () => void; fadeOut: (sec: number) => void };

type ArpProfile = {
  intervalMs: number;
  noteMs: number;
  gain: number;
  pattern: number[];
};

function pentatonicFromRoot(root: number): number[] {
  return PENTATONIC_RATIOS.map((ratio) => root * ratio);
}

function createPadLayer(
  ctx: AudioContext,
  mix: GainNode,
  freqs: number[],
  padGain: number,
): { nodes: AudioNode[]; stop: () => void } {
  const nodes: AudioNode[] = [];
  const oscillators: OscillatorNode[] = [];
  const detuneSpread = [-5, 0, 5, -3, 3];

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const voiceGain = ctx.createGain();
    osc.type = i === 0 ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    osc.detune.value = detuneSpread[i % detuneSpread.length] ?? 0;
    voiceGain.gain.value = padGain * (i === 0 ? 1 : 0.55 / Math.max(1, i));
    osc.connect(voiceGain);
    voiceGain.connect(mix);
    osc.start();
    oscillators.push(osc);
    nodes.push(osc, voiceGain);
  });

  return {
    nodes,
    stop: () => {
      for (const osc of oscillators) {
        try {
          osc.stop();
        } catch {
          /* noop */
        }
        osc.disconnect();
      }
    },
  };
}

function createFilterBreath(
  ctx: AudioContext,
  filter: BiquadFilterNode,
  baseHz: number,
): { nodes: AudioNode[]; stop: () => void } {
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.035;
  lfoGain.gain.value = baseHz * 0.18;
  filter.frequency.value = baseHz;
  filter.Q.value = 0.45;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();
  return {
    nodes: [lfo, lfoGain],
    stop: () => {
      try {
        lfo.stop();
      } catch {
        /* noop */
      }
      lfo.disconnect();
      lfoGain.disconnect();
    },
  };
}

function createAirLayer(ctx: AudioContext, mix: GainNode, gain: number): { nodes: AudioNode[]; stop: () => void } {
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 4);
  noise.loop = true;
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 680;
  noiseFilter.Q.value = 0.35;
  noiseGain.gain.value = gain;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(mix);
  noise.start();
  return {
    nodes: [noise, noiseFilter, noiseGain],
    stop: () => {
      try {
        noise.stop();
      } catch {
        /* noop */
      }
      noise.disconnect();
      noiseFilter.disconnect();
      noiseGain.disconnect();
    },
  };
}

function createArpeggiator(
  ctx: AudioContext,
  mix: GainNode,
  notes: number[],
  profile: ArpProfile,
): { stop: () => void } {
  let running = true;
  let step = 0;
  const active: OscillatorNode[] = [];

  const playStep = (): void => {
    if (!running) return;
    const noteIndex = profile.pattern[step % profile.pattern.length] ?? 0;
    step += 1;
    const freq = notes[noteIndex % notes.length] ?? notes[0];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteFilter = ctx.createBiquadFilter();
    noteFilter.type = 'lowpass';
    noteFilter.frequency.value = Math.min(freq * 3.5, 2800);
    noteFilter.Q.value = 0.5;
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = ctx.currentTime;
    const noteSec = profile.noteMs / 1000;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(profile.gain, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + noteSec);
    osc.connect(noteFilter);
    noteFilter.connect(gain);
    gain.connect(mix);
    osc.start(t);
    osc.stop(t + noteSec + 0.05);
    active.push(osc);
    if (active.length > 12) {
      const old = active.shift();
      try {
        old?.stop();
      } catch {
        /* noop */
      }
      old?.disconnect();
    }
  };

  playStep();
  const timer = setInterval(playStep, profile.intervalMs);
  return {
    stop: () => {
      running = false;
      clearInterval(timer);
      for (const osc of active) {
        try {
          osc.stop();
        } catch {
          /* noop */
        }
        osc.disconnect();
      }
    },
  };
}

function arpProfileForEntry(entry: ProceduralBgm): ArpProfile {
  const root = entry.frequencies[0] ?? 110;
  if (!entry.loop) {
    return {
      intervalMs: 280,
      noteMs: 520,
      gain: (entry.gain ?? 0.1) * 0.85,
      pattern: [0, 1, 2, 3, 4, 5],
    };
  }
  if (root <= 70) {
    return { intervalMs: 3200, noteMs: 1400, gain: (entry.gain ?? 0.08) * 0.42, pattern: [0, 2, 1, 3, 2, 4, 3, 1] };
  }
  if (root <= 95) {
    return { intervalMs: 2800, noteMs: 1200, gain: (entry.gain ?? 0.08) * 0.48, pattern: [0, 2, 4, 2, 3, 1, 4, 3] };
  }
  return { intervalMs: 3600, noteMs: 1600, gain: (entry.gain ?? 0.07) * 0.45, pattern: [0, 2, 4, 3, 1, 2, 4, 1] };
}

function playVictorySting(
  ctx: AudioContext,
  destination: AudioNode,
  entry: ProceduralBgm,
  fadeInSec: number,
): BgmVoice {
  const master = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 3200;
  filter.Q.value = 0.5;
  const peak = entry.gain ?? 0.1;
  const t0 = ctx.currentTime;
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.linearRampToValueAtTime(peak, t0 + fadeInSec);
  master.connect(filter);
  filter.connect(destination);

  const notes = entry.frequencies.length > 0 ? entry.frequencies : pentatonicFromRoot(262);
  const stoppers: Array<() => void> = [];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const start = t0 + i * 0.32;
    const end = start + 0.55;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak * 0.55, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(end + 0.05);
    stoppers.push(() => {
      try {
        osc.stop();
      } catch {
        /* noop */
      }
      osc.disconnect();
      gain.disconnect();
    });
  });

  const durationMs = entry.durationMs ?? 3000;
  const timeout = setTimeout(() => {
    const fadeT = ctx.currentTime;
    master.gain.cancelScheduledValues(fadeT);
    master.gain.setValueAtTime(master.gain.value, fadeT);
    master.gain.linearRampToValueAtTime(0.0001, fadeT + 0.5);
    setTimeout(() => stopAll(), 520);
  }, durationMs);

  const stopAll = (): void => {
    clearTimeout(timeout);
    for (const stop of stoppers) stop();
    filter.disconnect();
    master.disconnect();
  };

  return {
    stop: stopAll,
    fadeOut: (sec: number) => {
      const fadeT = ctx.currentTime;
      master.gain.cancelScheduledValues(fadeT);
      master.gain.setValueAtTime(master.gain.value, fadeT);
      master.gain.linearRampToValueAtTime(0.0001, fadeT + sec);
      setTimeout(() => stopAll(), sec * 1000 + 50);
    },
  };
}

export function startProceduralBgm(
  ctx: AudioContext,
  destination: AudioNode,
  entry: ProceduralBgm,
  fadeInSec = 0.8,
): BgmVoice {
  if (!entry.loop) {
    return playVictorySting(ctx, destination, entry, fadeInSec);
  }

  const root = entry.frequencies[0] ?? 110;
  const padFreqs = entry.frequencies.length >= 2 ? entry.frequencies : [root, root * 3 / 2, root * 2];
  const arpNotes = pentatonicFromRoot(root);
  const peak = entry.gain ?? 0.06;

  const master = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  const t0 = ctx.currentTime;
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.linearRampToValueAtTime(peak, t0 + fadeInSec);
  master.connect(filter);
  filter.connect(destination);

  const pad = createPadLayer(ctx, master, padFreqs, 0.38);
  const breath = createFilterBreath(ctx, filter, root <= 80 ? 1100 : 1500);
  const air = createAirLayer(ctx, master, peak * 0.04);
  const arp = createArpeggiator(ctx, master, arpNotes, arpProfileForEntry(entry));

  const stopAll = (): void => {
    arp.stop();
    pad.stop();
    breath.stop();
    air.stop();
    filter.disconnect();
    master.disconnect();
  };

  return {
    stop: stopAll,
    fadeOut: (sec: number) => {
      const fadeT = ctx.currentTime;
      master.gain.cancelScheduledValues(fadeT);
      master.gain.setValueAtTime(master.gain.value, fadeT);
      master.gain.linearRampToValueAtTime(0.0001, fadeT + sec);
      setTimeout(() => stopAll(), sec * 1000 + 80);
    },
  };
}
