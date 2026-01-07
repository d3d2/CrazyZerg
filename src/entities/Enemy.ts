import * as THREE from 'three'

export abstract class Enemy {
  public mesh: THREE.Group
  public position: THREE.Vector3
  public velocity: THREE.Vector3 = new THREE.Vector3()

  public health: number
  public maxHealth: number
  public speed: number
  public damage: number
  public attackRange: number
  public attackCooldown: number
  protected lastAttackTime = 0

  public isDead = false

  constructor(
    scene: THREE.Scene,
    startPosition: THREE.Vector3,
    config: {
      health: number
      speed: number
      damage: number
      attackRange: number
      attackCooldown: number
    }
  ) {
    this.position = startPosition.clone()
    this.health = config.health
    this.maxHealth = config.health
    this.speed = config.speed
    this.damage = config.damage
    this.attackRange = config.attackRange
    this.attackCooldown = config.attackCooldown

    this.mesh = this.createMesh()
    this.mesh.position.copy(this.position)
    scene.add(this.mesh)
  }

  protected abstract createMesh(): THREE.Group

  public update(dt: number, targetPosition: THREE.Vector3, terrainHeight: number): void {
    if (this.isDead) return

    // Move toward target
    const direction = targetPosition.clone().sub(this.position)
    direction.y = 0
    const distance = direction.length()

    if (distance > this.attackRange) {
      direction.normalize()
      this.velocity.copy(direction.multiplyScalar(this.speed))
    } else {
      this.velocity.set(0, 0, 0)
    }

    this.position.add(this.velocity.clone().multiplyScalar(dt))
    this.position.y = terrainHeight

    this.mesh.position.copy(this.position)

    // Face target
    if (distance > 0.1) {
      const angle = Math.atan2(
        targetPosition.x - this.position.x,
        targetPosition.z - this.position.z
      )
      this.mesh.rotation.y = angle
    }
  }

  public canAttack(currentTime: number): boolean {
    return currentTime - this.lastAttackTime >= this.attackCooldown
  }

  public attack(currentTime: number): number {
    this.lastAttackTime = currentTime
    return this.damage
  }

  public takeDamage(amount: number): void {
    this.health -= amount
    if (this.health <= 0) {
      this.health = 0
      this.isDead = true
    }
  }

  public getDistanceTo(target: THREE.Vector3): number {
    return this.position.distanceTo(target)
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh)
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
  }
}
