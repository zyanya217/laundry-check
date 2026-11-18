import { watchEffect } from 'vue'
import { settings } from './useSettings'

/** Keeps <html data-theme> in step with the setting, and with the system theme while it is "auto". */
export function useTheme(): void {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = () => {
    const dark = settings.theme === 'dark' || (settings.theme === 'auto' && media.matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }
  watchEffect(apply)
  media.addEventListener('change', apply)
}
