import { create } from 'zustand'
import type { Device, EditorMode, SceneObject, Snapshot, Tool } from '../types'

const initialObjects: SceneObject[] = [
  {
    id: 'hero-orb', name: 'Hero Orb', kind: 'mesh', shape: 'sphere', position: [0, 0.55, 0], rotation: [0, 0.35, 0], scale: [1.2, 1.2, 1.2],
    color: '#77e5ca', accent: '#b7fff0', metalness: 0.22, roughness: 0.16, opacity: 1, visible: true, locked: false, keyframes: [0, 24, 48],
  },
  {
    id: 'orbit-ring', name: 'Orbit Ring', kind: 'mesh', shape: 'torus', position: [0, 0.55, 0], rotation: [1.15, 0.15, -0.15], scale: [1.8, 1.8, 1.8],
    color: '#6878ff', accent: '#9aa5ff', metalness: 0.78, roughness: 0.24, opacity: 0.95, visible: true, locked: false, keyframes: [0, 48],
  },
  {
    id: 'studio-floor', name: 'Studio Floor', kind: 'mesh', shape: 'plane', position: [0, -0.9, 0], rotation: [-Math.PI / 2, 0, 0], scale: [5.8, 5.8, 5.8],
    color: '#161c22', accent: '#313d48', metalness: 0.1, roughness: 0.72, opacity: 1, visible: true, locked: true, keyframes: [],
  },
  {
    id: 'key-light', name: 'Key Light', kind: 'light', position: [2.8, 3.8, 2.2], rotation: [-0.45, 0.6, 0], scale: [1, 1, 1],
    color: '#fff0d7', accent: '#fff0d7', metalness: 0, roughness: 1, opacity: 1, visible: true, locked: false, keyframes: [],
  },
  {
    id: 'welcome-copy', name: 'Welcome Copy', kind: 'text', position: [-2.15, 1.9, -0.3], rotation: [0, 0.05, 0], scale: [1, 1, 1],
    color: '#f0f4f2', accent: '#f0f4f2', metalness: 0, roughness: 1, opacity: 1, visible: true, locked: false, keyframes: [0],
  },
]

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const snapshotOf = (objects: SceneObject[], selectedId: string | null): Snapshot => ({ objects: clone(objects), selectedId })
const selectedDefault = 'hero-orb'

interface EditorState {
  projectName: string
  objects: SceneObject[]
  selectedId: string | null
  past: Snapshot[]
  future: Snapshot[]
  activeTool: Tool
  mode: EditorMode
  device: Device
  currentTime: number
  isPlaying: boolean
  snapToGrid: boolean
  showGrid: boolean
  projectDirty: boolean
  lastSaved: string
  selectObject: (id: string | null) => void
  setTool: (tool: Tool) => void
  setMode: (mode: EditorMode) => void
  setDevice: (device: Device) => void
  setTime: (time: number) => void
  togglePlaying: () => void
  toggleSnap: () => void
  toggleGrid: () => void
  updateObject: (id: string, patch: Partial<SceneObject>) => void
  updateTransform: (id: string, field: 'position' | 'rotation' | 'scale', index: number, value: number) => void
  addObject: (kind: SceneObject['kind'], shape?: SceneObject['shape']) => void
  duplicateSelected: () => void
  deleteSelected: () => void
  toggleVisibility: (id: string) => void
  toggleLock: (id: string) => void
  addKeyframe: (id: string, time?: number) => void
  undo: () => void
  redo: () => void
  saveProject: () => void
  loadProject: (payload: string) => void
  resetScene: () => void
}

const commit = (state: EditorState, nextObjects: SceneObject[], nextSelectedId: string | null) => ({
  objects: nextObjects,
  selectedId: nextSelectedId,
  past: [...state.past, snapshotOf(state.objects, state.selectedId)].slice(-60),
  future: [],
  projectDirty: true,
})

export const useEditorStore = create<EditorState>((set, get) => ({
  projectName: 'Lumen / Launch Experience',
  objects: initialObjects,
  selectedId: selectedDefault,
  past: [],
  future: [],
  activeTool: 'select',
  mode: 'design',
  device: 'desktop',
  currentTime: 0,
  isPlaying: false,
  snapToGrid: true,
  showGrid: true,
  projectDirty: false,
  lastSaved: '09:41:12',
  selectObject: (id) => set({ selectedId: id }),
  setTool: (activeTool) => set({ activeTool }),
  setMode: (mode) => set({ mode }),
  setDevice: (device) => set({ device }),
  setTime: (currentTime) => set({ currentTime }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  updateObject: (id, patch) => set((state) => {
    const objects = state.objects.map((object) => object.id === id ? { ...object, ...patch } : object)
    return commit(state, objects, state.selectedId)
  }),
  updateTransform: (id, field, index, value) => set((state) => {
    const objects = state.objects.map((object) => {
      if (object.id !== id) return object
      const transform = [...object[field]] as [number, number, number]
      transform[index] = Number.isFinite(value) ? value : 0
      return { ...object, [field]: transform }
    })
    return commit(state, objects, state.selectedId)
  }),
  addObject: (kind, shape = 'box') => set((state) => {
    const labels: Record<SceneObject['kind'], string> = { mesh: 'Mesh', group: 'Group', light: 'Light', camera: 'Camera', text: 'Text' }
    const sameKind = state.objects.filter((object) => object.kind === kind).length
    const object: SceneObject = {
      id: `${kind}-${Date.now()}`, name: `${labels[kind]} ${String(sameKind + 1).padStart(2, '0')}`, kind, shape,
      position: [sameKind * 0.35 - 0.5, kind === 'light' ? 2.6 : 0.2, kind === 'light' ? 1.8 : 0], rotation: [0, 0, 0], scale: [1, 1, 1],
      color: kind === 'light' ? '#ffcf8a' : '#91a0ff', accent: '#bec8ff', metalness: 0.3, roughness: 0.28, opacity: 1, visible: true, locked: false, keyframes: [],
    }
    return commit(state, [...state.objects, object], object.id)
  }),
  duplicateSelected: () => set((state) => {
    const original = state.objects.find((object) => object.id === state.selectedId)
    if (!original) return state
    const copy: SceneObject = { ...clone(original), id: `${original.id}-copy-${Date.now()}`, name: `${original.name} copy`, position: [original.position[0] + 0.45, original.position[1] + 0.2, original.position[2]] }
    return commit(state, [...state.objects, copy], copy.id)
  }),
  deleteSelected: () => set((state) => {
    if (!state.selectedId) return state
    const objects = state.objects.filter((object) => object.id !== state.selectedId)
    return commit(state, objects, objects[0]?.id ?? null)
  }),
  toggleVisibility: (id) => set((state) => {
    const objects = state.objects.map((object) => object.id === id ? { ...object, visible: !object.visible } : object)
    return commit(state, objects, state.selectedId)
  }),
  toggleLock: (id) => set((state) => {
    const objects = state.objects.map((object) => object.id === id ? { ...object, locked: !object.locked } : object)
    return commit(state, objects, state.selectedId)
  }),
  addKeyframe: (id, time = get().currentTime) => set((state) => {
    const objects = state.objects.map((object) => {
      if (object.id !== id) return object
      const keyframes = Array.from(new Set([...object.keyframes, Math.round(time)])).sort((a, b) => a - b)
      return { ...object, keyframes }
    })
    return commit(state, objects, state.selectedId)
  }),
  undo: () => set((state) => {
    const previous = state.past.at(-1)
    if (!previous) return state
    return { objects: clone(previous.objects), selectedId: previous.selectedId, past: state.past.slice(0, -1), future: [snapshotOf(state.objects, state.selectedId), ...state.future].slice(0, 60), projectDirty: true }
  }),
  redo: () => set((state) => {
    const next = state.future[0]
    if (!next) return state
    return { objects: clone(next.objects), selectedId: next.selectedId, past: [...state.past, snapshotOf(state.objects, state.selectedId)].slice(-60), future: state.future.slice(1), projectDirty: true }
  }),
  saveProject: () => set({ projectDirty: false, lastSaved: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }),
  loadProject: (payload) => {
    try {
      const parsed = JSON.parse(payload) as { projectName?: string; objects: SceneObject[] }
      if (!Array.isArray(parsed.objects)) throw new Error('Invalid project')
      set({ projectName: parsed.projectName ?? 'Imported project', objects: parsed.objects, selectedId: parsed.objects[0]?.id ?? null, past: [], future: [], projectDirty: false })
    } catch {
      // The UI reports invalid files; keep the existing scene intact.
    }
  },
  resetScene: () => set({ objects: clone(initialObjects), selectedId: selectedDefault, past: [], future: [], projectDirty: true }),
}))

export const projectPayload = (state: Pick<EditorState, 'projectName' | 'objects'>) => JSON.stringify({ version: 1, projectName: state.projectName, objects: state.objects }, null, 2)
