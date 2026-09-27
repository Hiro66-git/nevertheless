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

export interface WebRuntimeUrls {
  threeModuleUrl: string
  gltfLoaderUrl: string
  selfContained: boolean
}

export interface WebGenerationSettings {
  assetUrls?: Record<string, string>
  runtimeUrls?: WebRuntimeUrls
}

export interface GeneratedWebFiles {
  indexHtml: string
  stylesCss: string
  sceneJs: string
  assetFiles: Array<{ id: string; path: string; source: string; name: string; type: string; dependencies: string[] }>
}

export interface WebDocumentValidationResult {
  document: WebDocument
  warnings: string[]
}
