import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { projectPayload, useEditorStore } from './state/editorStore'
import { ThreeViewport } from './editor/viewport/ThreeViewport'
import type { EditorMode, SceneObject, Tool } from './types'

const iconPaths: Record<string, string[]> = {
  logo: ['M12 3.7 20 8v8l-8 4.3L4 16V8l8-4.3Z', 'M12 8.2v8.9', 'M4.4 8.2 12 12l7.6-3.8'],
  select: ['M5 3.7 18.3 12l-6 1.2-2.6 5.8L5 3.7Z'],
  move: ['M12 3v18', 'm5 10 7-7 7 7', 'm5 14 7 7 7-7', 'M3 12h18', 'm10 5-7 7 7 7', 'm14 5 7 7-7 7'],
  rotate: ['M20 11a8.1 8.1 0 0 0-14.8-4.2L3 9', 'M3 4v5h5', 'M4 13a8.1 8.1 0 0 0 14.8 4.2L21 15', 'M21 20v-5h-5'],
  scale: ['M4 8V4h4', 'M20 8V4h-4', 'M4 16v4h4', 'M20 16v4h-4', 'M4 4l6 6', 'M20 4l-6 6', 'M4 20l6-6', 'M20 20l-6-6'],
  hand: ['M7 11V6a1.5 1.5 0 0 1 3 0v4', 'M10 9V4.8a1.5 1.5 0 0 1 3 0V10', 'M13 9V6a1.5 1.5 0 0 1 3 0v5', 'M16 11V8.5a1.5 1.5 0 0 1 3 0v5.7c0 3.2-2.5 5.8-5.7 5.8h-1.8c-2.1 0-3.3-1-4.6-2.5L5 13.4a1.5 1.5 0 0 1 2.1-2.1L10 14'],
  undo: ['M9 7 4 12l5 5', 'M4 12h10a6 6 0 0 1 6 6'],
  redo: ['m15 7 5 5-5 5', 'M20 12H10a6 6 0 0 0-6 6'],
  save: ['M5 4h12l3 3v13H4V4h13v5H7V4', 'M8 14h8v6H8z'],
  play: ['m8 5 11 7-11 7V5Z'],
  pause: ['M8 5v14', 'M16 5v14'],
  eye: ['M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z'],
  eyeOff: ['M3 3l18 18', 'M10.6 10.6a2 2 0 0 0 2.8 2.8', 'M9.9 5.1A11.6 11.6 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3.1 3.8', 'M6.2 6.2C3.6 8 2.5 12 2.5 12S6 19 12 19c1.2 0 2.3-.2 3.3-.6'],
  lock: ['M6 10V7a6 6 0 0 1 12 0v3', 'M5 10h14v10H5z', 'M12 14v2'],
  unlock: ['M6 10V7a6 6 0 0 1 10.8-3.6', 'M5 10h14v10H5z', 'M12 14v2'],
  search: ['m21 21-4.3-4.3', 'M10.7 18a7.3 7.3 0 1 0 0-14.6 7.3 7.3 0 0 0 0 14.6Z'],
  plus: ['M12 5v14', 'M5 12h14'],
  chevron: ['m9 18 6-6-6-6'],
  down: ['m6 9 6 6 6-6'],
  grid: ['M4 4h16v16H4z', 'M4 10h16', 'M10 4v16'],
  snap: ['M8 3v4', 'M16 3v4', 'M3 8h4', 'M17 8h4', 'M6 6h12v12H6z', 'M10 10h4v4h-4z'],
  more: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
  cube: ['m12 3 8 4.4v9.2l-8 4.4-8-4.4V7.4L12 3Z', 'm4.4 7.6 7.6 4 7.6-4', 'M12 11.6v9.2'],
  layers: ['M4 8.5 12 4l8 4.5-8 4-8-4Z', 'm4 12 8 4 8-4', 'm4 15.5 8 4 8-4'],
  image: ['M4 5h16v14H4z', 'm5 16 4-4 3 3 2-2 5 4', 'M9 9.2h.01'],
  code: ['m8 9-3 3 3 3', 'm16 9 3 3-3 3', 'm13 6-2 12'],
  folder: ['M3.5 6.5h6l1.7 2H20.5v10H3.5z', 'M3.5 6.5v-1h6l1.5 1h3'],
  cursor: ['M5 3.5 19 12l-6 1.5-2.3 6.1L5 3.5Z'],

  export: ['M12 3v12', 'm7 10 5 5 5-5', 'M5 20h14'],
  monitor: ['M4 5h16v11H4z', 'M9 20h6', 'M12 16v4'],
  tablet: ['M7 3h10v18H7z', 'M11.9 18h.01'],
  phone: ['M8 3h8v18H8z', 'M11.9 18h.01'],
  camera: ['M4 7h3l1.2-2h7.6L17 7h3v11H4V7Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  light: ['M9 18h6', 'M10 21h4', 'M8.5 14.5a6 6 0 1 1 7 0c-.8.6-1.3 1.3-1.5 2.5h-4c-.2-1.2-.7-1.9-1.5-2.5Z'],
  text: ['M5 5h14', 'M12 5v14', 'M8 19h8'],
  settings: ['M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z', 'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.5V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.5h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1A1.7 1.7 0 0 0 11.4 6a1.7 1.7 0 0 0 1-1.6V4h2.5v.4A1.7 1.7 0 0 0 16 6a1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2V13h-.2a1.7 1.7 0 0 0-1.6 1.9Z'],
}

function Icon({ name, size = 16, stroke = 1.7 }: { name: string; size?: number; stroke?: number }) {
  const paths = iconPaths[name] ?? iconPaths.cube
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{paths.map((path, i) => <path key={i} d={path} />)}</svg>
}

const toolList: { id: Tool; icon: string; label: string; shortcut: string }[] = [
  { id: 'select', icon: 'select', label: 'Select', shortcut: 'V' },
  { id: 'move', icon: 'move', label: 'Move', shortcut: 'G' },
  { id: 'rotate', icon: 'rotate', label: 'Rotate', shortcut: 'R' },
  { id: 'scale', icon: 'scale', label: 'Scale', shortcut: 'S' },
  { id: 'hand', icon: 'hand', label: 'Pan canvas', shortcut: 'H' },
]

function App() {
  const [toast, setToast] = useState<string | null>(null)
  const [commandOpen, setCommandOpen] = useState(false)
  const [assetsOpen, setAssetsOpen] = useState(false)
  const [inspectorTab, setInspectorTab] = useState<'properties' | 'code'>('properties')
  const [previewOpen, setPreviewOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const assetFileRef = useRef<HTMLInputElement>(null)
  const {
    mode, setMode, activeTool, setTool, selectedId, selectObject, objects, projectName, setDevice, device,
    snapToGrid, toggleSnap, showGrid, toggleGrid, undo, redo, past, future, saveProject, projectDirty,
    currentTime, setTime, isPlaying, togglePlaying, duplicateSelected, deleteSelected, addKeyframe,
  } = useEditorStore()
  const selected = objects.find((object) => object.id === selectedId) ?? null

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2400)
  }

  const handleSave = () => {
    const data = projectPayload(useEditorStore.getState())
    if (window.webforge) {
      void window.webforge.saveProject(data).then((result) => {
        if (!result.canceled) { saveProject(); notify('Project saved to disk') }
      })
      return
    }
    const blob = new Blob([data], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.wfv`
    link.click()
    URL.revokeObjectURL(link.href)
    saveProject()
    notify('Project saved to your downloads')
  }

  const handleExport = () => {
    const html = exportHtml(useEditorStore.getState().objects, projectName)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    link.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-site.html`
    link.click()
    URL.revokeObjectURL(link.href)
    notify('Production preview exported as HTML')
  }

  const handleOpenFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      useEditorStore.getState().loadProject(String(reader.result))
      notify('Project loaded')
    }
    reader.readAsText(file)
  }

  const handleAssetImport = (file: File) => {
    notify(`${file.name} received — scene attachment is experimental`)
  }

  const openProject = () => {
    if (window.webforge) {
      void window.webforge.openProject().then((result) => {
        if (result.payload) { useEditorStore.getState().loadProject(result.payload); notify('Project loaded from disk') }
      })
      return
    }
    fileRef.current?.click()
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey
      if (modifier && event.key.toLowerCase() === 's') { event.preventDefault(); handleSave(); return }
      if (modifier && event.key.toLowerCase() === 'o') { event.preventDefault(); openProject(); return }
      if (modifier && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(true); return }
      if (modifier && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); return }
      if (event.key === 'Delete' && selectedId) { deleteSelected(); notify('Layer deleted'); return }
      if (event.key === 'Escape') { setCommandOpen(false); return }
      const shortcuts: Record<string, Tool> = { v: 'select', g: 'move', r: 'rotate', s: 'scale', h: 'hand' }
      const tool = shortcuts[event.key.toLowerCase()]
      if (tool && !modifier && !(event.target instanceof HTMLInputElement)) setTool(tool)
      if (event.code === 'Space' && !(event.target instanceof HTMLInputElement)) { event.preventDefault(); togglePlaying() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deleteSelected, redo, undo, setTool, selectedId, togglePlaying])

  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setInterval(() => {
      const time = useEditorStore.getState().currentTime
      setTime(time >= 48 ? 0 : time + 1)
    }, 1000 / 24)
    return () => window.clearInterval(timer)
  }, [isPlaying, setTime])

  const objectCount = objects.filter((object) => object.kind === 'mesh').length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Icon name="logo" size={19} /></div>
          <div><div className="brand-name">WEBFORGE</div><div className="brand-sub">VISUAL <span>•</span> BETA</div></div>
        </div>
        <div className="project-switcher">
          <div className="project-dot" />
          <span>{projectName}</span>
          <Icon name="down" size={13} />
        </div>
        <div className="top-actions">
          <div className="save-state"><span className={projectDirty ? 'save-dot unsaved' : 'save-dot'} />{projectDirty ? 'Unsaved changes' : 'All changes saved'}</div>
          <div className="top-divider" />
          <button className="icon-button" disabled={!past.length} onClick={() => { undo(); notify('Undo') }} title="Undo (Ctrl+Z)"><Icon name="undo" /></button>
          <button className="icon-button" disabled={!future.length} onClick={() => { redo(); notify('Redo') }} title="Redo (Ctrl+Shift+Z)"><Icon name="redo" /></button>
          <div className="top-divider" />
          <button className="text-button" onClick={openProject}><Icon name="folder" /> Open</button>
          <button className="text-button" onClick={handleSave}><Icon name="save" /> Save</button>
          <button className="preview-button" onClick={() => setPreviewOpen(true)}><Icon name="play" size={14} /> Preview</button>
          <button className="export-button" onClick={handleExport}><Icon name="export" size={14} /> Export <Icon name="down" size={12} /></button>
        </div>
        <input ref={fileRef} className="visually-hidden" type="file" accept=".wfv,.json" onChange={(event) => event.target.files?.[0] && handleOpenFile(event.target.files[0])} />
        <input ref={assetFileRef} className="visually-hidden" type="file" accept="image/*,.glb,.gltf,.obj,.svg,.webp,.hdr,.mp4" onChange={(event) => event.target.files?.[0] && handleAssetImport(event.target.files[0])} />
      </header>

      <div className="workspace-bar">
        <div className="workspace-tabs">
          {(['design', 'motion', 'code'] as EditorMode[]).map((item) => <button key={item} className={`workspace-tab ${mode === item ? 'active' : ''}`} onClick={() => { setMode(item); if (item === 'code') setInspectorTab('code') }}>{item}<span className="tab-underline" /></button>)}
        </div>
        <div className="workspace-meta"><span className="live-pulse" /> Live sync <span className="meta-divider" /> <button onClick={() => notify('Experimental: workspace settings are not wired yet')}><Icon name="settings" size={14} /></button></div>
      </div>

      <main className="editor-layout">
        <aside className="left-sidebar">
          <div className="tool-rail">
            <div className="tool-section-label">TOOLS</div>
            {toolList.map((tool) => <button key={tool.id} className={`tool-button ${activeTool === tool.id ? 'active' : ''}`} onClick={() => setTool(tool.id)} title={`${tool.label} (${tool.shortcut})`}><Icon name={tool.icon} /><span>{tool.label}</span><kbd>{tool.shortcut}</kbd></button>)}
            <div className="tool-spacer" />
            <button className="tool-button" onClick={() => notify('Experimental: guides are not wired yet')}><Icon name="snap" /><span>Guides</span></button>
            <button className="tool-button" onClick={() => setCommandOpen(true)}><Icon name="search" /><span>Command</span><kbd>⌘K</kbd></button>
          </div>
          <div className="left-content">
            <div className="panel-heading"><div><span className="eyebrow">SCENE</span><h2>Layers</h2></div><button className="small-icon" onClick={() => notify('Experimental: layer options are not wired yet')}><Icon name="more" /></button></div>
            <div className="scene-toolbar"><div className="search-field"><Icon name="search" size={14} /><input placeholder="Search layers" /></div><button className="square-button" onClick={() => notify('Experimental: collections are not wired yet')}><Icon name="plus" size={15} /></button></div>
            <div className="collection-row"><Icon name="chevron" size={13} /><Icon name="layers" size={14} /><span>Landing / Hero</span><span className="collection-count">{objects.length}</span><button onClick={() => notify('Experimental: collection menus are not wired yet')}><Icon name="more" size={13} /></button></div>
            <div className="layer-list">{objects.map((object) => <LayerRow key={object.id} object={object} selected={object.id === selectedId} onSelect={() => selectObject(object.id)} />)}</div>
            <button className="add-layer-button" onClick={() => setCommandOpen(true)}><Icon name="plus" size={14} /> Add layer</button>
            <div className="panel-heading assets-heading"><div><span className="eyebrow">LIBRARY</span><h2>Assets</h2></div><button className="small-icon" onClick={() => setAssetsOpen(!assetsOpen)}><Icon name={assetsOpen ? 'down' : 'chevron'} size={14} /></button></div>
            {assetsOpen ? <AssetBrowser onImport={() => assetFileRef.current?.click()} /> : <AssetSummary onOpen={() => setAssetsOpen(true)} />}
          </div>
        </aside>

        <section className="canvas-column">
          <div className="canvas-toolbar">
            <div className="canvas-tabs"><button className="canvas-tab active"><span className="tab-status" /> Main scene <Icon name="down" size={12} /></button><button className="canvas-tab muted">Preview / 1440 × 900</button></div>
            <div className="canvas-controls"><button className="control-select" onClick={() => notify('Experimental: camera selector is not wired yet')}><Icon name="camera" size={14} /> Perspective <Icon name="down" size={12} /></button><button className={`control-toggle ${showGrid ? 'on' : ''}`} onClick={toggleGrid}><Icon name="grid" size={14} /> Grid</button><button className={`control-toggle ${snapToGrid ? 'on' : ''}`} onClick={toggleSnap}><Icon name="snap" size={14} /> Snap</button><div className="toolbar-divider" /><button className="viewport-icon" onClick={() => notify('Experimental: frame-to-selection is not wired yet')}><span className="frame-icon" /></button><button className="viewport-icon" onClick={() => notify('Experimental: viewport options are not wired yet')}><Icon name="more" /></button></div>
          </div>
          <div className="canvas-stage">
            <ThreeViewport />
            <div className="viewport-overlay top-left"><span className="badge badge-teal">DESIGN</span><span className="overlay-caption">Scene / Landing Hero</span></div>
            <div className="viewport-overlay top-right"><span className="fps-indicator"><i /> 60 FPS</span><span className="overlay-caption">WebGL2</span></div>
            <div className="viewport-overlay bottom-left"><span className="axis axis-x">X</span><span className="axis axis-y">Y</span><span className="axis axis-z">Z</span></div>
            <div className="viewport-overlay bottom-center"><button className="zoom-button" onClick={() => notify('Viewport centered')}><span>100%</span><Icon name="down" size={11} /></button><span className="stage-hint">{activeTool === 'select' ? 'Click an object to select' : `${activeTool[0].toUpperCase()}${activeTool.slice(1)} mode active`}</span></div>
          </div>
        </section>

        <aside className="right-sidebar">
          <div className="inspector-tabs"><button className={inspectorTab === 'properties' ? 'active' : ''} onClick={() => setInspectorTab('properties')}>Inspector</button><button className={inspectorTab === 'code' ? 'active' : ''} onClick={() => setInspectorTab('code')}><Icon name="code" size={14} /> Code</button><button className="tab-more" onClick={() => notify('Experimental: inspector layout options are not wired yet')}><Icon name="more" size={14} /></button></div>
          {inspectorTab === 'code' || mode === 'code' ? <CodeInspector objects={objects} onBack={() => { setInspectorTab('properties'); setMode('design') }} /> : <Inspector object={selected} currentTime={currentTime} onNotify={notify} onAddKeyframe={() => selected && addKeyframe(selected.id)} />}
        </aside>
      </main>

      <Timeline objects={objects} currentTime={currentTime} setTime={setTime} isPlaying={isPlaying} togglePlaying={togglePlaying} selectedId={selectedId} onSelect={selectObject} onAddKeyframe={() => selected && addKeyframe(selected.id)} onNotify={notify} />
      <CommandPalette open={commandOpen} close={() => setCommandOpen(false)} onAction={(action) => { setCommandOpen(false); action() }} notify={notify} />
      {previewOpen && <PreviewModal html={exportHtml(objects, projectName)} close={() => setPreviewOpen(false)} />}
      {toast && <div className="toast"><span className="toast-check">✓</span>{toast}</div>}
    </div>
  )
}

function LayerRow({ object, selected, onSelect }: { object: SceneObject; selected: boolean; onSelect: () => void }) {
  const { toggleVisibility, toggleLock } = useEditorStore()
  return <div className={`layer-row ${selected ? 'selected' : ''} ${!object.visible ? 'hidden-layer' : ''}`} onClick={onSelect}>
    <span className="layer-indent">{object.parentId ? <span className="branch" /> : null}</span><span className={`layer-kind kind-${object.kind}`}><Icon name={object.kind === 'light' ? 'light' : object.kind === 'text' ? 'text' : object.kind === 'camera' ? 'camera' : object.kind === 'group' ? 'layers' : 'cube'} size={14} /></span><span className="layer-name">{object.name}</span>{object.keyframes.length > 0 && <span className="keyframe-mini" />}
    <button className="row-action" onClick={(event) => { event.stopPropagation(); toggleVisibility(object.id) }}><Icon name={object.visible ? 'eye' : 'eyeOff'} size={13} /></button><button className="row-action" onClick={(event) => { event.stopPropagation(); toggleLock(object.id) }}><Icon name={object.locked ? 'lock' : 'unlock'} size={13} /></button>
  </div>
}

function AssetSummary({ onOpen }: { onOpen: () => void }) {
  return <div className="asset-summary" onClick={onOpen}><div className="asset-thumb asset-orb"><span /></div><div className="asset-thumb asset-image"><Icon name="image" size={17} /></div><div className="asset-thumb asset-model"><Icon name="cube" size={17} /></div><div className="asset-add"><Icon name="plus" size={15} /></div><span className="asset-more-label">12 assets</span></div>
}

function AssetBrowser({ onImport }: { onImport: () => void }) {
  return <div className="asset-browser"><div className="asset-filter"><button className="active">All</button><button>Images</button><button>3D</button><button>Fonts</button></div><div className="asset-grid"><div className="asset-card asset-orb"><span /><small>gradient-orb</small></div><div className="asset-card asset-image"><Icon name="image" size={20} /><small>hero-texture</small></div><div className="asset-card asset-model"><Icon name="cube" size={20} /><small>shape.glb</small></div><button className="asset-card import-card" onClick={onImport}><Icon name="plus" size={20} /><small>Import asset</small></button></div></div>
}

function Inspector({ object, currentTime, onNotify, onAddKeyframe }: { object: SceneObject | null; currentTime: number; onNotify: (message: string) => void; onAddKeyframe: () => void }) {
  const { updateObject, updateTransform } = useEditorStore()
  if (!object) return <div className="empty-inspector"><div className="empty-orbit"><Icon name="select" size={22} /></div><strong>Select an object</strong><span>Choose a layer or click an object in the viewport to edit its properties.</span></div>
  return <div className="inspector-content">
    <div className="selection-header"><div className={`selection-icon kind-${object.kind}`}><Icon name={object.kind === 'light' ? 'light' : object.kind === 'text' ? 'text' : 'cube'} size={17} /></div><div><div className="selection-name">{object.name}</div><div className="selection-type">{object.kind === 'mesh' ? `Mesh · ${object.shape}` : object.kind}</div></div><button className="small-icon" onClick={() => onNotify('Experimental: object actions are not wired yet')}><Icon name="more" /></button></div>
    <div className="property-section open"><SectionHeader label="Transform" icon="move" /><div className="transform-grid"><TransformField label="X" value={object.position[0]} onChange={(value) => updateTransform(object.id, 'position', 0, value)} /><TransformField label="Y" value={object.position[1]} onChange={(value) => updateTransform(object.id, 'position', 1, value)} /><TransformField label="Z" value={object.position[2]} onChange={(value) => updateTransform(object.id, 'position', 2, value)} /></div><div className="transform-row-label"><span>Rotation</span><button onClick={() => updateObject(object.id, { rotation: [0, 0, 0] })}>Reset</button></div><div className="transform-grid"><TransformField label="X" value={radToDeg(object.rotation[0])} suffix="°" onChange={(value) => updateTransform(object.id, 'rotation', 0, degToRad(value))} /><TransformField label="Y" value={radToDeg(object.rotation[1])} suffix="°" onChange={(value) => updateTransform(object.id, 'rotation', 1, degToRad(value))} /><TransformField label="Z" value={radToDeg(object.rotation[2])} suffix="°" onChange={(value) => updateTransform(object.id, 'rotation', 2, degToRad(value))} /></div><div className="transform-row-label"><span>Scale <button className="link-icon" onClick={() => onNotify('Experimental: linked scaling is not wired yet')}><span className="link-shape">∞</span></button></span><button onClick={() => updateObject(object.id, { scale: [1, 1, 1] })}>Reset</button></div><div className="transform-grid"><TransformField label="X" value={object.scale[0]} onChange={(value) => updateTransform(object.id, 'scale', 0, value)} /><TransformField label="Y" value={object.scale[1]} onChange={(value) => updateTransform(object.id, 'scale', 1, value)} /><TransformField label="Z" value={object.scale[2]} onChange={(value) => updateTransform(object.id, 'scale', 2, value)} /></div></div>
    <div className="property-section open"><SectionHeader label="Appearance" icon="eye" /><div className="color-row"><div className="color-swatch" style={{ background: object.color }} /><div><span className="field-label">Color</span><span className="color-value">{object.color.toUpperCase()}</span></div><input className="native-color" type="color" value={object.color} onChange={(event) => updateObject(object.id, { color: event.target.value })} /></div><div className="slider-field"><div className="slider-label"><span>Opacity</span><span>{Math.round(object.opacity * 100)}%</span></div><input type="range" min="0" max="1" step="0.01" value={object.opacity} onChange={(event) => updateObject(object.id, { opacity: Number(event.target.value) })} /></div></div>
    {object.kind === 'mesh' && <div className="property-section open"><SectionHeader label="Material" icon="cube" /><div className="material-card"><div className="material-preview" style={{ background: `linear-gradient(145deg, ${object.accent}, ${object.color})` }}><span className="material-gloss" /></div><div className="material-copy"><strong>Frosted {object.shape === 'sphere' ? 'Glass' : 'Surface'}</strong><span>MeshPhysicalMaterial</span></div><button onClick={() => onNotify('Experimental: material editor is planned for a later phase')}><Icon name="chevron" size={14} /></button></div><div className="slider-field"><div className="slider-label"><span>Roughness</span><span>{object.roughness.toFixed(2)}</span></div><input type="range" min="0" max="1" step="0.01" value={object.roughness} onChange={(event) => updateObject(object.id, { roughness: Number(event.target.value) })} /></div><div className="slider-field"><div className="slider-label"><span>Metalness</span><span>{object.metalness.toFixed(2)}</span></div><input type="range" min="0" max="1" step="0.01" value={object.metalness} onChange={(event) => updateObject(object.id, { metalness: Number(event.target.value) })} /></div></div>}
    <div className="property-section"><SectionHeader label="Animation" icon="play" right={<button className="keyframe-button" onClick={onAddKeyframe}><span>◆</span> Add keyframe</button>} /><div className="animation-note"><span className="animated-dot" /> {object.keyframes.length ? `${object.keyframes.length} keyframes in timeline` : 'No animated properties yet'} <span className="time-code">{formatTime(currentTime)}</span></div></div>
    <div className="property-section"><SectionHeader label="Interactions" icon="cursor" right={<button className="mini-add" onClick={() => onNotify('Experimental: interaction graph is planned for a later phase')}><Icon name="plus" size={13} /></button>} /></div>
  </div>
}

function TransformField({ label, value, suffix, onChange }: { label: string; value: number; suffix?: string; onChange: (value: number) => void }) { return <label className="transform-field"><span>{label}</span><input type="number" step="0.01" value={Number(value.toFixed(2))} onChange={(event) => onChange(Number(event.target.value))} /><em>{suffix}</em></label> }
function SectionHeader({ label, icon, right }: { label: string; icon: string; right?: ReactNode }) { return <div className="section-header"><span><Icon name={icon} size={14} />{label}</span>{right ?? <Icon name="down" size={13} />}</div> }
function CodeInspector({ objects, onBack }: { objects: SceneObject[]; onBack: () => void }) { const snippet = `const scene = new THREE.Scene()\n\nconst heroOrb = new THREE.Mesh(\n  new THREE.SphereGeometry(0.95, 64, 32),\n  new THREE.MeshPhysicalMaterial({\n    color: '${objects[0]?.color ?? '#77e5ca'}',\n    roughness: ${objects[0]?.roughness ?? 0.16},\n    metalness: ${objects[0]?.metalness ?? 0.22}\n  })\n)\nheroOrb.position.set(${objects[0]?.position.map((value) => value.toFixed(2)).join(', ') ?? '0, 0, 0'})\nscene.add(heroOrb)`; return <div className="code-inspector"><div className="code-header"><span><span className="file-dot green" /> scene.ts</span><button onClick={onBack}>Back to inspector</button></div><div className="code-editor"><pre>{snippet.split('\n').map((line, i) => <code key={i}><i>{String(i + 1).padStart(2, '0')}</i><span>{highlightCode(line)}</span></code>)}</pre></div><div className="code-footer"><span><i className="status-dot" /> Generated from scene</span><button onClick={() => navigator.clipboard?.writeText(snippet)}>Copy code</button></div></div> }
function highlightCode(line: string) { const parts = line.split(/(const|new|THREE\.[A-Za-z]+|color|roughness|metalness|position|scene|add|true|false|'[^']*'|\d+(?:\.\d+)?)/g); return parts.map((part, index) => <span key={index} className={/^(const|new)$/.test(part) ? 'tok-key' : /^THREE\./.test(part) ? 'tok-class' : /^(color|roughness|metalness|position|scene|add)$/.test(part) ? 'tok-prop' : /^'/.test(part) ? 'tok-string' : /^\d/.test(part) ? 'tok-number' : ''}>{part}</span>) }

function Timeline({ objects, currentTime, setTime, isPlaying, togglePlaying, selectedId, onSelect, onAddKeyframe, onNotify }: { objects: SceneObject[]; currentTime: number; setTime: (time: number) => void; isPlaying: boolean; togglePlaying: () => void; selectedId: string | null; onSelect: (id: string) => void; onAddKeyframe: () => void; onNotify: (message: string) => void }) {
  const tickMarks = Array.from({ length: 13 }, (_, i) => i * 4)
  return <section className="timeline-panel"><div className="timeline-head"><div className="timeline-title"><span className="eyebrow">ANIMATION</span><h2>Timeline</h2><span className="timeline-version">Scene animation</span></div><div className="timeline-actions"><button className="small-icon" onClick={() => onNotify('Experimental: timeline settings are not wired yet')}><Icon name="settings" size={14} /></button><button className="small-icon" onClick={() => onNotify('Experimental: timeline menu is not wired yet')}><Icon name="more" size={14} /></button></div></div><div className="timeline-main"><div className="timeline-track-head"><div className="track-head-label">TRACKS <span>⌄</span></div><button className="track-add" onClick={onAddKeyframe}><Icon name="plus" size={13} /> Track</button><div className="track-controls"><button onClick={() => onNotify('Experimental: timeline zoom is not wired yet')}>−</button><span>100%</span><button onClick={() => onNotify('Experimental: timeline zoom is not wired yet')}>+</button><button onClick={() => onNotify('Experimental: timeline fit is not wired yet')}>⊡</button></div></div><div className="timeline-ruler"><div className="ruler-label">00:00:00</div><div className="ruler-scale">{tickMarks.map((tick) => <button key={tick} style={{ left: `${(tick / 48) * 100}%` }} onClick={() => setTime(tick)}>{String(Math.floor(tick / 24)).padStart(2, '0')}:{String(tick % 24).padStart(2, '0')}</button>)}</div></div><div className="tracks-area"><div className="track-list">{objects.filter((object) => object.keyframes.length || object.id === selectedId).slice(0, 4).map((object) => <div className={`timeline-track-row ${object.id === selectedId ? 'active' : ''}`} key={object.id} onClick={() => onSelect(object.id)}><span className="track-expand">⌄</span><span className={`track-dot kind-${object.kind}`}><Icon name={object.kind === 'light' ? 'light' : 'cube'} size={11} /></span><span>{object.name}</span><span className="track-lock"><Icon name="lock" size={11} /></span></div>)}<div className="timeline-track-row muted-row"><span className="track-expand">⌄</span><span className="track-dot"><Icon name="code" size={11} /></span><span>Scene events</span></div></div><div className="keyframe-area"><div className="playhead" style={{ left: `${(currentTime / 48) * 100}%` }}><span /></div>{objects.filter((object) => object.keyframes.length || object.id === selectedId).slice(0, 4).map((object, row) => <div className="keyframe-row" key={object.id} style={{ top: row * 31 }}>{object.keyframes.map((frame) => <button key={frame} className="diamond" style={{ left: `${(frame / 48) * 100}%` }} onClick={(event) => { event.stopPropagation(); setTime(frame) }} />)}{object.keyframes.length === 0 && <button className="empty-keyframe-line" onClick={onAddKeyframe}>+ add keyframe</button>}</div>)}</div></div></div><div className="timeline-footer"><div className="transport"><button className="small-icon" onClick={() => setTime(0)}>«</button><button className="small-icon" onClick={() => setTime(Math.max(0, currentTime - 1))}>‹</button><button className="play-button" onClick={togglePlaying}><Icon name={isPlaying ? 'pause' : 'play'} size={13} /></button><button className="small-icon" onClick={() => setTime(Math.min(48, currentTime + 1))}>›</button><button className="small-icon" onClick={() => setTime(48)}>»</button><span className="current-time">{formatTime(currentTime)} <small>/ 00:02:00</small></span></div><div className="timeline-hint"><span className="key-hint">Space</span> Play / pause <span className="key-hint">⌘ Z</span> Undo</div><div className="timeline-end"><span>24 fps</span><span>48 frames</span></div></div></section>
}

function CommandPalette({ open, close, onAction, notify }: { open: boolean; close: () => void; onAction: (action: () => void) => void; notify: (message: string) => void }) {
  const { setTool, addObject, setMode, setDevice, resetScene, duplicateSelected, deleteSelected } = useEditorStore()
  const commands = [{ icon: 'select', label: 'Select tool', shortcut: 'V', action: () => setTool('select') }, { icon: 'move', label: 'Move tool', shortcut: 'G', action: () => setTool('move') }, { icon: 'cube', label: 'Add mesh', shortcut: '', action: () => addObject('mesh', 'box') }, { icon: 'light', label: 'Add light', shortcut: '', action: () => addObject('light') }, { icon: 'layers', label: 'Duplicate selected', shortcut: '⌘D', action: () => duplicateSelected() }, { icon: 'eyeOff', label: 'Delete selected', shortcut: '⌫', action: () => deleteSelected() }, { icon: 'code', label: 'Open code view', shortcut: '', action: () => setMode('code') }, { icon: 'monitor', label: 'Desktop preview', shortcut: '', action: () => setDevice('desktop') }, { icon: 'settings', label: 'Reset scene', shortcut: '', action: () => resetScene() }]
  if (!open) return null
  return <div className="modal-backdrop" onMouseDown={close}><div className="command-palette" onMouseDown={(event) => event.stopPropagation()}><div className="command-search"><Icon name="search" /><input autoFocus placeholder="Search tools, layers, assets…" /><kbd>ESC</kbd></div><div className="command-section-label">QUICK ACTIONS</div>{commands.map((command, i) => <button key={command.label} className={`command-row ${i === 0 ? 'focused' : ''}`} onClick={() => onAction(() => { command.action(); notify(`${command.label} ready`) })}><span className="command-icon"><Icon name={command.icon} size={15} /></span><span>{command.label}</span>{command.shortcut && <kbd>{command.shortcut}</kbd>}</button>)}<div className="command-footer"><span>↑↓ Navigate</span><span>↵ Run command</span><span>⌘K Toggle</span></div></div></div>
}

function PreviewModal({ html, close }: { html: string; close: () => void }) {
  return <div className="preview-backdrop" onMouseDown={close}><div className="preview-window" onMouseDown={(event) => event.stopPropagation()}><div className="preview-window-head"><div className="preview-window-title"><span className="live-pulse" /> Preview <span>/</span> Lumen / Launch Experience</div><div className="preview-window-actions"><span>1440 × 900</span><button onClick={close}><Icon name="more" size={15} /></button><button className="close-preview" onClick={close}>×</button></div></div><iframe title="Published WebForge preview" srcDoc={html} /></div></div>
}

function radToDeg(value: number) { return value * 180 / Math.PI }
function degToRad(value: number) { return value * Math.PI / 180 }
function formatTime(frame: number) { return `00:00:${String(Math.floor(frame / 24)).padStart(2, '0')}.${String(frame % 24).padStart(2, '0')}` }
function exportHtml(objects: SceneObject[], name: string) { const scene = JSON.stringify(objects); return `<!doctype html>\n<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title><style>html,body{margin:0;height:100%;background:#0d1115;color:#eef3f1;font:16px system-ui;overflow:hidden}main{height:100%;display:grid;place-items:center;background:radial-gradient(circle at 50% 42%,#173b3c,#0d1115 55%)}h1{font-weight:500;letter-spacing:-.04em;font-size:clamp(42px,8vw,120px);margin:0}p{color:#91a29f;letter-spacing:.14em;text-transform:uppercase;font-size:11px;text-align:center}</style></head><body><main><div><p>WebForge Visual / published scene</p><h1>Lumen / 24</h1></div></main><script>window.__WEBFORGE_SCENE__=${scene}</script></body></html>` }

export default App
