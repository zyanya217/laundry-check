<script setup lang="ts">
import { settings } from '../composables/useSettings'
import { t } from '../composables/useI18n'
import { hh } from '../lib/time'

defineProps<{ collectDay: 'today' | 'tomorrow' | 'dat'; startNote: string | null }>()
const hours = Array.from({ length: 7 }, (_, i) => 17 + i)
</script>

<template>
  <section class="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2.5 rounded-[18px] border border-line bg-surface p-4">
    <div class="min-w-0">
      <label for="start-select" class="block text-xs text-muted">{{ t('start_label') }}</label>
      <select
        id="start-select"
        v-model.number="settings.startHour"
        class="min-h-11 w-full rounded-xl border border-line bg-surface-2 px-3 font-mono"
      >
        <option v-for="h in hours" :key="h" :value="h">{{ hh(h) }}</option>
      </select>
    </div>
    <div class="text-right">
      <span class="block text-xs text-muted">{{ t('collect_label') }}</span>
      <b class="block font-mono text-[17px] font-medium whitespace-nowrap">{{ t(collectDay) }} {{ hh(settings.collectHour) }}</b>
    </div>
    <p v-if="startNote" class="col-span-full text-xs text-muted">{{ startNote }}</p>
  </section>
</template>
