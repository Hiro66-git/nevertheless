# WebForge Visual architecture audit

Date: 2026-09-26
Branch: `arena/01a0dcf1-nevertheless`

## Current architecture summary

WebForge Visual is a Vite-rendered React application with a secure Electron shell. The renderer currently owns the visual editor layout, reads/writes a Zustand scene store, and hosts a Three.js viewport. The initial implementation is a functional vertical slice, but it had a single `App.tsx` boundary and rebuilt the Three.js stage whenever scene state changed.

This milestone preserves the existing dark creative-software UI and extracts the Three.js runtime into a persistent editor module. React now describes the viewport host and forwards state changes; the runtime owns Three.js object lifecycles, picking, controls, selection helpers, and disposal.

## Subsystem map

| Subsystem | Current file(s) | Responsibility |
| --- | --- | --- |
| Electron main | `electron/main.cjs` | Creates `BrowserWindow`, native dialogs, and IPC handlers |
| Electron bridge | `electron/preload.cjs`, `src/env.d.ts` | Exposes the narrow `webforge` API with context isolation |
| Renderer bootstrap | `src/main.tsx`, `index.html` | Mounts React and global styles |
| Editor composition | `src/App.tsx` | Existing workspace layout and panel composition; still the next refactor target |
| Editor state | `src/state/editorStore.ts` | Zustand scene entities, selection, history, timeline state, project save/load |
| Domain types | `src/types.ts` | `SceneObject`, editor modes, tools, and device types |
| Three.js runtime | `src/editor/scene/sceneRuntime.ts` | Persistent renderer, scene, camera, controls, entity registry, diff sync, picking, gizmos, disposal |
| Viewport adapter | `src/editor/viewport/ThreeViewport.tsx` | Connects React/Zustand changes to `SceneRuntime` without owning Three.js entities |
| Styling | `src/styles.css` | Dark editor visual system and responsive layout rules |
| Export | `exportHtml` in `src/App.tsx` | Current minimal standalone HTML export; requires a later exporter module |

## Previously prototype or partially wired functionality

- The viewport rebuilt the entire stage from the Zustand object array on ordinary updates.
- `App.tsx` contained Three.js initialization, object creation, selection, pointer picking, transform controls, inspector UI, timeline UI, and export behavior.
- The store used snapshot history instead of commands, so continuous transform gestures were not grouped as transactions.
- Keyframes stored times only; no property values or interpolation were represented.
- Asset import acknowledged a file but did not register or load it into the scene.
- The generated code panel was a derived snippet, not a two-way code project.
- HTML export produced a minimal standalone page rather than a Vite/Three.js project.
- Several secondary panel controls are intentionally marked experimental instead of reporting false success.

## Incremental refactor order

1. **Editor core boundary** — completed in this milestone with a persistent `SceneRuntime` and a viewport adapter.
2. **Scene model** — add parent IDs, groups, materials, assets, metadata, and versioned entities without breaking current `SceneObject` consumers.
3. **Command/history layer** — replace arbitrary snapshots with executable commands and transaction grouping.
4. **Inspector synchronization** — move panel editing operations behind command APIs and validate numeric input.
5. **Material and asset registries** — stable resource IDs, reuse, previews, and disposal.
6. **Animation model** — tracks with property values, interpolation, and runtime evaluation.
7. **Project schema and Electron filesystem services** — versioning, validation, migrations, Save As, autosave, and reopen tests.
8. **Web compiler/export pipeline** — deterministic generated source and isolated preview.
9. **UI extraction** — split `App.tsx` one panel at a time after engine boundaries are stable.

## Milestone verification

```bash
npm run build
npm run dev
npm run preview
```

The browser renderer and production build are passing. Electron launch remains environment-dependent because the sandbox cannot download the Electron runtime artifact.
