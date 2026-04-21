# Universal Print Module

**Made with vue-fm-web-viewer-start**

## App Notes

Use this section to capture app-specific rules before coding starts.

- App name: Universal Print Module
- Business goal: Render editable bilingual planning reports in a FileMaker Web Viewer, persist report JSON back to FileMaker, and hand rendered HTML back for PDF generation.
- UX scope: Draft reports are editable; finalized reports are read-only. Image selection, markdown editing, signatures, exhibits, and print/export markup are in scope.
- FileMaker scripts: `JS Save Report JSON`, `JS-FM Get Images List`, `JS Sign Document`, `Receive Report HTML`. Legacy source did not reveal a reliable ready/load script, so the converted app currently boots without one and expects direct `setup(json)` or later wiring.
- Setup payload contract (schema v2): root keys `schemaVersion`, `meta`, `template`, `content`, optional `runtime`. Use `template.name` to select the template component (e.g. `StaffReport`); keep option switches under `template.options` (e.g. `template.options.type = 'prac'`).
- Local dev payloads: `src/devModel.json` supports multi-payload wrappers using `_selectPayload` and named payload objects; browser dev should load the selected key, not the wrapper itself.
- Naming conventions: FileMaker callbacks exposed to `window` should remain explicit and stable. Report field keys should stay aligned with FileMaker JSON keys.
- Guardrails: Keep report layout print-safe on Letter/Legal pages, avoid direct `window.FileMaker` calls in components, preserve hosted-build compatibility, and do not enable edits once status is `final`.

### New App Checklist

- Replace `Your App Name Here` in this file and `README.md`
- Verify `package.json` is no longer `vue-fm-web-viewer-start` (auto-checked on `npm install`)
- Set the real `loadScript` in `src/main.js`
- Define and document `setup(json)` payload keys
- Replace all `_TBD_` and placeholder bullets in this section

## vue-fm-web-viewer-start

This project started as a starter template for FileMaker Web Viewer apps with Vue 3, Vite, and TailwindCSS.

The current production build outputs standard Vite assets in `dist/`, suitable for hosted deployment.

### Core Goals

- Keep architecture simple and predictable
- Keep a clear boundary between FileMaker and JavaScript
- Keep global state minimal (`model` only)
- Make browser dev and FileMaker runtime behavior explicit
- Support reuse across many small apps

### Build & Runtime

- Vue 3 + Vite
- TailwindCSS v4 via `@tailwindcss/vite`
- `unplugin-icons` (preferred set: `material-symbols`)
- `npm run dev` for browser/FileMaker development
- `npm run build` outputs hosted assets in `dist/`

### Project Structure

- `src/main.js`
  - Minimal entry point
  - Imports CSS
  - Calls `fmBootstrap()`
  - Mounts Vue app

- `src/fm.js`
  - All FileMaker bridge behavior
  - Web → FileMaker calls (`fmPerform`)
  - FileMaker → Web entry point (`setup`)
  - Readiness detection + queue flushing
  - Dev fallback to `devModel.json`

- `src/model.js`
  - Shared reactive app state
  - `setup()` merges incoming data here

- `src/App.vue`
  - Root UI component
  - Reads from `model`
  - May register `onSetup()` and expose additional callbacks when needed

- `src/templates/*`
  - Template-specific components selected by `template.name`
  - Keep template-specific display logic and subtype rules here

### FileMaker Bridge API (`src/fm.js`)

#### `fmPerform(scriptName, param)`

- Primary Web → FileMaker call path
- `param` may be string, object, array, number, boolean, `null`, or `undefined`
- Objects/arrays are JSON-stringified automatically
- Calls are queued until `window.FileMaker.PerformScript` becomes available

#### `setup(jsonOrObject)`

- Default FileMaker → Web entry point, exposed globally as `window.setup`
- Accepts either a JSON string or a plain object
- Merges parsed data into reactive `model`
- Triggers optional `onSetup()` callback after merge

#### `onSetup(fn)`

- Registers one callback invoked after each successful `setup()`
- Current implementation stores a single callback (new registrations replace previous one)

#### `exposeToFileMaker(name, fn)`

- Utility for exposing additional global functions callable from FileMaker scripts
- Use sparingly; keep FileMaker-facing API explicit and stable

#### `fmBootstrap({ loadScript, timeoutMs })`

- Called from `main.js` during startup
- Exposes `window.setup`
- Queues optional `loadScript` call (for “viewer ready” handshake)
- Starts FileMaker readiness watch
- On timeout:
  - In `DEV`: loads `src/devModel.json` and feeds it through `setup()`
  - In production: sets `model.error`

### Startup & Data Flow

1. `main.js` calls `fmBootstrap({ loadScript: 'JS My App Load' })`
2. `fmBootstrap()` exposes `window.setup`
3. App notifies FileMaker by calling `loadScript` through `fmPerform()`
4. FileMaker responds by calling `setup(json)`
5. `setup()` merges data into `model`
6. Vue UI reacts automatically

### Development Fallback

- Browser dev without FileMaker is supported intentionally
- If FileMaker is not detected before timeout in `DEV`, `devModel.json` is loaded via `setup()`
- Do not import or reference `devModel.json` from production-only code paths

### Conventions for Copilot and Contributors

- Keep `main.js` boring and minimal
- Keep FileMaker integration logic in `fm.js`
- Components should not call `window.FileMaker` directly
- Use `@` alias for imports from `src`
- Prefer explicit, readable code over abstractions
- Avoid unnecessary lazy-loaded imports unless there is a clear performance need
- Avoid dynamic Tailwind class generation unless safelisted
- Use `unplugin-icons` for all icons (prefer `material-symbols` set)
- Use `i-material-symbols-*` component tags (kebab-case) for icons

### Import Examples

```js
import { fmPerform, onSetup } from '@/fm'
import { model } from '@/model'
```