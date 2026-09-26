const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')

const isDev = Boolean(process.env.ELECTRON_RENDERER_URL)

function createWindow() {
  const window = new BrowserWindow({
    width: 1540,
    height: 980,
    minWidth: 1100,
    minHeight: 680,
    backgroundColor: '#0b0e11',
    title: 'WebForge Visual',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })
  window.removeMenu()
  if (isDev) window.loadURL(process.env.ELECTRON_RENDERER_URL)
  else window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

ipcMain.handle('project:save-as', async (_event, payload) => {
  const result = await dialog.showSaveDialog({ defaultPath: 'webforge-project.wfv', filters: [{ name: 'WebForge Project', extensions: ['wfv'] }] })
  if (result.canceled || !result.filePath) return { canceled: true }
  await fs.writeFile(result.filePath, payload, 'utf8')
  return { canceled: false, filePath: result.filePath }
})

ipcMain.handle('project:open', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'WebForge Project', extensions: ['wfv', 'json'] }] })
  if (result.canceled || !result.filePaths[0]) return { canceled: true }
  return { canceled: false, filePath: result.filePaths[0], payload: await fs.readFile(result.filePaths[0], 'utf8') }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
