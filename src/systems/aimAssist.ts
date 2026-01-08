import * as THREE from 'three'
import { Enemy } from '../entities/Enemy'

export interface AimAssistConfig {
  aimAssistRadius: number
}

export function findAimTarget(
  aimPoint: THREE.Vector3,
  enemies: Enemy[],
  config: AimAssistConfig
): Enemy | null {
  let closest: Enemy | null = null
  let closestDist = Infinity

  for (const enemy of enemies) {
    if (enemy.isDead) continue

    // Calculate horizontal distance (ignore Y difference)
    const dx = enemy.position.x - aimPoint.x
    const dz = enemy.position.z - aimPoint.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    // Only assist targets strictly within the radius
    if (dist < config.aimAssistRadius && dist < closestDist) {
      closestDist = dist
      closest = enemy
    }
  }

  return closest
}
