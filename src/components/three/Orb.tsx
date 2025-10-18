import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from '../../shaders/orbShaders';
import { ORB_RADIUS } from '../../constants/sanityConstants';

interface OrbProps {
  scene: THREE.Scene;
  sanity: number;
}

const Orb: React.FC<OrbProps> = ({ scene, sanity }) => {
  const orbRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const geometry = new THREE.SphereGeometry(ORB_RADIUS, 128, 128);
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x00ff00) },
        pulseSpeed: { value: 1.0 },
        turbulence: { value: 0.0 }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });

    const orb = new THREE.Mesh(geometry, material);
    orbRef.current = orb;
    scene.add(orb);

    return () => {
      if (orbRef.current) {
        scene.remove(orbRef.current);
        geometry.dispose();
        material.dispose();
      }
    };
  }, [scene]);

  return null;
};

export default Orb;
