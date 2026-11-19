import type { HourlyRow } from '../../server/cwa'
import { taipeiNowIdx, wallHour } from './time'

export type DemoScene = 'clear' | 'rain' | 'humid'

// Each demo scene covers eight days and mixes weather, so the seven-day suggestion has something to rank.
// Entry 0 is today and decides what the main verdict shows.
const WEEK: Record<DemoScene, DemoScene[]> = {
  clear: ['clear', 'clear', 'humid', 'rain', 'rain', 'clear', 'clear', 'clear'],
  rain: ['rain', 'rain', 'humid', 'clear', 'clear', 'humid', 'rain', 'rain'],
  humid: ['humid', 'humid', 'humid', 'clear', 'humid', 'humid', 'rain', 'humid'],
}

function demoRow(mode: DemoScene, idx: number): HourlyRow {
  const h = wallHour(idx)
  const diu = Math.cos((2 * Math.PI * (h - 15)) / 24)
  let temp = 20 + 3 * diu
  let rh = 78 - 14 * diu
  let wind = 2.2 + 0.8 * Math.sin(idx / 5)
  let pop = 5
  let code = 4
  if (mode === 'clear') {
    temp = 21 + 4 * diu
    rh = 66 - 12 * diu
    wind = 2.8 + 0.6 * Math.sin(idx / 4)
    pop = 3
    code = 1
  } else if (mode === 'rain') {
    const d = Math.min(Math.abs(h - 3), 24 - Math.abs(h - 3))
    pop = Math.round(Math.max(8, 92 - d * 15))
    rh = Math.min(97, 88 - 8 * diu)
    code = 8
  } else {
    temp = 17 + 2 * diu
    rh = Math.min(98, 92 - 6 * diu)
    wind = 1 + 0.4 * Math.sin(idx / 6)
    pop = 14
    code = 7
  }
  return { idx, temp: Math.round(temp * 10) / 10, rh: Math.round(rh), wind: Math.round(wind * 10) / 10, pop, code }
}

/** Sample data for trying the UI without an API key: open the page with ?demo=clear, rain or humid. */
export function makeDemo(scene: DemoScene, nowIdx = taipeiNowIdx()): HourlyRow[] {
  const today = Math.floor(nowIdx / 24)
  const rows: HourlyRow[] = []
  for (let idx = nowIdx - 2; idx <= nowIdx + 24 * 8; idx++) {
    const day = Math.min(WEEK[scene].length - 1, Math.max(0, Math.floor(idx / 24) - today))
    rows.push(demoRow(WEEK[scene][day], idx))
  }
  return rows
}
