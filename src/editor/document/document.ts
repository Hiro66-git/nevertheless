import * as THREE from 'three'
import type { SceneObject } from '../../types'
import type { EditorDocument, EditorEntity, EntityTransform, MaterialDefinition, Vec3 } from './types'
import { entityToSceneObject, isVec3 } from './types'

export const ROOT_ENTITY_ID = 'scene-root'

const now = () => new Date().toISOString()
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const materialFromObject = (object: SceneObject, id: string): MaterialDefinition => ({
  id,
  type: object.materialType ?? 'MeshPhysicalMaterial',
  color: object.color,
  accent: object.accent,
  roughness: object.roughness,
  metalness: object.metalness,
  opacity: object.opacity,
  transparent: object.opacity < 1,
  emissive: object.emissive ?? (object.shape === 'sphere' ? object.color : '#000000'),
  emissiveIntensity: object.emissiveIntensity ?? (object.shape === 'sphere' ? 0.08 : 0),
  maps: {},
})

export const entityFromSceneObject = (object: SceneObject, rootId = ROOT_ENTITY_ID): EditorEntity => ({
  id: object.id,
  name: object.name,
  type: object.kind,
  parentId: object.parentId ?? rootId,
  children: [],
  visible: object.visible,
  locked: object.locked,
  transform: {
    position: [...object.position] as Vec3,
    rotation: [...object.rotation] as Vec3,
    scale: [...object.scale] as Vec3,
  },
  components: {
    shape: object.shape,
    materialId: object.kind === 'mesh' ? object.materialId ?? `${object.id}-material` : undefined,
    materialOverride: object.kind === 'mesh' ? object.materialOverride : undefined,
    assetId: object.assetId,
    light: object.kind === 'light' ? { color: object.color, intensity: 3.2 } : undefined,
    text: object.kind === 'text' ? { value: object.name } : undefined,
  },
  metadata: {
    keyframes: [...object.keyframes],
    accent: object.accent,
    material: {
      color: object.color,
      accent: object.accent,
      roughness: object.roughness,
      metalness: object.metalness,
      opacity: object.opacity,
    },
  },
})

export const createDocumentFromObjects = (objects: SceneObject[], projectName: string): EditorDocument => {
  const timestamp = now()
  const entities: Record<string, EditorEntity> = {
    [ROOT_ENTITY_ID]: {
      id: ROOT_ENTITY_ID,
      name: 'Scene',
      type: 'empty',
      parentId: null,
      children: [],
      visible: true,
      locked: false,
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      components: {},
      metadata: {},
    },
  }
  const materials: Record<string, MaterialDefinition> = {}
  const animations: EditorDocument['animations'] = {}
  for (const object of objects) {
    const entity = entityFromSceneObject(object)
    entities[entity.id] = entity
    if (entity.components.materialId) materials[entity.components.materialId] = materialFromObject(object, entity.components.materialId)
    if (object.keyframes.length) {
      const trackId = `${object.id}:position`
      animations[trackId] = { id: trackId, entityId: object.id, property: 'position', keyframes: object.keyframes.map((time) => ({ time, value: [...object.position] as Vec3, interpolation: 'linear' })) }
    }
  }
  for (const entity of Object.values(entities)) entity.children = []
  for (const entity of Object.values(entities)) {
    if (entity.id === ROOT_ENTITY_ID) continue
    let parentId = entity.parentId && entities[entity.parentId] && entity.parentId !== entity.id ? entity.parentId : ROOT_ENTITY_ID
    const visited = new Set<string>([entity.id])
    let cursor: string | null = parentId
    while (cursor !== ROOT_ENTITY_ID && cursor) {
      if (visited.has(cursor)) { parentId = ROOT_ENTITY_ID; break }
      visited.add(cursor)
      cursor = entities[cursor]?.parentId ?? ROOT_ENTITY_ID
    }
    entity.parentId = parentId
    entities[parentId].children.push(entity.id)
  }
  return {
    version: 2,
    project: { id: `project-${Date.now()}`, name: projectName, createdAt: timestamp, updatedAt: timestamp },
    scene: { rootId: ROOT_ENTITY_ID, entities, collections: [] },
    materials,
    assets: {},
    animations,
    settings: { grid: { visible: true, size: 12, divisions: 24 }, snap: { enabled: true, step: 0.25 }, viewport: { device: 'desktop', camera: 'perspective' } },
  }
}

export const cloneDocument = (document: EditorDocument): EditorDocument => clone(document)

export const documentToSceneObjects = (document: EditorDocument): SceneObject[] => {
  const ordered: EditorEntity[] = []
  const visit = (id: string) => {
    const entity = document.scene.entities[id]
    if (!entity || id === document.scene.rootId) return
    ordered.push(entity)
    for (const childId of entity.children) visit(childId)
  }
  for (const childId of document.scene.entities[document.scene.rootId]?.children ?? []) visit(childId)
  for (const entity of Object.values(document.scene.entities)) {
    if (entity.id !== document.scene.rootId && !ordered.some((item) => item.id === entity.id)) ordered.push(entity)
  }
  return ordered.map((entity) => entityToSceneObject(document, entity))
}

export const getEntity = (document: EditorDocument, id: string) => document.scene.entities[id]

export const addEntity = (document: EditorDocument, entity: EditorEntity) => {
  if (document.scene.entities[entity.id]) throw new Error(`Entity ${entity.id} already exists`)
  const parentId = entity.parentId && document.scene.entities[entity.parentId] ? entity.parentId : document.scene.rootId
  entity.parentId = parentId
  entity.children = [...entity.children]
  document.scene.entities[entity.id] = entity
  document.scene.entities[parentId].children.push(entity.id)
  const materialId = entity.components.materialId
  const materialSnapshot = entity.metadata.material as Partial<MaterialDefinition> | undefined
  if (materialId && !document.materials[materialId]) {
    document.materials[materialId] = {
      id: materialId,
      type: 'MeshPhysicalMaterial',
      color: materialSnapshot?.color ?? '#91a0ff',
      accent: materialSnapshot?.accent ?? '#bec8ff',
      roughness: materialSnapshot?.roughness ?? 0.28,
      metalness: materialSnapshot?.metalness ?? 0.3,
      opacity: materialSnapshot?.opacity ?? 1,
      transparent: (materialSnapshot?.opacity ?? 1) < 1,
      emissive: '#000000',
      emissiveIntensity: 0,
      maps: {},
    }
  }
  document.project.updatedAt = now()
}

export const removeEntitySubtree = (document: EditorDocument, id: string): EditorEntity[] => {
  if (id === document.scene.rootId) throw new Error('The scene root cannot be deleted')
  const entity = getEntity(document, id)
  if (!entity) return []
  const removed: EditorEntity[] = []
  const visit = (currentId: string) => {
    const current = document.scene.entities[currentId]
    if (!current) return
    for (const childId of [...current.children]) visit(childId)
    removed.push(clone(current))
  }
  visit(id)
  const parent = entity.parentId ? document.scene.entities[entity.parentId] : undefined
  if (parent) parent.children = parent.children.filter((childId) => childId !== id)
  for (const item of removed) delete document.scene.entities[item.id]
  document.project.updatedAt = now()
  return removed
}

export const restoreEntities = (document: EditorDocument, entities: EditorEntity[]) => {
  const ordered = [...entities].sort((a, b) => (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0))
  for (const entity of ordered) {
    if (document.scene.entities[entity.id]) continue
    document.scene.entities[entity.id] = clone(entity)
  }
  for (const entity of ordered) {
    const parentId = entity.parentId && document.scene.entities[entity.parentId] ? entity.parentId : document.scene.rootId
    const parent = document.scene.entities[parentId]
    if (!parent.children.includes(entity.id)) parent.children.push(entity.id)
  }
  document.project.updatedAt = now()
}

export const wouldCreateCycle = (document: EditorDocument, id: string, nextParentId: string | null) => {
  if (!nextParentId || nextParentId === document.scene.rootId) return false
  if (id === nextParentId) return true
  let current: string | null = nextParentId
  while (current) {
    if (current === id) return true
    current = document.scene.entities[current]?.parentId ?? null
  }
  return false
}

const matrixForTransform = (transform: EntityTransform) => {
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3(...transform.position)
  const rotation = new THREE.Euler(...transform.rotation, 'XYZ')
  const quaternion = new THREE.Quaternion().setFromEuler(rotation)
  const scale = new THREE.Vector3(...transform.scale)
  return matrix.compose(position, quaternion, scale)
}

export const getWorldMatrix = (document: EditorDocument, id: string): THREE.Matrix4 => {
  const entity = getEntity(document, id)
  if (!entity || !entity.parentId) return entity ? matrixForTransform(entity.transform) : new THREE.Matrix4()
  return getWorldMatrix(document, entity.parentId).multiply(matrixForTransform(entity.transform))
}

const transformFromMatrix = (matrix: THREE.Matrix4): EntityTransform => {
  const position = new THREE.Vector3()
  const quaternion = new THREE.Quaternion()
  const scale = new THREE.Vector3()
  matrix.decompose(position, quaternion, scale)
  const rotation = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ')
  return {
    position: [position.x, position.y, position.z],
    rotation: [rotation.x, rotation.y, rotation.z],
    scale: [scale.x, scale.y, scale.z],
  }
}

export const setEntityParent = (document: EditorDocument, id: string, nextParentId: string | null, preserveWorld = true) => {
  const entity = getEntity(document, id)
  if (!entity || id === document.scene.rootId) throw new Error('Cannot parent missing or root entity')
  const parentId = nextParentId ?? document.scene.rootId
  if (!document.scene.entities[parentId]) throw new Error('Parent entity does not exist')
  if (wouldCreateCycle(document, id, parentId)) throw new Error('Parenting would create a cycle')
  const worldBefore = preserveWorld ? getWorldMatrix(document, id) : null
  if (entity.parentId && document.scene.entities[entity.parentId]) {
    document.scene.entities[entity.parentId].children = document.scene.entities[entity.parentId].children.filter((childId) => childId !== id)
  }
  entity.parentId = parentId
  if (!document.scene.entities[parentId].children.includes(id)) document.scene.entities[parentId].children.push(id)
  if (worldBefore) {
    const parentWorld = getWorldMatrix(document, parentId)
    entity.transform = transformFromMatrix(parentWorld.clone().invert().multiply(worldBefore))
  }
  document.project.updatedAt = now()
}

export const patchEntityFromSceneObject = (document: EditorDocument, id: string, patch: Partial<SceneObject>) => {
  const entity = getEntity(document, id)
  if (!entity) throw new Error(`Entity ${id} does not exist`)
  if (patch.name !== undefined) entity.name = patch.name
  if (patch.visible !== undefined) entity.visible = patch.visible
  if (patch.locked !== undefined) entity.locked = patch.locked
  if (patch.parentId !== undefined) setEntityParent(document, id, patch.parentId ?? null)
  const transform: EntityTransform = entity.transform
  if (patch.position) transform.position = [...patch.position] as Vec3
  if (patch.rotation) transform.rotation = [...patch.rotation] as Vec3
  if (patch.scale) transform.scale = [...patch.scale] as Vec3
  if (patch.shape !== undefined) entity.components.shape = patch.shape
  if (patch.assetId !== undefined) entity.components.assetId = patch.assetId
  if (patch.materialOverride !== undefined) entity.components.materialOverride = { ...patch.materialOverride }
  if (patch.keyframes !== undefined) entity.metadata.keyframes = [...patch.keyframes]
  const materialId = entity.components.materialId
  if (materialId && document.materials[materialId]) {
    const material = document.materials[materialId]
    const target = entity.components.materialOverride ?? material
    if (patch.color !== undefined) target.color = patch.color
    if (patch.accent !== undefined) target.accent = patch.accent
    if (patch.metalness !== undefined) target.metalness = patch.metalness
    if (patch.roughness !== undefined) target.roughness = patch.roughness
    if (patch.opacity !== undefined) { target.opacity = patch.opacity; if ('transparent' in target) target.transparent = patch.opacity < 1 }
    if (patch.emissive !== undefined) target.emissive = patch.emissive
    if (patch.emissiveIntensity !== undefined) target.emissiveIntensity = patch.emissiveIntensity
    if (entity.components.materialOverride) entity.components.materialOverride = target
  }
  document.project.updatedAt = now()
}

export const sceneObjectForEntity = (document: EditorDocument, id: string) => {
  const entity = getEntity(document, id)
  return entity && entity.id !== document.scene.rootId ? entityToSceneObject(document, entity) : undefined
}

export const validateDocument = (document: EditorDocument): EditorDocument => {
  if (document.version !== 2) throw new Error('Unsupported project version')
  const root = document.scene?.entities?.[document.scene.rootId]
  if (!root || root.parentId !== null) throw new Error('Project scene root is invalid')
  const entities = document.scene.entities
  for (const entity of Object.values(entities)) {
    if (!entity.id || entity.id !== entity.id.trim()) throw new Error('Project contains an invalid entity ID')
    if (!isVec3(entity.transform.position) || !isVec3(entity.transform.rotation) || !isVec3(entity.transform.scale)) throw new Error(`Invalid transform for ${entity.name}`)
    if (!Array.isArray(entity.children) || typeof entity.visible !== 'boolean' || typeof entity.locked !== 'boolean') throw new Error(`Invalid entity data for ${entity.name}`)
    if (entity.parentId !== null && !entities[entity.parentId]) throw new Error(`Missing parent for ${entity.name}`)
    for (const childId of entity.children) {
      if (!entities[childId] || entities[childId].parentId !== entity.id) throw new Error(`Hierarchy is inconsistent for ${entity.name}`)
    }
    if (entity.components.materialId && !document.materials[entity.components.materialId]) throw new Error(`Missing material for ${entity.name}`)
  }
  const reachable = new Set<string>()
  const visit = (id: string) => {
    if (reachable.has(id)) return
    reachable.add(id)
    for (const childId of entities[id]?.children ?? []) visit(childId)
  }
  visit(document.scene.rootId)
  for (const entity of Object.values(entities)) {
    if (!reachable.has(entity.id)) throw new Error(`Hierarchy contains orphaned entity ${entity.id}`)
    const visited = new Set<string>()
    let current: string | null = entity.id
    while (current) {
      if (visited.has(current)) throw new Error('Project hierarchy contains a cycle')
      visited.add(current)
      current = entities[current]?.parentId ?? null
    }
  }
  for (const material of Object.values(document.materials)) {
    if (!material.id || !['MeshStandardMaterial', 'MeshPhysicalMaterial'].includes(material.type) || !Number.isFinite(material.roughness) || !Number.isFinite(material.metalness) || !Number.isFinite(material.opacity) || !material.maps) throw new Error(`Invalid material ${material.id}`)
    for (const assetId of Object.values(material.maps)) if (assetId && !document.assets[assetId]) throw new Error(`Material ${material.id} references a missing asset`)
  }
  for (const asset of Object.values(document.assets)) {
    if (!asset.id || !asset.name || !['image', 'model', 'texture', 'hdr', 'unknown'].includes(asset.type) || typeof asset.source !== 'string') throw new Error(`Invalid asset ${asset.id}`)
  }
  if (!Number.isFinite(document.settings.grid.size) || !Number.isFinite(document.settings.grid.divisions) || !Number.isFinite(document.settings.snap.step)) throw new Error('Project settings are invalid')
  for (const track of Object.values(document.animations)) {
    if (!entities[track.entityId]) throw new Error(`Animation track ${track.id} references a missing entity`)
    if (!['position', 'rotation', 'scale', 'opacity'].includes(track.property)) throw new Error(`Unsupported animation property ${track.property}`)
    if (!Array.isArray(track.keyframes) || track.keyframes.some((keyframe) => !Number.isFinite(keyframe.time) || (Array.isArray(keyframe.value) ? !isVec3(keyframe.value) : !Number.isFinite(keyframe.value)))) throw new Error(`Invalid keyframes in ${track.id}`)
  }
  return document
}

export const projectFromUnknown = (payload: unknown): EditorDocument => {
  if (!payload || typeof payload !== 'object') throw new Error('Project file must contain an object')
  const candidate = payload as Partial<EditorDocument> & { projectName?: string; objects?: SceneObject[] }
  if (candidate.version === 2 && candidate.project && candidate.scene && candidate.materials && candidate.assets && candidate.animations && candidate.settings) {
    return validateDocument(clone(candidate as EditorDocument))
  }
  if (Array.isArray(candidate.objects)) return createDocumentFromObjects(candidate.objects, candidate.projectName ?? 'Imported project')
  throw new Error('Unsupported or invalid project format')
}
