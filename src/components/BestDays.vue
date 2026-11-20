<script setup lang="ts">
import { computed } from 'vue'
import type { Level } from '../lib/analyze'
import type { DayPick } from '../lib/week'
import { settings } from '../composables/useSettings'
import { t } from '../composables/useI18n'

const props = defineProps<{ picks: DayPick[]; best: number | null }>()

// Full class strings so Tailwind can see them.
const tone: Record<Level, string> = { ok: 'text-ok', mid: 'text-mid', bad: 'text-bad' }
const shirtFill: Record<Level, string> = { ok: 'fill-ok', mid: 'fill-mid', bad: 'fill-bad' }
// A smile, a flat mouth and a frown, so good and bad do not rely on colour alone.
const mouth: Record<Level, string> = {
  ok: 'M16 25 Q20 29.5 24 25',
  mid: 'M17 26.5 L23 26.5',
  bad: 'M16 28.5 Q20 24 24 28.5',
}
const SHIRT = 'M12 3 L4 8 L7 14 L11 12 L11 32 L29 32 L29 12 L33 14 L36 8 L28 3 C26 6 14 6 12 3 Z'

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

// The washing line sags a little in the middle; each shirt hangs from the point of the curve above it.
const W = 350
const sag = (x: number): number => {
  const u = x / W
  return (1 - u) ** 2 * 10 + 2 * (1 - u) * u * 26 + u * u * 10
}
const shirts = computed(() =>
  props.picks.map((p, i) => {
    const cx = (W * (2 * i + 1)) / (2 * props.picks.length)
    return {
      key: p.offset,
      cx,
      cy: sag(cx),
      level: p.analysis?.level ?? null,
    }
  }),
)
</script>

<template>
  <section class="flex min-w-0 flex-col gap-1.5">
    <h2 class="text-xs font-medium tracking-[0.06em] text-muted">{{ t('best_title') }}</h2>

    <svg viewBox="0 0 350 74" class="block h-auto w-full" aria-hidden="true">
      <path d="M0 10 Q175 26 350 10" fill="none" class="stroke-fg" stroke-width="1.5" />
      <g v-for="s in shirts" :key="s.key">
        <g :transform="`translate(${s.cx - 22} ${s.cy + 5}) scale(1.1)`">
          <path :d="SHIRT" :class="s.level ? shirtFill[s.level] : 'fill-line'" />
          <template v-if="s.level">
            <circle cx="16" cy="20" r="1.3" fill="#fff" />
            <circle cx="24" cy="20" r="1.3" fill="#fff" />
            <path :d="mouth[s.level]" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" />
          </template>
        </g>
        <rect :x="s.cx - 12" :y="s.cy - 2" width="4" height="10" rx="1.5" class="fill-fg" />
        <rect :x="s.cx + 8" :y="s.cy - 2" width="4" height="10" rx="1.5" class="fill-fg" />
      </g>
    </svg>

    <ul class="-mt-1.5 grid gap-1" :style="{ gridTemplateColumns: `repeat(${picks.length}, minmax(0, 1fr))` }">
      <li
        v-for="p in picks"
        :key="p.offset"
        class="flex flex-col items-center gap-0.5 rounded-[18px] pt-2 pb-2.5"
        :class="p.offset === best ? 'bg-surface-2' : ''"
      >
        <b class="text-[15px] leading-snug font-bold">{{ dayName(p) }}</b>
        <span class="font-mono text-[11px] leading-snug text-muted">{{ dayDate(p) }}</span>
        <template v-if="p.analysis">
          <span class="font-display mt-0.5 text-xl leading-snug" :class="tone[p.analysis.level]">{{ t(`dry_${p.analysis.dry}` as 'dry_dry') }}</span>
          <span class="font-mono text-xs leading-snug text-muted">{{ t('best_rain') }} {{ Math.round(p.maxPop) }}%</span>
        </template>
        <span v-else class="mt-1 text-[13px] text-muted">{{ t('best_nodata') }}</span>
        <span class="mt-1 block h-[18px]">
          <span v-if="p.offset === best" class="rounded-full bg-ok px-2.5 text-[11px] leading-[1.6] font-bold text-white">{{ t('best_top') }}</span>
        </span>
      </li>
    </ul>
  </section>
</template>
