import raw from './districts.json'

export interface DistrictEntry {
  name: string
  geocode?: string
  lat?: number
  lon?: number
}

// Seeded with the 12 districts of 臺北市 (names only). `npm run gen:districts` rewrites districts.json
// with every county, plus the coordinates GPS lookup needs, taken from CWA's own responses.
export const DISTRICTS = raw as Record<string, DistrictEntry[]>
