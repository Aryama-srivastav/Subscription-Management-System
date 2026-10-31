import { getSession } from '../auth/session.js';
import { Subscriptions } from '../services/subscriptions.js';
import { Invoices } from '../services/invoices.js';
import { money } from '../utils/money.js';
import { subBadge, invBadge } from '../utils/status.js';
import { renderTable } from '../components/table.js';
import { isCustomer } from '../layout/shell.js';

export function render() {
  const html = `
    <div class="page">
      <h1>My portal</h1>
      <div class="card">
        <div class="between"><h2>My subscriptions</h2></div>
        <div id="subsTable"></div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="between"><h2>My invoices</h2></div>
        <div id="invTable"></div>
      </div>
    </div>`;
  return { html, mount };
}

async function mount() {
  const session = await getSession();
  const uid = session.user.id;
  const subs = await Subscriptions.list({ pageSize: 100, customerId: uid });
  renderTable(document.getElementById('subsTable'), {
    columns: [
      { key:'number', label:'#' },
      { key:'plans', label:'Plan', render: r => r.plans?.name || '—' },
      { key:'start_date', label:'Start' },
      { key:'expiry_date', label:'Expiry' },
      { key:'status', label:'Status', render: r => subBadge(r.status) },
    ],
    rows: subs.rows, empty:'No subscriptions yet.',
    onRowClick: (id) => { location.hash = `#/subscriptions/${id}`; }
  });

  const invs = await Invoices.list({ pageSize: 100, customerId: uid });
  renderTable(document.getElementById('invTable'), {
    columns: [
      { key:'number', label:'#' },
      { key:'issue_date', label:'Issue date' },
      { key:'due_date', label:'Due date' },
      { key:'total', label:'Total', render: r => money(r.total) },
      { key:'balance', label:'Balance', render: r => money(r.balance) },
      { key:'status', label:'Status', render: r => invBadge(r.status) },
    ],
    rows: invs.rows, empty:'No invoices yet.',
    onRowClick: (id) => { location.hash = `#/invoices/${id}`; }
  });
}
