# Milestone 3 — Code + Live Web Preview Foundation audit

Date: 2026-09-27
Branch: `arena/01a0dcf1-nevertheless`

This audit was completed before Milestone 3 implementation. It treats `EditorDocument` as the persistent scene source and the Three.js graph as runtime-only.

## Existing reusable systems

| System | Location | Reuse decision |
| --- | --- | --- |
| Versioned scene document, migration, validation | `src/editor/document/types.ts`, `document.ts` | Extend with optional versioned web data; keep scene schema and v1 migration behavior |
| Reversible commands and composites | `src/editor/commands/command.ts`, `sceneCommands.ts` | Add web/code commit commands only for committed code changes; never create commands per keystroke |
| Zustand document adapter | `src/state/editorStore.ts` | Add web document state/actions through the existing store; no second store |
| Project serialization | `projectPayload`, `projectFromUnknown`, Electron project IPC | Extend validation/migration and keep canceled/failed open behavior |
| Three.js runtime | `src/editor/scene/sceneRuntime.ts` | Leave scene runtime authoritative only for viewport rendering; generator reads document, never runtime objects |
| Existing viewport adapter | `src/editor/viewport/ThreeViewport.tsx` | Keep thin; no code/preview responsibilities |
| Existing asset registry/import | document assets, `MaterialManager`, Electron `asset:open` | Reuse asset IDs and metadata for export path resolution |
| Existing animation model | `src/editor/animation/animationEvaluator.ts` | Do not duplicate scene data; generated scene bootstrap may consume document animation data |
| Existing React code tab/preview modal | `src/App.tsx` | Replace generated snippet and `srcDoc` preview with adapters to new modules; do not put compiler logic into `App.tsx` |
| Existing secure Electron bridge | `electron/main.cjs`, `preload.cjs`, `src/env.d.ts` | Add narrow validated export and preview-related APIs only where required |
| Existing test setup | Vitest and `src/editor/editorCore.test.ts` | Add pure model/generator/security tests; use DOM mocks only for preview lifecycle tests |

## Systems that must remain untouched or narrowly adapted

- `SceneRuntime` object lifecycle, transform transactions, hierarchy sync, material disposal, and animation evaluation must not be rewritten for web output.
- Three.js runtime objects must never enter persistent web state.
- Existing command/history semantics remain scene-focused. Text typing is local editor-buffer state and does not use scene history.
- Existing Electron security flags remain enabled: `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
- Existing visual layout and styling remain intact; only the existing Code/Preview/Export controls receive real adapters.

## Systems unsafe to extend directly

### `src/App.tsx`

It is already a large composition component containing shortcuts, save/open, preview, export, inspector, timeline, and code display. It must not receive generator, parser, IPC, or preview lifecycle logic. New code belongs in dedicated modules and small hooks/adapters.

### Existing `exportHtml`

`exportHtml` is a hardcoded string-concatenation projection. It emits a placeholder page, interpolates the project name without escaping, embeds a legacy `SceneObject[]` snapshot, and is used for both preview and browser download. It cannot become the canonical generator. It will be replaced by the deterministic WebDocument generator.

### Existing `srcDoc` iframe

The current preview is a same-renderer `srcDoc` iframe with no sandbox, no explicit message protocol, no error capture, no loading state, no reload lifecycle, and no disposal abstraction. It must not be extended as-is. The new preview must use a sandboxed iframe and an explicit validated `postMessage` protocol.

### Renderer-side browser download

Current save/export paths create Blob URLs in React and do not use Electron export IPC. Static export must move to a narrow main-process IPC handler that validates destination and generated file paths.

### Generated Code inspector

The current code panel is a read-only hardcoded snippet derived from the first compatibility `SceneObject`. It is not persistent code, not a multi-file editor, and not safe to treat as authored source.

## Duplicate state and synchronization risks

1. `EditorDocument` is canonical, but `objects` is a compatibility projection in Zustand. The generator must read only the document plus committed WebDocument state.
2. `selectedId`, `selectedIds`, and `objects` are UI/runtime projections and must never be serialized into WebDocument.
3. `src/App.tsx` currently uses `objects` for preview/export. This is a stale/legacy boundary and must be redirected to the generator input adapter.
4. Runtime animation updates create evaluated `SceneObject` projections; generation must use the unevaluated persistent document and explicit web settings, not the current frame.
5. Code editing needs a local buffer separate from committed WebDocument source. Committing code must be one explicit persistent mutation.
6. Preview updates must be debounced and generation must be keyed to committed code/document revisions, not React renders.

## Security findings

- Electron main/preload currently has narrow project and asset channels, but no export channel. Any new channel must be explicit and validate structured arguments rather than accepting arbitrary method names or paths.
- Current `srcDoc` preview is not sandboxed. The new iframe must use `sandbox="allow-scripts"` without same-origin access and must communicate only through a versioned message protocol.
- Generated HTML, attributes, CSS, JavaScript data, and project-authored scripts require context-appropriate escaping/serialization.
- Project-authored JavaScript is untrusted and must execute only inside the isolated preview, never in Electron main or the editor renderer.
- Renderer filesystem access is currently absent and must remain absent.
- Static export must reject absolute paths, traversal segments, and writes outside the selected destination.

## Exact implementation files planned

### New modules

- `src/editor/web/webDocumentTypes.ts` — versioned serializable WebDocument/WebCode schema and defaults.
- `src/editor/web/webDocument.ts` — creation, clone, migration, validation, and revision helpers.
- `src/editor/web/webGenerator.ts` — deterministic HTML/CSS/JS generation and context escaping.
- `src/editor/web/webCodeStore.ts` or a focused store adapter module — local buffer/committed source operations without a second scene store.
- `src/editor/web/generatedRegions.ts` — stable generated/user region parsing and conflict-safe merge helpers.
- `src/editor/web/previewProtocol.ts` — versioned validated parent/iframe messages.
- `src/editor/web/previewRuntime.ts` — iframe lifecycle, debounced updates, loading/errors, listeners, dispose.
- `src/editor/web/exportPaths.ts` — safe export path validation and asset reference rewriting.
- `src/editor/web/*.test.ts` — pure model, generator, protocol, lifecycle, and export tests.

### Existing files expected to change

- `src/editor/document/types.ts` — optional compatible web/project field and version migration shape.
- `src/editor/document/document.ts` — web defaults, migration, validation, clone/load integration.
- `src/state/editorStore.ts` — committed WebDocument and code buffer actions, save/load projection, dirty semantics.
- `src/App.tsx` — thin adapters for code editor, preview lifecycle, save/export actions; no generator logic.
- `src/env.d.ts` — typed export IPC bridge.
- `electron/main.cjs` — validated atomic static export handler, if directory/archive export is implemented through Electron.
- `electron/preload.cjs` — narrow export bridge.
- `src/styles.css` — only styles required by the existing code/preview controls.
- `src/editor/editorCore.test.ts` — regression coverage for scene systems after web additions.
- `package.json`, `package-lock.json` — only if an existing suitable code editor/parser dependency is justified.

## Deliberate design decisions

- Use a structured WebDocument for metadata/body/scene mount and controlled source strings for CSS/JavaScript. Do not store generated HTML as canonical state.
- Keep generated scene output in a marked stable region. User-authored regions remain preserved; unsafe merges return conflicts instead of overwriting code.
- Generate `index.html`, `styles.css`, and `scene.js` as separate deterministic strings.
- Use a stable document revision/hash for preview updates. Do not regenerate on every React render.
- Use a textarea only if no appropriate editor dependency is already installed? No: the requirement explicitly disallows building a text editor from scratch. The implementation must either justify a small existing editor dependency or provide a clearly read-only code view until one is added; it must not mislabel a textarea as syntax-highlighted editor.
- Preview is an isolated sandboxed iframe, never a development-server iframe and never a direct Zustand/document consumer.
- Export writes through validated Electron IPC and reports actual filesystem failures.

## Definition-of-done gates for implementation

1. Pure WebDocument defaults/migration/validation pass.
2. Same document plus settings produces byte-identical generated files.
3. Generator escapes title/text/attributes and serializes scene data safely.
4. Code buffer commit/revert/dirty behavior is explicit and persisted.
5. Generated/user regions preserve authored content or report conflict.
6. Preview renders generated files in a sandbox, reports runtime/resource errors, reloads, and disposes listeners/timers.
7. Save/load retains web state and canceled Save As does not clear dirty state.
8. Electron export creates real files under a validated destination and rejects traversal.
9. Existing scene, command, material, animation, and persistence tests remain green.
10. `npm run typecheck`, `npm test`, and `npm run build` pass.

## Intentionally out of scope

Monaco-level IDE features, collaborative editing, npm/package management, framework generation, SSR, WebGPU, shader graphs, physics, particles, AI, advanced export formats, and UI redesign remain deferred.
