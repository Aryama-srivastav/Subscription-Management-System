import { QuotationTemplates } from '../services/extras.js';
import { Plans } from '../services/plans.js';
import { Products } from '../services/products.js';
import { Taxes } from '../services/plans.js';
import { Subscriptions } from '../services/subscriptions.js';
import { Customers } from '../services/subscriptions.js';
import { toast } from '../ui.js';
import { money } from '../utils/money.js';
import { renderTable } from '../components/table.js';
import { isStaff } from '../layout/shell.js';

export function render() {
  const html = `
    <div class="page">
      <div class="between"><h1>Quotation templates</h1>
        ${isStaff() ? '<button class="btn btn-primary" id="newBtn">+ New template</button>' : ''}
      </div>
      <div id="table"></div>
    </div>`;
  return { html, mount };
}

function mount() {
  const reload = async () => {
    const rows = await QuotationTemplates.list();
    renderTable(document.getElementById('table'), {
      columns: [
        { key:'name', label:'Name' },
        { key:'plans', label:'Plan', render: r => r.plans?.name || '—' },
        { key:'validity_days', label:'Valid (days)' },
      ],
      rows, empty:'No templates yet.',
      onRowClick: (id) => { openDetail(id, reload); }
    });
  };
  if (isStaff()) document.getElementById('newBtn').onclick = () => openNew(reload);
  reload();
}

async function openNew(reload) {
  const [plans, products, taxes] = await Promise.all([
    Plans.list({ pageSize: 200 }),
    Products.list({ pageSize: 200 }),
    Taxes.list(),
  ]);
  const planOpts = plans.rows.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  const prodOpts = products.rows.map(p => `<option value="${p.id}" data-price="${p.sales_price}">${p.name}</option>`).join('');
  const taxOpts = taxes.map(t => `<option value="${t.rate_percent}">${t.name} (${t.rate_percent}%)</option>`).join('');

  const { showModal } = await import('../ui.js');
  const { close } = showModal(`
    <h2>New quotation template</h2>
    <div class="form-row">
      <div class="form-group"><label>Name</label><input id="f_name" /></div>
      <div class="form-group"><label>Plan</label><select id="f_plan">${planOpts}</select></div>
    </div>
    <div class="form-group"><label>Validity (days)</label><input id="f_valid" type="number" value="30" /></div>
    <h3>Lines</h3>
    <div id="lines"></div>
    <button class="btn btn-sm" id="addLine">+ Add line</button>
    <div class="modal-actions"><button class="btn" data-cancel>Cancel</button><button class="btn btn-primary" data-save>Create</button></div>
    <div id="f_err" class="error-text"></div>
  `, async (b) => {
    b.querySelector('[data-cancel]').onclick = () => close();
    const linesBox = b.querySelector('#lines');
    function addLineRow() {
      const row = document.createElement('div');
      row.className = 'line-row';
      row.innerHTML = `
        <select class="l_prod">${prodOpts}</select>
        <input class="l_qty" type="number" value="1" min="1" />
        <input class="l_price" type="number" step="0.01" value="0" />
        <select class="l_tax">${taxOpts}</select>
        <button class="btn btn-sm btn-danger l_rm">x</button>
      `;
      const prodSel = row.querySelector('.l_prod');
      const priceIn = row.querySelector('.l_price');
      prodSel.addEventListener('change', () => { priceIn.value = prodSel.selectedOptions[0]?.dataset?.price || 0; });
      if (prodSel.options.length) priceIn.value = prodSel.selectedOptions[0]?.dataset?.price || 0;
      row.querySelector('.l_rm').onclick = () => row.remove();
      linesBox.appendChild(row);
    }
    b.querySelector('#addLine').onclick = addLineRow;
    addLineRow();
    b.querySelector('[data-save]').onclick = async () => {
      try {
        const tpl = await QuotationTemplates.create({
          name: b.querySelector('#f_name').value.trim(),
          plan_id: b.querySelector('#f_plan').value,
          validity_days: Number(b.querySelector('#f_valid').value),
        });
        const rows = linesBox.querySelectorAll('.line-row');
        for (const r of rows) {
          const prodId = r.querySelector('.l_prod').value;
          const qty = Number(r.querySelector('.l_qty').value);
          const price = Number(r.querySelector('.l_price').value);
          await QuotationTemplates.addLine({
            template_id: tpl.id, product_id: prodId, qty, unit_price: price,
          });
        }
        toast('Template created'); close(); reload();
      } catch (e) { b.querySelector('#f_err').textContent = e.message; }
    };
  });
}

async function openDetail(id, reload) {
  const tpl = await QuotationTemplates.get(id);
  const lines = tpl.lines || [];
  const { showModal } = await import('../ui.js');
  const { close } = showModal(`
    <h2>${tpl.name}</h2>
    <p><strong>Plan:</strong> ${tpl.plans?.name || '—'} · Valid ${tpl.validity_days} days</p>
    <div class="table-wrap"><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th></tr></thead>
    <tbody>${lines.map(l=>`<tr><td>${l.products?.name||'—'}</td><td>${l.qty}</td><td>${money(l.unit_price)}</td></tr>`).join('')}</tbody></table></div>
    <div class="modal-actions">
      <button class="btn btn-danger" data-del>Delete</button>
      <button class="btn btn-primary" data-use>Create subscription from this</button>
      <button class="btn" data-cancel>Close</button>
    </div>
  `, (b) => {
    b.querySelector('[data-cancel]').onclick = () => close();
    b.querySelector('[data-del]').onclick = async () => {
      await QuotationTemplates.remove(id); toast('Deleted'); close(); reload();
    };
    b.querySelector('[data-use]').onclick = async () => {
      close();
      await createSubFromTemplate(tpl);
    };
  });
}

async function createSubFromTemplate(tpl) {
  const customers = await Customers.list({ pageSize: 200 });
  const custOpts = customers.rows.map(c => `<option value="${c.id}">${c.full_name} (${c.email})</option>`).join('');
  const { showModal } = await import('../ui.js');
  const { close } = showModal(`
    <h2>Create subscription from template</h2>
    <div class="form-group"><label>Customer</label><select id="c_cust">${custOpts}</select></div>
    <div class="form-group"><label>Start date</label><input id="c_start" type="date" value="${new Date().toISOString().slice(0,10)}" /></div>
    <div class="modal-actions"><button class="btn" data-cancel>Cancel</button><button class="btn btn-primary" data-create>Create</button></div>
    <div id="c_err" class="error-text"></div>
  `, async (b) => {
    b.querySelector('[data-cancel]').onclick = () => close();
    b.querySelector('[data-create]').onclick = async () => {
      try {
        const custId = b.querySelector('#c_cust').value;
        const start = b.querySelector('#c_start').value;
        const expiry = new Date(start + 'T00:00:00Z'); expiry.setUTCDate(expiry.getUTCDate() + (tpl.validity_days || 30));
        const sub = await Subscriptions.create({
          customer_id: custId,
          plan_id: tpl.plan_id,
          start_date: start,
          expiry_date: expiry.toISOString().slice(0,10),
          payment_terms: 'Net 30',
          status: 'draft',
        });
        await Subscriptions.update(sub.id, { number: `SUB-${String(sub.id).slice(0,8).toUpperCase()}` });
        for (const l of (tpl.lines || [])) {
          const lineAmt = l.qty * l.unit_price;
          await Subscriptions.addLine({
            subscription_id: sub.id,
            product_id: l.product_id,
            variant_id: l.variant_id,
            qty: l.qty,
            unit_price: l.unit_price,
            tax_rate: 0,
            tax_amount: 0,
            line_amount: lineAmt,
          });
        }
        toast('Subscription created from template'); close();
        location.hash = `#/subscriptions/${sub.id}`;
      } catch (e) { b.querySelector('#c_err').textContent = e.message; }
    };
  });
}

