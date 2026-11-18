// Hour indices count hours since the epoch on the Taipei wall clock (UTC+8, no daylight saving),
// matching HourlyRow.idx from the server.

export function taipeiNowIdx(date = new Date()): number {
  return Math.floor(date.getTime() / 3600000) + 8
}

export function wallHour(idx: number): number {
  return ((idx % 24) + 24) % 24
}

export const pad = (n: number): string => String(n).padStart(2, '0')
export const hh = (h: number): string => `${pad(h)}:00`

export function taipeiClock(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Taipei',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d)
}
