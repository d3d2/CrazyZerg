import * as THREE from 'three'

export class Guardian {
  public mesh: THREE.Group
  public position: THREE.Vector3
  public velocity: THREE.Vector3 = new THREE.Vector3()

  public health = 500
  public maxHealth = 500
  public speed = 20
  public minHeight = 5
  public maxHeight = 30
  public targetHeight = 15

  private body!: THREE.Mesh
  private wings: THREE.Mesh[] = []
  private wingAngle = 0

  constructor(scene: THREE.Scene, startPosition: THREE.Vector3) {
    this.position = startPosition.clone()
    this.mesh = this.createMesh()
    this.mesh.position.copy(this.position)
    scene.add(this.mesh)
  }

  private createMesh(): THREE.Group {
    const group = new THREE.Group()

    // Body - elongated blob shape (zerg style)
    const bodyGeometry = new THREE.CapsuleGeometry(1.5, 4, 8, 16)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a0e4e,  // Dark purple
      flatShading: true,
    })
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    this.body.rotation.x = Math.PI / 2
    this.body.castShadow = true
    group.add(this.body)

    // Head/front
    const headGeometry = new THREE.SphereGeometry(1.2, 8, 8)
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a1e6e,
      flatShading: true,
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.z = -2.5
    head.castShadow = true
    group.add(head)

    // Wings (4 total, 2 per side)
    const wingGeometry = new THREE.BoxGeometry(0.3, 0.1, 3)
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a3e8e,
      transparent: true,
      opacity: 0.8,
    })

    const wingPositions = [
      { x: 1.5, y: 0.5, z: 0, rotZ: 0.3 },
      { x: -1.5, y: 0.5, z: 0, rotZ: -0.3 },
      { x: 2, y: 0.3, z: 1, rotZ: 0.5 },
      { x: -2, y: 0.3, z: 1, rotZ: -0.5 },
    ]

    for (const pos of wingPositions) {
      const wing = new THREE.Mesh(wingGeometry, wingMaterial)
      wing.position.set(pos.x, pos.y, pos.z)
      wing.rotation.z = pos.rotZ
      wing.castShadow = true
      this.wings.push(wing)
      group.add(wing)
    }

    // Acid sac (belly, glowing)
    const sacGeometry = new THREE.SphereGeometry(0.8, 8, 8)
    const sacMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3,
    })
    const sac = new THREE.Mesh(sacGeometry, sacMaterial)
    sac.position.set(0, -1, 0)
    group.add(sac)

    return group
  }

  public update(dt: number, terrainHeight: number): void {
    // Apply velocity
    this.position.add(this.velocity.clone().multiplyScalar(dt))

    // Clamp height
    const minY = terrainHeight + this.minHeight
    const maxY = terrainHeight + this.maxHeight
    this.position.y = Math.max(minY, Math.min(maxY, this.position.y))

    // Update mesh position
    this.mesh.position.copy(this.position)

    // Wing animation
    this.wingAngle += dt * 15
    for (let i = 0; i < this.wings.length; i++) {
      const baseRotZ = i % 2 === 0 ? 0.3 : -0.3
      this.wings[i].rotation.z = baseRotZ + Math.sin(this.wingAngle + i) * 0.2
    }

    // Friction
    this.velocity.multiplyScalar(0.95)
  }

  public moveDirection(direction: THREE.Vector3): void {
    this.velocity.add(direction.clone().multiplyScalar(this.speed * 0.1))

    // Rotate to face movement direction
    if (direction.lengthSq() > 0.01) {
      const targetAngle = Math.atan2(direction.x, direction.z)
      this.mesh.rotation.y = THREE.MathUtils.lerp(
        this.mesh.rotation.y,
        targetAngle,
        0.1
      )
    }
  }

  public changeHeight(delta: number): void {
    this.velocity.y += delta * 10
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount)
  }

  public isDead(): boolean {
    return this.health <= 0
  }
}
