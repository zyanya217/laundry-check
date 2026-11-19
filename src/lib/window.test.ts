import { describe, expect, it } from 'vitest'
import type { HourlyRow } from '../../server/cwa'
import { buildWindow, mergeRows } from './window'

const DAY20 = 24 * 20
const rows: HourlyRow[] = Array.from({ length: 72 }, (_, i) => ({ idx: DAY20 + i, temp: 20, rh: 70, wind: 2, pop: 10, code: 4 }))

describe('buildWindow', () => {
  it('runs from the start hour tonight to the collect hour tomorrow, inclusive', () => {
    const w = buildWindow(rows, DAY20 + 13, 21, 8)
    expect(w.startIdx).toBe(DAY20 + 21)
    expect(w.endIdx).toBe(DAY20 + 32)
    expect(w.rows).toHaveLength(12)
    expect(w.collectDay).toBe('tomorrow')
    expect(w.startMoved).toBe(false)
  })

  it('starts at the next full hour when the chosen start has already passed', () => {
    const w = buildWindow(rows, DAY20 + 22, 21, 8)
    expect(w.startIdx).toBe(DAY20 + 23)
    expect(w.startMoved).toBe(true)
  })

  it('keeps only the hours the forecast covers', () => {
    const short = rows.filter((r) => r.idx <= DAY20 + 26)
    expect(buildWindow(short, DAY20 + 13, 21, 8).rows).toHaveLength(6)
  })

  it('collects the same day when the start is after midnight', () => {
    const w = buildWindow(rows, DAY20 + 1, 3, 8)
    expect(w.collectDay).toBe('today')
  })

  it('moves the whole window forward by dayOffset days', () => {
    const w = buildWindow(rows, DAY20 + 13, 21, 8, 1)
    expect(w.startIdx).toBe(DAY20 + 24 + 21)
    expect(w.endIdx).toBe(DAY20 + 24 + 32)
    expect(w.collectDay).toBe('dat')
    expect(w.startMoved).toBe(false)
  })
})

describe('mergeRows', () => {
  const row = (idx: number, temp: number): HourlyRow => ({ idx, temp, rh: 70, wind: 2, pop: 10, code: 4 })

  it('keeps every hour from both lists in order, preferring the primary where they overlap', () => {
    const merged = mergeRows([row(2, 99), row(3, 99)], [row(1, 1), row(2, 1), row(4, 1)])
    expect(merged.map((r) => r.idx)).toEqual([1, 2, 3, 4])
    expect(merged.map((r) => r.temp)).toEqual([1, 99, 99, 1])
  })

  it('works when one list is empty', () => {
    expect(mergeRows([], [row(1, 1)])).toHaveLength(1)
    expect(mergeRows([row(1, 1)], [])).toHaveLength(1)
  })
})
