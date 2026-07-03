export type OscillatorWave = 'sine' | 'square' | 'triangle' | 'sawtooth';

export type ProceduralTone = {
  type: 'procedural';
  frequency: number;
  durationMs: number;
  wave?: OscillatorWave;
  gain?: number;
  attackMs?: number;
  decayMs?: number;
  sweepTo?: number;
};

export type ProceduralBgm = {
  type: 'procedural';
  loop?: boolean;
  frequencies: number[];
  gain?: number;
  durationMs?: number;
};

export type FileAudio = {
  type: 'file';
  paths: { ogg?: string; mp3?: string };
  gain?: number;
  loop?: boolean;
};

export type SfxEntry = ProceduralTone | FileAudio;
export type BgmEntry = ProceduralBgm | FileAudio;

export type AudioManifest = {
  version: number;
  bgm: Record<string, BgmEntry>;
  sfx: Record<string, SfxEntry>;
};

export type AudioBusId = 'music' | 'sfx' | 'ui';
