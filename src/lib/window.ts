import type { HourlyRow } from '../../server/cwa'

export interface HangWindow {
  rows: HourlyRow[]
  startIdx: number
  endIdx: number
  /** Which day the clothes come in, relative to now. */
  collectDay: 'today' | 'tomorrow' | 'dat'
  /** True when the chosen start hour had already passed and the window begins at the next full hour. */
  startMoved: boolean
}

/** Hours from the start of hanging up to (and including) the collect hour. */
export function buildWindow(rows: HourlyRow[], nowIdx: number, startHour: number, collectHour: number): HangWindow {
  const wanted = Math.floor(nowIdx / 24) * 24 + startHour
  const startIdx = Math.max(wanted, nowIdx + 1)
  let endIdx = Math.floor(startIdx / 24) * 24 + collectHour
  if (endIdx <= startIdx) endIdx += 24

  const byIdx = new Map(rows.map((r) => [r.idx, r]))
  const inWindow: HourlyRow[] = []
  for (let i = startIdx; i <= endIdx; i++) {
    const r = byIdx.get(i)
    if (r) inWindow.push(r)
  }

  const dayDiff = Math.floor(endIdx / 24) - Math.floor(nowIdx / 24)
  return {
    rows: inWindow,
    startIdx,
    endIdx,
    collectDay: dayDiff <= 0 ? 'today' : dayDiff === 1 ? 'tomorrow' : 'dat',
    startMoved: startIdx > wanted,
  }
}
