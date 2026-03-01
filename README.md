# Your App Name Here

**Made with vue-fm-web-viewer-start**

## App Notes (customize this section for your app)

- Update this section first when creating a new app from this template.
- App name: _TBD_
- Purpose: _1-2 sentence summary of what this web viewer does_
- FileMaker ready script (`loadScript`): _e.g. `JS My App Load`_
- FileMaker -> Web entry point: `setup(json)`
- Setup payload shape: _list required + optional keys_
- Known constraints: _layout assumptions, privileges, env requirements_

### New App Checklist

- Replace `Your App Name Here` in this file and `.github/copilot-instructions.md`
- Rename the project folder to your real app name, then run `npm install`.
- If `package.json` is still `vue-fm-web-viewer-start`, install auto-updates it to a sanitized version of the current folder name.

- Set the real `loadScript` in `src/main.js`
- Confirm `setup(json)` payload keys and update docs to match
- Replace placeholder values in **App Notes**

## vue-fm-web-viewer-start

This repository is a starter template for building **FileMaker Web Viewer apps**
using **Vue 3**, **Vite**, and **TailwindCSS**.

The app is designed to build into a **single self-contained HTML file**
(inline JS + CSS) that can be stored in a FileMaker record and loaded via a Web Viewer.

---

### Goals

- Simple, predictable structure
- Clean separation between FileMaker and JavaScript
- No runtime dependencies or CDN requirements
- Easy browser-based development
- Reliable behavior inside FileMaker Web Viewers

---

### Development Workflow

#### Run in browser or FileMaker (development)

```bash
npm install
npm run dev
```

Then open in a browser or FileMaker web viewer:

```
http://localhost:5173
```

When running in a browser **without FileMaker**, the app:

- Detects that the FileMaker object is missing
- Loads development data from `src/devModel.json`
- Allows full UI development without FileMaker running

---

#### Build for FileMaker (production)

```bash
npm run build
```

Output:

```
dist/index.html
```

This file contains **all JS and CSS inlined** and is suitable for:

- storing in a FileMaker field
- loading directly into a Web Viewer

---

### Project Structure

```
src/
├─ main.js        # App entry point
├─ App.vue        # Root component
├─ model.js       # Shared reactive data model
├─ fm.js          # FileMaker bridge (all integration logic)
├─ devModel.json  # Browser-only development data
└─ assets/
   └─ main.css    # Tailwind entry (@import 'tailwindcss')
```

---

### FileMaker Integration

#### Web → FileMaker

Use:

```js
import { fmPerform } from '@/fm'

fmPerform('My FileMaker Script', param)
```

- `param` may be string, object, array, number, boolean, `null`, or `undefined`
- Objects/arrays are JSON-stringified automatically
- Calls are queued while FileMaker availability is being probed
- If FileMaker is not detected before timeout, queued calls are dropped and future calls fail fast (logged) instead of queueing forever

---

#### FileMaker → Web

The template exposes a default entry point:

```js
window.setup(json)
```

- Exposed automatically during app startup
- Expected parameter: JSON object
- Parsed data is merged into the shared reactive `model`

FileMaker scripts should call `setup(json)` to initialize or refresh data.

#### Post-setup Callback (`onSetup`)

Use `onSetup` when you need code to run after each successful `setup()` call.

```js
import { onSetup } from '@/fm'

onSetup((data) => {
  // data is the parsed payload passed to setup()
  // model is already merged and reactive here
})
```

- Useful for post-initialization logic that depends on FileMaker data
- The current implementation stores one callback (new registration replaces previous)

---

#### Initialization

On startup, the web app queues a call to a FileMaker "load" script so FileMaker knows the web viewer is ready and can respond by calling setup(json).

The script name is configured in main.js: `fmBootstrap({ loadScript: 'JS My App Load' })`

The FileMaker detection timeout is also configurable:

```js
fmBootstrap({
  loadScript: 'JS My App Load',
  timeoutMs: 1500,
})
```

- `timeoutMs` defaults to `1500`
- If timeout is reached in development, `devModel.json` is loaded
- If timeout is reached in production, `model.error` is set and bridge calls fail fast

---

### Shared Data Model

- All incoming data from FileMaker is merged into `model`
- `model` is a Vue `reactive()` object
- Components can import and use it directly:

```js
import { model } from '@/model'
```

---

### Development Data (`devModel.json`)

- Used only when running in a web browser **without FileMaker**
- Allows UI development without a FileMaker file open
- Never loaded in production builds

---

### Design Conventions

- Keep `main.js` minimal
- All FileMaker-related logic lives in `fm.js`
- Components should not access `window.FileMaker` directly
- Prefer clarity over abstraction
- Avoid dynamic Tailwind class names unless safelisted

### Icons

- Use `unplugin-icons` for all icons
- Preferred icon set: `material-symbols`
- Browse icon sets at https://icon-sets.iconify.design

---

### Notes

- JavaScript only (no TypeScript)
- Vue 3 Composition API
- TailwindCSS v4
- Single-file output via `vite-plugin-singlefile`

For AI-assisted development guidance and project-specific conventions,
see `.github/copilot-instructions.md`.
