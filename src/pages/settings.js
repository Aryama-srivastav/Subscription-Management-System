import { Taxes } from '../services/plans.js';
import { toast } from '../ui.js';
import { renderTable } from '../components/table.js';
import { isAdmin } from '../layout/shell.js';

export function render() {
  const html = `
    <div class="page">
      <h1>Settings</h1>
      <div class="card">
        <div class="between"><h2>Taxes</h2>
          ${isAdmin() ? '<button class="btn btn-primary btn-sm" id="newTax">+ Add tax</button>' : ''}
        </div>
        <div id="taxTable"></div>
      </div>
    </div>`;
  return { html, mount };
}

function mount() {
  const reload = async () => {
    const rows = await Taxes.list();
    renderTable(document.getElementById('taxTable'), {
      columns: [
        { key:'name', label:'Name' },
        { key:'rate_percent', label:'Rate %' },
        { key:'is_active', label:'Active', render: r => r.is_active ? 'Yes' : 'No' },
      ],
      rows, empty:'No taxes yet.',
      onRowClick: (id) => {
        const t = rows.find(x=>x.id===id);
        openTax(t, reload);
      }
    });
  };
  if (isAdmin()) document.getElementById('newTax').onclick = () => openTax(null, reload);
  reload();
}

function openTax(existing, reload) {
  import('../ui.js').then(({ showModal }) => {
    const p = existing || {};
    const { close } = showModal(`
      <h2>${existing?'Edit':'New'} tax</h2>
      <div class="form-group"><label>Name</label><input id="f_name" value="${p.name||''}" /></div>
      <div class="form-group"><label>Rate %</label><input id="f_rate" type="number" step="0.01" value="${p.rate_percent||0}" /></div>
      <div class="form-group"><label><input type="checkbox" id="f_active" ${p.is_active!==false?'checked':''} /> Active</label></div>
      <div class="modal-actions"><button class="btn" data-cancel>Cancel</button><button class="btn btn-primary" data-save>Save</button></div>
      <div id="f_err" class="error-text"></div>
    `, (b) => {
      b.querySelector('[data-cancel]').onclick = () => close();
      b.querySelector('[data-save]').onclick = async () => {
        const payload = {
          name: b.querySelector('#f_name').value.trim(),
          rate_percent: Number(b.querySelector('#f_rate').value),
          is_active: b.querySelector('#f_active').checked,
        };
        try {
          if (existing) await Taxes.update(existing.id, payload);
          else await Taxes.create(payload);
          toast('Saved'); close(); reload();
        } catch (e) { b.querySelector('#f_err').textContent = e.message; }
      };
    });
  });
}
