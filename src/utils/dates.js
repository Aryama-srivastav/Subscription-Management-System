export function todayISO() { return new Date().toISOString().slice(0,10); }
export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0,10);
}
export function addMonths(dateStr, months) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0,10);
}
export function addYears(dateStr, years) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0,10);
}
export function nextBillingDate(start, freq) {
  switch (freq) {
    case 'daily': return addDays(start, 1);
    case 'weekly': return addDays(start, 7);
    case 'monthly': return addMonths(start, 1);
    case 'yearly': return addYears(start, 1);
    default: return addMonths(start, 1);
  }
}
export function fmtDate(s) { if (!s) return '—'; return new Date(s + 'T00:00:00Z').toLocaleDateString(); }

