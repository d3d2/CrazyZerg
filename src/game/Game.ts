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
    const terrainHeight = this.world.getHeightAt(
      this.guardian.position.x,
      this.guardian.position.z
    )
    this.guardian.update(dt, terrainHeight)
    this.updateCamera()
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
}
