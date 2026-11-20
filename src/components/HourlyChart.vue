<script setup lang="ts">
import { computed } from 'vue'
import type { HourlyRow } from '../../server/cwa'
import { pad, wallHour } from '../lib/time'
import { t } from '../composables/useI18n'

const props = defineProps<{ rows: HourlyRow[]; label: string }>()

// Drawing area inside the 360 x 92 viewBox: the plot, then the hour labels.
const W = 360
const L = 26
const R = 4
const TOP = 10
const BOT = 70
const y = (v: number) => BOT - ((BOT - TOP) * v) / 100

const step = computed(() => (W - L - R) / props.rows.length)
const cols = computed(() =>
  props.rows.map((r, i) => {
    const cx = L + step.value * (i + 0.5)
    const last = i === props.rows.length - 1
    const hour = wallHour(r.idx)
    const bh = ((BOT - TOP) * r.pop) / 100
    return {
      key: r.idx,
      cx,
      hour: pad(hour),
      last,
      showHour: last || step.value >= 24 || i % 2 === 0,
      midnight: i > 0 && hour === 0,
      barY: BOT - bh,
      barH: bh,
      rhY: y(Math.min(100, r.rh)),
    }
  }),
)
const line = computed(() => cols.value.map((c) => `${c.cx.toFixed(1)},${c.rhY.toFixed(1)}`).join(' '))
</script>

<template>
  <section class="flex min-w-0 flex-col gap-2">
    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h2 class="text-xs font-medium tracking-[0.06em] text-muted">{{ t('chart_title') }}</h2>
      <div class="flex gap-3 text-xs text-muted">
        <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-1.5 rounded-[3px] bg-fg" />{{ t('lg_rain') }}</span>
        <span class="inline-flex items-center gap-1.5"><i class="w-3.5 border-t-2 border-dashed border-mid" />{{ t('lg_rh') }}</span>
      </div>
    </div>

    <svg viewBox="0 0 360 92" class="block h-auto w-full" role="img" :aria-label="label">
      <g v-for="v in [0, 100]" :key="v">
        <line :x1="L" :x2="W - R" :y1="y(v)" :y2="y(v)" class="stroke-line" stroke-width="1" />
        <text :x="L - 6" :y="y(v) + 3" text-anchor="end" class="fill-muted font-mono text-[10px]">{{ v }}</text>
      </g>

      <g v-for="c in cols" :key="c.key">
        <line v-if="c.midnight" :x1="c.cx - step / 2" :x2="c.cx - step / 2" :y1="TOP" :y2="BOT + 4" class="stroke-muted" stroke-width="1" stroke-dasharray="3 3" opacity="0.6" />
        <rect :x="c.cx - 3" :y="c.barY" width="6" :height="c.barH" rx="3" class="fill-fg" />
        <text
          v-if="c.showHour"
          :x="c.cx"
          :y="BOT + 15"
          text-anchor="middle"
          class="font-mono text-[10px]"
          :class="c.last ? 'fill-fg font-medium' : 'fill-muted'"
        >{{ c.hour }}</text>
      </g>

      <polyline :points="line" fill="none" class="stroke-mid" stroke-width="1.6" stroke-dasharray="4 3" stroke-linejoin="round" stroke-linecap="round" />
    </svg>
  </section>
</template>
