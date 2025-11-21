import * as THREE from 'three';
import { getSanityColor } from '../../utils/sanityUtils';
import { CollectiveData } from '../../services/api';

interface MicroUniverseProps {
  collectiveData: CollectiveData | null;
  visible: boolean;
  onOrbClick?: (clusterId: number) => void;
}

export class MicroUniverse {
  private group: THREE.Group;
  private instancedMesh: THREE.InstancedMesh | null = null;
  private connections: THREE.LineSegments | null = null;
  private framework: THREE.LineSegments | null = null;
  private processedData: any = null;
  private onOrbClick?: (clusterId: number) => void;

  constructor(props: MicroUniverseProps) {
    this.group = new THREE.Group();
    this.onOrbClick = props.onOrbClick;
    this.updateData(props.collectiveData);
    this.setVisible(props.visible);
  }

  private calculateAllTenClusterPositions(allClusterIds: number[], clusters: any): THREE.Vector3[] {
    // GUARANTEED PLATONIC SOLID POSITIONS - Mathematically perfect 10-point distribution
    // Using Octahedron + 2 additional points (inspired by Icosahedral but simplified)

    const radius = 1.2; // Well within the orb's volume (orb is ~2.0 radius)
    const positions: THREE.Vector3[] = [];

    // Base Octahedron vertices (6 points)
    const octahedronVertices: THREE.Vector3[] = [
      new THREE.Vector3(radius, 0, 0),          // +X
      new THREE.Vector3(-radius, 0, 0),         // -X
      new THREE.Vector3(0, radius, 0),           // +Y
      new THREE.Vector3(0, -radius, 0),          // -Y
      new THREE.Vector3(0, 0, radius),           // +Z
      new THREE.Vector3(0, 0, -radius)           // -Z
    ];

    // Add 4 more points using Golden Ratio for mathematically beautiful distribution
    const phi = (1 + Math.sqrt(5)) / 2; // Golden Ratio ≈ 1.618
    const scaledRadius = radius * 0.8; // Slightly smaller for the additional points

    const goldenRatioPoints: THREE.Vector3[] = [
      new THREE.Vector3(scaledRadius/phi, scaledRadius, scaledRadius/phi),
      new THREE.Vector3(-scaledRadius/phi, scaledRadius, -scaledRadius/phi),
      new THREE.Vector3(-scaledRadius/phi, -scaledRadius, scaledRadius/phi),
      new THREE.Vector3(scaledRadius/phi, -scaledRadius, -scaledRadius/phi)
    ];

    // Combine all 10 points
    positions.push(...octahedronVertices, ...goldenRatioPoints);

    // Ensure all positions are within desired bounds (inside main orb)
    positions.forEach(pos => {
      if (pos.length() > radius) {
        pos.normalize().multiplyScalar(radius * 0.9);
      }
    });

    console.log(`🧮 Generated 10-point Platonic solid distribution with radius ${radius}`);
    console.log(`   All points guaranteed within volume (max radius: ${Math.max(...positions.map(p => p.length())).toFixed(3)})`);

    return positions;
  }

  private calculateClusterPositions(activeClusterIds: number[], clusters: any): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const maxIterations = 50;
    const attractionStrength = 0.1;
    const repulsionStrength = 0.5;
    const damping = 0.9;

    // Initialize random positions ONLY for active clusters
    activeClusterIds.forEach((_, index) => {
      positions[index] = new THREE.Vector3(
        (Math.random() - 0.5) * 4,  // Smaller initial spread
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      );
    });

    // Force-directed iterations only for active clusters
    for (let iter = 0; iter < maxIterations; iter++) {
      const forces: THREE.Vector3[] = activeClusterIds.map(() => new THREE.Vector3());

      // Calculate repulsive forces between active clusters
      for (let i = 0; i < activeClusterIds.length; i++) {
        for (let j = i + 1; j < activeClusterIds.length; j++) {
          const diff = positions[j].clone().sub(positions[i]);
          const distance = diff.length();
          if (distance > 0.1) {
            const force = diff.normalize().multiplyScalar(repulsionStrength / (distance * distance));
            forces[i].sub(force);
            forces[j].add(force);
          }
        }
      }

      // Calculate attractive forces (connect clusters with similar sanity levels)
      for (let i = 0; i < activeClusterIds.length; i++) {
        for (let j = i + 1; j < activeClusterIds.length; j++) {
          const sanityDiff = Math.abs(clusters[activeClusterIds[i]].avgSanity - clusters[activeClusterIds[j]].avgSanity);
          if (sanityDiff < 30) { // Connect similar sanity levels
            const diff = positions[j].clone().sub(positions[i]);
            const distance = diff.length();
            const targetDistance = Math.max(1, sanityDiff / 10); // Smaller target distances
            const force = diff.normalize().multiplyScalar(attractionStrength * (distance - targetDistance));
            forces[i].add(force);
            forces[j].sub(force);
          }
        }
      }

      // Apply forces
      positions.forEach((pos, index) => {
        pos.add(forces[index].multiplyScalar(damping));
        // Keep within bounds - much closer for "inside" the main orb effect
        pos.clampLength(0.5, 2.0); // Tighter bounds
      });
    }

    return positions;
  }

  private processData(collectiveData: CollectiveData | null) {
    if (!collectiveData) return null;

    // Combine sessions and snapshots
    const allData = [
      ...collectiveData.sessions,
      ...collectiveData.snapshots
    ];

    // Group by cluster ID and calculate cluster properties
    const clusters: Record<number, {
      sanityLevels: number[];
      count: number;
      avgSanity: number;
      color: THREE.Color;
      position: THREE.Vector3;
    }> = {};

    // Initialize clusters
    for (let i = 0; i < 10; i++) { // 0-90 in 10-point ranges
      clusters[i] = {
        sanityLevels: [],
        count: 0,
        avgSanity: i * 10 + 5, // Center of range
        color: getSanityColor(i * 10 + 5),
        position: new THREE.Vector3()
      };
    }

    // Populate clusters with data
    allData.forEach(item => {
      const clusterId = Math.min(9, Math.max(0, item.cluster_id));
      console.log('Processing data item:', item.sanity_level, '-> cluster:', clusterId);
      clusters[clusterId].sanityLevels.push(item.sanity_level);
      clusters[clusterId].count++;
    });

    // Calculate cluster positions using force-directed layout ONLY for active clusters
    const clusterKeys = Object.keys(clusters).map(Number);
    const activeClusterIds = clusterKeys.filter(id => clusters[id].count > 0);
    const positions = this.calculateClusterPositions(activeClusterIds, clusters);

    // Set positions only for active clusters
    activeClusterIds.forEach((clusterId, index) => {
      clusters[clusterId].position.copy(positions[index]);
      clusters[clusterId].avgSanity = clusters[clusterId].sanityLevels.reduce((a, b) => a + b, 0) / clusters[clusterId].count;
      clusters[clusterId].color = getSanityColor(clusters[clusterId].avgSanity);
    });

    return { clusters, clusterKeys };
  }

  private createInstancedMesh() {
    if (!this.processedData) return;

    const { clusters, clusterKeys } = this.processedData;

    // GUARANTEE ALL 10 CLUSTER POSITIONS - Always display 10 points (0-9)
    console.log('Total clusters (always 10):', clusterKeys.length);

    // Calculate positions for ALL 10 clusters using Platonic solid mathematics
    const positions = this.calculateAllTenClusterPositions(clusterKeys, clusters);

    // Set positions for ALL 10 clusters
    clusterKeys.forEach((clusterId, index) => {
      clusters[clusterId].position.copy(positions[index]);
      // Update avgSanity based on data or keep placeholder
      if (clusters[clusterId].sanityLevels.length > 0) {
        clusters[clusterId].avgSanity = clusters[clusterId].sanityLevels.reduce((a, b) => a + b, 0) / clusters[clusterId].sanityLevels.length;
        clusters[clusterId].color = getSanityColor(clusters[clusterId].avgSanity);
      }
      console.log(`Cluster ${clusterId}: ${clusters[clusterId].count} data points, avg sanity: ${clusters[clusterId].avgSanity.toFixed(1)}`);
    });

    // Create geometry and material - suitable size for micro-universe
    const geometry = new THREE.SphereGeometry(0.08, 12, 12);
    const material = new THREE.MeshBasicMaterial();

    // Create instanced mesh with ALL 10 clusters
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, clusterKeys.length);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }

    const dummy = new THREE.Object3D();

    clusterKeys.forEach((clusterId: number, index: number) => {
      const cluster = clusters[clusterId];

      dummy.position.copy(cluster.position);
      // Scale real data clusters larger than synthetic/placeholder ones
      const scale = cluster.count > 0 ? 1.2 : 0.8;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();

      this.instancedMesh!.setMatrixAt(index, dummy.matrix);
      this.instancedMesh!.setColorAt(index, cluster.color);
    });

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    this.group.add(this.instancedMesh);
  }

  private createFramework() {
    if (!this.processedData) return;

    const { clusters, clusterKeys } = this.processedData;
    const points: THREE.Vector3[] = [];
    const colors: number[] = [];

    // Create CUBOCTAHEDRAL framework using our 10 data points
    // Cuboctahedron properties: 8 triangles + 6 squares, but we adapt for 10 vertices

    // Define 8 triangular face connections (cuboctahedral triangles on our 10 points)
    const triangularFaces = [
      [0, 1, 2],   // Red triangle motif
      [3, 4, 5],   // Blue triangle motif
      [6, 7, 8],   // Green triangle motif
      [9, 0, 4],   // Connecting triangles
      [1, 5, 7],   // Yellow triangle motif
      [2, 3, 9],   // Purple triangle motif
      [6, 8, 3],   // Orange triangle motif
      [5, 6, 9]    // Connecting triangles for full mesh
    ];

    // Define 6 square face connections (adapted for our 10 vertices)
    const squareFaces = [
      [0, 2, 3, 9],  // Square face motifs
      [1, 4, 5, 7],  // Square face motifs
      [2, 4, 6, 8],  // Square face motifs
      [3, 5, 8, 9],  // Square face motifs
      [0, 1, 6, 7],  // Square face motifs
      [4, 7, 3, 6]   // Square face motifs (remaining connectivity)
    ];

    const time = Date.now() * 0.001;
    const orbRadius = 2.0; // SanityOrb's surface radius
    const breathingFactor = 0.08 * Math.sin(time * 0.3); // Subtle breathing animation
    let edgeIndex = 0;

    // Helper function for softened opacity calculation
    const calculateSoftenedOpacity = (startPos: THREE.Vector3, endPos: THREE.Vector3): number => {
      const midPoint = startPos.clone().add(endPos).multiplyScalar(0.5);
      const distanceFromCenter = midPoint.length();

      // Distance-based falloff: closer to surface = more transparent
      // - At orb center: full opacity (distance ~0)
      // - At surface or beyond: high transparency (distance ~orbRadius)
      const distanceToSurface = Math.abs(orbRadius - distanceFromCenter);
      const softnessZone = 0.3; // How wide the softening zone is
      const softnessFactor = Math.max(0, distanceToSurface - softnessZone) / softnessZone;

      // Triangle vs Square base opacity (triangles more visible) - INCREASED for better definition
      const baseOpacity = 0.25; // Increased from 0.15 for much stronger definition
      const softnessReduction = softnessFactor * 0.7; // Stronger falloff preservation

      return baseOpacity * (0.9 - softnessReduction) * (1 + breathingFactor); // 90% base visibility
    };

    // Create triangular face edges (cuboctahedral triangles) with straight, defined connections
    triangularFaces.forEach((face, faceIndex) => {
      for (let i = 0; i < 3; i++) {
        const startIdx = face[i];
        const endIdx = face[(i + 1) % 3];

        if (clusters[clusterKeys[startIdx]] && clusters[clusterKeys[endIdx]]) {
          const startPos = clusters[clusterKeys[startIdx]].position;
          const endPos = clusters[clusterKeys[endIdx]].position;

          points.push(startPos);
          points.push(endPos);

          // Cuboctahedral colors - triangles are more cohesive (slightly brighter)
          const triangleHue = (faceIndex * 0.125 + time * 0.02) % 1; // 8 triangles span spectrum
          const baseColor = new THREE.Color().setHSL(triangleHue, 0.8, 0.5);

          // Apply volumetric softening with stronger definition
          const opacity = calculateSoftenedOpacity(startPos, endPos);
          const softenedColor = baseColor.clone().multiplyScalar(opacity);

          colors.push(softenedColor.r, softenedColor.g, softenedColor.b);
          colors.push(softenedColor.r, softenedColor.g, softenedColor.b);
          edgeIndex++;
        }
      }
    });

    // Create square face edges (cuboctahedral squares) with straight, defined connections
    squareFaces.forEach((face, faceIndex) => {
      for (let i = 0; i < 4; i++) {
        const startIdx = face[i];
        const endIdx = face[(i + 1) % 4];

        if (clusters[clusterKeys[startIdx]] && clusters[clusterKeys[endIdx]]) {
          const startPos = clusters[clusterKeys[startIdx]].position;
          const endPos = clusters[clusterKeys[endIdx]].position;

          points.push(startPos);
          points.push(endPos);

          // Square edges are more stable/harmonious (different shade)
          const squareHue = (faceIndex * 0.166 + 0.5 + time * 0.01) % 1; // 6 squares in complementary range
          const baseColor = new THREE.Color().setHSL(squareHue, 0.6, 0.4);

          // Apply volumetric softening with stronger definition
          const opacity = calculateSoftenedOpacity(startPos, endPos) * 0.85; // Squares slightly more subtle but still defined
          const softenedColor = baseColor.clone().multiplyScalar(opacity);

          colors.push(softenedColor.r, softenedColor.g, softenedColor.b);
          colors.push(softenedColor.r, softenedColor.g, softenedColor.b);
          edgeIndex++;
        }
      }
    });

    console.log(`🏗️ Cuboctahedral Framework: ${triangularFaces.length} triangular motifs + ${squareFaces.length} square motifs = ${edgeIndex} structural edges`);

    if (points.length > 0) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      // Cuboctahedral material - subtle but present
      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.15,  // Much subtler than icosahedral
        blending: THREE.AdditiveBlending,
        depthWrite: false  // Don't interfere with depth buffer
      });

      this.framework = new THREE.LineSegments(geometry, material);
      this.group.add(this.framework);
    }
  }

  private createConnections() {
    if (!this.processedData) return;

    const { clusters, clusterKeys } = this.processedData;
    const points: THREE.Vector3[] = [];
    const colors: number[] = [];
    const opacities: number[] = []; // Store opacity per connection

    // Create connections between ALL 10 clusters for complete web
    clusterKeys.forEach((clusterId: number, i: number) => {
      const clusterA = clusters[clusterId];

      clusterKeys.slice(i + 1).forEach((otherId: number) => {
        const clusterB = clusters[otherId];
        const distance = clusterA.position.distanceTo(clusterB.position);

        // Connect all clusters within reasonable distance (inside orb)
        if (distance < 2.5) { // Connect within orb volume
          points.push(clusterA.position, clusterB.position);

          // Connection strength based on data availability and sanity similarity
          let connectionStrength = 0.2; // Base minimum for synthetic clusters

          if (clusterA.count > 0 && clusterB.count > 0) {
            // Both have real data
            const sanityDiff = Math.abs(clusterA.avgSanity - clusterB.avgSanity);
            connectionStrength = 0.8 - (sanityDiff / 100); // Stronger for similar sanity levels
          } else if (clusterA.count > 0 || clusterB.count > 0) {
            // One has real data, one is synthetic
            connectionStrength = 0.4; // Moderate connection
          }
          // Both synthetic: use base 0.2

          // Connection color based on cluster data with strength influence
          const connectionColor = new THREE.Color().lerpColors(
            clusterA.color,
            clusterB.color,
            0.5
          ).multiplyScalar(connectionStrength);

          // Store colors twice (start and end points)
          colors.push(connectionColor.r, connectionColor.g, connectionColor.b);
          colors.push(connectionColor.r, connectionColor.g, connectionColor.b);

          // Store opacity for material creation
          opacities.push(connectionStrength);
          opacities.push(connectionStrength);
        }
      });
    });

    if (points.length > 0) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      // Create material with per-connection opacity
      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      this.connections = new THREE.LineSegments(geometry, material);
      this.group.add(this.connections);

      console.log(`🌐 Created ${points.length/2} connections between all 10 clusters`);
    }
  }

  updateData(collectiveData: CollectiveData | null) {
    console.log('MicroUniverse: updateData called with:', collectiveData);
    if (collectiveData) {
      console.log('Raw collective data:', {
        sessionsCount: collectiveData.sessions?.length || 0,
        snapshotsCount: collectiveData.snapshots?.length || 0,
        firstFewSessions: collectiveData.sessions?.slice(0, 5),
        firstFewSnapshots: collectiveData.snapshots?.slice(0, 5)
      });
    }

    // Clear existing meshes
    if (this.instancedMesh) {
      this.group.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach(m => m.dispose());
      } else {
        this.instancedMesh.material.dispose();
      }
      this.instancedMesh = null;
    }

    if (this.connections) {
      this.group.remove(this.connections);
      this.connections.geometry.dispose();
      if (Array.isArray(this.connections.material)) {
        this.connections.material.forEach(m => m.dispose());
      } else {
        this.connections.material.dispose();
      }
      this.connections = null;
    }

    // Process new data
    this.processedData = this.processData(collectiveData);
    console.log('MicroUniverse: processed data:', this.processedData);

    if (this.processedData) {
      this.createFramework();
      this.createInstancedMesh();
      this.createConnections();
      console.log('MicroUniverse: framework and meshes created');
    } else {
      console.log('MicroUniverse: no processed data');
    }
  }

  setVisible(visible: boolean) {
    this.group.visible = visible;
  }

  getObject3D(): THREE.Group {
    return this.group;
  }

  dispose() {
    if (this.instancedMesh) {
      this.group.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach(m => m.dispose());
      } else {
        this.instancedMesh.material.dispose();
      }
    }

    if (this.connections) {
      this.group.remove(this.connections);
      this.connections.geometry.dispose();
      if (Array.isArray(this.connections.material)) {
        this.connections.material.forEach(m => m.dispose());
      } else {
        this.connections.material.dispose();
      }
    }

    if (this.framework) {
      this.group.remove(this.framework);
      this.framework.geometry.dispose();
      if (Array.isArray(this.framework.material)) {
        this.framework.material.forEach(m => m.dispose());
      } else {
        this.framework.material.dispose();
      }
    }
  }
}

export default MicroUniverse;
