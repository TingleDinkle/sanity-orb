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
