// Parser for the CWA township forecast (F-D0047) JSON.
//
// What is taken from CWA's product documentation: the hierarchy Locations > Location > WeatherElement >
// Time > ElementValue, the tag names LocationName / Geocode / Latitude / Longitude / ElementName /
// DataTime / StartTime / EndTime, and the value tags Temperature, DewPoint, RelativeHumidity, WindSpeed,
// ProbabilityOfPrecipitation, WeatherCode.
//
// What is assumed and not yet checked against a live response: the `records` wrapper around Locations,
// and that ElementValue holds one object whose keys are those value tags. `npm run probe` prints the real
// shape so these can be confirmed. Forecast steps (1h, 3h, 6h) are handled by holding each value until the
// next one, so the parser does not depend on the dataset's resolution.

export interface HourlyRow {
  /** Hours since epoch, counted on the Taipei wall clock (UTC+8, no daylight saving). */
  idx: number
  temp: number
  rh: number
  wind: number
  /** Probability of precipitation, percent. */
  pop: number
  code: number | null
}

export interface LocationMeta {
  name: string
  geocode?: string
  lat?: number
  lon?: number
}

type Json = Record<string, unknown>
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)

export function findLocations(body: unknown): Json[] {
  const root = isObj(body) ? body : {}
  const records = isObj(root.records) ? root.records : root
  const groups = Array.isArray(records.Locations) ? records.Locations : []
  const out: Json[] = []
  for (const g of groups) {
    if (!isObj(g) || !Array.isArray(g.Location)) continue
    for (const l of g.Location) if (isObj(l)) out.push(l)
  }
  return out
}

export function listLocations(body: unknown): LocationMeta[] {
  return findLocations(body).flatMap((l) => {
    if (typeof l.LocationName !== 'string') return []
    const lat = num(l.Latitude)
    const lon = num(l.Longitude)
    return [
      {
        name: l.LocationName,
        geocode: typeof l.Geocode === 'string' ? l.Geocode : undefined,
        lat: lat ?? undefined,
        lon: lon ?? undefined,
      },
    ]
  })
}

function num(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v !== 'string' || v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Timestamps are read with their offset; one without an offset is taken as Taipei time. */
function toIdx(v: unknown): number | null {
  if (typeof v !== 'string') return null
  let s = v.trim().replace(' ', 'T')
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(s)) s += '+08:00'
  const ms = Date.parse(s)
  return Number.isFinite(ms) ? Math.floor(ms / 3600000) + 8 : null
}

const FIELDS = {
  temp: 'Temperature',
  dew: 'DewPoint',
  rh: 'RelativeHumidity',
  wind: 'WindSpeed',
  pop: 'ProbabilityOfPrecipitation',
  code: 'WeatherCode',
} as const
type FieldKey = keyof typeof FIELDS

interface Slice {
  from: number
  to: number | null
  value: number
}

function collectSeries(location: Json): Record<FieldKey, Slice[]> {
  const series: Record<FieldKey, Slice[]> = { temp: [], dew: [], rh: [], wind: [], pop: [], code: [] }
  const elements = Array.isArray(location.WeatherElement) ? location.WeatherElement : []
  for (const el of elements) {
    if (!isObj(el) || !Array.isArray(el.Time)) continue
    for (const t of el.Time) {
      if (!isObj(t)) continue
      const from = toIdx(t.DataTime ?? t.StartTime)
      if (from === null) continue
      const to = toIdx(t.EndTime)
      const ev = Array.isArray(t.ElementValue) ? t.ElementValue[0] : t.ElementValue
      if (!isObj(ev)) continue
      for (const key of Object.keys(FIELDS) as FieldKey[]) {
        const value = num(ev[FIELDS[key]])
        if (value !== null) series[key].push({ from, to, value })
      }
    }
  }
  for (const key of Object.keys(series) as FieldKey[]) series[key].sort((a, b) => a.from - b.from)
  return series
}

function expand(slices: Slice[]): Map<number, number> {
  const out = new Map<number, number>()
  const gaps = slices.slice(1).map((s, i) => s.from - slices[i].from).filter((g) => g > 0)
  const fallbackStep = gaps.length ? Math.min(...gaps) : 3
  slices.forEach((s, i) => {
    const next = slices[i + 1]
    const end = s.to ?? (next && next.from > s.from ? next.from : s.from + fallbackStep)
    for (let h = s.from; h < end; h++) out.set(h, s.value)
  })
  return out
}

function rhFromDewPoint(t: number, td: number): number {
  const sat = (x: number) => Math.exp((17.27 * x) / (237.3 + x))
  return Math.max(0, Math.min(100, (100 * sat(td)) / sat(t)))
}

export function parseLocation(location: Json): HourlyRow[] {
  const series = collectSeries(location)
  const temp = expand(series.temp)
  const dew = expand(series.dew)
  const rh = expand(series.rh)
  const wind = expand(series.wind)
  const pop = expand(series.pop)
  const code = expand(series.code)

  const rows: HourlyRow[] = []
  for (const idx of [...temp.keys()].sort((a, b) => a - b)) {
    const t = temp.get(idx)!
    const p = pop.get(idx)
    const td = dew.get(idx)
    const h = rh.get(idx) ?? (td !== undefined ? rhFromDewPoint(t, td) : undefined)
    // Without humidity or rain probability the verdict would be a guess, so those hours are left out.
    if (h === undefined || p === undefined) continue
    rows.push({ idx, temp: t, rh: Math.round(h), wind: wind.get(idx) ?? 0, pop: p, code: code.get(idx) ?? null })
  }
  return rows
}

/** Hourly rows for one district, or null when the district is not in the response. */
export function extractDistrictRows(body: unknown, district: string): HourlyRow[] | null {
  const loc = findLocations(body).find((l) => l.LocationName === district)
  return loc ? parseLocation(loc) : null
}
