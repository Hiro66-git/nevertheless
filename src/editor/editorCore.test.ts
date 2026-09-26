import { afterEach, describe, expect, it } from 'vitest'
import { CreateEntityCommand, ParentEntityCommand, commandForTransform } from './commands/sceneCommands'
import { cloneDocument, createDocumentFromObjects, getWorldMatrix, projectFromUnknown, setEntityParent, validateDocument } from './document/document'
import type { SceneObject } from '../types'
import { evaluateTrack } from './animation/animationEvaluator'
import { useEditorStore } from '../state/editorStore'
import { MaterialManager, materialKeyForObject } from './materials/materialManager'

const object = (id: string, parentId?: string): SceneObject => ({
  id,
  name: id,
  kind: 'mesh',
  shape: 'box',
  parentId,
  position: [1, 2, 3],
  rotation: [0.1, 0.2, 0.3],
  scale: [1, 1, 1],
  color: '#ffffff',
  accent: '#ffffff',
  metalness: 0,
  roughness: 0.5,
  opacity: 1,
  visible: true,
  locked: false,
  keyframes: [],
})

afterEach(() => useEditorStore.getState().resetScene())

describe('editor document hierarchy', () => {
  it('preserves world transform when reparenting', () => {
    const document = createDocumentFromObjects([object('parent'), object('child')], 'Test')
    document.scene.entities.parent.transform.position = [5, 0, 0]
    const before = getWorldMatrix(document, 'child').elements.slice()
    setEntityParent(document, 'child', 'parent')
    const after = getWorldMatrix(document, 'child').elements.slice()
    after.forEach((value, index) => expect(value).toBeCloseTo(before[index], 10))
    expect(document.scene.entities.parent.children).toContain('child')
  })

  it('rejects hierarchy cycles', () => {
    const document = createDocumentFromObjects([object('a'), object('b', 'a')], 'Test')
    expect(() => setEntityParent(document, 'a', 'b')).toThrow(/cycle/i)
  })

  it('validates the document and catches orphaned children', () => {
    const document = createDocumentFromObjects([object('one')], 'Test')
    document.scene.entities[document.scene.rootId].children = []
    expect(() => validateDocument(document)).toThrow(/hierarchy/i)
  })
})

describe('commands', () => {
  it('undoes and redoes a transform without a full scene snapshot command', () => {
    const document = createDocumentFromObjects([object('one')], 'Test')
    const command = commandForTransform(document, 'one', { position: [9, 8, 7] })
    const changed = cloneDocument(document)
    command.execute(changed)
    expect(changed.scene.entities.one.transform.position).toEqual([9, 8, 7])
    command.undo(changed)
    expect(changed.scene.entities.one.transform.position).toEqual([1, 2, 3])
    command.execute(changed)
    expect(changed.scene.entities.one.transform.position).toEqual([9, 8, 7])
  })

  it('creates and undoes a real entity command', () => {
    const document = createDocumentFromObjects([], 'Test')
    const entity = { id: 'new-entity', name: 'new-entity', type: 'mesh' as const, parentId: document.scene.rootId, children: [], visible: true, locked: false, transform: { position: [1, 2, 3] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] }, components: { shape: 'box' as const, materialId: 'new-entity-material' }, metadata: {} }
    const command = new CreateEntityCommand(entity)
    command.execute(document)
    expect(document.scene.entities['new-entity']).toBeDefined()
    command.undo(document)
    expect(document.scene.entities['new-entity']).toBeUndefined()
  })
})

describe('persistence and migration', () => {
  it('migrates a version 1 project into the version 2 document', () => {
    const migrated = projectFromUnknown({ projectName: 'Legacy', objects: [object('legacy')] })
    expect(migrated.version).toBe(2)
    expect(migrated.project.name).toBe('Legacy')
    expect(migrated.scene.entities.legacy).toBeDefined()
    expect(migrated.materials['legacy-material']).toBeDefined()
  })

  it('does not replace the current document when an open payload is invalid', () => {
    const before = JSON.stringify(useEditorStore.getState().document)
    expect(useEditorStore.getState().loadProject('{not json')).toBe(false)
    expect(JSON.stringify(useEditorStore.getState().document)).toBe(before)
  })
})

describe('materials', () => {
  it('shares base materials and isolates overrides with reference-counted keys', () => {
    const manager = new MaterialManager()
    const first = object('first')
    const second = { ...object('second'), materialId: 'shared-material' }
    first.materialId = 'shared-material'
    const sharedA = manager.acquire(first)
    const sharedB = manager.acquire(second)
    expect(sharedA.material).toBe(sharedB.material)
    const isolated = { ...second, materialOverride: { roughness: 0.9 } }
    expect(materialKeyForObject(isolated)).not.toBe(materialKeyForObject(second))
    expect(manager.acquire(isolated).material).not.toBe(sharedA.material)
    manager.release(sharedA.id)
    manager.release(sharedB.id)
    manager.release(materialKeyForObject(isolated))
    manager.dispose()
  })
})

describe('selection commands', () => {
  it('duplicates and deletes an additive selection as one history entry', () => {
    const store = useEditorStore.getState()
    store.selectObject('hero-orb')
    store.selectObject('orbit-ring', true)
    store.duplicateSelected()
    expect(useEditorStore.getState().selectedIds).toHaveLength(2)
    expect(useEditorStore.getState().past.at(-1)?.label).toBe('Duplicate selection')
    useEditorStore.getState().deleteSelected()
    expect(useEditorStore.getState().past.at(-1)?.label).toBe('Delete selection')
    useEditorStore.getState().undo()
    expect(useEditorStore.getState().objects.some((item) => item.name === 'Hero Orb copy')).toBe(true)
  })

  it('groups selected entities without changing their world matrices', () => {
    const store = useEditorStore.getState()
    const beforeHero = getWorldMatrix(store.document, 'hero-orb').elements.slice()
    const beforeRing = getWorldMatrix(store.document, 'orbit-ring').elements.slice()
    store.selectObject('hero-orb')
    store.selectObject('orbit-ring', true)
    store.groupSelected()
    const grouped = useEditorStore.getState()
    const group = grouped.document.scene.entities[grouped.selectedId!]
    expect(group.type).toBe('group')
    expect(group.children).toEqual(expect.arrayContaining(['hero-orb', 'orbit-ring']))
    getWorldMatrix(grouped.document, 'hero-orb').elements.forEach((value, index) => expect(value).toBeCloseTo(beforeHero[index], 10))
    getWorldMatrix(grouped.document, 'orbit-ring').elements.forEach((value, index) => expect(value).toBeCloseTo(beforeRing[index], 10))
  })
})

describe('animation evaluation', () => {
  it('linearly interpolates vector keyframes', () => {
    const value = evaluateTrack({ id: 'track', entityId: 'one', property: 'position', keyframes: [
      { time: 0, value: [0, 0, 0], interpolation: 'linear' },
      { time: 10, value: [10, 20, 30], interpolation: 'linear' },
    ] }, 5)
    expect(value).toEqual([5, 10, 15])
  })
})
