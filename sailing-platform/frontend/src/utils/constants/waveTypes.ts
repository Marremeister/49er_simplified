// src/utils/constants/waveTypes.ts
export const WAVE_TYPES = ['Flat', 'Choppy', 'Medium', 'Large'] as const;
export type WaveTypeConstant = typeof WAVE_TYPES[number];

export const TENSION_LEVELS = ['Loose', 'Medium', 'Tight'] as const;
export type TensionLevelConstant = typeof TENSION_LEVELS[number];