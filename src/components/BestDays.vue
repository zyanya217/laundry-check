<script setup lang="ts">
import { computed } from 'vue'
import type { Level } from '../lib/analyze'
import type { DayPick } from '../lib/week'
import { hh } from '../lib/time'
import { settings } from '../composables/useSettings'
import { t } from '../composables/useI18n'

const props = defineProps<{ picks: DayPick[]; best: number | null }>()

// Full class strings so Tailwind can see them.
const chip: Record<Level, string> = {
  ok: 'bg-ok-bg text-ok',
  mid: 'bg-mid-bg text-mid',
  bad: 'bg-bad-bg text-bad',
}

const locale = computed(() => (settings.lang === 'zh' ? 'zh-TW' : 'en'))

// The day number counts wall-clock days, so formatting it in UTC prints the Taipei date.
function dayName(p: DayPick): string {
  if (p.offset === 0) return t('today')
  if (p.offset === 1) return t('tomorrow')
  return new Intl.DateTimeFormat(locale.value, { weekday: 'short', timeZone: 'UTC' }).format(new Date(p.dayNumber * 86_400_000))
}
function dayDate(p: DayPick): string {
  const d = new Date(p.dayNumber * 86_400_000)
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`
}

const headline = computed(() => {
  const pick = props.picks.find((p) => p.offset === props.best)
  return pick ? t('best_pick', { d: dayName(pick) }) : t('best_none')
})
const showFarNote = computed(() => props.picks.some((p) => p.far && p.analysis))
</script>

<template>
  <section class="flex min-w-0 flex-col gap-3 rounded-[18px] border border-line bg-surface p-4">
    <div class="flex flex-col gap-1">
      <h2 class="text-[13px] font-medium tracking-[0.06em] text-muted">{{ t('best_title') }}</h2>
      <p class="text-[18px] leading-snug font-bold text-balance" :class="best === null ? 'text-mid' : ''">{{ headline }}</p>
    </div>

    <ul class="flex flex-col gap-1">
      <li
        v-for="p in picks"
        :key="p.offset"
        class="flex items-center gap-3 rounded-xl px-3 py-2"
        :class="p.offset === best ? 'bg-surface-2 ring-1 ring-ok' : ''"
      >
        <div class="w-[68px] flex-none">
          <b class="block text-[15px] font-medium">{{ dayName(p) }}</b>
          <span class="block font-mono text-xs text-muted">{{ dayDate(p) }}</span>
        </div>

        <template v-if="p.analysis">
          <span class="inline-flex min-h-7 items-center rounded-full px-2.5 text-[13px] font-medium whitespace-nowrap" :class="chip[p.analysis.level]">
            {{ t(`v_${p.analysis.level}` as 'v_ok') }}
          </span>
          <span v-if="p.offset === best" class="text-xs font-bold text-ok">{{ t('best_top') }}</span>
          <div class="ml-auto min-w-0 text-right" :class="p.far ? 'opacity-70' : ''">
            <span class="block text-[14px]">{{ t(`dry_${p.analysis.dry}` as 'dry_dry') }}</span>
            <span class="block font-mono text-xs text-muted">{{ t('best_rain') }} {{ Math.round(p.maxPop) }}%</span>
          </div>
        </template>
        <span v-else class="ml-auto text-[13px] text-muted">{{ t('best_nodata') }}</span>
      </li>
    </ul>

    <p class="text-xs text-muted">
      {{ t('best_hint', { s: hh(settings.startHour), c: hh(settings.collectHour) }) }}
      <template v-if="showFarNote">{{ t('best_far') }}</template>
    </p>
  </section>
</template>
