// Calls the real CWA API once and prints the shape of the response, so the assumptions in server/cwa.ts
// can be checked against it.   npm run probe -- 臺北市 南港區
import { COUNTY_DATASETS } from '../src/data/counties'
import { findLocations, parseLocation } from '../server/cwa'
import { datasetUrl, requireApiKey } from './env'

const county = process.argv[2] ?? '臺北市'
const district = process.argv[3] ?? '南港區'
const dataset = COUNTY_DATASETS[county]
if (!dataset) {
  console.error(`Unknown county "${county}". Known: ${Object.keys(COUNTY_DATASETS).join(', ')}`)
  process.exit(1)
}

const res = await fetch(datasetUrl(dataset, requireApiKey()))
console.log(`HTTP ${res.status} for ${county} (${dataset})`)
const text = await res.text()
let body: any
try {
  body = JSON.parse(text)
} catch {
  console.log('Response is not JSON. First 300 characters:\n' + text.slice(0, 300))
  process.exit(1)
}

console.log('top-level keys:', Object.keys(body))
if (body.success !== undefined) console.log('success:', body.success)
if (body.records) console.log('records keys:', Object.keys(body.records))
else console.log('NOTE: no `records` wrapper. server/cwa.ts also accepts Locations at the top level.')

const locations = findLocations(body)
console.log(`locations found by findLocations: ${locations.length}`)
if (locations.length === 0) {
  console.log('Nothing matched the assumed Locations > Location path. Raw head:\n' + text.slice(0, 600))
  process.exit(1)
}
const loc = locations.find((l) => l.LocationName === district) ?? locations[0]
console.log('using location:', loc.LocationName, '| keys:', Object.keys(loc))

const elements = (loc.WeatherElement as any[]) ?? []
console.log(`\nWeatherElement (${elements.length}):`)
for (const el of elements) {
  const first = el.Time?.[0]
  console.log(`- ${el.ElementName}  entries=${el.Time?.length}  first=${JSON.stringify(first)}`)
}

const rows = parseLocation(loc)
console.log(`\nparsed hourly rows: ${rows.length}`)
if (rows.length) {
  const hr = (i: number) => new Date((i - 8) * 3600000).toISOString().replace('.000Z', 'Z')
  console.log(`range: ${hr(rows[0].idx)} to ${hr(rows[rows.length - 1].idx)} (UTC)`)
  console.table(rows.slice(0, 8))
} else {
  console.log('No usable rows. Check that the elements above contain Temperature, RelativeHumidity (or DewPoint) and ProbabilityOfPrecipitation.')
}
