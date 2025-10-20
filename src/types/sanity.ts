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

// Mind Assembly Animation Types
export interface AnimationPhase {
  start: number;
  duration: number;
}

export interface MindAssemblyConfig {
  totalDuration: number;
  phases: {
    coreAwaken: AnimationPhase;
    nodesConverge: AnimationPhase;
    networkForm: AnimationPhase;
    convergence: AnimationPhase;
    textStabilization: AnimationPhase;
    finalState: AnimationPhase;
  };
  nodeCount: number;
  coreScale: {
    initial: number;
    max: number;
  };
  glowRadius: number;
  orbRadius: number;
  targetColor: string;
  cameraMovement: {
    amplitude: number;
    speed: number;
  };
}

export interface NodeTarget {
  x: number;
  y: number;
  z: number;
  activated: boolean;
  activationTime: number;
}

export interface NeuralConnection {
  line: THREE.Line;
  node1: THREE.Mesh;
  node2: THREE.Mesh;
  pulsePhase: number;
}

export interface MindAssemblyProps {
  onComplete: () => void;
  onTextUpdate?: (time: number) => void;
}