export const PREVIEW_PROTOCOL = 'webforge-preview' as const
export const PREVIEW_PROTOCOL_VERSION = 1 as const

export interface PreviewError {
  message: string
  stack?: string
  line?: number | null
  column?: number | null
  source?: string
}

export type PreviewMessage =
  | { protocol: typeof PREVIEW_PROTOCOL; version: typeof PREVIEW_PROTOCOL_VERSION; previewId: string; type: 'ready' }
  | { protocol: typeof PREVIEW_PROTOCOL; version: typeof PREVIEW_PROTOCOL_VERSION; previewId: string; type: 'runtime-error'; error: PreviewError }

const isError = (value: unknown): value is PreviewError => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PreviewError>
  return typeof candidate.message === 'string' && (candidate.stack === undefined || typeof candidate.stack === 'string') && (candidate.source === undefined || typeof candidate.source === 'string')
}

export const parsePreviewMessage = (value: unknown): PreviewMessage | null => {
  if (!value || typeof value !== 'object') return null
  const candidate = value as { protocol?: unknown; version?: unknown; previewId?: unknown; type?: unknown; error?: unknown }
  if (candidate.protocol !== PREVIEW_PROTOCOL || candidate.version !== PREVIEW_PROTOCOL_VERSION || typeof candidate.previewId !== 'string') return null
  if (candidate.type === 'ready') return { protocol: PREVIEW_PROTOCOL, version: PREVIEW_PROTOCOL_VERSION, previewId: candidate.previewId, type: 'ready' }
  if (candidate.type === 'runtime-error' && isError(candidate.error)) return { protocol: PREVIEW_PROTOCOL, version: PREVIEW_PROTOCOL_VERSION, previewId: candidate.previewId, type: 'runtime-error', error: candidate.error }
  return null
}
