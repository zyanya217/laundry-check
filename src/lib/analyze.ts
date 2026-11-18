import type { HourlyRow } from '../../server/cwa'
import { wallHour } from './time'

// Tunable constants. The dryness score is a heuristic, not a measurement: compare it with how your
// laundry really turns out and adjust these numbers.
export const DRY_OK = 12 // score at or above this: dry by collect time
export const DRY_HALF = 6 // score at or above this: half dry
export const POP_MID = 30 // rain probability (%) that makes the verdict borderline
export const POP_BAD = 60 // rain probability (%) that makes it "dry indoors"
export const COVER_FACTOR = 0.5 // how much rain probability still counts when the balcony has a roof

export type Level = 'ok' | 'mid' | 'bad'
export type Dryness = 'dry' | 'half' | 'wet'
export type ReasonKey = 'ok_dry' | 'ok_half' | 'rain_mid' | 'rain_bad' | 'humid'

export interface Analysis {
  level: Level
  reason: ReasonKey
  dry: Dryness
  score: number
  rainFrom: number | null
  rainTo: number | null
  rainPop: number
}

const saturationKPa = (t: number): number => 0.6108 * Math.exp((17.27 * t) / (t + 237.3))

/** Drying power for one hour: vapour pressure deficit, boosted by wind, damped when rain is likely. */
export function evaporation(r: HourlyRow, covered: boolean): number {
  const vpd = saturationKPa(r.temp) * (1 - r.rh / 100)
  let e = vpd * (1 + 0.25 * Math.min(r.wind, 6))
  if (r.pop >= 50) e *= covered ? 0.6 : 0.3
  else if (r.pop >= POP_MID) e *= covered ? 0.85 : 0.6
  return e
}

export function analyze(rows: HourlyRow[], covered: boolean): Analysis {
  const cf = covered ? COVER_FACTOR : 1
  const maxPop = Math.max(...rows.map((r) => r.pop))
  const effPop = maxPop * cf
  const rain: Level = effPop >= POP_BAD ? 'bad' : effPop >= POP_MID ? 'mid' : 'ok'

  const wet = rows.filter((r) => r.pop >= POP_MID)
  const score = rows.reduce((sum, r) => sum + evaporation(r, covered), 0)
  const dry: Dryness = score >= DRY_OK ? 'dry' : score >= DRY_HALF ? 'half' : 'wet'

  let level: Level = 'ok'
  let reason: ReasonKey = dry === 'dry' ? 'ok_dry' : 'ok_half'
  if (rain === 'bad') {
    level = 'bad'
    reason = 'rain_bad'
  } else if (rain === 'mid') {
    level = 'mid'
    reason = 'rain_mid'
  } else if (dry === 'wet') {
    level = 'mid'
    reason = 'humid'
  }

  return {
    level,
    reason,
    dry,
    score,
    rainFrom: wet.length ? wallHour(wet[0].idx) : null,
    rainTo: wet.length ? (wallHour(wet[wet.length - 1].idx) + 1) % 24 : null,
    rainPop: wet.length ? Math.max(...wet.map((r) => r.pop)) : 0,
  }
}
