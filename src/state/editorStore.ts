import { create } from 'zustand'
import type { Device, EditorMode, SceneObject, Tool } from '../types'
import { commandForScenePatch, CreateEntityCommand, DeleteEntityCommand, DuplicateEntityCommand, entityForCreate, ParentEntityCommand, RegisterAssetCommand, SetAnimationTrackCommand } from '../editor/commands/sceneCommands'
import type { AnimationProperty, AssetDefinition } from '../editor/document/types'
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
  selectedIds: string[]
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
  selectObject: (id: string | null, additive?: boolean) => void
  clearSelection: () => void
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
  addKeyframeForProperty: (id: string, property: AnimationProperty, time?: number) => void
  importAsset: (file: File) => Promise<boolean>
  undo: () => void
  redo: () => void
  saveProject: () => void
  loadProject: (payload: string) => boolean
  resetScene: () => void
  executeCommand: (command: EditorCommand, selectionId?: string | null) => void
}

const initialDocument = createDocumentFromObjects(initialObjects, 'Lumen / Launch Experience')

const stateForDocument = (document: EditorDocument, selectedId: string | null, selectedIds = selectedId ? [selectedId] : []) => {
  const validIds = selectedIds.filter((id) => Boolean(document.scene.entities[id]) && id !== document.scene.rootId)
  return {
    document,
    projectName: document.project.name,
    objects: documentToSceneObjects(document),
    selectedId: validIds.includes(selectedId ?? '') ? selectedId : validIds[0] ?? null,
    selectedIds: validIds,
  }
}

const applyCommand = (state: EditorState, command: EditorCommand, selectedId = state.selectedId, selectedIds = selectedId ? [selectedId] : []) => {
  const document = cloneDocument(state.document)
  command.execute(document)
  return {
    ...stateForDocument(document, selectedId, selectedIds),
    past: pushCommand(state.past, command, historyLimit),
    future: [],
    projectDirty: true,
    lastError: null,
  }
}

const selectedPatch = (document: EditorDocument, id: string, patch: Partial<SceneObject>) => commandForScenePatch(document, id, patch)

const selectionRoots = (document: EditorDocument, selectedIds: string[]) => {
  const ids = new Set(selectedIds)
  return selectedIds.filter((id) => {
    let parentId = document.scene.entities[id]?.parentId ?? null
    while (parentId) {
      if (ids.has(parentId)) return false
      parentId = document.scene.entities[parentId]?.parentId ?? null
    }
    return true
  })
}

const assetTypeFor = (file: File): AssetDefinition['type'] | null => {
  const extension = file.name.toLowerCase().split('.').pop() ?? ''
  if (['hdr', 'hdri'].includes(extension)) return 'hdr'
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(extension) || file.type.startsWith('image/')) return 'image'
  if (['glb', 'gltf'].includes(extension)) return 'model'
  return null
}

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result))
  reader.onerror = () => reject(new Error(`Unable to read ${file.name}`))
  reader.readAsDataURL(file)
})

const stableAssetId = async (file: File) => {
  const bytes = await file.arrayBuffer()
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
    return `asset-${Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, '0')).join('').slice(0, 24)}`
  }
  return `asset-${file.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${file.size}-${file.lastModified}`
}

export const useEditorStore = create<EditorState>((set, get) => ({
  projectName: initialDocument.project.name,
  document: initialDocument,
  objects: documentToSceneObjects(initialDocument),
  selectedId: selectedDefault,
  selectedIds: [selectedDefault],
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
  selectObject: (id, additive = false) => set((state) => {
    if (!id) return { selectedId: null, selectedIds: [] }
    const current = state.selectedIds.length ? state.selectedIds : state.selectedId ? [state.selectedId] : []
    const selectedIds = additive
      ? current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      : [id]
    return { selectedId: selectedIds[0] ?? null, selectedIds }
  }),
  clearSelection: () => set({ selectedId: null, selectedIds: [] }),
  setTool: (activeTool) => set({ activeTool }),
  setMode: (mode) => set({ mode }),
  setDevice: (device) => set((state) => {
    const document = cloneDocument(state.document)
    document.settings.viewport.device = device
    return { ...stateForDocument(document, state.selectedId, state.selectedIds), device, projectDirty: true, lastError: null }
  }),
  setTime: (currentTime) => set({ currentTime: Math.max(0, Math.min(48, Number.isFinite(currentTime) ? currentTime : 0)) }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleSnap: () => set((state) => {
    const document = cloneDocument(state.document)
    document.settings.snap.enabled = !document.settings.snap.enabled
    return { ...stateForDocument(document, state.selectedId, state.selectedIds), snapToGrid: document.settings.snap.enabled, projectDirty: true, lastError: null }
  }),
  toggleGrid: () => set((state) => {
    const document = cloneDocument(state.document)
    document.settings.grid.visible = !document.settings.grid.visible
    return { ...stateForDocument(document, state.selectedId, state.selectedIds), showGrid: document.settings.grid.visible, projectDirty: true, lastError: null }
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
    const selection = selectionRoots(state.document, state.selectedIds.length ? state.selectedIds : state.selectedId ? [state.selectedId] : [])
    if (!selection.length) return state
    const ids = selection.map((id) => `${id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
    const commands = selection.map((id, index) => new DuplicateEntityCommand(state.document, id, ids[index]))
    return applyCommand(state, new CompositeCommand('Duplicate selection', commands), ids[0], ids)
  }),
  deleteSelected: () => set((state) => {
    const selection = selectionRoots(state.document, state.selectedIds.length ? state.selectedIds : state.selectedId ? [state.selectedId] : [])
      .filter((id) => id !== state.document.scene.rootId)
    if (!selection.length) return state
    const commands = selection.map((id) => new DeleteEntityCommand(id))
    return applyCommand(state, new CompositeCommand('Delete selection', commands), null, [])
  }),
  groupSelected: () => set((state) => {
    const selection = selectionRoots(state.document, state.selectedIds.length ? state.selectedIds : state.selectedId ? [state.selectedId] : [])
    const selected = selection[0] ? sceneObjectForEntity(state.document, selection[0]) : undefined
    if (!selected || selection.length < 1 || selection.some((id) => state.document.scene.entities[id]?.type === 'group')) return state
    const groupId = `group-${Date.now()}`
    const group: SceneObject = {
      id: groupId, name: 'Group', kind: 'group', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
      color: '#91a0ff', accent: '#bec8ff', metalness: 0, roughness: 1, opacity: 1, visible: true, locked: false, keyframes: [], parentId: selected.parentId,
    }
    const commands: EditorCommand[] = [new CreateEntityCommand(entityForCreate(group))]
    for (const id of selection) {
      const entity = state.document.scene.entities[id]
      commands.push(new ParentEntityCommand(id, entity.parentId, groupId))
    }
    return applyCommand(state, new CompositeCommand('Group selection', commands), groupId, [groupId])
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
    const targets = state.selectedIds.includes(id) && state.selectedIds.length > 1 ? state.selectedIds : [id]
    const commands = targets.flatMap((target) => {
      const current = sceneObjectForEntity(state.document, target)
      return current ? [selectedPatch(state.document, target, { visible: !current.visible })] : []
    })
    return commands.length ? applyCommand(state, new CompositeCommand('Set visibility', commands)) : state
  }),
  toggleLock: (id) => set((state) => {
    const targets = state.selectedIds.includes(id) && state.selectedIds.length > 1 ? state.selectedIds : [id]
    const commands = targets.flatMap((target) => {
      const current = sceneObjectForEntity(state.document, target)
      return current ? [selectedPatch(state.document, target, { locked: !current.locked })] : []
    })
    return commands.length ? applyCommand(state, new CompositeCommand('Set lock', commands)) : state
  }),
  addKeyframe: (id, time = get().currentTime) => get().addKeyframeForProperty(id, 'position', time),
  addKeyframeForProperty: (id, property, time = get().currentTime) => set((state) => {
    const current = sceneObjectForEntity(state.document, id)
    if (!current) return state
    const trackId = `${id}:${property}`
    const before = state.document.animations[trackId]
    const value = property === 'opacity' ? current.opacity : [...current[property]] as [number, number, number]
    const keyframes = before ? [...before.keyframes] : []
    const frame = { time: Math.round(time), value, interpolation: 'linear' as const }
    const index = keyframes.findIndex((item) => item.time === frame.time)
    if (index >= 0) keyframes[index] = frame
    else keyframes.push(frame)
    keyframes.sort((a, b) => a.time - b.time)
    const after = { id: trackId, entityId: id, property, keyframes }
    return applyCommand(state, new SetAnimationTrackCommand(trackId, before, after))
  }),
  importAsset: async (file) => {
    const type = assetTypeFor(file)
    if (!type) {
      set({ lastError: `Unsupported asset format: ${file.name}` })
      return false
    }
    try {
      const state = get()
      const assetId = await stableAssetId(file)
      const existing = state.document.assets[assetId]
      const source = existing?.source ?? await readFileAsDataUrl(file)
      const asset: AssetDefinition = existing ?? {
        id: assetId,
        name: file.name,
        type,
        source,
        size: file.size,
        metadata: { mimeType: file.type, lastModified: file.lastModified },
        thumbnail: type === 'image' ? source : undefined,
        dependencies: [],
      }
      const commands: EditorCommand[] = existing ? [] : [new RegisterAssetCommand(asset)]
      let selectedId: string | null = state.selectedId
      if (type !== 'hdr') {
        const object: SceneObject = {
          id: `asset-entity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,          name: file.name.replace(/\.[^/.]+$/, ''),
          kind: 'mesh',
          shape: type === 'image' ? 'plane' : 'box',
          assetId: asset.id,
          position: [0, 0.2, 0],
          rotation: type === 'image' ? [-Math.PI / 2, 0, 0] : [0, 0, 0],
          scale: [1.5, 1.5, 1.5],
          color: '#ffffff',
          accent: '#ffffff',
          metalness: 0,
          roughness: 0.5,
          opacity: 1,
          visible: true,
          locked: false,
          keyframes: [],
        }
        commands.push(new CreateEntityCommand(entityForCreate(object)))
        selectedId = object.id
      }
      set((current) => applyCommand(current, new CompositeCommand('Import asset', commands), selectedId))
      return true
    } catch (error) {
      set({ lastError: error instanceof Error ? error.message : 'Unable to import asset' })
      return false
    }
  },
  undo: () => set((state) => {
    const command = state.past.at(-1)
    if (!command) return state
    const document = cloneDocument(state.document)
    command.undo(document)
    return { ...stateForDocument(document, state.selectedId, state.selectedIds), past: state.past.slice(0, -1), future: pushFutureCommand(state.future, command, historyLimit), projectDirty: true, lastError: null }
  }),
  redo: () => set((state) => {
    const command = state.future[0]
    if (!command) return state
    const document = cloneDocument(state.document)
    command.execute(document)
    return { ...stateForDocument(document, state.selectedId, state.selectedIds), past: pushCommand(state.past, command, historyLimit), future: state.future.slice(1), projectDirty: true, lastError: null }
  }),
  saveProject: () => set((state) => {
    const document = cloneDocument(state.document)
    document.project.updatedAt = new Date().toISOString()
    return { ...stateForDocument(document, state.selectedId, state.selectedIds), projectDirty: false, lastSaved: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), lastError: null }
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

export const projectPayload = (state: Pick<EditorState, 'document'>) => {
  const document = cloneDocument(state.document)
  document.project.updatedAt = new Date().toISOString()
  return JSON.stringify(document, null, 2)
}
