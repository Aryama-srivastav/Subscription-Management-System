import { DashboardSvc } from '../services/invoices.js';
import { money } from '../utils/money.js';
import { renderTable, renderPagination } from '../components/table.js';

export function render() {
  const html = `
    <div class="page">
      <h1>Dashboard</h1>
      <div class="grid grid-4" id="stats"><div class="stat"><div class="label">Loading…</div></div></div>
      <div class="card" style="margin-top:16px">
        <h2>Overdue invoices</h2>
        <div id="overdueTable"></div>
      </div>
    </div>`;
  return { html, mount };
}

async function mount() {
  try {
    const s = await DashboardSvc.stats();
    document.getElementById('stats').innerHTML = `
      <div class="stat"><div class="label">Active subscriptions</div><div class="value">${s.activeSubs}</div></div>
      <div class="stat"><div class="label">Total invoiced</div><div class="value">${money(s.totalInvoiced)}</div></div>
      <div class="stat"><div class="label">Collected</div><div class="value">${money(s.totalPaid)}</div></div>
      <div class="stat"><div class="label">Outstanding</div><div class="value">${money(s.outstanding)}</div></div>
    `;
  } catch (e) { console.error(e); }
}
