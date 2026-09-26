import { useEffect, useRef } from 'react'
import { useEditorStore } from '../../state/editorStore'
import type { RuntimeTransform } from '../scene/sceneRuntime'
import { SceneRuntime } from '../scene/sceneRuntime'

export function ThreeViewport() {
  const mountRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<SceneRuntime | null>(null)
  const objects = useEditorStore((state) => state.objects)
  const selectedId = useEditorStore((state) => state.selectedId)
  const activeTool = useEditorStore((state) => state.activeTool)
  const showGrid = useEditorStore((state) => state.showGrid)

  useEffect(() => {
    if (!mountRef.current) return
    const runtime = new SceneRuntime(mountRef.current, {
      onSelect: (id) => useEditorStore.getState().selectObject(id),
      onTransformCommit: (id, transform: RuntimeTransform) => {
        useEditorStore.getState().updateObject(id, transform)
      },
    })
    runtimeRef.current = runtime
    runtime.syncObjects(useEditorStore.getState().objects)
    runtime.setSelection(useEditorStore.getState().selectedId)
    runtime.setGridVisible(useEditorStore.getState().showGrid)
    runtime.setTransformTool(useEditorStore.getState().activeTool)
    return () => {
      runtime.dispose()
      runtimeRef.current = null
    }
  }, [])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime) return
    runtime.syncObjects(objects)
    runtime.setSelection(selectedId)
    runtime.setGridVisible(showGrid)
    runtime.setTransformTool(activeTool)
  }, [objects, selectedId, showGrid, activeTool])

  return <div className="three-mount" ref={mountRef} aria-label="Three.js visual scene viewport" />
}
