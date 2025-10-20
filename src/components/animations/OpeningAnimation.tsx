import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface OpeningAnimationProps {
  onComplete: () => void;
}

const OpeningAnimation = ({ onComplete }: OpeningAnimationProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [textVisible, setTextVisible] = useState(false);
  const [textOpacity, setTextOpacity] = useState(0);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Particle system for assembly
    const particleCount = 150;
    const particles: THREE.Mesh[] = [];
    const particleTargets: Array<{x: number, y: number, z: number}> = [];
    
    for (let i = 0; i < particleCount; i++) {
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
      
      // Calculate target position (spherical)
      const radius = 2.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      particleTargets.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi)
      });
      
      particles.push(particle);
      scene.add(particle);
    }

    // Central glow that expands
    const glowGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(1, 1, 1) },
        intensity: { value: 0.0 },
        saturation: { value: 2.0 }
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

    // Central orb that forms
    const orbGeometry = new THREE.SphereGeometry(1.8, 64, 64);
    const orbMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.5, 0.5, 0.5),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    scene.add(orb);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x222244, 0.4);
    scene.add(ambientLight);

    // Animation parameters
    let time = 0;
    const totalDuration = 6.0; // 6 seconds total
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.016; // ~60fps
      const progress = Math.min(time / totalDuration, 1);

      // Phase 1: Glow expands (0-1.5s)
      if (time < 1.5) {
        const phase1Progress = time / 1.5;
        const expandProgress = Math.pow(phase1Progress, 2);
        glow.scale.setScalar(1 + expandProgress * 3);
        glowMaterial.uniforms.intensity.value = Math.sin(phase1Progress * Math.PI) * 0.8;
      }

      // Phase 2: Particles swirl inward (1.0-4.0s)
      if (time >= 1.0 && time < 4.0) {
        const phase2Progress = (time - 1.0) / 3.0;
        const swirlSpeed = 1 - Math.pow(1 - phase2Progress, 3);
        
        particles.forEach((particle, i) => {
          const target = particleTargets[i];
          const start = new THREE.Vector3(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15
          );
          
          // Lerp position with easing
          particle.position.lerpVectors(
            start,
            new THREE.Vector3(target.x, target.y, target.z),
            swirlSpeed
          );
          
          // Rotation for swirl effect
          particle.rotation.x += 0.05 * (1 - swirlSpeed);
          particle.rotation.y += 0.05 * (1 - swirlSpeed);
        });
      }

      // Phase 3: Color synchronization (2.0-5.0s)
      if (time >= 2.0 && time < 5.0) {
        const phase3Progress = (time - 2.0) / 3.0;
        const targetColor = new THREE.Color(0.0, 1.0, 0.53); // Calm green
        
        particles.forEach(particle => {
          const material = particle.material as THREE.MeshBasicMaterial;
          material.color.lerp(targetColor, phase3Progress * 0.1);
        });
        
        // Reduce saturation over time
        glowMaterial.uniforms.saturation.value = 2.0 - phase3Progress * 1.5;
        glowMaterial.uniforms.color.value.lerp(targetColor, phase3Progress * 0.05);
        
        // Orb starts forming
        if (time >= 3.0) {
          const orbProgress = (time - 3.0) / 2.0;
          orbMaterial.opacity = Math.pow(orbProgress, 2) * 0.6;
          orbMaterial.color.lerp(targetColor, orbProgress * 0.1);
        }
      }

      // Phase 4: Text appears (4.5-5.5s)
      if (time >= 4.5 && time < 5.5) {
        if (!textVisible) {
          setTextVisible(true);
        }
        const textProgress = (time - 4.5) / 1.0;
        setTextOpacity(Math.pow(textProgress, 2));
      }

      // Phase 5: Stabilization (5.0-6.0s)
      if (time >= 5.0) {
        const phase5Progress = (time - 5.0) / 1.0;
        
        // Orb stops pulsing
        orb.scale.setScalar(1 + Math.sin(time * 2) * 0.02 * (1 - phase5Progress));
        
        // Particles settle
        particles.forEach((particle) => {
          const material = particle.material as THREE.MeshBasicMaterial;
          material.opacity = 0.6 - phase5Progress * 0.2;
        });
        
        // Fade out text
        if (time >= 5.5) {
          const fadeProgress = (time - 5.5) / 0.5;
          setTextOpacity(1 - fadeProgress);
        }
      }

      // Complete animation
      if (progress >= 1) {
        setTimeout(() => {
          onComplete();
        }, 200);
      }

      // Gentle camera movement
      camera.position.x = Math.sin(time * 0.2) * 0.1;
      camera.position.y = Math.cos(time * 0.15) * 0.1;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      particles.forEach(p => {
        p.geometry.dispose();
        (p.material as THREE.MeshBasicMaterial).dispose();
      });
      glowGeometry.dispose();
      glowMaterial.dispose();
      orbGeometry.dispose();
      orbMaterial.dispose();
      renderer.dispose();
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <div ref={mountRef} className="absolute inset-0" />
      
      {textVisible && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: textOpacity }}
        >
          <div className="text-center">
            <h1 className="text-6xl font-extralight text-white tracking-wider mb-4">
              Sanity
            </h1>
            <p className="text-2xl font-light text-white/60 tracking-wide">
              reassembled
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpeningAnimation;