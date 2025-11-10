import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { checkWebGLSupport, getSanityColor } from '../../utils/sanityUtils';
import { STAR_FIELD_CONFIGS, CAMERA_DISTANCE } from '../../constants/sanityConstants';
import { vertexShader, fragmentShader, glowVertexShader, glowFragmentShader } from '../../shaders/orbShaders';
import MicroUniverse from './MicroUniverse';
import { CollectiveData } from '../../services/api';

interface ThreeSceneProps {
  sanity: number;
  isControlPanelVisible: boolean;
  cameraAngles?: {
    azimuth: number;
    elevation: number;
    distance: number;
  };
  collectiveData?: CollectiveData | null;
  collectiveAverage?: number | null;
  onZoomIn?: () => void; // Callback when user zooms into micro-universe
  onZoomOut?: () => void; // Callback when user zooms out to macro view
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ sanity, isControlPanelVisible, cameraAngles, collectiveData, collectiveAverage, onZoomIn, onZoomOut }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbRef = useRef<THREE.Mesh | null>(null);
  const glowRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  const starsRef = useRef<THREE.Points[]>([]);
  const microUniverseRef = useRef<MicroUniverse | null>(null);
  const timeRef = useRef(0);
  const sanityRef = useRef(sanity);
  const targetColorRef = useRef(getSanityColor(sanity));
  const currentColorRef = useRef(getSanityColor(sanity));
  const [error, setError] = useState<string | null>(null);

  // LOD (Level of Detail) state
  const [lodLevel, setLodLevel] = useState<'macro' | 'transition' | 'micro'>('macro');
  const lastLodLevelRef = useRef<'macro' | 'transition' | 'micro'>('macro');



  // Camera position will be controlled by props

  useEffect(() => {
    if (!checkWebGLSupport()) {
      setError('WebGL is not supported in this browser. Please try using a different browser or enable WebGL.');
      return;
    }

    if (!mountRef.current) return;

    try {
      const mountElement = mountRef.current;
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      
      const camera = new THREE.PerspectiveCamera(
        60,
        mountElement.clientWidth / mountElement.clientHeight,
        0.1,
        1000
      );
      camera.position.z = CAMERA_DISTANCE;
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance",
        logarithmicDepthBuffer: true,
        precision: "highp"
      });
      renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      mountElement.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Create star fields
      const starFields = STAR_FIELD_CONFIGS.map(config => {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const sizes = [];
        
        for (let i = 0; i < config.count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          const r = config.distance + (Math.random() - 0.5) * config.distance * 0.3;
          
          vertices.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          );
          sizes.push(config.size * (0.5 + Math.random() * 0.5));
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({ 
          color: 0xffffff, 
          size: config.size,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending
        });
        
        const stars = new THREE.Points(geometry, material);
        stars.userData.speed = config.speed;
        scene.add(stars);
        return stars;
      });
      starsRef.current = starFields;

      // Create orb - optimized geometry for better performance
      const orbGeometry = new THREE.SphereGeometry(1.8, 96, 96);
      const orbMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0x00ff88) }, // Brighter green for better visibility
          pulseSpeed: { value: 1.0 },
          turbulence: { value: 0.0 }
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
      });

      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      orbRef.current = orb;
      scene.add(orb);

      // Create glow - optimized geometry
      const glowGeometry = new THREE.SphereGeometry(2.2, 48, 48);
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0x00ff88) }, // Brighter green for better visibility
          coefficient: { value: 0.5 },
          power: { value: 3.0 }
        },
        vertexShader: glowVertexShader,
        fragmentShader: glowFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      });

      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glowRef.current = glow;
      scene.add(glow);

      // Create particles - optimized count and geometry
      const particles: THREE.Mesh[] = [];
      for (let i = 0; i < 120; i++) {
        const geometry = new THREE.SphereGeometry(0.02, 6, 6);
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
        
        particle.userData = {
          radius,
          theta,
          phi,
          speed: 0.2 + Math.random() * 0.3,
          orbitSpeed: 0.001 + Math.random() * 0.002,
          verticalSpeed: 0.0005 + Math.random() * 0.001
        };
        
        particles.push(particle);
        scene.add(particle);
      }
      particlesRef.current = particles;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0x222244, 0.4);
      scene.add(ambientLight);

      const keyLight = new THREE.PointLight(0x00ff00, 1.5, 20);
      keyLight.position.set(0, 0, 0);
      scene.add(keyLight);

      const rimLight1 = new THREE.PointLight(0x4466ff, 0.8, 15);
      rimLight1.position.set(5, 3, -3);
      scene.add(rimLight1);

      const rimLight2 = new THREE.PointLight(0x6644ff, 0.6, 15);
      rimLight2.position.set(-4, -2, -3);
      scene.add(rimLight2);

      // Initialize MicroUniverse
      const microUniverse = new MicroUniverse({
        collectiveData: null,
        visible: false,
        onOrbClick: (clusterId) => {
          console.log('Clicked cluster:', clusterId);
          // Handle cluster click - could show details, etc.
        }
      });
      scene.add(microUniverse.getObject3D());
      microUniverseRef.current = microUniverse;

      // Animation loop - optimized for performance
      let animationId: number;
      let lastTime = 0;
      const animate = (currentTime: number) => {
        animationId = requestAnimationFrame(animate);

        const deltaTime = (currentTime - lastTime) * 0.001; // Convert to seconds
        lastTime = currentTime;

        timeRef.current += deltaTime * 2; // Much slower, more controlled speed
        const t = timeRef.current;

        // Pre-calculate common values using ref for smooth updates
        const chaos = 1 - sanityRef.current / 100;
        const chaosFactor = chaos * 0.8;
        const pulseSpeed = 0.8 + chaos * 1.2;

        if (orbRef.current && orbRef.current.material && (orbRef.current.material as THREE.ShaderMaterial).uniforms) {
          const orbMaterial = orbRef.current.material as THREE.ShaderMaterial;
          orbMaterial.uniforms.time.value = t;
          orbMaterial.uniforms.pulseSpeed.value = pulseSpeed;
          orbMaterial.uniforms.turbulence.value = chaosFactor;

          // Slower, more controlled rotation based on sanity
          const rotationSpeed = 0.3 + chaos * 0.7; // Slower base speed, increases with chaos
          orbRef.current.rotation.y += deltaTime * rotationSpeed;
          orbRef.current.rotation.x = Math.sin(t * 0.2) * 0.05; // Slower oscillation
          orbRef.current.rotation.z = Math.cos(t * 0.25) * 0.03; // Slower oscillation

          const basePulse = Math.sin(t * pulseSpeed * 0.5) * 0.02; // Slower pulse
          const microPulse = Math.sin(t * 2) * 0.005 * chaos; // Much slower micro pulse
          const scale = 1 + basePulse + microPulse;
          orbRef.current.scale.setScalar(scale);
        }

        if (glowRef.current && orbRef.current) {
          glowRef.current.rotation.y = orbRef.current.rotation.y * 0.5;
          const glowScale = orbRef.current.scale.x * 1.05;
          glowRef.current.scale.setScalar(glowScale);
        }

        // Optimized particle updates - much slower and more controlled
        particlesRef.current.forEach((particle, i) => {
          const data = particle.userData;

          // Much slower orbit speeds
          data.theta += data.orbitSpeed * deltaTime * 200;
          data.phi += data.verticalSpeed * Math.sin(t + i) * deltaTime * 200;

          const wobble = Math.sin(t * data.speed * 0.3 + i) * 0.2 * chaos; // Slower wobble
          const radius = data.radius + wobble;

          particle.position.x = radius * Math.sin(data.phi) * Math.cos(data.theta);
          particle.position.y = radius * Math.sin(data.phi) * Math.sin(data.theta);
          particle.position.z = radius * Math.cos(data.phi);

          const distanceFromCenter = particle.position.length();
          (particle.material as THREE.MeshBasicMaterial).opacity = 0.3 + (1 - distanceFromCenter / 5) * 0.5;

          // Much slower rotation
          particle.rotation.x += deltaTime * 5;
          particle.rotation.y += deltaTime * 7;
        });

        // Optimized star field updates - much slower
        starsRef.current.forEach((field, i) => {
          field.rotation.y += field.userData.speed * deltaTime * 200;
          field.rotation.x += field.userData.speed * 0.5 * deltaTime * 200;

          const breathe = Math.sin(t * 0.3 + i) * 0.1 + 1; // Slower breathing
          (field.material as THREE.PointsMaterial).opacity = 0.4 + breathe * 0.2;
        });



        renderer.render(scene, camera);
      };
      animate(0);

      const handleResize = () => {
        if (!mountElement || !camera || !renderer) return;
        const width = mountElement.clientWidth;
        const height = mountElement.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationId);
        if (mountElement && renderer.domElement) {
          mountElement.removeChild(renderer.domElement);
        }
        
        orbGeometry.dispose();
        if (Array.isArray(orbMaterial)) {
          orbMaterial.forEach(m => m.dispose());
        } else {
          orbMaterial.dispose();
        }
        glowGeometry.dispose();
        if (Array.isArray(glowMaterial)) {
          glowMaterial.forEach(m => m.dispose());
        } else {
          glowMaterial.dispose();
        }
        particles.forEach(p => {
          p.geometry.dispose();
          if (Array.isArray(p.material)) {
            p.material.forEach(m => m.dispose());
          } else {
            p.material.dispose();
          }
        });
        starFields.forEach(field => {
          field.geometry.dispose();
          if (Array.isArray(field.material)) {
            field.material.forEach(m => m.dispose());
          } else {
            (field.material as any).dispose();
          }
        });
        renderer.dispose();
      };
    } catch (err) {
      console.error('Three.js initialization error:', err);
      setError(`Three.js error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []); // Remove sanity dependency to prevent scene recreation

  // Update sanity ref for smooth animation
  useEffect(() => {
    sanityRef.current = sanity;
  }, [sanity]);

  // Color update effect with smoother transitions - AI-enhanced averaging
  useEffect(() => {
    if (orbRef.current && glowRef.current && orbRef.current.material && (orbRef.current.material as THREE.ShaderMaterial).uniforms) {
      // Calculate blended color using individual sanity and collective average
      const individualColor = getSanityColor(sanity);
      let targetColor = individualColor;

      // If we have collective data, blend with collective average
      if (collectiveAverage !== null && collectiveAverage !== undefined) {
        const collectiveColor = getSanityColor(collectiveAverage);

        // Blend individual and collective colors based on LOD level
        // In macro view, show more individual color; in micro view, show more collective
        const collectiveWeight = lodLevel === 'micro' ? 0.7 :
                                lodLevel === 'transition' ? 0.4 : 0.2;

        targetColor = individualColor.clone().lerp(collectiveColor, collectiveWeight);
      }

      targetColorRef.current = targetColor;
      let animationId: number;

      const updateColors = () => {
        if (!orbRef.current || !glowRef.current) return;

        const orbMaterial = orbRef.current.material as THREE.ShaderMaterial;
        const glowMaterial = glowRef.current.material as THREE.ShaderMaterial;

        // Smoother interpolation with easing
        const lerpFactor = 0.08; // Increased from 0.05 for smoother transitions

        orbMaterial.uniforms.color.value.lerp(targetColor, lerpFactor);
        glowMaterial.uniforms.color.value.lerp(targetColor, lerpFactor);

        particlesRef.current.forEach(particle => {
          (particle.material as THREE.MeshBasicMaterial).color.lerp(targetColor, lerpFactor);
        });

        const currentColor = orbMaterial.uniforms.color.value;
        const distance = Math.abs(currentColor.r - targetColor.r) +
                        Math.abs(currentColor.g - targetColor.g) +
                        Math.abs(currentColor.b - targetColor.b);

        if (distance > 0.005) { // Reduced threshold for more precise color matching
          animationId = requestAnimationFrame(updateColors);
        }
      };

      updateColors();

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }
  }, [sanity, collectiveAverage, lodLevel]);

  // Update camera position based on cameraAngles prop
  useEffect(() => {
    if (cameraRef.current && cameraAngles) {
      const camera = cameraRef.current;

      // Convert spherical coordinates to Cartesian (matching original camera.position.z = 6)
      // azimuth: horizontal rotation, elevation: vertical angle from horizontal plane
      const x = cameraAngles.distance * Math.sin(cameraAngles.azimuth) * Math.cos(cameraAngles.elevation);
      const y = cameraAngles.distance * Math.sin(cameraAngles.elevation);
      const z = cameraAngles.distance * Math.cos(cameraAngles.azimuth) * Math.cos(cameraAngles.elevation);

      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
    }
  }, [cameraAngles]);

  // Control panel visibility should NOT affect camera or orb - removed problematic effect

  // LOD (Level of Detail) monitoring - check camera distance to determine zoom level
  // Only trigger when user is NOT actively controlling camera (no mouse down)
  useEffect(() => {
    if (!cameraRef.current) return;

    const checkLodLevel = () => {
      const camera = cameraRef.current;
      if (!camera) return;

      const distance = camera.position.length();
      console.log('Camera distance:', distance, 'LOD level:', lodLevel);

      let newLodLevel: 'macro' | 'transition' | 'micro';

      if (distance < 3.5) { // More conservative threshold
        newLodLevel = 'micro';
      } else if (distance < 7) { // Wider transition zone
        newLodLevel = 'transition';
      } else {
        newLodLevel = 'macro';
      }

      if (newLodLevel !== lastLodLevelRef.current) {
        console.log('LOD transition:', lastLodLevelRef.current, '->', newLodLevel);
        setLodLevel(newLodLevel);

        // Only trigger callbacks for actual state changes, not transitions
        if (lastLodLevelRef.current === 'macro' && newLodLevel === 'micro') {
          console.log('Triggering onZoomIn callback');
          onZoomIn?.();
        } else if (lastLodLevelRef.current === 'micro' && newLodLevel === 'macro') {
          console.log('Triggering onZoomOut callback');
          onZoomOut?.();
        }

        lastLodLevelRef.current = newLodLevel;
      }
    };

    // Check LOD level initially and when camera angles change significantly
    checkLodLevel();
  }, [cameraAngles, onZoomIn, onZoomOut, lodLevel]);

  // Update MicroUniverse data when collectiveData changes
  useEffect(() => {
    console.log('ThreeScene: collectiveData changed:', collectiveData);
    if (microUniverseRef.current && collectiveData !== undefined) {
      console.log('ThreeScene: updating MicroUniverse with data');
      microUniverseRef.current.updateData(collectiveData);
    } else {
      console.log('ThreeScene: MicroUniverse not ready or no data');
    }
  }, [collectiveData]);

  // Handle LOD transitions - control MicroUniverse visibility only
  useEffect(() => {
    console.log('LOD Level changed to:', lodLevel);

    if (microUniverseRef.current) {
      // Show micro-universe when in micro or transition LOD levels
      const shouldShow = lodLevel === 'micro' || lodLevel === 'transition';
      microUniverseRef.current.setVisible(shouldShow);
    }

    // Removed automatic camera transitions - let user control zoom manually
    if (lodLevel === 'micro' && lastLodLevelRef.current !== 'micro') {
      console.log('Micro-universe activated');
      onZoomIn?.();
    } else if (lodLevel === 'macro' && lastLodLevelRef.current !== 'macro') {
      console.log('Macro view activated');
      onZoomOut?.();
    }
  }, [lodLevel, onZoomIn, onZoomOut]);

  if (error) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto px-8">
          <h1 className="text-3xl font-bold mb-6 text-red-400">WebGL Error</h1>
          <p className="text-white/80 mb-6">{error}</p>
          <div className="space-y-3 text-sm text-white/60">
            <p>• Try using Chrome, Firefox, or Edge</p>
            <p>• Enable hardware acceleration in your browser</p>
            <p>• Update your graphics drivers</p>
            <p>• Try disabling browser extensions</p>
          </div>
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className="absolute inset-0" />;
};

export default ThreeScene;
