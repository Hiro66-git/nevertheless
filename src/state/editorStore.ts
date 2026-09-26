import { create } from 'zustand'
import type { Device, EditorMode, SceneObject, Tool } from '../types'
import { commandForScenePatch, CreateEntityCommand, DeleteEntityCommand, DuplicateEntityCommand, entityForCreate, ParentEntityCommand } from '../editor/commands/sceneCommands'
import { CompositeCommand } from '../editor/commands/command'
import type { EditorCommand } from '../editor/commands/command'
import { pushCommand, pushFutureCommand } from '../editor/history/commandHistory'
import { cloneDocument, createDocumentFromObjects, documentToSceneObjects, projectFromUnknown, sceneObjectForEntity } from '../editor/document/document'
import type { EditorDocument } from '../editor/document/types'

const initialObjects: SceneObject[] = [
  { id: 'hero-orb', name: 'Hero Orb', kind: 'mesh', shape: 'sphere', position: [0, 0.55, 0], rotation: [0, 0.35, 0], scale: [1.2, 1.2, 1.2], color: '#77e5ca', accent: '#b7fff0', metalness: 0.22, roughness: 0.16, opacity: 1, visible: true, locked: false, keyframes: [0, 24, 48] },
  { id: 'orbit-ring', name: 'Orbit Ring', kind: 'mesh', shape: 'torus', position: [0, 0.55, 0], rotation: [1.15, 0.15, -0.15], scale: [1.8, 1.8, 1.8], color: '#6878ff', accent: '#9aa5ff', metalness: 0.78, roughness: 0.24, opacity: 0.95, visible: true, locked: false, keyframes: [0, 48] },
  { id: 'studio-floor', name: 'Studio Floor', kind: 'mesh', shape: 'plane', position: [0, -0.9, 0], rotation: [-Math.PI / 2, 0, 0], scale: [5.8, 5.8, 5.8], color: '#161c22', accent: '#313d48', metalness: 0.1, roughness: 0.72, opacity: 1, visible: true, locked: true, keyframes: [] },
  { id: 'key-light', name: 'Key Light', kind: 'light', position: [2.8, 3.8, 2.2], rotation: [-0.45, 0.6, 0], scale: [1, 1, 1], color: '#fff0d7', accent: '#fff0d7', metalness: 0, roughness: 1, opacity: 1, visible: true, locked: false, keyframes: [] },
  { id: 'welcome-copy', name: 'Welcome Copy', kind: 'text', position: [-2.15, 1.9, -0.3], rotation: [0, 0.05, 0], scale: [1, 1, 1], color: '#f0f4f2', accent: '#f0f4f2', metalness: 0, roughness: 1, opacity: 1, visible: true, locked: false, keyframes: [0] },
]

const selectedDefault = 'hero-orb'
const historyLimit = 100

export interface EditorState {
  projectName: string
  document: EditorDocument
  objects: SceneObject[]
  selectedId: string | null
  past: EditorCommand[]
  future: EditorCommand[]
  activeTool: Tool
  mode: EditorMode
  device: Device
  currentTime: number
  isPlaying: boolean
  snapToGrid: boolean
  showGrid: boolean
  projectDirty: boolean
  lastSaved: string
  lastError: string | null
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
  groupSelected: () => void
  ungroupSelected: () => void
  toggleVisibility: (id: string) => void
  toggleLock: (id: string) => void
  addKeyframe: (id: string, time?: number) => void
  undo: () => void
  redo: () => void
  saveProject: () => void
  loadProject: (payload: string) => boolean
  resetScene: () => void
  executeCommand: (command: EditorCommand, selectionId?: string | null) => void
}

const initialDocument = createDocumentFromObjects(initialObjects, 'Lumen / Launch Experience')

const stateForDocument = (document: EditorDocument, selectedId: string | null) => ({
  document,
  projectName: document.project.name,
  objects: documentToSceneObjects(document),
  selectedId,
})

const applyCommand = (state: EditorState, command: EditorCommand, selectedId = state.selectedId) => {
  const document = cloneDocument(state.document)
  command.execute(document)
  return {
    ...stateForDocument(document, selectedId),
    past: pushCommand(state.past, command, historyLimit),
    future: [],
    projectDirty: true,
    lastError: null,
  }
}

const selectedPatch = (document: EditorDocument, id: string, patch: Partial<SceneObject>) => commandForScenePatch(document, id, patch)

export const useEditorStore = create<EditorState>((set, get) => ({
  projectName: initialDocument.project.name,
  document: initialDocument,
  objects: documentToSceneObjects(initialDocument),
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
  lastError: null,
  selectObject: (id) => set({ selectedId: id }),
  setTool: (activeTool) => set({ activeTool }),
  setMode: (mode) => set({ mode }),
  setDevice: (device) => set((state) => {
    const document = cloneDocument(state.document)
    document.settings.viewport.device = device
    return { ...stateForDocument(document, state.selectedId), device, projectDirty: true, lastError: null }
  }),
  setTime: (currentTime) => set({ currentTime: Math.max(0, Math.min(48, Number.isFinite(currentTime) ? currentTime : 0)) }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleSnap: () => set((state) => {
    const document = cloneDocument(state.document)
    document.settings.snap.enabled = !document.settings.snap.enabled
    return { ...stateForDocument(document, state.selectedId), snapToGrid: document.settings.snap.enabled, projectDirty: true, lastError: null }
  }),
  toggleGrid: () => set((state) => {
    const document = cloneDocument(state.document)
    document.settings.grid.visible = !document.settings.grid.visible
    return { ...stateForDocument(document, state.selectedId), showGrid: document.settings.grid.visible, projectDirty: true, lastError: null }
  }),
  updateObject: (id, patch) => set((state) => applyCommand(state, selectedPatch(state.document, id, patch))),
  updateTransform: (id, field, index, value) => set((state) => {
    const current = sceneObjectForEntity(state.document, id)
    if (!current) return state
    const next = [...current[field]] as [number, number, number]
    next[index] = Number.isFinite(value) ? value : 0
    return applyCommand(state, selectedPatch(state.document, id, { [field]: next } as Partial<SceneObject>))
  }),
  addObject: (kind, shape = 'box') => set((state) => {
    const labels: Record<SceneObject['kind'], string> = { mesh: 'Mesh', group: 'Group', light: 'Light', camera: 'Camera', text: 'Text' }
    const sameKind = state.objects.filter((object) => object.kind === kind).length
    const object: SceneObject = {
      id: `${kind}-${Date.now()}`,
      name: `${labels[kind]} ${String(sameKind + 1).padStart(2, '0')}`,
      kind,
      shape: kind === 'group' || kind === 'camera' || kind === 'text' ? undefined : shape,
      position: [sameKind * 0.35 - 0.5, kind === 'light' ? 2.6 : 0.2, kind === 'light' ? 1.8 : 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: kind === 'light' ? '#ffcf8a' : '#91a0ff',
      accent: '#bec8ff',
      metalness: 0.3,
      roughness: 0.28,
      opacity: 1,
      visible: true,
      locked: false,
      keyframes: [],
      parentId: state.objects.find((item) => item.id === state.selectedId && item.kind === 'group')?.id,
    }
    const entity = entityForCreate(object)
    return applyCommand(state, new CreateEntityCommand(entity), object.id)
  }),
  duplicateSelected: () => set((state) => {
    if (!state.selectedId) return state
    const duplicateId = `${state.selectedId}-copy-${Date.now()}`
    return applyCommand(state, new DuplicateEntityCommand(state.document, state.selectedId, duplicateId), duplicateId)
  }),
  deleteSelected: () => set((state) => {
    if (!state.selectedId || state.selectedId === state.document.scene.rootId) return state
    const nextSelection = state.objects.find((object) => object.id !== state.selectedId)?.id ?? null
    return applyCommand(state, new DeleteEntityCommand(state.selectedId), nextSelection)
  }),
  groupSelected: () => set((state) => {
    const selected = state.selectedId ? sceneObjectForEntity(state.document, state.selectedId) : undefined
    if (!selected || selected.kind === 'group') return state
    const groupId = `group-${Date.now()}`
    const group: SceneObject = {
      id: groupId, name: 'Group', kind: 'group', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
      color: '#91a0ff', accent: '#bec8ff', metalness: 0, roughness: 1, opacity: 1, visible: true, locked: false, keyframes: [], parentId: selected.parentId,
    }
    return applyCommand(state, new CompositeCommand('Group selection', [
      new CreateEntityCommand(entityForCreate(group)),
      new ParentEntityCommand(selected.id, selected.parentId ?? null, groupId),
    ]), groupId)
  }),
  ungroupSelected: () => set((state) => {
    const selected = state.selectedId ? state.document.scene.entities[state.selectedId] : undefined
    if (!selected || selected.type !== 'group') return state
    const parentId = selected.parentId ?? null
    const commands: EditorCommand[] = selected.children.map((childId) => new ParentEntityCommand(childId, selected.id, parentId))
    commands.push(new DeleteEntityCommand(selected.id))
    const nextSelection = selected.children[0] ?? parentId
    return applyCommand(state, new CompositeCommand('Ungroup selection', commands), nextSelection)
  }),
  toggleVisibility: (id) => set((state) => {
    const current = sceneObjectForEntity(state.document, id)
    return current ? applyCommand(state, selectedPatch(state.document, id, { visible: !current.visible })) : state
  }),
  toggleLock: (id) => set((state) => {
    const current = sceneObjectForEntity(state.document, id)
    return current ? applyCommand(state, selectedPatch(state.document, id, { locked: !current.locked })) : state
  }),
  addKeyframe: (id, time = get().currentTime) => set((state) => {
    const current = sceneObjectForEntity(state.document, id)
    if (!current) return state
    const keyframes = Array.from(new Set([...current.keyframes, Math.round(time)])).sort((a, b) => a - b)
    return applyCommand(state, selectedPatch(state.document, id, { keyframes }))
  }),
  undo: () => set((state) => {
    const command = state.past.at(-1)
    if (!command) return state
    const document = cloneDocument(state.document)
    command.undo(document)
    return { ...stateForDocument(document, state.selectedId), past: state.past.slice(0, -1), future: pushFutureCommand(state.future, command, historyLimit), projectDirty: true, lastError: null }
  }),
  redo: () => set((state) => {
    const command = state.future[0]
    if (!command) return state
    const document = cloneDocument(state.document)
    command.execute(document)
    return { ...stateForDocument(document, state.selectedId), past: pushCommand(state.past, command, historyLimit), future: state.future.slice(1), projectDirty: true, lastError: null }
  }),
  saveProject: () => set((state) => {
    const document = cloneDocument(state.document)
    document.project.updatedAt = new Date().toISOString()
    return { ...stateForDocument(document, state.selectedId), projectDirty: false, lastSaved: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), lastError: null }
  }),
  loadProject: (payload) => {
    try {
      const parsed = JSON.parse(payload) as unknown
      const document = projectFromUnknown(parsed)
      set({ ...stateForDocument(document, Object.keys(document.scene.entities).find((id) => id !== document.scene.rootId) ?? null), past: [], future: [], projectDirty: false, lastError: null, device: document.settings.viewport.device, showGrid: document.settings.grid.visible, snapToGrid: document.settings.snap.enabled })
      return true
    } catch (error) {
      set({ lastError: error instanceof Error ? error.message : 'Unable to load project' })
      return false
    }
  },
  resetScene: () => set((state) => {
    const document = createDocumentFromObjects(initialObjects, 'Lumen / Launch Experience')
    return { ...stateForDocument(document, selectedDefault), past: [], future: [], projectDirty: true, lastError: null, device: 'desktop', showGrid: true, snapToGrid: true }
  }),
  executeCommand: (command, selectionId) => set((state) => applyCommand(state, command, selectionId)),
}))

export const projectPayload = (state: Pick<EditorState, 'document'>) => JSON.stringify(state.document, null, 2)
