const routes = {};
let currentCleanup = null;

export function register(path, render) { routes[path] = render; }

export function navigate(path) {
  if (location.hash.replace('#','') !== path) location.hash = path;
  else resolve();
}

function match(path) {
  // support /resource/:id
  for (const key of Object.keys(routes)) {
    if (!key.includes(':')) {
      if (key === path) return { handler: routes[key], params: {} };
      continue;
    }
    const keyParts = key.split('/');
    const pathParts = path.split('/');
    if (keyParts.length !== pathParts.length) continue;
    const params = {};
    let ok = true;
    for (let i=0;i<keyParts.length;i++) {
      if (keyParts[i].startsWith(':')) params[keyParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      else if (keyParts[i] !== pathParts[i]) { ok=false; break; }
    }
    if (ok) return { handler: routes[key], params };
  }
  return null;
}

export function resolve() {
  const path = location.hash.replace('#','') || '/dashboard';
  const m = match(path);
  const app = document.getElementById('app');
  if (currentCleanup) { try { currentCleanup(); } catch(e){} currentCleanup=null; }
  if (!m) { app.innerHTML = '<div class="page"><h1>404</h1><p>Page not found.</p></div>'; return; }
  const res = m.handler(m.params);
  if (res && typeof res.cleanup === 'function') currentCleanup = res.cleanup;
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}
