export interface SanityState {
  sanity: number;
  error: string | null;
  webglSupported: boolean;
}

export interface SanityColors {
  green: string;
  yellow: string;
  orange: string;
  red: string;
}

export interface SanityLabels {
  coherent: string;
  stable: string;
  fractured: string;
  chaotic: string;
}

export interface SanityDescriptions {
  coherent: string;
  stable: string;
  fractured: string;
  chaotic: string;
}

export interface SanityGradients {
  coherent: string;
  stable: string;
  fractured: string;
  chaotic: string;
}

export interface ParticleData {
  radius: number;
  theta: number;
  phi: number;
  speed: number;
  orbitSpeed: number;
  verticalSpeed: number;
}

export interface StarFieldConfig {
  count: number;
  size: number;
  distance: number;
  speed: number;
}

export interface SanityPreset {
  label: string;
  value: number;
}

// Opening Animation Types
export interface AnimationPhase {
  start: number;
  duration: number;
}

export interface OpeningAnimationConfig {
  totalDuration: number;
  phases: {
    glowExpand: AnimationPhase;
    particlesSwirl: AnimationPhase;
    colorSync: AnimationPhase;
    textAppear: AnimationPhase;
    stabilization: AnimationPhase;
  };
  particleCount: number;
  glowScale: {
    initial: number;
    max: number;
  };
  orbOpacity: {
    max: number;
  };
  targetColor: string;
  cameraMovement: {
    amplitude: number;
    speed: number;
  };
}

export interface ParticleTarget {
  x: number;
  y: number;
  z: number;
}

export interface OpeningAnimationProps {
  onComplete: () => void;
}