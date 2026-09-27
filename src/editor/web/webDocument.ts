import type { WebAttributeMap, WebDocument, WebDocumentValidationResult, WebElementNode } from './webDocumentTypes'
import { WEB_DOCUMENT_VERSION } from './webDocumentTypes'

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const defaultSections = (title: string): WebElementNode[] => [{
  id: 'web-hero',
  tag: 'main',
  attributes: { class: 'webforge-hero' },
  children: [
    { id: 'web-eyebrow', tag: 'p', attributes: { class: 'webforge-eyebrow' }, text: 'WebForge Visual / published scene', children: [] },
    { id: 'web-title', tag: 'h1', attributes: { class: 'webforge-title' }, text: title, children: [] },
  ],
}]

export const createDefaultWebDocument = (projectName: string): WebDocument => ({
  version: WEB_DOCUMENT_VERSION,
  metadata: {
    title: projectName,
    lang: 'en',
    description: `${projectName} interactive scene`,
  },
  html: {
    headSource: '',
    body: {
      sections: defaultSections(projectName),
      userSource: '',
      sceneMountId: 'webforge-scene',
    },
  },
  css: { userSource: '' },
  scripts: { userSource: '' },
})

const MAX_SOURCE_LENGTH = 5_000_000
const safeTags = new Set(['a', 'article', 'aside', 'button', 'div', 'em', 'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'header', 'img', 'li', 'main', 'nav', 'ol', 'p', 'section', 'small', 'span', 'strong', 'ul'])
const urlAttributes = new Set(['action', 'formaction', 'href', 'src'])

const assertString = (value: unknown, label: string) => {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`)
}

const assertSource = (value: unknown, label: string) => {
  assertString(value, label)
  if ((value as string).length > MAX_SOURCE_LENGTH) throw new Error(`${label} is too large`)
}

const assertHeadSource = (value: unknown) => {
  assertSource(value, 'web.html.headSource')
  const source = value as string
  if (/<\s*(?:script|iframe|object|embed|base)\b|\bon[a-z]+\s*=|javascript\s*:/i.test(source)) throw new Error('web.html.headSource contains unsafe markup')
}

function validateAttributes(attributes: unknown, label: string): asserts attributes is WebAttributeMap {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) throw new Error(`${label} attributes are invalid`)
  for (const [key, value] of Object.entries(attributes)) {
    if (!/^[A-Za-z_:][A-Za-z0-9_.:-]*$/.test(key)) throw new Error(`${label} has an invalid attribute name`)
    if (/^on/i.test(key) || key.toLowerCase() === 'style') throw new Error(`${label}.${key} is not allowed`)
    assertString(value, `${label}.${key}`)
    if (urlAttributes.has(key.toLowerCase()) && /^(?:javascript|vbscript):/i.test(value.trim())) throw new Error(`${label}.${key} contains an unsafe URL`)
  }
}

const validateNode = (node: unknown, path: string): asserts node is WebElementNode => {
  if (!node || typeof node !== 'object' || Array.isArray(node)) throw new Error(`${path} is invalid`)
  const candidate = node as Partial<WebElementNode>
  assertString(candidate.id, `${path}.id`)
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(candidate.id!)) throw new Error(`${path}.id is invalid`)
  assertString(candidate.tag, `${path}.tag`)
  if (!/^[a-z][a-z0-9-]*$/.test(candidate.tag!) || !safeTags.has(candidate.tag!)) throw new Error(`${path}.tag is invalid or unsafe`)
  validateAttributes(candidate.attributes, `${path}.attributes`)
  if (candidate.text !== undefined) assertSource(candidate.text, `${path}.text`)
  if (!Array.isArray(candidate.children)) throw new Error(`${path}.children is invalid`)
  candidate.children.forEach((child, index) => validateNode(child, `${path}.children[${index}]`))
}

export const validateWebDocument = (value: unknown): WebDocumentValidationResult => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Web document must be an object')
  const candidate = value as Partial<WebDocument>
  if (candidate.version !== WEB_DOCUMENT_VERSION) throw new Error(`Unsupported web document version: ${String(candidate.version)}`)
  const metadata = candidate.metadata
  if (!metadata || typeof metadata !== 'object') throw new Error('Web metadata is missing')
  assertSource(metadata.title, 'web.metadata.title')
  assertString(metadata.lang, 'web.metadata.lang')
  assertSource(metadata.description, 'web.metadata.description')
  if (!/^[a-zA-Z]{2,12}(?:-[a-zA-Z0-9]{2,8})*$/.test(metadata.lang)) throw new Error('web.metadata.lang is invalid')
  const html = candidate.html
  if (!html || typeof html !== 'object' || !html.body) throw new Error('Web HTML data is missing')
  assertHeadSource(html.headSource)
  assertString(html.body.sceneMountId, 'web.html.body.sceneMountId')
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(html.body.sceneMountId)) throw new Error('web.html.body.sceneMountId is invalid')
  assertSource(html.body.userSource, 'web.html.body.userSource')
  if (!Array.isArray(html.body.sections)) throw new Error('web.html.body.sections is invalid')
  html.body.sections.forEach((section, index) => validateNode(section, `web.html.body.sections[${index}]`))
  const css = candidate.css
  const scripts = candidate.scripts
  if (!css || typeof css !== 'object' || !scripts || typeof scripts !== 'object') throw new Error('Web source data is missing')
  assertSource(css.userSource, 'web.css.userSource')
  assertSource(scripts.userSource, 'web.scripts.userSource')
  return { document: clone(candidate as WebDocument), warnings: [] }
}

export const cloneWebDocument = (document: WebDocument): WebDocument => clone(document)

export const webDocumentFromUnknown = (value: unknown, projectName: string): WebDocument => {
  if (value === undefined) return createDefaultWebDocument(projectName)
  return validateWebDocument(value).document
}
