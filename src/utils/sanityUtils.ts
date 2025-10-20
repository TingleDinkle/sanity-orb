import * as THREE from 'three';
import { SANITY_COLORS, SANITY_LABELS, SANITY_DESCRIPTIONS, SANITY_GRADIENTS } from '../constants/sanityConstants';

export const getSanityColor = (value: number): THREE.Color => {
  // Smooth color interpolation between thresholds
  if (value >= 75) {
    if (value >= 87.5) {
      // Pure green
      return new THREE.Color(SANITY_COLORS.green);
    } else {
      // Interpolate between green and yellow-green
      const t = (value - 75) / 12.5;
      const green = new THREE.Color(SANITY_COLORS.green);
      const yellowGreen = new THREE.Color('#88ff44');
      return green.clone().lerp(yellowGreen, t);
    }
  } else if (value >= 50) {
    if (value >= 62.5) {
      // Interpolate between yellow-green and yellow
      const t = (value - 50) / 12.5;
      const yellowGreen = new THREE.Color('#88ff44');
      const yellow = new THREE.Color(SANITY_COLORS.yellow);
      return yellowGreen.clone().lerp(yellow, t);
    } else {
      // Interpolate between yellow and orange-yellow
      const t = (value - 50) / 12.5;
      const yellow = new THREE.Color(SANITY_COLORS.yellow);
      const orangeYellow = new THREE.Color('#ffaa00');
      return yellow.clone().lerp(orangeYellow, t);
    }
  } else if (value >= 25) {
    if (value >= 37.5) {
      // Interpolate between orange-yellow and orange
      const t = (value - 25) / 12.5;
      const orangeYellow = new THREE.Color('#ffaa00');
      const orange = new THREE.Color(SANITY_COLORS.orange);
      return orangeYellow.clone().lerp(orange, t);
    } else {
      // Interpolate between orange and red-orange
      const t = (value - 25) / 12.5;
      const orange = new THREE.Color(SANITY_COLORS.orange);
      const redOrange = new THREE.Color('#ff3300');
      return orange.clone().lerp(redOrange, t);
    }
  } else {
    if (value >= 12.5) {
      // Interpolate between red-orange and red
      const t = value / 12.5;
      const redOrange = new THREE.Color('#ff3300');
      const red = new THREE.Color(SANITY_COLORS.red);
      return redOrange.clone().lerp(red, t);
    } else {
      // Pure red
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

// Opening Animation Utilities
export const createOpeningParticles = (count: number, scene: THREE.Scene): THREE.Mesh[] => {
  const particles: THREE.Mesh[] = [];
  
  for (let i = 0; i < count; i++) {
    const geometry = new THREE.SphereGeometry(0.02, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(Math.random(), Math.random(), Math.random()),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particle = new THREE.Mesh(geometry, material);
    
    // Random starting position (scattered)
    particle.position.set(
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15
    );
    
    particles.push(particle);
    scene.add(particle);
  }
  
  return particles;
};

export const calculateParticleTargets = (count: number): Array<{x: number, y: number, z: number}> => {
  const targets = [];
  
  for (let i = 0; i < count; i++) {
    const radius = 2.5 + Math.random() * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    targets.push({
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: radius * Math.cos(phi)
    });
  }
  
  return targets;
};

export const createOpeningGlow = (scene: THREE.Scene): THREE.Mesh => {
  const glowGeometry = new THREE.SphereGeometry(0.1, 32, 32);
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(1, 1, 1) } as THREE.IUniform,
      intensity: { value: 0.0 } as THREE.IUniform,
      saturation: { value: 2.0 } as THREE.IUniform
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
      uniform float saturation;
      varying vec3 vNormal;
      
      vec3 saturate(vec3 rgb, float adjustment) {
        vec3 W = vec3(0.2125, 0.7154, 0.0721);
        vec3 intensity = vec3(dot(rgb, W));
        return mix(intensity, rgb, adjustment);
      }
      
      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
        vec3 saturatedColor = saturate(color, saturation);
        gl_FragColor = vec4(saturatedColor, fresnel * intensity);
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

export const createOpeningOrb = (scene: THREE.Scene): THREE.Mesh => {
  const orbGeometry = new THREE.SphereGeometry(1.8, 64, 64);
  const orbMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.5, 0.5, 0.5),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending
  });
  const orb = new THREE.Mesh(orbGeometry, orbMaterial);
  scene.add(orb);
  return orb;
};