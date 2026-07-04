import type { BgmMood, ProceduralBgm, ProceduralPreset, ProceduralTone } from '@/core/audio/types';

const DEFAULT_ATTACK_MS = 6;
const DEFAULT_DECAY_MS = 48;

type Voice = { stop: () => void };

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

function scheduleGainEnvelope(
  gain: GainNode,
  when: number,
  peak: number,
  attackSec: number,
  holdSec: number,
  decaySec: number,
): void {
  const end = when + attackSec + holdSec + decaySec;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(peak, when + attackSec);
  if (holdSec > 0) {
    gain.gain.setValueAtTime(peak * 0.72, when + attackSec + holdSec * 0.4);
  }
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
}

function playImpactLight(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): Voice {
  const peak = tone.gain ?? 0.16;
  const duration = tone.durationMs / 1000;
  const clipper = createSoftClipper(ctx);
  clipper.connect(destination);
  const nodes: AudioNode[] = [clipper];

  const body = ctx.createOscillator();
  const bodyGain = ctx.createGain();
  const bodyFilter = ctx.createBiquadFilter();
  body.type = 'triangle';
  body.frequency.setValueAtTime(tone.frequency, when);
  body.frequency.exponentialRampToValueAtTime(Math.max(tone.frequency * 0.55, 40), when + duration);
  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.value = 2200;
  scheduleGainEnvelope(bodyGain, when, peak, 0.004, duration * 0.25, duration * 0.7);
  body.connect(bodyFilter);
  bodyFilter.connect(bodyGain);
  bodyGain.connect(clipper);
  body.start(when);
  body.stop(when + duration + 0.08);
  nodes.push(body, bodyFilter, bodyGain);

  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, duration + 0.05);
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = Math.min(tone.frequency * 2.2, 1600);
  noiseFilter.Q.value = 1.1;
  scheduleGainEnvelope(noiseGain, when, peak * 0.55, 0.002, duration * 0.08, duration * 0.55);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(clipper);
  noise.start(when);
  noise.stop(when + duration + 0.06);
  nodes.push(noise, noiseFilter, noiseGain);

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

function playImpactHeavy(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): Voice {
  const peak = tone.gain ?? 0.2;
  const duration = tone.durationMs / 1000;
  const clipper = createSoftClipper(ctx);
  clipper.connect(destination);
  const nodes: AudioNode[] = [clipper];

  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(Math.max(tone.frequency * 0.5, 55), when);
  sub.frequency.exponentialRampToValueAtTime(42, when + duration);
  scheduleGainEnvelope(subGain, when, peak * 0.85, 0.006, duration * 0.35, duration * 0.85);
  sub.connect(subGain);
  subGain.connect(clipper);
  sub.start(when);
  sub.stop(when + duration + 0.1);
  nodes.push(sub, subGain);

  const snap = ctx.createOscillator();
  const snapGain = ctx.createGain();
  const snapFilter = ctx.createBiquadFilter();
  snap.type = 'sawtooth';
  snap.frequency.setValueAtTime(tone.frequency, when);
  snap.frequency.exponentialRampToValueAtTime(Math.max(tone.frequency * 0.35, 50), when + duration * 0.6);
  snapFilter.type = 'lowpass';
  snapFilter.frequency.setValueAtTime(2800, when);
  snapFilter.frequency.exponentialRampToValueAtTime(320, when + duration);
  scheduleGainEnvelope(snapGain, when, peak * 0.55, 0.003, duration * 0.12, duration * 0.65);
  snap.connect(snapFilter);
  snapFilter.connect(snapGain);
  snapGain.connect(clipper);
  snap.start(when);
  snap.stop(when + duration + 0.08);
  nodes.push(snap, snapFilter, snapGain);

  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, duration + 0.06);
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 900;
  scheduleGainEnvelope(noiseGain, when, peak * 0.42, 0.002, duration * 0.06, duration * 0.5);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(clipper);
  noise.start(when);
  noise.stop(when + duration + 0.06);
  nodes.push(noise, noiseFilter, noiseGain);

  return {
    stop: () => {
      for (const node of nodes) {
        try {
          if ('stop' in node && typeof node.stop === 'function') node.stop();
        } catch {
          /* noop */
        }
        node.disconnect();
      }
    },
  };
}

function playImpactCrit(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): Voice {
  const heavy = playImpactHeavy(ctx, destination, { ...tone, gain: (tone.gain ?? 0.22) * 1.08 }, when);
  const peak = (tone.gain ?? 0.22) * 0.45;
  const duration = Math.min(tone.durationMs, 140) / 1000;
  const clipper = createSoftClipper(ctx);
  clipper.connect(destination);

  const shimmer = ctx.createOscillator();
  const shimmerGain = ctx.createGain();
  const shimmerFilter = ctx.createBiquadFilter();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(tone.frequency * 1.5, when + 0.012);
  shimmer.frequency.exponentialRampToValueAtTime(tone.frequency * 3.2, when + duration);
  shimmerFilter.type = 'bandpass';
  shimmerFilter.frequency.value = 2400;
  shimmerFilter.Q.value = 0.8;
  scheduleGainEnvelope(shimmerGain, when + 0.012, peak, 0.008, duration * 0.35, duration * 0.75);
  shimmer.connect(shimmerFilter);
  shimmerFilter.connect(shimmerGain);
  shimmerGain.connect(clipper);
  shimmer.start(when + 0.012);
  shimmer.stop(when + duration + 0.1);

  return {
    stop: () => {
      heavy.stop();
      try {
        shimmer.stop();
      } catch {
        /* noop */
      }
      shimmer.disconnect();
      shimmerFilter.disconnect();
      shimmerGain.disconnect();
      clipper.disconnect();
    },
  };
}

function playSkillCast(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): Voice {
  const peak = tone.gain ?? 0.2;
  const duration = tone.durationMs / 1000;
  const clipper = createSoftClipper(ctx);
  clipper.connect(destination);
  const nodes: AudioNode[] = [clipper];
  const wave = tone.wave ?? 'triangle';
  const sweepTarget = tone.sweepTo ?? tone.frequency * 0.65;

  const lead = ctx.createOscillator();
  const leadGain = ctx.createGain();
  const leadFilter = ctx.createBiquadFilter();
  lead.type = wave;
  lead.frequency.setValueAtTime(tone.frequency, when);
  lead.frequency.exponentialRampToValueAtTime(Math.max(sweepTarget, 40), when + duration * 0.85);
  leadFilter.type = 'lowpass';
  leadFilter.frequency.setValueAtTime(Math.min(tone.frequency * 5, 4200), when);
  leadFilter.frequency.exponentialRampToValueAtTime(600, when + duration);
  scheduleGainEnvelope(leadGain, when, peak, 0.012, duration * 0.55, duration * 0.45);
  lead.connect(leadFilter);
  leadFilter.connect(leadGain);
  leadGain.connect(clipper);
  lead.start(when);
  lead.stop(when + duration + 0.08);
  nodes.push(lead, leadFilter, leadGain);

  const harmonic = ctx.createOscillator();
  const harmonicGain = ctx.createGain();
  harmonic.type = 'sine';
  harmonic.frequency.setValueAtTime(tone.frequency * 2, when);
  if (tone.sweepTo !== undefined) {
    harmonic.frequency.exponentialRampToValueAtTime(Math.max(tone.sweepTo * 1.8, 80), when + duration);
  }
  scheduleGainEnvelope(harmonicGain, when + 0.02, peak * 0.28, 0.02, duration * 0.4, duration * 0.55);
  harmonic.connect(harmonicGain);
  harmonicGain.connect(clipper);
  harmonic.start(when + 0.02);
  harmonic.stop(when + duration + 0.06);
  nodes.push(harmonic, harmonicGain);

  if (wave === 'square' || wave === 'sawtooth') {
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = 'sine';
    rumble.frequency.value = Math.max(tone.frequency * 0.45, 45);
    scheduleGainEnvelope(rumbleGain, when, peak * 0.35, 0.015, duration * 0.6, duration * 0.5);
    rumble.connect(rumbleGain);
    rumbleGain.connect(clipper);
    rumble.start(when);
    rumble.stop(when + duration + 0.08);
    nodes.push(rumble, rumbleGain);
  }

  return {
    stop: () => {
      for (const node of nodes) {
        try {
          if ('stop' in node && typeof node.stop === 'function') node.stop();
        } catch {
          /* noop */
        }
        node.disconnect();
      }
    },
  };
}

function playDeathDissolve(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): Voice {
  const peak = tone.gain ?? 0.18;
  const duration = tone.durationMs / 1000;
  const clipper = createSoftClipper(ctx);
  clipper.connect(destination);
  const nodes: AudioNode[] = [clipper];
  const sweepTarget = tone.sweepTo ?? tone.frequency * 0.35;

  const body = ctx.createOscillator();
  const bodyGain = ctx.createGain();
  const bodyFilter = ctx.createBiquadFilter();
  body.type = 'triangle';
  body.frequency.setValueAtTime(tone.frequency, when);
  body.frequency.exponentialRampToValueAtTime(Math.max(sweepTarget, 35), when + duration);
  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.setValueAtTime(1800, when);
  bodyFilter.frequency.exponentialRampToValueAtTime(280, when + duration);
  scheduleGainEnvelope(bodyGain, when, peak, 0.008, duration * 0.45, duration * 0.75);
  body.connect(bodyFilter);
  bodyFilter.connect(bodyGain);
  bodyGain.connect(clipper);
  body.start(when);
  body.stop(when + duration + 0.1);
  nodes.push(body, bodyFilter, bodyGain);

  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, duration + 0.08);
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(900, when);
  noiseFilter.frequency.exponentialRampToValueAtTime(220, when + duration);
  scheduleGainEnvelope(noiseGain, when + 0.04, peak * 0.38, 0.02, duration * 0.35, duration * 0.8);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(clipper);
  noise.start(when + 0.04);
  noise.stop(when + duration + 0.08);
  nodes.push(noise, noiseFilter, noiseGain);

  return {
    stop: () => {
      for (const node of nodes) {
        try {
          if ('stop' in node && typeof node.stop === 'function') node.stop();
        } catch {
          /* noop */
        }
        node.disconnect();
      }
    },
  };
}

function playUiBlip(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): Voice {
  const peak = tone.gain ?? 0.14;
  const notes = [tone.frequency, tone.frequency * 1.26];
  const nodes: AudioNode[] = [];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = when + i * 0.028;
    osc.type = 'sine';
    osc.frequency.value = freq;
    scheduleGainEnvelope(gain, start, peak * (i === 0 ? 1 : 0.72), 0.003, 0.022, 0.035);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(start);
    osc.stop(start + 0.09);
    nodes.push(osc, gain);
  });

  return {
    stop: () => {
      for (const node of nodes) {
        try {
          if ('stop' in node && typeof node.stop === 'function') node.stop();
        } catch {
          /* noop */
        }
        node.disconnect();
      }
    },
  };
}

function playUiPanel(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): Voice {
  const peak = tone.gain ?? 0.13;
  const notes = [tone.frequency * 0.85, tone.frequency, tone.frequency * 1.19];
  const nodes: AudioNode[] = [];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const start = when + i * 0.045;
    osc.type = 'triangle';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = 3200;
    scheduleGainEnvelope(gain, start, peak * (0.85 + i * 0.08), 0.006, 0.04, 0.07);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc.start(start);
    osc.stop(start + 0.14);
    nodes.push(osc, filter, gain);
  });

  return {
    stop: () => {
      for (const node of nodes) {
        try {
          if ('stop' in node && typeof node.stop === 'function') node.stop();
        } catch {
          /* noop */
        }
        node.disconnect();
      }
    },
  };
}

function playUiSting(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): Voice {
  const peak = tone.gain ?? 0.2;
  const duration = tone.durationMs / 1000;
  const base = tone.frequency;
  const ratios = tone.sweepTo !== undefined
    ? [1, 1.25, 1.5, tone.sweepTo / base]
    : [1, 5 / 4, 3 / 2, 2];
  const nodes: AudioNode[] = [];

  ratios.forEach((ratio, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const start = when + i * 0.09;
    const noteDur = Math.min(0.38, duration * 0.45);
    osc.type = i >= 2 ? 'triangle' : 'sine';
    osc.frequency.value = base * ratio;
    filter.type = 'lowpass';
    filter.frequency.value = 4200;
    scheduleGainEnvelope(gain, start, peak * (0.75 + i * 0.08), 0.012, noteDur * 0.55, noteDur * 0.65);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc.start(start);
    osc.stop(start + noteDur + 0.06);
    nodes.push(osc, filter, gain);
  });

  return {
    stop: () => {
      for (const node of nodes) {
        try {
          if ('stop' in node && typeof node.stop === 'function') node.stop();
        } catch {
          /* noop */
        }
        node.disconnect();
      }
    },
  };
}

function playLootSpark(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): Voice {
  const peak = tone.gain ?? 0.12;
  const notes = [tone.frequency * 1.5, tone.frequency * 2];
  const nodes: AudioNode[] = [];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = when + i * 0.018;
    osc.type = 'sine';
    osc.frequency.value = freq;
    scheduleGainEnvelope(gain, start, peak * (1 - i * 0.25), 0.002, 0.03, 0.06);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(start);
    osc.stop(start + 0.1);
    nodes.push(osc, gain);
  });

  return {
    stop: () => {
      for (const node of nodes) {
        try {
          if ('stop' in node && typeof node.stop === 'function') node.stop();
        } catch {
          /* noop */
        }
        node.disconnect();
      }
    },
  };
}

function playPresetTone(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): Voice {
  const preset = tone.preset as ProceduralPreset;
  switch (preset) {
    case 'impact-light':
      return playImpactLight(ctx, destination, tone, when);
    case 'impact-heavy':
      return playImpactHeavy(ctx, destination, tone, when);
    case 'impact-crit':
      return playImpactCrit(ctx, destination, tone, when);
    case 'skill-cast':
      return playSkillCast(ctx, destination, tone, when);
    case 'death-dissolve':
      return playDeathDissolve(ctx, destination, tone, when);
    case 'ui-blip':
      return playUiBlip(ctx, destination, tone, when);
    case 'ui-panel':
      return playUiPanel(ctx, destination, tone, when);
    case 'ui-sting':
      return playUiSting(ctx, destination, tone, when);
    case 'loot-spark':
      return playLootSpark(ctx, destination, tone, when);
    default:
      return connectTone(ctx, destination, tone, when);
  }
}

function connectTone(
  ctx: AudioContext,
  destination: AudioNode,
  tone: ProceduralTone,
  when: number,
): Voice {
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
): Voice {
  const when = ctx.currentTime;
  if (tone.preset) {
    return playPresetTone(ctx, destination, tone, when);
  }
  return connectTone(ctx, destination, tone, when);
}

/** Just-intonation pentatonic — reads as gentle cultivation ambience. */
const PENTATONIC_RATIOS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];

type BgmVoice = { stop: () => void; fadeOut: (sec: number) => void };

type ArpProfile = {
  intervalMs: number;
  noteMs: number;
  gain: number;
  pattern: number[];
  pluck?: boolean;
};

function pentatonicFromRoot(root: number): number[] {
  return PENTATONIC_RATIOS.map((ratio) => root * ratio);
}

function createPadLayer(
  ctx: AudioContext,
  mix: GainNode,
  freqs: number[],
  padGain: number,
  mood: BgmMood,
): { nodes: AudioNode[]; stop: () => void } {
  const nodes: AudioNode[] = [];
  const oscillators: OscillatorNode[] = [];
  const detuneSpread = [-5, 0, 5, -3, 3];
  const waveForMood: Record<BgmMood, OscillatorType> = {
    home: 'triangle',
    explore: 'sine',
    melancholy: 'sine',
    combat: 'triangle',
    boss: 'sawtooth',
    story: 'sine',
  };

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const voiceGain = ctx.createGain();
    osc.type = i === 0 ? waveForMood[mood] : 'sine';
    osc.frequency.value = freq;
    osc.detune.value = detuneSpread[i % detuneSpread.length] ?? 0;
    const weight = mood === 'boss' ? (i === 0 ? 1 : 0.42 / Math.max(1, i)) : (i === 0 ? 1 : 0.55 / Math.max(1, i));
    voiceGain.gain.value = padGain * weight;
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
  mood: BgmMood,
): { nodes: AudioNode[]; stop: () => void } {
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  const lfoRate = mood === 'boss' ? 0.12 : mood === 'combat' ? 0.06 : 0.035;
  lfo.frequency.value = lfoRate;
  lfoGain.gain.value = baseHz * (mood === 'boss' ? 0.28 : 0.18);
  filter.frequency.value = baseHz;
  filter.Q.value = mood === 'combat' || mood === 'boss' ? 0.65 : 0.45;
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

function createAirLayer(ctx: AudioContext, mix: GainNode, gain: number, mood: BgmMood): { nodes: AudioNode[]; stop: () => void } {
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 4);
  noise.loop = true;
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = mood === 'melancholy' ? 520 : mood === 'boss' ? 820 : 680;
  noiseFilter.Q.value = mood === 'melancholy' ? 0.28 : 0.35;
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
    const freq = notes[noteIndex % notes.length] ?? notes[0] ?? 220;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteFilter = ctx.createBiquadFilter();
    noteFilter.type = 'lowpass';
    noteFilter.frequency.value = Math.min(freq * 3.5, 2800);
    noteFilter.Q.value = 0.5;
    osc.type = profile.pluck ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    const t = ctx.currentTime;
    const noteSec = profile.noteMs / 1000;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(profile.gain, t + (profile.pluck ? 0.012 : 0.04));
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

function resolveBgmMood(entry: ProceduralBgm): BgmMood {
  if (entry.mood) return entry.mood;
  const root = entry.frequencies[0] ?? 110;
  if (!entry.loop) return 'story';
  if (root <= 70) return 'boss';
  if (root <= 95) return 'combat';
  return 'home';
}

function arpProfileForMood(entry: ProceduralBgm, mood: BgmMood): ArpProfile {
  const peak = entry.gain ?? 0.08;
  if (!entry.loop) {
    return {
      intervalMs: 280,
      noteMs: 520,
      gain: peak * 0.85,
      pattern: [0, 1, 2, 3, 4, 5],
    };
  }

  switch (mood) {
    case 'home':
      return {
        intervalMs: 4200,
        noteMs: 1800,
        gain: peak * 0.52,
        pattern: [0, 2, 4, 2, 3, 1, 4, 1],
        pluck: true,
      };
    case 'explore':
    case 'melancholy':
      return {
        intervalMs: 5200,
        noteMs: 2200,
        gain: peak * 0.38,
        pattern: [0, 2, 1, 4, 2, 3, 0, 4],
        pluck: true,
      };
    case 'combat':
      return {
        intervalMs: 2400,
        noteMs: 900,
        gain: peak * 0.44,
        pattern: [0, 2, 1, 3, 2, 4, 1, 3],
      };
    case 'boss':
      return {
        intervalMs: 1800,
        noteMs: 700,
        gain: peak * 0.5,
        pattern: [0, 1, 0, 2, 1, 3, 2, 4],
      };
    case 'story':
      return {
        intervalMs: 3600,
        noteMs: 1600,
        gain: peak * 0.45,
        pattern: [0, 2, 4, 3, 1, 2, 4, 1],
      };
    default:
      return {
        intervalMs: 3200,
        noteMs: 1400,
        gain: peak * 0.42,
        pattern: [0, 2, 1, 3, 2, 4, 3, 1],
      };
  }
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

  const mood = resolveBgmMood(entry);
  const root = entry.frequencies[0] ?? 110;
  const padFreqs = entry.frequencies.length >= 2 ? entry.frequencies : [root, root * 3 / 2, root * 2];
  const arpNotes = pentatonicFromRoot(root);
  const peak = entry.gain ?? 0.06;
  const padMix = mood === 'boss' ? 0.48 : mood === 'combat' ? 0.42 : 0.38;

  const master = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  const t0 = ctx.currentTime;
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.linearRampToValueAtTime(peak, t0 + fadeInSec);
  master.connect(filter);
  filter.connect(destination);

  const filterBase = mood === 'boss' ? 900 : mood === 'combat' ? 1300 : mood === 'melancholy' ? 1200 : 1500;
  const pad = createPadLayer(ctx, master, padFreqs, padMix, mood);
  const breath = createFilterBreath(ctx, filter, filterBase, mood);
  const air = createAirLayer(ctx, master, peak * (mood === 'melancholy' ? 0.06 : 0.04), mood);
  const arp = createArpeggiator(ctx, master, arpNotes, arpProfileForMood(entry, mood));

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
