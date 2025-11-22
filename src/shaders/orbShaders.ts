export const vertexShader = `
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
`;

export const fragmentShader = `
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
`;

export const glowVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glowFragmentShader = `
  uniform vec3 color;
  uniform float coefficient;
  uniform float power;
  varying vec3 vNormal;
  
  void main() {
    float intensity = pow(coefficient - dot(vNormal, vec3(0.0, 0.0, 1.0)), power);
    gl_FragColor = vec4(color, intensity * 0.4);
  }
`;

// Mind Assembly Animation Shaders
export const mindGlowVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const mindGlowFragmentShader = `
  uniform vec3 color;
  uniform float intensity;
  varying vec3 vNormal;
  
  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
    gl_FragColor = vec4(color, fresnel * intensity);
  }
`;

// DYSON SPHERE SHADERS - Advanced Civilization Containment Shell
export const dysonSphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  uniform float time;
  uniform float chaos;
  
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
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    
    // Subtle displacement based on energy flow
    vec3 pos = position;
    float energyFlow = snoise(position * 0.8 + time * 0.15) * 0.05;
    float instability = snoise(position * 1.2 + time * 0.2) * chaos * 0.08;
    pos += normal * (energyFlow + instability);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Simple test shader first - guaranteed to be visible
export const dysonSphereFragmentShaderSimple = `
  uniform vec3 color;
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    // Very simple, bright, visible shader
    vec3 finalColor = color * 2.0;
    float alpha = 0.8;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const dysonSphereFragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float chaos;
  uniform float sanity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
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
  
  // Hexagonal grid pattern
  float hexPattern(vec2 uv, float scale) {
    vec2 grid = uv * scale;
    vec2 id = floor(grid);
    vec2 gv = fract(grid) - 0.5;
    
    float x = gv.x;
    float y = gv.y;
    float z = -x - y;
    
    float dist = min(min(abs(x), abs(y)), abs(z));
    return smoothstep(0.02, 0.0, dist);
  }
  
  // Energy flow pattern
  float energyFlow(vec3 pos, float time) {
    float flow1 = sin(dot(pos, vec3(1.0, 0.5, 0.3)) * 3.0 + time * 0.5);
    float flow2 = sin(dot(pos, vec3(0.3, 1.0, 0.5)) * 3.0 + time * 0.7);
    float flow3 = sin(dot(pos, vec3(0.5, 0.3, 1.0)) * 3.0 + time * 0.6);
    return (flow1 + flow2 + flow3) / 3.0;
  }
  
  void main() {
    // Calculate view direction and fresnel
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 3.5);
    
    // Spherical UV coordinates
    vec2 uv = vec2(
      atan(vNormal.z, vNormal.x) / 3.14159 * 0.5 + 0.5,
      acos(vNormal.y) / 3.14159
    );
    
    // Hexagonal grid pattern
    float hex = hexPattern(uv * 8.0, 1.0);
    float hexDetail = hexPattern(uv * 24.0, 1.0);
    
    // Energy flow patterns
    float energy = energyFlow(vPosition, time);
    float energyPulse = sin(time * 0.8 + energy * 2.0) * 0.5 + 0.5;
    
    // Animated noise for texture
    float noise1 = snoise(vPosition * 0.5 + time * 0.1);
    float noise2 = snoise(vPosition * 1.2 + time * 0.15);
    float noise3 = snoise(vPosition * 2.0 + time * 0.2);
    
    // Chaos effects
    float chaosNoise = snoise(vPosition * 1.5 + time * 0.3) * chaos;
    float instability = abs(chaosNoise) * 0.3;
    
    // Combine patterns - ensure minimum visibility
    float gridIntensity = max(hex * 0.5 + hexDetail * 0.3, 0.2);
    float energyIntensity = max(energyPulse * 0.4 * (0.6 + energy * 0.4), 0.2);
    float textureIntensity = (noise1 * 0.3 + noise2 * 0.2 + noise3 * 0.1) * 0.3;
    
    // Base color with energy modulation - very bright for visibility
    vec3 baseColor = mix(
      color * 1.5,
      color * 2.5,
      energyIntensity + gridIntensity
    );
    
    // Add energy glow
    vec3 energyColor = mix(
      baseColor,
      color * 3.0,
      energyPulse * fresnel
    );
    
    // Chaos corruption
    vec3 finalColor = mix(
      energyColor,
      mix(energyColor, vec3(1.0, 0.3, 0.2), instability),
      chaos * 0.4
    );
    
    // Fresnel edge glow - very bright
    finalColor += color * fresnel * 1.5;
    
    // Alpha based on patterns and fresnel - very high for visibility
    float alpha = 0.7 + 
                  gridIntensity * 0.6 +
                  energyIntensity * 0.5 +
                  fresnel * 0.6 +
                  textureIntensity * 0.4;
    
    // Chaos affects opacity (but keep it visible)
    alpha = mix(alpha, alpha * (1.0 - instability * 0.2), chaos * 0.15);
    
    // Ensure very strong minimum visibility
    alpha = max(alpha, 0.65);
    
    // Clamp to prevent overflow
    finalColor = min(finalColor, vec3(3.0));
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Advanced volumetric Dyson sphere shaders - Interstellar style
export const dysonVolumetricVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;
  uniform float time;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vViewDirection = normalize(cameraPosition - vWorldPosition);
    
    // Subtle vertex displacement for volumetric effect
    vec3 pos = position;
    float displacement = sin(dot(position, vec3(1.0, 1.0, 1.0)) * 0.5 + time * 0.1) * 0.01;
    pos += normal * displacement;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const dysonVolumetricFragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float chaos;
  uniform float sanity;
  uniform float energyHarvest;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;
  
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
  
  // Volumetric density function
  float volumetricDensity(vec3 pos, float time) {
    float density = 0.0;
    
    // Large scale structure
    density += snoise(pos * 0.1 + time * 0.05) * 0.5;
    
    // Medium scale detail
    density += snoise(pos * 0.3 + time * 0.08) * 0.3;
    
    // Fine detail
    density += snoise(pos * 0.8 + time * 0.12) * 0.2;
    
    return density * 0.5 + 0.5;
  }
  
  // Energy harvesting streams
  float energyStream(vec3 pos, float time) {
    vec3 toCenter = normalize(-pos);
    float radial = dot(pos, toCenter) / length(pos);
    
    // Spiral energy streams
    float angle = atan(pos.z, pos.x);
    float spiral = sin(angle * 6.0 + length(pos) * 0.5 - time * 0.3);
    
    // Radial flow
    float flow = sin(length(pos) * 0.4 - time * 0.5);
    
    return (spiral * 0.5 + 0.5) * (flow * 0.5 + 0.5);
  }
  
  // Fresnel with chromatic aberration
  vec3 chromaticFresnel(float fresnel) {
    float r = pow(fresnel, 1.0);
    float g = pow(fresnel, 1.1);
    float b = pow(fresnel, 1.2);
    return vec3(r, g, b);
  }
  
  void main() {
    float sanityState = sanity / 100.0;
    
    // View-dependent effects
    float fresnel = pow(1.0 - abs(dot(vViewDirection, vNormal)), 2.5);
    vec3 fresnelColor = chromaticFresnel(fresnel);
    
    // Volumetric density
    float density = volumetricDensity(vWorldPosition, time);
    density = pow(density, 1.5); // Sharper falloff
    
    // Energy harvesting visualization
    float harvest = energyStream(vWorldPosition, time);
    float harvestIntensity = 0.2 + sanityState * 0.3;
    
    // Energy flow patterns
    vec3 flowDir = normalize(vWorldPosition);
    float flow1 = sin(dot(flowDir, vec3(1.0, 0.3, 0.5)) * 8.0 + time * 0.4);
    float flow2 = sin(dot(flowDir, vec3(0.5, 1.0, 0.3)) * 8.0 + time * 0.6);
    float flow3 = sin(dot(flowDir, vec3(0.3, 0.5, 1.0)) * 8.0 + time * 0.5);
    float flowPattern = (flow1 + flow2 + flow3) / 3.0;
    
    // Base volumetric color - reduced intensity
    vec3 baseColor = color * (0.15 + density * 0.35);
    
    // Energy harvesting highlights - reduced
    vec3 harvestColor = color * harvestIntensity * (0.6 + harvest * 0.4);
    baseColor = mix(baseColor, harvestColor, harvest * 0.4);
    
    // Flow pattern integration - reduced
    baseColor += color * flowPattern * 0.2 * sanityState;
    
    // Fresnel rim lighting (Interstellar style) - reduced
    vec3 rimColor = color * fresnelColor * (0.8 + sanityState * 0.5);
    baseColor += rimColor * fresnel * 0.4;
    
    // Chaos effects
    if (chaos > 0.1) {
      float chaosNoise = snoise(vWorldPosition * 2.0 + time * 0.5) * chaos;
      baseColor = mix(baseColor, baseColor * vec3(1.2, 0.8, 0.9), abs(chaosNoise) * 0.3);
    }
    
    // Alpha - volumetric transparency - reduced
    float alpha = density * 0.25 + harvest * 0.2 + fresnel * 0.15;
    alpha = max(alpha, 0.1); // Minimum visibility
    alpha = min(alpha, 0.4); // Maximum for openness
    
    // Ensure energy harvesting is visible - reduced
    alpha += harvest * 0.1 * sanityState;
    
    gl_FragColor = vec4(baseColor, alpha);
  }
`;

// Outer energy layer shader
export const dysonEnergyVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  uniform float time;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const dysonEnergyFragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float chaos;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
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
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 4.0);
    
    // Energy flow
    float energy1 = sin(dot(vPosition, vec3(1.0, 0.5, 0.3)) * 4.0 + time * 0.6);
    float energy2 = sin(dot(vPosition, vec3(0.3, 1.0, 0.5)) * 4.0 + time * 0.8);
    float energy3 = sin(dot(vPosition, vec3(0.5, 0.3, 1.0)) * 4.0 + time * 0.7);
    float energy = (energy1 + energy2 + energy3) / 3.0;
    
    // Noise for texture
    float noise = snoise(vPosition * 0.8 + time * 0.2);
    float chaosNoise = snoise(vPosition * 1.5 + time * 0.4) * chaos;
    
    // Pulsing energy
    float pulse = sin(time * 1.2) * 0.5 + 0.5;
    float energyPulse = (energy * 0.5 + 0.5) * pulse;
    
    // Color with energy modulation - increased intensity
    vec3 energyColor = color * (1.2 + energyPulse * 0.6);
    energyColor += color * fresnel * 1.0;
    
    // Chaos effects
    energyColor = mix(energyColor, mix(energyColor, vec3(1.0, 0.2, 0.1), abs(chaosNoise)), chaos * 0.3);
    
    // Alpha - significantly increased for visibility
    float alpha = (0.5 + fresnel * 0.5 + energyPulse * 0.4) * (1.0 - chaos * 0.15);
    alpha = max(alpha, 0.4);
    
    gl_FragColor = vec4(energyColor, alpha);
  }
`;

// Inner grid structure shader
export const dysonGridVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  uniform float time;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const dysonGridFragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float chaos;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  // Hexagonal grid
  float hexGrid(vec2 uv, float scale) {
    vec2 grid = uv * scale;
    vec2 id = floor(grid);
    vec2 gv = fract(grid) - 0.5;
    
    float x = gv.x;
    float y = gv.y;
    float z = -x - y;
    
    float dist = min(min(abs(x), abs(y)), abs(z));
    return 1.0 - smoothstep(0.0, 0.15, dist);
  }
  
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);
    
    // Spherical UV
    vec2 uv = vec2(
      atan(vNormal.z, vNormal.x) / 3.14159 * 0.5 + 0.5,
      acos(vNormal.y) / 3.14159
    );
    
    // Animated grid
    float grid1 = hexGrid(uv + vec2(time * 0.05, 0.0), 12.0);
    float grid2 = hexGrid(uv + vec2(0.0, time * 0.03), 24.0);
    
    // Energy pulse along grid
    float pulse = sin(time * 1.5 + dot(vPosition, vec3(1.0, 1.0, 1.0)) * 0.5) * 0.5 + 0.5;
    
    // Grid intensity
    float gridIntensity = (grid1 * 0.6 + grid2 * 0.4) * pulse;
    
    // Color - increased intensity
    vec3 gridColor = color * (0.8 + gridIntensity * 1.0);
    gridColor += color * fresnel * 0.6;
    
    // Chaos corruption
    float chaosFactor = chaos * 0.5;
    gridColor = mix(gridColor, mix(gridColor, vec3(1.0, 0.3, 0.1), chaosFactor), chaos * 0.3);
    
    // Alpha - significantly increased for visibility
    float alpha = max(gridIntensity * (0.6 + fresnel * 0.4), 0.1) * (1.0 - chaos * 0.15);
    alpha = max(alpha, 0.3);
    
    gl_FragColor = vec4(gridColor, alpha);
  }
`;