// Builds src/data/districts.json (every county, each district with its coordinates) from CWA's own
// forecast responses, so the names match what the forecast API expects.   npm run gen:districts
import { readFileSync, writeFileSync } from 'node:fs'
import { COUNTY_DATASETS } from '../src/data/counties'
import { listLocations } from '../server/cwa'
import { datasetUrl, requireApiKey } from './env'

const key = requireApiKey()
const target = new URL('../src/data/districts.json', import.meta.url)
let table: Record<string, unknown[]> = {}
try {
  table = JSON.parse(readFileSync(target, 'utf8'))
} catch {
  // start from an empty table
}

let failed = 0
for (const [county, dataset] of Object.entries(COUNTY_DATASETS)) {
  try {
    const res = await fetch(datasetUrl(dataset, key))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const locations = listLocations(await res.json())
    if (locations.length === 0) throw new Error('no locations found in the response')
    table[county] = locations
    const withCoords = locations.filter((l) => l.lat !== undefined && l.lon !== undefined).length
    console.log(`${county}: ${locations.length} districts (${withCoords} with coordinates)`)
  } catch (e) {
    failed++
    console.error(`${county}: failed, keeping the existing entry. ${(e as Error).message}`)
  }
  await new Promise((r) => setTimeout(r, 300))
}

const ordered = Object.fromEntries(Object.keys(COUNTY_DATASETS).filter((c) => table[c]).map((c) => [c, table[c]]))
writeFileSync(target, JSON.stringify(ordered, null, 2) + '\n')
console.log(`wrote src/data/districts.json with ${Object.keys(ordered).length} counties`)
if (failed) process.exit(1)
