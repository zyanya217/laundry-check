import { defineConfig } from 'vitest/config'
import { loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { handleForecastRequest } from './server/forecast.ts'

// Local stand-in for the Cloudflare Pages Function in functions/api/forecast.ts.
// The API key comes from .env.local (CWA_API_KEY) and never reaches the browser bundle.
function cwaDevApi(apiKey: string): Plugin {
  return {
    name: 'cwa-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/forecast', async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const r = await handleForecastRequest(url.searchParams, apiKey)
        res.statusCode = r.status
        r.headers.forEach((value, name) => res.setHeader(name, value))
        res.end(await r.text())
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue(), tailwindcss(), cwaDevApi(env.CWA_API_KEY ?? '')],
    test: { environment: 'node', include: ['server/**/*.test.ts', 'src/**/*.test.ts'] },
  }
})
