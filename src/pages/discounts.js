import { Discounts } from '../services/extras.js';
import { toast } from '../ui.js';
import { money } from '../utils/money.js';
import { renderTable } from '../components/table.js';
import { isAdmin } from '../layout/shell.js';

export function render() {
  const html = `
    <div class="page">
      <div class="between"><h1>Discounts</h1>
        ${isAdmin() ? '<button class="btn btn-primary" id="newBtn">+ New discount</button>' : ''}
      </div>
      <div id="table"></div>
    </div>`;
  return { html, mount };
}

function mount() {
  const reload = async () => {
    const rows = await Discounts.list();
    renderTable(document.getElementById('table'), {
      columns: [
        { key:'name', label:'Name' },
        { key:'type', label:'Type' },
        { key:'value', label:'Value', render: r => r.type==='percentage' ? r.value+'%' : money(r.value) },
        { key:'scope', label:'Scope' },
        { key:'products', label:'Product', render: r => r.products?.name || '—' },
        { key:'min_purchase', label:'Min purchase' },
        { key:'min_qty', label:'Min qty' },
        { key:'start_date', label:'Start' },
        { key:'end_date', label:'End' },
        { key:'used_count', label:'Used' },
        { key:'usage_limit', label:'Limit' },
        { key:'is_active', label:'Active', render: r => r.is_active ? 'Yes' : 'No' },
      ],
      rows, empty:'No discounts yet.',
      onRowClick: (id) => { const d = rows.find(x=>x.id===id); openForm(d, reload); }
    });
  };
  if (isAdmin()) document.getElementById('newBtn').onclick = () => openForm(null, reload);
  reload();
}

function openForm(existing, reload) {
  import('../ui.js').then(({ showModal }) => {
    import('../services/products.js').then(async ({ Products }) => {
      const prods = await Products.list({ pageSize: 200 });
      const opts = prods.rows.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      const p = existing || {};
      const { close } = showModal(`
        <h2>${existing?'Edit':'New'} discount</h2>
        <div class="form-group"><label>Name</label><input id="f_name" value="${p.name||''}" /></div>
        <div class="form-row">
          <div class="form-group"><label>Type</label><select id="f_type"><option value="fixed">Fixed</option><option value="percentage">Percentage</option></select></div>
          <div class="form-group"><label>Value</label><input id="f_value" type="number" step="0.01" value="${p.value||0}" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Min purchase</label><input id="f_minp" type="number" step="0.01" value="${p.min_purchase||0}" /></div>
          <div class="form-group"><label>Min qty</label><input id="f_minq" type="number" step="0.01" value="${p.min_qty||0}" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Start date</label><input id="f_start" type="date" value="${p.start_date||''}" /></div>
          <div class="form-group"><label>End date</label><input id="f_end" type="date" value="${p.end_date||''}" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Usage limit</label><input id="f_limit" type="number" value="${p.usage_limit||''}" /></div>
          <div class="form-group"><label>Scope</label><select id="f_scope"><option value="all">All</option><option value="product">Product</option><option value="subscription">Subscription</option></select></div>
        </div>
        <div class="form-group"><label>Product (if product scope)</label><select id="f_prod"><option value="">—</option>${opts}</select></div>
        <div class="form-group"><label><input type="checkbox" id="f_active" ${p.is_active!==false?'checked':''} /> Active</label></div>
        <div class="modal-actions"><button class="btn" data-cancel>Cancel</button><button class="btn btn-primary" data-save>Save</button></div>
        <div id="f_err" class="error-text"></div>
      `, (b) => {
        b.querySelector('#f_type').value = p.type || 'fixed';
        b.querySelector('#f_scope').value = p.scope || 'all';
        if (p.product_id) b.querySelector('#f_prod').value = p.product_id;
        b.querySelector('[data-cancel]').onclick = () => close();
        b.querySelector('[data-save]').onclick = async () => {
          const payload = {
            name: b.querySelector('#f_name').value.trim(),
            type: b.querySelector('#f_type').value,
            value: Number(b.querySelector('#f_value').value),
            min_purchase: Number(b.querySelector('#f_minp').value),
            min_qty: Number(b.querySelector('#f_minq').value),
            start_date: b.querySelector('#f_start').value || null,
            end_date: b.querySelector('#f_end').value || null,
            usage_limit: b.querySelector('#f_limit').value ? Number(b.querySelector('#f_limit').value) : null,
            scope: b.querySelector('#f_scope').value,
            product_id: b.querySelector('#f_prod').value || null,
            is_active: b.querySelector('#f_active').checked,
          };
          try {
            if (existing) await Discounts.update(existing.id, payload);
            else await Discounts.create(payload);
            toast('Saved'); close(); reload();
          } catch (e) { b.querySelector('#f_err').textContent = e.message; }
        };
      });
    });
  });
}
