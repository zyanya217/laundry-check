import { reactive, watch } from 'vue'
import type { Lang } from '../i18n/messages'
import { DEFAULT_COUNTY, DEFAULT_DISTRICT } from '../data/counties'

export type ThemeChoice = 'auto' | 'light' | 'dark'

export interface Settings {
  lang: Lang
  theme: ThemeChoice
  county: string
  district: string
  startHour: number
  collectHour: number
  covered: boolean
}

const KEY = 'laundry.settings.v2'

const defaults: Settings = {
  lang: 'zh',
  theme: 'auto',
  county: DEFAULT_COUNTY,
  district: DEFAULT_DISTRICT,
  startHour: 21,
  collectHour: 8,
  covered: false,
}

function load(): Settings {
  const s = { ...defaults }
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    if (raw.lang === 'zh' || raw.lang === 'en') s.lang = raw.lang
    if (raw.theme === 'auto' || raw.theme === 'light' || raw.theme === 'dark') s.theme = raw.theme
    if (typeof raw.county === 'string' && typeof raw.district === 'string') {
      s.county = raw.county
      s.district = raw.district
    }
    if (Number.isInteger(raw.startHour)) s.startHour = raw.startHour
    if (Number.isInteger(raw.collectHour)) s.collectHour = raw.collectHour
    if (typeof raw.covered === 'boolean') s.covered = raw.covered
  } catch {
    // unreadable or blocked storage: keep the defaults
  }
  return s
}

// One shared instance: the settings are small and every component reads the same ones.
export const settings = reactive<Settings>(load())

watch(settings, (value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // storage may be blocked; the settings then last for this visit only
  }
})
