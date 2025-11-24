import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { checkWebGLSupport, getSanityColor } from '../../utils/sanityUtils';
import { STAR_FIELD_CONFIGS, CAMERA_DISTANCE } from '../../constants/sanityConstants';
import { 
  vertexShader, 
  fragmentShader, 
  glowVertexShader, 
  glowFragmentShader,
  dysonVolumetricVertexShader,
  dysonVolumetricFragmentShader
} from '../../shaders/orbShaders';
import MicroUniverse from './MicroUniverse';
import { CollectiveData } from '../../services/api';

/**
 * ADVANCED CIVILIZATION CONTAINMENT SHELL
 * Type I civilization consciousness containment field
 * Mathematical harmony: 6.0 radius sphere (3.33x orb scale)
 */

interface ThreeSceneProps {
  sanity: number;
  isControlPanelVisible: boolean;
  collectiveData?: CollectiveData | null;
  collectiveAverage?: number | null;
  onZoomIn?: () => void; // Callback when user zooms into micro-universe
  onZoomOut?: () => void; // Callback when user zooms out to macro view
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ sanity, collectiveData, collectiveAverage, onZoomIn, onZoomOut }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const orbRef = useRef<THREE.Mesh | null>(null);
  const glowRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  const starsRef = useRef<THREE.Points[]>([]);
  const microUniverseRef = useRef<MicroUniverse | null>(null);
  const dysonSphereRef = useRef<THREE.Mesh | null>(null);
  const dysonEnergyRef = useRef<THREE.Mesh | null>(null);
  const dysonGridRef = useRef<THREE.Mesh | null>(null);
  const dysonAtmosphereRef = useRef<THREE.Mesh | null>(null);
  const volumetricLayersRef = useRef<THREE.Mesh[]>([]);
  const timeRef = useRef(0);
  const sanityRef = useRef(sanity);
  const targetColorRef = useRef(getSanityColor(sanity));
  const [error, setError] = useState<string | null>(null);

  // New refs for the containment ring
  const containmentRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef(new THREE.Clock()); // Use a dedicated clock for the mixer


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
      mountElement.style.pointerEvents = 'auto';
      mountElement.style.background = '#000005'; // FIX: Force dark background
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#000005');
      sceneRef.current = scene;
      
      const camera = new THREE.PerspectiveCamera(
        60,
        mountElement.clientWidth / mountElement.clientHeight,
        0.1,
        5000
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

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 2.5;
      controls.maxDistance = 2000.0;
      controls.autoRotate = false;
      controls.enablePan = true;
      controls.screenSpacePanning = true;
      controls.target.set(0, 0, 0);
      controlsRef.current = controls;

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
      for (let i = 0; i < 200; i++) {
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
      const ambientLight = new THREE.AmbientLight(0x404040, 1.0); // FIX: Adjusted lighting
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

      // ADVANCED CIVILIZATION CONTAINMENT SHELL - DYSON SPHERE
      // Multi-layered structure with beautiful animations
      const containmentRadius = 6.0;
      const initialColor = getSanityColor(sanity);
      
      // ADVANCED VOLUMETRIC DYSON SPHERE - Interstellar style
      // Multi-layered volumetric structure with realistic energy harvesting
      const metallicBaseColor = new THREE.Color(0x0a0a0a);
      const metallicDark = new THREE.Color(0x1a1a1a);
      const metallicMedium = new THREE.Color(0x2a2a2a);
      const metallicLight = new THREE.Color(0x3a3a3a);
      const accentColor1 = new THREE.Color(0x4a4a4a);
      const accentColor2 = new THREE.Color(0x1f1f1f);
      
      // Main volumetric Dyson sphere - high detail
      const dysonGeometry = new THREE.SphereGeometry(containmentRadius, 128, 128);
      const dysonMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: initialColor },
          chaos: { value: 0.0 },
          sanity: { value: sanity },
          energyHarvest: { value: 1.0 }
        },
        vertexShader: dysonVolumetricVertexShader,
        fragmentShader: dysonVolumetricFragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
        depthWrite: false,
        depthTest: true
      });
      
      const dysonSphere = new THREE.Mesh(dysonGeometry, dysonMaterial);
      dysonSphereRef.current = dysonSphere;
      dysonSphere.renderOrder = 100; // Render last
      scene.add(dysonSphere);
      
      // Energy Layer - Driven by sanity orb
      const energyGeometry = new THREE.SphereGeometry(containmentRadius * 1.003, 64, 64);
      const energyMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: initialColor }, // Sanity orb color
          chaos: { value: 0.0 },
          sanity: { value: sanity }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vWorldPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color; // Sanity orb color
          uniform float time;
          uniform float chaos;
          uniform float sanity;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vWorldPosition;
          
          // Interstellar energy waves - powerful and cosmic
          float interstellarWaves(vec3 pos, float t) {
            float wave1 = sin(length(pos) * 0.6 - t * 2.5);
            float wave2 = sin(length(pos) * 0.8 - t * 2.0);
            float wave3 = sin(length(pos) * 1.0 - t * 3.0);
            float combined = (wave1 + wave2 + wave3) / 3.0;
            return smoothstep(0.2, 0.8, combined);
          }
          
          // Matrix energy streams
          float matrixStreams(vec3 pos, float t) {
            float stream1 = sin(dot(pos, vec3(1.0, 0.0, 0.0)) * 10.0 + t * 2.0);
            float stream2 = sin(dot(pos, vec3(0.0, 1.0, 0.0)) * 10.0 + t * 2.5);
            float stream3 = sin(dot(pos, vec3(0.0, 0.0, 1.0)) * 10.0 + t * 2.2);
            float combined = (stream1 + stream2 + stream3) / 3.0;
            return smoothstep(0.3, 0.7, abs(combined));
          }
          
          // Energy nodes - power points
          float energyNodes(vec3 pos, float t) {
            vec3 nodePos = pos * 0.5;
            float node1 = sin(length(nodePos) * 4.0 + t * 1.0);
            float node2 = sin(length(nodePos * 1.5) * 3.0 + t * 1.2);
            return smoothstep(0.4, 0.6, (node1 + node2) / 2.0);
          }
          
          void main() {
            // Interstellar energy
            float interstellar = interstellarWaves(vPosition, time);
            float waves = sin(time * 1.5 + length(vPosition) * 0.5) * 0.5 + 0.5;
            
            // Matrix streams
            float matrix = matrixStreams(vPosition, time);
            
            // Energy nodes
            float nodes = energyNodes(vPosition, time);
            
            // Connection to orb - Energy harvesting zones
            vec3 toCenter = normalize(-vWorldPosition);
            float facingOrb = max(dot(vNormal, toCenter), 0.0);
            float connection = pow(facingOrb, 8.0); // Wider zones
            
            // Energy harvesting streams - radial beams flowing from orb
            vec3 radialDir = normalize(vWorldPosition);
            float radialAngle = atan(radialDir.z, radialDir.x);
            float radialElevation = acos(radialDir.y);
            float stream1 = sin(radialAngle * 6.0 + time * 1.2) * 0.5 + 0.5;
            float stream2 = sin(radialElevation * 5.0 + time * 1.0) * 0.5 + 0.5;
            float energyStreams = (stream1 + stream2) / 2.0;
            energyStreams = smoothstep(0.5, 0.8, energyStreams);
            
            float connectionPulse = sin(time * 2.0 + length(vWorldPosition) * 0.25) * 0.5 + 0.5;
            float connectionActive = connection * (connectionPulse * 0.6 + energyStreams * 0.4);
            
            // Sanity state
            float sanityState = sanity / 100.0;
            
            // Energy intensity varies VERY PRONOUNCEDLY with sanity - reduced brightness
            float energyIntensity = 0.2 + sanityState * 0.4;
            vec3 sanityEnergy = color * energyIntensity;
            sanityEnergy = mix(sanityEnergy, color * (energyIntensity * 1.2), interstellar * waves);
            
            // Combine energies - ALL sanity orb color - reduced
            vec3 finalEnergy = vec3(0.0);
            finalEnergy = mix(finalEnergy, sanityEnergy, interstellar * 0.3);
            finalEnergy = mix(finalEnergy, color * (energyIntensity * 0.6), matrix * 0.25);
            finalEnergy += color * nodes * (0.15 + sanityState * 0.2);
            
            // Connection power - INTENSE sanity orb energy harvesting - reduced
            float connectionIntensity = 0.3 + sanityState * 0.35;
            vec3 connectionPower = color * connectionIntensity;
            finalEnergy = mix(finalEnergy, connectionPower, connectionActive * 0.4);
            
            // Energy streams - pronounced harvesting beams - reduced
            vec3 streamColor = color * (0.25 + sanityState * 0.25);
            finalEnergy = mix(finalEnergy, streamColor, energyStreams * connection * 0.2);
            
            // Sanity color - VERY PRONOUNCED when harvesting - reduced
            float harvestIntensity = 0.25 + sanityState * 0.3;
            finalEnergy = mix(finalEnergy, color * harvestIntensity, connectionActive * 0.25);
            
            // Alpha - subtle energy - reduced
            float alpha = interstellar * 0.08 + matrix * 0.06 + nodes * 0.05 + connectionActive * 0.1;
            alpha = max(alpha, 0.0);
            alpha = min(alpha, 0.2); // Cap for openness
            
            gl_FragColor = vec4(finalEnergy, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true
      });
      const dysonEnergy = new THREE.Mesh(energyGeometry, energyMaterial);
      dysonEnergyRef.current = dysonEnergy;
      dysonEnergy.renderOrder = 101;
      scene.add(dysonEnergy);
      
      // Mechanical Structural Grid Layer - Terminator-like framework
      const gridGeometry = new THREE.SphereGeometry(containmentRadius * 0.998, 64, 64);
      const gridMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: initialColor }, // Sanity orb color
          chaos: { value: 0.0 },
          sanity: { value: sanity },
          metallicColor: { value: metallicBaseColor },
          metallicDark: { value: metallicDark },
          metallicMedium: { value: metallicMedium },
          metallicLight: { value: metallicLight },
          accent2: { value: accentColor2 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vWorldPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color; // Sanity orb color
          uniform vec3 metallicColor;
          uniform vec3 metallicDark;
          uniform vec3 metallicMedium;
          uniform vec3 metallicLight;
          uniform vec3 accent2;
          uniform float time;
          uniform float chaos;
          uniform float sanity;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vWorldPosition;
          
          // Matrix grid - hard edges
          float matrixGrid(vec2 uv, float scale) {
            vec2 grid = uv * scale;
            vec2 gv = fract(grid);
            
            // Hard grid lines
            float gridX = step(0.01, gv.x) * step(0.99, gv.x);
            float gridY = step(0.01, gv.y) * step(0.99, gv.y);
            return max(gridX, gridY);
          }
          
          // Hexagonal framework
          float hexFramework(vec2 uv, float scale) {
            vec2 grid = uv * scale;
            vec2 gv = fract(grid) - 0.5;
            float x = gv.x;
            float y = gv.y;
            float z = -x - y;
            float dist = min(min(abs(x), abs(y)), abs(z));
            return 1.0 - smoothstep(0.0, 0.04, dist);
          }
          
          void main() {
            vec2 uv = vec2(
              atan(vNormal.z, vNormal.x) / 3.14159 * 0.5 + 0.5,
              acos(vNormal.y) / 3.14159
            );
            
            // Matrix grids at multiple scales
            float grid1 = matrixGrid(uv, 20.0);
            float grid2 = matrixGrid(uv, 40.0);
            float hex1 = hexFramework(uv, 14.0);
            float hex2 = hexFramework(uv, 28.0);
            
            // Grid intersections
            float intersections = step(0.9, grid1) * step(0.9, grid2);
            
            // Animated Matrix code
            float code = step(0.8, fract(sin(dot(floor(uv * 30.0), vec2(12.9898, 78.233)) + time * 0.5) * 43758.5453));
            
            // Dark framework base
            vec3 framework = metallicColor;
            
            // Sanity state
            float sanityState = sanity / 100.0;
            
            // Mechanical grid - metallic highlights
            framework = mix(framework, metallicLight, grid1 * 0.4);
            framework = mix(framework, metallicMedium, grid2 * 0.3);
            
            // Hexagonal framework - mechanical structure
            framework = mix(framework, accent2 * 0.8, hex1 * 0.3);
            framework = mix(framework, accent2 * 0.6, hex2 * 0.2);
            
            // Intersections - sanity orb color, intensity varies
            float intersectionIntensity = 0.5 + sanityState * 0.6;
            framework = mix(framework, color * intersectionIntensity, intersections * 0.7);
            
            // Data streams - sanity orb color
            float streamIntensity = 0.4 + sanityState * 0.5;
            framework = mix(framework, color * streamIntensity, code * 0.5);
            
            // Connection to orb - VERY PRONOUNCED sanity orb color
            vec3 toCenter = normalize(-vWorldPosition);
            float facingOrb = max(dot(vNormal, toCenter), 0.0);
            float connection = pow(facingOrb, 12.0);
            float connectionIntensity = 0.6 + sanityState * 0.7;
            framework = mix(framework, color * connectionIntensity, connection * 0.65);
            
            // Alpha - structural (more transparent)
            float alpha = (grid1 + grid2) * 0.1 + (hex1 + hex2) * 0.08 + intersections * 0.15 + code * 0.1;
            alpha = max(alpha, 0.0);
            alpha = min(alpha, 0.25); // Cap for openness
            
            gl_FragColor = vec4(framework, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true
      });
      const dysonGrid = new THREE.Mesh(gridGeometry, gridMaterial);
      dysonGridRef.current = dysonGrid;
      dysonGrid.renderOrder = 99;
      scene.add(dysonGrid);
      
      // Atmospheric Halo - Driven by sanity orb
      const atmosphereGeometry = new THREE.SphereGeometry(containmentRadius * 1.008, 64, 64);
      const atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: initialColor }, // Sanity orb color
          chaos: { value: 0.0 },
          sanity: { value: sanity }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vWorldPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color; // Sanity orb color
          uniform float time;
          uniform float chaos;
          uniform float sanity;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vWorldPosition;
          
          void main() {
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 5.0);
            
            // Sanity state
            float sanityState = sanity / 100.0;
            
            // Connection to orb - Energy harvesting
            vec3 toCenter = normalize(-vWorldPosition);
            float facingOrb = max(dot(vNormal, toCenter), 0.0);
            float connection = pow(facingOrb, 15.0);
            float connectionPulse = sin(time * 3.0 + length(vWorldPosition) * 0.2) * 0.5 + 0.5;
            float connectionActive = connection * connectionPulse;
            
            // Energy waves - driven by sanity
            float waves = sin(length(vWorldPosition) * 0.4 - time * 2.0) * 0.5 + 0.5;
            
            // Atmospheric glow - SANITY ORB COLOR, intensity varies VERY PRONOUNCEDLY
            float atmIntensity = 0.15 + sanityState * 0.4;
            vec3 atmosphere = color * atmIntensity;
            atmosphere = mix(atmosphere, color * (atmIntensity * 1.8), waves);
            
            // Connection zones - INTENSE sanity orb energy
            float connectionIntensity = 0.5 + sanityState * 0.7;
            atmosphere = mix(atmosphere, color * connectionIntensity, connectionActive * 0.7);
            
            // Sanity color accents - VERY PRONOUNCED
            atmosphere += color * connectionActive * (0.2 + sanityState * 0.3);
            
            // Alpha - subtle energy field
            float alpha = fresnel * 0.1 + connectionActive * 0.15 + waves * 0.08;
            alpha = max(alpha, 0.0);
            alpha = min(alpha, 0.25); // Cap for openness
            
            gl_FragColor = vec4(atmosphere, alpha);
          }
        `,
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      dysonAtmosphereRef.current = atmosphere;
      atmosphere.renderOrder = 102;
      scene.add(atmosphere);
      
      // ADVANCED ENERGY HARVESTING SYSTEM - Realistic particle streams
      const connectionParticles: THREE.Mesh[] = [];
      const connectionCount = 200; // More particles for realistic energy streams
      
      // Create energy harvesting beams - major streams
      const beamCount = 12;
      for (let b = 0; b < beamCount; b++) {
        const beamAngle = (b / beamCount) * Math.PI * 2;
        const beamElevation = (b % 3 - 1) * Math.PI * 0.2;
        
        // Multiple particles per beam for continuous stream
        for (let p = 0; p < 8; p++) {
          const particleGeometry = new THREE.SphereGeometry(0.06, 12, 12);
          const particleMaterial = new THREE.MeshBasicMaterial({
            color: initialColor,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
          });
          const particle = new THREE.Mesh(particleGeometry, particleMaterial);
          
          const startRadius = 2.2;
          const endRadius = 5.8;
          
          particle.userData = {
            angle: beamAngle,
            elevation: beamElevation,
            startRadius,
            endRadius,
            progress: (p / 8) + Math.random() * 0.1,
            speed: 0.15 + Math.random() * 0.1,
            phase: Math.random() * Math.PI * 2,
            size: 0.06 + Math.random() * 0.03,
            beamId: b
          };
          
          connectionParticles.push(particle);
          scene.add(particle);
        }
      }
      
      // Additional scattered particles for density
      for (let i = 0; i < connectionCount - (beamCount * 8); i++) {
        const particleGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
          color: initialColor,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        const angle = (i / connectionCount) * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * Math.PI * 0.6;
        const startRadius = 2.2;
        const endRadius = 5.8;
        
        particle.userData = {
          angle,
          elevation,
          startRadius,
          endRadius,
          progress: Math.random() * 0.5,
          speed: 0.2 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
          size: 0.04 + Math.random() * 0.02,
          beamId: -1
        };
        
        connectionParticles.push(particle);
        scene.add(particle);
      }
      
      // Store reference for animation
      const connectionParticlesRef = { current: connectionParticles };
      
      console.log('Dyson sphere created:', {
        radius: containmentRadius,
        cameraDistance: camera.position.length(),
        cameraPos: camera.position,
        color: initialColor,
        sphereAdded: true
      });

      // Load Techno Containment Ring
      const loader = new GLTFLoader();
      loader.load('/models/containment_ring.glb', (gltf) => {
        containmentRef.current = gltf.scene;
        containmentRef.current.position.set(0, 0, 0);

        gltf.scene.traverse((child) => {
          console.log(child.name);
          if (child instanceof THREE.Mesh) {
            const name = child.name.toLowerCase();
            if (name.includes('sphere') || name.includes('core') || name.includes('center')) {
              child.visible = false;
            } else if (name.includes('sun')) {
              const sun = child;
              sun.visible = true; // Make sun visible
              const sunLight = new THREE.PointLight(0xffffff, 2, 2000);
              sun.add(sunLight);
            } else {
              const oldMat = child.material as THREE.MeshStandardMaterial;
              const newMat = new THREE.MeshStandardMaterial({
                  map: oldMat.map,
                  emissiveMap: oldMat.map,
                  color: new THREE.Color(0x000000),
                  metalness: 0.5,
                  roughness: 0.5,
                  emissive: getSanityColor(sanity),
                  emissiveIntensity: 2.0,
                  transparent: true,
                  opacity: 1.0
              });
              child.material = newMat;
            }
          }
        });

        gltf.scene.scale.set(12, 12, 12);
        scene.add(gltf.scene);

        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(gltf.scene);
          gltf.animations.forEach((clip) => {
            mixerRef.current!.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play();
          });
        }
      });


      // Animation loop - optimized for performance
      let animationId: number;
      let lastTime = 0;
      const animate = (currentTime: number) => {
        animationId = requestAnimationFrame(animate);

        const delta = clockRef.current.getDelta();
        if (mixerRef.current) {
          const sanityValue = sanityRef.current;
          let timeScale;

          if (sanityValue >= 100) {
            timeScale = 0.1;
          } else if (sanityValue >= 50) {
            timeScale = 0.5;
          } else if (sanityValue >= 25) {
            timeScale = 1.0;
          } else {
            timeScale = 2.0;
          }
          mixerRef.current.timeScale = timeScale;
          mixerRef.current.update(delta);
        }
        if (controlsRef.current) {
          controlsRef.current.update(delta);
        }

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

        // DYSON SPHERE ANIMATIONS - Advanced volumetric Interstellar-style
        const dysonRotationSpeed = 0.05 + chaos * 0.1; // Slow, majestic rotation
        
        // Update main volumetric sphere
        if (dysonSphereRef.current && dysonSphereRef.current.material && (dysonSphereRef.current.material as THREE.ShaderMaterial).uniforms) {
          const dysonMaterial = dysonSphereRef.current.material as THREE.ShaderMaterial;
          if (dysonMaterial.uniforms.time) {
            dysonMaterial.uniforms.time.value = t;
          }
          if (dysonMaterial.uniforms.chaos) {
            dysonMaterial.uniforms.chaos.value = chaos;
          }
          if (dysonMaterial.uniforms.sanity) {
            dysonMaterial.uniforms.sanity.value = sanityRef.current;
          }
          if (dysonMaterial.uniforms.energyHarvest) {
            const harvestIntensity = 0.8 + (sanityRef.current / 100.0) * 0.4;
            dysonMaterial.uniforms.energyHarvest.value = harvestIntensity;
          }
          
          // Majestic, slow rotation
          dysonSphereRef.current.rotation.y += deltaTime * dysonRotationSpeed;
          dysonSphereRef.current.rotation.x = Math.sin(t * 0.08) * 0.05;
          dysonSphereRef.current.rotation.z = Math.cos(t * 0.1) * 0.03;
        }
        
        // Update additional volumetric layers
        if (volumetricLayersRef && volumetricLayersRef.current) {
          volumetricLayersRef.current.forEach((layer, index) => {
            if (layer && layer.material && (layer.material as THREE.ShaderMaterial).uniforms) {
              const material = layer.material as THREE.ShaderMaterial;
              if (material.uniforms.time) material.uniforms.time.value = t;
              if (material.uniforms.chaos) material.uniforms.chaos.value = chaos;
              if (material.uniforms.sanity) material.uniforms.sanity.value = sanityRef.current;
              if (material.uniforms.energyHarvest) {
                const harvestIntensity = (0.7 + index * 0.2) + (sanityRef.current / 100.0) * 0.3;
                material.uniforms.energyHarvest.value = harvestIntensity;
              }
              
              // Slight phase offset for depth
              const phase = index * Math.PI * 0.3;
              layer.rotation.y = dysonSphereRef.current?.rotation.y || 0 + Math.sin(t * 0.08 + phase) * 0.02;
              layer.rotation.x = (dysonSphereRef.current?.rotation.x || 0) + Math.cos(t * 0.1 + phase) * 0.015;
            }
          });
        }
        
        if (dysonEnergyRef.current && dysonEnergyRef.current.material && (dysonEnergyRef.current.material as THREE.ShaderMaterial).uniforms) {
          const energyMaterial = dysonEnergyRef.current.material as THREE.ShaderMaterial;
          if (energyMaterial.uniforms.time) {
            energyMaterial.uniforms.time.value = t;
          }
          if (energyMaterial.uniforms.chaos) {
            energyMaterial.uniforms.chaos.value = chaos;
          }
          if (energyMaterial.uniforms.sanity) {
            energyMaterial.uniforms.sanity.value = sanityRef.current;
          }
          // cameraPosition is built-in, no need to update
          
          // Elegant counter-rotation with phase offset for beautiful flow
          if (dysonSphereRef.current) {
            const phaseOffset = Math.PI * 0.25; // 45° phase offset
            dysonEnergyRef.current.rotation.y = -dysonSphereRef.current.rotation.y * 0.65 + Math.sin(t * 0.1) * 0.02;
            dysonEnergyRef.current.rotation.x = -dysonSphereRef.current.rotation.x * 0.55 + Math.cos(t * 0.12) * 0.015;
            dysonEnergyRef.current.rotation.z = Math.sin(t * 0.15 + phaseOffset) * 0.03;
          }
          
          // Beautiful energy pulse - flowing waves
          const energyPulse1 = Math.sin(t * 0.5) * 0.012;
          const energyPulse2 = Math.cos(t * 0.4) * 0.006;
          const energyPulse = energyPulse1 + energyPulse2;
          dysonEnergyRef.current.scale.setScalar(1.0 + energyPulse);
        }
        
        if (dysonGridRef.current && dysonGridRef.current.material && (dysonGridRef.current.material as THREE.ShaderMaterial).uniforms) {
          const gridMaterial = dysonGridRef.current.material as THREE.ShaderMaterial;
          if (gridMaterial.uniforms.time) {
            gridMaterial.uniforms.time.value = t;
          }
          if (gridMaterial.uniforms.chaos) {
            gridMaterial.uniforms.chaos.value = chaos;
          }
          if (gridMaterial.uniforms.sanity) {
            gridMaterial.uniforms.sanity.value = sanityRef.current;
          }
          // cameraPosition is built-in, no need to update
          
          // Elegant synchronized rotation with slight phase for depth
          if (dysonSphereRef.current) {
            const phase = Math.PI * 0.15;
            dysonGridRef.current.rotation.y = dysonSphereRef.current.rotation.y * 1.25 + Math.sin(t * 0.08) * 0.01;
            dysonGridRef.current.rotation.x = dysonSphereRef.current.rotation.x * 0.75 + Math.cos(t * 0.1 + phase) * 0.008;
            dysonGridRef.current.rotation.z = Math.sin(t * 0.12) * 0.015;
          }
        }
        
        // Atmosphere layer animation
        if (dysonAtmosphereRef.current && dysonAtmosphereRef.current.material && (dysonAtmosphereRef.current.material as THREE.ShaderMaterial).uniforms) {
          const atmosphereMaterial = dysonAtmosphereRef.current.material as THREE.ShaderMaterial;
          if (atmosphereMaterial.uniforms.time) {
            atmosphereMaterial.uniforms.time.value = t;
          }
          if (atmosphereMaterial.uniforms.chaos) {
            atmosphereMaterial.uniforms.chaos.value = chaos;
          }
          if (atmosphereMaterial.uniforms.sanity) {
            atmosphereMaterial.uniforms.sanity.value = sanityRef.current;
          }
          // Beautiful, gentle rotation with flowing motion
          if (dysonSphereRef.current) {
            dysonAtmosphereRef.current.rotation.y = dysonSphereRef.current.rotation.y * 0.32 + Math.sin(t * 0.06) * 0.01;
            dysonAtmosphereRef.current.rotation.x = Math.cos(t * 0.09) * 0.008;
            dysonAtmosphereRef.current.rotation.z = Math.sin(t * 0.07) * 0.006;
            
            // Gentle atmospheric breathing
            const atmPulse = Math.sin(t * 0.25) * 0.005;
            dysonAtmosphereRef.current.scale.setScalar(1.0 + atmPulse);
          }
        }

        // Energy harvesting particles - flowing FROM orb TO Dyson sphere
        if (connectionParticlesRef.current) {
          connectionParticlesRef.current.forEach((particle) => {
            const data = particle.userData;
            
            // Animate progress along harvesting path (0 = orb, 1 = Dyson sphere)
            data.progress += deltaTime * data.speed;
            if (data.progress > 1.0) {
              data.progress = 0.0; // Reset to orb surface to restart harvesting
            }
            
            // Interpolate position from orb to Dyson sphere
            const currentRadius = THREE.MathUtils.lerp(data.startRadius, data.endRadius, data.progress);
            
            // Spherical coordinates - particles flow outward from orb
            const angleOffset = t * 0.05; // Slow rotation
            particle.position.x = currentRadius * Math.cos(data.elevation) * Math.cos(data.angle + angleOffset);
            particle.position.y = currentRadius * Math.sin(data.elevation);
            particle.position.z = currentRadius * Math.cos(data.elevation) * Math.sin(data.angle + angleOffset);
            
            // Size increases as energy is harvested (particles grow as they flow outward) - reduced brightness
            const sizeMultiplier = 0.5 + data.progress * 0.5; // Start small, grow as harvested
            const pulse = Math.sin(t * 3.0 + data.phase) * 0.1 + 1.0;
            particle.scale.setScalar(data.size * sizeMultiplier * pulse * 0.6);
            
            // Opacity - brightest at mid-point (peak harvesting), fades at ends - reduced brightness
            const midPoint = 0.5;
            const distanceFromMid = Math.abs(data.progress - midPoint) / midPoint;
            const baseOpacity = 0.35 - distanceFromMid * 0.2; // Peak at midpoint
            const pulseOpacity = Math.sin(t * 2.5 + data.phase) * 0.08;
            const opacity = Math.max(0.12, Math.min(0.4, baseOpacity + pulseOpacity));
            (particle.material as THREE.MeshBasicMaterial).opacity = opacity;
            
            // Color sync with orb (energy being harvested from orb)
            if (orbRef.current && orbRef.current.material && (orbRef.current.material as THREE.ShaderMaterial).uniforms) {
              const orbColor = (orbRef.current.material as THREE.ShaderMaterial).uniforms.color.value;
              // Blend with Matrix green as energy is harvested (transforms from orb color to Matrix green) - reduced
              const harvestBlend = data.progress * 0.2; // Subtle transformation
              // Particles transform from orb color to slightly brighter version as harvested - reduced brightness
              const harvestColor = orbColor.clone().lerp(orbColor.clone().multiplyScalar(1.1), harvestBlend);
              const blendedColor = harvestColor;
              (particle.material as THREE.MeshBasicMaterial).color.copy(blendedColor);
            }
          });
        }
        
        if (containmentRef.current) {
          const sanityValue = sanityRef.current;
          let rotationSpeed;

          if (sanityValue >= 75) { // Stable
            rotationSpeed = 0.1;
          } else if (sanityValue >= 25) { // Warning
            rotationSpeed = 0.5;
          } else { // Critical
            rotationSpeed = 1.0;
          }
          
          containmentRef.current.rotation.z += rotationSpeed * deltaTime;

          const t = timeRef.current;
          containmentRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh && child.visible) {
              const material = child.material as THREE.MeshStandardMaterial;
              if (material.emissive) {
                  material.emissive.copy(targetColorRef.current); // Direct copy for instant response
                  // Pulse intensity
                  material.emissiveIntensity = 1.5 + (Math.sin(t * 2.5) * 0.5 * (1 - sanityValue / 100));
              }
            }
          });
        }

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
        
        // Cleanup containment ring
        if (containmentRef.current && sceneRef.current) {
          sceneRef.current.remove(containmentRef.current);
          containmentRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              const material = child.material as THREE.Material | THREE.Material[];
              if (Array.isArray(material)) {
                material.forEach((mat) => mat.dispose());
              } else {
                material.dispose();
              }
            }
          });
        }
        if (mixerRef.current) {
          mixerRef.current.stopAllAction();
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
        if (dysonSphereRef.current) {
          dysonSphereRef.current.geometry.dispose();
          if (Array.isArray(dysonSphereRef.current.material)) {
            dysonSphereRef.current.material.forEach(m => m.dispose());
          } else {
            (dysonSphereRef.current.material as THREE.Material).dispose();
          }
        }
        if (dysonEnergyRef.current) {
          dysonEnergyRef.current.geometry.dispose();
          if (Array.isArray(dysonEnergyRef.current.material)) {
            dysonEnergyRef.current.material.forEach(m => m.dispose());
          } else {
            (dysonEnergyRef.current.material as THREE.Material).dispose();
          }
        }
        if (dysonGridRef.current) {
          dysonGridRef.current.geometry.dispose();
          if (Array.isArray(dysonGridRef.current.material)) {
            dysonGridRef.current.material.forEach(m => m.dispose());
          } else {
            (dysonGridRef.current.material as THREE.Material).dispose();
          }
        }
        if (dysonAtmosphereRef.current) {
          dysonAtmosphereRef.current.geometry.dispose();
          if (Array.isArray(dysonAtmosphereRef.current.material)) {
            dysonAtmosphereRef.current.material.forEach(m => m.dispose());
          } else {
            (dysonAtmosphereRef.current.material as THREE.Material).dispose();
          }
        }
        particles.forEach(p => {
          p.geometry.dispose();
          if (Array.isArray(p.material)) {
            p.material.forEach(m => m.dispose());
          } else {
            p.material.dispose();
          }
        });
        if (connectionParticlesRef.current) {
          connectionParticlesRef.current.forEach(p => {
            p.geometry.dispose();
            if (Array.isArray(p.material)) {
              p.material.forEach(m => m.dispose());
            } else {
              p.material.dispose();
            }
          });
        }
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

        // Update Dyson sphere colors
        if (dysonSphereRef.current && dysonSphereRef.current.material && (dysonSphereRef.current.material as THREE.ShaderMaterial).uniforms) {
          (dysonSphereRef.current.material as THREE.ShaderMaterial).uniforms.color.value.lerp(targetColor, lerpFactor);
        }
        if (dysonEnergyRef.current && dysonEnergyRef.current.material && (dysonEnergyRef.current.material as THREE.ShaderMaterial).uniforms) {
          (dysonEnergyRef.current.material as THREE.ShaderMaterial).uniforms.color.value.lerp(targetColor, lerpFactor);
        }
        if (dysonGridRef.current && dysonGridRef.current.material && (dysonGridRef.current.material as THREE.ShaderMaterial).uniforms) {
          (dysonGridRef.current.material as THREE.ShaderMaterial).uniforms.color.value.lerp(targetColor, lerpFactor);
        }

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

  // REMOVED cameraAngles useEffect to allow OrbitControls to work


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
  }, [onZoomIn, onZoomOut, lodLevel]);

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

  return <div ref={mountRef} className="absolute inset-0" style={{ pointerEvents: 'auto' }} />;
};

export default ThreeScene;
