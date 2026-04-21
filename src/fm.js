import { replaceModel } from './model'

let onSetupCallback = null
export function onSetup(fn) {
  onSetupCallback = typeof fn === 'function' ? fn : null
}

/* ---------- expose functions to FileMaker ---------- */
export function exposeToFileMaker(name, fn) {
  if (typeof fn !== 'function') throw new TypeError(`${name} must be a function`)
  window[name] = fn
}

/* ---------- param serialization ---------- */
function serializeParam(param) {
  if (param == null) return ''
  if (typeof param === 'string') return param
  if (typeof param === 'object') {
    try {
      return JSON.stringify(param)
    } catch {
      return ''
    }
  }
  return String(param)
}

/* ---------- fmPerform with queue + watcher ---------- */
let bridgeState = 'probing' // probing | ready | unavailable
const queue = []

function flushQueue() {
  const ps = window.FileMaker?.PerformScript
  if (typeof ps !== 'function') return

  bridgeState = 'ready'
  while (queue.length) {
    const [script, param] = queue.shift()
    ps.call(window.FileMaker, script, param)
  }
}

function markUnavailable(reason = 'No FileMaker object detected') {
  if (bridgeState === 'ready') return
  bridgeState = 'unavailable'

  if (queue.length) {
    console.error(`Dropping ${queue.length} queued fmPerform call(s): ${reason}`)
    queue.length = 0
  }
}

export function fmPerform(script, param = '') {
  const ps = window.FileMaker?.PerformScript
  const serialized = serializeParam(param)
  const scriptName = String(script)

  if (typeof ps === 'function') {
    if (queue.length) flushQueue()
    bridgeState = 'ready'
    ps.call(window.FileMaker, scriptName, serialized)
    return
  }

  if (import.meta.env.DEV) {
    console.info('fmPerform (dev):', scriptName, serialized, param)
  }

  if (bridgeState === 'unavailable') {
    console.error(`fmPerform skipped: bridge unavailable (${scriptName})`)
    return
  }

  queue.push([scriptName, serialized])
}

function watchFileMaker({ intervalMs = 25, timeoutMs = 1500, onReady, onTimeout } = {}) {
  if (typeof window.FileMaker?.PerformScript === 'function') {
    flushQueue()
    onReady?.()
    return
  }

  const start = Date.now()
  const id = setInterval(() => {
    if (typeof window.FileMaker?.PerformScript === 'function') {
      clearInterval(id)
      flushQueue()
      onReady?.()
      return
    }
    if (Date.now() - start > timeoutMs) {
      clearInterval(id)
      markUnavailable(`No FileMaker object detected within ${timeoutMs}ms`)
      onTimeout?.()
    }
  }, intervalMs)
}

function resolveDevPayload(devData) {
  if (!devData || typeof devData !== 'object' || Array.isArray(devData)) {
    return devData
  }

  const selectedKey = devData._selectPayload
  if (typeof selectedKey !== 'string' || !selectedKey.trim()) {
    return devData
  }

  const payload = devData[selectedKey]
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(`devModel.json _selectPayload key not found or invalid: ${selectedKey}`)
  }

  return payload
}

/* ---------- setup(json) (FileMaker -> Web) ---------- */
export function setup(json) {
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json
    replaceModel(data)
    // Call the onSetup callback if registered (e.g. from App.vue) to notify that model has been initialized with data from FileMaker. pass in the data for convenience, but it can also be accessed via the reactive `model`.
    onSetupCallback?.(data)
    console.log('setup() received data:', data)
  } catch (err) {
    console.error('setup() received invalid JSON:', err, json)
  }
}

/* ---------- bootstrap (called from main.js) ---------- */
export function fmBootstrap({ readyScript = null, timeoutMs = 1500 } = {}) {
  exposeToFileMaker('setup', setup)

  if (readyScript) {
    fmPerform(readyScript)
  }

  watchFileMaker({
    timeoutMs,
    onReady() {
      console.log('FM Web Viewer ready, waiting for data...')
    },
    async onTimeout() {
      // DEV: running in browser without FileMaker => load devModel.json
      if (import.meta.env.DEV) {
        console.info('Browser dev mode')
        try {
          const dev = await import('./devModel.json')
          setup(resolveDevPayload(dev.default ?? dev))
        } catch {
          setup({ runtime: { error: 'No FileMaker object or devModel.json' } })
        }
        return
      }

      // PROD: FileMaker missing => show error (do not load devModel.json)
      setup({ runtime: { error: 'No FileMaker object detected' } })
    },
  })
}
