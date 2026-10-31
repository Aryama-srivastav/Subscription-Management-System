export function renderTable(container, { columns, rows, empty = 'No records.', onRowClick } = {}) {
  if (!rows || rows.length === 0) {
    container.innerHTML = `<div class="empty">${empty}</div>`;
    return;
  }
  const head = columns.map(c => `<th>${c.label}</th>`).join('');
  const body = rows.map(r => {
    const cells = columns.map(c => `<td>${c.render ? c.render(r) : (r[c.key] ?? '')}</td>`).join('');
    return `<tr data-id="${r.id ?? ''}" style="${onRowClick?'cursor:pointer':''}">${cells}</tr>`;
  }).join('');
  container.innerHTML = `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  if (onRowClick) {
    container.querySelectorAll('tbody tr').forEach(tr => {
      tr.addEventListener('click', () => onRowClick(tr.dataset.id));
    });
  }
}

export function renderPagination(container, { page, pageSize, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  container.innerHTML = `
    <div class="pagination">
      <span class="muted">Page ${page} of ${totalPages} (${total} total)</span>
      <button class="btn btn-sm" data-prev ${page<=1?'disabled':''}>Prev</button>
      <button class="btn btn-sm" data-next ${page>=totalPages?'disabled':''}>Next</button>
    </div>`;
  container.querySelector('[data-prev]').onclick = () => { if (page>1) onPage(page-1); };
  container.querySelector('[data-next]').onclick = () => { if (page<totalPages) onPage(page+1); };
}
