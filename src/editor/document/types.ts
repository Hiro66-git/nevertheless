import type { MeshShape, ObjectKind, SceneObject } from '../../types'

export type EntityType = ObjectKind | 'empty'
export type Vec3 = [number, number, number]

export interface EntityTransform {
  position: Vec3
  rotation: Vec3
  scale: Vec3
}

export interface EditorEntity {
  id: string
  name: string
  type: EntityType
  parentId: string | null
  children: string[]
  visible: boolean
  locked: boolean
  transform: EntityTransform
  components: {
    shape?: MeshShape
    materialId?: string
    light?: { color: string; intensity: number }
    text?: { value: string }
  }
  metadata: Record<string, unknown>
}

export interface MaterialDefinition {
  id: string
  type: 'MeshStandardMaterial' | 'MeshPhysicalMaterial'
  color: string
  accent: string
  roughness: number
  metalness: number
  opacity: number
  transparent: boolean
  emissive: string
  emissiveIntensity: number
  maps: Record<string, string | null>
}

export interface AssetDefinition {
  id: string
  name: string
  type: 'image' | 'model' | 'texture' | 'hdr' | 'unknown'
  source: string
  size?: number
  metadata: Record<string, unknown>
  thumbnail?: string
  dependencies: string[]
}

export interface AnimationKeyframe {
  time: number
  value: number | Vec3
  interpolation: 'linear'
}

export interface AnimationTrack {
  id: string
  entityId: string
  property: 'position' | 'rotation' | 'scale' | 'opacity'
  keyframes: AnimationKeyframe[]
}

export interface EditorDocument {
  version: 2
  project: {
    id: string
    name: string
    createdAt: string
    updatedAt: string
  }
  scene: {
    rootId: string
    entities: Record<string, EditorEntity>
    collections: string[]
  }
  materials: Record<string, MaterialDefinition>
  assets: Record<string, AssetDefinition>
  animations: Record<string, AnimationTrack>
  settings: {
    grid: { visible: boolean; size: number; divisions: number }
    snap: { enabled: boolean; step: number }
    viewport: { device: 'desktop' | 'tablet' | 'mobile'; camera: 'perspective' | 'orthographic' }
  }
}

export type ProjectFileV2 = EditorDocument

export const isVec3 = (value: unknown): value is Vec3 => Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number' && Number.isFinite(item))
export const entityToSceneObject = (document: EditorDocument, entity: EditorEntity): SceneObject => {
  const material = entity.components.materialId ? document.materials[entity.components.materialId] : undefined
  const shape = entity.components.shape
  const metadataKeyframes = Array.isArray(entity.metadata.keyframes) ? entity.metadata.keyframes.filter((value): value is number => typeof value === 'number') : []
  const trackKeyframes = Object.values(document.animations).flatMap((track) => track.entityId === entity.id ? track.keyframes.map((keyframe) => keyframe.time) : [])
  const keyframes = [...metadataKeyframes, ...trackKeyframes]
  return {
    id: entity.id,
    name: entity.name,
    kind: entity.type === 'empty' ? 'group' : entity.type,
    shape,
    position: [...entity.transform.position] as Vec3,
    rotation: [...entity.transform.rotation] as Vec3,
    scale: [...entity.transform.scale] as Vec3,
    color: material?.color ?? entity.components.light?.color ?? '#91a0ff',
    accent: material?.accent ?? entity.components.light?.color ?? '#bec8ff',
    metalness: material?.metalness ?? 0,
    roughness: material?.roughness ?? 1,
    opacity: material?.opacity ?? 1,
    visible: entity.visible,
    locked: entity.locked,
    keyframes: Array.from(new Set(keyframes)).sort((a, b) => a - b),
    parentId: entity.parentId && entity.parentId !== document.scene.rootId ? entity.parentId : undefined,
  }
}
