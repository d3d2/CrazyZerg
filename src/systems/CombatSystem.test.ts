import { describe, expect, test, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { CombatSystem } from './CombatSystem'
import { Guardian } from '../entities/Guardian'
import { Marine } from '../entities/Marine'
import { World } from '../game/World'

describe('CombatSystem', () => {
  let scene: THREE.Scene
  let world: World
  let guardian: Guardian
  let combatSystem: CombatSystem
  let enemies: Marine[]

  beforeEach(() => {
    scene = new THREE.Scene()
    world = new World(scene)
    // Place entities away from central hill (which is 20m high) to avoid projectile exploding on terrain
    guardian = new Guardian(scene, new THREE.Vector3(40, 5, 40))
    combatSystem = new CombatSystem(scene, world)
    enemies = [new Marine(scene, new THREE.Vector3(50, 0, 40))]
  })

  test('isFiring=false should not create projectiles', () => {
    const currentTime = 10
    const dt = 0.016

    combatSystem.setFireIntent(false)
    combatSystem.update(dt, currentTime, guardian, enemies)

    expect(combatSystem.getProjectiles().length).toBe(0)
  })

  test('isFiring=true should create projectile when enemy in range', () => {
    const currentTime = 10 // Enough time since last attack (cooldown is 2s)
    const dt = 0.016 // Small delta so projectile doesn't reach target yet

    combatSystem.setFireIntent(true)
    combatSystem.update(dt, currentTime, guardian, enemies)

    expect(combatSystem.getProjectiles().length).toBe(1)
  })
})
