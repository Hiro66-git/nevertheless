export const WEB_DOCUMENT_VERSION = 1 as const

export type WebCodeFile = 'html' | 'css' | 'js'

export interface WebAttributeMap {
  [name: string]: string
}

export interface WebElementNode {
  id: string
  tag: string
  attributes: WebAttributeMap
  text?: string
  children: WebElementNode[]
}

export interface WebDocument {
  version: typeof WEB_DOCUMENT_VERSION
  metadata: {
    title: string
    lang: string
    description: string
  }
  html: {
    headSource: string
    body: {
      sections: WebElementNode[]
      userSource: string
      sceneMountId: string
    }
  }
  css: {
    userSource: string
  }
  scripts: {
    userSource: string
  }
}

export interface WebGenerationSettings {
  assetUrls?: Record<string, string>
}

export interface GeneratedWebFiles {
  indexHtml: string
  stylesCss: string
  sceneJs: string
  assetFiles: Array<{ path: string; source: string; name: string }>
}

export interface WebDocumentValidationResult {
  document: WebDocument
  warnings: string[]
}
