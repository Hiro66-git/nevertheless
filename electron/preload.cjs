const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('webforge', {
  saveProject: (payload) => ipcRenderer.invoke('project:save-as', payload),
  openProject: () => ipcRenderer.invoke('project:open'),
  openAsset: () => ipcRenderer.invoke('asset:open'),
  platform: process.platform,
})
