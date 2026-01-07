import * as THREE from 'three'

export class Projectile {
  public mesh: THREE.Mesh
  public position: THREE.Vector3
  public velocity: THREE.Vector3
  public damage: number
  public isExpired = false
  public isAoE: boolean
  public aoERadius: number

  private lifetime = 3
  private age = 0

  constructor(
    scene: THREE.Scene,
    startPosition: THREE.Vector3,
    direction: THREE.Vector3,
    config: {
      speed: number
      damage: number
      isAoE?: boolean
      aoERadius?: number
    }
  ) {
    this.position = startPosition.clone()
    this.velocity = direction.normalize().multiplyScalar(config.speed)
    this.damage = config.damage
    this.isAoE = config.isAoE ?? true
    this.aoERadius = config.aoERadius ?? 5

    // Green acid projectile
    const geometry = new THREE.SphereGeometry(0.5, 8, 8)
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(this.position)
    scene.add(this.mesh)
  }

  public update(dt: number): void {
    this.position.add(this.velocity.clone().multiplyScalar(dt))
    this.mesh.position.copy(this.position)

    this.age += dt
    if (this.age >= this.lifetime) {
      this.isExpired = true
    }
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh)
    this.mesh.geometry.dispose()
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose()
    }
  }
}
