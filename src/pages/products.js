import { Products } from '../services/products.js';
import { toast } from '../ui.js';
import { money } from '../utils/money.js';
import { renderTable, renderPagination } from '../components/table.js';
import { isAdmin, isStaff } from '../layout/shell.js';

export function render() {
  const html = `
    <div class="page">
      <div class="between"><h1>Products</h1>
        ${isAdmin() ? '<button class="btn btn-primary" id="newBtn">+ New product</button>' : ''}
      </div>
      <div class="row" style="margin-bottom:12px">
        <input id="search" placeholder="Search products…" style="max-width:260px" />
      </div>
      <div id="table"></div>
      <div id="pager"></div>
    </div>`;
  return { html, mount };
}

function mount() {
  let page = 1; const pageSize = 25;
  const reload = async () => {
    const search = document.getElementById('search').value.trim();
    const { rows, total } = await Products.list({ page, pageSize, search });
    renderTable(document.getElementById('table'), {
      columns: [
        { key:'name', label:'Name' },
        { key:'type', label:'Type' },
        { key:'sales_price', label:'Sales price', render: r => money(r.sales_price) },
        { key:'cost_price', label:'Cost price', render: r => money(r.cost_price) },
        { key:'is_active', label:'Active', render: r => r.is_active ? 'Yes' : 'No' },
      ],
      rows, empty: 'No products yet.',
      onRowClick: (id) => { location.hash = `#/products/${id}`; }
    });
    renderPagination(document.getElementById('pager'), { page, pageSize, total, onPage: (p)=>{ page=p; reload(); } });
  };
  document.getElementById('search').addEventListener('input', () => { page=1; reload(); });
  if (isAdmin()) document.getElementById('newBtn').onclick = () => openForm(null, reload);
  reload();
}

function openForm(existing, reload) {
  const p = existing || {};
  const { close } = window.__modal ? window.__modal : { close:()=>{} };
  // use ui modal
  import('../ui.js').then(({ showModal }) => {
    const { close } = showModal(`
      <h2>${existing?'Edit':'New'} product</h2>
      <div class="form-group"><label>Name</label><input id="f_name" value="${p.name||''}" /></div>
      <div class="form-group"><label>Type</label><select id="f_type"><option value="software">Software</option><option value="addon">Add-on</option><option value="variant">Variant product</option></select></div>
      <div class="form-row">
        <div class="form-group"><label>Sales price</label><input id="f_sales" type="number" value="${p.sales_price||0}" /></div>
        <div class="form-group"><label>Cost price</label><input id="f_cost" type="number" value="${p.cost_price||0}" /></div>
      </div>
      <div class="form-group"><label>Notes</label><textarea id="f_notes">${p.notes||''}</textarea></div>
      <div class="form-group"><label><input type="checkbox" id="f_active" ${p.is_active!==false?'checked':''} /> Active</label></div>
      <div class="modal-actions"><button class="btn" data-cancel>Cancel</button><button class="btn btn-primary" data-save>Save</button></div>
      <div id="f_err" class="error-text"></div>
    `, (b) => {
      b.querySelector('#f_type').value = p.type || 'software';
      b.querySelector('[data-cancel]').onclick = () => close();
      b.querySelector('[data-save]').onclick = async () => {
        const payload = {
          name: b.querySelector('#f_name').value.trim(),
          type: b.querySelector('#f_type').value,
          sales_price: Number(b.querySelector('#f_sales').value),
          cost_price: Number(b.querySelector('#f_cost').value),
          notes: b.querySelector('#f_notes').value.trim(),
          is_active: b.querySelector('#f_active').checked,
        };
        try {
          if (existing) await Products.update(existing.id, payload);
          else await Products.create(payload);
          toast('Saved'); close(); reload();
        } catch (e) { b.querySelector('#f_err').textContent = e.message; }
      };
    });
  });
}
// expose openForm globally-ish via window for detail page
window.__openProductForm = openForm;
