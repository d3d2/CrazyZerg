import * as THREE from 'three'
import { Marine } from '../entities/Marine'
import { Enemy } from '../entities/Enemy'
import { World } from './World'

export interface WaveConfig {
  marineCount: number
  spawnPoints: number
}

export class WaveManager {
  private scene: THREE.Scene
  private world: World
  private enemies: Enemy[] = []

  public currentWave = 0
  public waveActive = false
  public betweenWaves = true
  public betweenWaveTimer = 3

  private spawnPositions = [
    new THREE.Vector3(0, 0, -90),   // North
    new THREE.Vector3(0, 0, 90),    // South
    new THREE.Vector3(-90, 0, 0),   // West
    new THREE.Vector3(90, 0, 0),    // East
  ]

  constructor(scene: THREE.Scene, world: World) {
    this.scene = scene
    this.world = world
  }

  public getWaveConfig(wave: number): WaveConfig {
    const baseMarines = 3
    const marinesPerWave = 2

    let spawnPoints: number
    if (wave <= 3) spawnPoints = 1
    else if (wave <= 7) spawnPoints = 2
    else spawnPoints = 4

    return {
      marineCount: baseMarines + (wave - 1) * marinesPerWave,
      spawnPoints,
    }
  }

  public startWave(): void {
    this.currentWave++
    this.waveActive = true
    this.betweenWaves = false

    const config = this.getWaveConfig(this.currentWave)

    // Select spawn points
    const activeSpawns = this.spawnPositions.slice(0, config.spawnPoints)
    const marinesPerSpawn = Math.ceil(config.marineCount / config.spawnPoints)

    for (const spawnPos of activeSpawns) {
      for (let i = 0; i < marinesPerSpawn; i++) {
        // Add some randomness to spawn position
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          0,
          (Math.random() - 0.5) * 20
        )
        const pos = spawnPos.clone().add(offset)
        pos.y = this.world.getHeightAt(pos.x, pos.z)

        const marine = new Marine(this.scene, pos)
        this.enemies.push(marine)
      }
    }
  }

  public update(
    dt: number,
    targetPosition: THREE.Vector3,
    currentTime: number
  ): { damageToPlayer: number; enemiesKilled: number } {
    let damageToPlayer = 0
    let enemiesKilled = 0

    if (this.betweenWaves) {
      this.betweenWaveTimer -= dt
      if (this.betweenWaveTimer <= 0) {
        this.startWave()
      }
      return { damageToPlayer, enemiesKilled }
    }

    // Update enemies
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue

      const terrainHeight = this.world.getHeightAt(
        enemy.position.x,
        enemy.position.z
      )
      enemy.update(dt, targetPosition, terrainHeight)

      // Check attack
      const dist = enemy.getDistanceTo(targetPosition)
      if (dist <= enemy.attackRange && enemy.canAttack(currentTime)) {
        damageToPlayer += enemy.attack(currentTime)
      }
    }

    // Remove dead enemies
    const deadEnemies = this.enemies.filter(e => e.isDead)
    enemiesKilled = deadEnemies.length

    for (const dead of deadEnemies) {
      dead.dispose(this.scene)
    }
    this.enemies = this.enemies.filter(e => !e.isDead)

    // Check wave complete
    if (this.enemies.length === 0 && this.waveActive) {
      this.waveActive = false
      this.betweenWaves = true
      this.betweenWaveTimer = 5
    }

    return { damageToPlayer, enemiesKilled }
  }

  public getEnemies(): Enemy[] {
    return this.enemies
  }

  public getEnemyCount(): number {
    return this.enemies.filter(e => !e.isDead).length
  }
}
