import type { HourlyRow } from '../../server/cwa'
import { analyze, type Analysis, type Level } from './analyze'
import { buildWindow } from './window'

/**
 * How many evenings to try. The short-range forecast only reaches about three to four days (it grows through the day as the
 * forecast is reissued), and the one-week dataset has no rain probability past that, so the last ones are often unjudged.
 */
export const WEEK_DAYS = 4
/** A day is only judged when at least this share of its hours has forecast data. */
const MIN_COVERAGE = 0.6

export interface DayPick {
  offset: number
  /** Wall-clock day number (days since the epoch), used to print the date. */
  dayNumber: number
  analysis: Analysis | null
  /** Highest rain probability in the window, for display. */
  maxPop: number
}

const levelRank: Record<Level, number> = { ok: 0, mid: 1, bad: 2 }

/** Judges each of the next evenings with the same window the main verdict uses (start hour to collect hour). */
export function evaluateWeek(
  rows: HourlyRow[],
  nowIdx: number,
  startHour: number,
  collectHour: number,
  covered: boolean,
): DayPick[] {
  const picks: DayPick[] = []
  for (let offset = 0; offset < WEEK_DAYS; offset++) {
    const w = buildWindow(rows, nowIdx, startHour, collectHour, offset)
    const expected = w.endIdx - w.startIdx + 1
    const enough = w.rows.length >= 2 && w.rows.length >= expected * MIN_COVERAGE
    picks.push({
      offset,
      dayNumber: Math.floor(w.startIdx / 24),
      analysis: enough ? analyze(w.rows, covered) : null,
      maxPop: enough ? Math.max(...w.rows.map((r) => r.pop)) : 0,
    })
  }
  return picks
}

/**
 * The offset of the best evening, or null when no evening is good enough to recommend.
 * Better verdict first, then the higher dryness score, then the earlier day.
 */
export function bestOffset(picks: DayPick[]): number | null {
  const judged = picks.filter((p): p is DayPick & { analysis: Analysis } => p.analysis !== null)
  if (judged.length === 0) return null
  const sorted = [...judged].sort(
    (a, b) =>
      levelRank[a.analysis.level] - levelRank[b.analysis.level] ||
      b.analysis.score - a.analysis.score ||
      a.offset - b.offset,
  )
  return sorted[0].analysis.level === 'bad' ? null : sorted[0].offset
}

/** Drops the trailing days that could not be judged, so the list only has days with a forecast. */
export function judgedPicks(picks: DayPick[]): DayPick[] {
  let last = picks.length - 1
  while (last >= 0 && picks[last].analysis === null) last--
  return picks.slice(0, last + 1)
}
