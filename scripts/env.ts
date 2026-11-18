import { readFileSync } from 'node:fs'

/** Reads CWA_API_KEY from the environment or .env.local. Exits with a message when it is missing. */
export function requireApiKey(): string {
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // no .env.local, fall back to the process environment
  }
  const key = process.env.CWA_API_KEY
  if (!key) {
    console.error('CWA_API_KEY is not set. Copy .env.example to .env.local and fill it in.')
    process.exit(1)
  }
  return key
}

export function datasetUrl(dataset: string, key: string): string {
  return `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${dataset}?Authorization=${encodeURIComponent(key)}&format=JSON`
}
