<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BestDays from './components/BestDays.vue'
import HourlyChart from './components/HourlyChart.vue'
import SettingsSheet from './components/SettingsSheet.vue'
import VerdictCard from './components/VerdictCard.vue'
import { t } from './composables/useI18n'
import { useForecast } from './composables/useForecast'
import { settings } from './composables/useSettings'
import { useTheme } from './composables/useTheme'
import { analyze } from './lib/analyze'
import { hh, taipeiClock, taipeiNowIdx, wallHour } from './lib/time'
import { bestOffset, evaluateWeek, judgedPicks } from './lib/week'
import { buildWindow, mergeRows } from './lib/window'

useTheme()
const forecast = useForecast()
const sheetOpen = ref(false)

// Re-evaluate the window once a minute so "now" does not go stale while the page stays open.
const tick = ref(Date.now())
let timer = 0
onMounted(() => (timer = window.setInterval(() => (tick.value = Date.now()), 60_000)))
onBeforeUnmount(() => window.clearInterval(timer))

const win = computed(() =>
  buildWindow(forecast.rows.value, taipeiNowIdx(new Date(tick.value)), settings.startHour, settings.collectHour),
)
const analysis = computed(() => (win.value.rows.length >= 2 ? analyze(win.value.rows, settings.covered) : null))

// The short-range forecast is more precise, so it wins wherever it overlaps the one-week forecast.
const weekPicks = computed(() =>
  evaluateWeek(
    mergeRows(forecast.rows.value, forecast.weekRows.value),
    taipeiNowIdx(new Date(tick.value)),
    settings.startHour,
    settings.collectHour,
    settings.covered,
  ),
)
// Only days with a forecast are shown, so there are three or four equal columns and never an empty one.
const shownPicks = computed(() => judgedPicks(weekPicks.value))
const bestDay = computed(() => bestOffset(shownPicks.value))
const hasWeek = computed(() => shownPicks.value.some((p) => p.offset > 0))

const loading = computed(() => forecast.status.value === 'loading')
const startNote = computed(() => (win.value.startMoved ? t('from_note', { t: hh(wallHour(win.value.startIdx)) }) : null))
const chartLabel = computed(() => {
  const rows = win.value.rows
  if (rows.length < 2) return ''
  return t('chart_aria', {
    a: hh(wallHour(rows[0].idx)),
    b: hh(wallHour(rows[rows.length - 1].idx)),
    p: Math.round(Math.max(...rows.map((r) => r.pop))),
  })
})
// "Tonight 11/20 Fri": the date of the evening being judged. The day number counts wall-clock days, so formatting it in UTC prints the Taipei date.
const dateLabel = computed(() => {
  const d = new Date(Math.floor(win.value.startIdx / 24) * 86_400_000)
  const weekday = new Intl.DateTimeFormat(settings.lang === 'zh' ? 'zh-TW' : 'en', { weekday: 'short', timeZone: 'UTC' }).format(d)
  return `${t('tonight')} ${d.getUTCMonth() + 1}/${d.getUTCDate()} ${weekday}`
})
const updated = computed(() => (forecast.fetchedAt.value ? taipeiClock(forecast.fetchedAt.value) : ''))
</script>

<template>
  <main class="page-pad mx-auto flex max-w-[480px] flex-col gap-[18px]">
    <header class="flex items-center justify-between gap-2.5">
      <button
        type="button"
        class="inline-flex min-h-11 min-w-0 cursor-pointer items-center gap-1.5 rounded-full bg-surface-2 pr-3.5 pl-4 font-medium"
        @click="sheetOpen = true"
      >
        <span class="truncate">{{ settings.county }} {{ settings.district }}</span>
        <svg class="flex-none" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>
      <button
        type="button"
        class="grid size-11 flex-none cursor-pointer place-items-center"
        :aria-label="t('aria_set')"
        @click="sheetOpen = true"
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
          <path d="M3 6h9M16 6h1M3 14h1M8 14h9" />
          <circle cx="14" cy="6" r="2" />
          <circle cx="6" cy="14" r="2" />
        </svg>
      </button>
    </header>

    <section
      v-if="forecast.status.value === 'error'"
      class="flex flex-col items-start gap-2.5 rounded-[22px] bg-bad-bg px-5 py-5 text-bad"
      role="alert"
    >
      <h1 class="text-2xl leading-tight font-bold">{{ t('load_err') }}</h1>
      <p class="text-[15px] text-fg">{{ t('err_hint') }}</p>
      <p class="font-mono text-xs text-muted">{{ forecast.errorCode.value }}</p>
      <button type="button" class="min-h-11 cursor-pointer rounded-full bg-accent px-5 font-bold text-bg" @click="forecast.reload()">
        {{ t('retry') }}
      </button>
    </section>

    <div v-else-if="loading && !analysis" class="h-[190px] animate-pulse rounded-[22px] bg-surface-2" aria-hidden="true" />

    <section v-else-if="!analysis" class="rounded-[22px] bg-mid-bg px-5 py-5 text-mid">
      <h1 class="text-2xl leading-tight font-bold">{{ t('no_data') }}</h1>
    </section>

    <div v-else class="flex flex-col gap-[18px] transition-opacity" :class="loading ? 'opacity-55' : ''">
      <VerdictCard :analysis="analysis" :date-label="dateLabel" :collect-day="win.collectDay" :start-note="startNote" />
      <template v-if="hasWeek">
        <hr class="border-line" />
        <BestDays :picks="shownPicks" :best="bestDay" />
      </template>
      <hr class="border-line" />
      <HourlyChart :rows="win.rows" :label="chartLabel" />
    </div>

    <footer class="flex flex-wrap justify-between gap-x-3.5 gap-y-1 text-xs text-muted">
      <span>{{ forecast.isDemo.value ? t('src_demo') : t('src_cwa') }}</span>
      <span>{{ loading ? t('loading') : updated ? t('upd', { t: updated }) : '' }}</span>
    </footer>
  </main>

  <SettingsSheet :open="sheetOpen" @close="sheetOpen = false" />
</template>
