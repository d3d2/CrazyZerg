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

  // Orbit/strafe movement properties
  private strafeDirection = 1 // 1 for clockwise, -1 for counter-clockwise
  private strafeChangeTimer = 0
  private readonly STRAFE_CHANGE_INTERVAL = 1.5 // Change direction every 1.5 seconds

  // Target highlight
  private highlightMesh?: THREE.Mesh
  private isHighlighted = false

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
      // Move toward target when outside attack range
      direction.normalize()
      this.velocity.copy(direction.multiplyScalar(this.speed))
    } else {
      // Orbit/strafe behavior when within attack range
      // Update strafe direction timer
      this.strafeChangeTimer += dt
      if (this.strafeChangeTimer >= this.STRAFE_CHANGE_INTERVAL) {
        this.strafeDirection *= -1 // Flip direction
        this.strafeChangeTimer = 0
      }

      // Calculate perpendicular direction for strafing
      const toTarget = direction.clone().normalize()
      const strafeDirection = new THREE.Vector3(-toTarget.z, 0, toTarget.x) // Perpendicular (90 degrees)
      strafeDirection.multiplyScalar(this.strafeDirection * this.speed)

      this.velocity.copy(strafeDirection)
    }

    this.position.add(this.velocity.clone().multiplyScalar(dt))
    this.position.y = terrainHeight

    this.mesh.position.copy(this.position)

    // Update highlight position
    this.updateHighlight()

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

  public setHighlighted(scene: THREE.Scene, highlighted: boolean): void {
    if (this.isHighlighted === highlighted) return

    this.isHighlighted = highlighted

    if (highlighted) {
      // Create highlight mesh
      const geometry = new THREE.RingGeometry(2, 2.3, 32)
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      })
      this.highlightMesh = new THREE.Mesh(geometry, material)
      this.highlightMesh.rotation.x = -Math.PI / 2
      this.highlightMesh.position.copy(this.position)
      this.highlightMesh.position.y += 0.1 // Slightly above ground
      scene.add(this.highlightMesh)
    } else if (this.highlightMesh) {
      // Remove highlight mesh
      scene.remove(this.highlightMesh)
      this.highlightMesh.geometry.dispose()
      if (this.highlightMesh.material instanceof THREE.Material) {
        this.highlightMesh.material.dispose()
      }
      this.highlightMesh = undefined
    }
  }

  public updateHighlight(): void {
    if (this.highlightMesh) {
      this.highlightMesh.position.copy(this.position)
      this.highlightMesh.position.y += 0.1
    }
  }

  public dispose(scene: THREE.Scene): void {
    // Clean up highlight
    if (this.highlightMesh) {
      scene.remove(this.highlightMesh)
      this.highlightMesh.geometry.dispose()
      if (this.highlightMesh.material instanceof THREE.Material) {
        this.highlightMesh.material.dispose()
      }
      this.highlightMesh = undefined
    }

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
