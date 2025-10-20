import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OPENING_ANIMATION_CONFIG } from '../../constants/sanityConstants';
import { createOpeningParticles, calculateParticleTargets, createOpeningGlow, createOpeningOrb } from '../../utils/sanityUtils';

interface OpeningAnimationSceneProps {
  onComplete: () => void;
  onTextUpdate?: (time: number) => void;
}

const OpeningAnimationScene: React.FC<OpeningAnimationSceneProps> = ({ onComplete, onTextUpdate }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  const particleTargetsRef = useRef<Array<{x: number, y: number, z: number}>>([]);
  const glowRef = useRef<THREE.Mesh | null>(null);
  const orbRef = useRef<THREE.Mesh | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;

    const mountElement = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountElement.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create particles and targets
    const particles = createOpeningParticles(OPENING_ANIMATION_CONFIG.particleCount, scene);
    const particleTargets = calculateParticleTargets(OPENING_ANIMATION_CONFIG.particleCount);
    particlesRef.current = particles;
    particleTargetsRef.current = particleTargets;

    // Create glow
    const glow = createOpeningGlow(scene);
    glowRef.current = glow;

    // Create orb
    const orb = createOpeningOrb(scene);
    orbRef.current = orb;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x222244, 0.4);
    scene.add(ambientLight);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      timeRef.current += 0.016; // ~60fps
      const time = timeRef.current;
      const progress = Math.min(time / OPENING_ANIMATION_CONFIG.totalDuration, 1);

      // Phase 1: Glow expands (0-1.5s)
      if (time < OPENING_ANIMATION_CONFIG.phases.glowExpand.duration) {
        const phase1Progress = time / OPENING_ANIMATION_CONFIG.phases.glowExpand.duration;
        const expandProgress = Math.pow(phase1Progress, 2);
        if (glowRef.current) {
          glowRef.current.scale.setScalar(1 + expandProgress * OPENING_ANIMATION_CONFIG.glowScale.max);
          if (glowRef.current.material.uniforms) {
            glowRef.current.material.uniforms.intensity.value = Math.sin(phase1Progress * Math.PI) * 0.8;
          }
        }
      }

      // Phase 2: Particles swirl inward (1.0-4.0s)
      if (time >= OPENING_ANIMATION_CONFIG.phases.particlesSwirl.start && 
          time < OPENING_ANIMATION_CONFIG.phases.particlesSwirl.start + OPENING_ANIMATION_CONFIG.phases.particlesSwirl.duration) {
        const phase2Progress = (time - OPENING_ANIMATION_CONFIG.phases.particlesSwirl.start) / OPENING_ANIMATION_CONFIG.phases.particlesSwirl.duration;
        const swirlSpeed = 1 - Math.pow(1 - phase2Progress, 3);
        
        particlesRef.current.forEach((particle, i) => {
          const target = particleTargetsRef.current[i];
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
      if (time >= OPENING_ANIMATION_CONFIG.phases.colorSync.start && 
          time < OPENING_ANIMATION_CONFIG.phases.colorSync.start + OPENING_ANIMATION_CONFIG.phases.colorSync.duration) {
        const phase3Progress = (time - OPENING_ANIMATION_CONFIG.phases.colorSync.start) / OPENING_ANIMATION_CONFIG.phases.colorSync.duration;
        const targetColor = new THREE.Color(OPENING_ANIMATION_CONFIG.targetColor);
        
        particlesRef.current.forEach(particle => {
          particle.material.color.lerp(targetColor, phase3Progress * 0.1);
        });
        
        // Reduce saturation over time
        if (glowRef.current && glowRef.current.material.uniforms) {
          glowRef.current.material.uniforms.saturation.value = 2.0 - phase3Progress * 1.5;
          glowRef.current.material.uniforms.color.value.lerp(targetColor, phase3Progress * 0.05);
        }
        
        // Orb starts forming
        if (time >= 3.0) {
          const orbProgress = (time - 3.0) / 2.0;
          if (orbRef.current) {
            orbRef.current.material.opacity = Math.pow(orbProgress, 2) * OPENING_ANIMATION_CONFIG.orbOpacity.max;
            orbRef.current.material.color.lerp(targetColor, orbProgress * 0.1);
          }
        }
      }

      // Phase 5: Stabilization (5.0-6.0s)
      if (time >= OPENING_ANIMATION_CONFIG.phases.stabilization.start) {
        const phase5Progress = (time - OPENING_ANIMATION_CONFIG.phases.stabilization.start) / OPENING_ANIMATION_CONFIG.phases.stabilization.duration;
        
        // Orb stops pulsing
        if (orbRef.current) {
          orbRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.02 * (1 - phase5Progress));
        }
        
        // Particles settle
        particlesRef.current.forEach((particle, i) => {
          particle.material.opacity = 0.6 - phase5Progress * 0.2;
        });
      }

      // Complete animation
      if (progress >= 1) {
        setTimeout(() => {
          onComplete();
        }, 200);
      }

      // Gentle camera movement
      camera.position.x = Math.sin(time * OPENING_ANIMATION_CONFIG.cameraMovement.speed) * OPENING_ANIMATION_CONFIG.cameraMovement.amplitude;
      camera.position.y = Math.cos(time * 0.15) * OPENING_ANIMATION_CONFIG.cameraMovement.amplitude;
      camera.lookAt(0, 0, 0);

      // Notify parent component about text updates
      if (onTextUpdate) {
        onTextUpdate(time);
      }

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
      if (mountElement && renderer.domElement) {
        mountElement.removeChild(renderer.domElement);
      }
      
      // Cleanup geometries and materials
      particlesRef.current.forEach(p => {
        p.geometry.dispose();
        p.material.dispose();
      });
      
      if (glowRef.current) {
        glowRef.current.geometry.dispose();
        glowRef.current.material.dispose();
      }
      
      if (orbRef.current) {
        orbRef.current.geometry.dispose();
        orbRef.current.material.dispose();
      }
      
      renderer.dispose();
    };
  }, [onComplete]);

  return <div ref={mountRef} className="absolute inset-0" />;
};

export default OpeningAnimationScene;
