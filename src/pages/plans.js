import { Plans, Taxes } from '../services/plans.js';
import { toast } from '../ui.js';
import { money } from '../utils/money.js';
import { renderTable, renderPagination } from '../components/table.js';
import { isAdmin } from '../layout/shell.js';

export function render() {
  const html = `
    <div class="page">
      <div class="between"><h1>Plans</h1>
        ${isAdmin() ? '<button class="btn btn-primary" id="newBtn">+ New plan</button>' : ''}
      </div>
      <div id="table"></div>
      <div id="pager"></div>
    </div>`;
  return { html, mount };
}

function mount() {
  let page = 1; const pageSize = 25;
  const reload = async () => {
    const { rows, total } = await Plans.list({ page, pageSize });
    renderTable(document.getElementById('table'), {
      columns: [
        { key:'name', label:'Name' },
        { key:'cost', label:'Cost', render: r => money(r.cost) },
        { key:'billing_frequency', label:'Frequency' },
        { key:'min_qty', label:'Min qty' },
        { key:'available_from', label:'From' },
        { key:'available_to', label:'To' },
        { key:'auto_close', label:'Auto close', render: r => r.auto_close ? 'Yes' : 'No' },
      ],
      rows, empty:'No plans yet.',
    });
    renderPagination(document.getElementById('pager'), { page, pageSize, total, onPage:(p)=>{page=p;reload();} });
  };
  if (isAdmin()) document.getElementById('newBtn').onclick = () => openForm(null, reload);
  reload();
}

function openForm(existing, reload) {
  import('../ui.js').then(({ showModal }) => {
    const p = existing || {};
    const { close } = showModal(`
      <h2>${existing?'Edit':'New'} plan</h2>
      <div class="form-group"><label>Name</label><input id="f_name" value="${p.name||''}" /></div>
      <div class="form-row">
        <div class="form-group"><label>Cost</label><input id="f_cost" type="number" value="${p.cost||0}" /></div>
        <div class="form-group"><label>Frequency</label><select id="f_freq"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Min qty</label><input id="f_min" type="number" value="${p.min_qty||1}" /></div>
        <div class="form-group"><label>Available from</label><input id="f_from" type="date" value="${p.available_from||''}" /></div>
      </div>
      <div class="form-group"><label>Available to</label><input id="f_to" type="date" value="${p.available_to||''}" /></div>
      <div class="form-group"><label><input type="checkbox" id="f_auto" ${p.auto_close?'checked':''} /> Auto close when ends</label></div>
      <div class="form-group"><label><input type="checkbox" id="f_pause" ${p.allow_pause!==false?'checked':''} /> Allow pause</label></div>
      <div class="form-group"><label><input type="checkbox" id="f_renew" ${p.allow_renew!==false?'checked':''} /> Allow renew</label></div>
      <div class="form-group"><label><input type="checkbox" id="f_close" ${p.allow_early_close!==false?'checked':''} /> Allow early close</label></div>
      <div class="modal-actions"><button class="btn" data-cancel>Cancel</button><button class="btn btn-primary" data-save>Save</button></div>
      <div id="f_err" class="error-text"></div>
    `, (b) => {
      b.querySelector('#f_freq').value = p.billing_frequency || 'monthly';
      b.querySelector('[data-cancel]').onclick = () => close();
      b.querySelector('[data-save]').onclick = async () => {
        const payload = {
          name: b.querySelector('#f_name').value.trim(),
          cost: Number(b.querySelector('#f_cost').value),
          billing_frequency: b.querySelector('#f_freq').value,
          min_qty: Number(b.querySelector('#f_min').value),
          available_from: b.querySelector('#f_from').value || null,
          available_to: b.querySelector('#f_to').value || null,
          auto_close: b.querySelector('#f_auto').checked,
          allow_pause: b.querySelector('#f_pause').checked,
          allow_renew: b.querySelector('#f_renew').checked,
          allow_early_close: b.querySelector('#f_close').checked,
        };
        try {
          if (existing) await Plans.update(existing.id, payload);
          else await Plans.create(payload);
          toast('Saved'); close(); reload();
        } catch (e) { b.querySelector('#f_err').textContent = e.message; }
      };
    });
  });
}
window.__openPlanForm = openForm;
