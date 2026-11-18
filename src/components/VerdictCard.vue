<script setup lang="ts">
import { computed } from 'vue'
import type { Analysis, Level } from '../lib/analyze'
import { hh } from '../lib/time'
import { t } from '../composables/useI18n'

const props = defineProps<{ analysis: Analysis }>()

// Full class strings so Tailwind can see them.
const tone: Record<Level, string> = {
  ok: 'bg-ok-bg text-ok',
  mid: 'bg-mid-bg text-mid',
  bad: 'bg-bad-bg text-bad',
}
const glyph: Record<Level, string> = {
  ok: 'M7.5 12.5l3 3 6-7',
  mid: 'M6.5 12.2c1.8-2.8 3.5 2.6 5.5 0s3.7 2.6 5.5 0',
  bad: 'M8.5 8.5l7 7M15.5 8.5l-7 7',
}

const reason = computed(() => {
  const a = props.analysis
  return t(a.reason, {
    a: a.rainFrom === null ? '' : hh(a.rainFrom),
    b: a.rainTo === null ? '' : hh(a.rainTo),
    p: Math.round(a.rainPop),
  })
})
const fallback = computed(() =>
  props.analysis.level === 'bad'
    ? t('fb_bad')
    : t(props.analysis.dry === 'dry' ? 'fb_ok' : props.analysis.dry === 'half' ? 'fb_half' : 'fb_wet'),
)
</script>

<template>
  <section class="flex flex-col gap-2.5 rounded-[22px] px-5 pt-[22px] pb-5" :class="tone[analysis.level]" aria-live="polite">
    <div class="flex items-center gap-3">
      <svg
        class="size-[34px] flex-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path :d="glyph[analysis.level]" />
      </svg>
      <h1 class="text-[30px] leading-[1.2] font-bold text-balance">{{ t(`v_${analysis.level}` as 'v_ok') }}</h1>
    </div>
    <p class="text-[16px] text-fg text-pretty">{{ reason }}</p>
    <p class="border-t border-current/25 pt-2.5 text-[14px] text-fg">{{ fallback }}</p>
  </section>
</template>
