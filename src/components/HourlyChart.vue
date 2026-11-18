<script setup lang="ts">
import { computed } from 'vue'
import type { HourlyRow } from '../../server/cwa'
import { iconFor } from '../lib/icons'
import { pad, wallHour } from '../lib/time'
import { t } from '../composables/useI18n'

const props = defineProps<{ rows: HourlyRow[]; label: string }>()

// Drawing area inside the 360 x 146 viewBox: weather icons on top, temperatures, then the plot, then hours.
const W = 360
const L = 30
const R = 8
const TOP = 50
const BOT = 122
const y = (v: number) => BOT - ((BOT - TOP) * v) / 100

const step = computed(() => (W - L - R) / props.rows.length)
const cols = computed(() =>
  props.rows.map((r, i) => {
    const cx = L + step.value * (i + 0.5)
    const last = i === props.rows.length - 1
    const hour = wallHour(r.idx)
    const bw = Math.min(step.value * 0.55, 16)
    const bh = ((BOT - TOP) * r.pop) / 100
    return {
      key: r.idx,
      cx,
      icon: iconFor(r),
      temp: Math.round(r.temp),
      hour: pad(hour),
      last,
      showTemp: step.value >= 20,
      showHour: last || step.value >= 24 || i % 2 === 0,
      midnight: i > 0 && hour === 0,
      barX: cx - bw / 2,
      barY: BOT - bh,
      barW: bw,
      barH: bh,
      rhY: y(Math.min(100, r.rh)),
    }
  }),
)
const line = computed(() => cols.value.map((c) => `${c.cx.toFixed(1)},${c.rhY.toFixed(1)}`).join(' '))
</script>

<template>
  <section class="flex min-w-0 flex-col gap-3 rounded-[18px] border border-line bg-surface p-4">
    <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
      <h2 class="text-[13px] font-medium tracking-[0.06em] text-muted">{{ t('chart_title') }}</h2>
      <div class="flex gap-3.5 text-xs text-muted">
        <span class="inline-flex items-center gap-1.5"><i class="size-[9px] rounded-[2px] bg-rain" />{{ t('lg_rain') }}</span>
        <span class="inline-flex items-center gap-1.5"><i class="w-3.5 border-t-2 border-humid" />{{ t('lg_rh') }}</span>
      </div>
    </div>

    <svg viewBox="0 0 360 146" class="block h-auto w-full" role="img" :aria-label="label">
      <g v-for="v in [0, 50, 100]" :key="v">
        <line :x1="L" :x2="W - R" :y1="y(v)" :y2="y(v)" class="stroke-line" stroke-width="1" />
        <text :x="L - 6" :y="y(v) + 3" text-anchor="end" class="fill-muted font-mono text-[10px]">{{ v }}</text>
      </g>

      <g v-for="c in cols" :key="c.key">
        <line v-if="c.midnight" :x1="c.cx - step / 2" :x2="c.cx - step / 2" y1="26" :y2="BOT + 4" class="stroke-muted" stroke-width="1" stroke-dasharray="3 3" opacity="0.6" />
        <rect :x="c.barX" :y="c.barY" :width="c.barW" :height="c.barH" rx="2" class="fill-rain" opacity="0.85" />
        <use
          :href="`#ic-${c.icon}`"
          :x="c.cx - 9"
          y="2"
          width="18"
          height="18"
          :class="c.icon === 'sun' ? 'text-mid' : c.icon === 'rain' ? 'text-rain' : 'text-muted'"
        />
        <text v-if="c.showTemp" :x="c.cx" y="38" text-anchor="middle" class="fill-muted font-mono text-[10px]">{{ c.temp }}°</text>
        <text
          v-if="c.showHour"
          :x="c.cx"
          y="140"
          text-anchor="middle"
          class="font-mono text-[10px]"
          :class="c.last ? 'fill-fg font-medium' : 'fill-muted'"
        >{{ c.hour }}</text>
      </g>

      <polyline :points="line" fill="none" class="stroke-humid" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <circle v-for="c in cols" :key="`d${c.key}`" :cx="c.cx" :cy="c.rhY" r="2.4" class="fill-surface stroke-humid" stroke-width="1.6" />
    </svg>
  </section>
</template>
