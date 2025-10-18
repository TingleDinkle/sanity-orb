import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const SanityOrb = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [sanity, setSanity] = useState<number>(100);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const orbRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> | null>(null);
  const glowRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> | null>(null);
  const particlesRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>[]>([]);
  const starsRef = useRef<THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>[] | null>(null);
  const timeRef = useRef(0);

  const getSanityColor = (value: number) => {
    if (value >= 75) {
      const t = (value - 75) / 25;
      return new THREE.Color().setHSL(0.45 + t * 0.1, 0.7 - t * 0.1, 0.5 + t * 0.1);
    } else if (value >= 50) {
      const t = (value - 50) / 25;
      return new THREE.Color().setHSL(0.35 + t * 0.1, 0.8, 0.55);
    } else if (value >= 25) {
      const t = (value - 25) / 25;
      return new THREE.Color().setHSL(0.15 + t * 0.2, 0.9, 0.55);
    } else {
      const t = value / 25;
      return new THREE.Color().setHSL(0.0 + t * 0.15, 0.95, 0.45 + t * 0.1);
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const createStarField = (count: number, size: number, distance: number, speed: number) => {
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
      return stars;
    };

    const starField1 = createStarField(1500, 0.15, 80, 0.0001);
    const starField2 = createStarField(800, 0.25, 60, 0.00015);
    const starField3 = createStarField(400, 0.35, 40, 0.0002);
    
    scene.add(starField1, starField2, starField3);
    starsRef.current = [starField1, starField2, starField3];

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
        
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          
          vec3 pos = position;
          float noise = snoise(position * 1.5 + time * 0.3) * turbulence * 0.15;
          pos += normal * noise;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
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

    const createParticleSystem = () => {
      const particleCount = 150;
      const particles = [];
      
      for (let i = 0; i < particleCount; i++) {
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
      
      return particles;
    };

    particlesRef.current = createParticleSystem();

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

      if (starsRef.current) {
        starsRef.current?.forEach((field: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>, i: number) => {
          field.rotation.y += field.userData.speed;
          field.rotation.x += field.userData.speed * 0.5;
          
          const breathe = Math.sin(t * 0.5 + i) * 0.1 + 1;
          field.material.opacity = 0.4 + breathe * 0.2;
        });
      }

      camera.position.x = Math.sin(t * 0.1) * 0.3;
      camera.position.y = Math.cos(t * 0.15) * 0.2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      orbGeometry.dispose();
      orbMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      particlesRef.current.forEach(p => {
        p.geometry.dispose();
        p.material.dispose();
      });
      starsRef.current?.forEach((field: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>) => {
        field.geometry.dispose();
        field.material.dispose();
      });
      renderer.dispose();
    };
  }, [sanity]);
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
        
        if (orbRef.current.material.uniforms.color.value.distanceTo(targetColor) > 0.01) {
          requestAnimationFrame(updateColors);
        }
      };
      
      updateColors();
    }
  }, [sanity]);

  const getSanityLabel = () => {
    if (sanity >= 75) return 'Coherent';
    if (sanity >= 50) return 'Stable';
    if (sanity >= 25) return 'Fractured';
    return 'Chaotic';
  };

  const getSanityDescription = () => {
    if (sanity >= 75) return 'All systems harmonized · Neural pathways aligned';
    if (sanity >= 50) return 'Minor fluctuations detected · Maintaining stability';
    if (sanity >= 25) return 'Significant instability present · Pattern degradation';
    return 'Critical coherence failure · Reality breakdown imminent';
  };

  const getGradientColor = () => {
    if (sanity >= 75) return 'from-emerald-500/20 to-green-500/20';
    if (sanity >= 50) return 'from-yellow-500/20 to-amber-500/20';
    if (sanity >= 25) return 'from-orange-500/20 to-amber-600/20';
    return 'from-red-600/20 to-rose-700/20';
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      
      <div ref={mountRef} className="absolute inset-0" />
      
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.6) 100%)'
        }} 
      />

      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
        <div className={`bg-gradient-to-br ${getGradientColor()} backdrop-blur-xl rounded-3xl px-10 py-5 border border-white/10 shadow-2xl transition-all duration-700`}>
          <div className="text-white/40 text-xs uppercase tracking-widest mb-2 font-light">
            System Status
          </div>
          <h1 className="text-white text-5xl font-extralight tracking-wider mb-3 transition-all duration-500">
            {getSanityLabel()}
          </h1>
          <p className="text-white/50 text-sm tracking-wide leading-relaxed max-w-md">
            {getSanityDescription()}
          </p>
        </div>
      </div>

      <div className="absolute top-8 right-8 pointer-events-none">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-7 py-4 border border-white/10 shadow-2xl">
          <div className="text-white/40 text-xs uppercase tracking-widest mb-2 font-light">
            Coherence Index
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-white text-4xl font-extralight tabular-nums transition-all duration-300">
              {sanity}
            </div>
            <span className="text-white/30 text-xl font-light">%</span>
          </div>
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-white/60 to-white/80 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${sanity}%` }}
            />
          </div>
        </div>
      </div>

      <div className="absolute top-8 left-8 pointer-events-none">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/10 shadow-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${sanity >= 75 ? 'bg-green-400' : sanity >= 50 ? 'bg-yellow-400' : sanity >= 25 ? 'bg-orange-400' : 'bg-red-400'} animate-pulse`} />
            <span className="text-white/50 text-xs tracking-wider">Neural Activity</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-white/50 text-xs tracking-wider">Reality Anchor</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-white/50 text-xs tracking-wider">Temporal Sync</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl transition-all duration-300 hover:bg-white/[0.07]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-white/60 text-sm tracking-wide font-light">
                Sanity Modulation Interface
              </span>
              <div className="text-white/40 text-xs mt-1 tracking-wider">
                Adjust coherence parameters in real-time
              </div>
            </div>
            <div className="flex gap-2">
              {[75, 50, 25, 0].map((threshold) => (
                <div 
                  key={threshold}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    sanity >= threshold 
                      ? 'bg-white/80 scale-100' 
                      : 'bg-white/20 scale-75'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="relative mb-6">
            <div 
              className="absolute inset-0 rounded-full blur-xl opacity-50 transition-all duration-700"
              style={{
                background: 'linear-gradient(to right, rgb(220, 38, 38) 0%, rgb(249, 115, 22) 25%, rgb(234, 179, 8) 50%, rgb(132, 204, 22) 75%, rgb(34, 197, 94) 100%)',
                transform: `scaleY(${0.3 + (1 - sanity / 100) * 0.7})`
              }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={sanity}
            />
            <div 
              className="absolute top-0 left-0 h-3 rounded-full pointer-events-none"
              style={{
                width: '100%',
                background: 'linear-gradient(to right, rgb(220, 38, 38) 0%, rgb(249, 115, 22) 25%, rgb(234, 179, 8) 50%, rgb(132, 204, 22) 75%, rgb(34, 197, 94) 100%)'
              }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-white/40 tracking-wider">
            <div className="flex flex-col items-start">
              <span className="font-light">Critical</span>
              <span className="text-xs text-white/30 mt-0.5">0-25%</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-light">Unstable</span>
              <span className="text-xs text-white/30 mt-0.5">25-50%</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-light">Normal</span>
              <span className="text-xs text-white/30 mt-0.5">50-75%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-light">Optimal</span>
              <span className="text-xs text-white/30 mt-0.5">75-100%</span>
            </div>
          </div>

          <div className="flex gap-2 mt-6 pt-6 border-t border-white/10">
            {[
              { label: 'Peak', value: 100 },
              { label: 'Nominal', value: 75 },
              { label: 'Warning', value: 40 },
              { label: 'Critical', value: 10 }
            ].map(preset => (
              <button
                key={preset.value}
                onClick={() => setSanity(preset.value)}
                className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white/90 text-xs tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(0.95);
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .slider {
          position: relative;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          cursor: pointer;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgba(255, 255, 255, 0.8);
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.9), 0 0 60px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(255, 255, 255, 1);
        }
        
        .slider::-webkit-slider-thumb:active {
          transform: scale(1.1);
        }
        
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.9), 0 0 60px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(255, 255, 255, 1);
        }
        
        .slider::-moz-range-thumb:active {
          transform: scale(1.1);
        }
      `}</style>
      </div>
  );
};

export default SanityOrb;