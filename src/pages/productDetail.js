import { Products } from '../services/products.js';
import { toast } from '../ui.js';
import { Variants } from '../services/extras.js';
import { isAdmin, isStaff } from '../layout/shell.js';
import { money } from '../utils/money.js';

export function render(params) {
  const html = `<div class="page"><div id="content"><div class="spinner"></div></div></div>`;
  return { html, mount: () => mount(params.id) };
}

async function mount(id) {
  const p = await Products.get(id);
  document.getElementById('content').innerHTML = `
    <div class="between"><h1>${p.name}</h1><button class="btn" id="editBtn">Edit</button></div>
    <div class="card">
      <p><strong>Type:</strong> ${p.type}</p>
      <p><strong>Sales price:</strong> ${money(p.sales_price)}</p>
      <p><strong>Cost price:</strong> ${money(p.cost_price)}</p>
      <p><strong>Active:</strong> ${p.is_active ? 'Yes' : 'No'}</p>
      <p><strong>Notes:</strong> ${p.notes || '—'}</p>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="between"><h2>Variants</h2>
        ${isAdmin() ? '<button class="btn btn-sm btn-primary" id="addVarBtn">+ Add variant</button>' : ''}
      </div>
      <div id="varTable"></div>
    </div>
    <div style="margin-top:12px"><button class="btn btn-danger" id="delBtn">Delete</button></div>
  `;

  const loadVars = async () => {
    const vars = await Variants.listByProduct(id);
    const box = document.getElementById('varTable');
    if (!vars.length) { box.innerHTML = '<div class="empty">No variants.</div>'; return; }
    box.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Price delta</th><th></th></tr></thead><tbody>
      ${vars.map(v=>`<tr><td>${v.name}</td><td>${money(v.price_delta)}</td><td>${isAdmin()?`<button class="btn btn-sm btn-danger" data-del="${v.id}">Delete</button>`:''}</td></tr>`).join('')}
    </tbody></table></div>`;
    box.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = async () => { await Variants.remove(btn.dataset.del); toast('Deleted'); loadVars(); };
    });
  };
  loadVars();

  const addVarBtn = document.getElementById('addVarBtn');
  if (addVarBtn) addVarBtn.onclick = () => {
    import('../ui.js').then(({ showModal }) => {
      const { close } = showModal(`
        <h2>Add variant</h2>
        <div class="form-group"><label>Name (e.g. Odoo brand)</label><input id="v_name" /></div>
        <div class="form-group"><label>Price delta</label><input id="v_delta" type="number" step="0.01" value="560" /></div>
        <div class="modal-actions"><button class="btn" data-cancel>Cancel</button><button class="btn btn-primary" data-save>Save</button></div>
      `, (b) => {
        b.querySelector('[data-cancel]').onclick = () => close();
        b.querySelector('[data-save]').onclick = async () => {
          await Variants.create({ product_id: id, name: b.querySelector('#v_name').value.trim(), price_delta: Number(b.querySelector('#v_delta').value) });
          toast('Variant added'); close(); loadVars();
        };
      });
    });
  };
  document.getElementById('editBtn').onclick = () => {
    import('./products.js').then(m => m && window.__openProductForm && window.__openProductForm(p, () => { location.hash = '#/products'; }));
  };
  document.getElementById('delBtn').onclick = async () => {
    if (!confirm('Delete product?')) return;
    await Products.remove(id); toast('Deleted'); location.hash = '#/products';
  };
}
