import { Customers } from '../services/subscriptions.js';
import { renderTable, renderPagination } from '../components/table.js';

export function render() {
  const html = `
    <div class="page">
      <h1>Customers</h1>
      <div class="row" style="margin-bottom:12px"><input id="search" placeholder="Search customers…" style="max-width:260px" /></div>
      <div id="table"></div>
      <div id="pager"></div>
    </div>`;
  return { html, mount };
}

function mount() {
  let page = 1; const pageSize = 25;
  const reload = async () => {
    const search = document.getElementById('search').value.trim();
    const { rows, total } = await Customers.list({ page, pageSize, search });
    renderTable(document.getElementById('table'), {
      columns: [
        { key:'full_name', label:'Name' },
        { key:'email', label:'Email' },
        { key:'role', label:'Role' },
        { key:'created_at', label:'Joined', render: r => new Date(r.created_at).toLocaleDateString() },
      ],
      rows, empty:'No customers yet.'
    });
    renderPagination(document.getElementById('pager'), { page, pageSize, total, onPage:(p)=>{page=p;reload();} });
  };
  let searchTimer;
  document.getElementById('search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(()=>{ page=1; reload(); }, 300); });
  reload();
}
