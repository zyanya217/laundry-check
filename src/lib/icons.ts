import type { HourlyRow } from '../../server/cwa'
import { wallHour } from './time'

export type WeatherIcon = 'sun' | 'moon' | 'cloud' | 'rain'

// Assumptions, to confirm with `npm run probe`: WeatherCode 01 to 03 mean mostly clear, other codes
// mean cloudy. Rain is judged from the rain probability rather than from the code.
export function iconFor(r: HourlyRow): WeatherIcon {
  if (r.pop >= 40) return 'rain'
  if (r.code !== null && r.code <= 3) {
    const h = wallHour(r.idx)
    return h >= 6 && h < 18 ? 'sun' : 'moon'
  }
  return 'cloud'
}
