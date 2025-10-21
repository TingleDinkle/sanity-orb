import * as THREE from 'three';
import { SANITY_COLORS, SANITY_LABELS, SANITY_DESCRIPTIONS, SANITY_GRADIENTS } from '../constants/sanityConstants';

export const getSanityColor = (value: number): THREE.Color => {
  // Smooth color interpolation between thresholds
  if (value >= 75) {
    if (value >= 87.5) {
      return new THREE.Color(SANITY_COLORS.green);
    } else {
      const t = (value - 75) / 12.5;
      const green = new THREE.Color(SANITY_COLORS.green);
      const yellowGreen = new THREE.Color('#88ff44');
      return green.clone().lerp(yellowGreen, t);
    }
  } else if (value >= 50) {
    if (value >= 62.5) {
      const t = (value - 50) / 12.5;
      const yellowGreen = new THREE.Color('#88ff44');
      const yellow = new THREE.Color(SANITY_COLORS.yellow);
      return yellowGreen.clone().lerp(yellow, t);
    } else {
      const t = (value - 50) / 12.5;
      const yellow = new THREE.Color(SANITY_COLORS.yellow);
      const orangeYellow = new THREE.Color('#ffaa00');
      return yellow.clone().lerp(orangeYellow, t);
    }
  } else if (value >= 25) {
    if (value >= 37.5) {
      const t = (value - 25) / 12.5;
      const orangeYellow = new THREE.Color('#ffaa00');
      const orange = new THREE.Color(SANITY_COLORS.orange);
      return orangeYellow.clone().lerp(orange, t);
    } else {
      const t = (value - 25) / 12.5;
      const orange = new THREE.Color(SANITY_COLORS.orange);
      const redOrange = new THREE.Color('#ff3300');
      return orange.clone().lerp(redOrange, t);
    }
  } else {
    if (value >= 12.5) {
      const t = value / 12.5;
      const redOrange = new THREE.Color('#ff3300');
      const red = new THREE.Color(SANITY_COLORS.red);
      return redOrange.clone().lerp(red, t);
    } else {
      return new THREE.Color(SANITY_COLORS.red);
    }
  }
};

export const getSanityLabel = (sanity: number): string => {
  if (sanity >= 75) return SANITY_LABELS.coherent;
  if (sanity >= 50) return SANITY_LABELS.stable;
  if (sanity >= 25) return SANITY_LABELS.fractured;
  return SANITY_LABELS.chaotic;
};

export const getSanityDescription = (sanity: number): string => {
  if (sanity >= 75) return SANITY_DESCRIPTIONS.coherent;
  if (sanity >= 50) return SANITY_DESCRIPTIONS.stable;
  if (sanity >= 25) return SANITY_DESCRIPTIONS.fractured;
  return SANITY_DESCRIPTIONS.chaotic;
};

export const getGradientColor = (sanity: number): string => {
  if (sanity >= 75) return SANITY_GRADIENTS.coherent;
  if (sanity >= 50) return SANITY_GRADIENTS.stable;
  if (sanity >= 25) return SANITY_GRADIENTS.fractured;
  return SANITY_GRADIENTS.chaotic;
};

export const checkWebGLSupport = (): boolean => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  return !!gl;
};

// Mind Assembly Animation Utilities
export const createNeuralNodes = (count: number, scene: THREE.Scene): THREE.Mesh[] => {
  const nodes: THREE.Mesh[] = [];
  
  for (let i = 0; i < count; i++) {
    const geometry = new THREE.SphereGeometry(0.04, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.5 + Math.random() * 0.5, 0.7 + Math.random() * 0.3, 1.0),
      transparent: true,
      opacity: 0,
      emissive: new THREE.Color(0.3, 0.5, 0.8),
      emissiveIntensity: 0
    });
    
    const node = new THREE.Mesh(geometry, material);
    
    // Random scattered starting position
    node.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    );
    
    nodes.push(node);
    scene.add(node);
  }
  
  return nodes;
};

export const calculateNodeTargets = (count: number): Array<{x: number, y: number, z: number, activated: boolean, activationTime: number}> => {
  const targets = [];
  
  for (let i = 0; i < count; i++) {
    const radius = 2.0 + Math.random() * 1.2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    targets.push({
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: radius * Math.cos(phi),
      activated: false,
      activationTime: Math.random() * 2.0
    });
  }
  
  return targets;
};

export const createConnection = (node1: THREE.Mesh, node2: THREE.Mesh, color: THREE.Color, scene: THREE.Scene) => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(6);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending
  });
  
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  
  return {
    line,
    node1,
    node2,
    pulsePhase: Math.random() * Math.PI * 2
  };
};

export const createMindCore = (scene: THREE.Scene): THREE.Mesh => {
  const coreGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.4, 0.7, 1.0),
    transparent: true,
    opacity: 0,
    emissive: new THREE.Color(0.4, 0.7, 1.0),
    emissiveIntensity: 0
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  scene.add(core);
  return core;
};

export const createMindGlow = (scene: THREE.Scene): THREE.Mesh => {
  const glowGeometry = new THREE.SphereGeometry(3.5, 64, 64);
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0.3, 0.6, 1.0) },
      intensity: { value: 0.0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float intensity;
      varying vec3 vNormal;
      
      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
        gl_FragColor = vec4(color, fresnel * intensity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  scene.add(glow);
  return glow;
};

export const createMindOrb = (scene: THREE.Scene): THREE.Mesh => {
  const orbGeometry = new THREE.SphereGeometry(1.8, 64, 64);
  const orbMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.0, 1.0, 0.53),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending
  });
  const orb = new THREE.Mesh(orbGeometry, orbMaterial);
  scene.add(orb);
  return orb;
};