# Your App Name Here

**Made with vue-fm-web-viewer-start**

## Getting Started (New Project)

Recommended workflow: create a new repository from this template first, then clone that new repository locally.

1. In GitHub, open this repository and click **Use this template**.
2. Create a new repository for your app (name, owner, visibility).
3. In VS Code, open a new window and run **Clone Git Repository...**.
4. Choose **Clone from GitHub** and select your newly created app repository.
5. Open the cloned folder in VS Code.
6. Run:

```bash
npm install
npm run dev
```

7. (Optional but recommended) Verify `origin` points to your new app repo:

```bash
git remote -v
```

8. Replace `Your App Name Here` in this file and `README.md`
9. Verify that install updated the app name in `package.json` to a sanitized version of the current folder name.
10. Set the real `readyScript` in `src/main.js`
11. Confirm `setup(json)` payload keys and update docs to match
12. Replace placeholder values in **App Notes**
13. Remove this Getting Started section.

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

- Verify this repo is your app repo, not the template repo (`git remote -v`)
- Run `npm install`
- Run `npm run dev`
- Replace `Your App Name Here` in this file and `README.md`
- Verify `package.json` is no longer `vue-fm-web-viewer-start` (auto-checked on `npm install`)
- Set the real `readyScript` in `src/main.js`
- Define and document `setup(json)` payload keys
- Replace all `_TBD_` and placeholder bullets in this section
- Remove the Getting Started section after initial setup is complete

## Copilot Startup Behavior

When work begins in this repo, Copilot should check whether this is:

1. The template repository itself
2. A new app repository created from this template

Use these signals together (not one signal alone):

- `git remote -v` origin still points to `vue-fm-web-viewer-start` (likely template repo)
- `README.md` or this file still contains `Your App Name Here` or `_TBD_`
- `README.md` still includes the Getting Started section
- `package.json` still has template package naming

If this looks like a new app repo created from the template, Copilot should proactively execute setup steps it can perform safely:

1. Run `npm install` (if dependencies are not installed)
2. Offer to run `npm run dev` (start when user confirms)
3. Verify `package.json` name changed away from template name
4. Report which setup items are complete vs pending

If this still looks like the template repository, Copilot should avoid making app-specific assumptions and ask whether to:

1. Customize this repo in place, or
2. Create/clone a new repo from the template first

Behavior guardrails:

- Prefer non-destructive automation first
- Do not remove the Getting Started section automatically unless asked
- Do not invent FileMaker script names or setup payload keys; request them or infer from existing code/docs

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
- Calls are queued while FileMaker availability is being probed
- If FileMaker is not detected before timeout, queued calls are dropped and future calls fail fast (logged) instead of queueing forever

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

#### `fmBootstrap({ readyScript, timeoutMs })`

- Called from `main.js` during startup
- Exposes `window.setup`
- Queues optional `readyScript` call (for “viewer ready” handshake)
- Starts FileMaker readiness watch
- On timeout:
  - In `DEV`: loads `src/devModel.json` and feeds it through `setup()`
  - In production: sets `model.error`

### Startup & Data Flow

1. `main.js` calls `fmBootstrap({ readyScript: 'JS My App Load' })`
2. `fmBootstrap()` exposes `window.setup`
3. App notifies FileMaker by calling `readyScript` through `fmPerform()`
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
- Move “viewer ready” script call from component `mounted()` into `fmBootstrap({ readyScript })` in `main.js`
- Replace custom `setup()` plumbing with built-in `setup()` in `fm.js`
- Move any post-setup logic into `onSetup(() => { ... })`
- Some FMVue apps did not use setup(), and instead merged incoming data directly into the source code at "[[data_model]]". In that case, refactor to use `setup()`.
- Remove old `OnFMReady` CDN dependency; equivalent behavior is now in `fm.js`
- Migrate existing icons to `material-symbols` via `unplugin-icons`
- Any other CDN dependencies should be replaced with NPM packages where possible
- Inline CSS color workarounds should no longer be necessary for icons; Tailwind classes should work
