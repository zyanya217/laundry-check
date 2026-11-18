// Runs before `npm run dev` and `npm run build`. If the district table has no coordinates yet and a key
// is available, it runs gen-districts once. It never fails the dev server or the build: without a key or
// without network it only prints a note, and GPS lookup then tells the person the table is missing.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const table = new URL('../src/data/districts.json', import.meta.url)
const hasCoords = (() => {
  try {
    const data = JSON.parse(readFileSync(table, 'utf8')) as Record<string, { lat?: number }[]>
    return Object.values(data).some((list) => list.some((d) => typeof d.lat === 'number'))
  } catch {
    return false
  }
})()

if (hasCoords) process.exit(0)

const keyInFile = existsSync('.env.local') && /^\s*CWA_API_KEY\s*=\s*\S+/m.test(readFileSync('.env.local', 'utf8'))
if (!process.env.CWA_API_KEY && !keyInFile) {
  console.log('[districts] No CWA_API_KEY, skipping the district table. GPS lookup stays off until it is generated.')
  process.exit(0)
}

console.log('[districts] Generating the district table from the CWA API (first run only)...')
const r = spawnSync('npx', ['tsx', 'scripts/gen-districts.ts'], { stdio: 'inherit', shell: process.platform === 'win32' })
if (r.status !== 0) console.log('[districts] Could not generate it. Run `npm run gen:districts` later to retry.')
process.exit(0)
