# WebForge Visual architecture audit

Date: 2026-09-26
Branch: `arena/01a0dcf1-nevertheless`

## Current architecture summary

WebForge Visual is a Vite-rendered React application with a secure Electron shell. The editor document now acts as the source of truth for scene entities and editor resources. React keeps the existing workspace presentation, Zustand exposes a compatibility projection for the current panels, command objects mutate cloned documents, and `SceneRuntime` synchronizes the document projection with a persistent Three.js runtime.

This is an incremental refactor. The existing UI was preserved rather than replaced. The current milestone covers the document boundary, command-backed mutations, real parent/child relationships, grouping/ungrouping, and persistent Three.js synchronization. Materials, assets, and animation values remain intentionally smaller follow-up milestones.

## Dependency flow

```text
Electron main / preload
          ↓ secure IPC
React panels and shortcuts
          ↓ editor actions
Zustand editor store
          ↓ commands mutate cloned document
EditorDocument v2
          ↓ SceneObject compatibility projection
Persistent SceneRuntime registry
          ↓ controlled lifecycle updates
Three.js Object3D graph
```

## State ownership map

| State | Owner | Notes |
| --- | --- | --- |
| Persistent entities, hierarchy, materials, assets, animations, settings | `EditorDocument` in `src/editor/document/` | Versioned document source of truth |
| Undoable mutations | `EditorCommand[]` in Zustand history | Commands hold affected before/after data rather than full scene snapshots |
| Selected entity and UI mode | Zustand editor store | Selection uses stable entity IDs |
| Runtime `Object3D`, renderer, camera, controls, registry | `SceneRuntime` | Never stored in React or serialized into project files |
| Workspace layout and panel state | React components in `App.tsx` | Incremental extraction target; does not own Three.js objects |
| Native file operations | Electron main + preload | Renderer only receives narrow `webforge` bridge methods |

## Subsystem map

| Subsystem | Current file(s) | Responsibility |
| --- | --- | --- |
| Electron main | `electron/main.cjs` | Creates `BrowserWindow`, native dialogs, and IPC handlers |
| Electron bridge | `electron/preload.cjs`, `src/env.d.ts` | Exposes save/open without Node integration |
| Renderer bootstrap | `src/main.tsx`, `index.html` | Mounts React and global styles |
| Workspace UI | `src/App.tsx` | Existing dark editor layout and panel composition |
| Document types | `src/editor/document/types.ts` | Entity, material, asset, animation, settings, and project schema types |
| Document operations | `src/editor/document/document.ts` | Legacy conversion, hierarchy, parenting, validation entry point, projection |
| Commands | `src/editor/commands/command.ts`, `sceneCommands.ts` | Create/delete/duplicate/transform/update/parent/composite operations |
| History | `src/editor/history/commandHistory.ts`, `editorStore.ts` | Bounded undo/redo command stacks |
| Editor state | `src/state/editorStore.ts` | Zustand adapter around document commands and UI state |
| Three.js runtime | `src/editor/scene/sceneRuntime.ts` | Persistent renderer, registry, diff sync, hierarchy, picking, gizmos, disposal |
| Viewport adapter | `src/editor/viewport/ThreeViewport.tsx` | Connects Zustand changes to `SceneRuntime` |
| Styling | `src/styles.css` | Existing dark editor visual system |
| Export | `exportHtml` in `src/App.tsx` | Minimal HTML export; full project exporter remains later |

## Functionality preserved

- Existing dark creative-software UI and panel layout
- Three.js viewport, camera, lights, grid, orbit controls, TransformControls
- Selection, inspector editing, visibility, locking, duplicate/delete
- Keyboard save/open/undo/redo/delete/duplicate/group shortcuts
- `.wfv` browser save/open and Electron preload save/open bridge
- Timeline UI and current keyframe display
- Preview modal and current standalone HTML export

## Functionality upgraded in this milestone

- Project payloads now serialize a version 2 `EditorDocument`.
- Legacy version 1 `{ projectName, objects }` payloads are migrated on load.
- Entities have stable IDs, parent IDs, children, type, visibility, locking, transforms, components, and metadata.
- Materials are represented in a document registry and entities reference material IDs.
- Group, ungroup, parent, delete subtree, and cycle prevention are implemented in document operations.
- Meaningful scene mutations now use command objects with execute/undo and a bounded history.
- TransformControls commits one command after a drag instead of a command per frame.
- The Three runtime updates existing objects in place and synchronizes parent/child Object3D relationships.
- Hidden and locked ancestor state propagates to runtime selection and transform behavior.

## Known prototype or incomplete functionality

- `App.tsx` still contains panel composition, keyboard routing, preview, and export; it should be extracted one subsystem at a time after the document boundary is stable.
- Inspector numeric input changes are individually command-backed; numeric-field transaction grouping is still pending.
- Animation tracks currently retain compatibility keyframe times; property values and interpolation are not implemented yet.
- Asset import acknowledges files but does not yet register, decode, preview, or attach GLTF/texture resources.
- Material registry exists in the document, but runtime material caching and sharing are not complete.
- Code view is a generated snippet, not Monaco or two-way code synchronization.
- HTML export is not yet a complete Vite/Three.js project exporter.
- Electron runtime launch depends on the Electron binary being available in the environment.

## Recommended incremental refactor order

1. **Document and command core** — current milestone; keep the `objects` projection temporarily for UI compatibility.
2. **Transform transactions and inspector validation** — group sliders/fields into explicit transactions.
3. **SceneRuntime hierarchy hardening** — preserve world transforms during reparenting and test resource cleanup.
4. **Material registry runtime** — cache/reuse Three.js materials and dispose only unreferenced resources.
5. **Asset registry** — stable IDs, Electron import, GLTF/texture loaders, thumbnails, and failure states.
6. **Animation tracks** — property values, linear interpolation, deterministic playback, save/load.
7. **Project validation and Electron Save As/autosave** — schema validation, migrations, filesystem errors.
8. **UI extraction** — toolbar, layers, inspector, timeline, assets, code, preview, and project dialogs.
9. **Web compiler/export** — deterministic generated source, isolated preview, production build test.

## Verification

```bash
npm run build
npm run dev
npm run preview
```

The browser renderer, TypeScript build, production bundle, and proxied dev/preview HTTP smoke tests pass. `npm run electron` builds successfully but the sandbox cannot download Electron's runtime artifact, so native window launch remains an environment limitation rather than a verified test.
