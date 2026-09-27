export function pad2(n: number) { return String(n).padStart(2, '0'); }
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
export function localTime(date = new Date()): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
export function parseTimeToday(time: string, base = new Date()): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}
export function atLocalTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}
export function addDays(date: Date, days: number) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86400000);
}
export function getDayOfWeek(date: Date): number { return date.getDay(); }
export function nextOccurrence(time: string, weekdays?: number[]): Date {
  const now = new Date();
  for (let offset = 0; offset < 8; offset++) {
    const candidate = addDays(now, offset);
    atLocalTime(candidate, time);
    const w = candidate.getDay();
    if ((!weekdays || weekdays.includes(w)) && candidate > now) return atLocalTime(candidate, time);
  }
  return atLocalTime(addDays(now, 1), time);
}
export function monthDateForDay(base: Date, day: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), day);
  if (d < base) d.setMonth(d.getMonth() + 1);
  return d;
}
