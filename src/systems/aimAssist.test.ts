import { describe, expect, test, beforeEach } from 'vitest'
import * as THREE from 'three'
import { findAimTarget, AimAssistConfig } from './aimAssist'
import { Marine } from '../entities/Marine'

describe('findAimTarget', () => {
  let scene: THREE.Scene
  let enemies: Marine[]

  beforeEach(() => {
    scene = new THREE.Scene()
    enemies = [
      new Marine(scene, new THREE.Vector3(0, 0, 0)),
      new Marine(scene, new THREE.Vector3(5, 0, 0)),
    ]
  })

  test('aimAssistRadius=0 means no help (null unless exact overlap)', () => {
    const aimPoint = new THREE.Vector3(1, 0, 0) // 1 unit away from first enemy
    const config: AimAssistConfig = { aimAssistRadius: 0 }

    const target = findAimTarget(aimPoint, enemies, config)

    // Should return null because aim point is not exactly on enemy
    expect(target).toBeNull()
  })

  test('aimAssistRadius=2 finds target within radius', () => {
    const aimPoint = new THREE.Vector3(1, 0, 0) // 1 unit away from first enemy
    const config: AimAssistConfig = { aimAssistRadius: 2 }

    const target = findAimTarget(aimPoint, enemies, config)

    // Should find the first enemy since it's within radius 2
    expect(target).not.toBeNull()
    expect(target).toBe(enemies[0])
  })

  test('aimAssistRadius=2 does not find target outside radius', () => {
    const aimPoint = new THREE.Vector3(3, 0, 0) // 3 units away from first enemy
    const config: AimAssistConfig = { aimAssistRadius: 2 }

    const target = findAimTarget(aimPoint, enemies, config)

    // Should return null because both enemies are outside radius 2
    expect(target).toBeNull()
  })
})
