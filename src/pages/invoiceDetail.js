import { Invoices } from '../services/invoices.js';
import { Payments } from '../services/invoices.js';
import { money } from '../utils/money.js';
import { invBadge } from '../utils/status.js';
import { toast } from '../ui.js';
import { isAdmin, isStaff } from '../layout/shell.js';

export function render(params) {
  const html = `<div class="page"><div id="content"><div class="spinner"></div></div></div>`;
  return { html, mount: () => mount(params.id) };
}

async function mount(id) {
  const inv = await Invoices.get(id);
  const cust = inv.customers || {};
  const lines = inv.lines || [];
  const payments = inv.payments || [];

  document.getElementById('content').innerHTML = `
    <div class="between"><h1>Invoice ${inv.number || id.slice(0,8)}</h1>${invBadge(inv.status)}</div>
    <div class="card">
      <div class="grid grid-2">
        <div><strong>Customer:</strong> ${cust.full_name || '—'}</div>
        <div><strong>Subscription:</strong> ${inv.subscriptions?.number || '—'}</div>
        <div><strong>Issue date:</strong> ${inv.issue_date}</div>
        <div><strong>Due date:</strong> ${inv.due_date}</div>
        <div><strong>Total:</strong> ${money(inv.total)}</div>
        <div><strong>Paid:</strong> ${money(inv.amount_paid)}</div>
        <div><strong>Balance:</strong> ${money(inv.balance)}</div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>Lines</h2>
      <div class="table-wrap"><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Tax %</th><th>Tax</th><th>Line total</th></tr></thead>
      <tbody>${lines.map(l=>`<tr><td>${l.products?.name||'—'}</td><td>${l.qty}</td><td>${money(l.unit_price)}</td><td>${l.tax_rate}</td><td>${money(l.tax_amount)}</td><td>${money(l.line_total)}</td></tr>`).join('')}</tbody></table></div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>Discounts</h2>
      <div class="table-wrap"><table><thead><tr><th>Discount</th><th>Amount</th></tr></thead>
      <tbody>${(inv.discounts||[]).map(d=>`<tr><td>${d.discounts?.name||'—'}</td><td>${money(d.amount)}</td></tr>`).join('') || '<tr><td colspan="2" class="muted">No discounts applied.</td></tr>'}</tbody></table></div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>Payments</h2>
      <div class="table-wrap"><table><thead><tr><th>Date</th><th>Method</th><th>Amount</th><th>Note</th></tr></thead>
      <tbody>${payments.map(p=>`<tr><td>${p.paid_on}</td><td>${p.method}</td><td>${money(p.amount)}</td><td>${p.note||''}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">No payments yet.</td></tr>'}</tbody></table></div>
      ${isStaff() ? '<div style="margin-top:12px"><button class="btn btn-primary btn-sm" id="payBtn">Record payment</button></div>' : ''}
    </div>
    <div class="row" style="margin-top:16px">
      ${isStaff() && inv.status==='draft' ? '<button class="btn" id="confirmBtn">Confirm</button>' : ''}
      ${isStaff() && inv.status!=='cancelled' && inv.status!=='paid' ? '<button class="btn" id="cancelBtn">Cancel</button>' : ''}
      ${isStaff() ? '<button class="btn" id="printBtn">Print</button>' : ''}
    </div>
    <div id="err" class="error-text"></div>
  `;

  const confirmBtn = document.getElementById('confirmBtn');
  if (confirmBtn) confirmBtn.onclick = async () => {
    try { await Invoices.update(id, { status: 'confirmed' }); toast('Confirmed'); mount(id); } catch (e) { document.getElementById('err').textContent = e.message; }
  };
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) cancelBtn.onclick = async () => {
    try { await Invoices.update(id, { status: 'cancelled' }); toast('Cancelled'); mount(id); } catch (e) { document.getElementById('err').textContent = e.message; }
  };
  const printBtn = document.getElementById('printBtn');
  if (printBtn) printBtn.onclick = () => window.print();

  const payBtn = document.getElementById('payBtn');
  if (payBtn) payBtn.onclick = async () => {
    import('../ui.js').then(({ showModal }) => {
      const { close } = showModal(`
        <h2>Record payment</h2>
        <div class="form-group"><label>Method</label><select id="p_method"><option>Cash</option><option>Bank transfer</option><option>Card</option><option>UPI</option></select></div>
        <div class="form-group"><label>Amount</label><input id="p_amount" type="number" step="0.01" value="${inv.balance}" /></div>
        <div class="form-group"><label>Date</label><input id="p_date" type="date" value="${new Date().toISOString().slice(0,10)}" /></div>
        <div class="form-group"><label>Note</label><input id="p_note" /></div>
        <div class="modal-actions"><button class="btn" data-cancel>Cancel</button><button class="btn btn-primary" data-save>Save</button></div>
        <div id="p_err" class="error-text"></div>
      `, async (b) => {
        b.querySelector('[data-cancel]').onclick = () => close();
        b.querySelector('[data-save]').onclick = async () => {
          try {
            const amount = Number(b.querySelector('#p_amount').value);
            await Payments.create({
              invoice_id: id,
              method: b.querySelector('#p_method').value,
              amount,
              paid_on: b.querySelector('#p_date').value,
              note: b.querySelector('#p_note').value.trim(),
            });
            const newPaid = Number(inv.amount_paid||0) + amount;
            const newBalance = Math.max(0, Number(inv.total) - newPaid);
            const status = newBalance <= 0 ? 'paid' : inv.status;
            await Invoices.update(id, { amount_paid: newPaid, balance: newBalance, status });
            toast('Payment recorded'); close(); mount(id);
          } catch (e) { b.querySelector('#p_err').textContent = e.message; }
        };
      });
    });
  };
}
