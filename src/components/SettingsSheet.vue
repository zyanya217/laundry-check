<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { COUNTY_DATASETS } from '../data/counties'
import { DISTRICTS } from '../data/districts'
import { settings, type ThemeChoice } from '../composables/useSettings'
import { t } from '../composables/useI18n'
import { GeoError, locate } from '../composables/useGeolocation'
import { MAX_GPS_KM, nearestDistrict } from '../lib/geo'
import { hh } from '../lib/time'
import type { Lang, MsgKey } from '../i18n/messages'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const doneBtn = ref<HTMLButtonElement | null>(null)
const busy = ref(false)
const gpsMsg = ref('')

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    gpsMsg.value = ''
    await nextTick()
    doneBtn.value?.focus()
  },
)

const counties = computed(() => {
  const list = Object.keys(DISTRICTS).filter((c) => c in COUNTY_DATASETS)
  return list.includes(settings.county) ? list : [settings.county, ...list]
})
const districts = computed(() => {
  const list = (DISTRICTS[settings.county] ?? []).map((d) => d.name)
  return list.includes(settings.district) ? list : [settings.district, ...list]
})

function onCounty(e: Event): void {
  const county = (e.target as HTMLSelectElement).value
  settings.county = county
  settings.district = DISTRICTS[county]?.[0]?.name ?? ''
  gpsMsg.value = ''
}

// The browser's permission prompt appears only here, when the person taps the button.
async function useMyLocation(): Promise<void> {
  busy.value = true
  gpsMsg.value = ''
  try {
    const pos = await locate()
    const hit = nearestDistrict(pos.lat, pos.lon, DISTRICTS)
    if (!hit) gpsMsg.value = t('gps_no_table')
    else if (hit.km > MAX_GPS_KM) gpsMsg.value = t('gps_outside')
    else {
      settings.county = hit.county
      settings.district = hit.district
      gpsMsg.value = t('gps_ok', { c: hit.county, d: hit.district })
    }
  } catch (e) {
    const kind = e instanceof GeoError ? e.kind : 'unavailable'
    gpsMsg.value = t(`gps_${kind}` as MsgKey)
  } finally {
    busy.value = false
  }
}

const langs: { v: Lang; label: string }[] = [
  { v: 'zh', label: '繁體中文' },
  { v: 'en', label: 'English' },
]
const themes: { v: ThemeChoice; key: MsgKey }[] = [
  { v: 'auto', key: 'th_auto' },
  { v: 'light', key: 'th_light' },
  { v: 'dark', key: 'th_dark' },
]
const startHours = Array.from({ length: 7 }, (_, i) => 17 + i)
const collectHours = Array.from({ length: 6 }, (_, i) => 5 + i)

const field = 'min-h-[46px] w-full rounded-[14px] border-0 bg-surface-2 px-3.5'
const segBtn =
  'min-h-10 min-w-0 flex-1 cursor-pointer rounded-full border-0 bg-transparent text-muted aria-pressed:bg-surface aria-pressed:font-bold aria-pressed:text-fg aria-pressed:shadow-sm'
const segGroup = 'flex rounded-full bg-surface-2 p-[3px]'
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-20 flex items-end justify-center" @keydown.esc="emit('close')">
    <div class="absolute inset-0 bg-scrim" @click="emit('close')" />
    <div
      class="sheet-pad relative flex max-h-[88%] w-full max-w-[480px] flex-col gap-[18px] overflow-auto rounded-t-[28px] bg-surface text-fg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
    >
      <div class="mx-auto -mt-2 h-1 w-9 rounded-full bg-line" aria-hidden="true" />
      <div class="flex items-center justify-between">
        <h2 id="sheet-title" class="font-display text-[22px]">{{ t('settings') }}</h2>
        <button ref="doneBtn" type="button" class="min-h-11 cursor-pointer rounded-full bg-accent px-[22px] font-bold text-bg" @click="emit('close')">
          {{ t('done') }}
        </button>
      </div>

      <div class="flex flex-col gap-2.5">
        <span class="text-xs tracking-[0.06em] text-muted">{{ t('loc') }}</span>
        <div class="grid grid-cols-2 gap-2.5">
          <div class="flex min-w-0 flex-col gap-1.5">
            <label for="county-select" class="text-xs text-muted">{{ t('county') }}</label>
            <select id="county-select" :class="field" :value="settings.county" @change="onCounty">
              <option v-for="c in counties" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="flex min-w-0 flex-col gap-1.5">
            <label for="district-select" class="text-xs text-muted">{{ t('district') }}</label>
            <select id="district-select" v-model="settings.district" :class="field">
              <option v-for="d in districts" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          class="inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-line bg-surface px-3 font-medium disabled:opacity-60"
          :disabled="busy"
          @click="useMyLocation"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
            <circle cx="10" cy="10" r="3.2" />
            <path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3" />
          </svg>
          {{ busy ? t('locating') : t('use_gps') }}
        </button>
        <p v-if="gpsMsg" class="text-[13px] text-muted" role="status">{{ gpsMsg }}</p>
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <div class="flex min-w-0 flex-col gap-1.5">
          <label for="start-default" class="text-xs text-muted">{{ t('start_def') }}</label>
          <select id="start-default" v-model.number="settings.startHour" :class="[field, 'font-mono']">
            <option v-for="h in startHours" :key="h" :value="h">{{ hh(h) }}</option>
          </select>
        </div>
        <div class="flex min-w-0 flex-col gap-1.5">
          <label for="collect-default" class="text-xs text-muted">{{ t('collect_def') }}</label>
          <select id="collect-default" v-model.number="settings.collectHour" :class="[field, 'font-mono']">
            <option v-for="h in collectHours" :key="h" :value="h">{{ hh(h) }}</option>
          </select>
        </div>
      </div>

      <label for="covered-check" class="flex min-h-12 cursor-pointer items-center justify-between gap-3.5">
        <span>
          {{ t('covered') }}
          <small class="block text-xs text-muted">{{ t('covered_hint') }}</small>
        </span>
        <span class="relative flex-none">
          <input id="covered-check" v-model="settings.covered" type="checkbox" role="switch" class="peer sr-only" />
          <span
            class="block h-[30px] w-[52px] rounded-full border border-line bg-surface-2 transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
            aria-hidden="true"
          />
          <span
            class="absolute top-[3px] left-[3px] size-6 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-[22px]"
            aria-hidden="true"
          />
        </span>
      </label>

      <div class="flex flex-col gap-1.5">
        <span class="text-xs text-muted">{{ t('lang') }}</span>
        <div :class="segGroup" role="group">
          <button
            v-for="l in langs"
            :key="l.v"
            type="button"
            :class="segBtn"
            :aria-pressed="settings.lang === l.v"
            @click="settings.lang = l.v"
          >{{ l.label }}</button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-xs text-muted">{{ t('theme') }}</span>
        <div :class="segGroup" role="group">
          <button
            v-for="th in themes"
            :key="th.v"
            type="button"
            :class="segBtn"
            :aria-pressed="settings.theme === th.v"
            @click="settings.theme = th.v"
          >{{ t(th.key) }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
