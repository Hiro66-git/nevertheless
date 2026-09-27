import type { AssetDefinition } from '../document/types'

const extensionForAsset = (asset: AssetDefinition) => {
  const nameExtension = asset.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()
  if (nameExtension && ['png', 'jpg', 'jpeg', 'webp', 'svg', 'glb', 'gltf', 'hdr', 'hdri'].includes(nameExtension)) return nameExtension
  const byType: Record<AssetDefinition['type'], string> = { image: 'bin', model: 'bin', texture: 'bin', hdr: 'hdr', unknown: 'bin' }
  return byType[asset.type]
}

export const safeFileSegment = (value: string, fallback = 'file') => {
  const segment = value.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[.-]+|[.-]+$/g, '').slice(0, 80)
  return segment || fallback
}

export const assetExportPath = (asset: AssetDefinition) => {
  const baseName = asset.name.replace(/\.[^/.]+$/, '')
  return `assets/${safeFileSegment(baseName, 'asset')}-${safeFileSegment(asset.id.slice(-8), 'resource')}.${extensionForAsset(asset)}`
}

export const buildAssetUrlMap = (assets: Record<string, AssetDefinition>, exported = false) => Object.fromEntries(Object.values(assets).sort((a, b) => a.id.localeCompare(b.id)).map((asset) => [asset.id, exported ? assetExportPath(asset) : asset.source]))

export const validateRelativeExportPath = (value: string) => {
  if (!value || value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value)) throw new Error(`Export path must be relative: ${value}`)
  const normalized = value.replaceAll('\\', '/')
  if (normalized.split('/').some((segment) => segment === '..' || segment === '')) throw new Error(`Export path contains traversal: ${value}`)
  return normalized
}
