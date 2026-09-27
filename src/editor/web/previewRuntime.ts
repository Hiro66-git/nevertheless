import type { GeneratedWebFiles } from './webDocumentTypes'
import { parsePreviewMessage, type PreviewError } from './previewProtocol'

export type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error'
export type PreviewState = { status: PreviewStatus; errors: PreviewError[] }

type StateListener = (state: PreviewState) => void

export class PreviewRuntime {
  private readonly iframe: HTMLIFrameElement
  private readonly listen: StateListener
  private readonly urls = new Set<string>()
  private updateTimer: number | undefined
  private readyTimer: number | undefined
  private latestOutput: GeneratedWebFiles | null = null
  private previewId = ''
  private previewSequence = 0
  private disposed = false
  private state: PreviewState = { status: 'idle', errors: [] }

  constructor(iframe: HTMLIFrameElement, listen: StateListener) {
    this.iframe = iframe
    this.listen = listen
    window.addEventListener('message', this.handleMessage)
    this.iframe.addEventListener('error', this.handleFrameError)
  }

  update(output: GeneratedWebFiles) {
    this.latestOutput = output
    if (this.updateTimer !== undefined) window.clearTimeout(this.updateTimer)
    this.updateTimer = window.setTimeout(() => {
      this.updateTimer = undefined
      this.loadNow(output)
    }, 120)
  }

  reload() {
    if (this.latestOutput) this.loadNow(this.latestOutput)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    if (this.updateTimer !== undefined) window.clearTimeout(this.updateTimer)
    if (this.readyTimer !== undefined) window.clearTimeout(this.readyTimer)
    window.removeEventListener('message', this.handleMessage)
    this.iframe.removeEventListener('error', this.handleFrameError)
    this.iframe.src = 'about:blank'
    for (const url of this.urls) URL.revokeObjectURL(url)
    this.urls.clear()
    this.latestOutput = null
  }

  private loadNow(output: GeneratedWebFiles) {
    if (this.disposed) return
    if (this.readyTimer !== undefined) window.clearTimeout(this.readyTimer)
    for (const url of this.urls) URL.revokeObjectURL(url)
    this.urls.clear()
    this.previewId = globalThis.crypto?.randomUUID?.() ?? `preview-${++this.previewSequence}`
    const cssUrl = this.createUrl(output.stylesCss, 'text/css')
    const jsSource = `globalThis.__WEBFORGE_PREVIEW_ID__ = ${JSON.stringify(this.previewId)};\n${output.sceneJs}`
    const jsUrl = this.createUrl(jsSource, 'text/javascript')
    const html = output.indexHtml.replace('href="./styles.css"', `href="${cssUrl}"`).replace('src="./scene.js"', `src="${jsUrl}"`)
    const htmlUrl = this.createUrl(html, 'text/html')
    this.setState({ status: 'loading', errors: [] })
    this.iframe.src = htmlUrl
    this.readyTimer = window.setTimeout(() => {
      this.readyTimer = undefined
      if (this.state.status === 'loading') this.setState({ status: 'error', errors: [{ message: 'Preview timed out before reporting ready', source: 'preview' }] })
    }, 10000)
  }

  private createUrl(source: string, type: string) {
    const url = URL.createObjectURL(new Blob([source], { type }))
    this.urls.add(url)
    return url
  }

  private readonly handleMessage = (event: MessageEvent) => {
    if (this.disposed || event.source !== this.iframe.contentWindow) return
    const message = parsePreviewMessage(event.data)
    if (!message || message.previewId !== this.previewId) return
    if (message.type === 'ready') {
      if (this.readyTimer !== undefined) window.clearTimeout(this.readyTimer)
      this.readyTimer = undefined
      this.setState({ status: 'ready', errors: [] })
    } else {
      this.setState({ status: 'error', errors: [...this.state.errors, message.error] })
    }
  }

  private readonly handleFrameError = () => {
    this.setState({ status: 'error', errors: [...this.state.errors, { message: 'Preview document failed to load', source: 'iframe' }] })
  }

  private setState(next: PreviewState) {
    this.state = next
    this.listen(next)
  }
}
