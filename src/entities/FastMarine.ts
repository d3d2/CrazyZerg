import * as THREE from 'three'
import { Marine } from './Marine'

export class FastMarine extends Marine {
  constructor(scene: THREE.Scene, startPosition: THREE.Vector3) {
    // Fast marine has less health but moves faster
    super(scene, startPosition)
    this.health = 25 // Reduced from 40
    this.maxHealth = 25
    this.speed = 14 // Increased from 8
    this.damage = 4 // Slightly reduced damage
  }

  protected createMesh(): THREE.Group {
    const group = super.createMesh()

    // Change color to indicate fast variant (red instead of blue)
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        // Change armor color to red
        if (child.material.color.getHex() === 0x1e3a5f) {
          child.material.color.setHex(0x5f1e1e)
        }
        if (child.material.color.getHex() === 0x2a4a6f) {
          child.material.color.setHex(0x6f2a2a)
        }
        // Change visor to red
        if (child.material.color.getHex() === 0x00ffff) {
          child.material.color.setHex(0xff3333)
          child.material.emissive.setHex(0xff3333)
        }
      }
    })

    return group
  }
}
