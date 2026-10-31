import { Invoices } from '../services/invoices.js';
import { money } from '../utils/money.js';
import { invBadge } from '../utils/status.js';
import { renderTable, renderPagination } from '../components/table.js';
import { isAdmin, isStaff } from '../layout/shell.js';

export function render() {
  const html = `
    <div class="page">
      <h1>Invoices</h1>
      <div class="row" style="margin-bottom:12px">
        <select id="statusFilter" style="max-width:160px">
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div id="table"></div>
      <div id="pager"></div>
    </div>`;
  return { html, mount };
}

function mount() {
  let page = 1; const pageSize = 25;
  const reload = async () => {
    const status = document.getElementById('statusFilter').value;
    const { rows, total } = await Invoices.list({ page, pageSize, status });
    renderTable(document.getElementById('table'), {
      columns: [
        { key:'number', label:'#' },
        { key:'customers', label:'Customer', render: r => r.customers?.full_name || '—' },
        { key:'issue_date', label:'Issue date' },
        { key:'due_date', label:'Due date' },
        { key:'total', label:'Total', render: r => money(r.total) },
        { key:'balance', label:'Balance', render: r => money(r.balance) },
        { key:'status', label:'Status', render: r => invBadge(r.status) },
      ],
      rows, empty:'No invoices yet.',
      onRowClick: (id) => { location.hash = `#/invoices/${id}`; }
    });
    renderPagination(document.getElementById('pager'), { page, pageSize, total, onPage:(p)=>{page=p;reload();} });
  };
  document.getElementById('statusFilter').addEventListener('change', ()=>{ page=1; reload(); });
  reload();
}
