// File extensions are written out because vite.config.ts imports this file.
import { COUNTY_DATASETS } from '../src/data/counties.ts'
import { extractDistrictRows } from './cwa.ts'

export type Fetcher = (url: string) => Promise<Response>

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extra },
  })
}

/**
 * GET /api/forecast?county=臺北市&district=南港區
 * Holds the CWA key on the server, asks CWA for the county dataset, and returns only the chosen
 * district as compact hourly rows. Only datasets listed in COUNTY_DATASETS can be requested.
 */
export async function handleForecastRequest(
  params: URLSearchParams,
  apiKey: string,
  fetcher: Fetcher = (u) => fetch(u),
): Promise<Response> {
  const county = params.get('county') ?? ''
  const district = params.get('district') ?? ''
  const dataset = COUNTY_DATASETS[county]
  if (!dataset || !/^[一-鿿]{1,8}$/.test(district)) return json({ error: 'bad_params' }, 400)
  if (!apiKey) return json({ error: 'missing_api_key' }, 500)

  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${dataset}?Authorization=${encodeURIComponent(apiKey)}&format=JSON`
  let upstream: Response
  try {
    upstream = await fetcher(url)
  } catch {
    return json({ error: 'upstream_unreachable' }, 502)
  }
  if (!upstream.ok) return json({ error: 'upstream_error', status: upstream.status }, 502)

  let body: unknown
  try {
    body = await upstream.json()
  } catch {
    return json({ error: 'upstream_not_json' }, 502)
  }

  const rows = extractDistrictRows(body, district)
  if (rows === null) return json({ error: 'district_not_found' }, 404)
  if (rows.length === 0) return json({ error: 'unexpected_shape' }, 502)

  return json({ county, district, rows, fetchedAt: new Date().toISOString() }, 200, {
    'cache-control': 'public, max-age=300',
  })
}
