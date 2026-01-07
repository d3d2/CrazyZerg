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
