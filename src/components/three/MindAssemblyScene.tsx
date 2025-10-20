import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { MIND_ASSEMBLY_CONFIG } from '../../constants/sanityConstants';
import { createNeuralNodes, calculateNodeTargets, createConnection, createMindCore, createMindGlow, createMindOrb } from '../../utils/sanityUtils';
import { MindAssemblyProps, NodeTarget, NeuralConnection } from '../../types/sanity';

interface MindAssemblySceneProps {
  onComplete: () => void;
  onTextUpdate?: (time: number) => void;
}

const MindAssemblyScene: React.FC<MindAssemblySceneProps> = ({ onComplete, onTextUpdate }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const nodeTargetsRef = useRef<NodeTarget[]>([]);
  const connectionsRef = useRef<NeuralConnection[]>([]);
  const coreRef = useRef<THREE.Mesh | null>(null);
  const glowRef = useRef<THREE.Mesh | null>(null);
  const orbRef = useRef<THREE.Mesh | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const prevTimeRef = useRef<number | null>(null);
  const logicalTimeRef = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;

    const mountElement = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 8;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mountElement.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create neural nodes and targets
    const nodes = createNeuralNodes(MIND_ASSEMBLY_CONFIG.nodeCount, scene);
    const nodeTargets = calculateNodeTargets(MIND_ASSEMBLY_CONFIG.nodeCount);
    nodesRef.current = nodes;
    nodeTargetsRef.current = nodeTargets;

    // Create core
    const core = createMindCore(scene);
    coreRef.current = core;

    // Create glow
    const glow = createMindGlow(scene);
    glowRef.current = glow;

    // Create orb
    const orb = createMindOrb(scene);
    orbRef.current = orb;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x4488ff, 0, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      // Use real delta for smoother time progression across devices
      const now = performance.now();
      if (prevTimeRef.current == null) {
        prevTimeRef.current = now;
      }
      const delta = Math.min(0.05, (now - prevTimeRef.current) / 1000);
      prevTimeRef.current = now;
      // Accumulate logical time separately
      logicalTimeRef.current += delta;
      const time = logicalTimeRef.current;
      const progress = Math.min(time / MIND_ASSEMBLY_CONFIG.totalDuration, 1);

      // Phase 1: Core awakens (0-1.5s)
      if (time < MIND_ASSEMBLY_CONFIG.phases.coreAwaken.duration) {
        const phase1Progress = time / MIND_ASSEMBLY_CONFIG.phases.coreAwaken.duration;
        if (coreRef.current) {
          const coreMaterial = coreRef.current.material as THREE.MeshBasicMaterial;
          coreMaterial.opacity = Math.pow(phase1Progress, 2) * 0.8;
          coreMaterial.emissiveIntensity = Math.sin(phase1Progress * Math.PI) * 2.0;
          coreRef.current.scale.setScalar(MIND_ASSEMBLY_CONFIG.coreScale.initial + phase1Progress * (MIND_ASSEMBLY_CONFIG.coreScale.max - MIND_ASSEMBLY_CONFIG.coreScale.initial));
          
          // Pulsing effect
          const pulse = Math.sin(time * 5) * 0.1;
          coreRef.current.scale.setScalar(1 + pulse);
        }
        
        if (pointLightRef.current) {
          pointLightRef.current.intensity = phase1Progress * 1.5;
        }
      }

      // Phase 2: Nodes converge (1.0-4.5s)
      if (time >= MIND_ASSEMBLY_CONFIG.phases.nodesConverge.start && 
          time < MIND_ASSEMBLY_CONFIG.phases.nodesConverge.start + MIND_ASSEMBLY_CONFIG.phases.nodesConverge.duration) {
        const phase2Progress = (time - MIND_ASSEMBLY_CONFIG.phases.nodesConverge.start) / MIND_ASSEMBLY_CONFIG.phases.nodesConverge.duration;
        const convergenceSpeed = 1 - Math.pow(1 - phase2Progress, 3);
        
        nodesRef.current.forEach((node, i) => {
          const target = nodeTargetsRef.current[i];
          
          // Move towards target
          node.position.lerp(
            new THREE.Vector3(target.x, target.y, target.z),
            convergenceSpeed * 0.02
          );
          
          // Fade in nodes gradually
          const distanceToTarget = node.position.distanceTo(new THREE.Vector3(target.x, target.y, target.z));
          if (distanceToTarget < 5) {
            const material = node.material as THREE.MeshBasicMaterial;
            material.opacity = Math.min(1, (5 - distanceToTarget) / 5);
            material.emissiveIntensity = material.opacity * 1.5;
          }
          
          // Activation wave
          if (time > 2.0 + target.activationTime && !target.activated) {
            target.activated = true;
            
            // Create connections to nearby nodes
            nodesRef.current.forEach((otherNode, j) => {
              if (i !== j && Math.random() > 0.85) {
                const distance = node.position.distanceTo(otherNode.position);
                if (distance < 2.5) {
                  const color = new THREE.Color(
                    0.3 + Math.random() * 0.4,
                    0.5 + Math.random() * 0.3,
                    0.8 + Math.random() * 0.2
                  );
                  connectionsRef.current.push(createConnection(node, otherNode, color, scene));
                }
              }
            });
          }
          
          // Rotation for dynamic feel
          node.rotation.x += 0.01;
          node.rotation.y += 0.015;
        });
      }

      // Phase 3: Neural network forms (2.5-5.5s)
      if (time >= MIND_ASSEMBLY_CONFIG.phases.networkForm.start && 
          time < MIND_ASSEMBLY_CONFIG.phases.networkForm.start + MIND_ASSEMBLY_CONFIG.phases.networkForm.duration) {
        const phase3Progress = (time - MIND_ASSEMBLY_CONFIG.phases.networkForm.start) / MIND_ASSEMBLY_CONFIG.phases.networkForm.duration;
        
        connectionsRef.current.forEach((conn) => {
          const { line, node1, node2, pulsePhase } = conn;
          
          // Update line positions
          const positions = line.geometry.attributes.position.array as Float32Array;
          positions[0] = node1.position.x;
          positions[1] = node1.position.y;
          positions[2] = node1.position.z;
          positions[3] = node2.position.x;
          positions[4] = node2.position.y;
          positions[5] = node2.position.z;
          line.geometry.attributes.position.needsUpdate = true;
          
          // Fade in connections
          const fadeIn = Math.min(1, phase3Progress * 2);
          const pulse = Math.sin(time * 3 + pulsePhase) * 0.5 + 0.5;
          const material = line.material as THREE.LineBasicMaterial;
          material.opacity = fadeIn * (0.15 + pulse * 0.15);
          
          // Energy pulses along connections
          const distance = node1.position.distanceTo(node2.position);
          const pulsePosition = (time * 2 + pulsePhase) % 1;
          const midPoint = new THREE.Vector3()
            .lerpVectors(node1.position, node2.position, pulsePosition);
          
          // Brighten nodes when pulse passes
          if (pulsePosition < 0.1 || pulsePosition > 0.9) {
            const node1Material = node1.material as THREE.MeshBasicMaterial;
            const node2Material = node2.material as THREE.MeshBasicMaterial;
            node1Material.emissiveIntensity = 2.0;
            node2Material.emissiveIntensity = 2.0;
          }
        });
        
        // Gradually reduce node emissive intensity
        nodesRef.current.forEach(node => {
          const material = node.material as THREE.MeshBasicMaterial;
          material.emissiveIntensity *= 0.98;
        });
      }

      // Phase 4: Convergence to unity (4.5-6.5s)
      if (time >= MIND_ASSEMBLY_CONFIG.phases.convergence.start && 
          time < MIND_ASSEMBLY_CONFIG.phases.convergence.start + MIND_ASSEMBLY_CONFIG.phases.convergence.duration) {
        const phase4Progress = (time - MIND_ASSEMBLY_CONFIG.phases.convergence.start) / MIND_ASSEMBLY_CONFIG.phases.convergence.duration;
        
        // Glow intensifies
        if (glowRef.current && glowRef.current.material.uniforms) {
          glowRef.current.material.uniforms.intensity.value = phase4Progress * 0.4;
        }
        
        // Nodes begin to merge into orb
        nodesRef.current.forEach(node => {
          const scale = 1 - phase4Progress * 0.7;
          node.scale.setScalar(scale);
        });
        
        // Orb forms
        if (time >= 5.0) {
          const orbProgress = (time - 5.0) / 1.5;
          if (orbRef.current) {
            const orbMaterial = orbRef.current.material as THREE.MeshBasicMaterial;
            orbMaterial.opacity = Math.pow(orbProgress, 2) * 0.6;
            orbRef.current.scale.setScalar(orbProgress);
          }
        }
        
        // Color shift to green
        const targetColor = new THREE.Color(MIND_ASSEMBLY_CONFIG.targetColor);
        nodesRef.current.forEach(node => {
          const material = node.material as THREE.MeshBasicMaterial;
          material.color.lerp(targetColor, phase4Progress * 0.05);
          material.emissive.lerp(targetColor, phase4Progress * 0.05);
        });
        
        connectionsRef.current.forEach(conn => {
          const material = conn.line.material as THREE.LineBasicMaterial;
          material.color.lerp(targetColor, phase4Progress * 0.05);
        });
        
        if (glowRef.current && glowRef.current.material.uniforms) {
          glowRef.current.material.uniforms.color.value.lerp(targetColor, phase4Progress * 0.05);
        }
      }

      // Phase 5: Text and stabilization (6.0-7.5s)
      if (time >= MIND_ASSEMBLY_CONFIG.phases.textStabilization.start && 
          time < MIND_ASSEMBLY_CONFIG.phases.textStabilization.start + MIND_ASSEMBLY_CONFIG.phases.textStabilization.duration) {
        
        // Fade out connections
        connectionsRef.current.forEach(conn => {
          const material = conn.line.material as THREE.LineBasicMaterial;
          material.opacity *= 0.96;
        });
        
        // Fade out nodes
        nodesRef.current.forEach(node => {
          const material = node.material as THREE.MeshBasicMaterial;
          material.opacity *= 0.97;
        });
        
        // Fade out core
        if (coreRef.current) {
          const coreMaterial = coreRef.current.material as THREE.MeshBasicMaterial;
          coreMaterial.opacity *= 0.96;
        }
      }

      // Phase 6: Final state (7.5-8.0s)
      if (time >= MIND_ASSEMBLY_CONFIG.phases.finalState.start) {
        const finalProgress = (time - MIND_ASSEMBLY_CONFIG.phases.finalState.start) / MIND_ASSEMBLY_CONFIG.phases.finalState.duration;
        
        // Smooth orb rotation
        if (orbRef.current) {
          orbRef.current.rotation.y += 0.005;
          
          // Gentle pulsing
          const pulse = Math.sin(time * 2) * 0.02;
          orbRef.current.scale.setScalar(1 + pulse);
        }
      }

      // Complete animation
      if (progress >= 1) {
        // Signal completion once; allow outer overlay to fade
        if (!(animate as any)._completed) {
          (animate as any)._completed = true;
          onComplete();
        }
      }

      // Camera movement
      camera.position.x = Math.sin(time * MIND_ASSEMBLY_CONFIG.cameraMovement.speed) * MIND_ASSEMBLY_CONFIG.cameraMovement.amplitude;
      camera.position.y = Math.cos(time * 0.12) * MIND_ASSEMBLY_CONFIG.cameraMovement.amplitude;
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
      nodesRef.current.forEach(n => {
        n.geometry.dispose();
        n.material.dispose();
      });
      connectionsRef.current.forEach(c => {
        c.line.geometry.dispose();
        c.line.material.dispose();
      });
      
      if (coreRef.current) {
        coreRef.current.geometry.dispose();
        coreRef.current.material.dispose();
      }
      
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

export default MindAssemblyScene;
