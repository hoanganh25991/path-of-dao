export type OscillatorWave = 'sine' | 'square' | 'triangle' | 'sawtooth';

/** Rich synthesis profile — replaces bare beeps until OGG assets ship. */
export type ProceduralPreset =
  | 'impact-light'
  | 'impact-heavy'
  | 'impact-crit'
  | 'skill-cast'
  | 'death-dissolve'
  | 'ui-blip'
  | 'ui-panel'
  | 'ui-sting'
  | 'loot-spark';

export type BgmMood = 'home' | 'explore' | 'combat' | 'boss' | 'story' | 'melancholy';

export type ProceduralTone = {
  type: 'procedural';
  frequency: number;
  durationMs: number;
  wave?: OscillatorWave;
  gain?: number;
  attackMs?: number;
  decayMs?: number;
  sweepTo?: number;
  preset?: ProceduralPreset;
};

export type ProceduralBgm = {
  type: 'procedural';
  loop?: boolean;
  frequencies: number[];
  gain?: number;
  durationMs?: number;
  mood?: BgmMood;
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
