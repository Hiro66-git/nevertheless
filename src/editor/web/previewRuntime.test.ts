// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PreviewRuntime } from './previewRuntime'
import type { GeneratedWebFiles } from './webDocumentTypes'

const output: GeneratedWebFiles = { indexHtml: '<html><head><link rel="stylesheet" href="./styles.css"></head><body><script type="module" src="./scene.js"></script></body></html>', stylesCss: 'body{}', sceneJs: 'window.parent.postMessage({protocol:"webforge-preview",version:1,previewId:globalThis.__WEBFORGE_PREVIEW_ID__,type:"ready"},"*")', assetFiles: [] }

const currentPreviewId = (runtime: PreviewRuntime) => (runtime as unknown as { previewId: string }).previewId
const post = (iframe: HTMLIFrameElement, data: unknown) => window.dispatchEvent(new MessageEvent('message', { source: iframe.contentWindow, data }))

describe('PreviewRuntime lifecycle', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('debounces updates, accepts ready, and disposes blob URLs/listeners', () => {
    vi.useFakeTimers()
    let nextUrl = 0
    const created: string[] = []
    const revoked: string[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => { const url = `blob:test-${nextUrl++}`; created.push(url); return url })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => { revoked.push(url) })
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const states: string[] = []
    const runtime = new PreviewRuntime(iframe, (state) => states.push(state.status))
    runtime.update(output)
    runtime.update(output)
    vi.advanceTimersByTime(119)
    expect(created).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(created).toHaveLength(3)
    const previewId = currentPreviewId(runtime)
    post(iframe, { protocol: 'webforge-preview', version: 1, previewId, type: 'ready' })
    expect(states).toContain('ready')
    runtime.dispose()
    expect(revoked).toHaveLength(3)
    iframe.dispatchEvent(new Event('error'))
    expect(states.at(-1)).toBe('ready')
  })

  it('rejects stale messages, reports runtime errors, and clears them after reload', () => {
    vi.useFakeTimers()
    vi.spyOn(URL, 'createObjectURL').mockImplementation((source) => `blob:${String(source).length}`)
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const states: Array<{ status: string; errors: number }> = []
    const runtime = new PreviewRuntime(iframe, (state) => states.push({ status: state.status, errors: state.errors.length }))
    runtime.update(output)
    vi.advanceTimersByTime(120)
    const firstId = currentPreviewId(runtime)
    post(iframe, { protocol: 'webforge-preview', version: 1, previewId: firstId, type: 'runtime-error', error: { message: 'syntax error', line: 4, column: 2, source: 'project.js' } })
    expect(states.at(-1)).toEqual({ status: 'error', errors: 1 })
    runtime.reload()
    const secondId = currentPreviewId(runtime)
    expect(secondId).not.toBe(firstId)
    post(iframe, { protocol: 'webforge-preview', version: 1, previewId: firstId, type: 'ready' })
    expect(states.at(-1)?.status).toBe('loading')
    post(iframe, { protocol: 'webforge-preview', version: 1, previewId: secondId, type: 'ready' })
    expect(states.at(-1)).toEqual({ status: 'ready', errors: 0 })
    runtime.dispose()
  })

  it('enters an observable error state when ready is never reported', () => {
    vi.useFakeTimers()
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const states: Array<{ status: string; errors: number }> = []
    const runtime = new PreviewRuntime(iframe, (state) => states.push({ status: state.status, errors: state.errors.length }))
    runtime.update(output)
    vi.advanceTimersByTime(120)
    vi.advanceTimersByTime(10_000)
    expect(states.at(-1)).toEqual({ status: 'error', errors: 1 })
    runtime.dispose()
  })
})
