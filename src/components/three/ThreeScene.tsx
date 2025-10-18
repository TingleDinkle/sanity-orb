import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { checkWebGLSupport, getSanityColor } from '../../utils/sanityUtils';
import { STAR_FIELD_CONFIGS, CAMERA_DISTANCE } from '../../constants/sanityConstants';
import StarField from './StarField';
import Orb from './Orb';
import Glow from './Glow';
import ParticleSystem from './ParticleSystem';

interface ThreeSceneProps {
  sanity: number;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ sanity }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbRef = useRef<THREE.Mesh | null>(null);
  const glowRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  const starsRef = useRef<THREE.Points[]>([]);
  const timeRef = useRef(0);
  const [error, setError] = useState<string | null>(null);

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
        powerPreference: "high-performance"
      });
      renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

      // Create orb
      const orbGeometry = new THREE.SphereGeometry(1.8, 128, 128);
      const orbMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0x00ff00) },
          pulseSpeed: { value: 1.0 },
          turbulence: { value: 0.0 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          uniform float time;
          uniform float turbulence;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          uniform float pulseSpeed;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vec3 viewDirection = normalize(cameraPosition - vPosition);
            float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.5);
            
            float pulse = sin(time * pulseSpeed) * 0.5 + 0.5;
            float glow = fresnel * (0.6 + pulse * 0.4);
            
            vec3 finalColor = color * (0.4 + glow * 0.6);
            float alpha = 0.85 + fresnel * 0.15;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide
      });

      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      orbRef.current = orb;
      scene.add(orb);

      // Create glow
      const glowGeometry = new THREE.SphereGeometry(2.2, 64, 64);
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0x00ff00) },
          coefficient: { value: 0.5 },
          power: { value: 3.0 }
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
          uniform float coefficient;
          uniform float power;
          varying vec3 vNormal;
          
          void main() {
            float intensity = pow(coefficient - dot(vNormal, vec3(0.0, 0.0, 1.0)), power);
            gl_FragColor = vec4(color, intensity * 0.4);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      });

      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glowRef.current = glow;
      scene.add(glow);

      // Create particles
      const particles: THREE.Mesh[] = [];
      for (let i = 0; i < 150; i++) {
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

      // Animation loop
      let animationId: number;
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        timeRef.current += 0.01;
        const t = timeRef.current;

        if (orbRef.current && orbRef.current.material.uniforms) {
          orbRef.current.material.uniforms.time.value = t;
          orbRef.current.material.uniforms.pulseSpeed.value = 0.8 + (1 - sanity / 100) * 1.2;
          orbRef.current.material.uniforms.turbulence.value = (1 - sanity / 100) * 0.8;
          
          orbRef.current.rotation.y += 0.002;
          orbRef.current.rotation.x = Math.sin(t * 0.3) * 0.08;
          orbRef.current.rotation.z = Math.cos(t * 0.4) * 0.05;
          
          const chaos = 1 - sanity / 100;
          const basePulse = Math.sin(t * (0.8 + chaos * 1.2)) * 0.03;
          const microPulse = Math.sin(t * 4) * 0.01 * chaos;
          const scale = 1 + basePulse + microPulse;
          orbRef.current.scale.set(scale, scale, scale);
        }

        if (glowRef.current && orbRef.current) {
          glowRef.current.rotation.y = orbRef.current.rotation.y * 0.5;
          const glowScale = orbRef.current.scale.x * 1.05;
          glowRef.current.scale.set(glowScale, glowScale, glowScale);
        }

        particlesRef.current.forEach((particle, i) => {
          const data = particle.userData;
          
          data.theta += data.orbitSpeed;
          data.phi += data.verticalSpeed * Math.sin(t + i);
          
          const chaos = 1 - sanity / 100;
          const wobble = Math.sin(t * data.speed + i) * 0.3 * chaos;
          const radius = data.radius + wobble;
          
          particle.position.x = radius * Math.sin(data.phi) * Math.cos(data.theta);
          particle.position.y = radius * Math.sin(data.phi) * Math.sin(data.theta);
          particle.position.z = radius * Math.cos(data.phi);
          
          const distanceFromCenter = particle.position.length();
          particle.material.opacity = 0.3 + (1 - distanceFromCenter / 5) * 0.5;
          
          particle.rotation.x += 0.02;
          particle.rotation.y += 0.03;
        });

        starsRef.current.forEach((field, i) => {
          field.rotation.y += field.userData.speed;
          field.rotation.x += field.userData.speed * 0.5;
          
          const breathe = Math.sin(t * 0.5 + i) * 0.1 + 1;
          field.material.opacity = 0.4 + breathe * 0.2;
        });

        camera.position.x = Math.sin(t * 0.1) * 0.3;
        camera.position.y = Math.cos(t * 0.15) * 0.2;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };
      animate();

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
        orbMaterial.dispose();
        glowGeometry.dispose();
        glowMaterial.dispose();
        particles.forEach(p => {
          p.geometry.dispose();
          p.material.dispose();
        });
        starFields.forEach(field => {
          field.geometry.dispose();
          field.material.dispose();
        });
        renderer.dispose();
      };
    } catch (err) {
      console.error('Three.js initialization error:', err);
      setError(`Three.js error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [sanity]);

  // Color update effect
  useEffect(() => {
    if (orbRef.current && glowRef.current && orbRef.current.material.uniforms) {
      const targetColor = getSanityColor(sanity);
      
      const updateColors = () => {
        if (!orbRef.current || !glowRef.current) return;
        
        orbRef.current.material.uniforms.color.value.lerp(targetColor, 0.05);
        glowRef.current.material.uniforms.color.value.lerp(targetColor, 0.05);
        
        particlesRef.current.forEach(particle => {
          particle.material.color.lerp(targetColor, 0.05);
        });
        
        const currentColor = orbRef.current.material.uniforms.color.value;
        const distance = Math.abs(currentColor.r - targetColor.r) + 
                        Math.abs(currentColor.g - targetColor.g) + 
                        Math.abs(currentColor.b - targetColor.b);
        
        if (distance > 0.01) {
          requestAnimationFrame(updateColors);
        }
      };
      
      updateColors();
    }
  }, [sanity]);

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
