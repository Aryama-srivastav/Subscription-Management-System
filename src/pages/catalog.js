import { getSession } from '../auth/session.js';
import { Products } from '../services/products.js';
import { Plans } from '../services/plans.js';
import { Variants } from '../services/extras.js';
import { supabase } from '../supabaseClient.js';
import { toast } from '../ui.js';
import { money } from '../utils/money.js';

export function render() {
  const html = `
    <div class="page">
      <h1>Product catalog</h1>
      <div class="card">
        <div class="form-group"><label>Choose a plan</label><select id="planSel"></select></div>
      </div>
      <div id="products"></div>
      <div class="card" style="margin-top:16px">
        <h2>Your selection</h2>
        <div id="selection"></div>
        <button class="btn btn-primary" id="buyBtn" style="margin-top:12px">Buy now</button>
        <div id="err" class="error-text"></div>
      </div>
    </div>`;
  return { html, mount };
}

async function mount() {
  const [plans, products] = await Promise.all([
    Plans.list({ pageSize: 200 }),
    Products.list({ pageSize: 200 }),
  ]);
  const planSel = document.getElementById('planSel');
  planSel.innerHTML = plans.rows.map(p => `<option value="${p.id}">${p.name} (${p.billing_frequency}) - ${money(p.cost)}</option>`).join('');

  const variantsByProduct = {};
  for (const p of products.rows) {
    variantsByProduct[p.id] = await Variants.listByProduct(p.id);
  }

  const selected = {}; // productId -> {qty, variantId}

  function renderProducts() {
    const box = document.getElementById('products');
    box.innerHTML = products.rows.map(p => {
      const vars = variantsByProduct[p.id] || [];
      const varOpts = vars.map(v => `<option value="${v.id}">${v.name} (+${money(v.price_delta)})</option>`).join('');
      return `
        <div class="card" style="margin-top:12px">
          <div class="between">
            <div>
              <strong>${p.name}</strong>
              <div class="muted">${p.type} · ${money(p.sales_price)}</div>
              <div class="muted" style="font-size:12px">${p.notes || ''}</div>
            </div>
            <div style="min-width:220px">
              ${vars.length ? `<div class="form-group"><label>Variant</label><select data-var="${p.id}"><option value="">None</option>${varOpts}</select></div>` : ''}
              <div class="row">
                <input type="number" min="0" value="0" data-qty="${p.id}" style="width:80px" />
                <span class="muted">qty</span>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');
  }
  renderProducts();

  function updateSelection() {
    const selBox = document.getElementById('selection');
    const items = [];
    for (const p of products.rows) {
      const qty = Number(document.querySelector(`[data-qty="${p.id}"]`)?.value || 0);
      if (qty > 0) {
        const variantId = document.querySelector(`[data-var="${p.id}"]`)?.value || '';
        selected[p.id] = { qty, variantId };
        items.push(`${p.name} x${qty}`);
      } else {
        delete selected[p.id];
      }
    }
    selBox.innerHTML = items.length ? items.map(i=>`<div>${i}</div>`).join('') : '<div class="muted">No items selected.</div>';
  }

  document.getElementById('products').addEventListener('input', updateSelection);
  document.getElementById('products').addEventListener('change', updateSelection);

  document.getElementById('buyBtn').onclick = async () => {
    const err = document.getElementById('err');
    err.textContent = '';
    const items = [];
    for (const p of products.rows) {
      const qty = Number(document.querySelector(`[data-qty="${p.id}"]`)?.value || 0);
      if (qty > 0) {
        const variantId = document.querySelector(`[data-var="${p.id}"]`)?.value || '';
        items.push({ product_id: p.id, variant_id: variantId || null, qty });
      }
    }
    if (!items.length) { err.textContent = 'Select at least one product.'; return; }
    try {
      const { data, error } = await supabase.rpc('customer_purchase', {
        p_plan_id: document.getElementById('planSel').value,
        p_items: items,
      });
      if (error) throw error;
      toast('Purchase complete');
      location.hash = `#/invoices/${data}`;
    } catch (e) { err.textContent = e.message; }
  };
}
