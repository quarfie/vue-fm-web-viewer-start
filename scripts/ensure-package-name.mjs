import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const TEMPLATE_NAME = 'vue-fm-web-viewer-start'
const packagePath = path.resolve('package.json')
const packageLockPath = path.resolve('package-lock.json')

function toValidPackageName(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/^[._-]+/, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 214)
}

try {
  const raw = fs.readFileSync(packagePath, 'utf8')
  const pkg = JSON.parse(raw)

  if (pkg.name !== TEMPLATE_NAME) {
    process.exit(0)
  }

  const folderName = path.basename(process.cwd())
  const candidate = toValidPackageName(folderName)

  if (!candidate || candidate === TEMPLATE_NAME) {
    console.info(
      `[template] package name still '${TEMPLATE_NAME}'. Set it manually with: npm pkg set name="my-new-app"`,
    )
    process.exit(0)
  }

  pkg.name = candidate
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
  if (fs.existsSync(packageLockPath)) {
    const lockRaw = fs.readFileSync(packageLockPath, 'utf8')
    const lock = JSON.parse(lockRaw)
    let lockUpdated = false

    if (lock.name === TEMPLATE_NAME) {
      lock.name = candidate
      lockUpdated = true
    }

    if (lock.packages && lock.packages[''] && lock.packages[''].name === TEMPLATE_NAME) {
      lock.packages[''].name = candidate
      lockUpdated = true
    }

    if (lockUpdated) {
      fs.writeFileSync(packageLockPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8')
    }
  }
  console.info(`[template] Updated package name: '${TEMPLATE_NAME}' -> '${candidate}'`)
} catch (error) {
  console.warn(`[template] Could not verify package name: ${error.message}`)
}
