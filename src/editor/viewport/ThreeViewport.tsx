import { useEffect, useRef } from 'react'
import { useEditorStore } from '../../state/editorStore'
import type { RuntimeTransform } from '../scene/sceneRuntime'
import { SceneRuntime } from '../scene/sceneRuntime'

export function ThreeViewport() {
  const mountRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<SceneRuntime | null>(null)
  const document = useEditorStore((state) => state.document)
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const activeTool = useEditorStore((state) => state.activeTool)
  const showGrid = useEditorStore((state) => state.showGrid)
  const snapToGrid = useEditorStore((state) => state.snapToGrid)
  const currentTime = useEditorStore((state) => state.currentTime)

  useEffect(() => {
    if (!mountRef.current) return
    const runtime = new SceneRuntime(mountRef.current, {
      onSelect: (id, additive) => useEditorStore.getState().selectObject(id, additive),
      onEmptySelect: (additive) => { if (!additive) useEditorStore.getState().clearSelection() },
      onTransformCommit: (id, _before: RuntimeTransform, after: RuntimeTransform) => {
        useEditorStore.getState().updateObject(id, after)
      },
    })
    runtimeRef.current = runtime
    const state = useEditorStore.getState()
    runtime.syncDocument(state.document, state.currentTime)
    runtime.setSelection(state.selectedIds)
    runtime.setGridVisible(state.showGrid)
    runtime.setSnap(state.snapToGrid, state.document.settings.snap.step)
    runtime.setTransformTool(state.activeTool)
    return () => {
      runtime.dispose()
      runtimeRef.current = null
    }
  }, [])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime) return
    runtime.syncDocument(document, currentTime)
    runtime.setSelection(selectedIds)
    runtime.setGridVisible(showGrid)
    runtime.setSnap(snapToGrid, document.settings.snap.step)
    runtime.setTransformTool(activeTool)
  }, [document, selectedId, selectedIds, showGrid, snapToGrid, activeTool, currentTime])

  return <div className="three-mount" ref={mountRef} aria-label="Three.js visual scene viewport" />
}
