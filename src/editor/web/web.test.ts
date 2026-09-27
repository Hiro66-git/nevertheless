import { afterEach, describe, expect, it } from 'vitest'
import { createDocumentFromObjects, cloneDocument, projectFromUnknown } from '../document/document'
import type { SceneObject } from '../../types'
import { createDefaultWebDocument, validateWebDocument } from './webDocument'
import { escapeHtml, escapeScriptData, generateWebOutput } from './webGenerator'
import { parsePreviewMessage } from './previewProtocol'
import { assetExportPath, validateRelativeExportPath } from './exportPaths'
import { useEditorStore } from '../../state/editorStore'

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
    expect(() => new Function(outputA.sceneJs)).not.toThrow()
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
    expect(output.indexHtml).toContain('webforge:generated:scene:start')
    expect(output.stylesCss).toContain('.user-section')
    expect(output.sceneJs).toContain("document.body.dataset.user")
  })

  it('rejects malformed web data and supplies defaults to older v2 projects', () => {
    expect(() => validateWebDocument({ version: 1, metadata: {}, html: {}, css: {}, scripts: {} })).toThrow()
    const legacyV2 = createDocumentFromObjects([], 'Legacy v2')
    delete legacyV2.web
    const loaded = projectFromUnknown(legacyV2)
    expect(loaded.web?.version).toBe(1)
    expect(loaded.web?.metadata.title).toBe('Legacy v2')
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
  })

  it('reverts a dirty buffer without changing committed web code', () => {
    const store = useEditorStore.getState()
    store.beginCodeEdit()
    store.updateCodeBuffer('css', 'body { color: red; }')
    store.revertCode()
    expect(useEditorStore.getState().webCodeDirty).toBe(false)
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
