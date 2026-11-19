import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { HourlyRow } from '../../server/cwa'
import { fetchForecast, ForecastError } from '../lib/api'
import { makeDemo, type DemoScene } from '../lib/demo'
import { settings } from './useSettings'

export type ForecastStatus = 'loading' | 'ready' | 'error'
const STALE_MS = 15 * 60 * 1000

function demoScene(): DemoScene | null {
  const v = new URLSearchParams(location.search).get('demo')
  return v === 'clear' || v === 'rain' || v === 'humid' ? v : null
}

export function useForecast() {
  const rows = ref<HourlyRow[]>([])
  const weekRows = ref<HourlyRow[]>([])
  const status = ref<ForecastStatus>('loading')
  const errorCode = ref('')
  const fetchedAt = ref('')
  const isDemo = ref(false)
  let controller: AbortController | null = null
  let loadedAt = 0

  async function load(): Promise<void> {
    controller?.abort()
    const scene = demoScene()
    if (scene) {
      rows.value = makeDemo(scene)
      weekRows.value = []
      isDemo.value = true
      status.value = 'ready'
      return
    }
    const mine = (controller = new AbortController())
    status.value = 'loading'
    errorCode.value = ''
    try {
      const payload = await fetchForecast(settings.county, settings.district, mine.signal)
      rows.value = payload.rows
      weekRows.value = payload.weekRows ?? []
      fetchedAt.value = payload.fetchedAt
      loadedAt = Date.now()
      status.value = 'ready'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      errorCode.value = e instanceof ForecastError ? e.code : 'unknown'
      status.value = 'error'
    }
  }

  const onVisible = () => {
    if (document.visibilityState === 'visible' && status.value === 'ready' && !isDemo.value && Date.now() - loadedAt > STALE_MS) {
      void load()
    }
  }

  watch(() => [settings.county, settings.district], load, { immediate: true })
  onMounted(() => document.addEventListener('visibilitychange', onVisible))
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisible)
    controller?.abort()
  })

  return { rows, weekRows, status, errorCode, fetchedAt, isDemo, reload: load }
}
