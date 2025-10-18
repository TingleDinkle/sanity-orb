import * as THREE from 'three';
import { SANITY_COLORS, SANITY_LABELS, SANITY_DESCRIPTIONS, SANITY_GRADIENTS } from '../constants/sanityConstants';

export const getSanityColor = (value: number): THREE.Color => {
  if (value >= 75) {
    return new THREE.Color(SANITY_COLORS.green);
  } else if (value >= 50) {
    return new THREE.Color(SANITY_COLORS.yellow);
  } else if (value >= 25) {
    return new THREE.Color(SANITY_COLORS.orange);
  } else {
    return new THREE.Color(SANITY_COLORS.red);
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
