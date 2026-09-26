import type { SceneObject } from '../../types'
import type { EditorDocument, EditorEntity, EntityTransform, MaterialDefinition, Vec3 } from './types'
import { entityToSceneObject } from './types'

export const ROOT_ENTITY_ID = 'scene-root'

const now = () => new Date().toISOString()
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const materialFromObject = (object: SceneObject, id: string): MaterialDefinition => ({
  id,
  type: 'MeshPhysicalMaterial',
  color: object.color,
  accent: object.accent,
  roughness: object.roughness,
  metalness: object.metalness,
  opacity: object.opacity,
  transparent: object.opacity < 1,
  emissive: object.shape === 'sphere' ? object.color : '#000000',
  emissiveIntensity: object.shape === 'sphere' ? 0.08 : 0,
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
    materialId: `${object.id}-material`,
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
  for (const object of objects) {
    const entity = entityFromSceneObject(object)
    entities[entity.id] = entity
    entities[ROOT_ENTITY_ID].children.push(entity.id)
    materials[entity.components.materialId!] = materialFromObject(object, entity.components.materialId!)
  }
  return {
    version: 2,
    project: { id: `project-${Date.now()}`, name: projectName, createdAt: timestamp, updatedAt: timestamp },
    scene: { rootId: ROOT_ENTITY_ID, entities, collections: [] },
    materials,
    assets: {},
    animations: {},
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

export const setEntityParent = (document: EditorDocument, id: string, nextParentId: string | null) => {
  const entity = getEntity(document, id)
  if (!entity || id === document.scene.rootId) throw new Error('Cannot parent missing or root entity')
  const parentId = nextParentId ?? document.scene.rootId
  if (!document.scene.entities[parentId]) throw new Error('Parent entity does not exist')
  if (wouldCreateCycle(document, id, parentId)) throw new Error('Parenting would create a cycle')
  if (entity.parentId && document.scene.entities[entity.parentId]) {
    document.scene.entities[entity.parentId].children = document.scene.entities[entity.parentId].children.filter((childId) => childId !== id)
  }
  entity.parentId = parentId
  if (!document.scene.entities[parentId].children.includes(id)) document.scene.entities[parentId].children.push(id)
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
  if (patch.keyframes !== undefined) entity.metadata.keyframes = [...patch.keyframes]
  const materialId = entity.components.materialId
  if (materialId && document.materials[materialId]) {
    const material = document.materials[materialId]
    if (patch.color !== undefined) material.color = patch.color
    if (patch.accent !== undefined) material.accent = patch.accent
    if (patch.metalness !== undefined) material.metalness = patch.metalness
    if (patch.roughness !== undefined) material.roughness = patch.roughness
    if (patch.opacity !== undefined) { material.opacity = patch.opacity; material.transparent = patch.opacity < 1 }
  }
  document.project.updatedAt = now()
}

export const sceneObjectForEntity = (document: EditorDocument, id: string) => {
  const entity = getEntity(document, id)
  return entity && entity.id !== document.scene.rootId ? entityToSceneObject(document, entity) : undefined
}

export const projectFromUnknown = (payload: unknown): EditorDocument => {
  if (!payload || typeof payload !== 'object') throw new Error('Project file must contain an object')
  const candidate = payload as Partial<EditorDocument> & { projectName?: string; objects?: SceneObject[] }
  if (candidate.version === 2 && candidate.project && candidate.scene && candidate.materials && candidate.assets && candidate.animations && candidate.settings) {
    return clone(candidate as EditorDocument)
  }
  if (Array.isArray(candidate.objects)) return createDocumentFromObjects(candidate.objects, candidate.projectName ?? 'Imported project')
  throw new Error('Unsupported or invalid project format')
}
