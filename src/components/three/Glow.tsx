import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { glowVertexShader, glowFragmentShader } from '../../shaders/orbShaders';
import { GLOW_RADIUS } from '../../constants/sanityConstants';

interface GlowProps {
  scene: THREE.Scene;
}

const Glow: React.FC<GlowProps> = ({ scene }) => {
  const glowRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const geometry = new THREE.SphereGeometry(GLOW_RADIUS, 64, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x00ff00) },
        coefficient: { value: 0.5 },
        power: { value: 3.0 }
      },
      vertexShader: glowVertexShader,
      fragmentShader: glowFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });

    const glow = new THREE.Mesh(geometry, material);
    glowRef.current = glow;
    scene.add(glow);

    return () => {
      if (glowRef.current) {
        scene.remove(glowRef.current);
        geometry.dispose();
        material.dispose();
      }
    };
  }, [scene]);

  return null;
};

export default Glow;
