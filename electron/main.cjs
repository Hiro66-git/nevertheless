const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')
const crypto = require('node:crypto')

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
  if (typeof payload !== 'string' || payload.length > 50_000_000) throw new Error('Invalid project payload')
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

ipcMain.handle('asset:open', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'WebForge assets', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'glb', 'gltf', 'hdr', 'hdri'] }],
  })
  if (result.canceled || !result.filePaths[0]) return { canceled: true }
  const filePath = result.filePaths[0]
  const extension = path.extname(filePath).slice(1).toLowerCase()
  const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', glb: 'model/gltf-binary', gltf: 'model/gltf+json', hdr: 'image/vnd.radiance', hdri: 'image/vnd.radiance' }[extension] || 'application/octet-stream'
  const buffer = await fs.readFile(filePath)
  return { canceled: false, name: path.basename(filePath), type: mime, size: buffer.byteLength, source: `data:${mime};base64,${buffer.toString('base64')}` }
})

const relativeExportPath = (value) => {
  if (typeof value !== 'string' || !value || value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value)) throw new Error('Export paths must be relative')
  const normalized = value.replaceAll('\\', '/')
  if (normalized.split('/').some((segment) => !segment || segment === '..')) throw new Error(`Unsafe export path: ${value}`)
  return normalized
}

const safeExportName = (value) => {
  const name = String(value || 'webforge-project').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64)
  return name || 'webforge-project'
}

const dataUrlToBuffer = (source) => {
  if (typeof source !== 'string' || !source.startsWith('data:')) throw new Error('Export assets must be embedded data URLs')
  const separator = source.indexOf(',')
  if (separator < 0) throw new Error('Malformed asset data URL')
  const header = source.slice(5, separator)
  const body = source.slice(separator + 1)
  return header.endsWith(';base64') ? Buffer.from(body, 'base64') : Buffer.from(decodeURIComponent(body), 'utf8')
}

ipcMain.handle('export:static', async (_event, payload) => {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid export payload')
  if (!Array.isArray(payload.files) || !Array.isArray(payload.assets) || payload.files.length > 32 || payload.assets.length > 1000) throw new Error('Invalid export file list')
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (result.canceled || !result.filePaths[0]) return { canceled: true }
  const parent = result.filePaths[0]
  const target = path.join(parent, `${safeExportName(payload.projectName)}-export`)
  const temp = `${target}.tmp-${crypto.randomUUID()}`
  const seen = new Set()
  let totalTextBytes = 0
  try {
    await fs.mkdir(temp, { recursive: false })
    for (const file of payload.files) {
      if (!file || typeof file.contents !== 'string' || file.contents.length > 20_000_000) throw new Error('Invalid or oversized text export file')
      totalTextBytes += Buffer.byteLength(file.contents, 'utf8')
      if (totalTextBytes > 50_000_000) throw new Error('Export payload is too large')
      const relative = relativeExportPath(file.path)
      if (seen.has(relative)) throw new Error(`Duplicate export path: ${relative}`)
      seen.add(relative)
      const destination = path.resolve(temp, relative)
      if (!destination.startsWith(`${path.resolve(temp)}${path.sep}`)) throw new Error('Export path escaped destination')
      await fs.mkdir(path.dirname(destination), { recursive: true })
      await fs.writeFile(destination, file.contents, 'utf8')
    }
    for (const asset of payload.assets) {
      if (!asset || typeof asset.source !== 'string' || asset.source.length > 70_000_000) throw new Error('Invalid or oversized export asset')
      const relative = relativeExportPath(asset.path)
      if (seen.has(relative)) throw new Error(`Duplicate export path: ${relative}`)
      seen.add(relative)
      const destination = path.resolve(temp, relative)
      if (!destination.startsWith(`${path.resolve(temp)}${path.sep}`)) throw new Error('Asset path escaped destination')
      await fs.mkdir(path.dirname(destination), { recursive: true })
      await fs.writeFile(destination, dataUrlToBuffer(asset.source))
    }
    await fs.rename(temp, target)
    return { canceled: false, directory: target }
  } catch (error) {
    await fs.rm(temp, { recursive: true, force: true }).catch(() => undefined)
    throw error
  }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
