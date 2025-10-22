import { SanityColors, SanityLabels, SanityDescriptions, SanityGradients, StarFieldConfig, SanityPreset } from '../types/sanity';

export const SANITY_COLORS: SanityColors = {
  green: '#00ff88',
  yellow: '#ffdd00',
  orange: '#ff6600',
  red: '#ff0033'
};

export const SANITY_LABELS: SanityLabels = {
  coherent: 'Digital Harmony',
  stable: 'Network Stable',
  fractured: 'Data Fragmented',
  chaotic: 'Digital Chaos'
};

export const SANITY_DESCRIPTIONS: SanityDescriptions = {
  coherent: 'Digital consciousness perfectly aligned · All data streams flowing harmoniously',
  stable: 'Network stability maintained · Minor digital fluctuations detected',
  fractured: 'Data integrity compromised · Network fragmentation detected · "Have you tried turning it off and on again?"',
  chaotic: 'Critical digital breakdown · Internet consciousness destabilized · "Error 404: Sanity not found" · "The internet is having a bad day"'
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
  { label: 'Nominal', value: 50 },
  { label: 'Warning', value: 25 },
  { label: 'Critical', value: 10 }
];

export const PARTICLE_COUNT = 120;
export const ORB_RADIUS = 1.8;
export const GLOW_RADIUS = 2.2;
export const CAMERA_DISTANCE = 6;

// Mind Assembly Animation Constants - Optimized for smoother transitions
export const MIND_ASSEMBLY_CONFIG = {
  totalDuration: 10.0, // Extended for loading animation
  phases: {
    coreAwaken: { start: 0, duration: 1.5 },
    nodesConverge: { start: 1.0, duration: 3.5 },
    networkForm: { start: 2.5, duration: 3.5 }, // Extended to fully form network
    loadingAnimation: { start: 6.0, duration: 2.0 }, // New loading phase - longer and smoother
    convergence: { start: 8.0, duration: 1.2 }, // Faster convergence
    textStabilization: { start: 9.0, duration: 0.8 }, // Text appears
    finalState: { start: 9.8, duration: 0.2 } // Quick fade
  },
  nodeCount: 80,
  coreScale: { initial: 0.5, max: 1.0 },
  glowRadius: 3.5,
  orbRadius: 1.8,
  targetColor: '#00ff88',
  cameraMovement: { amplitude: 0.3, speed: 0.15 }
};