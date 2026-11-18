import type { DistrictEntry } from '../data/districts'

/** A position farther than this from every district centre is treated as outside the covered area. */
export const MAX_GPS_KM = 60

export interface NearestDistrict {
  county: string
  district: string
  km: number
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

/** Nearest district centre, or null when the table has no coordinates at all. */
export function nearestDistrict(
  lat: number,
  lon: number,
  table: Record<string, DistrictEntry[]>,
): NearestDistrict | null {
  let best: NearestDistrict | null = null
  for (const [county, districts] of Object.entries(table)) {
    for (const d of districts) {
      if (d.lat === undefined || d.lon === undefined) continue
      const km = haversineKm(lat, lon, d.lat, d.lon)
      if (!best || km < best.km) best = { county, district: d.name, km }
    }
  }
  return best
}
