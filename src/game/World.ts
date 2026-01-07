import * as THREE from 'three'

export class World {
  private terrain: THREE.Mesh
  private heightData: Float32Array
  private size = 200
  private segments = 100

  constructor(scene: THREE.Scene) {
    this.heightData = this.generateHeightmap()
    this.terrain = this.createTerrain()
    scene.add(this.terrain)

    this.addDecorations(scene)
  }

  private generateHeightmap(): Float32Array {
    const data = new Float32Array((this.segments + 1) * (this.segments + 1))

    for (let i = 0; i <= this.segments; i++) {
      for (let j = 0; j <= this.segments; j++) {
        const x = (i / this.segments - 0.5) * this.size
        const z = (j / this.segments - 0.5) * this.size

        let height = 0

        // Central hill (20m high)
        const distFromCenter = Math.sqrt(x * x + z * z)
        if (distFromCenter < 30) {
          height = Math.max(height, 20 * (1 - distFromCenter / 30))
        }

        // Four ridge lines (10-15m high)
        const ridges = [
          { x: -60, z: 0, radius: 25, height: 15 },
          { x: 60, z: 0, radius: 25, height: 12 },
          { x: 0, z: -60, radius: 25, height: 14 },
          { x: 0, z: 60, radius: 25, height: 13 },
        ]

        for (const ridge of ridges) {
          const dist = Math.sqrt((x - ridge.x) ** 2 + (z - ridge.z) ** 2)
          if (dist < ridge.radius) {
            height = Math.max(height, ridge.height * (1 - dist / ridge.radius))
          }
        }

        // Canyon paths (lowered areas)
        if (Math.abs(x - z) < 8 && distFromCenter > 35 && distFromCenter < 80) {
          height = Math.max(0, height - 5)
        }
        if (Math.abs(x + z) < 8 && distFromCenter > 35 && distFromCenter < 80) {
          height = Math.max(0, height - 5)
        }

        data[i * (this.segments + 1) + j] = height
      }
    }

    return data
  }

  private createTerrain(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.segments,
      this.segments
    )

    // Apply heightmap
    const positions = geometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      positions.setZ(i, this.heightData[i])
    }
    geometry.computeVertexNormals()

    // Material - desert/rocky colors
    const material = new THREE.MeshStandardMaterial({
      color: 0xc9a66b,
      flatShading: true,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.receiveShadow = true

    return mesh
  }

  private addDecorations(scene: THREE.Scene): void {
    // Zerg creep patches (purple spots)
    const creepPositions = [
      { x: 0, z: 0 },
      { x: -20, z: 15 },
      { x: 25, z: -10 },
      { x: -40, z: -35 },
      { x: 45, z: 40 },
    ]

    const creepMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a0080,
      transparent: true,
      opacity: 0.7,
    })

    for (const pos of creepPositions) {
      const size = 10 + Math.random() * 15
      const geometry = new THREE.CircleGeometry(size, 16)
      const creep = new THREE.Mesh(geometry, creepMaterial)
      creep.rotation.x = -Math.PI / 2
      creep.position.set(pos.x, this.getHeightAt(pos.x, pos.z) + 0.1, pos.z)
      scene.add(creep)
    }

    // Rock formations on ridges
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      flatShading: true,
    })

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 50 + Math.random() * 30
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist
      const y = this.getHeightAt(x, z)

      if (y > 5) {
        const rockGeometry = new THREE.DodecahedronGeometry(2 + Math.random() * 3, 0)
        const rock = new THREE.Mesh(rockGeometry, rockMaterial)
        rock.position.set(x, y + 1, z)
        rock.rotation.set(Math.random(), Math.random(), Math.random())
        rock.castShadow = true
        scene.add(rock)
      }
    }
  }

  public getHeightAt(x: number, z: number): number {
    // Convert world coordinates to heightmap indices
    const i = Math.floor(((x / this.size) + 0.5) * this.segments)
    const j = Math.floor(((z / this.size) + 0.5) * this.segments)

    if (i < 0 || i > this.segments || j < 0 || j > this.segments) {
      return 0
    }

    return this.heightData[i * (this.segments + 1) + j]
  }

  public getSize(): number {
    return this.size
  }
}
