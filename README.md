# Universal Print Module

**Made with vue-fm-web-viewer-start**

## App Notes

- App name: Universal Print Module
- Purpose: Generate bilingual planning/staff reports inside a FileMaker Web Viewer, allow controlled editing while draft, and export the rendered document HTML for PDF generation.
- FileMaker ready script (`loadScript`): Not inferred from the legacy FMVue source. This conversion currently expects FileMaker to call `setup(json)` directly or for a real ready script to be wired later.
- FileMaker -> Web entry points: `setup(json)`, `insertImagesList(json)`, `insertSignature(id_Role, userJson)`, `getAsHtml()`
- FileMaker action scripts used by the UI: `JS Save Report JSON`, `JS-FM Get Images List`, `JS Sign Document`, `Receive Report HTML`
- Setup payload shape (schema v2):
  - Root keys: `schemaVersion`, `meta`, `template`, `content`, optional `runtime`
  - Template routing: `template.name` (for example `StaffReport`, `PublicNotice`)
  - Staff subtypes stay in `template.options` (for example `template.options.type = 'prac'`)
  - Local browser dev supports multi-payload `src/devModel.json` wrappers using `_selectPayload`
- Known constraints:
  - Editing is disabled once `status === 'final'`
  - The current UI keeps `meetingDate` editable, matching the legacy note
  - `pid`, `municipality`, `applicant`, and `landowner` render as read-only content
  - Finalization requires all signature slots to contain a `user` object

### Migration Notes

- The legacy FMVue app embedded `[[data_model]]` directly in the page. This Vue conversion now uses the starter bridge and expects FileMaker data through `setup(json)`.
- All direct `FileMaker.PerformScript(...)` calls were migrated to `fmPerform(...)` through [src/fm.js](src/fm.js).
- The report still exposes callback functions for FileMaker, but they are now registered explicitly in [src/App.vue](src/App.vue).
- Production builds emit standard Vite assets in `dist/` for hosted deployment.

## vue-fm-web-viewer-start

This repository started as a template for building **FileMaker Web Viewer apps**
using **Vue 3**, **Vite**, and **TailwindCSS**.

The current app is now optimized for **hosted deployment** while still supporting FileMaker bridge workflows.

---

### Goals

- Simple, predictable structure
- Clean separation between FileMaker and JavaScript
- No runtime CDN requirements
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

#### Build for hosted deployment (production)

```bash
npm run build
```

Output directory:

```
dist/
```

Vite outputs compiled assets suitable for static hosting and server deployment.

---

### Project Structure

```
src/
├─ main.js        # App entry point
├─ App.vue        # Root component
├─ model.js       # Shared reactive data model
├─ fm.js          # FileMaker bridge (all integration logic)
├─ devModel.json  # Browser-only development data
├─ templates/     # Template-specific report components (StaffReport, PublicNotice, ...)
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
- Supports named payloads with `_selectPayload` for template switching in dev
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
- Hosted build output via standard Vite asset pipeline

For AI-assisted development guidance and project-specific conventions,
see `.github/copilot-instructions.md`.
