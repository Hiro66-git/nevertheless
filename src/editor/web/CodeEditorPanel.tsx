import { useEffect, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import type { WebCodeFile } from './webDocumentTypes'

const languageFor = (file: WebCodeFile) => file === 'html' ? html() : file === 'css' ? css() : javascript()

export const formatCode = (file: WebCodeFile, source: string) => {
  const trimmed = source.trim()
  if (!trimmed) return ''
  if (file === 'html') return trimmed.replaceAll(/>\s*</g, '>\n<').split('\n').map((line) => line.trim()).join('\n')
  if (file === 'css') return trimmed.replaceAll('{', '{\n').replaceAll(';', ';\n').replaceAll('}', '\n}\n').split('\n').map((line) => line.trim()).filter(Boolean).join('\n')
  return trimmed.replaceAll(';', ';\n').split('\n').map((line) => line.trim()).filter(Boolean).join('\n')
}

export function CodeEditor({ file, value, onChange }: { file: WebCodeFile; value: string; onChange: (value: string) => void }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!hostRef.current) return
    const state = EditorState.create({
      doc: value,
      extensions: [basicSetup, languageFor(file), keymap.of([]), EditorView.updateListener.of((update) => {
        if (update.docChanged) onChangeRef.current(update.state.doc.toString())
      }), EditorView.theme({
        '&': { height: '100%', color: '#a9b9b6', backgroundColor: '#0e1416', fontSize: '11px' },
        '.cm-scroller': { overflow: 'auto', fontFamily: 'DM Mono, monospace' },
        '.cm-content': { padding: '14px 0', minHeight: '100%' },
        '.cm-line': { padding: '0 16px' },
        '.cm-gutters': { backgroundColor: '#0e1416', color: '#4e5e5d', border: '0' },
        '.cm-activeLine': { backgroundColor: '#152022' },
        '.cm-activeLineGutter': { backgroundColor: '#152022' },
        '.cm-cursor': { borderLeftColor: '#78e7ce' },
        '.cm-selectionBackground, ::selection': { backgroundColor: '#27504b !important' },
      })],
    })
    const view = new EditorView({ state, parent: hostRef.current })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [file])

  useEffect(() => {
    const view = viewRef.current
    if (!view || view.state.doc.toString() === value) return
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
  }, [value])

  return <div className="code-editor-surface" ref={hostRef} aria-label={`${file.toUpperCase()} code editor`} />
}
