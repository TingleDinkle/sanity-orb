import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { StarFieldConfig } from '../../types/sanity';

interface StarFieldProps {
  config: StarFieldConfig;
  scene: THREE.Scene;
}

const StarField: React.FC<StarFieldProps> = ({ config, scene }) => {
  const starFieldRef = useRef<THREE.Points | null>(null);

  useEffect(() => {
    const { count, size, distance, speed } = config;
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const sizes = [];
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = distance + (Math.random() - 0.5) * distance * 0.3;
      
      vertices.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      sizes.push(size * (0.5 + Math.random() * 0.5));
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: size,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(geometry, material);
    stars.userData.speed = speed;
    
    starFieldRef.current = stars;
    scene.add(stars);

    return () => {
      if (starFieldRef.current) {
        scene.remove(starFieldRef.current);
        geometry.dispose();
        material.dispose();
      }
    };
  }, [config, scene]);

  return null;
};

export default StarField;
