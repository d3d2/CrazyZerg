# CrazyZerg Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 3D action-survival game where player controls a Guardian defending against waves of Terran marines.

**Architecture:** Three.js scene with entity-component pattern. Game loop handles input → AI → combat → render. Roguelite upgrades between waves.

**Tech Stack:** Three.js, TypeScript, Vite, Vitest

---

## Phase 1: Project Setup & Basic Scene

### Task 1: Initialize Vite + TypeScript + Three.js project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`

**Step 1: Initialize npm project and install dependencies**

Run:
```bash
npm init -y
npm install three
npm install -D typescript vite @types/three vitest
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  }
})
```

**Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CrazyZerg</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #000; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 5: Create src/main.ts with basic Three.js scene**

```typescript
import * as THREE from 'three'

// Scene setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb)

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 50, 50)
camera.lookAt(0, 0, 0)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(50, 100, 50)
scene.add(directionalLight)

// Ground plane (temporary)
const groundGeometry = new THREE.PlaneGeometry(200, 200)
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xd2b48c })
const ground = new THREE.Mesh(groundGeometry, groundMaterial)
ground.rotation.x = -Math.PI / 2
scene.add(ground)

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

animate()

console.log('CrazyZerg initialized!')
```

**Step 6: Update package.json scripts**

Add to package.json:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Step 7: Run dev server to verify**

Run: `npm run dev`
Expected: Browser opens, shows tan-colored ground plane with blue sky

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize Three.js project with basic scene"
```

---

### Task 2: Create Game class with proper game loop

**Files:**
- Create: `src/game/Game.ts`
- Modify: `src/main.ts`

**Step 1: Create src/game/Game.ts**

```typescript
import * as THREE from 'three'

export class Game {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer

  private lastTime = 0
  private running = false

  constructor() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 50, 50)
    this.camera.lookAt(0, 0, 0)

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    document.body.appendChild(this.renderer.domElement)

    // Lighting
    this.setupLighting()

    // Temporary ground
    this.createTemporaryGround()

    // Events
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    this.scene.add(directionalLight)
  }

  private createTemporaryGround(): void {
    const geometry = new THREE.PlaneGeometry(200, 200)
    const material = new THREE.MeshStandardMaterial({ color: 0xd2b48c })
    const ground = new THREE.Mesh(geometry, material)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.scene.add(ground)
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  public start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop()
  }

  private loop(): void {
    if (!this.running) return

    requestAnimationFrame(() => this.loop())

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    this.update(deltaTime)
    this.render()
  }

  private update(dt: number): void {
    // Game logic will go here
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }
}
```

**Step 2: Update src/main.ts**

```typescript
import { Game } from './game/Game'

const game = new Game()
game.start()

console.log('CrazyZerg started!')
```

**Step 3: Run dev server to verify**

Run: `npm run dev`
Expected: Same visual result, but now using Game class

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: extract Game class with proper game loop"
```

---

### Task 3: Create World with terrain heightmap

**Files:**
- Create: `src/game/World.ts`
- Modify: `src/game/Game.ts`

**Step 1: Create src/game/World.ts**

```typescript
import * as THREE from 'three'

export class World {
  private terrain: THREE.Mesh
  private heightData: Float32Array
  private size = 200
  private segments = 100

  constructor(scene: THREE.Scene) {
    this.heightData = this.generateHeightmap()
    this.terrain = this.createTerrain()
    scene.add(this.terrain)

    this.addDecorations(scene)
  }

  private generateHeightmap(): Float32Array {
    const data = new Float32Array((this.segments + 1) * (this.segments + 1))

    for (let i = 0; i <= this.segments; i++) {
      for (let j = 0; j <= this.segments; j++) {
        const x = (i / this.segments - 0.5) * this.size
        const z = (j / this.segments - 0.5) * this.size

        let height = 0

        // Central hill (20m high)
        const distFromCenter = Math.sqrt(x * x + z * z)
        if (distFromCenter < 30) {
          height = Math.max(height, 20 * (1 - distFromCenter / 30))
        }

        // Four ridge lines (10-15m high)
        const ridges = [
          { x: -60, z: 0, radius: 25, height: 15 },
          { x: 60, z: 0, radius: 25, height: 12 },
          { x: 0, z: -60, radius: 25, height: 14 },
          { x: 0, z: 60, radius: 25, height: 13 },
        ]

        for (const ridge of ridges) {
          const dist = Math.sqrt((x - ridge.x) ** 2 + (z - ridge.z) ** 2)
          if (dist < ridge.radius) {
            height = Math.max(height, ridge.height * (1 - dist / ridge.radius))
          }
        }

        // Canyon paths (lowered areas)
        if (Math.abs(x - z) < 8 && distFromCenter > 35 && distFromCenter < 80) {
          height = Math.max(0, height - 5)
        }
        if (Math.abs(x + z) < 8 && distFromCenter > 35 && distFromCenter < 80) {
          height = Math.max(0, height - 5)
        }

        data[i * (this.segments + 1) + j] = height
      }
    }

    return data
  }

  private createTerrain(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.segments,
      this.segments
    )

    // Apply heightmap
    const positions = geometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      positions.setZ(i, this.heightData[i])
    }
    geometry.computeVertexNormals()

    // Material - desert/rocky colors
    const material = new THREE.MeshStandardMaterial({
      color: 0xc9a66b,
      flatShading: true,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.receiveShadow = true

    return mesh
  }

  private addDecorations(scene: THREE.Scene): void {
    // Zerg creep patches (purple spots)
    const creepPositions = [
      { x: 0, z: 0 },
      { x: -20, z: 15 },
      { x: 25, z: -10 },
      { x: -40, z: -35 },
      { x: 45, z: 40 },
    ]

    const creepMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a0080,
      transparent: true,
      opacity: 0.7,
    })

    for (const pos of creepPositions) {
      const size = 10 + Math.random() * 15
      const geometry = new THREE.CircleGeometry(size, 16)
      const creep = new THREE.Mesh(geometry, creepMaterial)
      creep.rotation.x = -Math.PI / 2
      creep.position.set(pos.x, this.getHeightAt(pos.x, pos.z) + 0.1, pos.z)
      scene.add(creep)
    }

    // Rock formations on ridges
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      flatShading: true,
    })

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 50 + Math.random() * 30
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist
      const y = this.getHeightAt(x, z)

      if (y > 5) {
        const rockGeometry = new THREE.DodecahedronGeometry(2 + Math.random() * 3, 0)
        const rock = new THREE.Mesh(rockGeometry, rockMaterial)
        rock.position.set(x, y + 1, z)
        rock.rotation.set(Math.random(), Math.random(), Math.random())
        rock.castShadow = true
        scene.add(rock)
      }
    }
  }

  public getHeightAt(x: number, z: number): number {
    // Convert world coordinates to heightmap indices
    const i = Math.floor(((x / this.size) + 0.5) * this.segments)
    const j = Math.floor(((z / this.size) + 0.5) * this.segments)

    if (i < 0 || i > this.segments || j < 0 || j > this.segments) {
      return 0
    }

    return this.heightData[i * (this.segments + 1) + j]
  }

  public getSize(): number {
    return this.size
  }
}
```

**Step 2: Modify src/game/Game.ts to use World**

Add import and create World:

```typescript
import * as THREE from 'three'
import { World } from './World'

export class Game {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private world: World

  private lastTime = 0
  private running = false

  constructor() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 50, 50)
    this.camera.lookAt(0, 0, 0)

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    document.body.appendChild(this.renderer.domElement)

    // Lighting
    this.setupLighting()

    // World with terrain
    this.world = new World(this.scene)

    // Events
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100
    this.scene.add(directionalLight)
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  public start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop()
  }

  private loop(): void {
    if (!this.running) return

    requestAnimationFrame(() => this.loop())

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    this.update(deltaTime)
    this.render()
  }

  private update(dt: number): void {
    // Game logic will go here
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  public getWorld(): World {
    return this.world
  }
}
```

**Step 3: Run dev server to verify**

Run: `npm run dev`
Expected: Terrain with hills, ridges, purple creep patches and rocks

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add World with procedural terrain heightmap"
```

---

## Phase 2: Guardian & Controls

### Task 4: Create Guardian entity

**Files:**
- Create: `src/entities/Guardian.ts`
- Modify: `src/game/Game.ts`

**Step 1: Create src/entities/Guardian.ts**

```typescript
import * as THREE from 'three'

export class Guardian {
  public mesh: THREE.Group
  public position: THREE.Vector3
  public velocity: THREE.Vector3 = new THREE.Vector3()

  public health = 500
  public maxHealth = 500
  public speed = 20
  public minHeight = 5
  public maxHeight = 30
  public targetHeight = 15

  private body: THREE.Mesh
  private wings: THREE.Mesh[] = []
  private wingAngle = 0

  constructor(scene: THREE.Scene, startPosition: THREE.Vector3) {
    this.position = startPosition.clone()
    this.mesh = this.createMesh()
    this.mesh.position.copy(this.position)
    scene.add(this.mesh)
  }

  private createMesh(): THREE.Group {
    const group = new THREE.Group()

    // Body - elongated blob shape (zerg style)
    const bodyGeometry = new THREE.CapsuleGeometry(1.5, 4, 8, 16)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a0e4e,  // Dark purple
      flatShading: true,
    })
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    this.body.rotation.x = Math.PI / 2
    this.body.castShadow = true
    group.add(this.body)

    // Head/front
    const headGeometry = new THREE.SphereGeometry(1.2, 8, 8)
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a1e6e,
      flatShading: true,
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.z = -2.5
    head.castShadow = true
    group.add(head)

    // Wings (4 total, 2 per side)
    const wingGeometry = new THREE.BoxGeometry(0.3, 0.1, 3)
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a3e8e,
      transparent: true,
      opacity: 0.8,
    })

    const wingPositions = [
      { x: 1.5, y: 0.5, z: 0, rotZ: 0.3 },
      { x: -1.5, y: 0.5, z: 0, rotZ: -0.3 },
      { x: 2, y: 0.3, z: 1, rotZ: 0.5 },
      { x: -2, y: 0.3, z: 1, rotZ: -0.5 },
    ]

    for (const pos of wingPositions) {
      const wing = new THREE.Mesh(wingGeometry, wingMaterial)
      wing.position.set(pos.x, pos.y, pos.z)
      wing.rotation.z = pos.rotZ
      wing.castShadow = true
      this.wings.push(wing)
      group.add(wing)
    }

    // Acid sac (belly, glowing)
    const sacGeometry = new THREE.SphereGeometry(0.8, 8, 8)
    const sacMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3,
    })
    const sac = new THREE.Mesh(sacGeometry, sacMaterial)
    sac.position.set(0, -1, 0)
    group.add(sac)

    return group
  }

  public update(dt: number, terrainHeight: number): void {
    // Apply velocity
    this.position.add(this.velocity.clone().multiplyScalar(dt))

    // Clamp height
    const minY = terrainHeight + this.minHeight
    const maxY = terrainHeight + this.maxHeight
    this.position.y = Math.max(minY, Math.min(maxY, this.position.y))

    // Update mesh position
    this.mesh.position.copy(this.position)

    // Wing animation
    this.wingAngle += dt * 15
    for (let i = 0; i < this.wings.length; i++) {
      const baseRotZ = i % 2 === 0 ? 0.3 : -0.3
      this.wings[i].rotation.z = baseRotZ + Math.sin(this.wingAngle + i) * 0.2
    }

    // Friction
    this.velocity.multiplyScalar(0.95)
  }

  public moveDirection(direction: THREE.Vector3): void {
    this.velocity.add(direction.clone().multiplyScalar(this.speed * 0.1))

    // Rotate to face movement direction
    if (direction.lengthSq() > 0.01) {
      const targetAngle = Math.atan2(direction.x, direction.z)
      this.mesh.rotation.y = THREE.MathUtils.lerp(
        this.mesh.rotation.y,
        targetAngle,
        0.1
      )
    }
  }

  public changeHeight(delta: number): void {
    this.velocity.y += delta * 10
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount)
  }

  public isDead(): boolean {
    return this.health <= 0
  }
}
```

**Step 2: Modify src/game/Game.ts to add Guardian**

Add import and instantiate Guardian:

```typescript
import * as THREE from 'three'
import { World } from './World'
import { Guardian } from '../entities/Guardian'

export class Game {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private world: World
  private guardian: Guardian

  private lastTime = 0
  private running = false

  constructor() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    document.body.appendChild(this.renderer.domElement)

    // Lighting
    this.setupLighting()

    // World with terrain
    this.world = new World(this.scene)

    // Guardian (player)
    const startPos = new THREE.Vector3(0, 20, 0)
    this.guardian = new Guardian(this.scene, startPos)

    // Position camera behind guardian
    this.updateCamera()

    // Events
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100
    this.scene.add(directionalLight)
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private updateCamera(): void {
    // Third-person camera behind and above guardian
    const offset = new THREE.Vector3(0, 15, 25)
    const targetPos = this.guardian.position.clone().add(offset)
    this.camera.position.lerp(targetPos, 0.1)
    this.camera.lookAt(this.guardian.position)
  }

  public start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop()
  }

  private loop(): void {
    if (!this.running) return

    requestAnimationFrame(() => this.loop())

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    this.update(deltaTime)
    this.render()
  }

  private update(dt: number): void {
    const terrainHeight = this.world.getHeightAt(
      this.guardian.position.x,
      this.guardian.position.z
    )
    this.guardian.update(dt, terrainHeight)
    this.updateCamera()
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  public getWorld(): World {
    return this.world
  }

  public getGuardian(): Guardian {
    return this.guardian
  }
}
```

**Step 3: Run dev server to verify**

Run: `npm run dev`
Expected: Purple Guardian model floating above terrain center, wings animating

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Guardian entity with animated model"
```

---

### Task 5: Add input system for WASD + mouse wheel controls

**Files:**
- Create: `src/systems/InputSystem.ts`
- Modify: `src/game/Game.ts`

**Step 1: Create src/systems/InputSystem.ts**

```typescript
import * as THREE from 'three'

export class InputSystem {
  private keys: Set<string> = new Set()
  private wheelDelta = 0

  constructor() {
    window.addEventListener('keydown', this.onKeyDown.bind(this))
    window.addEventListener('keyup', this.onKeyUp.bind(this))
    window.addEventListener('wheel', this.onWheel.bind(this))
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
```

**Step 2: Modify src/game/Game.ts to use InputSystem**

```typescript
import * as THREE from 'three'
import { World } from './World'
import { Guardian } from '../entities/Guardian'
import { InputSystem } from '../systems/InputSystem'

export class Game {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private world: World
  private guardian: Guardian
  private input: InputSystem

  private lastTime = 0
  private running = false

  constructor() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    document.body.appendChild(this.renderer.domElement)

    // Lighting
    this.setupLighting()

    // World with terrain
    this.world = new World(this.scene)

    // Guardian (player)
    const startPos = new THREE.Vector3(0, 20, 0)
    this.guardian = new Guardian(this.scene, startPos)

    // Input
    this.input = new InputSystem()

    // Position camera behind guardian
    this.updateCamera()

    // Events
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100
    this.scene.add(directionalLight)
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private updateCamera(): void {
    // Third-person camera behind and above guardian
    const offset = new THREE.Vector3(0, 15, 25)
    const targetPos = this.guardian.position.clone().add(offset)
    this.camera.position.lerp(targetPos, 0.1)
    this.camera.lookAt(this.guardian.position)
  }

  public start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop()
  }

  private loop(): void {
    if (!this.running) return

    requestAnimationFrame(() => this.loop())

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    this.update(deltaTime)
    this.render()
  }

  private update(dt: number): void {
    // Handle input
    const moveDir = this.input.getMovementDirection()
    this.guardian.moveDirection(moveDir)

    const heightDelta = this.input.getHeightDelta()
    if (heightDelta !== 0) {
      this.guardian.changeHeight(heightDelta)
    }

    // Update guardian
    const terrainHeight = this.world.getHeightAt(
      this.guardian.position.x,
      this.guardian.position.z
    )
    this.guardian.update(dt, terrainHeight)

    // Clamp to world bounds
    const halfSize = this.world.getSize() / 2 - 5
    this.guardian.position.x = THREE.MathUtils.clamp(
      this.guardian.position.x,
      -halfSize,
      halfSize
    )
    this.guardian.position.z = THREE.MathUtils.clamp(
      this.guardian.position.z,
      -halfSize,
      halfSize
    )

    this.updateCamera()
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  public getWorld(): World {
    return this.world
  }

  public getGuardian(): Guardian {
    return this.guardian
  }
}
```

**Step 3: Run dev server to verify**

Run: `npm run dev`
Expected: WASD moves Guardian, mouse wheel changes altitude, camera follows

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add InputSystem with WASD movement and mouse wheel height control"
```

---

## Phase 3: Enemies & Combat

### Task 6: Create Marine enemy entity

**Files:**
- Create: `src/entities/Marine.ts`
- Create: `src/entities/Enemy.ts` (base class)

**Step 1: Create src/entities/Enemy.ts**

```typescript
import * as THREE from 'three'

export abstract class Enemy {
  public mesh: THREE.Group
  public position: THREE.Vector3
  public velocity: THREE.Vector3 = new THREE.Vector3()

  public health: number
  public maxHealth: number
  public speed: number
  public damage: number
  public attackRange: number
  public attackCooldown: number
  protected lastAttackTime = 0

  public isDead = false

  constructor(
    scene: THREE.Scene,
    startPosition: THREE.Vector3,
    config: {
      health: number
      speed: number
      damage: number
      attackRange: number
      attackCooldown: number
    }
  ) {
    this.position = startPosition.clone()
    this.health = config.health
    this.maxHealth = config.health
    this.speed = config.speed
    this.damage = config.damage
    this.attackRange = config.attackRange
    this.attackCooldown = config.attackCooldown

    this.mesh = this.createMesh()
    this.mesh.position.copy(this.position)
    scene.add(this.mesh)
  }

  protected abstract createMesh(): THREE.Group

  public update(dt: number, targetPosition: THREE.Vector3, terrainHeight: number): void {
    if (this.isDead) return

    // Move toward target
    const direction = targetPosition.clone().sub(this.position)
    direction.y = 0
    const distance = direction.length()

    if (distance > this.attackRange) {
      direction.normalize()
      this.velocity.copy(direction.multiplyScalar(this.speed))
    } else {
      this.velocity.set(0, 0, 0)
    }

    this.position.add(this.velocity.clone().multiplyScalar(dt))
    this.position.y = terrainHeight

    this.mesh.position.copy(this.position)

    // Face target
    if (distance > 0.1) {
      const angle = Math.atan2(
        targetPosition.x - this.position.x,
        targetPosition.z - this.position.z
      )
      this.mesh.rotation.y = angle
    }
  }

  public canAttack(currentTime: number): boolean {
    return currentTime - this.lastAttackTime >= this.attackCooldown
  }

  public attack(currentTime: number): number {
    this.lastAttackTime = currentTime
    return this.damage
  }

  public takeDamage(amount: number): void {
    this.health -= amount
    if (this.health <= 0) {
      this.health = 0
      this.isDead = true
    }
  }

  public getDistanceTo(target: THREE.Vector3): number {
    return this.position.distanceTo(target)
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh)
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
  }
}
```

**Step 2: Create src/entities/Marine.ts**

```typescript
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
```

**Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Enemy base class and Marine entity"
```

---

### Task 7: Add enemy spawning and basic AI

**Files:**
- Create: `src/game/WaveManager.ts`
- Modify: `src/game/Game.ts`

**Step 1: Create src/game/WaveManager.ts**

```typescript
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
```

**Step 2: Modify src/game/Game.ts to integrate WaveManager**

```typescript
import * as THREE from 'three'
import { World } from './World'
import { Guardian } from '../entities/Guardian'
import { InputSystem } from '../systems/InputSystem'
import { WaveManager } from './WaveManager'

export class Game {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private world: World
  private guardian: Guardian
  private input: InputSystem
  private waveManager: WaveManager

  private lastTime = 0
  private gameTime = 0
  private running = false

  public kills = 0
  public gameOver = false

  constructor() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    document.body.appendChild(this.renderer.domElement)

    // Lighting
    this.setupLighting()

    // World with terrain
    this.world = new World(this.scene)

    // Guardian (player)
    const startPos = new THREE.Vector3(0, 20, 0)
    this.guardian = new Guardian(this.scene, startPos)

    // Input
    this.input = new InputSystem()

    // Wave manager
    this.waveManager = new WaveManager(this.scene, this.world)

    // Position camera behind guardian
    this.updateCamera()

    // Events
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100
    this.scene.add(directionalLight)
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private updateCamera(): void {
    const offset = new THREE.Vector3(0, 15, 25)
    const targetPos = this.guardian.position.clone().add(offset)
    this.camera.position.lerp(targetPos, 0.1)
    this.camera.lookAt(this.guardian.position)
  }

  public start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop()
  }

  private loop(): void {
    if (!this.running) return

    requestAnimationFrame(() => this.loop())

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime
    this.gameTime += deltaTime

    this.update(deltaTime)
    this.render()
  }

  private update(dt: number): void {
    if (this.gameOver) return

    // Handle input
    const moveDir = this.input.getMovementDirection()
    this.guardian.moveDirection(moveDir)

    const heightDelta = this.input.getHeightDelta()
    if (heightDelta !== 0) {
      this.guardian.changeHeight(heightDelta)
    }

    // Update guardian
    const terrainHeight = this.world.getHeightAt(
      this.guardian.position.x,
      this.guardian.position.z
    )
    this.guardian.update(dt, terrainHeight)

    // Clamp to world bounds
    const halfSize = this.world.getSize() / 2 - 5
    this.guardian.position.x = THREE.MathUtils.clamp(
      this.guardian.position.x,
      -halfSize,
      halfSize
    )
    this.guardian.position.z = THREE.MathUtils.clamp(
      this.guardian.position.z,
      -halfSize,
      halfSize
    )

    // Update wave manager
    const waveResult = this.waveManager.update(
      dt,
      this.guardian.position,
      this.gameTime
    )

    // Apply damage to guardian
    if (waveResult.damageToPlayer > 0) {
      this.guardian.takeDamage(waveResult.damageToPlayer * dt)
    }

    this.kills += waveResult.enemiesKilled

    // Check game over
    if (this.guardian.isDead()) {
      this.gameOver = true
      console.log(`Game Over! Wave: ${this.waveManager.currentWave}, Kills: ${this.kills}`)
    }

    this.updateCamera()
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  public getWorld(): World {
    return this.world
  }

  public getGuardian(): Guardian {
    return this.guardian
  }

  public getWaveManager(): WaveManager {
    return this.waveManager
  }
}
```

**Step 3: Run dev server to verify**

Run: `npm run dev`
Expected: After 3 seconds, marines spawn and move toward Guardian

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add WaveManager with enemy spawning and basic AI"
```

---

### Task 8: Add combat system with Guardian attacks

**Files:**
- Create: `src/systems/CombatSystem.ts`
- Create: `src/entities/Projectile.ts`
- Modify: `src/game/Game.ts`

**Step 1: Create src/entities/Projectile.ts**

```typescript
import * as THREE from 'three'

export class Projectile {
  public mesh: THREE.Mesh
  public position: THREE.Vector3
  public velocity: THREE.Vector3
  public damage: number
  public isExpired = false
  public isAoE: boolean
  public aoERadius: number

  private lifetime = 3
  private age = 0

  constructor(
    scene: THREE.Scene,
    startPosition: THREE.Vector3,
    direction: THREE.Vector3,
    config: {
      speed: number
      damage: number
      isAoE?: boolean
      aoERadius?: number
    }
  ) {
    this.position = startPosition.clone()
    this.velocity = direction.normalize().multiplyScalar(config.speed)
    this.damage = config.damage
    this.isAoE = config.isAoE ?? true
    this.aoERadius = config.aoERadius ?? 5

    // Green acid projectile
    const geometry = new THREE.SphereGeometry(0.5, 8, 8)
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(this.position)
    scene.add(this.mesh)
  }

  public update(dt: number): void {
    this.position.add(this.velocity.clone().multiplyScalar(dt))
    this.mesh.position.copy(this.position)

    this.age += dt
    if (this.age >= this.lifetime) {
      this.isExpired = true
    }
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh)
    this.mesh.geometry.dispose()
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose()
    }
  }
}
```

**Step 2: Create src/systems/CombatSystem.ts**

```typescript
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

    // TODO: Add explosion visual effect
  }

  public getProjectiles(): Projectile[] {
    return this.projectiles
  }
}
```

**Step 3: Modify src/game/Game.ts to use CombatSystem**

Add import and integrate:

```typescript
import * as THREE from 'three'
import { World } from './World'
import { Guardian } from '../entities/Guardian'
import { InputSystem } from '../systems/InputSystem'
import { WaveManager } from './WaveManager'
import { CombatSystem } from '../systems/CombatSystem'

export class Game {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private world: World
  private guardian: Guardian
  private input: InputSystem
  private waveManager: WaveManager
  private combatSystem: CombatSystem

  private lastTime = 0
  private gameTime = 0
  private running = false

  public kills = 0
  public gameOver = false

  constructor() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    document.body.appendChild(this.renderer.domElement)

    // Lighting
    this.setupLighting()

    // World with terrain
    this.world = new World(this.scene)

    // Guardian (player)
    const startPos = new THREE.Vector3(0, 20, 0)
    this.guardian = new Guardian(this.scene, startPos)

    // Input
    this.input = new InputSystem()

    // Wave manager
    this.waveManager = new WaveManager(this.scene, this.world)

    // Combat system
    this.combatSystem = new CombatSystem(this.scene, this.world)

    // Click to target
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this))

    // Position camera behind guardian
    this.updateCamera()

    // Events
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100
    this.scene.add(directionalLight)
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private onClick(event: MouseEvent): void {
    // Raycast to find clicked enemy
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, this.camera)

    const enemies = this.waveManager.getEnemies()
    for (const enemy of enemies) {
      const intersects = raycaster.intersectObject(enemy.mesh, true)
      if (intersects.length > 0) {
        this.combatSystem.setTarget(enemy)
        return
      }
    }

    // Click on empty space clears target
    this.combatSystem.setTarget(null)
  }

  private updateCamera(): void {
    const offset = new THREE.Vector3(0, 15, 25)
    const targetPos = this.guardian.position.clone().add(offset)
    this.camera.position.lerp(targetPos, 0.1)
    this.camera.lookAt(this.guardian.position)
  }

  public start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop()
  }

  private loop(): void {
    if (!this.running) return

    requestAnimationFrame(() => this.loop())

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime
    this.gameTime += deltaTime

    this.update(deltaTime)
    this.render()
  }

  private update(dt: number): void {
    if (this.gameOver) return

    // Handle input
    const moveDir = this.input.getMovementDirection()
    this.guardian.moveDirection(moveDir)

    const heightDelta = this.input.getHeightDelta()
    if (heightDelta !== 0) {
      this.guardian.changeHeight(heightDelta)
    }

    // Update guardian
    const terrainHeight = this.world.getHeightAt(
      this.guardian.position.x,
      this.guardian.position.z
    )
    this.guardian.update(dt, terrainHeight)

    // Clamp to world bounds
    const halfSize = this.world.getSize() / 2 - 5
    this.guardian.position.x = THREE.MathUtils.clamp(
      this.guardian.position.x,
      -halfSize,
      halfSize
    )
    this.guardian.position.z = THREE.MathUtils.clamp(
      this.guardian.position.z,
      -halfSize,
      halfSize
    )

    // Update wave manager
    const waveResult = this.waveManager.update(
      dt,
      this.guardian.position,
      this.gameTime
    )

    // Apply damage to guardian
    if (waveResult.damageToPlayer > 0) {
      this.guardian.takeDamage(waveResult.damageToPlayer * dt)
    }

    this.kills += waveResult.enemiesKilled

    // Update combat system
    this.combatSystem.update(
      dt,
      this.gameTime,
      this.guardian,
      this.waveManager.getEnemies()
    )

    // Check game over
    if (this.guardian.isDead()) {
      this.gameOver = true
      console.log(`Game Over! Wave: ${this.waveManager.currentWave}, Kills: ${this.kills}`)
    }

    this.updateCamera()
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  public getWorld(): World {
    return this.world
  }

  public getGuardian(): Guardian {
    return this.guardian
  }

  public getWaveManager(): WaveManager {
    return this.waveManager
  }
}
```

**Step 4: Run dev server to verify**

Run: `npm run dev`
Expected: Guardian auto-attacks nearest marine with green projectiles, click to focus target

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add CombatSystem with auto-attack, projectiles and target selection"
```

---

## Phase 4: UI & Polish

### Task 9: Add HUD (health, wave, kills)

**Files:**
- Create: `src/ui/HUD.ts`
- Modify: `src/game/Game.ts`
- Modify: `index.html`

**Step 1: Modify index.html to add HUD container**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CrazyZerg</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #000; font-family: 'Segoe UI', sans-serif; }
    canvas { display: block; }

    #hud {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 20px;
      pointer-events: none;
      z-index: 100;
    }

    .hud-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .hud-section {
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #4a0e4e;
      border-radius: 8px;
      padding: 12px 20px;
      color: white;
    }

    .health-bar {
      width: 250px;
    }

    .health-bar-inner {
      height: 20px;
      background: #333;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 5px;
    }

    .health-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff0000, #ff4444);
      transition: width 0.2s;
    }

    .health-text {
      font-size: 14px;
      color: #ccc;
    }

    .stat-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #fff;
    }

    .wave-info {
      text-align: center;
    }

    .kills-info {
      text-align: right;
    }

    #game-over {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 200;
    }

    .game-over-content {
      text-align: center;
      color: white;
    }

    .game-over-content h1 {
      font-size: 48px;
      color: #ff4444;
      margin-bottom: 20px;
    }

    .game-over-content p {
      font-size: 24px;
      margin: 10px 0;
    }

    .restart-btn {
      margin-top: 30px;
      padding: 15px 40px;
      font-size: 20px;
      background: #4a0e4e;
      border: none;
      color: white;
      border-radius: 8px;
      cursor: pointer;
      pointer-events: auto;
    }

    .restart-btn:hover {
      background: #6a2e6e;
    }
  </style>
</head>
<body>
  <div id="hud">
    <div class="hud-bar">
      <div class="hud-section health-bar">
        <div class="stat-label">Health</div>
        <div class="health-bar-inner">
          <div class="health-bar-fill" id="health-fill"></div>
        </div>
        <div class="health-text" id="health-text">500 / 500</div>
      </div>

      <div class="hud-section wave-info">
        <div class="stat-label">Wave</div>
        <div class="stat-value" id="wave-number">0</div>
      </div>

      <div class="hud-section kills-info">
        <div class="stat-label">Kills</div>
        <div class="stat-value" id="kills-count">0</div>
      </div>
    </div>
  </div>

  <div id="game-over">
    <div class="game-over-content">
      <h1>GAME OVER</h1>
      <p>Wave: <span id="final-wave">0</span></p>
      <p>Kills: <span id="final-kills">0</span></p>
      <p>Time: <span id="final-time">0:00</span></p>
      <button class="restart-btn" onclick="location.reload()">Play Again</button>
    </div>
  </div>

  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 2: Create src/ui/HUD.ts**

```typescript
export class HUD {
  private healthFill: HTMLElement
  private healthText: HTMLElement
  private waveNumber: HTMLElement
  private killsCount: HTMLElement
  private gameOverScreen: HTMLElement
  private finalWave: HTMLElement
  private finalKills: HTMLElement
  private finalTime: HTMLElement

  constructor() {
    this.healthFill = document.getElementById('health-fill')!
    this.healthText = document.getElementById('health-text')!
    this.waveNumber = document.getElementById('wave-number')!
    this.killsCount = document.getElementById('kills-count')!
    this.gameOverScreen = document.getElementById('game-over')!
    this.finalWave = document.getElementById('final-wave')!
    this.finalKills = document.getElementById('final-kills')!
    this.finalTime = document.getElementById('final-time')!
  }

  public updateHealth(current: number, max: number): void {
    const percent = (current / max) * 100
    this.healthFill.style.width = `${percent}%`
    this.healthText.textContent = `${Math.floor(current)} / ${max}`

    // Change color based on health
    if (percent < 25) {
      this.healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff2222)'
    } else if (percent < 50) {
      this.healthFill.style.background = 'linear-gradient(90deg, #ff4400, #ff6644)'
    } else {
      this.healthFill.style.background = 'linear-gradient(90deg, #00aa00, #22cc22)'
    }
  }

  public updateWave(wave: number): void {
    this.waveNumber.textContent = wave.toString()
  }

  public updateKills(kills: number): void {
    this.killsCount.textContent = kills.toString()
  }

  public showGameOver(wave: number, kills: number, timeSeconds: number): void {
    this.gameOverScreen.style.display = 'flex'
    this.finalWave.textContent = wave.toString()
    this.finalKills.textContent = kills.toString()

    const minutes = Math.floor(timeSeconds / 60)
    const seconds = Math.floor(timeSeconds % 60)
    this.finalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}
```

**Step 3: Modify src/game/Game.ts to update HUD**

Add HUD import and updates:

```typescript
import * as THREE from 'three'
import { World } from './World'
import { Guardian } from '../entities/Guardian'
import { InputSystem } from '../systems/InputSystem'
import { WaveManager } from './WaveManager'
import { CombatSystem } from '../systems/CombatSystem'
import { HUD } from '../ui/HUD'

export class Game {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private world: World
  private guardian: Guardian
  private input: InputSystem
  private waveManager: WaveManager
  private combatSystem: CombatSystem
  private hud: HUD

  private lastTime = 0
  private gameTime = 0
  private running = false

  public kills = 0
  public gameOver = false

  constructor() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    document.body.appendChild(this.renderer.domElement)

    // Lighting
    this.setupLighting()

    // World with terrain
    this.world = new World(this.scene)

    // Guardian (player)
    const startPos = new THREE.Vector3(0, 20, 0)
    this.guardian = new Guardian(this.scene, startPos)

    // Input
    this.input = new InputSystem()

    // Wave manager
    this.waveManager = new WaveManager(this.scene, this.world)

    // Combat system
    this.combatSystem = new CombatSystem(this.scene, this.world)

    // HUD
    this.hud = new HUD()

    // Click to target
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this))

    // Position camera behind guardian
    this.updateCamera()

    // Events
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100
    this.scene.add(directionalLight)
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private onClick(event: MouseEvent): void {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, this.camera)

    const enemies = this.waveManager.getEnemies()
    for (const enemy of enemies) {
      const intersects = raycaster.intersectObject(enemy.mesh, true)
      if (intersects.length > 0) {
        this.combatSystem.setTarget(enemy)
        return
      }
    }

    this.combatSystem.setTarget(null)
  }

  private updateCamera(): void {
    const offset = new THREE.Vector3(0, 15, 25)
    const targetPos = this.guardian.position.clone().add(offset)
    this.camera.position.lerp(targetPos, 0.1)
    this.camera.lookAt(this.guardian.position)
  }

  public start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop()
  }

  private loop(): void {
    if (!this.running) return

    requestAnimationFrame(() => this.loop())

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime
    this.gameTime += deltaTime

    this.update(deltaTime)
    this.render()
  }

  private update(dt: number): void {
    if (this.gameOver) return

    // Handle input
    const moveDir = this.input.getMovementDirection()
    this.guardian.moveDirection(moveDir)

    const heightDelta = this.input.getHeightDelta()
    if (heightDelta !== 0) {
      this.guardian.changeHeight(heightDelta)
    }

    // Update guardian
    const terrainHeight = this.world.getHeightAt(
      this.guardian.position.x,
      this.guardian.position.z
    )
    this.guardian.update(dt, terrainHeight)

    // Clamp to world bounds
    const halfSize = this.world.getSize() / 2 - 5
    this.guardian.position.x = THREE.MathUtils.clamp(
      this.guardian.position.x,
      -halfSize,
      halfSize
    )
    this.guardian.position.z = THREE.MathUtils.clamp(
      this.guardian.position.z,
      -halfSize,
      halfSize
    )

    // Update wave manager
    const waveResult = this.waveManager.update(
      dt,
      this.guardian.position,
      this.gameTime
    )

    // Apply damage to guardian
    if (waveResult.damageToPlayer > 0) {
      this.guardian.takeDamage(waveResult.damageToPlayer * dt)
    }

    this.kills += waveResult.enemiesKilled

    // Update combat system
    this.combatSystem.update(
      dt,
      this.gameTime,
      this.guardian,
      this.waveManager.getEnemies()
    )

    // Update HUD
    this.hud.updateHealth(this.guardian.health, this.guardian.maxHealth)
    this.hud.updateWave(this.waveManager.currentWave)
    this.hud.updateKills(this.kills)

    // Check game over
    if (this.guardian.isDead()) {
      this.gameOver = true
      this.hud.showGameOver(
        this.waveManager.currentWave,
        this.kills,
        this.gameTime
      )
    }

    this.updateCamera()
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  public getWorld(): World {
    return this.world
  }

  public getGuardian(): Guardian {
    return this.guardian
  }

  public getWaveManager(): WaveManager {
    return this.waveManager
  }
}
```

**Step 4: Run dev server to verify**

Run: `npm run dev`
Expected: HUD shows health bar, wave number, kill count. Game over screen on death.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add HUD with health bar, wave counter, kills and game over screen"
```

---

## Phase 5: Roguelite Upgrades

### Task 10: Add upgrade system between waves

**Files:**
- Create: `src/systems/UpgradeSystem.ts`
- Create: `src/ui/UpgradeMenu.ts`
- Modify: `src/game/Game.ts`
- Modify: `index.html`

This task is larger and follows the same pattern - create the upgrade definitions, UI menu, and integrate with the game loop to pause between waves and show upgrade choices.

---

## Phase 6: Elite Enemies

### Task 11: Add Medic, Firebat, and Ghost enemies

**Files:**
- Create: `src/entities/Medic.ts`
- Create: `src/entities/Firebat.ts`
- Create: `src/entities/Ghost.ts`
- Modify: `src/game/WaveManager.ts`

Each enemy follows the same pattern as Marine but with unique behaviors.

---

## Summary

This plan covers the core MVP with:
- Three.js scene with procedural terrain
- Guardian player with WASD + mouse wheel controls
- Third-person camera
- Marines with basic AI
- Combat system with auto-attack and target selection
- High ground damage bonus
- Wave-based spawning
- HUD with health, wave, kills
- Game over screen

Extended features (Tasks 10-11) add roguelite upgrades and elite enemies.
