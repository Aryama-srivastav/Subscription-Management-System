import { Subscriptions } from '../services/subscriptions.js';
import { Customers } from '../services/subscriptions.js';
import { Plans } from '../services/plans.js';
import { Products } from '../services/products.js';
import { Taxes } from '../services/plans.js';
import { toast } from '../ui.js';
import { money } from '../utils/money.js';
import { subBadge } from '../utils/status.js';
import { renderTable, renderPagination } from '../components/table.js';
import { supabase } from '../supabaseClient.js';
import { isStaff, isAdmin } from '../layout/shell.js';

export function render() {
  const html = `
    <div class="page">
      <div class="between"><h1>Subscriptions</h1>
        <div class="row">
          ${isAdmin() ? '<button class="btn" id="runBillingBtn">Run billing</button>' : ''}
          ${isStaff() ? '<button class="btn btn-primary" id="newBtn">+ New subscription</button>' : ''}
        </div>
      </div>
      <div class="row" style="margin-bottom:12px">
        <select id="statusFilter" style="max-width:160px">
          <option value="">All statuses</option>
          <option value="draft">Draft</option><option value="quotation">Quotation</option>
          <option value="confirmed">Confirmed</option><option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div id="table"></div>
      <div id="pager"></div>
    </div>`;
  return { html, mount };
}

let _reloadSubs = null;
function mount() {
  let page = 1; const pageSize = 25;
  const reload = async () => {
    const status = document.getElementById('statusFilter').value;
    const { rows, total } = await Subscriptions.list({ page, pageSize, status });
    renderTable(document.getElementById('table'), {
      columns: [
        { key:'number', label:'#' },
        { key:'customers', label:'Customer', render: r => r.customers?.full_name || '—' },
        { key:'plans', label:'Plan', render: r => r.plans?.name || '—' },
        { key:'start_date', label:'Start' },
        { key:'expiry_date', label:'Expiry' },
        { key:'status', label:'Status', render: r => subBadge(r.status) },
      ],
      rows, empty:'No subscriptions yet.',
      onRowClick: (id) => { location.hash = `#/subscriptions/${id}`; }
    });
    renderPagination(document.getElementById('pager'), { page, pageSize, total, onPage:(p)=>{page=p;reload();} });
  };
  _reloadSubs = reload;
  document.getElementById('statusFilter').addEventListener('change', ()=>{ page=1; reload(); });
  const btn = document.getElementById('newBtn');
  if (btn) btn.onclick = () => openNewSub(reload);
  const rb = document.getElementById('runBillingBtn');
  if (rb) rb.onclick = async () => {
    const asOf = prompt('Run billing as of (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
    if (!asOf) return;
    try {
      const { data, error } = await supabase.rpc('run_billing', { p_as_of: asOf });
      if (error) throw error;
      toast(`Billing done: created ${data.created}, skipped ${data.skipped}`);
      reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  reload();
}


async function openNewSub(reload) {
  const [customers, plans, products, taxes] = await Promise.all([
    Customers.list({ pageSize: 200 }),
    Plans.list({ pageSize: 200 }),
    Products.list({ pageSize: 200 }),
    Taxes.list(),
  ]);
  const custOpts = customers.rows.map(c => `<option value="${c.id}">${c.full_name} (${c.email})</option>`).join('');
  const planOpts = plans.rows.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  const prodOpts = products.rows.map(p => `<option value="${p.id}" data-price="${p.sales_price}">${p.name}</option>`).join('');
  const taxOpts = taxes.map(t => `<option value="${t.rate_percent}">${t.name} (${t.rate_percent}%)</option>`).join('');

  const { showModal } = await import('../ui.js');
  const { close } = showModal(`
    <h2>New subscription</h2>
    <div class="form-row">
      <div class="form-group"><label>Customer</label><select id="f_cust">${custOpts}</select></div>
      <div class="form-group"><label>Plan</label><select id="f_plan">${planOpts}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Start date</label><input id="f_start" type="date" value="${new Date().toISOString().slice(0,10)}" /></div>
      <div class="form-group"><label>Expiry date</label><input id="f_expiry" type="date" /></div>
    </div>
    <div class="form-group"><label>Payment terms</label><input id="f_terms" value="Net 30" /></div>
    <h3>Lines</h3>
    <div id="lines"></div>
    <button class="btn btn-sm" id="addLine">+ Add line</button>
    <div class="modal-actions"><button class="btn" data-cancel>Cancel</button><button class="btn btn-primary" data-save>Create</button></div>
    <div id="f_err" class="error-text"></div>
  `, (b) => {
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
        const payload = {
          customer_id: b.querySelector('#f_cust').value,
          plan_id: b.querySelector('#f_plan').value,
          start_date: b.querySelector('#f_start').value,
          expiry_date: b.querySelector('#f_expiry').value || null,
          payment_terms: b.querySelector('#f_terms').value.trim(),
          status: 'draft',
        };
        const sub = await Subscriptions.create(payload);
        await Subscriptions.update(sub.id, { number: `SUB-${String(sub.id).slice(0,8).toUpperCase()}` });
        const rows = linesBox.querySelectorAll('.line-row');
        for (const r of rows) {
          const prodId = r.querySelector('.l_prod').value;
          const qty = Number(r.querySelector('.l_qty').value);
          const price = Number(r.querySelector('.l_price').value);
          const tax = Number(r.querySelector('.l_tax').value);
          const lineAmt = qty * price;
          const taxAmt = lineAmt * (tax/100);
          await Subscriptions.addLine({
            subscription_id: sub.id, product_id: prodId, qty, unit_price: price,
            tax_rate: tax, tax_amount: taxAmt, line_amount: lineAmt
          });
        }
        toast('Subscription created'); close(); reload();
      } catch (e) { b.querySelector('#f_err').textContent = e.message; }
    };
  });
}
