// File extensions are written out because vite.config.ts imports this file.
import { COUNTY_DATASETS, COUNTY_WEEK_DATASETS } from '../src/data/counties.ts'
import { extractDistrictRows } from './cwa.ts'

export type Fetcher = (url: string) => Promise<Response>

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extra },
  })
}

type Fetched = { body: unknown } | { error: Response }

async function getJson(fetcher: Fetcher, url: string): Promise<Fetched> {
  let upstream: Response
  try {
    upstream = await fetcher(url)
  } catch {
    return { error: json({ error: 'upstream_unreachable' }, 502) }
  }
  if (!upstream.ok) return { error: json({ error: 'upstream_error', status: upstream.status }, 502) }
  try {
    return { body: await upstream.json() }
  } catch {
    return { error: json({ error: 'upstream_not_json' }, 502) }
  }
}

/**
 * GET /api/forecast?county=臺北市&district=南港區
 * Holds the CWA key on the server, asks CWA for the county's short-range dataset and its one-week dataset
 * at the same time, and returns only the chosen district as compact hourly rows. `rows` is the short-range
 * forecast; `weekRows` is the one-week forecast and is empty when that dataset cannot be read, so a failure
 * there never breaks the main verdict. Only datasets listed in src/data/counties.ts can be requested.
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

  const urlFor = (id: string) =>
    `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${id}?Authorization=${encodeURIComponent(apiKey)}&format=JSON`
  const weekDataset = COUNTY_WEEK_DATASETS[county]

  const [main, week] = await Promise.all([
    getJson(fetcher, urlFor(dataset)),
    weekDataset ? getJson(fetcher, urlFor(weekDataset)) : Promise.resolve(null),
  ])
  if ('error' in main) return main.error

  const rows = extractDistrictRows(main.body, district)
  if (rows === null) return json({ error: 'district_not_found' }, 404)
  if (rows.length === 0) return json({ error: 'unexpected_shape' }, 502)

  const weekRows = week && 'body' in week ? (extractDistrictRows(week.body, district) ?? []) : []

  return json({ county, district, rows, weekRows, fetchedAt: new Date().toISOString() }, 200, {
    'cache-control': 'public, max-age=300',
  })
}
