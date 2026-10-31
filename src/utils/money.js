export function money(n) {
  const v = Number(n ?? 0);
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }
export function toNumber(v) { const n = Number(v); return isNaN(n) ? 0 : n; }
