# WebForge Visual

WebForge Visual is a professional, visual-first Three.js scene editor for crafting interactive web experiences. This repository contains the browser-ready editor shell, designed so the same renderer and project model can be embedded into an Electron desktop host later.

## What is implemented

- Dark creative-software workspace with tool rail, layer hierarchy, inspector, asset browser, viewport, and animation timeline
- Real Three.js WebGL viewport with orbit controls, lights, grid, object picking, materials, visibility, locking, and scene selection
- Add, duplicate, delete, hide, lock, transform, recolor, and material editing for scene objects
- Undo and redo history, keyboard shortcuts, command palette, timeline scrubbing/playback, and keyframe creation
- `.wfv` project save/load and a working static HTML export
- Design, Motion, and generated Code workspaces
- A committed `docs/` static build ready for GitHub Pages or any static host

## Run locally

```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal. The production build is generated with:

```bash
npm run build
npm run preview
```

The desktop shell is also wired with a secure Electron main/preload bridge:

```bash
npm run electron
```

## GitHub Pages

A production build is committed in `docs/` so the repository can be viewed as a static website. In the repository settings, choose **Pages → Deploy from a branch**, select `arena/01a0dcf1-nevertheless` and the `/docs` folder. GitHub will then publish the editor at the generated Pages URL.

### Shortcuts

`Ctrl/Cmd + S` save · `Ctrl/Cmd + O` open · `Ctrl/Cmd + K` command palette · `Ctrl/Cmd + Z` undo · `G` move · `R` rotate · `S` scale · `Space` play/pause · `Delete` remove selection.
