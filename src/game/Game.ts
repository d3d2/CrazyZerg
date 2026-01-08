import * as THREE from 'three'
import { World } from './World'
import { Guardian } from '../entities/Guardian'
import { InputSystem } from '../systems/InputSystem'
import { WaveManager } from './WaveManager'
import { CombatSystem } from '../systems/CombatSystem'
import { HUD } from '../ui/HUD'
import { computeIsFiring } from '../systems/fireIntent'

// Balance constants
const AIM_ASSIST_RADIUS = 2

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
  private running = false
  private gameTime = 0
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

    // World
    this.world = new World(this.scene)

    // Guardian (player)
    const startPos = new THREE.Vector3(0, 20, 0)
    this.guardian = new Guardian(this.scene, startPos)

    // Input System
    this.input = new InputSystem(this.renderer.domElement)

    // Wave Manager
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
    if (this.gameOver) return

    this.gameTime += dt

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
    const isFiring = computeIsFiring({
      leftMouseDown: this.input.isLeftMouseDown(),
      gameOver: this.gameOver,
    })
    this.combatSystem.setFireIntent(isFiring)
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
    // Third-person camera behind and above guardian
    const offset = new THREE.Vector3(0, 15, 25)
    const targetPos = this.guardian.position.clone().add(offset)
    this.camera.position.lerp(targetPos, 0.1)
    this.camera.lookAt(this.guardian.position)
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
