import { Products } from '../services/products.js';
import { toast } from '../ui.js';
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
    <div style="margin-top:12px"><button class="btn btn-danger" id="delBtn">Delete</button></div>
  `;
  document.getElementById('editBtn').onclick = () => {
    import('./products.js').then(m => m && window.__openProductForm && window.__openProductForm(p, () => { location.hash = '#/products'; }));
  };
  document.getElementById('delBtn').onclick = async () => {
    if (!confirm('Delete product?')) return;
    await Products.remove(id); toast('Deleted'); location.hash = '#/products';
  };
}
