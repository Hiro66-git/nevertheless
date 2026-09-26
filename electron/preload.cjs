const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('webforge', {
  saveProject: (payload) => ipcRenderer.invoke('project:save-as', payload),
  openProject: () => ipcRenderer.invoke('project:open'),
  platform: process.platform,
})
