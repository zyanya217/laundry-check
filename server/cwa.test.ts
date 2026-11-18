import { describe, expect, it } from 'vitest'
import { extractDistrictRows, findLocations, listLocations } from './cwa'
import { handleForecastRequest } from './forecast'

// Hand-written from CWA's product documentation (tag names and hierarchy). It is NOT a captured response.
function fixture(overrides: { withRH?: boolean; tz?: string } = {}) {
  const tz = overrides.tz ?? '+08:00'
  const at = (h: number) => `2026-11-14T${String(h).padStart(2, '0')}:00:00${tz}`
  const three = [18, 21].map((h, i) => ({
    DataTime: at(h),
    ElementValue: [{ Temperature: String(20 - i) }],
  }))
  const dew = [18, 21].map((h) => ({ DataTime: at(h), ElementValue: [{ DewPoint: '14' }] }))
  const rh = [18, 21].map((h, i) => ({ DataTime: at(h), ElementValue: [{ RelativeHumidity: String(70 + i * 5) }] }))
  const wind = [18, 21].map((h) => ({ DataTime: at(h), ElementValue: [{ WindSpeed: '2', BeaufortScale: '2' }] }))
  const pop = [{ StartTime: at(18), EndTime: `2026-11-15T00:00:00${tz}`, ElementValue: [{ ProbabilityOfPrecipitation: '30' }] }]
  const code = [{ DataTime: at(18), ElementValue: [{ Weather: '多雲', WeatherCode: '04' }] }]
  const elements: unknown[] = [
    { ElementName: 'T', Time: three },
    { ElementName: 'Td', Time: dew },
    { ElementName: 'WS', Time: wind },
    { ElementName: 'PoP', Time: pop },
    { ElementName: 'Wx', Time: code },
  ]
  if (overrides.withRH !== false) elements.push({ ElementName: 'RH', Time: rh })
  return {
    success: 'true',
    records: {
      Locations: [
        {
          LocationsName: '臺北市',
          Location: [
            { LocationName: '南港區', Geocode: '6300900', Latitude: '25.05', Longitude: '121.6', WeatherElement: elements },
            { LocationName: '內湖區', Geocode: '6301000', Latitude: '25.08', Longitude: '121.59', WeatherElement: [] },
          ],
        },
      ],
    },
  }
}

describe('cwa parser', () => {
  it('finds locations under records.Locations and without the records wrapper', () => {
    expect(findLocations(fixture())).toHaveLength(2)
    expect(findLocations(fixture().records)).toHaveLength(2)
    expect(findLocations({ nothing: true })).toEqual([])
  })

  it('lists names and coordinates', () => {
    expect(listLocations(fixture())[0]).toEqual({ name: '南港區', geocode: '6300900', lat: 25.05, lon: 121.6 })
  })

  it('holds 3-hourly values until the next one', () => {
    const rows = extractDistrictRows(fixture(), '南港區')!
    expect(rows.map((r) => r.temp)).toEqual([20, 20, 20, 19, 19, 19])
    expect(rows).toHaveLength(6)
  })

  it('fills an interval value (StartTime to EndTime) across its hours', () => {
    const rows = extractDistrictRows(fixture(), '南港區')!
    expect(rows.every((r) => r.pop === 30)).toBe(true)
  })

  it('reads the Taipei hour index regardless of the offset written in the string', () => {
    const a = extractDistrictRows(fixture(), '南港區')!
    const b = extractDistrictRows(fixture({ tz: '' }), '南港區')!
    expect(a[0].idx).toBe(b[0].idx)
    expect(a[0].idx % 24).toBe(18)
  })

  it('derives humidity from dew point when RelativeHumidity is absent', () => {
    const rows = extractDistrictRows(fixture({ withRH: false }), '南港區')!
    expect(rows[0].rh).toBeGreaterThan(60)
    expect(rows[0].rh).toBeLessThan(80)
  })

  it('returns null for an unknown district and an empty list for a district without data', () => {
    expect(extractDistrictRows(fixture(), '不存在區')).toBeNull()
    expect(extractDistrictRows(fixture(), '內湖區')).toEqual([])
  })
})

describe('forecast endpoint', () => {
  const ok = () => Promise.resolve(new Response(JSON.stringify(fixture()), { status: 200 }))
  const params = (county: string, district: string) => new URLSearchParams({ county, district })

  it('returns compact rows for the requested district', async () => {
    const res = await handleForecastRequest(params('臺北市', '南港區'), 'key', ok)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.rows).toHaveLength(6)
    expect(JSON.stringify(body)).not.toContain('key')
  })

  it('sends the key only to the CWA host', async () => {
    let seen = ''
    await handleForecastRequest(params('臺北市', '南港區'), 'secret', (u) => {
      seen = u
      return ok()
    })
    expect(seen.startsWith('https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?')).toBe(true)
    expect(seen).toContain('Authorization=secret')
  })

  it('rejects unknown counties and odd district strings before calling CWA', async () => {
    let called = false
    const spy = () => {
      called = true
      return ok()
    }
    expect((await handleForecastRequest(params('火星市', '南港區'), 'k', spy)).status).toBe(400)
    expect((await handleForecastRequest(params('臺北市', '../x'), 'k', spy)).status).toBe(400)
    expect(called).toBe(false)
  })

  it('reports a missing key, upstream failures and unknown districts', async () => {
    expect((await handleForecastRequest(params('臺北市', '南港區'), '', ok)).status).toBe(500)
    expect((await handleForecastRequest(params('臺北市', '南港區'), 'k', () => Promise.resolve(new Response('', { status: 403 })))).status).toBe(502)
    expect((await handleForecastRequest(params('臺北市', '不存在區'), 'k', ok)).status).toBe(404)
    expect((await handleForecastRequest(params('臺北市', '內湖區'), 'k', ok)).status).toBe(502)
  })
})
