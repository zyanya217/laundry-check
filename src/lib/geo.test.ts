import { describe, expect, it } from 'vitest'
import { haversineKm, nearestDistrict } from './geo'

const table = {
  甲市: [{ name: 'A區', lat: 25.0, lon: 121.5 }, { name: 'B區', lat: 25.1, lon: 121.6 }, { name: '無座標區' }],
  乙縣: [{ name: 'C鄉', lat: 23.0, lon: 120.2 }],
}

describe('geo', () => {
  it('measures a degree of latitude as about 111 km', () => {
    expect(haversineKm(25, 121, 26, 121)).toBeGreaterThan(110)
    expect(haversineKm(25, 121, 26, 121)).toBeLessThan(112)
  })

  it('picks the nearest district across counties and skips entries without coordinates', () => {
    expect(nearestDistrict(25.09, 121.59, table)).toMatchObject({ county: '甲市', district: 'B區' })
    expect(nearestDistrict(23.01, 120.21, table)).toMatchObject({ county: '乙縣', district: 'C鄉' })
  })

  it('returns null when no district has coordinates', () => {
    expect(nearestDistrict(25, 121, { 甲市: [{ name: 'A區' }] })).toBeNull()
  })
})
