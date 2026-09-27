export {}

declare global {
  interface Window {
    webforge?: {
      platform: string
      saveProject: (payload: string) => Promise<{ canceled: boolean; filePath?: string }>
      openProject: () => Promise<{ canceled: boolean; filePath?: string; payload?: string }>
      openAsset: () => Promise<{ canceled: boolean; name?: string; type?: string; size?: number; source?: string }>
      exportProject: (payload: { projectName: string; files: Array<{ path: string; contents: string }>; assets: Array<{ path: string; source: string }> }) => Promise<{ canceled: boolean; directory?: string }>
    }
  }
}
