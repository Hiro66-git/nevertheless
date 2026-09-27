const path = require('node:path')
const fs = require('node:fs/promises')
const crypto = require('node:crypto')

const relativeExportPath = (value) => {
  if (typeof value !== 'string' || !value || value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value)) throw new Error('Export paths must be relative')
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
  if (!payload || typeof payload !== 'object') throw new Error('Invalid export payload')
  if (!Array.isArray(payload.files) || !Array.isArray(payload.assets) || payload.files.length > 32 || payload.assets.length > 1000) throw new Error('Invalid export file list')
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
      if (!asset || typeof asset.path !== 'string' || typeof asset.source !== 'string' || asset.source.length > 70_000_000) throw new Error('Invalid or oversized export asset')
      const relative = relativeExportPath(asset.path)
      if (seen.has(relative)) throw new Error(`Duplicate export path: ${relative}`)
      seen.add(relative)
      const destination = path.resolve(temp, relative)
      if (!destination.startsWith(`${path.resolve(temp)}${path.sep}`)) throw new Error('Asset path escaped destination')
      const bytes = dataUrlToBuffer(asset.source)
      totalAssetBytes += bytes.byteLength
      if (totalAssetBytes > 100_000_000) throw new Error('Export assets are too large')
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

module.exports = { relativeExportPath, safeExportName, dataUrlToBuffer, writeStaticExport }
