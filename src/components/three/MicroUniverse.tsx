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

    // Only create instances for clusters that have data
    const activeClusters = clusterKeys.filter(clusterId => clusters[clusterId].count > 0);
    console.log('Active clusters:', activeClusters);
    console.log('Cluster details:', activeClusters.map(id => ({ id, count: clusters[id].count, avgSanity: clusters[id].avgSanity })));

    if (activeClusters.length === 0) return; // No data to display

    // Create geometry and material - suitable size for micro-universe
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);
    const material = new THREE.MeshBasicMaterial(); // Use basic material for better color control

    // Create instanced mesh with only active clusters
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, activeClusters.length);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }

    const matrix = new THREE.Matrix4();
    const dummy = new THREE.Object3D(); // Use Object3D for easier matrix manipulation

    activeClusters.forEach((clusterId: number, index: number) => {
      const cluster = clusters[clusterId];

      // Use Object3D for cleaner matrix setup
      dummy.position.copy(cluster.position);
      dummy.scale.setScalar(1.0); // No additional scaling - geometry is already sized
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
    // Create sophisticated but stable geometric framework
    const points: THREE.Vector3[] = [];
    const colors: number[] = [];

    // Create a beautiful, stable icosahedral framework
    const t = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const vertices = [
      new THREE.Vector3(-1, t, 0), new THREE.Vector3(1, t, 0),
      new THREE.Vector3(-1, -t, 0), new THREE.Vector3(1, -t, 0),
      new THREE.Vector3(0, -1, t), new THREE.Vector3(0, 1, t),
      new THREE.Vector3(0, -1, -t), new THREE.Vector3(0, 1, -t),
      new THREE.Vector3(t, 0, -1), new THREE.Vector3(t, 0, 1),
      new THREE.Vector3(-t, 0, -1), new THREE.Vector3(-t, 0, 1)
    ];

    // Normalize to fit within orb
    vertices.forEach(v => v.normalize().multiplyScalar(2.1));

    // Icosahedral edges (30 edges)
    const edges = [
      [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
      [1, 5], [1, 7], [1, 8], [1, 9],
      [2, 11], [2, 5], [2, 3], [2, 4], [2, 10],
      [3, 4], [3, 8], [3, 9], [3, 6],
      [4, 5], [4, 9], [4, 11],
      [6, 7], [6, 8], [6, 10],
      [7, 8], [7, 10], [7, 11],
      [9, 11]
    ];

    // Add some beautiful cross-connections for complexity
    const crossEdges = [
      [0, 8], [1, 10], [2, 7], [3, 11], [4, 6], [5, 9] // Cross-connections
    ];

    const allEdges = [...edges, ...crossEdges];

    // Create framework with elegant colors
    const dataInfluence = this.processedData ? Math.min(1, (this.processedData.clusterKeys.length / 10)) : 0.5;
    const time = Date.now() * 0.001;

    allEdges.forEach(([start, end], edgeIndex) => {
      const startVertex = vertices[start];
      const endVertex = vertices[end];

      points.push(startVertex, endVertex);

      // Elegant color scheme with data influence
      const hue = (edgeIndex * 0.1 + time * 0.05) % 1;
      const saturation = 0.7 + dataInfluence * 0.3;
      const lightness = 0.4 + dataInfluence * 0.3;

      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
    });

    if (points.length > 0) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
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

    // Create connections between clusters
    clusterKeys.forEach((clusterId: number, i: number) => {
      const clusterA = clusters[clusterId];
      if (clusterA.count === 0) return;

      clusterKeys.slice(i + 1).forEach((otherId: number) => {
        const clusterB = clusters[otherId];
        if (clusterB.count === 0) return;

        const sanityDiff = Math.abs(clusterA.avgSanity - clusterB.avgSanity);
        const distance = clusterA.position.distanceTo(clusterB.position);

        // Connect if sanity levels are similar and distance is reasonable
        if (sanityDiff < 40 && distance < 10) {
          points.push(clusterA.position, clusterB.position);

          // Connection color based on sanity difference
          const connectionColor = new THREE.Color().lerpColors(
            clusterA.color,
            clusterB.color,
            0.5
          ).multiplyScalar(0.3); // Dim the connection lines

          colors.push(connectionColor.r, connectionColor.g, connectionColor.b);
          colors.push(connectionColor.r, connectionColor.g, connectionColor.b);
        }
      });
    });

    if (points.length > 0) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6 });

      this.connections = new THREE.LineSegments(geometry, material);
      this.group.add(this.connections);
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
