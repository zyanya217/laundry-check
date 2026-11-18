import { describe, expect, it } from 'vitest'
import type { HourlyRow } from '../../server/cwa'
import { analyze } from './analyze'

// idx 480 is a Taipei midnight, so 480 + 21 is 21:00.
const night = (n: number, over: (i: number) => Partial<HourlyRow> = () => ({})): HourlyRow[] =>
  Array.from({ length: n }, (_, i) => ({ idx: 480 + 21 + i, temp: 21, rh: 62, wind: 2.8, pop: 3, code: 1, ...over(i) }))

describe('analyze', () => {
  it('a clear, breezy night is good to hang outside and dries by morning', () => {
    const a = analyze(night(12), false)
    expect(a.level).toBe('ok')
    expect(a.dry).toBe('dry')
    expect(a.reason).toBe('ok_dry')
  })

  it('cool, humid air without rain is borderline and leaves clothes wet', () => {
    const a = analyze(night(12, () => ({ temp: 17, rh: 95, wind: 1, pop: 14, code: 7 })), false)
    expect(a.level).toBe('mid')
    expect(a.reason).toBe('humid')
    expect(a.dry).toBe('wet')
  })

  it('a likely downpour means dry it indoors, and reports when it rains', () => {
    const a = analyze(night(12, (i) => (i >= 3 && i <= 6 ? { pop: 80, rh: 95 } : {})), false)
    expect(a.level).toBe('bad')
    expect(a.reason).toBe('rain_bad')
    expect(a.rainFrom).toBe(0)
    expect(a.rainTo).toBe(4)
    expect(a.rainPop).toBe(80)
  })

  it('a roof softens the same forecast to borderline', () => {
    const rows = night(12, (i) => (i >= 3 && i <= 6 ? { pop: 80, rh: 95 } : {}))
    expect(analyze(rows, true).level).toBe('mid')
    expect(analyze(rows, true).reason).toBe('rain_mid')
  })

  it('wind and warmth raise the dryness score', () => {
    const slow = analyze(night(12, () => ({ wind: 0.5 })), false).score
    const fast = analyze(night(12, () => ({ wind: 4 })), false).score
    expect(fast).toBeGreaterThan(slow)
  })
})
