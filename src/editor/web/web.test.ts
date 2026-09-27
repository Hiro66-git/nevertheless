import { afterEach, describe, expect, it } from 'vitest'
import * as ts from 'typescript'
import { createDocumentFromObjects, cloneDocument, projectFromUnknown } from '../document/document'
import type { SceneObject } from '../../types'
import type { EditorDocument } from '../document/types'
import type { WebDocument } from './webDocumentTypes'
import { createDefaultWebDocument, validateWebDocument } from './webDocument'
import { escapeHtml, escapeScriptData, generateWebOutput } from './webGenerator'
import { parsePreviewMessage } from './previewProtocol'
import { assetExportPath, validateRelativeExportPath } from './exportPaths'
import { mergeGeneratedRegions, parseGeneratedRegions } from './generatedRegions'
import { projectPayload, useEditorStore } from '../../state/editorStore'

const sceneObject: SceneObject = {
  id: 'mesh-one', name: 'Mesh One', kind: 'mesh', shape: 'box', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
  color: '#ffffff', accent: '#ffffff', metalness: 0, roughness: 0.5, opacity: 1, visible: true, locked: false, keyframes: [],
}

afterEach(() => useEditorStore.getState().resetScene())

describe('WebDocument and generator', () => {
  it('creates, serializes, and validates explicit defaults', () => {
    const web = createDefaultWebDocument('Project')
    expect(validateWebDocument(JSON.parse(JSON.stringify(web))).document).toEqual(web)
    expect(web.version).toBe(1)
    expect(web.html.body.sceneMountId).toBe('webforge-scene')
  })

  it('generates deterministic separated files without project timestamps', () => {
    const first = createDocumentFromObjects([sceneObject], 'Project')
    const second = cloneDocument(first)
    second.project.updatedAt = '2099-01-01T00:00:00.000Z'
    const outputA = generateWebOutput(first)
    const outputB = generateWebOutput(second)
    expect(outputA.indexHtml).toBe(outputB.indexHtml)
    expect(outputA.stylesCss).toBe(outputB.stylesCss)
    expect(outputA.sceneJs).toBe(outputB.sceneJs)
    expect(outputA.indexHtml).toContain('styles.css')
    expect(outputA.indexHtml).toContain('scene.js')
    expect(outputA.sceneJs).toContain('mesh-one')
    expect(ts.transpileModule(outputA.sceneJs, { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).diagnostics ?? []).toEqual([])
    expect(outputA.sceneJs).not.toMatch(/Date\.now|Math\.random/)
  })

  it('escapes structured HTML and JavaScript data', () => {
    const document = createDocumentFromObjects([sceneObject], '<title>&')
    document.web!.metadata.title = '<script>alert("x")</script>'
    document.web!.html.body.sections[0].children[1].text = '<unsafe>&'
    const output = generateWebOutput(document)
    expect(output.indexHtml).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
    expect(output.indexHtml).toContain('&lt;unsafe&gt;&amp;')
    expect(escapeHtml('a"b')).toBe('a&quot;b')
    expect(escapeScriptData('</script><!--')).toContain('<\\/script>')
  })

  it('preserves user-owned regions while identifying generated regions', () => {
    const document = createDocumentFromObjects([sceneObject], 'Project')
    document.web!.html.body.userSource = '<section data-owned="user">User section</section>'
    document.web!.css.userSource = '.user-section { color: red; }'
    document.web!.scripts.userSource = "document.body.dataset.user = 'yes'"
    const output = generateWebOutput(document)
    expect(output.indexHtml).toContain('data-owned="user"')
    expect(output.indexHtml).toContain('webforge:generated:scene-mount:start')
    expect(output.stylesCss).toContain('.user-section')
    expect(output.sceneJs).toContain("document.body.dataset.user")
    expect(parseGeneratedRegions(output.stylesCss).regions.map((region) => region.id)).toContain('styles')
    expect(parseGeneratedRegions(output.sceneJs).regions.map((region) => region.id)).toContain('scene-data')
  })

  it('three-way merges generated regions while preserving user source and reporting conflicts', () => {
    const document = createDocumentFromObjects([sceneObject], 'Project')
    document.web!.html.body.userSource = '<section>User source</section>'
    const previous = generateWebOutput(document)
    const changedDocument = cloneDocument(document)
    changedDocument.scene.entities['mesh-one'].transform.position = [2, 0, 0]
    changedDocument.web!.html.body.sceneMountId = 'another-mount'
    const next = generateWebOutput(changedDocument)
    const authored = previous.indexHtml.replace('User source', 'Edited user source')
    const merged = mergeGeneratedRegions(previous.indexHtml, next.indexHtml, authored)
    expect(merged.conflicts).toEqual([])
    expect(merged.source).toContain('Edited user source')
    expect(merged.source).toContain('id="another-mount"')
    const tampered = previous.indexHtml.replace('webforge-scene', 'user-changed-scene')
    const conflict = mergeGeneratedRegions(previous.indexHtml, next.indexHtml, tampered)
    expect(conflict.conflicts.some((item) => item.reason === 'changed-by-both')).toBe(true)
    expect(parseGeneratedRegions(previous.indexHtml).errors).toEqual([])
  })

  it('rejects malformed or unsafe web data and supplies defaults to older v2 projects', () => {
    expect(() => validateWebDocument({ version: 1, metadata: {}, html: {}, css: {}, scripts: {} })).toThrow()
    const unsafe = createDefaultWebDocument('Unsafe')
    unsafe.html.body.sections[0].tag = 'script' as never
    expect(() => validateWebDocument(unsafe)).toThrow(/unsafe/i)
    unsafe.html.body.sections[0].tag = 'div'
    unsafe.html.body.sections[0].attributes.onclick = 'alert(1)'
    expect(() => validateWebDocument(unsafe)).toThrow(/not allowed/i)
    unsafe.html.body.sections[0].attributes = { href: 'javascript:alert(1)' }
    expect(() => validateWebDocument(unsafe)).toThrow(/unsafe URL/i)
    unsafe.html.body.sections[0].attributes = { class: 'safe' }
    unsafe.html.headSource = '<script>alert(1)</script>'
    expect(() => validateWebDocument(unsafe)).toThrow(/unsafe markup/i)
    const legacyV2 = createDocumentFromObjects([], 'Legacy v2')
    delete legacyV2.web
    const loaded = projectFromUnknown(legacyV2)
    expect(loaded.web?.version).toBe(1)
    expect(loaded.web?.metadata.title).toBe('Legacy v2')
    const futureCompatible = createDocumentFromObjects([], 'Future') as EditorDocument & { web: WebDocument & { futureField?: string } }
    futureCompatible.web.futureField = 'preserved'
    expect((projectFromUnknown(futureCompatible).web as WebDocument & { futureField?: string }).futureField).toBe('preserved')
  })
})

describe('visual and web synchronization', () => {
  it('regenerates visual changes without replacing user code and supports undo/redo', () => {
    const store = useEditorStore.getState()
    store.beginCodeEdit()
    store.updateCodeBuffer('js', 'document.body.dataset.keep = \'yes\'')
    expect(store.commitCode()).toBe(true)
    const before = generateWebOutput(useEditorStore.getState().document)
    useEditorStore.getState().updateObject('hero-orb', { position: [4, 5, 6], rotation: [0.1, 0.2, 0.3], scale: [2, 3, 4], visible: false, roughness: 0.8 })
    useEditorStore.getState().addKeyframeForProperty('hero-orb', 'position', 12)
    const changed = generateWebOutput(useEditorStore.getState().document)
    expect(changed.sceneJs).not.toBe(before.sceneJs)
    expect(changed.sceneJs).toContain('"position":[4,5,6]')
    expect(changed.sceneJs).toContain('"rotation":[0.1,0.2,0.3]')
    expect(changed.sceneJs).toContain('"scale":[2,3,4]')
    expect(changed.sceneJs).toContain('"visible":false')
    expect(changed.sceneJs).toContain('"time":12')
    expect(changed.sceneJs).toContain('document.body.dataset.keep')
    useEditorStore.getState().undo()
    useEditorStore.getState().undo()
    expect(generateWebOutput(useEditorStore.getState().document).sceneJs).toBe(before.sceneJs)
    useEditorStore.getState().redo()
    useEditorStore.getState().redo()
    expect(generateWebOutput(useEditorStore.getState().document).sceneJs).toBe(changed.sceneJs)
    expect(useEditorStore.getState().document.web?.scripts.userSource).toContain('dataset.keep')
  })

  it('persists committed HTML, CSS, and JavaScript through save/load', () => {
    const store = useEditorStore.getState()
    store.beginCodeEdit()
    store.updateCodeBuffer('html', '<section>persisted</section>')
    store.updateCodeBuffer('css', '.persisted { color: red; }')
    store.updateCodeBuffer('js', 'document.body.dataset.persisted = "yes"')
    expect(store.commitCode()).toBe(true)
    const payload = projectPayload(useEditorStore.getState())
    useEditorStore.getState().resetScene()
    expect(useEditorStore.getState().loadProject(payload)).toBe(true)
    const web = useEditorStore.getState().document.web!
    expect(web.html.body.userSource).toContain('persisted')
    expect(web.css.userSource).toContain('.persisted')
    expect(web.scripts.userSource).toContain('dataset.persisted')
  })
})

describe('web code buffer', () => {
  it('does not mutate the document while typing and commits once', () => {
    const store = useEditorStore.getState()
    const before = JSON.stringify(store.document.web)
    store.beginCodeEdit()
    store.updateCodeBuffer('html', '<section>User authored</section>')
    expect(useEditorStore.getState().webCodeDirty).toBe(true)
    expect(JSON.stringify(useEditorStore.getState().document.web)).toBe(before)
    expect(useEditorStore.getState().commitCode()).toBe(true)
    expect(useEditorStore.getState().document.web?.html.body.userSource).toContain('User authored')
    expect(useEditorStore.getState().past.at(-1)?.label).toBe('Commit web code')
    useEditorStore.getState().undo()
    expect(useEditorStore.getState().document.web?.html.body.userSource).toBe('')
    useEditorStore.getState().redo()
    expect(useEditorStore.getState().document.web?.html.body.userSource).toContain('User authored')
  })

  it('reverts a dirty buffer without changing committed web code or saved-state accuracy', () => {
    const store = useEditorStore.getState()
    store.saveProject()
    store.beginCodeEdit()
    store.updateCodeBuffer('css', 'body { color: red; }')
    expect(useEditorStore.getState().projectDirty).toBe(true)
    store.revertCode()
    expect(useEditorStore.getState().webCodeDirty).toBe(false)
    expect(useEditorStore.getState().projectDirty).toBe(false)
    expect(useEditorStore.getState().document.web?.css.userSource).toBe('')
  })
})

describe('preview protocol and export safety', () => {
  it('accepts only versioned preview messages', () => {
    expect(parsePreviewMessage({ protocol: 'webforge-preview', version: 1, previewId: 'preview-1', type: 'ready' })).not.toBeNull()
    expect(parsePreviewMessage({ protocol: 'other', version: 1, previewId: 'preview-1', type: 'ready' })).toBeNull()
    expect(parsePreviewMessage({ protocol: 'webforge-preview', version: 1, previewId: 'preview-1', type: 'runtime-error', error: { message: 'boom', source: 'scene.js' } })).not.toBeNull()
    expect(parsePreviewMessage({ protocol: 'webforge-preview', version: 2, previewId: 'preview-1', type: 'ready' })).toBeNull()
  })

  it('rejects traversal and absolute export paths', () => {
    expect(validateRelativeExportPath('assets/image.png')).toBe('assets/image.png')
    expect(() => validateRelativeExportPath('../outside.txt')).toThrow()
    expect(() => validateRelativeExportPath('/outside.txt')).toThrow()
    expect(() => validateRelativeExportPath('C:\\outside.txt')).toThrow()
    expect(assetExportPath({ id: 'asset-abc12345', name: 'my image.png', type: 'image', source: 'data:image/png;base64,AA==', metadata: {}, dependencies: [] })).toMatch(/^assets\//)
  })
})
