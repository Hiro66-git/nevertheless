import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import type { SceneObject, Tool } from '../../types'

export type RuntimeTransform = {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

export type SceneRuntimeCallbacks = {
  onSelect: (id: string) => void
  onTransformCommit: (id: string, transform: RuntimeTransform) => void
}

type RuntimeEntity = {
  object3D: THREE.Object3D
  signature: string
  resourceKey: string
  source: SceneObject
}

const transformModeForTool = (tool: Tool): 'translate' | 'rotate' | 'scale' | null => {
  if (tool === 'move') return 'translate'
  if (tool === 'rotate') return 'rotate'
  if (tool === 'scale') return 'scale'
  return null
}

const resourceKeyFor = (object: SceneObject) => `${object.kind}:${object.shape ?? 'none'}`
const signatureFor = (object: SceneObject) => JSON.stringify(object)

export class SceneRuntime {
  private readonly host: HTMLElement
  private readonly callbacks: SceneRuntimeCallbacks
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly renderer: THREE.WebGLRenderer
  private readonly orbitControls: OrbitControls
  private readonly transformControls: TransformControls
  private readonly transformHelper: THREE.Object3D
  private readonly stage = new THREE.Group()
  private readonly grid: THREE.GridHelper
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly registry = new Map<string, RuntimeEntity>()
  private readonly resizeObserver: ResizeObserver
  private frameRequest = 0
  private selectedId: string | null = null
  private selectionHelper: THREE.BoxHelper | null = null
  private disposed = false

  constructor(host: HTMLElement, callbacks: SceneRuntimeCallbacks) {
    this.host = host
    this.callbacks = callbacks
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#0d1115')
    this.scene.fog = new THREE.Fog('#0d1115', 11, 24)

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    this.camera.position.set(5.6, 3.3, 6.8)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.12
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    host.appendChild(this.renderer.domElement)

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
    this.orbitControls.enableDamping = true
    this.orbitControls.dampingFactor = 0.08
    this.orbitControls.target.set(0, 0.35, 0)
    this.orbitControls.minDistance = 3.5
    this.orbitControls.maxDistance = 14
    this.orbitControls.enablePan = true

    this.transformControls = new TransformControls(this.camera, this.renderer.domElement)
    this.transformControls.setSize(0.82)
    this.transformHelper = this.transformControls.getHelper()
    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.orbitControls.enabled = !event.value
      if (event.value || !this.transformControls.object) return
      const id = this.transformControls.object.userData.objectId as string | undefined
      if (id) this.callbacks.onTransformCommit(id, this.readTransform(this.transformControls.object))
    })

    this.addLighting()
    this.grid = new THREE.GridHelper(12, 24, '#2a3f44', '#17262c')
    this.grid.position.y = -0.88
    this.grid.material.transparent = true
    ;(this.grid.material as THREE.Material).opacity = 0.42
    this.scene.add(this.grid)
    this.scene.add(this.stage)
    this.scene.add(this.transformHelper)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(host)
    this.resize()
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown)

    this.frameRequest = window.requestAnimationFrame(this.render)
  }

  syncObjects(objects: SceneObject[]) {
    if (this.disposed) return
    const incomingIds = new Set<string>()
    for (const object of objects) {
      incomingIds.add(object.id)
      const nextSignature = signatureFor(object)
      const nextResourceKey = resourceKeyFor(object)
      const existing = this.registry.get(object.id)
      if (!existing) {
        this.registry.set(object.id, this.createEntity(object, nextSignature, nextResourceKey))
        continue
      }
      if (existing.resourceKey !== nextResourceKey) {
        this.replaceEntity(object.id, object, nextSignature, nextResourceKey)
        continue
      }
      if (existing.signature !== nextSignature) {
        existing.source = object
        existing.signature = nextSignature
        this.updateVisual(existing.object3D, object)
      }
    }

    for (const [id, entity] of this.registry) {
      if (!incomingIds.has(id)) this.removeEntity(id, entity)
    }

    this.syncHierarchy(objects)
    this.syncSelection()
  }

  setSelection(id: string | null) {
    if (this.selectedId === id) return
    this.selectedId = id
    this.syncSelection()
  }

  setGridVisible(visible: boolean) {
    this.grid.visible = visible
  }

  setTransformTool(tool: Tool) {
    const mode = transformModeForTool(tool)
    const selected = this.selectedId ? this.registry.get(this.selectedId) : undefined
    if (!mode || !selected || !selected.object3D.visible || selected.source.locked || selected.object3D.userData.effectiveLocked) {
      this.transformControls.detach()
      this.renderer.domElement.style.cursor = tool === 'hand' ? 'grab' : tool === 'select' ? 'default' : 'crosshair'
      return
    }
    this.transformControls.setMode(mode)
    this.transformControls.attach(selected.object3D)
    this.renderer.domElement.style.cursor = 'crosshair'
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.resizeObserver.disconnect()
    window.cancelAnimationFrame(this.frameRequest)
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown)
    this.transformControls.detach()
    this.transformControls.dispose()
    this.orbitControls.dispose()
    this.clearSelectionHelper()
    for (const [id, entity] of this.registry) this.removeEntity(id, entity)
    this.registry.clear()
    this.grid.geometry.dispose()
    this.disposeMaterial(this.grid.material)
    this.renderer.dispose()
    if (this.renderer.domElement.parentElement === this.host) this.host.removeChild(this.renderer.domElement)
  }

  private readonly handlePointerDown = (event: PointerEvent) => {
    if (this.disposed) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const pickable = Array.from(this.registry.values())
      .filter((entity) => entity.object3D.visible)
      .map((entity) => entity.object3D)
    const hit = this.raycaster.intersectObjects(pickable, true)[0]?.object
    if (!hit) return
    let current: THREE.Object3D | null = hit
    while (current && !current.userData.objectId) current = current.parent
    const id = current?.userData.objectId as string | undefined
    if (id) this.callbacks.onSelect(id)
  }

  private readonly render = () => {
    if (this.disposed) return
    this.frameRequest = window.requestAnimationFrame(this.render)
    this.selectionHelper?.update()
    this.orbitControls.update()
    this.renderer.render(this.scene, this.camera)
  }

  private addLighting() {
    this.scene.add(new THREE.HemisphereLight('#d9ecff', '#12151f', 1.45))
    const fill = new THREE.DirectionalLight('#9ea9ff', 2.2)
    fill.position.set(-4, 4, 4)
    fill.castShadow = true
    fill.shadow.mapSize.set(1024, 1024)
    this.scene.add(fill)
    const rim = new THREE.PointLight('#52e7d0', 5, 9, 2)
    rim.position.set(3, 1.5, -2)
    this.scene.add(rim)
  }

  private resize() {
    const width = this.host.clientWidth || 800
    const height = this.host.clientHeight || 600
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  private createEntity(object: SceneObject, signature: string, resourceKey: string): RuntimeEntity {
    const object3D = this.createVisual(object)
    object3D.name = object.name
    object3D.userData.objectId = object.id
    this.stage.add(object3D)
    return { object3D, signature, resourceKey, source: object }
  }

  private createVisual(object: SceneObject): THREE.Object3D {
    if (object.kind === 'light') {
      const light = new THREE.PointLight(object.color, 3.2, 5, 2)
      light.castShadow = true
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshBasicMaterial({ color: object.color }))
      light.add(bulb)
      this.applyTransform(light, object)
      return light
    }
    if (object.kind === 'text') {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.createTextTexture(object.color), transparent: true, depthTest: false }))
      sprite.scale.set(2.6, 0.52, 1)
      this.applyTransform(sprite, object)
      return sprite
    }
    if (object.kind === 'group' || object.kind === 'camera') {
      const group = new THREE.Group()
      this.applyTransform(group, object)
      return group
    }

    const geometry = this.createGeometry(object.shape)
    const material = new THREE.MeshPhysicalMaterial({
      color: object.color,
      metalness: object.metalness,
      roughness: object.roughness,
      transparent: object.opacity < 1,
      opacity: object.opacity,
      clearcoat: object.shape === 'sphere' ? 0.6 : 0.15,
      emissive: object.shape === 'sphere' ? new THREE.Color(object.color).multiplyScalar(0.08) : '#000000',
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.applyTransform(mesh, object)
    return mesh
  }

  private createGeometry(shape: SceneObject['shape']) {
    if (shape === 'torus') return new THREE.TorusGeometry(1.15, 0.035, 16, 96)
    if (shape === 'plane') return new THREE.PlaneGeometry(2, 2)
    if (shape === 'cone') return new THREE.ConeGeometry(0.85, 1.6, 48)
    if (shape === 'box') return new THREE.BoxGeometry(1.3, 1.3, 1.3, 3, 3, 3)
    return new THREE.SphereGeometry(0.95, 64, 32)
  }

  private createTextTexture(color: string) {
    const canvas = document.createElement('canvas')
    canvas.width = 900
    canvas.height = 180
    const context = canvas.getContext('2d')!
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.font = '700 72px Inter, Arial'
    context.fillStyle = color
    context.fillText('LUMEN / 24', 12, 100)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  private applyTransform(object3D: THREE.Object3D, source: SceneObject) {
    object3D.position.set(...source.position)
    object3D.rotation.set(...source.rotation)
    object3D.scale.set(...source.scale)
    object3D.visible = source.visible
    object3D.userData.locked = source.locked
  }

  private updateVisual(object3D: THREE.Object3D, source: SceneObject) {
    object3D.name = source.name
    this.applyTransform(object3D, source)
    object3D.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Sprite) {
        const material = child.material as THREE.MeshPhysicalMaterial | THREE.SpriteMaterial
        if ('color' in material) material.color.set(source.color)
        if ('opacity' in material) material.opacity = source.opacity
        if ('transparent' in material) material.transparent = source.opacity < 1
        if (material instanceof THREE.MeshPhysicalMaterial) {
          material.metalness = source.metalness
          material.roughness = source.roughness
        }
      }
      if (child instanceof THREE.PointLight) child.color.set(source.color)
    })
  }

  private replaceEntity(id: string, source: SceneObject, signature: string, resourceKey: string) {
    const previous = this.registry.get(id)
    if (previous) this.removeEntity(id, previous)
    this.registry.set(id, this.createEntity(source, signature, resourceKey))
  }

  private removeEntity(id: string, entity: RuntimeEntity) {
    if (this.transformControls.object === entity.object3D) this.transformControls.detach()
    this.stage.remove(entity.object3D)
    this.disposeObject(entity.object3D)
    this.registry.delete(id)
    if (this.selectedId === id) this.clearSelectionHelper()
  }

  private syncHierarchy(objects: SceneObject[]) {
    const byId = new Map(objects.map((object) => [object.id, object]))
    const inheritedState = (object: SceneObject) => {
      let current: SceneObject | undefined = object
      let visible = true
      let locked = false
      const visited = new Set<string>()
      while (current && !visited.has(current.id)) {
        visited.add(current.id)
        visible = visible && current.visible
        locked = locked || current.locked
        current = current.parentId ? byId.get(current.parentId) : undefined
      }
      return { visible, locked }
    }
    for (const object of objects) {
      const entity = this.registry.get(object.id)
      if (!entity) continue
      const parent = object.parentId ? this.registry.get(object.parentId)?.object3D : undefined
      const desiredParent = parent ?? this.stage
      if (entity.object3D.parent !== desiredParent) desiredParent.add(entity.object3D)
      const state = inheritedState(object)
      entity.object3D.visible = state.visible
      entity.object3D.userData.effectiveLocked = state.locked
    }
  }

  private syncSelection() {
    this.clearSelectionHelper()
    const selected = this.selectedId ? this.registry.get(this.selectedId) : undefined
    if (selected?.object3D.visible) {
      this.selectionHelper = new THREE.BoxHelper(selected.object3D, new THREE.Color('#73ebd0'))
      this.selectionHelper.renderOrder = 3
      this.stage.add(this.selectionHelper)
    }
    this.setTransformTool('select')
  }

  private clearSelectionHelper() {
    if (!this.selectionHelper) return
    this.stage.remove(this.selectionHelper)
    this.selectionHelper.geometry.dispose()
    this.disposeMaterial(this.selectionHelper.material)
    this.selectionHelper = null
  }

  private readTransform(object3D: THREE.Object3D): RuntimeTransform {
    return {
      position: [object3D.position.x, object3D.position.y, object3D.position.z],
      rotation: [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z],
      scale: [object3D.scale.x, object3D.scale.y, object3D.scale.z],
    }
  }

  private disposeObject(object3D: THREE.Object3D) {
    object3D.traverse((child) => {
      if (!(child instanceof THREE.Mesh) && !(child instanceof THREE.Sprite)) return
      if (child.geometry) child.geometry.dispose()
      const material = child.material as THREE.Material | THREE.Material[]
      if (Array.isArray(material)) material.forEach((item) => this.disposeMaterial(item))
      else this.disposeMaterial(material)
    })
  }

  private disposeMaterial(material: THREE.Material) {
    const withMap = material as THREE.Material & { map?: THREE.Texture | null }
    withMap.map?.dispose()
    material.dispose()
  }
}
