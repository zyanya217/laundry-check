<script setup lang="ts">
import { computed } from 'vue'
import { DRY_HALF, DRY_OK, type Dryness } from '../lib/analyze'
import { t } from '../composables/useI18n'

const props = defineProps<{ score: number; dry: Dryness; whenText: string; collectTime: string }>()

const SCALE = DRY_OK * 1.4
const zones = [
  { key: 'z_wet', width: (DRY_HALF / SCALE) * 100, tone: 'bg-bad-bg rounded-l-full' },
  { key: 'z_half', width: ((DRY_OK - DRY_HALF) / SCALE) * 100, tone: 'bg-mid-bg' },
  { key: 'z_dry', width: ((SCALE - DRY_OK) / SCALE) * 100, tone: 'bg-ok-bg rounded-r-full' },
] as const
const marker = computed(() => Math.min(100, (props.score / SCALE) * 100))
</script>

<template>
  <section class="flex min-w-0 flex-col gap-3 rounded-[18px] border border-line bg-surface p-4">
    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <p class="text-[26px] leading-[1.2] font-bold">{{ t(`dry_${dry}` as 'dry_dry') }}</p>
      <p class="text-[13px] text-muted">{{ t('dry_sub', { w: whenText, t: collectTime }) }}</p>
    </div>
    <div>
      <div class="relative mx-1 mt-1.5 flex h-2.5">
        <span v-for="z in zones" :key="z.key" class="block h-full" :class="z.tone" :style="{ width: z.width + '%' }" />
        <i
          class="absolute -top-1 size-[18px] -translate-x-1/2 rounded-full border-[3px] border-surface bg-fg ring-1 ring-line"
          :style="{ left: marker + '%' }"
        />
      </div>
      <div class="mx-1 mt-1.5 flex text-xs text-muted">
        <span v-for="z in zones" :key="z.key" class="min-w-0 text-center" :style="{ width: z.width + '%' }">{{ t(z.key) }}</span>
      </div>
    </div>
  </section>
</template>
