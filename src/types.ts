export type ObjectKind = 'mesh' | 'group' | 'light' | 'camera' | 'text'
export type MeshShape = 'sphere' | 'torus' | 'box' | 'plane' | 'cone'

export interface SceneObject {
  id: string
  name: string
  kind: ObjectKind
  shape?: MeshShape
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: string
  accent: string
  metalness: number
  roughness: number
  opacity: number
  visible: boolean
  locked: boolean
  keyframes: number[]
  parentId?: string
}

export type Snapshot = {
  objects: SceneObject[]
  selectedId: string | null
}

export type EditorMode = 'design' | 'motion' | 'code'
export type Tool = 'select' | 'move' | 'rotate' | 'scale' | 'hand'
export type Device = 'desktop' | 'tablet' | 'mobile'
