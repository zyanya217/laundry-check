import { messages, type MsgKey } from '../i18n/messages'
import { settings } from './useSettings'

export function t(key: MsgKey, vars?: Record<string, string | number>): string {
  let s: string = messages[settings.lang][key]
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  return s
}
