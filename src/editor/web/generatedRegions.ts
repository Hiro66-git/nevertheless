export type GeneratedRegionSyntax = 'html' | 'css' | 'js'

export interface GeneratedRegion {
  id: string
  start: number
  contentStart: number
  contentEnd: number
  end: number
  content: string
}

export interface RegionParseResult {
  regions: GeneratedRegion[]
  errors: string[]
}

export interface GeneratedRegionConflict {
  id: string
  reason: 'malformed' | 'missing-current' | 'missing-previous' | 'changed-by-user' | 'changed-by-both' | 'removed'
}

export interface GeneratedRegionMergeResult {
  source: string
  conflicts: GeneratedRegionConflict[]
  changed: boolean
}

export interface GeneratedWebSourceFiles {
  indexHtml: string
  stylesCss: string
  sceneJs: string
}

export interface GeneratedWebSourceMergeResult {
  files: GeneratedWebSourceFiles
  conflicts: Array<GeneratedRegionConflict & { file: keyof GeneratedWebSourceFiles }>
  changed: boolean
}

const markerBody = (id: string, side: 'start' | 'end') => `webforge:generated:${id}:${side}`

export const generatedRegionMarker = (id: string, side: 'start' | 'end', syntax: GeneratedRegionSyntax) => {
  const body = markerBody(id, side)
  if (syntax === 'html') return `<!-- ${body} -->`
  return `/* ${body} */`
}

export const generatedRegion = (id: string, content: string, syntax: GeneratedRegionSyntax) => {
  const start = generatedRegionMarker(id, 'start', syntax)
  const end = generatedRegionMarker(id, 'end', syntax)
  return `${start}\n${content}\n${end}`
}

const markerPattern = /(?:<!--\s*|\/\*\s*)webforge:generated:([A-Za-z0-9_-]+):(start|end)(?:\s*-->|\s*\*\/)/g

export const parseGeneratedRegions = (source: string): RegionParseResult => {
  const regions: GeneratedRegion[] = []
  const errors: string[] = []
  const open: { id: string; start: number; contentStart: number }[] = []
  markerPattern.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = markerPattern.exec(source))) {
    const id = match[1]
    const side = match[2]
    if (side === 'start') {
      if (open.some((item) => item.id === id)) errors.push(`Generated region ${id} is nested or duplicated`)
      open.push({ id, start: match.index, contentStart: markerPattern.lastIndex })
      continue
    }
    const index = open.length - 1
    const candidate = open[index]
    if (!candidate) {
      errors.push(`Generated region ${id} has an unmatched end marker`)
      continue
    }
    if (candidate.id !== id) {
      errors.push(`Generated region ${id} closes ${candidate.id}`)
      open.pop()
      continue
    }
    open.pop()
    regions.push({ id, start: candidate.start, contentStart: candidate.contentStart, contentEnd: match.index, end: markerPattern.lastIndex, content: source.slice(candidate.contentStart, match.index) })
  }
  for (const item of open) errors.push(`Generated region ${item.id} has no end marker`)
  return { regions: regions.sort((a, b) => a.start - b.start), errors }
}

const byId = (regions: GeneratedRegion[]) => new Map(regions.map((region) => [region.id, region]))

export const mergeGeneratedRegions = (previousGenerated: string, nextGenerated: string, currentSource: string): GeneratedRegionMergeResult => {
  const previous = parseGeneratedRegions(previousGenerated)
  const next = parseGeneratedRegions(nextGenerated)
  const current = parseGeneratedRegions(currentSource)
  const conflicts: GeneratedRegionConflict[] = []
  for (const error of [...previous.errors, ...next.errors, ...current.errors]) conflicts.push({ id: 'unknown', reason: 'malformed' })
  if (conflicts.length) return { source: currentSource, conflicts, changed: false }

  const previousById = byId(previous.regions)
  const nextById = byId(next.regions)
  const currentById = byId(current.regions)
  let source = currentSource
  const replacements: Array<{ start: number; end: number; content: string }> = []

  for (const [id, nextRegion] of nextById) {
    const previousRegion = previousById.get(id)
    const currentRegion = currentById.get(id)
    if (!previousRegion) {
      conflicts.push({ id, reason: 'missing-previous' })
      continue
    }
    if (!currentRegion) {
      conflicts.push({ id, reason: 'missing-current' })
      continue
    }
    const userChangedGeneratedRegion = currentRegion.content !== previousRegion.content
    const generatorChangedRegion = nextRegion.content !== previousRegion.content
    if (userChangedGeneratedRegion && !generatorChangedRegion) {
      conflicts.push({ id, reason: 'changed-by-user' })
      continue
    }
    if (userChangedGeneratedRegion && generatorChangedRegion && currentRegion.content !== nextRegion.content) {
      conflicts.push({ id, reason: 'changed-by-both' })
      continue
    }
    if (!userChangedGeneratedRegion && generatorChangedRegion) replacements.push({ start: currentRegion.contentStart, end: currentRegion.contentEnd, content: nextRegion.content })
  }

  for (const previousRegion of previous.regions) {
    if (!nextById.has(previousRegion.id) && currentById.has(previousRegion.id)) conflicts.push({ id: previousRegion.id, reason: 'removed' })
  }
  for (const currentRegion of current.regions) {
    if (!previousById.has(currentRegion.id) && !nextById.has(currentRegion.id)) conflicts.push({ id: currentRegion.id, reason: 'missing-previous' })
  }

  if (conflicts.length) return { source: currentSource, conflicts, changed: false }
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) source = `${source.slice(0, replacement.start)}${replacement.content}${source.slice(replacement.end)}`
  return { source, conflicts: [], changed: source !== currentSource }
}

export const mergeGeneratedWebFiles = (previousGenerated: GeneratedWebSourceFiles, nextGenerated: GeneratedWebSourceFiles, currentSource: GeneratedWebSourceFiles): GeneratedWebSourceMergeResult => {
  const files = { ...currentSource }
  const conflicts: Array<GeneratedRegionConflict & { file: keyof GeneratedWebSourceFiles }> = []
  let changed = false
  for (const file of ['indexHtml', 'stylesCss', 'sceneJs'] as const) {
    const result = mergeGeneratedRegions(previousGenerated[file], nextGenerated[file], currentSource[file])
    files[file] = result.source
    conflicts.push(...result.conflicts.map((conflict) => ({ ...conflict, file })))
    changed = changed || result.changed
  }
  return { files, conflicts, changed: conflicts.length ? false : changed }
}
