import { describe, expect, it } from 'vitest'
import type { HourlyRow } from '../../server/cwa'
import { bestOffset, evaluateWeek, judgedPicks } from './week'

// idx 480 is a Taipei midnight; "now" is 13:00 on that day.
const MIDNIGHT = 480
const NOW = MIDNIGHT + 13

type Mode = 'clear' | 'rain' | 'humid'
const hourRow = (idx: number, mode: Mode): HourlyRow => {
  if (mode === 'rain') return { idx, temp: 20, rh: 95, wind: 1, pop: 85, code: 8 }
  if (mode === 'humid') return { idx, temp: 17, rh: 95, wind: 1, pop: 10, code: 7 }
  return { idx, temp: 22, rh: 60, wind: 3, pop: 3, code: 1 }
}
/** Eight days of hourly rows where each calendar day follows its own mode. */
const week = (modes: Mode[]): HourlyRow[] =>
  Array.from({ length: modes.length * 24 }, (_, i) => hourRow(MIDNIGHT + i, modes[Math.floor(i / 24)]))

describe('evaluateWeek', () => {
  it('judges four evenings, each from the start hour to the next morning', () => {
    const picks = evaluateWeek(week(Array(9).fill('clear')), NOW, 21, 8, false)
    expect(picks).toHaveLength(4)
    expect(picks.map((p) => p.offset)).toEqual([0, 1, 2, 3])
    expect(picks.every((p) => p.analysis?.level === 'ok')).toBe(true)
    expect(picks[1].dayNumber - picks[0].dayNumber).toBe(1)
  })

  it('leaves a day without enough forecast unjudged', () => {
    const picks = evaluateWeek(week(['clear', 'clear', 'clear']), NOW, 21, 8, false)
    expect(picks[0].analysis).not.toBeNull()
    expect(picks[1].analysis).not.toBeNull()
    expect(picks[2].analysis).toBeNull()
    expect(picks[3].analysis).toBeNull()
  })

  it('shows only the days that have a forecast, three or four of them', () => {
    expect(judgedPicks(evaluateWeek(week(['clear', 'clear', 'clear']), NOW, 21, 8, false))).toHaveLength(2)
    expect(judgedPicks(evaluateWeek(week(Array(4).fill('clear')), NOW, 21, 8, false))).toHaveLength(3)
    expect(judgedPicks(evaluateWeek(week(Array(5).fill('clear')), NOW, 21, 8, false))).toHaveLength(4)
    expect(judgedPicks([])).toEqual([])
  })

  it('a rainy day spoils both its own evening and the evening before, since the window ends the next morning', () => {
    // Day 3 rains. The evening of day 2 ends in day 3's morning rain, and the evening of day 3 is itself rainy.
    const modes: Mode[] = ['clear', 'clear', 'clear', 'rain', 'clear', 'clear', 'clear', 'clear', 'clear']
    const picks = evaluateWeek(week(modes), NOW, 21, 8, false)
    expect(picks.map((p) => p.analysis?.level)).toEqual(['ok', 'ok', 'bad', 'bad'])
    expect(picks[3].maxPop).toBe(85)
  })
})

describe('bestOffset', () => {
  it('prefers a clear evening over humid and rainy ones', () => {
    // Offset 0 is humid, offset 2 sits between two clear days, offset 3 runs into rain.
    const modes: Mode[] = ['humid', 'humid', 'clear', 'clear', 'rain', 'rain', 'rain', 'rain', 'rain']
    const picks = evaluateWeek(week(modes), NOW, 21, 8, false)
    expect(picks[0].analysis?.level).toBe('mid')
    expect(picks[3].analysis?.level).toBe('bad')
    expect(bestOffset(picks)).toBe(2)
  })

  it('picks the driest of several good evenings, and the earlier one on a tie', () => {
    const picks = evaluateWeek(week(Array(9).fill('clear')), NOW, 21, 8, false)
    expect(bestOffset(picks)).toBe(0)
  })

  it('recommends nothing when every judged evening is bad', () => {
    const picks = evaluateWeek(week(Array(9).fill('rain')), NOW, 21, 8, false)
    expect(bestOffset(picks)).toBeNull()
  })

  it('recommends nothing when no evening could be judged', () => {
    expect(bestOffset(evaluateWeek([], NOW, 21, 8, false))).toBeNull()
  })

  it('a roof can turn a bad week into a recommendable one', () => {
    const rows = week(Array(9).fill('rain')).map((r) => ({ ...r, pop: 80 }))
    expect(bestOffset(evaluateWeek(rows, NOW, 21, 8, false))).toBeNull()
    expect(bestOffset(evaluateWeek(rows, NOW, 21, 8, true))).not.toBeNull()
  })
})
