<script setup lang="ts">
import { computed } from 'vue'
import { DRY_HALF, DRY_OK, type Analysis, type Dryness, type Level } from '../lib/analyze'
import { hh } from '../lib/time'
import { settings } from '../composables/useSettings'
import { t } from '../composables/useI18n'

const props = defineProps<{
  analysis: Analysis
  dateLabel: string
  collectDay: 'today' | 'tomorrow' | 'dat'
  startNote: string | null
}>()

// Full class strings so Tailwind can see them.
const titleTone: Record<Level, string> = { ok: 'text-ok', mid: 'text-mid', bad: 'text-bad' }
const fillTone: Record<Dryness, string> = { dry: 'bg-ok', half: 'bg-mid', wet: 'bg-bad' }
const labelTone: Record<Dryness, string> = { dry: 'text-ok', half: 'text-mid', wet: 'text-bad' }

const startHours = Array.from({ length: 7 }, (_, i) => 17 + i)

const reason = computed(() => {
  const a = props.analysis
  return t(a.reason, {
    a: a.rainFrom === null ? '' : hh(a.rainFrom),
    b: a.rainTo === null ? '' : hh(a.rainTo),
    p: Math.round(a.rainPop),
  })
})

// The bar runs from "still wet" to "dry"; the zone borders sit at the same score thresholds as the verdict.
const SCALE = DRY_OK * 1.4
const zones = [
  { key: 'z_wet', dry: 'wet', width: (DRY_HALF / SCALE) * 100 },
  { key: 'z_half', dry: 'half', width: ((DRY_OK - DRY_HALF) / SCALE) * 100 },
  { key: 'z_dry', dry: 'dry', width: ((SCALE - DRY_OK) / SCALE) * 100 },
] as const
const ticks = [zones[0].width, zones[0].width + zones[1].width]
const fill = computed(() => Math.max(6, Math.min(100, (props.analysis.score / SCALE) * 100)))
</script>

<template>
  <section class="flex flex-col" aria-live="polite">
    <span class="font-mono text-xs tracking-[0.04em] text-muted">{{ dateLabel }}</span>
    <h1 class="font-display mt-0.5 text-[32px] leading-[1.25] text-balance" :class="titleTone[analysis.level]">
      {{ t(`v_${analysis.level}` as 'v_ok') }}
    </h1>
    <p class="mt-2 text-[16px] text-pretty">{{ reason }}</p>

    <div class="mt-2 flex items-center gap-3">
      <label class="relative inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-surface-2 pr-8 pl-3">
        <span class="text-xs text-muted">{{ t('start_label') }}</span>
        <select v-model.number="settings.startHour" class="min-h-11 cursor-pointer appearance-none bg-transparent font-mono text-[17px] font-medium">
          <option v-for="h in startHours" :key="h" :value="h">{{ hh(h) }}</option>
        </select>
        <svg class="pointer-events-none absolute right-3" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 8l5 5 5-5" />
        </svg>
      </label>
      <span class="flex-1 border-t-[1.5px] border-dashed border-muted/60" aria-hidden="true" />
      <span class="inline-flex items-baseline gap-1.5 whitespace-nowrap">
        <span class="text-xs text-muted">{{ t('collect_label') }}</span>
        <span class="font-mono text-[17px] font-medium">{{ t(collectDay) }} {{ hh(settings.collectHour) }}</span>
      </span>
    </div>
    <p v-if="startNote" class="mt-1 text-xs text-muted">{{ startNote }}</p>

    <div class="mt-2.5">
      <span class="text-xs text-muted">{{ t('meter_label') }}</span>
      <div
        class="relative mt-1.5 h-4 overflow-hidden rounded-full bg-surface-2"
        role="meter"
        :aria-label="`${t('meter_label')}: ${t(`dry_${analysis.dry}` as 'dry_dry')}`"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(fill)"
      >
        <div class="h-full rounded-full" :class="fillTone[analysis.dry]" :style="{ width: fill + '%' }" />
        <i v-for="x in ticks" :key="x" class="absolute top-0 block h-full w-[3px] bg-bg" :style="{ left: x + '%' }" aria-hidden="true" />
      </div>
      <div class="mt-1 flex text-xs text-muted">
        <span
          v-for="z in zones"
          :key="z.key"
          class="text-center"
          :class="z.dry === analysis.dry ? [labelTone[z.dry], 'font-bold'] : ''"
          :style="{ width: z.width + '%' }"
        >{{ t(z.key) }}</span>
      </div>
    </div>
  </section>
</template>
