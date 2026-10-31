export function toast(message, type = 'success', duration = 3000) {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

export function showModal(html, onMount) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(backdrop);
  if (onMount) onMount(backdrop);
  function close() { backdrop.remove(); }
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  return { close, backdrop };
}

export function confirmDialog(message) {
  return new Promise((resolve) => {
    const { close, backdrop } = showModal(
      `<h2>Confirm</h2><p>${message}</p><div class="modal-actions"><button class="btn" data-cancel>Cancel</button><button class="btn btn-danger" data-ok>Confirm</button></div>`,
      (b) => {
        b.querySelector('[data-cancel]').onclick = () => { close(); resolve(false); };
        b.querySelector('[data-ok]').onclick = () => { close(); resolve(true); };
      }
    );
  });
}
