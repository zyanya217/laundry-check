import { handleForecastRequest } from '../../server/forecast'

interface Env {
  CWA_API_KEY: string
}

// Cloudflare Pages Function: GET /api/forecast. Set CWA_API_KEY as an encrypted environment variable
// in the Pages project settings. Upstream responses are cached at the edge for 15 minutes.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const { searchParams } = new URL(request.url)
  return handleForecastRequest(searchParams, env.CWA_API_KEY, (url) =>
    fetch(url, { cf: { cacheTtl: 900, cacheEverything: true } }),
  )
}
