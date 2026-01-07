import * as THREE from 'three'
import { Enemy } from './Enemy'

export class Marine extends Enemy {
  constructor(scene: THREE.Scene, startPosition: THREE.Vector3) {
    super(scene, startPosition, {
      health: 40,
      speed: 8,
      damage: 6,
      attackRange: 25,
      attackCooldown: 1,
    })
  }

  protected createMesh(): THREE.Group {
    const group = new THREE.Group()

    // Body (blue terran armor)
    const bodyGeometry = new THREE.BoxGeometry(1, 1.8, 0.8)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      flatShading: true,
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.9
    body.castShadow = true
    group.add(body)

    // Head (helmet)
    const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6)
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a4a6f,
      flatShading: true,
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.y = 2.1
    head.castShadow = true
    group.add(head)

    // Visor (glowing)
    const visorGeometry = new THREE.BoxGeometry(0.5, 0.15, 0.1)
    const visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
    })
    const visor = new THREE.Mesh(visorGeometry, visorMaterial)
    visor.position.set(0, 2.15, 0.3)
    group.add(visor)

    // Gun
    const gunGeometry = new THREE.BoxGeometry(0.2, 0.2, 1.2)
    const gunMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      flatShading: true,
    })
    const gun = new THREE.Mesh(gunGeometry, gunMaterial)
    gun.position.set(0.6, 1.2, 0.4)
    gun.castShadow = true
    group.add(gun)

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.35, 1, 0.35)
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      flatShading: true,
    })

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
    leftLeg.position.set(-0.25, -0.5, 0)
    leftLeg.castShadow = true
    group.add(leftLeg)

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
    rightLeg.position.set(0.25, -0.5, 0)
    rightLeg.castShadow = true
    group.add(rightLeg)

    return group
  }
}
