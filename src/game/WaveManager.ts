import * as THREE from 'three'
import { Marine } from '../entities/Marine'
import { FastMarine } from '../entities/FastMarine'
import { Enemy } from '../entities/Enemy'
import { World } from './World'

export interface WaveConfig {
  marineCount: number
  fastMarineCount: number
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

    // Fast marines start appearing from wave 3, increasing each wave
    let fastMarineCount = 0
    if (wave >= 3) {
      fastMarineCount = Math.floor((wave - 2) * 0.5) // One fast marine every 2 waves starting from wave 3
    }

    // More aggressive spawn point scaling
    let spawnPoints: number
    if (wave <= 2) spawnPoints = 1
    else if (wave <= 5) spawnPoints = 2
    else if (wave <= 8) spawnPoints = 3
    else spawnPoints = 4

    return {
      marineCount: baseMarines + (wave - 1) * marinesPerWave,
      fastMarineCount,
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
    const fastMarinesPerSpawn = Math.ceil(config.fastMarineCount / config.spawnPoints)

    for (const spawnPos of activeSpawns) {
      // Spawn regular marines
      for (let i = 0; i < marinesPerSpawn; i++) {
        const pos = this.getSpawnPosition(spawnPos)
        const marine = new Marine(this.scene, pos)
        this.enemies.push(marine)
      }

      // Spawn fast marines
      for (let i = 0; i < fastMarinesPerSpawn; i++) {
        const pos = this.getSpawnPosition(spawnPos)
        const fastMarine = new FastMarine(this.scene, pos)
        this.enemies.push(fastMarine)
      }
    }
  }

  private getSpawnPosition(spawnPos: THREE.Vector3): THREE.Vector3 {
    // Add some randomness to spawn position
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      0,
      (Math.random() - 0.5) * 20
    )
    const pos = spawnPos.clone().add(offset)
    pos.y = this.world.getHeightAt(pos.x, pos.z)
    return pos
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
