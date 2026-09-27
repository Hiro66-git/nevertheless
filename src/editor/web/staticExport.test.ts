import { describe, expect, it } from 'vitest'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
// @ts-expect-error The Electron-side CommonJS helper is intentionally kept outside the renderer TypeScript graph.
import { writeStaticExport, relativeExportPath } from '../../../electron/staticExport.cjs'

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
      expect((await fs.readdir(parent)).some((entry) => entry.includes('.tmp-'))).toBe(false)
      expect(relativeExportPath('assets\\icon.txt')).toBe('assets/icon.txt')
      expect(() => relativeExportPath('../outside.txt')).toThrow()
    } finally {
      await fs.rm(parent, { recursive: true, force: true })
    }
  })
})
