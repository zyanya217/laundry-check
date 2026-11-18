import { describe, expect, it } from 'vitest'
import type { HourlyRow } from '../../server/cwa'
import { buildWindow } from './window'

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
})
