export {}

declare global {
  interface Window {
    webforge?: {
      platform: string
      saveProject: (payload: string) => Promise<{ canceled: boolean; filePath?: string }>
      openProject: () => Promise<{ canceled: boolean; filePath?: string; payload?: string }>
    }
  }
}
