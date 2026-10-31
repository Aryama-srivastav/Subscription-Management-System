import { Subscriptions } from '../services/subscriptions.js';
import { Invoices } from '../services/invoices.js';
import { money } from '../utils/money.js';
import { subBadge, canTransitionSub } from '../utils/status.js';
import { toast } from '../ui.js';
import { isAdmin, isStaff } from '../layout/shell.js';

export function render(params) {
  const html = `<div class="page"><div id="content"><div class="spinner"></div></div></div>`;
  return { html, mount: () => mount(params.id) };
}

async function mount(id) {
  const sub = await Subscriptions.get(id);
  const cust = sub.customers || {};
  const plan = sub.plans || {};
  const lines = sub.lines || [];
  const subtotal = lines.reduce((s,l)=>s+Number(l.line_amount||0),0);
  const taxTotal = lines.reduce((s,l)=>s+Number(l.tax_amount||0),0);
  const total = subtotal + taxTotal;

  const statusBtns = ['quotation','confirmed','active','closed'].map(s => {
    if (!canTransitionSub(sub.status, s)) return '';
    return `<button class="btn btn-sm" data-status="${s}">Mark ${s}</button>`;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div class="between"><h1>Subscription ${sub.number || sub.id.slice(0,8)}</h1>
      <div>${subBadge(sub.status)}</div>
    </div>
    <div class="card">
      <div class="grid grid-2">
        <div><strong>Customer:</strong> ${cust.full_name || '—'} (${cust.email || ''})</div>
        <div><strong>Plan:</strong> ${plan.name || '—'} (${plan.billing_frequency || ''})</div>
        <div><strong>Start:</strong> ${sub.start_date}</div>
        <div><strong>Expiry:</strong> ${sub.expiry_date || '—'}</div>
        <div><strong>Payment terms:</strong> ${sub.payment_terms || '—'}</div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>Lines</h2>
      <div class="table-wrap"><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Tax %</th><th>Tax</th><th>Amount</th></tr></thead>
      <tbody>${lines.map(l=>`<tr><td>${l.products?.name||'—'}</td><td>${l.qty}</td><td>${money(l.unit_price)}</td><td>${l.tax_rate}</td><td>${money(l.tax_amount)}</td><td>${money(l.line_amount)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="5"><strong>Total</strong></td><td><strong>${money(total)}</strong></td></tr></tfoot></table></div>
    </div>
    <div class="row" style="margin-top:16px">
      ${isStaff() ? statusBtns : ''}
      ${isStaff() ? '<button class="btn btn-primary" id="invBtn">Generate invoice</button>' : ''}
      ${isAdmin() ? '<button class="btn btn-danger" id="delBtn">Delete</button>' : ''}
    </div>
    <div id="err" class="error-text"></div>
  `;

  // status transitions
  document.querySelectorAll('[data-status]').forEach(btn => {
    btn.onclick = async () => {
      try {
        await Subscriptions.update(id, { status: btn.dataset.status });
        toast('Updated'); mount(id);
      } catch (e) { document.getElementById('err').textContent = e.message; }
    };
  });

  const invBtn = document.getElementById('invBtn');
  if (invBtn) invBtn.onclick = async () => {
    try {
      const inv = await Invoices.create({
        subscription_id: id,
        customer_id: sub.customer_id,
        issue_date: new Date().toISOString().slice(0,10),
        due_date: new Date(Date.now()+30*86400000).toISOString().slice(0,10),
        status: 'draft',
        subtotal, tax_total: taxTotal, total, amount_paid: 0, balance: total,
        billing_period_start: new Date().toISOString().slice(0,10),
      });
      for (const l of lines) {
        const lineAmt = Number(l.line_amount||0);
        const taxAmt = Number(l.tax_amount||0);
        await Invoices.addLine({
          invoice_id: inv.id,
          product_id: l.product_id,
          qty: l.qty,
          unit_price: l.unit_price,
          tax_rate: l.tax_rate,
          tax_amount: taxAmt,
          line_total: lineAmt + taxAmt,
        });
      }
      await Invoices.update(inv.id, { number: `INV-${String(inv.id).slice(0,8).toUpperCase()}` });
      toast('Invoice created');
      location.hash = `#/invoices/${inv.id}`;
    } catch (e) { document.getElementById('err').textContent = e.message; }
  };

  const delBtn = document.getElementById('delBtn');
  if (delBtn) delBtn.onclick = async () => {
    if (!confirm('Delete subscription?')) return;
    await Subscriptions.remove(id); toast('Deleted'); location.hash = '#/subscriptions';
  };
}
