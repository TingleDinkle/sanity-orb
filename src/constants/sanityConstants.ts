import { SanityColors, SanityLabels, SanityDescriptions, SanityGradients, StarFieldConfig, SanityPreset } from '../types/sanity';

export const SANITY_COLORS: SanityColors = {
  green: '#00ff88',
  yellow: '#ffdd00',
  orange: '#ff6600',
  red: '#ff0033'
};

export const SANITY_LABELS: SanityLabels = {
  coherent: 'Coherent',
  stable: 'Stable',
  fractured: 'Fractured',
  chaotic: 'Chaotic'
};

export const SANITY_DESCRIPTIONS: SanityDescriptions = {
  coherent: 'All systems harmonized · Neural pathways aligned',
  stable: 'Minor fluctuations detected · Maintaining stability',
  fractured: 'Significant instability present · Pattern degradation',
  chaotic: 'Critical coherence failure · Reality breakdown imminent'
};

export const SANITY_GRADIENTS: SanityGradients = {
  coherent: 'from-emerald-500/20 to-green-500/20',
  stable: 'from-yellow-500/20 to-amber-500/20',
  fractured: 'from-orange-500/20 to-amber-600/20',
  chaotic: 'from-red-600/20 to-rose-700/20'
};

export const STAR_FIELD_CONFIGS: StarFieldConfig[] = [
  { count: 1500, size: 0.15, distance: 80, speed: 0.0001 },
  { count: 800, size: 0.25, distance: 60, speed: 0.00015 },
  { count: 400, size: 0.35, distance: 40, speed: 0.0002 }
];

export const SANITY_PRESETS: SanityPreset[] = [
  { label: 'Peak', value: 100 },
  { label: 'Nominal', value: 75 },
  { label: 'Warning', value: 40 },
  { label: 'Critical', value: 10 }
];

export const PARTICLE_COUNT = 150;
export const ORB_RADIUS = 1.8;
export const GLOW_RADIUS = 2.2;
export const CAMERA_DISTANCE = 6;
