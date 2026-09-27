import { describe, expect, it } from 'vitest'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
// @ts-expect-error The Electron-side CommonJS helper is intentionally kept outside the renderer TypeScript graph.
import { getRuntimeFiles, safeExportName, writeStaticExport, relativeExportPath } from '../../../electron/staticExport.cjs'
import { createDocumentFromObjects } from '../document/document'
import { generateWebOutput, LOCAL_WEB_RUNTIME_URLS } from './webGenerator'

const enumerateFiles = async (directory: string, prefix = ''): Promise<string[]> => {
  const entries = await fs.readdir(path.join(directory, prefix), { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) files.push(...await enumerateFiles(directory, relative))
    else files.push(relative)
  }
  return files
}

describe('static export filesystem pipeline', () => {
  it('writes real files and embedded assets, then rejects unsafe or duplicate paths', async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'nevertheless-export-'))
    try {
      const payload = {
        projectName: 'Test / Project',
        files: [
          { path: 'index.html', contents: '<!doctype html>' },
          { path: 'styles.css', contents: 'body{}' },
          { path: 'scene.js', contents: 'console.log("ok")' },
        ],
        assets: [{ path: 'assets/icon.txt', source: 'data:text/plain;base64,aGVsbG8=' }],
      }
      const result = await writeStaticExport(parent, payload)
      expect(result.canceled).toBe(false)
      expect(await fs.readFile(path.join(result.directory, 'index.html'), 'utf8')).toBe('<!doctype html>')
      expect(await fs.readFile(path.join(result.directory, 'assets/icon.txt'), 'utf8')).toBe('hello')
      await expect(writeStaticExport(parent, payload)).rejects.toThrow()
      await expect(writeStaticExport(parent, { ...payload, projectName: 'Traversal', files: [{ path: '../outside.txt', contents: 'nope' }] })).rejects.toThrow(/relative|unsafe|traversal/i)
      await expect(writeStaticExport(parent, { ...payload, projectName: 'Duplicate', files: [{ path: 'index.html', contents: 'a' }, { path: 'index.html', contents: 'b' }] })).rejects.toThrow(/duplicate/i)
      await expect(writeStaticExport(parent, { ...payload, projectName: 'Remote', files: payload.files.map((file) => file.path === 'scene.js' ? { ...file, contents: "import 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js'" } : file) })).rejects.toThrow(/remote runtime/i)
      expect((await fs.readdir(parent)).some((entry) => entry.includes('.tmp-'))).toBe(false)
      expect(relativeExportPath('assets\\icon.txt')).toBe('assets/icon.txt')
      expect(() => relativeExportPath('../outside.txt')).toThrow()
      expect(() => relativeExportPath('/tmp/outside.txt')).toThrow()
      expect(() => relativeExportPath('\\server\\share\\outside.txt')).toThrow()
      expect(() => relativeExportPath('C:outside.txt')).toThrow()
      expect(() => relativeExportPath('assets/.hidden/../outside.txt')).toThrow()
      expect(() => relativeExportPath(`assets/${String.fromCharCode(0)}outside.txt`)).toThrow()
      expect(safeExportName('../../malicious name')).toBe('malicious-name')
      const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'nevertheless-outside-'))
      await fs.symlink(outside, path.join(parent, 'symlink-export'), 'dir')
      await expect(writeStaticExport(parent, { ...payload, projectName: '../../symlink' })).rejects.toThrow()
      expect((await fs.lstat(path.join(parent, 'symlink-export'))).isSymbolicLink()).toBe(true)
      await expect(fs.stat(path.join(outside, 'index.html'))).rejects.toThrow()
      await fs.rm(outside, { recursive: true, force: true })
    } finally {
      await fs.rm(parent, { recursive: true, force: true })
    }
  })

  it('emits a complete self-contained runtime layout for generated output', async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'nevertheless-portable-'))
    try {
      const output = generateWebOutput(createDocumentFromObjects([], 'Portable'), { runtimeUrls: LOCAL_WEB_RUNTIME_URLS })
      const result = await writeStaticExport(parent, {
        projectName: 'Portable',
        files: [
          { path: 'index.html', contents: output.indexHtml },
          { path: 'styles.css', contents: output.stylesCss },
          { path: 'scene.js', contents: output.sceneJs },
        ],
        assets: [],
      })
      const runtimeFiles = await getRuntimeFiles()
      for (const runtimeFile of runtimeFiles) {
        const emitted = await fs.readFile(path.join(result.directory, runtimeFile.path), 'utf8')
        expect(emitted).toBe(runtimeFile.contents)
        expect(emitted).not.toMatch(/(?:jsdelivr|unpkg|cdnjs|esm\\.sh|skypack)/i)
      }
      expect((await fs.readFile(path.join(result.directory, 'runtime/GLTFLoader.js'), 'utf8'))).not.toContain("from 'three'")
      const index = await fs.readFile(path.join(result.directory, 'index.html'), 'utf8')
      const scene = await fs.readFile(path.join(result.directory, 'scene.js'), 'utf8')
      expect(index).not.toMatch(/https?:\/\//)
      expect(scene).not.toMatch(/(?:jsdelivr|unpkg|cdnjs|esm\.sh|skypack)/i)
      expect((await enumerateFiles(result.directory)).sort()).toEqual(['index.html', 'runtime/BufferGeometryUtils.js', 'runtime/GLTFLoader.js', 'runtime/three.core.js', 'runtime/three.module.js', 'scene.js', 'styles.css'])
      const generatedSources = new Map([
        ['index.html', index],
        ['scene.js', scene],
        ['runtime/GLTFLoader.js', await fs.readFile(path.join(result.directory, 'runtime/GLTFLoader.js'), 'utf8')],
        ['runtime/three.core.js', await fs.readFile(path.join(result.directory, 'runtime/three.core.js'), 'utf8')],
        ['runtime/three.module.js', await fs.readFile(path.join(result.directory, 'runtime/three.module.js'), 'utf8')],
        ['runtime/BufferGeometryUtils.js', await fs.readFile(path.join(result.directory, 'runtime/BufferGeometryUtils.js'), 'utf8')],
      ])
      for (const [sourcePath, source] of generatedSources) {
        const references = [...source.matchAll(/(?:from\s+|import\(\s*|(?:src|href)=\s*)["'`]((?:\.\.?\/)[^"'`]+)["'`]/g)].map((match) => match[1])
        for (const reference of references) {
          const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), reference))
          await expect(fs.stat(path.join(result.directory, resolved))).resolves.toBeDefined()
        }
      }
    } finally {
      await fs.rm(parent, { recursive: true, force: true })
    }
  })

  it('rewrites declared GLTF JSON dependencies to local exported asset paths', async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'nevertheless-gltf-'))
    try {
      const encode = (value: string) => `data:application/json;base64,${Buffer.from(value).toString('base64')}`
      const modelPath = 'assets/scene-model.gltf'
      const bufferPath = 'assets/buffer-data.bin'
      const modelSource = encode(JSON.stringify({ asset: { version: '2.0' }, buffers: [{ uri: 'buffer.bin', byteLength: 0 }] }))
      const result = await writeStaticExport(parent, {
        projectName: 'GLTF',
        files: [
          { path: 'index.html', contents: '<!doctype html>' },
          { path: 'styles.css', contents: '' },
          { path: 'scene.js', contents: '' },
        ],
        assets: [
          { id: 'model-id', name: 'scene.gltf', type: 'model', path: modelPath, source: modelSource },
          { id: 'buffer-id', name: 'buffer.bin', type: 'unknown', path: bufferPath, source: 'data:application/octet-stream;base64,AA==' },
        ],
      })
      const exportedModel = JSON.parse(await fs.readFile(path.join(result.directory, modelPath), 'utf8'))
      expect(exportedModel.buffers[0].uri).toBe('buffer-data.bin')

      const glbJson = Buffer.from(JSON.stringify({ asset: { version: '2.0' }, images: [{ uri: 'texture.png' }] }))
      const glbJsonPadded = Buffer.alloc(Math.ceil(glbJson.length / 4) * 4, 0x20)
      glbJson.copy(glbJsonPadded)
      const glb = Buffer.alloc(20 + glbJsonPadded.length)
      glb.writeUInt32LE(0x46546c67, 0)
      glb.writeUInt32LE(2, 4)
      glb.writeUInt32LE(glb.length, 8)
      glb.writeUInt32LE(glbJsonPadded.length, 12)
      glb.writeUInt32LE(0x4e4f534a, 16)
      glbJsonPadded.copy(glb, 20)
      const glbResult = await writeStaticExport(parent, {
        projectName: 'GLB',
        files: [
          { path: 'index.html', contents: '<!doctype html>' },
          { path: 'styles.css', contents: '' },
          { path: 'scene.js', contents: '' },
        ],
        assets: [
          { id: 'glb-id', name: 'scene.glb', type: 'model', path: 'assets/scene.glb', source: `data:application/octet-stream;base64,${glb.toString('base64')}` },
          { id: 'texture-id', name: 'texture.png', type: 'image', path: 'assets/texture-data.png', source: 'data:image/png;base64,AA==' },
          { id: 'texture-kind-id', name: 'albedo.webp', type: 'texture', path: 'assets/albedo-data.webp', source: 'data:image/webp;base64,AA==' },
          { id: 'hdr-id', name: 'environment.hdr', type: 'hdr', path: 'assets/environment-data.hdr', source: 'data:image/vnd.radiance;base64,AA==' },
        ],
      })
      const exportedGlb = await fs.readFile(path.join(glbResult.directory, 'assets/scene.glb'))
      const exportedGlbJson = JSON.parse(exportedGlb.subarray(20, 20 + exportedGlb.readUInt32LE(12)).toString('utf8').trim())
      expect(exportedGlbJson.images[0].uri).toBe('texture-data.png')
      await expect(fs.stat(path.join(glbResult.directory, 'assets/albedo-data.webp'))).resolves.toBeDefined()
      await expect(fs.stat(path.join(glbResult.directory, 'assets/environment-data.hdr'))).resolves.toBeDefined()
    } finally {
      await fs.rm(parent, { recursive: true, force: true })
    }
  })
})
