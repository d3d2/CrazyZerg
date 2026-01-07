import * as THREE from 'three'

export class InputSystem {
  private keys: Set<string> = new Set()
  private wheelDelta = 0

  constructor() {
    window.addEventListener('keydown', this.onKeyDown.bind(this))
    window.addEventListener('keyup', this.onKeyUp.bind(this))
    window.addEventListener('wheel', this.onWheel.bind(this), { passive: false })
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.code)
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code)
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault()
    this.wheelDelta -= Math.sign(event.deltaY)
  }

  public getMovementDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3()

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      direction.z -= 1
    }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      direction.z += 1
    }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
      direction.x -= 1
    }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
      direction.x += 1
    }

    if (direction.lengthSq() > 0) {
      direction.normalize()
    }

    return direction
  }

  public getHeightDelta(): number {
    const delta = this.wheelDelta
    this.wheelDelta = 0
    return delta
  }

  public isKeyPressed(code: string): boolean {
    return this.keys.has(code)
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown.bind(this))
    window.removeEventListener('keyup', this.onKeyUp.bind(this))
    window.removeEventListener('wheel', this.onWheel.bind(this))
  }
}
