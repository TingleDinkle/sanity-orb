import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { ParticleData } from '../../types/sanity';
import { PARTICLE_COUNT } from '../../constants/sanityConstants';

interface ParticleSystemProps {
  scene: THREE.Scene;
  sanity: number;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ scene, sanity }) => {
  const particlesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const particles: THREE.Mesh[] = [];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const geometry = new THREE.SphereGeometry(0.02, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      
      const particle = new THREE.Mesh(geometry, material);
      
      const radius = 2.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const particleData: ParticleData = {
        radius,
        theta,
        phi,
        speed: 0.2 + Math.random() * 0.3,
        orbitSpeed: 0.001 + Math.random() * 0.002,
        verticalSpeed: 0.0005 + Math.random() * 0.001
      };
      
      particle.userData = particleData;
      particles.push(particle);
      scene.add(particle);
    }
    
    particlesRef.current = particles;

    return () => {
      particles.forEach(particle => {
        scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
      });
    };
  }, [scene]);

  return null;
};

export default ParticleSystem;
