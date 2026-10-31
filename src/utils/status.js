export const SUB_STATUSES = ['draft','quotation','confirmed','active','closed'];
export const INV_STATUSES = ['draft','confirmed','paid','cancelled'];

export function subBadge(s) {
  const map = { draft:'neutral', quotation:'info', confirmed:'warning', active:'success', closed:'muted' };
  return `<span class="badge badge-${map[s]||'neutral'}">${s}</span>`;
}
export function invBadge(s) {
  const map = { draft:'neutral', confirmed:'warning', paid:'success', cancelled:'muted' };
  return `<span class="badge badge-${map[s]||'neutral'}">${s}</span>`;
}

export function canTransitionSub(from, to) {
  const order = SUB_STATUSES.indexOf(from);
  const target = SUB_STATUSES.indexOf(to);
  if (order < 0 || target < 0) return false;
  // allow forward one step, or close from any non-closed
  if (to === 'closed' && from !== 'closed') return true;
  return target === order + 1;
}
