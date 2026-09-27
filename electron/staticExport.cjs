const path = require('node:path')
const fs = require('node:fs/promises')
const crypto = require('node:crypto')

const REMOTE_RUNTIME_PATTERN = /(?:https?:)?\/\/[^\s"'<>]+/i

const relativeExportPath = (value) => {
  if (typeof value !== 'string' || !value || value.includes('\0') || value.startsWith('/') || /^[A-Za-z]:/.test(value)) throw new Error('Export paths must be relative')
  const normalized = value.replaceAll('\\', '/')
  if (normalized.split('/').some((segment) => !segment || segment === '..' || segment === '.')) throw new Error(`Unsafe export path: ${value}`)
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
  if (!header || !body || header.includes('..') || (!header.includes(';base64') && !header.includes('/'))) throw new Error('Malformed asset data URL')
  if (header.endsWith(';base64')) {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(body) || body.length % 4 === 1) throw new Error('Malformed base64 asset data URL')
    return Buffer.from(body, 'base64')
  }
  return Buffer.from(decodeURIComponent(body), 'utf8')
}

const assertPayload = (payload) => {
  if (!payload || typeof payload !== 'object' || (payload.projectName !== undefined && typeof payload.projectName !== 'string')) throw new Error('Invalid export payload')
  if (!Array.isArray(payload.files) || !Array.isArray(payload.assets) || payload.files.length > 32 || payload.assets.length > 1000) throw new Error('Invalid export file list')
  for (const asset of payload.assets) {
    if (!asset || (asset.id !== undefined && typeof asset.id !== 'string') || (asset.name !== undefined && typeof asset.name !== 'string') || (asset.type !== undefined && typeof asset.type !== 'string') || (asset.dependencies !== undefined && (!Array.isArray(asset.dependencies) || asset.dependencies.some((dependency) => typeof dependency !== 'string')))) throw new Error('Invalid export asset metadata')
  }
}

const getRuntimeFiles = async () => {
  let threeEntry
  try {
    threeEntry = require.resolve('three')
  } catch {
    throw new Error('The declared Three.js runtime is not available to the Electron exporter')
  }
  const packageRoot = path.dirname(path.dirname(threeEntry))
  const threePath = path.join(packageRoot, 'build', 'three.module.js')
  const threeCorePath = path.join(packageRoot, 'build', 'three.core.js')
  const loaderPath = path.join(packageRoot, 'examples', 'jsm', 'loaders', 'GLTFLoader.js')
  const threeSource = await fs.readFile(threePath, 'utf8')
  const threeCoreSource = await fs.readFile(threeCorePath, 'utf8')
  const bufferGeometryUtilsPath = path.join(packageRoot, 'examples', 'jsm', 'utils', 'BufferGeometryUtils.js')
  const bufferGeometryUtilsSource = (await fs.readFile(bufferGeometryUtilsPath, 'utf8')).replace(/from\s+(['"])three\1/g, "from './three.module.js'")
  const loaderSource = (await fs.readFile(loaderPath, 'utf8'))
    .replace(/from\s+(['"])three\1/g, "from './three.module.js'")
    .replace("from '../utils/BufferGeometryUtils.js'", "from './BufferGeometryUtils.js'")
  if (/from\s+(['"])three\1/.test(bufferGeometryUtilsSource) || /from\s+(['"])three\1/.test(loaderSource) || loaderSource.includes("from '../utils/BufferGeometryUtils.js'")) throw new Error('GLTFLoader runtime rewrite did not produce local runtime imports')
  return [
    { path: 'runtime/three.module.js', contents: threeSource },
    { path: 'runtime/three.core.js', contents: threeCoreSource },
    { path: 'runtime/BufferGeometryUtils.js', contents: bufferGeometryUtilsSource },
    { path: 'runtime/GLTFLoader.js', contents: loaderSource },
  ]
}

const rewriteGltfDocument = (entry, document, byId, byName) => {
  const dependencyFor = (uri) => {
    if (/^data:/i.test(uri)) return uri
    const token = decodeURIComponent(uri).split(/[?#]/, 1)[0]
    const dependency = byId.get(token) || byName.get(path.posix.basename(token))
    if (!dependency) throw new Error(`Missing GLTF dependency for ${entry.name}: ${uri}`)
    const relative = path.posix.relative(path.posix.dirname(entry.path), dependency.path)
    if (!relative || relative.startsWith('../') || path.posix.isAbsolute(relative)) throw new Error(`GLTF dependency escaped export directory: ${uri}`)
    return relative
  }
  let changed = false
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit)
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      if (key === 'uri' && typeof child === 'string') {
        const rewritten = dependencyFor(child)
        if (rewritten !== child) { value[key] = rewritten; changed = true }
      } else visit(child)
    }
  }
  visit(document)
  return { document, changed }
}

const rewriteGltfDependencies = (entry, byId, byName) => {
  if (entry.type !== 'model') return entry.bytes
  if (/\.gltf$/i.test(entry.name)) {
    let document
    try {
      document = JSON.parse(entry.bytes.toString('utf8'))
    } catch {
      throw new Error(`Malformed GLTF JSON asset: ${entry.name}`)
    }
    return Buffer.from(JSON.stringify(rewriteGltfDocument(entry, document, byId, byName).document), 'utf8')
  }
  if (!/\.glb$/i.test(entry.name)) return entry.bytes
  if (entry.bytes.length < 20 || entry.bytes.readUInt32LE(0) !== 0x46546c67 || entry.bytes.readUInt32LE(4) !== 2) throw new Error(`Malformed GLB asset: ${entry.name}`)
  const jsonLength = entry.bytes.readUInt32LE(12)
  const jsonType = entry.bytes.readUInt32LE(16)
  const jsonStart = 20
  const jsonEnd = jsonStart + jsonLength
  if (jsonType !== 0x4e4f534a || jsonEnd > entry.bytes.length) throw new Error(`Malformed GLB JSON chunk: ${entry.name}`)
  let document
  try {
    document = JSON.parse(entry.bytes.subarray(jsonStart, jsonEnd).toString('utf8').replace(/\0+$/, '').trim())
  } catch {
    throw new Error(`Malformed GLB JSON asset: ${entry.name}`)
  }
  const rewritten = rewriteGltfDocument(entry, document, byId, byName)
  if (!rewritten.changed) return entry.bytes
  const json = Buffer.from(JSON.stringify(rewritten.document), 'utf8')
  const paddedLength = Math.ceil(json.length / 4) * 4
  const jsonChunk = Buffer.alloc(8 + paddedLength, 0x20)
  jsonChunk.writeUInt32LE(paddedLength, 0)
  jsonChunk.writeUInt32LE(0x4e4f534a, 4)
  json.copy(jsonChunk, 8)
  const remainder = entry.bytes.subarray(jsonEnd)
  const output = Buffer.alloc(12 + jsonChunk.length + remainder.length)
  output.writeUInt32LE(0x46546c67, 0)
  output.writeUInt32LE(2, 4)
  output.writeUInt32LE(output.length, 8)
  jsonChunk.copy(output, 12)
  remainder.copy(output, 12 + jsonChunk.length)
  return output
}

const writeStaticExport = async (parent, payload) => {
  assertPayload(payload)
  if (typeof parent !== 'string' || !parent || path.isAbsolute(parent) === false) throw new Error('Export destination must be absolute')
  const target = path.join(parent, `${safeExportName(payload.projectName)}-export`)
  const temp = `${target}.tmp-${crypto.randomUUID()}`
  const seen = new Set()
  let totalTextBytes = 0
  let totalAssetBytes = 0
  try {
    await fs.mkdir(temp, { recursive: false })
    for (const file of payload.files) {
      if (!file || typeof file.path !== 'string' || typeof file.contents !== 'string' || file.contents.length > 20_000_000) throw new Error('Invalid or oversized text export file')
      if (['index.html', 'styles.css', 'scene.js'].includes(file.path) && REMOTE_RUNTIME_PATTERN.test(file.contents)) throw new Error('Self-contained exports cannot include remote runtime dependencies')
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
    for (const required of ['index.html', 'styles.css', 'scene.js']) {
      if (!seen.has(required)) throw new Error(`Missing required export file: ${required}`)
    }
    for (const runtimeFile of await getRuntimeFiles()) {
      if (seen.has(runtimeFile.path)) throw new Error(`Duplicate export path: ${runtimeFile.path}`)
      seen.add(runtimeFile.path)
      const destination = path.resolve(temp, runtimeFile.path)
      if (!destination.startsWith(`${path.resolve(temp)}${path.sep}`)) throw new Error('Runtime path escaped destination')
      await fs.mkdir(path.dirname(destination), { recursive: true })
      await fs.writeFile(destination, runtimeFile.contents, 'utf8')
    }
    const assetEntries = []
    const byId = new Map()
    const byName = new Map()
    for (const asset of payload.assets) {
      if (!asset || typeof asset.path !== 'string' || typeof asset.source !== 'string' || asset.source.length > 70_000_000) throw new Error('Invalid or oversized export asset')
      const relative = relativeExportPath(asset.path)
      if (seen.has(relative)) throw new Error(`Duplicate export path: ${relative}`)
      seen.add(relative)
      const destination = path.resolve(temp, relative)
      if (!destination.startsWith(`${path.resolve(temp)}${path.sep}`)) throw new Error('Asset path escaped destination')
      const bytes = dataUrlToBuffer(asset.source)
      totalAssetBytes += bytes.byteLength
      if (totalAssetBytes > 100_000_000) throw new Error('Export assets are too large')
      const entry = { id: asset.id, name: asset.name || path.posix.basename(relative), type: asset.type || '', dependencies: asset.dependencies || [], path: relative, bytes }
      if (entry.id && byId.has(entry.id)) throw new Error(`Duplicate asset id: ${entry.id}`)
      assetEntries.push(entry)
      if (entry.id) byId.set(entry.id, entry)
      const name = path.posix.basename(entry.name)
      if (byName.has(name)) byName.set(name, null)
      else byName.set(name, entry)
    }
    for (const entry of assetEntries) {
      for (const dependency of entry.dependencies) if (!byId.has(dependency)) throw new Error(`Missing declared asset dependency: ${dependency}`)
    }
    for (const entry of assetEntries) {
      const bytes = rewriteGltfDependencies(entry, byId, byName)
      const destination = path.resolve(temp, entry.path)
      await fs.mkdir(path.dirname(destination), { recursive: true })
      await fs.writeFile(destination, bytes)
    }
    await fs.rename(temp, target)
    return { canceled: false, directory: target }
  } catch (error) {
    await fs.rm(temp, { recursive: true, force: true }).catch(() => undefined)
    throw error
  }
}

module.exports = { relativeExportPath, safeExportName, dataUrlToBuffer, getRuntimeFiles, writeStaticExport }
