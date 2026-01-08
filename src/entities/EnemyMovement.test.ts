import { describe, expect, test, beforeEach } from 'vitest'
import * as THREE from 'three'
import { Marine } from './Marine'

describe('Enemy movement (strafe behavior)', () => {
  let scene: THREE.Scene
  let marine: Marine
  let targetPos: THREE.Vector3
  let terrainHeight: number

  beforeEach(() => {
    scene = new THREE.Scene()
    // Create marine at position (20, 0, 0) - within attackRange (25) of target at origin
    marine = new Marine(scene, new THREE.Vector3(20, 0, 0))
    targetPos = new THREE.Vector3(0, 5, 0)
    terrainHeight = 0
  })

  test('marine should not stop moving when within attack range', () => {
    const initialPos = marine.position.clone()
    const dt = 0.5 // Half second

    // Update multiple times to ensure movement
    marine.update(dt, targetPos, terrainHeight)
    marine.update(dt, targetPos, terrainHeight)

    const finalPos = marine.position

    // Position should change (not stationary) even when within range
    expect(finalPos.x).not.toBe(initialPos.x)
    expect(finalPos.z).not.toBe(initialPos.z)
  })

  test('marine should orbit/strafe around target', () => {
    const initialPos = marine.position.clone()
    const dt = 1.0 // One second

    marine.update(dt, targetPos, terrainHeight)

    // Marine should have moved perpendicular to target (orbiting)
    const distToTarget = initialPos.distanceTo(targetPos)
    const newDistToTarget = marine.position.distanceTo(targetPos)

    // Distance should remain roughly the same (orbiting), not closing in
    expect(Math.abs(distToTarget - newDistToTarget)).toBeLessThan(2)
  })
})
