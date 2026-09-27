// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PreviewRuntime } from './previewRuntime'
import type { GeneratedWebFiles } from './webDocumentTypes'

const output: GeneratedWebFiles = { indexHtml: '<html><head><link rel="stylesheet" href="./styles.css"></head><body><script type="module" src="./scene.js"></script></body></html>', stylesCss: 'body{}', sceneJs: 'window.parent.postMessage({protocol:"webforge-preview",version:1,type:"ready"},"*")', assetFiles: [] }

describe('PreviewRuntime lifecycle', () => {
  afterEach(() => vi.useRealTimers())

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
    const previewId = (runtime as unknown as { previewId: string }).previewId
    window.dispatchEvent(new MessageEvent('message', { source: iframe.contentWindow, data: { protocol: 'webforge-preview', version: 1, previewId, type: 'ready' } }))
    expect(states).toContain('ready')
    runtime.dispose()
    expect(revoked).toHaveLength(3)
    iframe.dispatchEvent(new Event('error'))
    expect(states.at(-1)).toBe('ready')
  })
})
