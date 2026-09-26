<div align="center">

# ◈ WEBFORGE / VISUAL

### A focused creative workspace for building interactive Three.js experiences.

[![Build](https://img.shields.io/badge/build-passing-72e1ca?style=flat-square&labelColor=111619)](https://github.com/Hiro66-git/nevertheless)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-8d9aff?style=flat-square&labelColor=111619)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-78e7ce?style=flat-square&labelColor=111619)](https://threejs.org/)
[![Electron](https://img.shields.io/badge/Electron-secure-9bc7ff?style=flat-square&labelColor=111619)](https://www.electronjs.org/)

**Visual composition first. Code when you need it.**

</div>

---

## The product

WebForge Visual is a dark, production-minded editor shell for composing web scenes without starting in a blank code editor. It brings the mental model of Photoshop, Figma, Blender, and DaVinci Resolve into one focused workspace:

- **Compose** in a real Three.js viewport.
- **Organize** objects in a scene hierarchy.
- **Tune** transforms and materials in a context-aware inspector.
- **Animate** with a compact timeline and keyframes.
- **Preview and export** a working web artifact.
- **Inspect the generated scene code** without leaving the workspace.

This repository intentionally ships a verified vertical slice instead of pretending every advanced feature is finished. Each phase below records what is real today and what is deliberately deferred.

## Current workspace

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ WEBFORGE   Lumen / Launch Experience       Design  Motion  Code    Preview   │
├────────────┬───────────────────────────────────────────────┬─────────────────┤
│ tool rail  │                                               │                 │
│            │             Three.js composition                │   Inspector     │
│ Layers     │        orbit · grid · selection · gizmos        │   transform     │
│ Assets     │                                               │   material       │
├────────────┴───────────────────────────────────────────────┴─────────────────┤
│                            Animation timeline                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Verified in the current build

| Area | Working slice |
| --- | --- |
| Editor shell | Dark workspace, tool rail, layers, inspector, canvas toolbar, timeline, code view |
| Three.js viewport | Persistent WebGL runtime, camera, orbit controls, lighting, grid, fog, selection outline |
| Transform editing | Numeric transform fields and move / rotate / scale gizmos with one command per drag |
| Editor document | Version 2 document with stable entities, hierarchy, materials, assets, animations, and settings |
| Scene state | Typed Zustand adapter shared by hierarchy, inspector, timeline, and viewport |
| Layer workflow | Select, duplicate, delete, hide, lock, add mesh/light, reset, group, ungroup |
| History | Bounded command-based undo / redo |
| Project files | Version 2 `.wfv` serialization, legacy version 1 migration, browser/native open/save bridge |
| Animation | Timeline playhead, playback, scrubbing, keyframe creation |
| Output | Preview window and standalone HTML export |
| Desktop shell | Electron main/preload split with `contextIsolation` and no renderer Node access (launch check pending binary availability) |

### Explicitly not claimed yet

These are intentionally left for later phases rather than represented as finished functionality:

- GLTF/GLB ingestion into the scene graph, asset thumbnails, and resource disposal queues
- Monaco-powered multi-file code editing and two-way code-to-scene synchronization
- Full standalone Vite project export with copied assets and production-build verification
- Node-based interactions, responsive layout authoring, custom shaders, post-processing, and WebGPU
- Advanced grouping, collections, prefabs, animation curves, easing editors, and native autosave

When a feature is only an affordance in the UI, it should be treated as **experimental** until its phase is marked verified below.

---

## Build phases

The implementation is organized as gates. A gate is not considered complete until TypeScript compilation and the production build pass.

### Phase 1 — Foundation + editor core · **browser verified / Electron launch pending**

- Electron main, preload, and renderer boundaries are present.
- React + TypeScript + Vite boot the editor shell.
- Renderer Node integration is disabled; `contextIsolation` is enabled.
- Professional dark layout is available in browser and desktop mode.
- Persistent Three.js runtime is separated from React in `src/editor/scene/sceneRuntime.ts`.
- `ThreeViewport.tsx` is now a thin React adapter over the runtime registry.
- Version 2 editor document and real parent/child relationships are present.
- Scene mutations use execute/undo command objects instead of full-scene history snapshots.

**Test gate**

```bash
npm install
npm run dev
npm run build
```

The renderer and production build pass. `npm run electron` is wired, but the sandbox could not download the Electron runtime binary, so the native window launch still needs to be verified on a machine with Electron's artifact available.

### Phase 2 — Three.js editor · **verified vertical slice**

- Real WebGL viewport, perspective camera, fog, lights, and grid.
- Sphere, torus, plane, box, cone, light, and text scene visuals.
- Object picking, selection outline, orbit controls, and TransformControls.
- Transform inspector connected to the selected object.

**Test gate**

```bash
npm run build
```

Manual check: select a layer, switch to `G`, `R`, or `S`, drag the gizmo, then confirm the inspector values update.

### Phase 3 — Editor state and commands · **verified vertical slice**

- Typed Zustand adapter backed by the version 2 editor document.
- Bounded execute/undo/redo command history.
- Duplicate, delete, hide, lock, group, ungroup, reset, serialization, and selection state.
- TransformControls drag commits one transform command on release.

**Test gate**

```bash
npm run build
```

### Phase 4 — Project system · **partially verified**

- Version 2 `.wfv` JSON payloads serialize the editor document, hierarchy, material registry, settings, and animation section.
- Legacy version 1 `{ projectName, objects }` payloads migrate on load.
- Browser save/open works through downloads and a file input.
- Electron preload exposes native `project:save-as` and `project:open` IPC handlers.

**Still open:** schema validation depth, Save As polish, autosave, and a full reopen test inside a packaged Electron window.

### Phase 5 — Assets · **experimental**

- Asset browser surface and local import entry point exist.
- File types are constrained to image, GLTF/GLB, OBJ, SVG, WebP, HDR, and video inputs.

**Still open:** decoding imported assets into the scene, real thumbnails, drag-and-drop, and explicit Three.js disposal.

### Phase 6 — Animation · **verified vertical slice**

- Timeline tracks, playhead, scrubbing, playback, and keyframe markers.
- Keyframes can be added to selected objects and played through the timeline.

**Still open:** interpolation, easing, curve editing, and property sampling during playback.

### Phase 7 — Web development · **experimental**

- Generated scene code is visible in the Code inspector.
- Preview renders the current published scene artifact.

**Still open:** Monaco, multi-file editing, user-code separation, and two-way synchronization.

### Phase 8 — Export · **experimental**

- Standalone HTML export is available and opens outside Electron.
- A committed production build lives in `docs/` for static hosting.

**Still open:** exporting a complete Vite / Three.js project, copying assets, installing dependencies, and verifying an exported production build.

### Phase 9 — Advanced features · **not started**

Node interactions, post-processing, responsive authoring, custom shaders, advanced materials, curves, WebGPU, and plugins are intentionally deferred until the earlier gates are complete.

---

## Run it

### Browser editor

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The dev server is configured for `0.0.0.0`, so it also works in a proxied preview environment.

### Production build

```bash
npm run build
npm run preview
```

The build command runs strict TypeScript project checks before generating `dist/`.

### Electron shell

```bash
npm run electron
```

This builds first, then opens `dist/index.html` in the secure Electron window when Electron's runtime binary is installed. Browser APIs remain behind the preload bridge; the renderer never receives Node integration. In this sandbox, the command currently stops while downloading the Electron binary; the build itself passes.

### GitHub Pages

A generated static build is committed in `docs/`. To publish it, open repository **Settings → Pages → Deploy from a branch**, select `arena/01a0dcf1-nevertheless`, and choose `/docs`.

Branch URL: [`arena/01a0dcf1-nevertheless`](https://github.com/Hiro66-git/nevertheless/tree/arena/01a0dcf1-nevertheless)

---

## Keyboard map

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + S` | Save `.wfv` project |
| `Ctrl/Cmd + O` | Open project |
| `Ctrl/Cmd + K` | Command palette |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + D` | Duplicate selection |
| `V` | Select |
| `G` | Move gizmo |
| `R` | Rotate gizmo |
| `S` | Scale gizmo |
| `Space` | Play / pause timeline |
| `Delete` | Delete selection |
| `Esc` | Close palette or modal |

---

## Architecture

```text
.
├── electron/
│   ├── main.cjs              # BrowserWindow, native dialogs, IPC handlers
│   └── preload.cjs           # Minimal contextBridge API
├── src/
│   ├── App.tsx               # Existing editor composition and feature panels
│   ├── main.tsx              # Renderer entry point
│   ├── env.d.ts              # Typed preload bridge
│   ├── types.ts              # Scene and editor domain types
│   ├── editor/
│   │   ├── commands/          # Undoable scene commands
│   │   ├── core/              # Editor core boundary notes
│   │   ├── document/          # Version 2 document and hierarchy operations
│   │   ├── history/           # Bounded command history helper
│   │   ├── scene/
│   │   │   └── sceneRuntime.ts       # Persistent Three.js runtime + registry
│   │   └── viewport/
│   │       └── ThreeViewport.tsx     # Thin React/runtime adapter
│   └── state/
│       └── editorStore.ts    # Zustand document adapter and UI state
├── docs/
│   ├── architecture-audit.md # Phase 0 audit and refactor order
│   └── ...                   # Static production build for Pages / hosting
├── index.html                # Vite renderer entry
├── vite.config.ts            # Browser-safe base + proxied host config
└── package.json
```

### Security boundary

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Filesystem dialogs live in the Electron main process.
- The renderer only sees the small API exposed by `preload.cjs`.

### Performance notes

The viewport caps device pixel ratio at `2`, uses an explicit WebGL renderer, and keeps scene objects in a typed store. Asset lifecycle management is called out as a Phase 5 gate before large imported scenes are treated as production-ready.

---

## Phase report

| Phase | Implemented | Files / systems | Verified with | Known issue |
| --- | --- | --- | --- | --- |
| 1 | Foundation shell + Electron boundary | `electron/*`, `src/main.tsx`, `vite.config.ts` | `npm run build`, dev-server HTTP check | Electron launch could not download its runtime binary in this sandbox |
| 2 | Persistent Three.js scene + picking + gizmos | `src/editor/scene/sceneRuntime.ts`, `src/editor/viewport/ThreeViewport.tsx` | `npm run build`, dev-server smoke test | Complex imported geometry is not in scope yet |
| 3 | Version 2 document + command history | `src/editor/document/*`, `src/editor/commands/*`, `src/state/editorStore.ts` | `npm run build`, manual command paths | Numeric inspector transaction grouping remains |
| 4 | `.wfv` serialization + dialog bridge | `src/editor/document/*`, `src/state/editorStore.ts`, `electron/*` | `npm run build` | Schema validation, autosave and packaged reopen test remain |
| 5 | Asset surface only | `src/App.tsx` | `npm run build` | Import-to-scene and disposal remain |
| 6 | Timeline vertical slice | `src/App.tsx`, `src/state/editorStore.ts` | `npm run build` | Interpolation and easing remain |
| 7 | Generated code view + preview | `src/App.tsx` | `npm run build` | Monaco and two-way sync remain |
| 8 | HTML export + `docs/` build | `src/App.tsx`, `docs/` | `npm run build` | Full Vite project export remains |
| 9 | Deferred | — | — | Do not start until earlier gates are complete |

---

## Contributing to the next phase

1. Inspect the existing store and preload API before adding a subsystem.
2. Keep domain state in Zustand; do not duplicate scene state inside panels.
3. Keep Electron-only capabilities behind `preload.cjs`.
4. Add a real interaction before exposing a control.
5. Run `npm run build` and manually exercise the changed phase before moving on.
6. Document the exact test command and remaining limitations in the phase report.

> A small, verified editor is the product. The roadmap is intentionally longer than the current implementation.
