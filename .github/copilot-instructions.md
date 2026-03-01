# Your App Name Here

**Made with vue-fm-web-viewer-start**

## App Notes (customize this section for your app)

Use this section to capture app-specific rules before coding starts.

- App name: _TBD_
- Business goal: _what this viewer must accomplish_
- UX scope: _MVP boundaries, in-scope and out-of-scope behavior_
- FileMaker scripts: _ready/load script, action scripts, callback names_
- Setup payload contract: _required keys, optional keys, error keys_
- Naming conventions: _script naming, component naming, model field naming_
- Guardrails: _performance limits, security/privacy constraints, browser/FM version assumptions_

### New App Checklist

- Replace `Your App Name Here` in this file and `README.md`
- Verify `package.json` is no longer `vue-fm-web-viewer-start` (auto-checked on `npm install`)
- Set the real `loadScript` in `src/main.js`
- Define and document `setup(json)` payload keys
- Replace all `_TBD_` and placeholder bullets in this section

## vue-fm-web-viewer-start

This project is a starter template for building FileMaker Web Viewer apps with Vue 3, Vite, and TailwindCSS.

The production build outputs one self-contained `index.html` (inline JS + CSS), suitable for storing in a FileMaker record and loading in a Web Viewer.

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
- `vite-plugin-singlefile` enabled only in production mode
- `npm run dev` for browser/FileMaker development
- `npm run build` outputs a single-file app (`dist/index.html`)

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
- Avoid lazy-loaded imports (single-file output target)
- Avoid dynamic Tailwind class generation unless safelisted
- Use `unplugin-icons` for all icons (prefer `material-symbols` set)
- Use `i-material-symbols-*` component tags (kebab-case) for icons

### Import Examples

```js
import { fmPerform, onSetup } from '@/fm'
import { model } from '@/model'
```

### FMVue Migration Notes

Use this section only when migrating an existing FMVue app.

- Replace direct `FileMaker.PerformScript(...)` calls with `fmPerform(scriptName, param)`
- Do not carry over FMVue payload conventions that embed script names in JSON payloads
- If older code stringified params manually, remove that when switching to `fmPerform()`
- Move “viewer ready” script call from component `mounted()` into `fmBootstrap({ loadScript })` in `main.js`
- Replace custom `setup()` plumbing with built-in `setup()` in `fm.js`
- Move any post-setup logic into `onSetup(() => { ... })`
- Some FMVue apps did not use setup(), and instead merged incoming data directly into the source code at "[[data_model]]". In that case, refactor to use `setup()`.
- Remove old `OnFMReady` CDN dependency; equivalent behavior is now in `fm.js`
- Migrate existing icons to `material-symbols` via `unplugin-icons`
- Any other CDN dependencies should be replaced with NPM packages where possible
- Inline CSS color workarounds should no longer be necessary for icons; Tailwind classes should work
