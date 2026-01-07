import * as THREE from 'three'
import { Guardian } from '../entities/Guardian'
import { Enemy } from '../entities/Enemy'
import { Projectile } from '../entities/Projectile'
import { World } from '../game/World'

export class CombatSystem {
  private scene: THREE.Scene
  private world: World
  private projectiles: Projectile[] = []

  private attackCooldown = 2
  private lastAttackTime = 0
  private targetEnemy: Enemy | null = null

  constructor(scene: THREE.Scene, world: World) {
    this.scene = scene
    this.world = world
  }

  public setTarget(enemy: Enemy | null): void {
    this.targetEnemy = enemy
  }

  public update(
    dt: number,
    currentTime: number,
    guardian: Guardian,
    enemies: Enemy[]
  ): void {
    // Auto-attack logic
    if (currentTime - this.lastAttackTime >= this.attackCooldown) {
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
  }

  private explodeProjectile(projectile: Projectile, enemies: Enemy[]): void {
    if (projectile.isExpired) return
    projectile.isExpired = true

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
