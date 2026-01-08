import * as THREE from 'three'
import { Guardian } from '../entities/Guardian'
import { Enemy } from '../entities/Enemy'
import { Projectile } from '../entities/Projectile'
import { World } from '../game/World'

export class CombatSystem {
  private scene: THREE.Scene
  private world: World
  private projectiles: Projectile[] = []
  private visualEffects: VisualEffect[] = []

  private attackCooldown = 2
  private lastAttackTime = 0
  private targetEnemy: Enemy | null = null
  private isFiring = false

  constructor(scene: THREE.Scene, world: World) {
    this.scene = scene
    this.world = world
  }

  public setTarget(enemy: Enemy | null): void {
    this.targetEnemy = enemy
  }

  public setFireIntent(isFiring: boolean): void {
    this.isFiring = isFiring
  }

  public update(
    dt: number,
    currentTime: number,
    guardian: Guardian,
    enemies: Enemy[]
  ): void {
    // Auto-attack logic (only fires when isFiring is true)
    if (this.isFiring && currentTime - this.lastAttackTime >= this.attackCooldown) {
      const target = this.findTarget(guardian, enemies)
      if (target) {
        this.fireProjectile(guardian, target)
        this.lastAttackTime = currentTime
      }
    }

    // Update projectiles
    for (const projectile of this.projectiles) {
      projectile.update(dt)

      // Check collision with terrain
      const terrainHeight = this.world.getHeightAt(
        projectile.position.x,
        projectile.position.z
      )
      if (projectile.position.y <= terrainHeight) {
        this.explodeProjectile(projectile, enemies)
      }

      // Check collision with enemies
      for (const enemy of enemies) {
        if (enemy.isDead) continue
        const dist = projectile.position.distanceTo(enemy.position)
        if (dist < 2) {
          this.explodeProjectile(projectile, enemies)
          break
        }
      }
    }

    // Clean up expired projectiles
    const expired = this.projectiles.filter(p => p.isExpired)
    for (const p of expired) {
      p.dispose(this.scene)
    }
    this.projectiles = this.projectiles.filter(p => !p.isExpired)

    // Update and clean up visual effects
    for (const effect of this.visualEffects) {
      effect.update(dt)
    }
    const expiredEffects = this.visualEffects.filter(e => e.isExpired)
    for (const e of expiredEffects) {
      e.dispose(this.scene)
    }
    this.visualEffects = this.visualEffects.filter(e => !e.isExpired)
  }

  private findTarget(guardian: Guardian, enemies: Enemy[]): Enemy | null {
    // If manual target is set and valid, use it
    if (this.targetEnemy && !this.targetEnemy.isDead) {
      return this.targetEnemy
    }

    // Find closest enemy
    let closest: Enemy | null = null
    let closestDist = Infinity

    for (const enemy of enemies) {
      if (enemy.isDead) continue
      const dist = guardian.position.distanceTo(enemy.position)
      if (dist < closestDist) {
        closestDist = dist
        closest = enemy
      }
    }

    return closest
  }

  private fireProjectile(guardian: Guardian, target: Enemy): void {
    const startPos = guardian.position.clone()
    startPos.y -= 1 // Fire from acid sac

    const direction = target.position.clone().sub(startPos)

    // Apply high ground bonus
    const heightDiff = guardian.position.y - target.position.y
    let damageMultiplier = 1
    if (heightDiff >= 10) {
      damageMultiplier = 1.25
    }

    const projectile = new Projectile(this.scene, startPos, direction, {
      speed: 30,
      damage: 25 * damageMultiplier,
      isAoE: true,
      aoERadius: 5,
    })

    this.projectiles.push(projectile)

    // Spawn muzzle flash effect
    this.visualEffects.push(new MuzzleFlashEffect(this.scene, startPos))
  }

  private explodeProjectile(projectile: Projectile, enemies: Enemy[]): void {
    if (projectile.isExpired) return
    projectile.isExpired = true

    // Check if hit terrain (no enemies in range)
    let hitEnemy = false
    for (const enemy of enemies) {
      if (enemy.isDead) continue
      const dist = projectile.position.distanceTo(enemy.position)
      if (dist <= projectile.aoERadius) {
        hitEnemy = true
        break
      }
    }

    // Spawn impact effect
    if (hitEnemy) {
      this.visualEffects.push(new ImpactSparksEffect(this.scene, projectile.position))
    } else {
      this.visualEffects.push(new DustEffect(this.scene, projectile.position))
    }

    // AoE damage
    for (const enemy of enemies) {
      if (enemy.isDead) continue
      const dist = projectile.position.distanceTo(enemy.position)
      if (dist <= projectile.aoERadius) {
        // Damage falloff with distance
        const falloff = 1 - (dist / projectile.aoERadius) * 0.5
        enemy.takeDamage(projectile.damage * falloff)
      }
    }
  }

  public getProjectiles(): Projectile[] {
    return this.projectiles
  }
}

// Visual effects for combat feel
abstract class VisualEffect {
  public isExpired = false
  protected age = 0
  protected lifetime: number

  constructor(protected lifetimeSeconds: number) {
    this.lifetime = lifetimeSeconds
  }

  public update(dt: number): void {
    this.age += dt
    if (this.age >= this.lifetime) {
      this.isExpired = true
    }
    this.updateEffect(dt)
  }

  protected updateEffect(_dt: number): void {
    // Override in subclasses
  }

  public dispose(_scene: THREE.Scene): void {
    // Override in subclasses
  }
}

class MuzzleFlashEffect extends VisualEffect {
  private mesh: THREE.Mesh

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(0.1) // 100ms flash

    const geometry = new THREE.SphereGeometry(0.5, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(position)
    scene.add(this.mesh)
  }

  protected updateEffect(_dt: number): void {
    // Fade out
    const progress = this.age / this.lifetime
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.opacity = 0.8 * (1 - progress)
    }
    // Shrink
    const scale = 1 - progress * 0.5
    this.mesh.scale.setScalar(scale)
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh)
    this.mesh.geometry.dispose()
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose()
    }
  }
}

class ImpactSparksEffect extends VisualEffect {
  private particles: THREE.Mesh[]

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(0.3) // 300ms

    this.particles = []
    const particleCount = 8
    const geometry = new THREE.SphereGeometry(0.1, 4, 4)
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 })

    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(geometry, material)
      particle.position.copy(position)

      // Random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 10,
        (Math.random() - 0.5) * 10
      )
      particle.userData.velocity = velocity

      scene.add(particle)
      this.particles.push(particle)
    }
  }

  protected updateEffect(dt: number): void {
    for (const particle of this.particles) {
      const velocity = particle.userData.velocity as THREE.Vector3
      particle.position.add(velocity.clone().multiplyScalar(dt))
      velocity.y -= 20 * dt // Gravity
    }
  }

  public dispose(scene: THREE.Scene): void {
    for (const particle of this.particles) {
      scene.remove(particle)
      particle.geometry.dispose()
      if (particle.material instanceof THREE.Material) {
        particle.material.dispose()
      }
    }
  }
}

class DustEffect extends VisualEffect {
  private mesh: THREE.Mesh

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(0.5) // 500ms

    const geometry = new THREE.RingGeometry(0.1, 1, 16)
    const material = new THREE.MeshBasicMaterial({
      color: 0x8b7355,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(position)
    this.mesh.position.y += 0.05
    this.mesh.rotation.x = -Math.PI / 2
    scene.add(this.mesh)
  }

  protected updateEffect(_dt: number): void {
    // Expand and fade
    const progress = this.age / this.lifetime
    const scale = 1 + progress * 2
    this.mesh.scale.setScalar(scale)
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.opacity = 0.5 * (1 - progress)
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
