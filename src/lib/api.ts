import type { HourlyRow } from '../../server/cwa'

export interface ForecastPayload {
  county: string
  district: string
  rows: HourlyRow[]
  /** One-week forecast, coarser than `rows`. Missing or empty when it could not be read. */
  weekRows?: HourlyRow[]
  fetchedAt: string
}

export class ForecastError extends Error {
  constructor(public code: string) {
    super(code)
  }
}

export async function fetchForecast(county: string, district: string, signal?: AbortSignal): Promise<ForecastPayload> {
  let res: Response
  try {
    res = await fetch(`/api/forecast?county=${encodeURIComponent(county)}&district=${encodeURIComponent(district)}`, { signal })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ForecastError('network')
  }
  if (!res.ok) {
    let code = `http_${res.status}`
    try {
      const body = await res.json()
      if (typeof body.error === 'string') code = body.error
    } catch {
      // keep the status-based code
    }
    throw new ForecastError(code)
  }
  return (await res.json()) as ForecastPayload
}
