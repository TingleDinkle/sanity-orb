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
  const frameCountRef = useRef(0);
  const lastGeometryUpdateRef = useRef(0);

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

    // Animation loop - OPTIMIZED for performance
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      frameCountRef.current++;
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

      // PERFORMANCE OPTIMIZATIONS: Early exit for completed phases and batching
      const isEarlyPhase = time < MIND_ASSEMBLY_CONFIG.phases.nodesConverge.start + MIND_ASSEMBLY_CONFIG.phases.nodesConverge.duration;
      const isMidPhase = time >= MIND_ASSEMBLY_CONFIG.phases.networkForm.start && time < MIND_ASSEMBLY_CONFIG.phases.finalState.start;
      const isLatePhase = time >= MIND_ASSEMBLY_CONFIG.phases.finalState.start;

      // PERFORMANCE: Skip all node/connection updates in late phase - only orb matters
      if (isLatePhase) {
        // Only update final phase (orb rotation/pulsing)
        if (orbRef.current) {
          orbRef.current.rotation.y += 0.005;
          const pulse = Math.sin(time * 2) * 0.02;
          orbRef.current.scale.setScalar(1 + pulse);
        }
      } else {

      // Phase 1: Core awakens (0-1.5s) - LIGHT COMPUTATION
      if (time < MIND_ASSEMBLY_CONFIG.phases.coreAwaken.duration) {
        const phase1Progress = time / MIND_ASSEMBLY_CONFIG.phases.coreAwaken.duration;
        if (coreRef.current) {
          const coreMaterial = coreRef.current.material as any;
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
          
          // Fade in nodes gradually - PERFORMANCE: Only calculate when close
          const distanceToTarget = node.position.distanceTo(new THREE.Vector3(target.x, target.y, target.z));
          if (distanceToTarget < 5) {
            const material = node.material as any;
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
        
        // PERFORMANCE: Batch geometry updates - only update every 3 frames
        const shouldUpdateGeometry = frameCountRef.current % 3 === 0;
        connectionsRef.current.forEach((conn) => {
          const { line, node1, node2, pulsePhase } = conn;

          // Update line positions - PERFORMANCE: Batched updates
          if (shouldUpdateGeometry) {
            const positions = line.geometry.attributes.position.array as Float32Array;
            positions[0] = node1.position.x;
            positions[1] = node1.position.y;
            positions[2] = node1.position.z;
            positions[3] = node2.position.x;
            positions[4] = node2.position.y;
            positions[5] = node2.position.z;
            line.geometry.attributes.position.needsUpdate = true;
          }
          
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
          
          // Brighten nodes when pulse passes - PERFORMANCE: Only update occasionally
          if (pulsePosition < 0.1 || pulsePosition > 0.9) {
            const node1Material = node1.material as any;
            const node2Material = node2.material as any;
            node1Material.emissiveIntensity = 2.0;
            node2Material.emissiveIntensity = 2.0;
          }
        });

        // Gradually reduce node emissive intensity - PERFORMANCE: Batch updates
        if (frameCountRef.current % 2 === 0) { // Every other frame
          nodesRef.current.forEach(node => {
            const material = node.material as any;
            material.emissiveIntensity *= 0.98;
          });
        }
      }

      // Phase 4: Loading Animation (5.5-7.0s) - Network breathes and pulses
      if (time >= MIND_ASSEMBLY_CONFIG.phases.loadingAnimation.start && 
          time < MIND_ASSEMBLY_CONFIG.phases.loadingAnimation.start + MIND_ASSEMBLY_CONFIG.phases.loadingAnimation.duration) {
        const loadingProgress = (time - MIND_ASSEMBLY_CONFIG.phases.loadingAnimation.start) / MIND_ASSEMBLY_CONFIG.phases.loadingAnimation.duration;
        
        // Breathing pulse effect - network expands and contracts
        const breathingCycle = Math.sin(time * 4) * 0.5 + 0.5; // Fast breathing
        const expansionFactor = 1 + breathingCycle * 0.15; // Expand up to 15%
        
        nodesRef.current.forEach((node, i) => {
          const target = nodeTargetsRef.current[i];
          const targetPos = new THREE.Vector3(target.x, target.y, target.z);
          
          // Apply breathing expansion from center
          const expandedPos = targetPos.multiplyScalar(expansionFactor);
          node.position.copy(expandedPos);
          
          // Pulsing node brightness
          const material = node.material as any;
          material.emissiveIntensity = 1.0 + breathingCycle * 1.5;
          
          // Slight rotation for dynamic feel
          node.rotation.x += 0.02;
          node.rotation.y += 0.025;
        });
        
        // Connection brightness pulses in sync
        connectionsRef.current.forEach((conn) => {
          const { line, node1, node2, pulsePhase } = conn;
          
          // Update line positions with breathing
          const positions = line.geometry.attributes.position.array as Float32Array;
          positions[0] = node1.position.x;
          positions[1] = node1.position.y;
          positions[2] = node1.position.z;
          positions[3] = node2.position.x;
          positions[4] = node2.position.y;
          positions[5] = node2.position.z;
          line.geometry.attributes.position.needsUpdate = true;
          
          // Synchronized pulsing with slight phase offset
          const pulse = Math.sin(time * 4 + pulsePhase * 0.5) * 0.5 + 0.5;
          const material = line.material as THREE.LineBasicMaterial;
          material.opacity = 0.3 + pulse * 0.4;
          
          // Energy waves traveling through connections
          const wavePosition = (time * 3 + pulsePhase) % 1;
          if (wavePosition < 0.1) {
            material.opacity = Math.min(1.0, material.opacity + 0.3);
          }
        });
        
        // Core pulses with the breathing
        if (coreRef.current) {
          const coreMaterial = coreRef.current.material as THREE.MeshBasicMaterial;
          coreMaterial.emissiveIntensity = 2.0 + breathingCycle * 1.5;
          coreRef.current.scale.setScalar(1.0 + breathingCycle * 0.2);
        }
        
        // Glow intensifies with breathing
        if (glowRef.current && glowRef.current.material.uniforms) {
          glowRef.current.material.uniforms.intensity.value = 0.3 + breathingCycle * 0.3;
        }
        
        // Subtle camera zoom in/out with breathing
        const cameraBreathing = Math.sin(time * 4) * 0.1;
        camera.position.z = 8 + cameraBreathing;
      }

      // Phase 5: Convergence to unity (4.5-6.5s) - SMOOTH MORPHING TRANSITION
      if (time >= MIND_ASSEMBLY_CONFIG.phases.convergence.start &&
          time < MIND_ASSEMBLY_CONFIG.phases.convergence.start + MIND_ASSEMBLY_CONFIG.phases.convergence.duration) {
        const phase4Progress = (time - MIND_ASSEMBLY_CONFIG.phases.convergence.start) / MIND_ASSEMBLY_CONFIG.phases.convergence.duration;
        const smoothProgress = phase4Progress * phase4Progress * (3 - 2 * phase4Progress); // Smoothstep easing

        // Smooth camera movement - zoom in and center on convergence
        const cameraZoom = 1 - smoothProgress * 0.3; // Zoom in 30%
        camera.position.z = 8 * cameraZoom;
        camera.position.x = Math.sin(time * MIND_ASSEMBLY_CONFIG.cameraMovement.speed) * MIND_ASSEMBLY_CONFIG.cameraMovement.amplitude * (1 - smoothProgress);
        camera.position.y = Math.cos(time * 0.12) * MIND_ASSEMBLY_CONFIG.cameraMovement.amplitude * (1 - smoothProgress);

        // Glow intensifies with smooth pulsing
        if (glowRef.current && (glowRef.current.material as any).uniforms) {
          const pulseIntensity = 0.2 + smoothProgress * 0.3 + Math.sin(time * 6) * 0.1;
          (glowRef.current.material as any).uniforms.intensity.value = pulseIntensity;
        }

        // Nodes smoothly morph towards center with organic movement
        nodesRef.current.forEach((node, i) => {
          const target = nodeTargetsRef.current[i];
          const distanceToCenter = node.position.length();
          const morphFactor = smoothProgress * (1 - distanceToCenter / 8); // Closer nodes morph first

          // Organic morphing movement
          const morphX = Math.sin(time * 2 + i * 0.5) * 0.1 * (1 - smoothProgress);
          const morphY = Math.cos(time * 1.5 + i * 0.3) * 0.1 * (1 - smoothProgress);
          const morphZ = Math.sin(time * 3 + i * 0.7) * 0.1 * (1 - smoothProgress);

          node.position.x += morphX;
          node.position.y += morphY;
          node.position.z += morphZ;

          // Scale down with smooth easing
          const scale = 1 - morphFactor * 0.8;
          node.scale.setScalar(Math.max(0.1, scale));

          // Energy pulsing during morph
          const material = node.material as any;
          const pulse = Math.sin(time * 8 + i) * 0.3 + 0.7;
          material.emissiveIntensity = pulse * (1 - smoothProgress);
        });

        // Connections pulse and fade during morphing
        connectionsRef.current.forEach((conn, i) => {
          const { line } = conn;
          const material = line.material as THREE.LineBasicMaterial;

          // Energy waves traveling through connections
          const wavePosition = (time * 4 + i * 0.1) % 1;
          const waveIntensity = Math.sin(wavePosition * Math.PI) * 0.5 + 0.5;
          material.opacity = (0.2 + waveIntensity * 0.3) * (1 - smoothProgress * 0.7);
        });

        // Orb emerges with smooth scaling and glowing
        if (time >= 5.0) {
          const orbProgress = (time - 5.0) / 1.5;
          const smoothOrbProgress = orbProgress * orbProgress * (3 - 2 * orbProgress); // Smoothstep

          if (orbRef.current) {
            const orbMaterial = orbRef.current.material as THREE.MeshBasicMaterial;

            // Smooth opacity fade-in with pulsing
            const baseOpacity = Math.pow(smoothOrbProgress, 1.5) * 0.7;
            const pulseOpacity = Math.sin(time * 4) * 0.1;
            orbMaterial.opacity = Math.min(0.8, baseOpacity + pulseOpacity);

            // Smooth scale growth with organic pulsing
            const baseScale = smoothOrbProgress * 0.8;
            const pulseScale = Math.sin(time * 3) * 0.05;
            orbRef.current.scale.setScalar(Math.max(0.1, baseScale + pulseScale));

            // Orb begins gentle rotation
            orbRef.current.rotation.y += 0.01 * smoothOrbProgress;
          }
        }

        // Smooth color transition to final green
        const targetColor = new THREE.Color(MIND_ASSEMBLY_CONFIG.targetColor);
        const colorLerpFactor = smoothProgress * 0.03; // Very gradual color shift

        nodesRef.current.forEach(node => {
          const material = node.material as any;
          if (material && material.color && material.emissive) {
            material.color.lerp(targetColor, colorLerpFactor);
            material.emissive.lerp(targetColor, colorLerpFactor);
          }
        });

        connectionsRef.current.forEach(conn => {
          const material = conn.line.material as THREE.LineBasicMaterial;
          if (material && material.color) {
            material.color.lerp(targetColor, colorLerpFactor);
          }
        });

        if (glowRef.current && (glowRef.current.material as any).uniforms && (glowRef.current.material as any).uniforms.color) {
          (glowRef.current.material as any).uniforms.color.value.lerp(targetColor, colorLerpFactor);
        }

        // Core pulses in harmony with the morphing
        if (coreRef.current) {
          const coreMaterial = coreRef.current.material as THREE.MeshBasicMaterial;
          const corePulse = Math.sin(time * 5) * 0.2 + 0.8;
          coreMaterial.emissiveIntensity = corePulse * (1 - smoothProgress * 0.5);
          coreRef.current.scale.setScalar(1 + corePulse * 0.1 * (1 - smoothProgress));
        }
      }

      // Phase 6: Text and stabilization (6.0-7.0s) - FASTER fade out of nodes/connections
      if (time >= MIND_ASSEMBLY_CONFIG.phases.textStabilization.start && 
          time < MIND_ASSEMBLY_CONFIG.phases.textStabilization.start + MIND_ASSEMBLY_CONFIG.phases.textStabilization.duration) {
        
        const phase6Progress = (time - MIND_ASSEMBLY_CONFIG.phases.textStabilization.start) / MIND_ASSEMBLY_CONFIG.phases.textStabilization.duration;
        
        // Fade out connections QUICKLY
        connectionsRef.current.forEach(conn => {
          const material = conn.line.material as THREE.LineBasicMaterial;
          material.opacity *= 0.90; // Faster fade (was 0.96)
        });
        
        // Fade out nodes QUICKLY
        nodesRef.current.forEach(node => {
          const material = node.material as THREE.MeshBasicMaterial;
          material.opacity *= 0.88; // Faster fade (was 0.97)
        });
        
        // Fade out core QUICKLY
        if (coreRef.current) {
          const coreMaterial = coreRef.current.material as THREE.MeshBasicMaterial;
          coreMaterial.opacity *= 0.90; // Faster fade (was 0.96)
        }
        
        // Orb becomes more prominent as nodes fade
        if (orbRef.current) {
          const orbMaterial = orbRef.current.material as THREE.MeshBasicMaterial;
          orbMaterial.opacity = phase6Progress * 0.8; // Orb fades in as nodes fade out
        }
      }

      // Phase 7: Final state (7.0-8.0s) - Everything except orb should be invisible
      if (time >= MIND_ASSEMBLY_CONFIG.phases.finalState.start) {
        const finalProgress = (time - MIND_ASSEMBLY_CONFIG.phases.finalState.start) / MIND_ASSEMBLY_CONFIG.phases.finalState.duration;
        
        // Ensure nodes/connections/core are completely gone
        connectionsRef.current.forEach(conn => {
          const material = conn.line.material as THREE.LineBasicMaterial;
          material.opacity = 0;
        });
        
        nodesRef.current.forEach(node => {
          const material = node.material as THREE.MeshBasicMaterial;
          material.opacity = 0;
        });
        
        if (coreRef.current) {
          const coreMaterial = coreRef.current.material as THREE.MeshBasicMaterial;
          coreMaterial.opacity = 0;
        }
        
        // Only orb remains, gentle rotation
        if (orbRef.current) {
          orbRef.current.rotation.y += 0.005;

          // Organic breathing pattern - combines fast micro-pulses with slow macro-breathing
          const pulse = (Math.sin(time * 1.8) * 0.015) + (Math.sin(time * 0.3) * 0.008);
          orbRef.current.scale.setScalar(1 + pulse);

          // Keep orb visible
          const orbMaterial = orbRef.current.material as THREE.MeshBasicMaterial;
          orbMaterial.opacity = 0.8;
        }
        
        // Glow stays with orb
        if (glowRef.current && (glowRef.current.material as any).uniforms) {
          (glowRef.current.material as any).uniforms.intensity.value = 0.4;
        }
      }
      } // Close the else block

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
        (coreRef.current.material as any).dispose();
      }

      if (glowRef.current) {
        glowRef.current.geometry.dispose();
        (glowRef.current.material as any).dispose();
      }

      if (orbRef.current) {
        orbRef.current.geometry.dispose();
        (orbRef.current.material as any).dispose();
      }
      
      renderer.dispose();
    };
  }, [onComplete]);

  return <div ref={mountRef} className="absolute inset-0" />;
};

export default MindAssemblyScene;
