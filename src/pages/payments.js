import { Payments } from '../services/invoices.js';
import { money } from '../utils/money.js';
import { renderTable, renderPagination } from '../components/table.js';

export function render() {
  const html = `<div class="page"><h1>Payments</h1><div id="table"></div><div id="pager"></div></div>`;
  return { html, mount };
}

function mount() {
  let page = 1; const pageSize = 25;
  const reload = async () => {
    const { rows, total } = await Payments.list({ page, pageSize });
    renderTable(document.getElementById('table'), {
      columns: [
        { key:'paid_on', label:'Date' },
        { key:'invoices', label:'Invoice', render: r => r.invoices?.number || '—' },
        { key:'invoices', label:'Customer', render: r => r.invoices?.customers?.full_name || '—' },
        { key:'method', label:'Method' },
        { key:'amount', label:'Amount', render: r => money(r.amount) },
        { key:'note', label:'Note' },
      ],
      rows, empty:'No payments yet.'
    });
    renderPagination(document.getElementById('pager'), { page, pageSize, total, onPage:(p)=>{page=p;reload();} });
  };
  reload();
}
